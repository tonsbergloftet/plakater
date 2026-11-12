"""
Rydder SVG-ikoner fra Illustrator slik at de kan brukes i plakatgeneratoren.

- Fjerner Illustrators interne redigeringsdata (metadata), som er det meste av filstørrelsen.
- Gjør <style>-klassene (.st0, .st1 …) om til faste egenskaper på hvert element,
  så flere ikoner på samme side ikke ødelegger hverandres stiler.
- Gjør profilblått og de mørke gråtonene om til currentColor, så ikonet kan farges om.
- Hvitt (brukt som «utsparing») blir var(--ikbg), som settes til bakgrunnsfargen der ikonet står.
"""
import re

MORK = re.compile(r'#(003b53|013952|333333|333|1d1d1d|262626|000000|000)\b', re.I)
HVIT = re.compile(r'#(ffffff|fff)\b', re.I)


def _farge(v):
    v = MORK.sub('currentColor', v)
    return HVIT.sub('var(--ikbg,#fff)', v)


def rydd(s: str) -> str:
    s = re.sub(r'<\?xml[^>]*>\s*', '', s)
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    s = re.sub(r'<metadata.*?</metadata>', '', s, flags=re.S)
    # Klassestiler -> regler per klasse, i den rekkefølgen de står
    regler = {}
    for st in re.findall(r'<style[^>]*>(.*?)</style>', s, flags=re.S):
        for sel, body in re.findall(r'([^{}]+)\{([^}]*)\}', st):
            props = [p.strip() for p in body.split(';') if ':' in p]
            for k in re.findall(r'\.([\w-]+)', sel):
                regler.setdefault(k, []).extend(props)
    s = re.sub(r'<defs>\s*<style[^>]*>.*?</style>\s*</defs>', '', s, flags=re.S)
    s = re.sub(r'<style[^>]*>.*?</style>', '', s, flags=re.S)

    def klasse(m):
        props = []
        for k in m.group(1).split():
            props += regler.get(k, [])
        merged = {}
        for p in props:
            a, b = p.split(':', 1)
            merged[a.strip()] = b.strip()
        return ' style="' + ';'.join(f'{a}:{_farge(b)}' for a, b in merged.items()) + '"' if merged else ''
    s = re.sub(r'\sclass="([^"]*)"', klasse, s)
    s = re.sub(r'\s(fill|stroke)="([^"]*)"', lambda m: f' {m.group(1)}="{_farge(m.group(2))}"', s)
    s = re.sub(r'\s(xmlns:i|id|version|data-name)="[^"]*"', '', s)
    s = re.sub(r'(\d+\.\d{3})\d+', r'\1', s)
    s = re.sub(r'>\s+<', '><', s).strip()
    # Elementer uten egen fyllfarge arver currentColor fra ikonet
    s = re.sub(r'<svg\b', '<svg fill="currentColor"', s, count=1)
    return s


def navn_fra_fil(stamme: str):
    deler = stamme.split('_', 1)
    kategori = ''
    if len(deler) == 2 and deler[0].lower() in ('app',):
        kategori, stamme = deler[0].capitalize(), deler[1]
    tekst = stamme.replace('_', ' ').replace('-', ' ').strip()
    return (tekst[:1].upper() + tekst[1:]), kategori
