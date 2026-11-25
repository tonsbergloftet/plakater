/* Kvalitetssjekk: lesbarhet på bilde, oppløsning og miniatyrer */
'use strict';
/* ═════════ KVALITETSSJEKK ═════════
   To små, automatiske sjekker som bare sier fra når noe er galt:
   1. Lesbarhet i mal 1: leser bildet bak teksten og regner ut kontrasten (WCAG) mot tekstfargen.
      Velger selv riktig variant når et nytt bilde legges inn, og foreslår bytte ellers.
   2. Oppløsning: varsler når et bilde er for lite til å bli skarpt på trykk eller skjerm. */
let sjekkTimer = null, autoVariant = true, tipsLukket = '';
const bildeCache = {};
function lastBilde(src){
  if(!bildeCache[src]) bildeCache[src] = new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  return bildeCache[src];
}
function planleggSjekk(){ clearTimeout(sjekkTimer); sjekkTimer = setTimeout(sjekkKvalitet, 350); }
const lum = (r,g,b) => { const f = c => { c /= 255; return c <= .03928 ? c/12.92 : Math.pow((c+.055)/1.055, 2.4); }; return .2126*f(r) + .7152*f(g) + .0722*f(b); };
// Andel av tekstflaten med kontrast under 3:1 for lys (mørk tekst) og mørk (hvit tekst) variant
async function kontrastMal1(page){
  const I = S.imgs[0]; if(!I || !I.src) return null;
  const im = await lastBilde(I.src); if(!im) return null;
  const A = S.fmt === 'a4', pn = A ? {x:29.3,y:28.9,w:737,h:1063.4} : {x:20,y:20,w:1240,h:680};
  const sc = Math.max(pn.w/I.w, pn.h/I.h) * (I.z||1), w = I.w*sc, h = I.h*sc;
  const ix = pn.x + (pn.w-w)*(I.fx/100), iy = pn.y + (pn.h-h)*(I.fy/100);
  // Tekstlinjene (ikke hele boksen) i plakatens koordinater
  const pr = page.getBoundingClientRect(), k = pr.width / page.offsetWidth, ruter = [];
  page.querySelectorAll('.bp1 .ed, .bp1 .stikk, .bp1 .tittel, .bp1 .ingress').forEach(el => {
    if(!el.textContent.trim() || el.classList.contains('tom')) return;
    const r = document.createRange(); r.selectNodeContents(el);
    [...r.getClientRects()].forEach(q => { if(q.width > 2) ruter.push({x:(q.left-pr.left)/k, y:(q.top-pr.top)/k, w:q.width/k, h:q.height/k}); });
  });
  if(!ruter.length) return null;
  const S2 = 0.25, cv = document.createElement('canvas'); cv.width = Math.ceil(page.offsetWidth*S2); cv.height = Math.ceil(page.offsetHeight*S2);
  const cx = cv.getContext('2d', {willReadFrequently:true});
  cx.drawImage(im, ix*S2, iy*S2, w*S2, h*S2);
  const px = cx.getImageData(0, 0, cv.width, cv.height).data;
  const vg = A ? [638.7,-9.3,497.6,560.9] : [1100,-10,1040,420], vx = vg[2]-vg[0], vy = vg[3]-vg[1], vl = vx*vx + vy*vy;
  const tLys = lum(0x1d,0x1d,0x1b), tMork = 1;
  let n = 0, darligLys = 0, darligMork = 0;
  ruter.forEach(q => {
    for(let y = q.y; y < q.y + q.h; y += 3) for(let x = q.x; x < q.x + q.w; x += 3){
      const X = Math.floor(x*S2), Y = Math.floor(y*S2); if(X < 0 || Y < 0 || X >= cv.width || Y >= cv.height) continue;
      const i = (Y*cv.width + X)*4, t = Math.max(0, Math.min(1, ((x-vg[0])*vx + (y-vg[1])*vy) / vl)), a = .5*(1-t); // vask/mørkning som i malen
      const r = px[i], g = px[i+1], b = px[i+2];
      const lL = lum(r + (255-r)*a, g + (255-g)*a, b + (255-b)*a), lM = lum(r*(1-a), g*(1-a), b*(1-a));
      if((lL + .05) / (tLys + .05) < 3) darligLys++;
      if((tMork + .05) / (lM + .05) < 3) darligMork++;
      n++;
    }
  });
  return n ? {lys: darligLys/n, mork: darligMork/n} : null;
}
function opplosning(page){
  const ut = [];
  page.querySelectorAll('.klikkbilde[data-img]').forEach(g => {
    const n = +g.dataset.img, I = S.imgs[n], im = g.querySelector('image');
    if(!I || !I.src || I.ex || !im) return;
    const pr = I.w / (+im.getAttribute('width') || 1); // bildepiksler per plakatpiksel
    const nr = n === 4 ? 3 : n + 1;
    if(S.fmt === 'a4'){ const ppi = Math.round(pr * 96); if(ppi < 80) ut.push(`Bilde ${nr} har for lav oppløsning (ca. ${ppi} ppi) og blir synlig uskarpt på trykk. Zoom mindre inn eller bruk et større bilde.`); } // 80 ppi: grensen for synlig uskarphet på plakat sett på litt avstand
    else if(pr / FMT[S.fmt].ratio < .5) ut.push(`Bilde ${nr} er lite for denne skjermstørrelsen og kan se uskarpt ut. Bruk et større bilde eller zoom mindre inn.`);
  });
  return ut;
}
let SJEKK = {kontrast:null, opplosning:[]};
async function sjekkKvalitet(){
  const page = $('wrap').querySelector('.page'); if(!page) return;
  const tips = [];
  SJEKK.opplosning = opplosning(page);
  SJEKK.kontrast = null;
  if(S.tpl === 'bildedrevet' && S.imgs[0] && S.imgs[0].src){
    const k = await kontrastMal1(page);
    if(k){
      if(autoVariant){ // nytt bilde: velg varianten som gir best lesbarhet
        autoVariant = false;
        const bedre = k.mork < k.lys - .05;
        if(bedre !== !!S.mork){ S.mork = bedre; fillForm(); render(); return; }
      }
      const naa = S.mork ? k.mork : k.lys, annen = S.mork ? k.lys : k.mork;
      if(naa > .2){
        SJEKK.kontrast = naa;
        tips.push(annen < naa - .1
          ? {id:'kontrast', tekst:'Teksten kan bli vanskelig å lese på dette bildet.', knapp: S.mork ? 'Bytt til mørk tekst' : 'Bytt til hvit tekst', gjor: () => { S.mork = !S.mork; fillForm(); render(); }}
          : {id:'kontrast', tekst:'Teksten kan bli vanskelig å lese på dette bildet. Prøv å flytte utsnittet (klikk på bildet → «Flytt og zoom») eller velg et roligere bilde.'});
      }
    }
  }
  SJEKK.opplosning.forEach((t,i) => tips.push({id:'oppl'+i, tekst:t}));
  const nokkel = tips.map(t => t.id + t.tekst).join('|');
  const el = $('tips');
  if(!tips.length || nokkel === tipsLukket){ el.classList.remove('on'); el.innerHTML = ''; return; }
  el.innerHTML = tips.map((t,i) => `<div class="tip"><span>${esc(t.tekst)}</span>${t.knapp ? `<button class="btn pri" data-tip="${i}">${esc(t.knapp)}</button>` : ''}${i === 0 ? '<button class="lukk" data-tip="x" aria-label="Skjul">×</button>' : ''}</div>`).join('');
  el.classList.add('on');
  el.onclick = e => { const b = e.target.closest('[data-tip]'); if(!b) return; if(b.dataset.tip === 'x'){ tipsLukket = nokkel; el.classList.remove('on'); return; } const t = tips[+b.dataset.tip]; if(t && t.gjor) t.gjor(); };
}

let thumbTimer = null;
function renderThumbs(){
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(() => {
    document.querySelectorAll('.tplbtn').forEach(btn => miniatyr(btn.querySelector('.thumb'), btn.dataset.tpl));
  }, 250);
}
function miniatyr(th, k){
  th.innerHTML = '';
  const tw = th.clientWidth || 130;
  const p = buildPage(k, fmtFor(k));
  const holder = document.createElement('div');
  holder.style.position = 'relative'; holder.style.overflow = 'hidden';
  th.appendChild(holder);
  holder.appendChild(p);
  fit(p);
  p.querySelectorAll('.box.over').forEach(b => b.classList.remove('over'));
  const sc = Math.min(tw / p.offsetWidth, tw*1.415 / p.offsetHeight);
  if(p.offsetHeight > p.offsetWidth*1.5) p.style.left = ((tw - p.offsetWidth*sc)/2) + 'px';
  p.style.position = 'absolute'; p.style.transformOrigin = '0 0'; p.style.transform = `scale(${sc})`;
  holder.style.width = tw + 'px'; holder.style.height = (p.offsetHeight*sc) + 'px';
  if(k === 'bildetekst') th.insertAdjacentHTML('beforeend', '<span class="sider">2 sider</span>');
}
// Startskjermen: «Hva skal plakaten gjøre?»
function velgMal(k){ if(TPLS[S.tpl] && TPLS[S.tpl].fmts.length === 1 && TPLS[k].fmts.length > 1) S.fmt = 'a4'; // fra en skjermmal tilbake til plakat
  S.tpl = k; S.fmt = fmtFor(k); if(!TPLS[k].fmts.includes(S.fmt)) S.fmt = 'a4'; oppdaterKi(); fillForm(); render(); }
function apneStart(forsteGang){
  const g = $('startgrp');
  g.innerHTML = GRUPPER.map(gr => `<div class="sgrp"><h3>${esc(gr.navn)}</h3><p>${esc(gr.tekst)}</p><div class="srow">${gr.maler.map(k => `<button class="skort" data-tpl="${k}" title="${esc(TPLS[k].sub)}"><div class="thumb"></div><span class="lbl">${esc(TPLS[k].navn)}</span></button>`).join('')}</div></div>`).join('');
  $('start').classList.add('on');
  $('start').dataset.forste = forsteGang ? '1' : '';
  setTimeout(() => g.querySelectorAll('.skort').forEach(b => miniatyr(b.querySelector('.thumb'), b.dataset.tpl)), 30);
}

