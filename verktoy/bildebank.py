"""
Bygger nettstedet til plakatgeneratoren, med bildebank.

Kjøres automatisk av GitHub Actions ved hver opplasting (se .github/workflows/publiser.yml).

- Leser alle bilder i mappen  bilder/  (jpg, jpeg, png, webp).
- Lager en nettversjon (maks 2600 px, god nok for A4-trykk) og en miniatyr (480 px).
- Leser valgfri tilleggsinfo fra  bilder/bildeinfo.csv  (beskrivelse, fotograf, utløpsdato, utsnitt).
- Skriver alt til mappen  _site/  som publiseres. Originalbildene publiseres IKKE på nettsiden.

Kjøre lokalt:  python verktoy/bildebank.py
"""
import csv, json, re, shutil, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from ikoner import rydd, navn_fra_fil
from pathlib import Path
from PIL import Image, ImageOps

ROT = Path(__file__).resolve().parent.parent
KILDE = ROT / 'bilder'
SITE = ROT / '_site'
WEB_MAKS, MINI_MAKS = 2600, 480
TYPER = {'.jpg', '.jpeg', '.png', '.webp'}
IKKE_PUBLISER = {'.git', '.github', 'verktoy', 'bilder', 'ikoner', '_site'}
IKONKILDE = ROT / 'ikoner'


def lag_id(navn: str) -> str:
    s = navn.lower().replace('æ', 'ae').replace('ø', 'o').replace('å', 'a')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-') or 'bilde'


def les_info() -> dict:
    """bildeinfo.csv: fil;beskrivelse;fotograf;utloper;fokus_x;fokus_y  (semikolon eller komma)"""
    f = KILDE / 'bildeinfo.csv'
    if not f.exists():
        return {}
    tekst = f.read_text(encoding='utf-8-sig')
    skille = ';' if tekst.count(';') >= tekst.count(',') else ','
    info = {}
    for rad in csv.DictReader(tekst.splitlines(), delimiter=skille):
        rad = {(k or '').strip().lower(): (v or '').strip() for k, v in rad.items()}
        if rad.get('fil'):
            info[Path(rad['fil']).stem.lower()] = rad
    return info


def tall(v, std):
    try:
        return max(0, min(100, int(float(v))))
    except (TypeError, ValueError):
        return std


def main():
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir()
    # 1) Kopier selve nettstedet (index.html m.m.)
    for p in ROT.iterdir():
        if p.name in IKKE_PUBLISER or p.name.startswith('.'):
            continue
        (shutil.copytree if p.is_dir() else shutil.copy2)(p, SITE / p.name)

    # 2) Bildebanken
    web, mini = SITE / 'bilder' / 'web', SITE / 'bilder' / 'mini'
    web.mkdir(parents=True); mini.mkdir(parents=True)
    info = les_info()
    liste, brukte_id = [], set()
    filer = sorted(p for p in KILDE.glob('*') if p.suffix.lower() in TYPER) if KILDE.exists() else []
    for f in filer:
        try:
            im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
        except Exception as e:
            print(f'Hopper over {f.name}: {e}', file=sys.stderr)
            continue
        bid = lag_id(f.stem)
        while bid in brukte_id:
            bid += '-2'
        brukte_id.add(bid)
        stor = im.copy(); stor.thumbnail((WEB_MAKS, WEB_MAKS), Image.LANCZOS)
        stor.save(web / f'{bid}.jpg', quality=85, optimize=True, progressive=True)
        liten = im.copy(); liten.thumbnail((MINI_MAKS, MINI_MAKS), Image.LANCZOS)
        liten.save(mini / f'{bid}.jpg', quality=78, optimize=True, progressive=True)
        i = info.get(f.stem.lower(), {})
        liste.append({
            'id': bid,
            'fil': f'bilder/web/{bid}.jpg',
            'mini': f'bilder/mini/{bid}.jpg',
            'w': stor.width, 'h': stor.height,
            'beskrivelse': i.get('beskrivelse', ''),
            'fotograf': i.get('fotograf', ''),
            'utloper': i.get('utloper', ''),
            'fx': tall(i.get('fokus_x'), 50),
            'fy': tall(i.get('fokus_y'), 45),
        })
        print(f'{f.name} -> {bid} ({stor.width}x{stor.height})')
    (SITE / 'bilder' / 'bilder.json').write_text(json.dumps(liste, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'Bildebank: {len(liste)} bilder')

    # 3) Ikonbiblioteket: ikoner/*.svg -> _site/ikoner/ikoner.json (ryddet, kan farges om)
    (SITE / 'ikoner').mkdir()
    ekstra = {}
    f = IKONKILDE / 'ikoninfo.csv'
    if f.exists():
        tekst = f.read_text(encoding='utf-8-sig')
        skille = ';' if tekst.count(';') >= tekst.count(',') else ','
        for rad in csv.DictReader(tekst.splitlines(), delimiter=skille):
            rad = {(k or '').strip().lower(): (v or '').strip() for k, v in rad.items()}
            if rad.get('fil'):
                ekstra[Path(rad['fil']).stem.lower()] = rad
    ikoner, brukt = [], set()
    for f in sorted(IKONKILDE.glob('*.svg')) if IKONKILDE.exists() else []:
        try:
            svg = rydd(f.read_text(encoding='utf-8'))
        except Exception as e:
            print(f'Hopper over {f.name}: {e}', file=sys.stderr); continue
        iid = lag_id(f.stem)
        while iid in brukt: iid += '-2'
        brukt.add(iid)
        navn, kat = navn_fra_fil(f.stem)
        e = ekstra.get(f.stem.lower(), {})
        ikoner.append({'id': iid, 'navn': e.get('navn') or navn, 'kategori': kat, 'sokeord': e.get('sokeord', ''), 'svg': svg})
    (SITE / 'ikoner' / 'ikoner.json').write_text(json.dumps(ikoner, ensure_ascii=False), encoding='utf-8')
    print(f'Ikonbibliotek: {len(ikoner)} ikoner')


if __name__ == '__main__':
    main()
