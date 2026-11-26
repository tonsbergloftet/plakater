# Designregler for plakatmalene

Reglene er målt fra designerens InDesign-filer (mal 1–10, IDML og PDF, november 2026) og Tønsberg kommunes grafiske profil.
Alle mål gjelder A4 stående (210 × 297 mm) hvis ikke annet står. Px er generatorens A4-størrelse (794 × 1123 px).

Reglene er delt i tre:
- **Låst:** skal være likt i alle maler. Tegnes med faste former og mål i koden, og malene kan ikke endre dem.
- **Valgfritt innenfor rammer:** malen velger selv, men bare blant disse alternativene.
- **Åpne spørsmål:** hull i designerens filer som designeren må avklare.

Det som kan sjekkes maskinelt, sjekkes av `node verktoy/sjekk-regler.js` (se nederst).

---

## Omregning fra InDesign

| Format | InDesign | Generatoren | Regel |
|---|---|---|---|
| A4 stående | 210 × 297 mm (595 × 842 pt) | 794 × 1123 px | 1 pt = 4/3 px, 1 mm = 3,78 px |
| A4 liggende | 297 × 210 mm (842 × 595 pt) | 1123 × 794 px | Som A4 stående. Ingen designerfil ennå (se under) |
| Infoskjerm 16:9 | 1920 × 1080 pt | 1280 × 720 px | px = pt × 2/3. Lastes ned i 1920 × 1080 |
| Bymøbel 9:16 | 2160 × 3840 pt | 720 × 1280 px | px = pt × 1/3. Lastes ned i 2160 × 3840 |

Mål alltid fra IDML-fila (eksakte koordinater og stier). PDF-en brukes til å legge malen oppå og sjekke resultatet.

---

## 1. Låste komponenter

### 1.1 Ramme og panel
| | mm | px |
|---|---|---|
| Hvit kant rundt panelet | 7,7 | 29 |
| Hjørneradius på panelet | 15 | 54,5–57 (se åpent spørsmål 6) |

- Rammen er hvit, og panelet er én hel flate innenfor den. I koden: `rrect(x0,y0,x1,y1,r)`.
- Utsparingen for logoen er en fast hvit form (`FS8.hvit` og `FS8.hale`). Den skal ikke tegnes på nytt.

### 1.2 Logo
| | mm | px |
|---|---|---|
| Bredde | 23,5 | 89 |
| Øvre venstre hjørne | x 23,1 · y 12,7 | 87,5 · 48,5 |

- Sort, stående logo uten visjon, alltid i utsparingen. I koden: `logo(x, y, bredde)`.
- Samme størrelse og plassering i alle A4-maler. Bymøbel og skjermer har egne mål fra sine IDML-filer.

### 1.3 Bølgeparet (slør + bølge)
Bølgen er **ett låst par med fast form** (`FS8.gronn` = sløret, `FS8.navy` = bølgen). Det er likt i alle de nye A4-malene.

- **Bølgen (foran):** T_mørkeblå `#013952`, 100 % dekning.
- **Sløret (bak):** slørfargen med 75 % dekning og myk overgang langs overkanten (lineær overgang til 0 %). Ligger alltid på samme sted i forhold til bølgen.
- **Tillatt:** flytte paret opp eller ned (`translate`), snu det 180°, bruke hvit bølge foran i stedet for mørkeblå, og skalere likt i begge retninger.
- **Ikke tillatt:** strekke eller presse paret, endre rotasjonen, gi sløret varierende gjennomsiktighet, eller vise mørk bølge uten slør.
- Skjermene og bymøbelet har sine egne målte bølgepar (`SKJ`, `BYM9`) med samme regler.

### 1.4 QR-kode
| | mm | px |
|---|---|---|
| Størrelse | 27,3 | 103 |
| Hjørneradius på hvit bakgrunn | 3 | 11 |
| Øvre venstre hjørne | x 166,2 · y 253,7 | 628 · 959 |

- Nederst til høyre, oppå den mørkeblå bølgen. I koden: `qrSvg()` i `<div class="qrbox7">`.
- Teksten ved siden av (`cta`): Barlow Italic, siste linje Bold Italic, hvit, høyrejustert og bunnjustert med QR-koden.

### 1.5 Farger
Bare fargene fra profilen:

| Navn | Verdi | Brukes til |
|---|---|---|
| T_mørkeblå | `#013952` | bølge, tekst på lys bakgrunn (`NAVY`) |
| T-grønn | `#C5DAAF` | slør, stikktittel på mørk bakgrunn |
| T_korall | `#E69D7D` | slør |
| T_gul | `#F1BE48` | slør, merke |
| T-lyseblå | `#91CEF2` | slør |
| T-grå | 15 % tone | lys bakgrunn (overgang `#fbfbfb` → `#e2e2e2`) |
| Sort | `#1d1d1b` | sort tekst, QR-kode |

Slørfargen velges av brukeren og brukes via `SLOR[S.slor].c` (i CSS: `var(--slor)`). Skriv aldri slørfargen fast i en mal.
Hjelpefarger (lyse og mørke varianter, plassholdere, overganger) står med begrunnelse i `verktoy/sjekk-regler.js`.

### 1.6 Typografi
**Barlow** i alle maler. **Square Peg** bare til korte håndskrevne kommentarer ved QR-koden på skjermene (klassen `.skript`).

| Rolle | Snitt | A4-størrelse | Annet |
|---|---|---|---|
| Stikktittel | Bold | 15 pt | VERSALER, sperring 0,3em |
| Hovedtittel | Bold (bildeplakat: Black Italic) | 34–40 pt | linjeavstand 1,0–1,1 |
| Undertittel / ingress | Italic | 18 pt | |
| Mellomtittel | Bold | 16 pt | |
| Brødtekst | Regular | 15 pt (bred spalte) / 12 pt (smal spalte) | |
| Etikett: verdi (`praktisk`) | Bold + Regular | som brødtekst | |
| QR-tekst | Italic + Bold Italic | 13,67 pt | |

- Versaler bare i stikktitler og misjonsfooteren, alltid med sperret skrift.
- Tekst på mørk bakgrunn eller bilde er hvit, og stikktittelen er da i slørfargen.
- Hver mal har sitt eget CSS-prefiks i `css/plakat.css` (for eksempel `.tp10` for tekstplakaten). Alle mål er i `em` relativt til boksens grunnstørrelse.

---

## 2. Valgfritt innenfor rammer

- **Bakgrunn i panelet:** (a) T-grå 15 % med radial overgang, (b) bilde med lys vask (hvit 50 % tonet ut nedover) eller mørk vask (sort 50 %), (c) mørkeblå.
- **Bilderuter inne i panelet:** hjørneradius 14 mm (53 px).
- **Spalter:** én bred, eller to à 86,5 mm. Mellom spaltene kan det stå en tynn strek på 0,3 pt.
- **Bølgeparets høyde:** fritt, men bare flyttet med `translate`.
- **Ikon:** valgfritt, fra ikonbiblioteket (`ikonHer(...)`).

---

## 3. Åpne spørsmål til designeren

Status fra 19.11.2026. Sjekk med designeren om noe er avklart, og oppdater lista.

1. **Logoens plassering varierer med 0,8 mm** mellom mal 2–3 og mal 5–8. Koden bruker mal 5–8.
2. **Venstre tekstmarg** er 23,1, 25,5 eller 27,7 mm i ulike maler. Skal det være én fast verdi?
3. **Brødtekst i smale spalter:** 12 pt eller 15 pt?
4. **Stikktittel i T-grønn på lys grå** gir for lav kontrast (1,2–1,5:1). Koden bruker mørkeblå på lys bakgrunn.
5. **Slørfargene:** designeren bruker bare T-grønn. Generatoren tilbyr også korall, gul og lyseblå. Er de lov?
6. **Panelradius** finnes som 54,5 og 56,7 px i ulike IDML-filer. Én verdi er nok.
7. **Ingen avsnittsstiler i InDesign-filene.** Navngitte stiler (Stikktittel, Hovedtittel osv.) ville gjort det mulig å lese typografien automatisk fra nye maler.

---

## 4. Kjente avvik i koden

- **Gamle maler** (`forklaring`, `delt`, `tekst`, `bilder`, `bildetekst`) ble laget før designerens filer. De bruker en annen bølge (`waveLayers`) og et annet logomål (`G.a4.logo`). De vises ikke, men må ligge i koden så gamle arbeidsfiler kan åpnes (se `ERSTATTET` i `js/oppsett.js`). Ikke bruk dem som utgangspunkt.
- **Liggende varianter** av flere A4-maler strekker bølgen (`matrix(1.6121,0,0,0.44,…)`). De er skjult i generatoren. Sjekkskriptet tillater de som finnes, men ingen nye.
- **Egne maler for liggende A4 og skjerm:** `tekstplakatliggende`, `trebilderliggende` (A4 liggende) og `tekstplakatskjerm`, `trebilderskjerm` (16:9). Hver mal har ett format, som de andre malene. De har samme felt som Tekstplakat og Tre bilder. Forslag, ikke godkjent av designer. De strekker ikke noe, og er bygget slik (`liggende()` i `js/maler.js`):
  - **16:9:** ramme, bølgepar (`SKJ.S10`), logoutsparing, logo og QR med skripttekst som infoskjermen med stort bilde.
  - **A4 liggende:** ramme, logoutsparing, logo og QR i samme mm-mål som stående A4. QR-koden har samme avstand til panelkanten. Bølgeparet er fra infoskjermen med to bilder (`SKJ.S9`, går over hele bredden), skalert likt til sidebredden (1123/1280) og flyttet ned 30 px.
  - Tekst i to spalter (tittel til venstre, brødtekst til høyre) på Tekstplakat. Bilderammene på Tre bilder er flyttet til høyre halvdel.
  - Designeren bør se på dem og helst levere en A4 liggende-fil (åpent spørsmål om 16:9-mal).

---

## 5. Sjekkliste for nye maler

- [ ] Malen er målt fra en IDML-fil fra designeren, eller tydelig merket som forslag som designeren må godkjenne.
- [ ] Ramme, logo, bølgepar og QR er hentet fra de faste formene og målene over.
- [ ] Bølgeparet er bare flyttet, snudd eller skalert likt.
- [ ] Typografien bruker rollene i 1.6. Nye roller er avtalt med designeren.
- [ ] Bare farger fra 1.5, og slørfargen via `SLOR`/`var(--slor)`.
- [ ] Kontrasten er sjekket for all tekst mot faktisk bakgrunn (minst 4,5:1 for brødtekst, 3:1 for store titler).
- [ ] Malen er lagt oppå designerens PDF med 50 % gjennomsiktighet, og avvikene er under 0,5 mm.
- [ ] `node verktoy/sjekk-regler.js` er grønn.
