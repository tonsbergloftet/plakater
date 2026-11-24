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

Ikke slett eller endre taggen `v1-for-rydding` eller grenen `stabil-v1`. De er reservekopien.

Claude skal alltid si tydelig i svaret hvilke filer som er endret, og om de ligger i prod eller staging.

## 3. Ting som ikke kan endres

- **Arbeidsfila må virke begge veier.** En PDF eller JSON lagret i prod må kunne åpnes i staging, og omvendt. Malnøklene (`TPLS`), feltnavnene og `/TkPlakat`-formatet i PDF-en skal derfor være like.
- **Ingen byggesteg.** Filene i repoet er kildekoden og publiseres slik de ligger, med vanlige `<script src>` og `<link>`. Ingen npm, ingen bundler og ingen `build.py`.
- **Staging må ikke forstyrre prod i nettleseren.** I staging skal alle `localStorage`-nøkler ha prefikset `staging-`, og banneret «TESTVERSJON» skal vises.
- **Bildebanken og ikonene leses fra rota.** Staging bruker `../bilder/bilder.json` og `../ikoner/ikoner.json` via konstanten `RESSURS_ROT`. Ved opprykk endres bare denne ene linja.

## 4. Test før hver opplasting til staging

Kjør sammenligningstesten `verktoy/sammenlign.js` (Playwright). Den skal vise:
1. Alle maler i alle formater blir piksellike med prod, med demotekst og eksempelbilde. Tillatt avvik er under 0,5 % av pikslene.
2. Eksport til PDF og PNG fungerer, og fontene er med i PDF-en.
3. En arbeidsfil fra prod kan åpnes i staging.
4. Konsollen viser ingen feil.

Hvis noe avviker, skal det forklares. Det skal ikke lastes opp før det er forklart.

## 5. Opprykk fra staging til prod (sjekkliste)

1. Lag en ny tagg av dagens prod, for eksempel `v2-for-opprykk`, under Releases → Draft a new release.
2. Kopier innholdet i `staging/` til rota, slik at det erstatter `index.html` og legger til de nye mappene.
3. I rotkopien: sett `RESSURS_ROT` til `''`, fjern banneret «TESTVERSJON» og fjern prefikset `staging-`.
4. Kjør sammenligningstesten på nytt, nå mellom den nye prod og staging.
5. Last opp, og sjekk prod på nettet: lag én plakat, eksporter den og åpne en gammel arbeidsfil.
6. Behold `staging/` som utgangspunkt for neste runde.

## 6. Hvis prod er ødelagt: gå tilbake

1. Gå til grenen `stabil-v1`, eller den siste taggen, og last ned `index.html`.
2. Last den opp til rota på `main`, slik at den erstatter den ødelagte. Pages publiserer på nytt i løpet av et par minutter.
3. Har opprykket lagt til mapper i rota, for eksempel `css/` eller `js/`, kan de ligge, fordi den gamle `index.html` ikke bruker dem.

## 7. Mappestruktur (mål etter ryddingen)

```
index.html              prod
CLAUDE.md               denne fila
README.md
.github/workflows/      publisering (ikke rør)
verktoy/                bildebank.py, sammenlign.js
bilder/  ikoner/        bildebank og ikoner (felles for prod og staging)
staging/
  index.html            bare HTML-skjelett
  css/                  stiler
  js/                   kode, delt etter område (maler, redigering, eksport, kvalitet, ki, start)
  fonter/               Barlow, Square Peg (woff2)
  grafikk/              logo, bølger, eksempelbilder
  lib/                  html-to-image, jsPDF, qrcode-generator
```
