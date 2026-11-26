#!/usr/bin/env node
/*
 * Regelsjekk for plakatgeneratoren. Se docs/designregler.md og CLAUDE.md, punkt 4.
 *
 * Kjøre (ingen installasjon, bare Node):
 *   node verktoy/sjekk-regler.js            # sjekker staging/
 *   node verktoy/sjekk-regler.js --prod     # sjekker prod (rota)
 *
 * Skriptet leser kildefilene og stopper (exit-kode 1) hvis en regel er brutt:
 *   Struktur  – malene henger sammen: TPLS, LAYOUTS, GRUPPER, ERSTATTET, felt og testlista i sammenlign.js
 *   Staging   – staging har riktige innstillinger og forstyrrer ikke prod
 *   Farger    – bare profilfarger og godkjente hjelpefarger (lista under)
 *   Fonter    – bare Barlow, og Square Peg bare i .skript
 *   Versaler  – bare med sperret skrift
 *   Bølgen    – aldri mørk bølge uten slør, aldri strukket, aldri de gamle byggeklossene i nye maler
 *
 * Feiler sjekken på noe som er riktig (for eksempel en ny farge designeren har godkjent),
 * legg det inn i listene under med en kommentar om hvorfor. Da er avgjørelsen synlig i historikken.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..');
const PROD = process.argv.includes('--prod');
const MAPPE = PROD ? REPO : path.join(REPO, 'staging');
const les = f => fs.readFileSync(path.join(MAPPE, f), 'utf8');

/* ───────── Godkjente verdier ───────── */

// Profilfarger (Tønsberg kommunes grafiske profil). Skal ikke endres uten designeren.
const PROFILFARGER = {
  '#013952': 'T_mørkeblå (bølge, tekst)',
  '#c5daaf': 'T-grønn (slør)',
  '#e69d7d': 'T_korall (slør)',
  '#f1be48': 'T_gul (slør, merke)',
  '#91cef2': 'T-lyseblå (slør)',
  '#ffffff': 'hvit', '#fff': 'hvit',
  '#000000': 'sort (vask og skygger med gjennomsiktighet)', '#000': 'sort (vask og skygger med gjennomsiktighet)',
  '#1d1d1b': 'sort tekst og QR (logofargen)',
};
// Hjelpefarger som allerede er i bruk og godkjent. Nye farger skal helst ikke inn her.
const HJELPEFARGER = {
  // Slørfargenes mørke og lyse varianter (SLOR.mork / SLOR.tint i oppsett.js)
  '#6f9a4a': 'grønn, mørk', '#eef4e7': 'grønn, tint',
  '#c96a43': 'korall, mørk', '#fbebe4': 'korall, tint',
  '#d79b12': 'gul, mørk', '#fdf3db': 'gul, tint', '#f4cf72': 'gul, lys (ikonbakgrunn i invitasjonen)',
  '#3d9bd0': 'lyseblå, mørk (også fokusramme i redigering)', '#e6f4fc': 'lyseblå, tint',
  // T-grå 15 % og overganger på lys bakgrunn (målt fra designerens filer)
  '#fbfbfb': 'lys grå, overgang', '#e2e2e2': 'lys grå, overgang', '#ececec': 'lys grå, overgang',
  '#f3f3f3': 'lys grå, ikonbakgrunn', '#f4f5f6': 'lys grå, ikonbakgrunn', '#f2f5f6': 'lys grå, bildeflate',
  '#e8eaee': 'lys grå, overgang (forside)', '#a6b9c2': 'blågrå tone over bilde (bildeplakat)',
  '#7f8f99': 'blågrå bak bilde (infoskjerm, stort bilde)',
  '#0b2433': 'mørkeblå skygge (infoskjerm)', '#002233': 'mørkeblå bølge på skjerm (infoskjerm)',
  // Plassholder når bilde mangler
  '#a9c6cf': 'plassholderbilde', '#4d7684': 'plassholderbilde',
  // Bare i grensesnittet rundt plakaten (kommer aldri med på plakaten)
  '#d0342c': 'grensesnitt: varselramme', '#fff3d6': 'grensesnitt: forklaringslag', '#8a6d1c': 'grensesnitt: forklaringslag',
  '#666': 'grensesnitt/stikkord-merke (bymøbel)',
};
const SLOR_FASIT = { gronn: '#c5daaf', korall: '#e69d7d', gul: '#f1be48', bla: '#91cef2' };

// Maler laget før designerens InDesign-filer. De bruker de gamle byggeklossene (waveLayers, slorFill, G.a4),
// vises ikke lenger, men må ligge for at gamle arbeidsfiler skal kunne åpnes. Ingen nye maler skal inn her.
const GAMLE_MALER = ['forklaring', 'delt', 'tekst', 'bilder', 'bildetekst', 'bildetekst2'];
// Liggende tilpasninger som strekker bølgen (skjulte formater). Tallet er hvor mange som finnes i dag.
// Regelen er at bølgeparet bare skaleres likt. Antallet skal ned, aldri opp.
const KJENTE_STREKK = { bildedrevet: 1, invitasjon: 1, forside: 1, tekstplakat: 1, inndelt: 1, trebilder: 1, hoydebilde: 1 };
// Felt som ikke har eksempeltekst i DEMO, men har startverdi i S
const FELT_UTEN_DEMO = ['qrTekst', 'bs1', 'bs2', 'bs3', 'pIntro'];

/* ───────── Hjelpere ───────── */
const feil = [], ok = [];
let gruppe = '';
const sjekk = (navn, feilListe) => {
  if (feilListe.length) feilListe.forEach(f => feil.push(`${gruppe}: ${navn}: ${f}`));
  else ok.push(`${gruppe}: ${navn}`);
};

// Laster oppsett.js og maler.js i en sandkasse for å lese konstantene (ingen nettleser trengs)
function lastKode() {
  const kode = les('js/oppsett.js') + '\n' + les('js/maler.js')
    + '\n;({TPLS, ERSTATTET, GRUPPER, SLOR, DEMO, FMT, NAVY, RESSURS_ROT, LS_PREFIKS, LAYOUTS, PH});';
  const ctx = vm.createContext({ document: {}, window: {}, console, IKONER: [] });
  return vm.runInContext(kode, ctx, { filename: 'oppsett.js+maler.js' });
}

// Deler maler.js i én tekstblokk per LAYOUTS.navn
function malBlokker(src) {
  const linjer = src.split('\n'), blokker = {};
  let navn = null;
  for (const l of linjer) {
    const m = l.match(/^LAYOUTS\.(\w+)\s*=/);
    if (m) { navn = m[1]; blokker[navn] = ''; }
    else if (navn && /^(\/\*|const |function |let )/.test(l)) navn = null;
    if (navn) blokker[navn] += l + '\n';
  }
  return blokker;
}

/* ───────── Sjekkene ───────── */
let K;
try { K = lastKode(); }
catch (e) { console.error(`✗ Klarte ikke å lese oppsett.js og maler.js: ${e.message}`); process.exit(1); }
const malerSrc = les('js/maler.js');
const css = les('css/plakat.css');
const blokker = malBlokker(malerSrc);

gruppe = 'Struktur';
sjekk('hver mal i TPLS har en LAYOUTS-funksjon',
  Object.keys(K.TPLS).filter(k => typeof K.LAYOUTS[k] !== 'function').map(k => `«${k}» mangler LAYOUTS.${k} i js/maler.js`));
sjekk('malnøklene er små bokstaver a–z og tall',
  Object.keys(K.TPLS).filter(k => !/^[a-z0-9]+$/.test(k)).map(k => `«${k}»`));
sjekk('formatene finnes i FMT',
  Object.entries(K.TPLS).flatMap(([k, t]) => t.fmts.filter(f => !K.FMT[f]).map(f => `«${k}» bruker ukjent format «${f}»`)));
const synlige = K.GRUPPER.flatMap(g => g.maler);
sjekk('GRUPPER viser bare maler som finnes og ikke er erstattet',
  synlige.filter(k => !K.TPLS[k] || K.ERSTATTET[k]).map(k => `«${k}»`));
sjekk('ERSTATTET peker til maler som finnes og vises',
  Object.entries(K.ERSTATTET).flatMap(([gammel, ny]) => [
    ...(K.TPLS[gammel] ? [] : [`«${gammel}» er fjernet fra TPLS, da kan gamle arbeidsfiler ikke åpnes`]),
    ...(synlige.includes(ny) ? [] : [`«${gammel}» erstattes av «${ny}», som ikke vises i GRUPPER`]),
  ]));
sjekk('alle felt har eksempeltekst (DEMO) og hjelpetekst (PH)',
  Object.entries(K.TPLS).flatMap(([k, t]) => t.felt.flatMap(f => [
    ...(K.DEMO[f] !== undefined || FELT_UTEN_DEMO.includes(f) ? [] : [`«${k}»: feltet «${f}» mangler i DEMO (oppsett.js)`]),
    ...(K.PH[f] !== undefined ? [] : [`«${k}»: feltet «${f}» mangler i PH (maler.js)`]),
  ])));
const sammenlign = fs.readFileSync(path.join(REPO, 'verktoy/sammenlign.js'), 'utf8');
const vis = (sammenlign.match(/const VIS = \[([^\]]*)\]/) || [, ''])[1].match(/'(\w+)'/g)?.map(s => s.slice(1, -1)) || [];
sjekk('testlista VIS i verktoy/sammenlign.js er lik malene i GRUPPER', [
  ...synlige.filter(k => !vis.includes(k)).map(k => `«${k}» vises, men mangler i VIS`),
  ...vis.filter(k => !synlige.includes(k)).map(k => `«${k}» står i VIS, men vises ikke`),
]);

gruppe = PROD ? 'Prod' : 'Staging';
const html = les('index.html'), ui = les('css/ui.css');
if (PROD) {
  sjekk('RESSURS_ROT og LS_PREFIKS er tomme', [
    ...(K.RESSURS_ROT === '' ? [] : [`RESSURS_ROT er «${K.RESSURS_ROT}»`]),
    ...(K.LS_PREFIKS === '' ? [] : [`LS_PREFIKS er «${K.LS_PREFIKS}»`]),
  ]);
  sjekk('ingen TESTVERSJON-banner', /testbanner/.test(html) ? ['index.html har banneret'] : []);
} else {
  sjekk('RESSURS_ROT er «../» og LS_PREFIKS er «staging-»', [
    ...(K.RESSURS_ROT === '../' ? [] : [`RESSURS_ROT er «${K.RESSURS_ROT}»`]),
    ...(K.LS_PREFIKS === 'staging-' ? [] : [`LS_PREFIKS er «${K.LS_PREFIKS}»`]),
  ]);
  sjekk('TESTVERSJON-banneret finnes',
    /class="testbanner"/.test(html) && /\.testbanner\{/.test(ui) ? [] : ['mangler i index.html eller css/ui.css']);
}
const jsFiler = fs.readdirSync(path.join(MAPPE, 'js')).filter(f => f.endsWith('.js'));
sjekk('localStorage-nøkler bruker LS_PREFIKS',
  jsFiler.flatMap(f => les('js/' + f).split('\n').flatMap((l, i) => {
    const m = l.match(/localStorage\.(?:get|set|remove)Item\(\s*(['"`])/);
    return m ? [`js/${f}:${i + 1} bruker en fast nøkkel. Lag en konstant med LS_PREFIKS + '…'`] : [];
  }).concat(les('js/' + f).split('\n').flatMap((l, i) =>
    /const \w+_KEY\s*=/.test(l) && !/LS_PREFIKS/.test(l) ? [`js/${f}:${i + 1} lager en nøkkel uten LS_PREFIKS`] : []))));

gruppe = 'Farger';
sjekk('NAVY er T_mørkeblå', K.NAVY.toLowerCase() === '#013952' ? [] : [`NAVY er ${K.NAVY}`]);
sjekk('slørfargene er de fire profilfargene', [
  ...Object.keys(K.SLOR).filter(k => !SLOR_FASIT[k]).map(k => `ukjent slørfarge «${k}»`),
  ...Object.entries(SLOR_FASIT).filter(([k, c]) => (K.SLOR[k]?.c || '').toLowerCase() !== c).map(([k, c]) => `«${k}» skal være ${c}`),
]);
const lovlig = { ...PROFILFARGER, ...HJELPEFARGER };
const fargeFeil = [];
for (const f of ['js/maler.js', 'js/oppsett.js', 'css/plakat.css']) {
  les(f).split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
      const c = m[0].toLowerCase();
      if (m.index > 0 && /[\w$&]/.test(l[m.index - 1])) continue; // url(#id), &#… o.l.
      if (!lovlig[c]) fargeFeil.push(`${f}:${i + 1} bruker ${c}. Bruk en profilfarge, eller få fargen godkjent og legg den i HJELPEFARGER`);
    }
  });
}
sjekk('bare profilfarger og godkjente hjelpefarger', fargeFeil);

gruppe = 'Typografi';
const regler = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(m => ({ velger: m[1].trim(), kropp: m[2] }));
sjekk('bare Barlow, og Square Peg bare i .skript',
  regler.flatMap(r => {
    const m = r.kropp.match(/font-family:([^;]+)/); if (!m) return [];
    const v = m[1].trim();
    if (/^var\(--font\)$/.test(v) || /^'Barlow'/.test(v)) return [];
    if (/Square Peg/.test(v) && /\.skript$/.test(r.velger)) return [];
    return [`«${r.velger}» bruker ${v}`];
  }));
sjekk('versaler bare med sperret skrift (minst 0,1em)',
  regler.filter(r => /^\.page/.test(r.velger) && /text-transform:uppercase/.test(r.kropp)).flatMap(r => {
    const ls = parseFloat((r.kropp.match(/letter-spacing:([\d.]+)em/) || [])[1] || 0);
    return ls >= 0.1 ? [] : [`«${r.velger}» har versaler uten sperring`];
  }));

gruppe = 'Bølgen';
const MORK_BOLGE = /\.(navy|bunn)\}|waveLayers\(/, SLOR_BOLGE = /\.(gronn|bolge)\}|waveLayers\(/;
sjekk('mørk bølge har alltid slør',
  Object.entries(blokker).filter(([, b]) => MORK_BOLGE.test(b) && !SLOR_BOLGE.test(b)).map(([k]) => `«${k}»`));
sjekk('nye maler bruker det låste bølgeparet, ikke de gamle byggeklossene',
  Object.entries(blokker).filter(([k, b]) => !GAMLE_MALER.includes(k) && /waveLayers\(|slorFill\(|wavePath\(|\.\.\.g\.logo/.test(b))
    .map(([k]) => `«${k}» bruker waveLayers/slorFill/wavePath/G.logo. Bruk FS8 (eller formens egen fasit) og logo() med mål fra designerens fil`));
const strekk = b => [...b.matchAll(/matrix\(\s*([-\d.]+)\s*,\s*[-\d.]+\s*,\s*[-\d.]+\s*,\s*([-\d.]+)/g),
  ...b.matchAll(/scale\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/g)].filter(m => Math.abs(+m[1] - +m[2]) > 0.001).length;
sjekk('bølgeparet strekkes ikke (lik skalering i begge retninger)',
  Object.entries(blokker).filter(([k, b]) => strekk(b) > (KJENTE_STREKK[k] || 0))
    .map(([k, b]) => `«${k}» har ${strekk(b)} ujevn skalering (tillatt: ${KJENTE_STREKK[k] || 0})`));
sjekk('alle maler har logo',
  Object.entries(blokker).filter(([, b]) => !/logo\(/.test(b)).map(([k]) => `«${k}»`));

/* ───────── Resultat ───────── */
console.log(`Regelsjekk: ${PROD ? 'prod (rota)' : 'staging/'}\n`);
ok.forEach(o => console.log(`  ✓ ${o}`));
if (feil.length) {
  console.log('');
  feil.forEach(f => console.log(`  ✗ ${f}`));
  console.log(`\n${feil.length} feil. Rett dem, eller legg et godkjent unntak inn øverst i verktoy/sjekk-regler.js med en kommentar.`);
  process.exit(1);
}
console.log('\nAlt i orden.');
