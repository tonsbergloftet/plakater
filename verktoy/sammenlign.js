#!/usr/bin/env node
/*
 * Sammenligningstest: prod (rot-index.html) mot staging (staging/index.html).
 * Se CLAUDE.md, punkt 4. Kjøres før hver opplasting til staging.
 *
 * Kjøre:
 *   python verktoy/bildebank.py        # bygger _site/ med bildebank og ikoner (krever pillow)
 *   node verktoy/sammenlign.js         # tester _site/ (eller rota hvis _site mangler)
 *
 * Valg:
 *   --rot <mappe>   mappe som serveres (standard: _site, ellers rota)
 *   --rask          bare malene som vises i generatoren, og hopper over bildebankrunden
 *
 * Krever Playwright med Chromium (ikke en del av nettsiden, bare testverktøy):
 *   npm install -g playwright && npx playwright install chromium
 *   (med global installasjon kan NODE_PATH="$(npm root -g)" trengs)
 *
 * Testen sjekker:
 *   1. Alle maler i alle formater (a4, wide, bym), også mørk variant og side 2, med demotekst og
 *      eksempelbilde: forhåndsvisning (zoom 100 %), PNG-eksport og bildet i PDF-en sammenlignes
 *      piksel for piksel. Tillatt avvik: under 0,5 % av pikslene.
 *      Runde 2 gjør det samme med bilder fra bildebanken (tester RESSURS_ROT).
 *   2. PDF og PNG lastes ned. Fontene er med i eksporten: PDF-bildet er likt prod, staging henter
 *      fontfilene under eksporten, og en kontroll uten fontfiler gir tydelig avvik (testen merker det).
 *   3. Arbeidsfil (PDF med /TkPlakat) fra prod åpnes i staging, og omvendt.
 *   4. Konsollen viser ingen feil (og ingen mislykkede nettverkskall).
 * I tillegg: banneret «TESTVERSJON» finnes bare i staging, og staging bruker bare «staging-»-nøkler.
 *
 * Bilder av avvik lagres i en midlertidig mappe (skrives ut til slutt).
 */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const ARGS = process.argv.slice(2);
const flagg = n => ARGS.includes(n);
const verdi = n => { const i = ARGS.indexOf(n); return i >= 0 ? ARGS[i + 1] : null; };
const REPO = path.resolve(__dirname, '..');
const ROT = path.resolve(verdi('--rot') || (fs.existsSync(path.join(REPO, '_site', 'index.html')) ? path.join(REPO, '_site') : REPO));
const RASK = flagg('--rask');
const GRENSE = 0.5; // prosent av pikslene
const UT = fs.mkdtempSync(path.join(os.tmpdir(), 'plakater-sammenlign-'));
const VIS = ['bildedrevet', 'forside', 'inndelt', 'hoydebilde', 'trebilder', 'tekstplakat', 'trebilderliggende', 'tekstplakatliggende', 'invitasjon', 'infoskjerm', 'infoskjerm2', 'tekstplakatskjerm', 'trebilderskjerm', 'bymobel'];

/* ───── Enkel statisk server ───── */
const TYPER = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
function startServer(rot) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const fil = path.join(rot, p);
    if (!fil.startsWith(rot) || !fs.existsSync(fil) || fs.statSync(fil).isDirectory()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': TYPER[path.extname(fil)] || 'application/octet-stream' });
    fs.createReadStream(fil).pipe(res);
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

/* ───── PDF: hent ut JPEG-bildene (én per side) og arbeidsfila ───── */
function lesPdf(buf) {
  const t = buf.toString('latin1');
  const bilder = [];
  const re = /\/Subtype \/Image/g; let m;
  while ((m = re.exec(t))) {
    const slutt = t.indexOf('>>', m.index);
    const hode = t.slice(t.lastIndexOf('<<', m.index), t.indexOf('stream', m.index));
    const len = +(/\/Length (\d+)/.exec(hode) || [])[1];
    const s = t.indexOf('stream', slutt) + 'stream'.length;
    const start = t[s] === '\r' ? s + 2 : s + 1;
    if (/DCTDecode/.test(hode) && len) bilder.push(buf.subarray(start, start + len));
  }
  return { bilder, arbeidsfil: /\/TkPlakat \(([A-Za-z0-9+/=]+)\)/.test(t), sider: (t.match(/\/Type \/Page\b/g) || []).length };
}

/* ───── Pikselsammenligning (i nettleseren, så testen bare trenger Playwright) ───── */
let VERKTOY;
async function sammenlign(a, b, navn) {
  const r = await VERKTOY.evaluate(async ([a, b, lagDiff]) => {
    const last = async b64 => createImageBitmap(await (await fetch('data:application/octet-stream;base64,' + b64)).blob());
    const [A, B] = await Promise.all([last(a), last(b)]);
    if (A.width !== B.width || A.height !== B.height) return { ulikStr: true, a: [A.width, A.height], b: [B.width, B.height] };
    const px = im => { const c = new OffscreenCanvas(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, im.width, im.height).data; };
    const pa = px(A), pb = px(B); let ulik = 0, maks = 0;
    const d = lagDiff ? new Uint8ClampedArray(pa.length) : null;
    for (let i = 0; i < pa.length; i += 4) {
      const m = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]), Math.abs(pa[i + 3] - pb[i + 3]));
      if (m) { ulik++; if (m > maks) maks = m; }
      if (d) { d[i] = m ? 255 : pa[i] * .25 + 190; d[i + 1] = m ? 0 : pa[i + 1] * .25 + 190; d[i + 2] = m ? 0 : pa[i + 2] * .25 + 190; d[i + 3] = 255; }
    }
    let diffPng = null;
    if (d && ulik) { const c = new OffscreenCanvas(A.width, A.height); c.getContext('2d').putImageData(new ImageData(d, A.width, A.height), 0, 0);
      const bl = await c.convertToBlob({ type: 'image/png' }); const fr = new FileReader(); diffPng = await new Promise(ok => { fr.onload = () => ok(fr.result.split(',')[1]); fr.readAsDataURL(bl); }); }
    return { w: A.width, h: A.height, ulik, prosent: 100 * ulik / (A.width * A.height), maks, diffPng };
  }, [a.toString('base64'), b.toString('base64'), true]);
  if (r.diffPng) {
    const f = navn.replace(/[^a-z0-9-]+/gi, '_');
    fs.writeFileSync(path.join(UT, f + '-prod.png'), a); fs.writeFileSync(path.join(UT, f + '-staging.png'), b);
    fs.writeFileSync(path.join(UT, f + '-diff.png'), Buffer.from(r.diffPng, 'base64'));
  }
  delete r.diffPng;
  return r;
}

/* ───── Én side (prod eller staging) ───── */
async function apne(browser, base, hvor, medBank) {
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1500 }, acceptDownloads: true });
  await ctx.addInitScript(() => { window.__ingenStart = true; });
  const feil = [], nett = [];
  if (!medBank) await ctx.route('**/bilder/bilder.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') feil.push(m.text()); });
  page.on('pageerror', e => feil.push('JS-feil: ' + e.message));
  page.on('dialog', d => { feil.push('Dialog: ' + d.message()); d.dismiss(); });
  page.on('requestfailed', r => feil.push('Nettverk feilet: ' + r.url() + ' ' + (r.failure() || {}).errorText));
  page.on('response', r => { nett.push(r.url()); if (r.status() >= 400) feil.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(base + (hvor === 'staging' ? 'staging/' : ''), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Chromium tegner kantutjevning og overganger litt ulikt avhengig av hvor på skjermen plakaten står
  // (prod mot prod gir avvik om plakaten flyttes én piksel). Prod får derfor en tom stripe like høy som
  // banneret i staging, så forhåndsvisningen står på nøyaktig samme sted. Påvirker ikke eksporten.
  if (hvor === 'prod') await page.evaluate(() => { const d = document.createElement('div'); d.style.cssText = 'flex-shrink:0;height:28px'; document.body.prepend(d); render(); });
  if (medBank) await page.waitForFunction(() => document.body.classList.contains('har-bank'), null, { timeout: 15000 }).catch(() => feil.push('Bildebanken ble ikke lastet'));
  await page.waitForTimeout(400);
  return { ctx, page, feil, nett, hvor };
}

async function settTilstand(s, c) {
  await s.page.evaluate(c => {
    autoVariant = false; // ellers kan kvalitetssjekken bytte variant midt i testen
    velgMal(c.tpl); S.fmt = c.fmt; S.mork = !!c.mork; S.side = c.side || 1; S.zoom = 1;
    fillForm(); render();
  }, c);
  await vent(s);
  // Tegn én gang til når fontene er klare. Prod kan tilpasse teksten med feil mål rett etter et malbytte hvis en
  // fontvekt ikke var lastet (rettet i staging, se egen sjekk). Her sammenlignes ferdig tegnet plakat.
  await s.page.evaluate(() => render());
  await vent(s);
}
async function vent(s) {
  await s.page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('#wrap img')].map(i => i.decode().catch(() => {})));
    await Promise.all([...document.querySelectorAll('#wrap image')].map(i => new Promise(ok => {
      const im = new Image(); im.onload = im.onerror = ok; im.src = i.getAttribute('href'); })));
  });
  await s.page.waitForLoadState('networkidle');
  await s.page.waitForTimeout(250);
}
async function forhandsvisning(s) { return s.page.locator('#wrap .page').screenshot({ animations: 'disabled' }); }
async function eksport(s, type) {
  const [dl] = await Promise.all([s.page.waitForEvent('download', { timeout: 60000 }), s.page.evaluate(t => exportFile(t, true), type)]);
  return fs.readFileSync(await dl.path());
}

/* ───── Rapport ───── */
const RAD = [], FEIL = [];
function logg(sjekk, ok, detalj) { RAD.push({ sjekk, ok, detalj }); console.log(`${ok ? 'OK  ' : 'AVVIK'} ${sjekk}${detalj ? '  ' + detalj : ''}`); if (!ok) FEIL.push(sjekk); }
const pst = r => r.ulikStr ? `ulik størrelse ${r.a} / ${r.b}` : `${r.prosent.toFixed(3)} % ulike piksler (${r.w}×${r.h}, maks kanalavvik ${r.maks})`;
const godkjent = r => !r.ulikStr && r.prosent < GRENSE;

(async () => {
  const srv = await startServer(ROT);
  const base = `http://127.0.0.1:${srv.address().port}/`;
  console.log('Serverer', ROT, 'på', base);
  const browser = await chromium.launch();
  VERKTOY = await (await browser.newContext()).newPage();
  const harBank = fs.existsSync(path.join(ROT, 'bilder', 'bilder.json'));
  const runder = [{ navn: 'eksempelbilde', bank: false }];
  if (harBank && !RASK) runder.push({ navn: 'bildebank', bank: true });
  if (!harBank) console.log('Merk: fant ikke bilder/bilder.json – kjør verktoy/bildebank.py først for å teste bildebanken.');
  const alleSider = [];

  for (const runde of runder) {
    console.log(`\n── Runde: ${runde.navn} ──`);
    const P = await apne(browser, base, 'prod', runde.bank), T = await apne(browser, base, 'staging', runde.bank);
    alleSider.push(P, T);
    const tpls = await P.page.evaluate(() => Object.fromEntries(Object.entries(TPLS).map(([k, t]) => [k, { fmts: t.fmts, mork: !!t.mork }])));
    const nokler = Object.keys(tpls).filter(k => (RASK || runde.bank) ? VIS.includes(k) : true);
    const tilfeller = [];
    for (const k of nokler) for (const fmt of tpls[k].fmts) {
      tilfeller.push({ tpl: k, fmt });
      if (tpls[k].mork) tilfeller.push({ tpl: k, fmt, mork: true });
      if (k === 'bildetekst' && fmt === 'a4') tilfeller.push({ tpl: k, fmt, side: 2 });
    }
    for (const c of tilfeller) {
      const navn = `${runde.navn}/${c.tpl}/${c.fmt}${c.mork ? '/mork' : ''}${c.side === 2 ? '/side2' : ''}${VIS.includes(c.tpl) ? '' : ' (skjult mal)'}`;
      await settTilstand(P, c); await settTilstand(T, c);
      const r1 = await sammenlign(await forhandsvisning(P), await forhandsvisning(T), navn + '-visning');
      logg(navn + ' forhåndsvisning', godkjent(r1), pst(r1));
      const r2 = await sammenlign(await eksport(P, 'png'), await eksport(T, 'png'), navn + '-png');
      logg(navn + ' PNG', godkjent(r2), pst(r2));
      if (c.side === 2) continue; // PDF-en har begge sider; testes på side 1
      const pp = lesPdf(await eksport(P, 'pdf')), pt = lesPdf(await eksport(T, 'pdf'));
      const pdfOk = pt.arbeidsfil && pt.bilder.length === pp.bilder.length && pt.bilder.length >= 1;
      if (!pdfOk) { logg(navn + ' PDF', false, `arbeidsfil=${pt.arbeidsfil}, bilder prod/staging=${pp.bilder.length}/${pt.bilder.length}`); continue; }
      const rs = [];
      for (let i = 0; i < pp.bilder.length; i++) rs.push(await sammenlign(pp.bilder[i], pt.bilder[i], `${navn}-pdf-s${i + 1}`));
      logg(navn + ' PDF', rs.every(godkjent), rs.map(pst).join(' | ') + `, ${pt.sider} side(r), /TkPlakat med`);
    }

    if (!runde.bank) {
      // Teksttilpasning ved malbytte: alle fontvarianter skal være lastet etter oppstart, også når fontfilene kommer
      // sent, så teksten får riktig størrelse med en gang (ikke først ved neste endring).
      const L = await (async () => {
        const ctx = await browser.newContext({ viewport: { width: 1800, height: 1500 } });
        await ctx.addInitScript(() => { window.__ingenStart = true; });
        await ctx.route('**/bilder/bilder.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
        await ctx.route('**/staging/fonter/*.woff2', async r => { await new Promise(ok => setTimeout(ok, 300)); r.continue(); });
        const page = await ctx.newPage(); await page.goto(base + 'staging/', { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
        const r = await page.evaluate(async () => {
          const ulastet = [...document.fonts].filter(f => f.status !== 'loaded').length;
          const avvik = [];
          for (const k of Object.keys(TPLS)) {
            autoVariant = false; velgMal(k);
            const a = [...document.querySelectorAll('#wrap .box')].map(b => b.style.fontSize).join();
            await document.fonts.ready; render();
            const b = [...document.querySelectorAll('#wrap .box')].map(b => b.style.fontSize).join();
            if (a !== b) avvik.push(k);
          }
          return { ulastet, avvik, totalt: document.fonts.size };
        });
        await ctx.close(); return r;
      })();
      logg('Alle fontvarianter lastet etter oppstart (staging, fonter 300 ms forsinket)', L.ulastet === 0, `${L.totalt - L.ulastet} av ${L.totalt} lastet`);
      logg('Riktig tekststørrelse rett etter malbytte (staging)', L.avvik.length === 0, L.avvik.length ? 'feil størrelse i: ' + L.avvik.join(', ') : 'lik før og etter ny tegning i alle maler');

      // Fontene i eksporten. html-to-image mellomlagrer fontene etter første eksport, så dette gjøres i ferske sider.
      await settTilstand(P, { tpl: 'inndelt', fmt: 'a4' });
      const pdfProd = lesPdf(await eksport(P, 'pdf')).bilder[0];
      const F = await apne(browser, base, 'staging', false);
      await settTilstand(F, { tpl: 'inndelt', fmt: 'a4' });
      const for_ = F.nett.length; const pdfF = lesPdf(await eksport(F, 'pdf')).bilder[0];
      const fonter = [...new Set(F.nett.slice(for_).filter(u => /\/staging\/fonter\/.+\.woff2$/.test(u)).map(u => u.split('/').pop()))];
      const rf = await sammenlign(pdfProd, pdfF, 'fonter-forste-eksport');
      logg('Fonter bygges inn i første PDF-eksport (staging)', fonter.length > 0 && godkjent(rf), `${fonter.length} fontfiler hentet (${fonter.join(', ')}); ${pst(rf)}`);
      alleSider.push(F); await F.ctx.close();
      // Kontroll: blokkerer fontfilene bare under eksporten (siden selv har fontene). Da skal PDF-en bli tydelig ulik prod.
      const K = await apne(browser, base, 'staging', false);
      await settTilstand(K, { tpl: 'inndelt', fmt: 'a4' });
      await K.ctx.route('**/staging/fonter/*.woff2', r => r.abort());
      const kontroll = await sammenlign(pdfProd, lesPdf(await eksport(K, 'pdf')).bilder[0], 'kontroll-uten-fonter');
      logg('Kontroll: uten fontfiler i eksporten blir PDF-en ulik prod', !godkjent(kontroll), pst(kontroll) + ' (forventet avvik)');
      await K.ctx.close(); // feilene i kontrollsiden er villet og telles ikke

      // Arbeidsfil begge veier
      const tilstand = { tpl: 'bildedrevet', fmt: 'a4' };
      const endre = async s => { await settTilstand(s, tilstand); await s.page.evaluate(() => { S.tittel = 'Arbeidsfil-test **æøå**'; S.url = 'tonsberg.kommune.no/test'; S.slor = Object.keys(SLOR)[1]; fillForm(); render(); }); await vent(s); };
      // Fila lagres i én versjon og åpnes i begge. Innholdet etter åpning og eksporten skal være like.
      const apneFil = async (s, pdf) => {
        await s.page.evaluate(() => { velgMal('tekstplakat'); });
        await s.page.setInputFiles('#startapne', { name: 'arbeidsfil.pdf', mimeType: 'application/pdf', buffer: pdf });
        await s.page.waitForFunction(() => S.tittel === 'Arbeidsfil-test **æøå**', null, { timeout: 10000 }).catch(() => {});
        await s.page.evaluate(() => { S.zoom = 1; render(); }); await vent(s);
      };
      for (const [fra, til] of [[P, T], [T, P]]) {
        await endre(fra);
        const pdf = await eksport(fra, 'pdf');
        await apneFil(til, pdf); await apneFil(fra, pdf);
        const [ja, jb] = await Promise.all([fra.page.evaluate(() => JSON.stringify(utkastData())), til.page.evaluate(() => JSON.stringify(utkastData()))]);
        const okTittel = JSON.parse(jb).tittel === 'Arbeidsfil-test **æøå**';
        const r = await sammenlign(await eksport(fra, 'png'), await eksport(til, 'png'), `arbeidsfil-${fra.hvor}-til-${til.hvor}`);
        logg(`Arbeidsfil fra ${fra.hvor} åpnes i ${til.hvor}`, okTittel && ja === jb && godkjent(r), (okTittel ? '' : 'fila ble ikke lest, ') + (ja === jb ? 'samme innhold, ' : 'ULIKT innhold, ') + pst(r));
      }
    }

    // Banner og localStorage
    const [bP, bT] = await Promise.all([P, T].map(s => s.page.evaluate(() => { const b = document.querySelector('.testbanner'); return b ? b.textContent.trim() + (b.offsetHeight ? '' : ' (skjult)') : null; })));
    logg(`Banner (${runde.navn})`, bP === null && bT === 'TESTVERSJON', `prod: ${bP || 'ingen'}, staging: ${bT}`);
    const nk = await T.page.evaluate(() => { localStorage.setItem(TOUR_KEY_G, '1'); brukSkriv(['test']); return Object.keys(localStorage); });
    logg(`localStorage i staging (${runde.navn})`, nk.length > 0 && nk.every(k => k.startsWith('staging-')), nk.join(', '));
    if (runde.bank) {
      const b = await T.page.evaluate(() => ({ n: BANK.length, bank: S.imgs.filter(i => i && i.bank).length }));
      logg('Bildebanken lastes i staging (RESSURS_ROT)', b.n > 0 && b.bank > 0, `${b.n} bilder i banken, ${b.bank} brukt i plakaten`);
      await T.page.evaluate(() => apneBank(0)); await T.page.waitForLoadState('networkidle'); await T.page.waitForTimeout(300);
      const mini = await T.page.evaluate(() => [...document.querySelectorAll('#bank img')].filter(i => i.complete && i.naturalWidth > 0).length);
      logg('Miniatyrer i bildevelgeren (staging)', mini > 0, `${mini} vist`);
    }
  }

  // Konsoll
  for (const s of alleSider) if (s.hvor === 'prod' && s.feil.length) console.log(`(Til info: prod hadde ${s.feil.length} konsollfeil: ${[...new Set(s.feil)].join(' | ')})`);
  const tf = [...new Set(alleSider.filter(s => s.hvor === 'staging').flatMap(s => s.feil))];
  logg('Konsollen i staging uten feil', tf.length === 0, tf.length ? tf.join(' | ') : 'ingen feil');

  await browser.close(); srv.close();
  const md = ['| Sjekk | Resultat | Detaljer |', '|---|---|---|', ...RAD.map(r => `| ${r.sjekk} | ${r.ok ? '✅' : '❌'} | ${r.detalj || ''} |`)].join('\n');
  fs.writeFileSync(path.join(UT, 'resultat.md'), md);
  console.log(`\n${RAD.length - FEIL.length} av ${RAD.length} sjekker OK. Resultat og eventuelle avviksbilder: ${UT}`);
  process.exit(FEIL.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
