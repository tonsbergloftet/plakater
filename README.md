# Plakatgenerator – Tønsberg kommune

Lag plakater (A4), skjermversjoner (16:9) og innhold til skjermene på bymøblene (9:16) etter kommunens grafiske profil.

## Slik brukes generatoren

- **Første gang** vises «Hva skal plakaten gjøre?»: lag en ny plakat (malene gruppert etter formål) eller åpne en PDF du har laget før. Knappen **«Alle maler»** over plakaten viser valget igjen. Malen kan byttes når som helst – teksten blir med.
- **Tekst skrives rett i plakaten.** Klikk på en tekst for å endre den. Eksempelteksten forteller hva som passer i feltet. Tomme felt vises med grå hjelpetekst og kommer ikke med på den ferdige plakaten.
- **Klikk på bildet** og velg «Bytt bilde» (bildebanken eller eget bilde) eller «Flytt og zoom» (dra i bildet og bruk zoomglideren).
- **Klikk på QR-koden** for å skrive inn nettsiden koden skal åpne.
- Nedlastingen varsler hvis plakaten fortsatt har eksempeltekst, eksempeladresse eller eksempelbilde.
- Generatoren sier fra over plakaten hvis teksten i Bildeplakat blir vanskelig å lese på bildet (med knapp for å bytte tekstfarge), eller hvis et bilde har for lav oppløsning. Når et nytt bilde legges inn i Bildeplakat, velges lys eller mørk tekst automatisk.
- **PDF-en er også arbeidsfil:** Åpne den under «Fortsett på en plakat» for å redigere videre. QR-koden er klikkbar i PDF-en.
- Skriv `**ord**` for å utheve ord med farge.

## Maler og formater

Hver mal har sitt faste format, så brukeren bare trenger å velge mal:

- Plakatene (Bildeplakat, Forside, Inndelt plakat, Høydebilde, Tre bilder, Tekstplakat, Invitasjon) er stående A4.
- Infoskjerm, Infoskjerm stort bilde og Invitasjon, stort bilde er liggende 16:9 og lastes ned i 1920 × 1080 px.
- Bymøbel er stående 9:16 for skjermene på bymøblene og lastes ned i 2160 × 3840 px.
- Bildeplakat og Bymøbel har en mørk variant (valg under «Slørfarge»).
- Skriv linjeskift i tittelen der du vil at linjen skal brytes.

## Innhold

| Fil / mappe | Hva det er |
|---|---|
| `index.html` | Selve generatoren. **Ikke rediger denne for hånd** – den er ferdigbygd. |
| `bilder/` | Bildebanken. Legg bilder her. |
| `bilder/bildeinfo.csv` | Valgfri tilleggsinfo om bildene. |
| `ikoner/` | Ikonbiblioteket. Legg SVG-ikoner her. |
| `ikoner/ikoninfo.csv` | Valgfrie visningsnavn og søkeord for ikonene. |
| `verktoy/bildebank.py` | Skript som gjør bilder og ikoner klare for nettsiden. Kjøres automatisk. |
| `verktoy/ikoner.py` | Rydder ikonene (brukes av skriptet over). |
| `.github/workflows/publiser.yml` | Automatisk publisering til GitHub Pages. |

## Oppsett (én gang)

1. Last opp alle filene til repoet (behold mappestrukturen, også `.github`).
2. Gå til **Settings → Pages** og velg **Source: GitHub Actions**.
3. Under **Actions** ser du jobben «Publiser plakatgenerator». Når den er grønn (1–2 min), er siden ute.

## Legge til bilder

Last opp bildene til mappen `bilder/`. Det er alt.
Publiseringen kjører automatisk, lager nettversjoner (maks 2600 px) og miniatyrer, og oppdaterer bildebanken.
Bruk helst bilder på minst 2500 px på lengste side, så de holder til trykk.

Fjerne et bilde: slett det fra `bilder/`.

## Tilleggsinfo (valgfritt) – `bilder/bildeinfo.csv`

Kan redigeres i Excel (lagre som CSV, semikolon). Én rad per bilde, bare filnavnet er påkrevd:

| Kolonne | Eksempel | Brukes til |
|---|---|---|
| `fil` | `AdobeStock_76053361.jpg` | Hvilket bilde raden gjelder |
| `beskrivelse` | `Forelder og barn ved brygga` | Vises i bildebanken og gjør bildet søkbart |
| `fotograf` | `Ola Nordmann` | Vises i bildebanken |
| `utloper` | `2027-12-31` | Bildet forsvinner automatisk etter denne datoen (bruksrett) |
| `fokus_x`, `fokus_y` | `50`, `40` | Standard utsnitt i prosent (0 = venstre/topp, 100 = høyre/bunn) |
| `standard` | `1` | Bildet vises når generatoren åpnes. Bruk `1`, `2` og `3` for bilde 1, 2 og 3. Uten merking brukes tilfeldige bilder fra banken |

## Ikoner

Last opp SVG-filene til mappen `ikoner/`. Publiseringen rydder dem automatisk:
Illustrators redigeringsdata fjernes (filene blir 5–10 ganger mindre), og ikonene gjøres om så de kan farges etter bakgrunnen.

- Navnet i ikonbiblioteket lages fra filnavnet: `app_avfall.svg` blir «Avfall» i kategorien «App», `rent-vann.svg` blir «Rent vann».
- Ikonene bør være tegnet i én farge (profilblått). Hvitt brukes som utsparing og følger bakgrunnen.
- Søkeord (valgfritt) legges i `ikoner/ikoninfo.csv`: kolonnene `fil;navn;sokeord`, f.eks. `app_avfall.svg;Avfall;søppel renovasjon`.

Ikonene brukes i Tekstplakat (øverst til høyre), Høydebilde (over teksten) og Invitasjon (i det gule merket). Klikk på ikonet i plakaten for å bytte det.

## Rullering

For at de samme bildene ikke skal brukes hele tiden:

- Hver måned «hviler» omtrent en tredjedel av bildene (gjelder når banken har minst 9 bilder). De kommer tilbake måneden etter.
- Rekkefølgen stokkes på nytt hver dag.
- Bilder merket i kolonnen `standard` vises alltid når generatoren åpnes, også i måneder der de ellers ville hvilt.
- Hver bruker ser merket «Du brukte dette …» på bilder de selv har lastet ned plakater med (lagres bare i egen nettleser).

Hvilende bilder kan likevel hentes fram via lenken nederst i bildebanken.

## Merk

- Siden er offentlig. Bilder i `bilder/` må være klarert for publisering.
- Originalbildene ligger i repoet, men bare nedskalerte kopier publiseres på nettsiden.
- Åpnes `index.html` direkte fra disk, virker alt unntatt bildebanken. Da starter plakaten uten bilde.
- Når noen laster opp et eget bilde, spør generatoren om bildet er KI-generert. Svarer de ja, merkes plakaten automatisk.

## For deg som videreutvikler generatoren

| Fil | Hva den er |
|---|---|
| `CLAUDE.md` | Reglene for repoet: prod og staging, testing, opprykk og hvordan man går tilbake. Les den først. |
| `docs/designregler.md` | Designreglene for plakatene, målt fra designerens InDesign-filer. |
| `.claude/skills/ny-mal/SKILL.md` | Oppskrift for å lage eller rette en mal. |
| `AGENTS.md` | Peker KI-verktøy (Copilot, Claude o.l.) til filene over. |
| `verktoy/sjekk-regler.js` | Regelsjekk: `node verktoy/sjekk-regler.js`. Kjøres før hver pull request. |
| `verktoy/sammenlign.js` | Sammenligner staging med prod piksel for piksel (Playwright). |

Kort fortalt: alt nytt arbeid gjøres i `staging/`, leveres som pull request, og regelsjekken og sammenligningstesten skal være grønne før merge.
