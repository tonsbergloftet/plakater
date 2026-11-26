---
name: ny-mal
description: Lag en ny plakatmal i plakatgeneratoren (eller endre en eksisterende) etter Tønsberg kommunes designregler, fra designerens InDesign-fil eller som forslag. Bruk når noen vil legge til, måle opp, rette eller foreslå en mal.
---

# Ny plakatmal

Denne oppskriften gjelder både for mennesker og KI-assistenter. Les `CLAUDE.md` (reglene for repoet) og `docs/designregler.md` (designreglene) før du begynner.

Grunnregelen: **malene settes sammen av låste byggeklosser med faste mål.** Ramme, logo, bølgepar og QR tegnes aldri på nytt. En mal bestemmer bare hvor tekst og bilder ligger, og velger blant alternativene i designreglene.

## 0. Hva slags oppdrag er det?

| Situasjon | Hva du gjør |
|---|---|
| **Designeren har levert IDML + PDF** | Mål opp fra IDML-fila (steg 2–6). Dette er normalen. |
| **Rette en eksisterende mal** (designeren har levert ny versjon) | Som over, men endre den eksisterende `LAYOUTS`-funksjonen. Malnøkkelen og feltene beholdes. |
| **Forslag uten designerfil** | Bygg bare av låste byggeklosser, og legg malen **ikke** inn i `GRUPPER` (den vises ikke). Skriv «Forslag, ikke godkjent av designer» i kommentaren over malen og i PR-en. |

Har du verken designerfil eller tydelig bestilling, spør før du bygger.

## 1. Finn nærmeste mal å ta utgangspunkt i

Kopier alltid fra en av de målte malene, aldri fra de gamle (`forklaring`, `delt`, `tekst`, `bilder`, `bildetekst`).

| Mal (nøkkel) | Kjennetegn | God start for |
|---|---|---|
| `tekstplakat` | lys grå flate, bølgepar nederst, én tekstspalte, ikon, QR | tekstmaler |
| `hoydebilde` | høyt bilde til venstre, tekst til høyre | bilde + tekst side om side |
| `trebilder` | tekst til venstre, tre bilder med skrå kanter | flere bilder |
| `inndelt` | bilde øverst, tittel i blått felt, to spalter | bilde + mye tekst |
| `bildedrevet` | helsidebilde med vask, lys/mørk variant | bilde som hovedsak |
| `forside` | illustrasjon og tittel | forsider |
| `invitasjon` | gult merke, praktisk info | arrangementer |
| `infoskjerm`, `infoskjerm2` | 16:9 | skjermer |
| `bymobel` | 9:16, tre bilder | bymøbelskjermene |

## 2. Mål opp fra IDML

- Pakk ut IDML-fila (det er en zip) og les `Spreads/*.xml`. Der står posisjon, størrelse og stier for hvert element.
- Regn om: A4 1 pt = 4/3 px. Skjerm px = pt × 2/3. Bymøbel px = pt × 1/3 (se tabellen i designreglene).
- Sjekk at ramme, logo, bølgepar og QR har samme mål som i designreglene. Avviker de, er det enten en feil i designerfila eller en ny regel: **spør designeren, ikke gjett.** Skriv avviket i PR-en.
- Er bølgeparet det samme som `FS8`, bruk `FS8` med `translate(0, y)`. Er det en ny form, legg den inn som en ny konstant (som `INV7`, `BYM9`, `SKJ`) med en kommentar om hvilken fil den er hentet fra.

## 3. Legg inn malen (alt i `staging/`)

Alt nytt arbeid gjøres i `staging/`. Prod (rota) røres ikke.

1. **`staging/js/oppsett.js` → `TPLS`:** ny nøkkel med `navn`, `sub`, `bilder` (0–3), `felt` og eventuelt `fmts` og `mork`.
   - Nøkkelen er små bokstaver uten æøå og **kan aldri endres senere**, fordi den står i brukernes lagrede arbeidsfiler.
   - Bruk eksisterende feltnavn (`stikk`, `tittel`, `ingress`, `ut1`, `tx1`, `ut2`, `tx2`, `ut3`, `tx3`, `pTittel`, `pIntro`, `punkter`, `praktisk`, `cta`, `url`, `avslutt`, `merke`). Da følger teksten med når brukeren bytter mal. Nye felt trenger eksempeltekst i `DEMO` (oppsett.js) og hjelpetekst i `PH` (maler.js).
2. **`staging/js/maler.js` → `LAYOUTS.nøkkel = (uid, f) => { … }`:**
   - Kommentar over funksjonen: nummer, navn og hvilken IDML-fil den er målt fra.
   - Bakgrunnen er én `<svg class="bg">` med ramme/panel (`rrect`), bilde (`imageIn`), bølgepar (`FS8.gronn` med slørovergang + `FS8.navy`) og logoutsparing (`FS8.hvit` + `FS8.hale`).
   - Tekst legges i `box(x, y, b, h, grunnstørrelse, 'prefiks', …)` med `E('felt', 'klasse')`.
   - Logo med `logo(x, y, bredde)`, QR med `qrSvg()` i `qrbox7`, ikon med `ikonHer(...)`, KI-merke når `S.ki`.
   - Slørfargen hentes fra `SLOR[S.slor].c`. Skriv aldri en farge fast.
3. **`staging/css/plakat.css`:** egne regler med et kort prefiks for malen (for eksempel `.ny12`). Alle størrelser i `em`. Typografien følger rollene i designreglene.
4. **Når malen er godkjent av designeren:**
   - legg nøkkelen i riktig gruppe i `GRUPPER` (oppsett.js)
   - legg den i `VIS` øverst i `verktoy/sammenlign.js` (dette er det ene unntaket fra regelen om å ikke røre `verktoy/`)
5. **Ved behov:** maks tegn per felt i `KI_LENGDE` (`js/ki.js`) hvis feltene er mindre enn vanlig, og forklaringstekst i `IKON_TXT` (`js/redigering.js`) hvis malen har ikon.
6. **Erstatter malen en gammel?** Ikke slett den gamle. Legg den inn i `ERSTATTET` (gammel → ny), så gamle arbeidsfiler åpnes i den nye.

## 4. Sjekk

1. `node verktoy/sjekk-regler.js` skal være grønn. Feiler den på noe designeren har godkjent, legg unntaket inn øverst i skriptet med en kommentar om hvorfor.
2. Åpne `staging/index.html` via en lokal server (`python -m http.server` i rota), velg malen og sjekk:
   - lang og kort tekst, tomme felt, med og uten QR og ikon, alle slørfarger, mørk variant hvis den finnes
   - at teksten aldri går utenfor boksen (generatoren viser rød stiplet ramme)
   - kontrast for all tekst mot faktisk bakgrunn
3. Eksporter PDF og PNG. Legg PNG-en oppå designerens PDF med 50 % gjennomsiktighet. Avvik skal være under 0,5 mm (ca. 2 px på A4).
4. Kjør sammenligningstesten (`CLAUDE.md`, punkt 4). Den tester bare maler som finnes i prod, så den viser at du ikke har ødelagt de andre malene. Den nye malen sjekkes i steg 2–3.

## 5. Lever

- Egen gren og pull request mot `main`. Aldri push direkte.
- I PR-en: hvilke filer som er endret (alle i `staging/`, pluss eventuelt `VIS` i `verktoy/sammenlign.js`), hvilken IDML-fil malen er målt fra, avvik fra designreglene, og skjermbilde av malen.
- Fører arbeidet til nye eller endrede regler, oppdater `docs/designregler.md` i samme PR.

## Ikke gjør dette

- Ikke tegn ramme, logo, utsparing eller bølge på nytt, og ikke strekk bølgeparet.
- Ikke bruk `waveLayers`, `slorFill`, `wavePath` eller `G.a4.logo`. De hører til de gamle malene.
- Ikke bruk CSS-blandingsmoduser eller SVG-masker. De overlever ikke eksporten. Bruk SVG-filtre (se `blaskjaer`) eller gjennomsiktighet.
- Ikke endre eller slett malnøkler eller feltnavn som finnes, og ikke fjern maler fra `TPLS`.
- Ikke legg til npm-pakker eller byggesteg.
