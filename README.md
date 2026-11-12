# Plakatgenerator – Tønsberg kommune

Lag plakater (A4) og skjermversjoner (16:9) etter kommunens grafiske profil.

## Slik brukes generatoren

- **Tekst skrives rett i plakaten.** Klikk på en tekst for å endre den. Tomme felt vises med grå hjelpetekst og kommer ikke med på den ferdige plakaten.
- **Klikk på bildet i plakaten** for å komme til bildevalget (bildebanken eller eget bilde).
- **Sidepanelet** brukes til mal, format, bilde, farge, QR-kode og nedlasting. Alle tekstfeltene finnes også nederst i sidepanelet.
- Knappen **«Slik virker det»** over plakaten viser en kort forklaring.
- Skriv `**ord**` for å utheve ord med farge i brødtekst.

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

## Ikoner

Last opp SVG-filene til mappen `ikoner/`. Publiseringen rydder dem automatisk:
Illustrators redigeringsdata fjernes (filene blir 5–10 ganger mindre), og ikonene gjøres om så de kan farges etter bakgrunnen.

- Navnet i ikonbiblioteket lages fra filnavnet: `app_avfall.svg` blir «Avfall» i kategorien «App», `rent-vann.svg` blir «Rent vann».
- Ikonene bør være tegnet i én farge (profilblått). Hvitt brukes som utsparing og følger bakgrunnen.
- Søkeord (valgfritt) legges i `ikoner/ikoninfo.csv`: kolonnene `fil;navn;sokeord`, f.eks. `app_avfall.svg;Avfall;søppel renovasjon`.

Ikonene brukes i mal 4 (øverst til høyre), mal 7 (i det gule merket) og mal 8 (i stedet for bildet). Klikk på ikonet i plakaten for å bytte det.

## Rullering

For at de samme bildene ikke skal brukes hele tiden:

- Hver måned «hviler» omtrent en tredjedel av bildene (gjelder når banken har minst 9 bilder). De kommer tilbake måneden etter.
- Rekkefølgen stokkes på nytt hver dag.
- Hver bruker ser merket «Du brukte dette …» på bilder de selv har lastet ned plakater med (lagres bare i egen nettleser).

Hvilende bilder kan likevel hentes fram via lenken nederst i bildebanken.

## Merk

- Siden er offentlig. Bilder i `bilder/` må være klarert for publisering.
- Originalbildene ligger i repoet, men bare nedskalerte kopier publiseres på nettsiden.
- Åpnes `index.html` direkte fra disk, virker alt unntatt bildebanken.
