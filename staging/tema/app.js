/* Temaplakater (staging/tema/): tema, variant og tekst gir en ferdig A4-plakat. Forslag, ikke godkjent av designer. */
'use strict';
/* ═════════ PROFIL (Tønsberg kommunes grafiske profil, s. 8–9) ═════════ */
const P = {navy:'#013952', gronn:'#c5daaf', rod:'#923c3d', korall:'#e69d7d', gul:'#f1be48', lysbla:'#91cef2', morkgronn:'#00714e', gra:'#4a4a49', hvit:'#ffffff', sort:'#1d1d1b'};
const W = 794, H = 1123;
const PANEL = {x0:29.3, y0:28.9, x1:766.3, y1:1092.3, r:56.7};
const rrect = (x0,y0,x1,y1,r) => `M${x0},${y0+r} Q${x0},${y0} ${x0+r},${y0} L${x1-r},${y0} Q${x1},${y0} ${x1},${y0+r} L${x1},${y1-r} Q${x1},${y1} ${x1-r},${y1} L${x0+r},${y1} Q${x0},${y1} ${x0},${y1-r} Z`;
const PANEL_D = rrect(PANEL.x0,PANEL.y0,PANEL.x1,PANEL.y1,PANEL.r);
const LOGO = {src:'../grafikk/logo.png', x:90, y:49, w:89, ratio:1.0781};
const MND = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];
const MALGRUPPER = {alle:'Alle', barn:'Barn', ungdom:'Ungdom', voksne:'Voksne', senior:'Senior', ansatte:'Ansatte'};

/* ═════════ VARIANTER (felles oppsett for alle temaer) ═════════
   bolgeY: bølgeparet flyttes bare loddrett. helt: [x, y, størrelse, rotasjon, foran bølgen]. fri: felt der dekor ikke legges. */
const VAR = {
  illustrasjon:{navn:'Illustrasjon', bolgeY:-6,   helt:[207,100,390,0,true],  fri:[[207,100,597,490],[50,520,744,730]]},
  tittel:      {navn:'Stor tittel',  bolgeY:-12,   helt:[440,450,310,-4,true], fri:[[70,210,730,580],[440,450,760,770],[80,590,290,780]]},
  invitasjon:  {navn:'Invitasjon',   bolgeY:-280, helt:[530,40,220,4,false],  fri:[[530,40,750,260],[70,190,690,400]]},
};

const FELT = [
  {k:'stikk', navn:'Stikktittel', maks:'maks 4 ord'},
  {k:'tittel', navn:'Tittel', maks:'1–2 ord, **uthev**'},
  {k:'ingress', navn:'Ingress', multi:true, vis:['invitasjon']},
  {k:'praktisk', navn:'Praktisk info', multi:true, maks:'«Etikett: verdi», én per linje'},
  {k:'merke', navn:'Merke', multi:true, maks:'kort, kan stå tomt'},
  {k:'hilsen', navn:'Håndskrevet hilsen', vis:['tittel','invitasjon']},
  {k:'url', navn:'Nettadresse (QR-kode)'},
  {k:'qr', navn:'Tekst ved QR', multi:true},
  {k:'arr', navn:'Arrangør', maks:'nederst til venstre, kan stå tomt'},
];

/* ═════════ TEMAER: lastes fra temaer/*.json ═════════ */
let TEMA = {}, REKKE = [];
async function lastTemaer(){
  REKKE = await (await fetch('temaer/index.json')).json();
  const alle = await Promise.all(REKKE.map(id => fetch(`temaer/${id}.json`).then(r => r.json())));
  alle.forEach(t => { TEMA[t.id] = t; });
}

/* Farger som følger av temaet. Lyst panel gir mørk tekst, mørkt panel gir lys tekst. */
function lum(h){ const c = h.replace('#','').match(/../g).map(x => { x = parseInt(x,16)/255; return x <= .03928 ? x/12.92 : Math.pow((x+.055)/1.055, 2.4); }); return .2126*c[0] + .7152*c[1] + .0722*c[2]; }
function farger(t){
  const lys = lum(P[t.panel]) > .3;
  const f = {
    lys, panel:P[t.panel], bolge:P[t.bolge], slor:P[t.slor],
    panelTekst: lys ? P.navy : P.hvit,
    stikk: P[t.stikk || (lys ? 'rod' : 'gul')],
    uthev: P[t.uthev || (lys ? 'rod' : 'gul')],
    bolgeTekst: t.bolge === 'hvit' ? P.navy : P.hvit,
    merke: (t.merke || (lys ? ['navy','hvit'] : ['gul','navy'])).map(n => P[n]),
  };
  f.hilsenBolge = t.bolge === 'hvit' ? P.rod : P.gul;
  return f;
}

const merkeFarger = (c, flate) => c.merke[0] !== flate ? c.merke : [[P.gul,P.navy],[P.korall,P.navy],[P.navy,P.hvit]].find(([bg]) => bg !== flate);

/* ═════════ TILSTAND ═════════ */
const LS_PREFIKS = 'staging-';   // settes til '' ved opprykk, som i js/oppsett.js
const LS = LS_PREFIKS + 'temaplakater-v2';
let S = {tema:null, variant:'illustrasjon', tekst:{}, kat:'na', mal:'', sok:''};
try { const l = JSON.parse(localStorage.getItem(LS)||'null'); if(l) S = Object.assign(S, l, {sok:''}); } catch(e){}
const lagre = () => { try { localStorage.setItem(LS, JSON.stringify(Object.assign({}, S, {sok:''}))); } catch(e){} };
const tekstFor = id => (S.tekst[id] = Object.assign({}, TEMA[id].demo, S.tekst[id]||{}));
const T = () => tekstFor(S.tema);

/* ═════════ HJELPERE ═════════ */
const esc = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const rik = (s,farge) => esc(s).replace(/\*\*(.+?)\*\*/g, `<mark style="color:${farge}">$1</mark>`);
const fet = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const prak = s => String(s||'').split('\n').filter(l=>l.trim()).map(l => { const i = l.indexOf(':'); return i>0 && i<20 ? `<div><b>${esc(l.slice(0,i+1))}</b> ${esc(l.slice(i+1).trim())}</div>` : `<div>${esc(l)}</div>`; }).join('');

function qrSvg(url, farge){
  try {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    const q = qrcode(0,'M'); q.addData(url||' '); q.make();
    const n = q.getModuleCount(); let d='';
    for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(q.isDark(r,c)) d+=`M${c},${r}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><path d="${d}" fill="${farge}"/></svg>`;
  } catch(e){ return ''; }
}

/* Ett motiv fra biblioteket, plassert i en boks (x, y, størrelse, rotasjon). Fargene er profilnavn. */
let uidTeller = 0;
function motiv(id, x, y, s, r, fargeNavn, uid){
  const m = MOTIVER[id]; if(!m) return '';
  const f = m.farger.map((d,i) => P[(fargeNavn && fargeNavn[i]) || d] || P[d]);
  return `<g transform="translate(${x},${y}) rotate(${r||0} ${s/2} ${s/2}) scale(${(s/200).toFixed(4)})">${m.svg(...f).replace(/§/g, uid + (uidTeller++))}</g>`;
}

/* Mønstre i panelet (valgfritt per tema) */
const MONSTER = {
  teppe: () => { let s=''; for(let i=0;i<9;i++){ const x = 29 + i*86; s += `<rect x="${x}" y="0" width="43" height="1123" fill="#000" opacity=".12"/><rect x="${x+43}" y="0" width="8" height="1123" fill="#fff" opacity=".06"/>`; } return s + `<path d="M397 -40 L120 1123 L680 1123 Z" fill="${P.gul}" opacity=".10"/>`; },
  bane: () => { let s=''; for(let i=0;i<14;i++) if(i%2) s += `<rect x="0" y="${i*80}" width="794" height="80" fill="#fff" opacity=".05"/>`;
    return s + `<g stroke="#fff" stroke-width="5" fill="none" opacity=".28"><circle cx="397" cy="540" r="150"/><path d="M0 540 H794"/><circle cx="397" cy="540" r="6" fill="#fff"/><path d="M574 28.9 V140 H220 V28.9"/></g>`; },
};

/* Dekor: små motiver strødd på faste plasser, utenom tekst, illustrasjon, logo og bølge */
const PLASSER = (() => { let a = 7, out = []; const rnd = () => (a = (a*16807) % 2147483647) / 2147483647;
  for(let i=0;i<120;i++) out.push([60 + rnd()*680, 60 + rnd()*900, 18 + rnd()*26, (rnd()*60-30)|0]); return out; })();
function dekor(t, varId, uid){
  const d = t.dekor || {}; if(!d.antall || !(d.motiver||[]).length) return '';
  const v = VAR[varId], by = v.bolgeY;
  const ledig = ([x,y,s]) => {
    if(x < 280 && y < 200) return false;                                   // logo
    if(y + s > 869 - (x/794)*150 - 45 + by) return false;                  // over bølgen
    return !v.fri.some(([x0,y0,x1,y1]) => x > x0-s && x < x1+s && y > y0-s && y < y1+s);
  };
  let s = '', n = 0;
  for(const p of PLASSER){ if(n >= d.antall) break; if(!ledig(p)) continue;
    const id = d.motiver[n % d.motiver.length], fa = d.farger ? [d.farger[n % d.farger.length]] : null;
    s += `<g opacity="${d.dekning||.5}">${motiv(id, p[0]-p[2]/2, p[1]-p[2]/2, p[2], p[3], fa, uid)}</g>`; n++; }
  return s;
}

// Redigerbart element. Tomme felt vises som hjelpetekst bare i redigering.
function F(x, k, tag, cls, style, html, edit){
  const tom = !String(x[k]||'').trim();
  if(tom && !edit) return '';
  const inner = tom ? esc(FELT.find(f=>f.k===k).navn) : html;
  return `<${tag} class="${cls}${tom?' tom':''}" style="${style||''}" data-k="${k}"${edit?' contenteditable="plaintext-only" spellcheck="true"':''}>${inner}</${tag}>`;
}

/* ═════════ TEGNING ═════════ */
function bygg(temaId, varId, edit, uid){
  const t = TEMA[temaId], v = VAR[varId], x = tekstFor(temaId), c = farger(t);
  const [hx,hy,hs,hr,foran] = v.helt;
  const helt = `<g transform="translate(${hx},${hy}) rotate(${hr} ${hs/2} ${hs/2}) scale(${hs/200})">${t.helt.map(m => motiv(m.m, m.x, m.y, m.s, m.r, m.f, uid)).join('')}</g>`;

  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <defs>
      <clipPath id="${uid}pc"><path d="${PANEL_D}"/></clipPath>
      <radialGradient id="${uid}rg" gradientUnits="userSpaceOnUse" cx="420" cy="380" r="560"><stop offset="0" stop-color="#fff" stop-opacity="${c.lys?.22:.12}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="459.1" y1="745.8" x2="471" y2="817.9"><stop offset="0" stop-color="${c.slor}" stop-opacity=".75"/><stop offset="1" stop-color="${c.slor}" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <g clip-path="url(#${uid}pc)">
      <rect width="${W}" height="${H}" fill="${c.panel}"/>
      <rect width="${W}" height="${H}" fill="url(#${uid}rg)"/>
      ${t.monster && MONSTER[t.monster] ? MONSTER[t.monster]() : ''}
      ${dekor(t, varId, uid)}
      ${foran ? '' : helt}
      <g transform="translate(0,${v.bolgeY})"><path d="${FS8.gronn}" fill="url(#${uid}sl)"/><path d="${FS8.navy}" fill="${c.bolge}"/><rect x="-20" y="1240" width="${W+40}" height="600" fill="${c.bolge}"/></g>
      ${foran ? helt : ''}
    </g>
    <path d="${FS8.hvit}" fill="#fff"/><path d="${FS8.hale}" fill="#fff"/>
  </svg>`;

  const logo = `<img class="logo" src="${LOGO.src}" alt="Tønsberg kommune" style="left:${LOGO.x}px;top:${LOGO.y}px;width:${LOGO.w}px;height:${(LOGO.w*LOGO.ratio).toFixed(1)}px">`;
  const pt = c.panelTekst, bt = c.bolgeTekst;
  const stikk = () => F(x,'stikk','div','stikk',`color:${c.stikk}`, esc(x.stikk), edit);
  const tittel = fs => F(x,'tittel','h1','tittel',`color:${pt};font-size:${fs}px`, rik(x.tittel,c.uthev), edit);
  const ingress = () => F(x,'ingress','p','ingress',`color:${bt}`, esc(x.ingress), edit);
  const prakt = () => F(x,'praktisk','div','prak',`color:${bt}`, prak(x.praktisk), edit);
  const hilsen = (col,extra) => F(x,'hilsen','p','hilsen',`color:${col};${extra||''}`, esc(x.hilsen), edit);
  // Merket må skille seg fra flaten det ligger på (panelet eller bølgen)
  const mf = flate => merkeFarger(c, flate);
  const merke = (l,tp,d,rot,flate) => (String(x.merke||'').trim() || edit) ? `<div class="merke" style="left:${l}px;top:${tp}px;width:${d}px;height:${d}px;background:${mf(flate)[0]};color:${mf(flate)[1]};font-size:${d*.15}px;transform:rotate(${rot}deg)">${F(x,'merke','div','','', esc(x.merke), edit)}</div>` : '';
  const box = (l,tp,w,h,base,inner,extra) => `<div class="tx" data-fit="${base}" style="left:${l}px;top:${tp}px;width:${w}px;height:${h}px;font-size:${base}px;${extra||''}">${inner}</div>`;
  // Bunnlinja: arrangør til venstre, tekst og QR-kode til høyre, på samme linje (logoen viser allerede avsender)
  const arr = String(x.arr||'').trim() || edit ? `<div class="arr" style="color:${bt}"><div class="lbl">Arrangør</div>${F(x,'arr','div','navn','', esc(x.arr), edit)}</div>` : '<div></div>';
  const qr = `<div class="bunn">${arr}<div class="qrblokk"><div class="qrt" style="color:${bt}">${F(x,'qr','div','','', fet(x.qr), edit)}</div><div class="qr">${qrSvg(x.url, P.navy)}</div></div></div>`;

  let tekst = '';
  if(varId==='illustrasjon'){
    tekst = box(50,472,694,210,17, stikk() + tittel(104), 'align-items:center;text-align:center;justify-content:flex-end')
          + box(80,852,440,134,17, prakt(), 'justify-content:flex-end')
          + merke(596,110,150,8,c.panel);
  } else if(varId==='tittel'){
    tekst = box(80,232,650,330,17, stikk() + tittel(124) + hilsen(c.stikk,'margin-top:18px;font-size:58px'), 'justify-content:flex-start')
          + box(80,852,440,134,17, prakt(), 'justify-content:flex-end')
          + merke(92,600,176,-8,c.panel);
  } else {
    tekst = box(80,200,600,190,17, stikk() + tittel(96), 'justify-content:flex-end')
          + box(80,600,620,110,17, ingress(), 'justify-content:flex-start')
          + box(80,720,440,210,17, prakt() + hilsen(c.hilsenBolge,'margin-top:16px'), 'justify-content:flex-start')
          + merke(565,660,165,7,c.bolge);
  }
  return `<div class="plakat${edit?' edit':''}" data-plakat="${temaId}">${svg}${logo}${tekst}${qr}</div>`;
}

/* Tekstpassing: krymp boksen til den passer (ned til 62 %), ellers marker feltet. */
function tilpass(root){
  const over = [];
  root.querySelectorAll('[data-fit]').forEach(b => {
    const base = +b.dataset.fit; let s = 1;
    const tittel = b.querySelector('.tittel'); const tf = tittel ? parseFloat(tittel.style.fontSize) : 0;
    const sett = () => { b.style.fontSize = base*s+'px'; b.querySelectorAll('.stikk,.ingress,.prak,.hilsen').forEach(e => e.style.zoom = s); if(tittel) tittel.style.fontSize = tf*s+'px'; };
    const flyter = () => b.scrollHeight > b.clientHeight + 3 || [...b.children].some(c => c.scrollWidth > c.clientWidth + 2);
    sett();
    while(flyter() && s > .62){ s -= .03; sett(); }
    b.querySelectorAll('[data-k]').forEach(e => e.classList.remove('over'));
    if(flyter()){ const k = b.querySelector('[data-k]:not(.tom)'); if(k){ k.classList.add('over'); over.push(k.dataset.k); } }
  });
  return over;
}

/* ═════════ FILTER ═════════ */
const naMnd = new Date().getMonth() + 1;
const KAT = {na:'Aktuelt nå', alle:'Alle', arshjul:'Årshjulet', aktivitet:'Aktiviteter'};
// Hvor mange måneder til temaet er aktuelt (0 = nå). Temaer uten måneder passer hele året.
const avstand = t => !t.maaneder.length ? 99 : Math.min(...t.maaneder.map(m => (m - naMnd + 12) % 12));
function synlige(){
  const q = S.sok.trim().toLowerCase();
  let liste = REKKE.map(id => TEMA[id]).filter(t =>
    (!S.mal || t.malgrupper.includes(S.mal) || t.malgrupper.includes('alle')) &&
    (!q || [t.navn, t.sub, t.id, ...(t.helt||[]).map(m => (MOTIVER[m.m]||{}).navn||'')].join(' ').toLowerCase().includes(q)));
  if(S.kat === 'arshjul' || S.kat === 'aktivitet') liste = liste.filter(t => t.kategori === S.kat);
  if(S.kat === 'na') liste = liste.filter(t => avstand(t) <= 1 || !t.maaneder.length).sort((a,b) => avstand(a) - avstand(b));
  if(S.kat === 'arshjul') liste.sort((a,b) => avstand(a) - avstand(b));
  return liste;
}

/* ═════════ VISNING ═════════ */
const $ = id => document.getElementById(id);
const miniCache = {};
function mini(id, varId){
  const key = id + '|' + varId + '|' + JSON.stringify(S.tekst[id]||{});
  if(!miniCache[key]) miniCache[key] = bygg(id, varId, false, 'm' + Math.random().toString(36).slice(2,7));
  return miniCache[key];
}
function skalerMinier(root){
  root.querySelectorAll('.kort .mini').forEach(m => { const d = m.firstElementChild; if(!d || d.dataset.ok) return; d.style.transform = `scale(${m.clientWidth/794})`; tilpass(d); d.dataset.ok = 1; });
}

function tegnFilter(){
  $('kategorier').innerHTML = Object.entries(KAT).map(([k,n]) => `<button class="chip" data-kat="${k}" aria-pressed="${k===S.kat}">${k==='na' ? `Nå (${MND[naMnd-1]})` : n}</button>`).join('');
  $('malgruppe').innerHTML = `<option value="">Alle målgrupper</option>` + Object.entries(MALGRUPPER).filter(([k]) => k!=='alle').map(([k,n]) => `<option value="${k}"${S.mal===k?' selected':''}>${n}</option>`).join('');
}

function tegnTemaer(){
  const liste = synlige();
  $('antall').textContent = `${liste.length} av ${REKKE.length} temaer`;
  const kort = t => `<button class="kort" data-tema="${t.id}" aria-pressed="${t.id===S.tema}"><div class="mini">${mini(t.id, S.variant)}</div><b>${esc(t.navn)}</b><small>${t.maaneder.length ? t.maaneder.map(m => MND[m-1].slice(0,3)).join('–') : 'Hele året'}</small></button>`;
  let html;
  if(S.kat === 'na'){
    const na = liste.filter(t => t.maaneder.length), hele = liste.filter(t => !t.maaneder.length);
    html = (na.length ? `<div class="gruppe">Denne og neste måned</div>` + na.map(kort).join('') : '') + (hele.length ? `<div class="gruppe">Passer hele året</div>` + hele.map(kort).join('') : '');
  } else html = liste.map(kort).join('');
  $('temaer').innerHTML = html || `<p class="tom-liste">Ingen temaer passer. Prøv et annet søk eller en annen målgruppe.</p>`;
  requestAnimationFrame(() => skalerMinier($('temaer')));
}

function tegnVarianter(){
  $('varianter').innerHTML = Object.entries(VAR).map(([k,v]) => `<button class="kort" data-var="${k}" aria-pressed="${k===S.variant}"><div class="mini">${mini(S.tema,k)}</div><b>${v.navn}</b></button>`).join('');
  requestAnimationFrame(() => skalerMinier($('varianter')));
}

function tegnFelt(){
  $('felt').innerHTML = FELT.filter(f => !f.vis || f.vis.includes(S.variant)).map(f => {
    const v = esc(T()[f.k]); const lab = `<label for="f-${f.k}">${f.navn}${f.maks?` <em>(${f.maks})</em>`:''}</label>`;
    return lab + (f.multi ? `<textarea id="f-${f.k}" data-f="${f.k}" rows="${f.k==='praktisk'?3:2}">${v}</textarea>` : `<input id="f-${f.k}" data-f="${f.k}" value="${v}">`);
  }).join('');
}

function skala(){
  const sc = $('scene'), r = $('ramme'), p = r.firstElementChild; if(!p) return;
  const s = Math.min((sc.clientWidth-56)/794, (sc.clientHeight-56)/1123, 1.2);
  p.style.transform = `scale(${s})`; r.style.width = 794*s+'px'; r.style.height = 1123*s+'px';
}

function tegn(){
  $('ramme').innerHTML = bygg(S.tema, S.variant, true, 'p');
  skala();
  const over = tilpass($('ramme').firstElementChild);
  document.querySelectorAll('[data-f]').forEach(e => e.classList.toggle('over', over.includes(e.dataset.f)));
  $('varsel').className = 'varsel' + (over.length ? ' feil' : '');
  $('varsel').textContent = over.length ? `For lang tekst i: ${over.map(k => FELT.find(f=>f.k===k).navn).join(', ')}. Kort ned, ellers blir noe kuttet.` : '';
}

function velgTema(id){
  S.tema = id; lagre();
  document.querySelectorAll('#temaer .kort').forEach(k => k.setAttribute('aria-pressed', k.dataset.tema === id));
  tegnVarianter(); tegnFelt(); tegn();
}

/* ═════════ HENDELSER ═════════ */
document.addEventListener('click', e => {
  const k = e.target.closest('.kort[data-tema]'); if(k){ velgTema(k.dataset.tema); return; }
  const v = e.target.closest('.kort[data-var]'); if(v){ S.variant = v.dataset.var; lagre(); tegnTemaer(); tegnVarianter(); tegnFelt(); tegn(); return; }
  const c = e.target.closest('.chip[data-kat]'); if(c){ S.kat = c.dataset.kat; lagre(); tegnFilter(); tegnTemaer(); }
});
$('sok').addEventListener('input', e => { S.sok = e.target.value; clearTimeout(tegnTemaer.t); tegnTemaer.t = setTimeout(tegnTemaer, 150); });
$('malgruppe').addEventListener('change', e => { S.mal = e.target.value; lagre(); tegnTemaer(); });
const oppdaterMinier = () => { tegnVarianter(); const kort = document.querySelector(`#temaer .kort[data-tema="${S.tema}"] .mini`); if(kort){ kort.innerHTML = mini(S.tema, S.variant); skalerMinier($('temaer')); } };
$('felt').addEventListener('input', e => { const k = e.target.dataset.f; if(!k) return; T()[k] = e.target.value; lagre(); clearTimeout(tegn.t); tegn.t = setTimeout(() => { tegn(); oppdaterMinier(); }, 300); });
$('ramme').addEventListener('focusin', e => { const el = e.target.closest('[data-k]'); if(!el) return; el.textContent = T()[el.dataset.k] || ''; el.classList.remove('tom'); });
$('ramme').addEventListener('focusout', e => { const el = e.target.closest('[data-k]'); if(!el) return; T()[el.dataset.k] = el.innerText.replace(/\n+$/,''); lagre(); const f = $('f-'+el.dataset.k); if(f) f.value = T()[el.dataset.k]; setTimeout(() => { if(!$('ramme').contains(document.activeElement)) { tegn(); oppdaterMinier(); } }, 0); });
$('ramme').addEventListener('input', e => { const el = e.target.closest('[data-k]'); if(!el) return; const f = $('f-'+el.dataset.k); if(f) f.value = el.innerText; });
$('ramme').addEventListener('keydown', e => { const el = e.target.closest('[data-k]'); if(e.key==='Escape' && el) el.blur(); if(e.key==='Enter' && el && !['praktisk','merke','qr','ingress'].includes(el.dataset.k)){ e.preventDefault(); el.blur(); } });
$('nullstill').addEventListener('click', e => {
  const b = e.currentTarget;
  if(b.dataset.sikker){ S.tekst[S.tema] = Object.assign({}, TEMA[S.tema].demo); lagre(); tegnFelt(); tegn(); oppdaterMinier(); b.textContent = 'Tilbakestill tekst'; delete b.dataset.sikker; return; }
  b.dataset.sikker = 1; b.textContent = 'Sikker? Trykk igjen'; setTimeout(() => { b.textContent = 'Tilbakestill tekst'; delete b.dataset.sikker; }, 3000);
});
window.addEventListener('resize', skala);

/* ═════════ EKSPORT (fra en uskalert kopi uten redigeringsmarkering) ═════════ */
async function last(blob, navn){
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = navn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
}
async function lagBilde(){
  const hold = document.createElement('div');
  hold.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px';
  hold.innerHTML = bygg(S.tema, S.variant, false, 'x');
  document.body.appendChild(hold);
  const p = hold.firstElementChild; tilpass(p);
  await document.fonts.ready;
  await Promise.all([...p.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  try { return await htmlToImage.toCanvas(p, {pixelRatio: 3, width: 794, height: 1123, cacheBust: false}); }
  finally { hold.remove(); }
}
const filnavn = ext => `${TEMA[S.tema].navn.toLowerCase().replace(/[^a-zæøå0-9]+/g,'-')}-${S.variant}.${ext}`;
async function eksport(type, knapp){
  knapp.disabled = true; const t0 = knapp.textContent; knapp.textContent = 'Lager …';
  try {
    const cv = await lagBilde();
    if(type==='png') await last(await new Promise(r => cv.toBlob(r, 'image/png')), filnavn('png'));
    else { const pdf = new jspdf.jsPDF({unit:'mm', format:'a4', compress:true}); pdf.addImage(cv.toDataURL('image/jpeg', .92), 'JPEG', 0, 0, 210, 297); await last(pdf.output('blob'), filnavn('pdf')); }
    const demo = ['praktisk','url'].some(k => T()[k] === TEMA[S.tema].demo[k]);
    $('varsel').className = 'varsel'; $('varsel').textContent = demo ? 'Lastet ned. Obs: praktisk info eller nettadresse er fortsatt eksempeltekst.' : 'Lastet ned.';
  } catch(err){ $('varsel').className = 'varsel feil'; $('varsel').textContent = 'Nedlastingen feilet: ' + (err && err.message || err); }
  finally { knapp.disabled = false; knapp.textContent = t0; }
}
$('lastPng').addEventListener('click', e => eksport('png', e.currentTarget));
$('lastPdf').addEventListener('click', e => eksport('pdf', e.currentTarget));

/* ═════════ START ═════════ */
(async () => {
  try { await lastTemaer(); }
  catch(err){ document.querySelector('.scene').innerHTML = '<p class="varsel feil" style="max-width:420px">Fant ikke temaene (temaer/*.json). Åpne appen via en webserver, ikke som fil.</p>'; return; }
  if(!TEMA[S.tema]) S.tema = (synlige()[0] || TEMA[REKKE[0]]).id;
  if(!VAR[S.variant]) S.variant = 'illustrasjon';
  await document.fonts.ready;
  tegnFilter(); tegnTemaer(); tegnVarianter(); tegnFelt(); tegn();
})();
