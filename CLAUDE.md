# CLAUDE.md – Plakatgenerator (tonsbergloftet/plakater)

Les hele denne fila før du endrer noe i repoet.

## 1. To versjoner i samme repo

| | Produksjon (prod) | Testversjon (staging) |
|---|---|---|
| Mappe | roten: `index.html` | `staging/` |
| Nettadresse | `…github.io/plakater/` | `…github.io/plakater/staging/` |
| Hvem bruker den | alle ansatte | bare oss som tester |
| Kjennetegn | ingen banner | gult banner «TESTVERSJON» øverst |

GitHub Pages publiserer begge mappene hver gang noe lastes opp til `main`.

## 2. Regler – hva skal hvor

**Alt nytt arbeid gjøres i `staging/`.** Dette gjelder både ryddingen og nye funksjoner.

**Rot-`index.html` (prod) skal bare endres i to tilfeller:**
1. **Kritisk feilretting** når prod er ødelagt for brukerne og det ikke kan vente. Rett feilen i både prod og `staging/`, i samme runde.
2. **Opprykk**, når en godkjent testversjon skal bli prod. Følg sjekklista i punkt 5.

Ikke rør disse uten at Marius ber om det, fordi de styrer både prod og staging:
- `.github/workflows/`
- `verktoy/`
- `bilder/`
- `ikoner/`

Unntak: når en ny mal er godkjent, skal den legges inn i lista `VIS` øverst i `verktoy/sammenlign.js` (se punkt 8).

Ikke slett eller endre taggen `v1-for-rydding` eller grenen `stabil-v1`. De er reservekopien.

Claude skal alltid si tydelig i svaret hvilke filer som er endret, og om de ligger i prod eller staging.

Claude pusher aldri direkte til main. Alle endringer leveres som pull request fra en egen gren. Marius merger.

## 3. Ting som ikke kan endres

- **Arbeidsfila må virke begge veier.** En PDF eller JSON lagret i prod må kunne åpnes i staging, og omvendt. Malnøklene (`TPLS`), feltnavnene og `/TkPlakat`-formatet i PDF-en skal derfor være like.
- **Ingen byggesteg.** Filene i repoet er kildekoden og publiseres slik de ligger, med vanlige `<script src>` og `<link>`. Ingen npm, ingen bundler og ingen `build.py`.
- **Staging må ikke forstyrre prod i nettleseren.** I staging skal alle `localStorage`-nøkler ha prefikset `staging-`, og banneret «TESTVERSJON» skal vises.
- **Bildebanken og ikonene leses fra rota.** Staging bruker `../bilder/bilder.json` og `../ikoner/ikoner.json` via konstanten `RESSURS_ROT` øverst i `staging/js/oppsett.js`. Ved opprykk endres bare denne ene linja.

## 4. Test før hver opplasting til staging

Kjør først regelsjekken: `node verktoy/sjekk-regler.js` (og `--prod` ved opprykk). Den trenger bare Node og sjekker designreglene og at malene henger sammen. Den skal være grønn.

Kjør deretter sammenligningstesten `verktoy/sammenlign.js` (Playwright). Den skal vise:
1. Alle maler i alle formater blir piksellike med prod, med demotekst og eksempelbilde. Tillatt avvik er under 0,5 % av pikslene.
2. Eksport til PDF og PNG fungerer, og fontene er med i PDF-en.
3. En arbeidsfil fra prod kan åpnes i staging.
4. Konsollen viser ingen feil.

Hvis noe avviker, skal det forklares. Det skal ikke lastes opp før det er forklart.

Kjente fallgruver:
- Blandingsmoduser (blend modes) og SVG-masker overlever ikke eksporten.
- Kopiering til utklippstavlen virker ikke når fila åpnes fra disk (file://).
- Staging kan ikke eksportere når den åpnes fra disk (file://), fordi html-to-image må hente fontfilene, og det stopper nettleseren. Over nettet virker det. Godkjent av Marius 24.11.2026.
- Forhåndsvisningen er følsom for hvor plakaten står på skjermen. Testen legger derfor inn en tom stripe i prod, like høy som banneret (28 px). Endres banneret, må testen endres også.

## 5. Opprykk fra staging til prod (sjekkliste)

Opprykket leveres som en egen pull request, ikke sammen med andre endringer.

1. Lag en ny tagg av dagens prod, for eksempel `v2-for-opprykk`, under Releases → Draft a new release.
2. Kopier innholdet i `staging/` til rota, slik at det erstatter `index.html` og legger til de nye mappene.
3. I rotkopien: sett `RESSURS_ROT` og `LS_PREFIKS` til `''` (øverst i `js/oppsett.js`), og fjern banneret «TESTVERSJON» (`<div class="testbanner">` i `index.html` og regelen `.testbanner` i `css/ui.css`).
4. Kjør `node verktoy/sjekk-regler.js --prod` og sammenligningstesten på nytt, nå mellom den nye prod og staging.
5. Last opp, og sjekk prod på nettet: lag én plakat, eksporter den og åpne en gammel arbeidsfil.
6. Behold `staging/` som utgangspunkt for neste runde.

## 6. Hvis prod er ødelagt: gå tilbake

**Førstevalg:** Angre pull requesten som ødela prod. Åpne den mergede PR-en i GitHub og trykk **Revert**. Det lager en ny PR som fjerner endringene. Merge den, så publiserer Pages på nytt.

**Reserveløsning** (hvis Revert ikke går, eller feilen ikke kom fra én PR):

1. Gå til grenen `stabil-v1`, eller den siste taggen, og last ned `index.html`.
2. Last den opp til rota på `main`, slik at den erstatter den ødelagte. Pages publiserer på nytt i løpet av et par minutter.
3. Har opprykket lagt til mapper i rota, for eksempel `css/` eller `js/`, kan de ligge, fordi den gamle `index.html` ikke bruker dem.

## 7. Mappestruktur (mål etter ryddingen)

```
index.html              prod
CLAUDE.md               denne fila
AGENTS.md               peker andre KI-verktøy hit
README.md
docs/designregler.md    designreglene for malene
.claude/skills/ny-mal/  oppskrift for nye og rettede maler
.github/workflows/      publisering (ikke rør)
verktoy/                bildebank.py, sammenlign.js, sjekk-regler.js
bilder/  ikoner/        bildebank og ikoner (felles for prod og staging)
staging/
  index.html            bare HTML-skjelett
  css/                  stiler: fonter.css, ui.css, plakat.css (lastes i den rekkefølgen)
  js/                   kode, lastes i denne rekkefølgen (vanlige skript som deler globale navn):
                        oppsett, ikoner-reserve, maler, ki, tegning, kvalitet, redigering, eksport, bildebank, start
                        ikoner-reserve.js er en reserveliste som bare brukes til ikoner/ikoner.json er lastet
                        start.js kjører når siden er lastet og må alltid være sist
                        bølgene tegnes av koden for hver mal og hører hjemme i js/maler.js, ikke i grafikk/
  fonter/               Barlow, Square Peg (woff2)
  grafikk/              logo, eksempelbilder
  lib/                  html-to-image, jsPDF, qrcode-generator
```

## 8. Nye maler og designregler

- Designreglene står i `docs/designregler.md`. Oppdater fila når designeren avklarer noe eller leverer nye regler.
- Nye maler, og rettinger av maler, lages etter oppskriften i `.claude/skills/ny-mal/SKILL.md`.
- Malene settes sammen av låste byggeklosser (ramme, logo, bølgepar, QR) med mål fra designerens IDML-filer. De tegnes aldri på nytt.
- Unntak fra regelsjekken (en ny godkjent farge, for eksempel) legges inn øverst i `verktoy/sjekk-regler.js` med en kommentar om hvem som godkjente det og hvorfor.
