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

/* ═════════ VALG AV TEMA I SIDEPANELET ═════════ */
const TEMA_MND = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];
// Hvor mange måneder til temaet er aktuelt (0 = nå). Temaer uten måneder passer hele året.
const temaAvstand = t => !t.maaneder.length ? 99 : Math.min(...t.maaneder.map(m => (m - (new Date().getMonth() + 1) + 12) % 12));
function tegnTemavalg(){
  const sec = $('sec-tema'); if(!sec) return;
  const kan = !!TEMA_PLASS[S.tpl] && TEMA_REKKE.length > 0;
  sec.classList.toggle('hide', !kan);
  if(!kan) return;
  const aktuelle = TEMA_REKKE.map(id => TEMAER[id]).filter(t => t && t.maaneder.length && temaAvstand(t) <= 1).sort((a, b) => temaAvstand(a) - temaAvstand(b)).slice(0, 4);
  const chips = [{id:'', navn:'Ingen'}, ...aktuelle];
  if(S.tema && TEMAER[S.tema] && !chips.some(c => c.id === S.tema)) chips.push(TEMAER[S.tema]);
  $('temachips').innerHTML = chips.map(c => `<button class="tchip" data-tema="${c.id}" aria-pressed="${(S.tema||'') === c.id}">${esc(c.navn)}</button>`).join('');
  const gruppe = (navn, kat) => `<optgroup label="${navn}">${TEMA_REKKE.map(id => TEMAER[id]).filter(t => t && t.kategori === kat)
    .map(t => `<option value="${t.id}"${S.tema === t.id ? ' selected' : ''}>${esc(t.navn)}${t.maaneder.length ? ' (' + t.maaneder.map(m => TEMA_MND[m-1]).join('–') + ')' : ''}</option>`).join('')}</optgroup>`;
  $('temavalg').innerHTML = `<option value="">Flere temaer …</option>` + gruppe('Årshjulet', 'arshjul') + gruppe('Aktiviteter', 'aktivitet');
  $('temavalg').value = S.tema || '';
  $('temanote').textContent = S.tema && TEMAER[S.tema] ? 'Temaet bestemmer slørfargen og legger til motiver. Velg «Ingen» for å fjerne det.' : 'Legg til farge og motiver for en høytid eller aktivitet. Teksten og malen er den samme.';
}
function initTema(){
  const velg = id => { S.tema = id || null; fillForm(); render(); renderThumbs(); };
  $('temachips').addEventListener('click', e => { const b = e.target.closest('.tchip'); if(b) velg(b.dataset.tema); });
  $('temavalg').addEventListener('change', e => velg(e.target.value));
}
