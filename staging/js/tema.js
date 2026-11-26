/* Tema: et valgfritt lag oppå malene (jul, påske, quiz …)
   Temaet endrer bare det malen har plass til. Malen, teksten, logoen, rammen, bølgeformen og QR-koden er de samme.
   - Slør: temaets slørfarge (en av de fire i SLOR) brukes i stedet for den valgte.
   - Flate: malene med lys grå flate får en lys tone av slørfargen (SLOR.tint), så mørk tekst fortsatt har god kontrast.
   - Motiv: temaets illustrasjon på malens faste motivplass (TEMA_PLASS). Vises ikke når malen har valgt ikon på samme sted.
   - Dekor: små motiver strødd i malens ledige felt (TEMA_PLASS.dekor), aldri over tekst eller bilder.
   Temaene ligger som JSON i temaer/ (én fil per tema, rekkefølgen i temaer/index.json).
   Motivene ligger i js/motiver.js (tegnet i en 200 × 200-boks, farger fra profilen). */
'use strict';

// Profilfarger brukt av motivene (Tønsberg kommunes grafiske profil, s. 8)
const TEMA_FARGER = {navy:'#013952', gronn:'#c5daaf', rod:'#923c3d', korall:'#e69d7d', gul:'#f1be48', lysbla:'#91cef2', morkgronn:'#00714e', gra:'#4a4a49', hvit:'#ffffff', sort:'#1d1d1b'};

/* Plasser per mal, i malens egne koordinater (px).
   motiv: [x, y, størrelse] for illustrasjonen. ikon: true hvis plassen deles med malens ikon.
   dekor: felt der småmotiver kan strøs. tint: flaten tones med slørfargen. */
const TEMA_PLASS = {
  tekstplakat:        {motiv:[560,40,190], ikon:true, dekor:[[300,40,540,235]], tint:true},
  tekstplakatliggende:{motiv:[880,30,190], ikon:true, dekor:[[330,40,850,235]], tint:true},
  tekstplakatskjerm:  {motiv:[1060,20,170], ikon:true, dekor:[[360,30,1030,185]], tint:true},
  trebilder:          {motiv:[245,40,165], dekor:[], tint:true},
  trebilderliggende:  {motiv:[350,30,190], dekor:[[290,40,345,235]], tint:true},
  trebilderskjerm:    {motiv:[440,25,165], dekor:[[340,30,430,185]], tint:true},
  hoydebilde:         {motiv:[590,30,175], ikon:true, dekor:[[440,30,580,195]], tint:true},
  inndelt:            {motiv:[590,50,160], dekor:[]},
  bildedrevet:        {motiv:[60,520,190], dekor:[]},
  forside:            {motiv:[580,60,160], dekor:[]},
  invitasjon:         {motiv:[580,60,160], dekor:[]},
  infoskjerm:         {motiv:[1100,40,140], dekor:[]},
  infoskjerm2:        {motiv:[1080,70,140], dekor:[]},
};

let TEMAER = {}, TEMA_REKKE = [];
async function lastTemaer(){
  try {
    TEMA_REKKE = await (await fetch('temaer/index.json')).json();
    const alle = await Promise.all(TEMA_REKKE.map(id => fetch(`temaer/${id}.json`).then(r => r.json())));
    alle.forEach(t => { TEMAER[t.id] = t; });
  } catch(e){ TEMA_REKKE = []; TEMAER = {}; console.warn('Fant ikke temaene (temaer/*.json)', e); }
}
const aktivtTema = () => (S.tema && TEMAER[S.tema] && TEMA_PLASS[S.tpl]) ? TEMAER[S.tema] : null;

// Slørfargen malen skal bruke: temaets når et tema er valgt
const temaSlor = () => { const t = aktivtTema(); return t && SLOR[t.slor] ? t.slor : S.slor; };

// Ett motiv fra biblioteket i en boks (x, y, størrelse, rotasjon). Farger er profilnavn eller hex.
let temaUid = 0;
function temaMotiv(id, x, y, s, r, farger){
  const m = MOTIVER[id]; if(!m) return '';
  const f = m.farger.map((d, i) => { const v = (farger && farger[i]) || d; return v[0] === '#' ? v : (TEMA_FARGER[v] || TEMA_FARGER[d]); });
  return `<g transform="translate(${x},${y}) rotate(${r||0} ${s/2} ${s/2}) scale(${(s/200).toFixed(4)})">${m.svg(...f).replace(/§/g, 'tm' + (temaUid++) + '_')}</g>`;
}

// Faste plasser for dekor (deterministisk, så plakaten ser lik ut hver gang)
const TEMA_PLASSER = (() => { let a = 11, ut = []; const rnd = () => (a = (a * 16807) % 2147483647) / 2147483647;
  for(let i = 0; i < 200; i++) ut.push([rnd(), rnd(), 16 + rnd() * 18, (rnd() * 60 - 30) | 0]); return ut; })();

// Legger temaet på en ferdig bygget side. Kalles fra buildPage.
function leggPaaTema(el, tpl, fmt){
  const t = aktivtTema(), pl = TEMA_PLASS[tpl]; if(!t || !pl) return;
  const bg = el.querySelector('svg.bg'); if(!bg) return;
  const [W, H] = (bg.getAttribute('viewBox') || '0 0 794 1123').split(' ').slice(2).map(Number);
  // Flaten: lys grå → lys tone av slørfargen
  if(pl.tint) bg.querySelectorAll('radialGradient[id$="rg"] stop').forEach(st => {
    const c = (st.getAttribute('stop-color') || '').toLowerCase();
    if(c === '#fbfbfb') st.setAttribute('stop-color', '#ffffff');
    if(c === '#e2e2e2') st.setAttribute('stop-color', SLOR[temaSlor()].tint);
  });
  let lag = '';
  // Dekor i de ledige feltene
  const d = t.dekor || {}, felt = pl.dekor || [];
  if(d.antall && (d.motiver || []).length && felt.length){
    let n = 0;
    for(const [rx, ry, s, r] of TEMA_PLASSER){
      if(n >= d.antall) break;
      const f = felt[n % felt.length], x = f[0] + rx * (f[2] - f[0] - s), y = f[1] + ry * (f[3] - f[1] - s);
      const [mx, my, ms] = pl.motiv; if(x + s > mx && x < mx + ms && y + s > my && y < my + ms) continue; // ikke under motivet
      const id = d.motiver[n % d.motiver.length], fa = d.farger ? [d.farger[n % d.farger.length]] : ['navy'];
      lag += `<g opacity="${d.dekning || .35}">${temaMotiv(id, x, y, s, r, fa)}</g>`; n++;
    }
  }
  // Motivet (ikke når malen viser ikon på samme plass)
  if(!(pl.ikon && S.ikon && typeof ikonSvg === 'function' && ikonSvg(S.ikon))){
    const [x, y, s] = pl.motiv;
    lag += `<g transform="translate(${x},${y}) scale(${s/200})">${(t.motiv || []).map(m => temaMotiv(m.m, m.x, m.y, m.s, m.r, m.f)).join('')}</g>`;
  }
  bg.insertAdjacentHTML('afterend', `<svg class="temalag" viewBox="0 0 ${W} ${H}" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">${lag}</svg>`);
}

/* ═════════ VALG AV TEMA ═════════
   Én måte å velge på: en stripe over plakaten (Ingen + temaene for denne og neste måned + «Alle temaer …»),
   og et vindu i samme stil som «Velg mal» med alle temaene, vist på malen brukeren har valgt. */
const TEMA_MND = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];
// Hvor mange måneder til temaet er aktuelt (0 = nå). Temaer uten måneder passer hele året.
const temaAvstand = t => !t.maaneder.length ? 99 : Math.min(...t.maaneder.map(m => (m - (new Date().getMonth() + 1) + 12) % 12));
const temaMnd = t => t.maaneder.length ? t.maaneder.map(m => TEMA_MND[m-1]).join('–') : 'Hele året';
// Lite ikon av temaets hovedmotiv (første motiv i illustrasjonen)
function temaIkon(t){
  const m = t && (t.motiv || [])[0];
  return m ? `<svg viewBox="0 0 200 200" aria-hidden="true">${temaMotiv(m.m, 0, 0, 200, 0, m.f)}</svg>` : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" stroke="#5d6b74" stroke-width="2" stroke-linecap="round"/></svg>';
}
function tegnTemavalg(){
  const stripe = $('temastripe'); if(!stripe) return;
  const kan = !!TEMA_PLASS[S.tpl] && TEMA_REKKE.length > 0;
  stripe.classList.toggle('hide', !kan);
  // Slørfargen styres av temaet: vis det i sidepanelet
  const t = aktivtTema();
  $('sec-slor').classList.toggle('styrt', !!t);
  $('slortema').classList.toggle('hide', !t);
  if(t) $('slortema').textContent = `Slørfargen styres av temaet «${t.navn}». Velg «Ingen» tema over plakaten for å velge selv.`;
  if(!kan) return;
  const aktuelle = TEMA_REKKE.map(id => TEMAER[id]).filter(x => x && x.maaneder.length && temaAvstand(x) <= 1).sort((a, b) => temaAvstand(a) - temaAvstand(b)).slice(0, 4);
  const vis = [{id:'', navn:'Ingen'}, ...aktuelle];
  if(S.tema && TEMAER[S.tema] && !vis.some(c => c.id === S.tema)) vis.push(TEMAER[S.tema]);
  stripe.innerHTML = `<span class="tl">Tema</span>` + vis.map(c => `<button class="tchip" data-tema="${c.id}" aria-pressed="${(S.tema||'') === c.id}"><span class="ti">${temaIkon(c.id ? c : null)}</span>${esc(c.navn)}</button>`).join('')
    + `<button class="tchip flere" id="temaflere">Alle temaer …</button>`;
}
function apneTemavalg(){
  const q = ($('temasok').value || '').trim().toLowerCase();
  const treff = t => !q || (t.navn + ' ' + t.sub + ' ' + (t.motiv||[]).map(m => (MOTIVER[m.m]||{}).navn||'').join(' ')).toLowerCase().includes(q);
  const kort = (id, navn, mnd) => `<button class="skort${(S.tema||'') === id ? ' on' : ''}" data-tema="${id}" aria-pressed="${(S.tema||'') === id}"><div class="thumb"></div>${id ? `<span class="tmerke">${temaIkon(TEMAER[id])}</span>` : ''}<span class="lbl">${esc(navn)}</span>${mnd ? `<span class="mnd">${mnd}</span>` : ''}</button>`;
  const gruppe = (navn, tekst, liste) => liste.length ? `<div class="sgrp"><h3>${navn}</h3><p>${tekst}</p><div class="srow">${liste.map(t => kort(t.id, t.navn, temaMnd(t))).join('')}</div></div>` : '';
  const alle = TEMA_REKKE.map(id => TEMAER[id]).filter(t => t && treff(t));
  $('temagrp').innerHTML = (q ? '' : `<div class="sgrp"><h3>Uten tema</h3><p>Malen slik den er.</p><div class="srow">${kort('', 'Ingen tema', '')}</div></div>`)
    + gruppe('Årshjulet', 'Høytider og årstider, de neste først.', alle.filter(t => t.kategori === 'arshjul').sort((a, b) => temaAvstand(a) - temaAvstand(b)))
    + gruppe('Aktiviteter', 'Passer hele året.', alle.filter(t => t.kategori === 'aktivitet'))
    || '<p class="sintro">Ingen temaer passer søket.</p>';
  $('temamodal').classList.add('on');
  // Miniatyrene viser malen brukeren har valgt, med hvert tema
  setTimeout(() => $('temagrp').querySelectorAll('.skort').forEach(b => {
    const eget = S.tema; S.tema = b.dataset.tema || null;
    try { miniatyr(b.querySelector('.thumb'), S.tpl); } finally { S.tema = eget; }
  }), 30);
}
function initTema(){
  const velg = id => { S.tema = id || null; $('temamodal').classList.remove('on'); fillForm(); render(); renderThumbs(); };
  $('temastripe').addEventListener('click', e => {
    if(e.target.closest('#temaflere')){ $('temasok').value = ''; apneTemavalg(); setTimeout(() => $('temasok').focus(), 50); return; }
    const b = e.target.closest('.tchip[data-tema]'); if(b) velg(b.dataset.tema);
  });
  $('temagrp').addEventListener('click', e => { const b = e.target.closest('.skort[data-tema]'); if(b) velg(b.dataset.tema); });
  $('temalukk').onclick = () => $('temamodal').classList.remove('on');
  $('temamodal').addEventListener('click', e => { if(e.target.id === 'temamodal') $('temamodal').classList.remove('on'); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') $('temamodal').classList.remove('on'); });
  let t = null; $('temasok').addEventListener('input', () => { clearTimeout(t); t = setTimeout(apneTemavalg, 150); });
}
