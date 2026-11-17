# Plakatgenerator – Tønsberg kommune

Lag plakater (A4), skjermversjoner (16:9) og innhold til skjermene på bymøblene (9:16) etter kommunens grafiske profil.

## Slik brukes generatoren

- **Tekst skrives rett i plakaten.** Klikk på en tekst for å endre den. Tomme felt vises med grå hjelpetekst og kommer ikke med på den ferdige plakaten.
- **Klikk på bildet i plakaten** for å komme til bildevalget (bildebanken eller eget bilde).
- **Sidepanelet** brukes til mal, format, bilde, farge, QR-kode og nedlasting. Alle tekstfeltene finnes også nederst i sidepanelet.
- Knappen **«Slik virker det»** over plakaten viser en kort forklaring.
- Skriv `**ord**` for å utheve ord med farge i brødtekst.

## Maler og formater

- Mal 1–8 og mal 10 lages som stående A4 eller liggende 16:9 (1920 × 1080).
- Mal 9 · Bymøbel er laget bare for skjermene på bymøblene: stående 9:16, lastes ned i 2160 × 3840 px.
- Mal 1 og mal 9 har en mørk variant (valg under «Slørfarge»): hvit tekst for mørke bilder i mal 1, mørk bunn i mal 9.
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

Ikonene brukes i mal 4 og mal 10 (øverst til høyre) og mal 7 (i det gule merket). Klikk på ikonet i plakaten for å bytte det.

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
