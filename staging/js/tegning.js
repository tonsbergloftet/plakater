/* Tegning: bygger plakaten, tilpasser teksten, skalerer forhåndsvisningen og lager miniatyrer */
'use strict';
/* ═════════ RENDER ═════════ */
let uidN = 0;
const hasSide2 = () => S.tpl==='bildetekst' && S.fmt==='a4' && S.side2;
function buildPage(tpl, fmt, side, edit){
  EDIT = !!edit;
  const egenSlor = S.slor; S.slor = temaSlor(); // et valgt tema bestemmer slørfargen (js/tema.js)
  const c = SLOR[S.slor];
  const el = document.createElement('div');
  el.className = 'page ' + fmt;
  el.style.setProperty('--slor', c.c);
  el.style.setProperty('--slor-mork', c.mork);
  el.style.setProperty('--slor-tint', c.tint);
  try {
    el.innerHTML = side===2 ? LAYOUTS.bildetekst2('u'+(uidN++)+'_') : LAYOUTS[tpl]('u'+(uidN++)+'_', fmt);
    if(side !== 2) leggPaaTema(el, tpl, fmt);
  } finally { S.slor = egenSlor; }
  EDIT = false;
  if(edit){ el.classList.add('edit'); if(S.skjulTomme) el.classList.add('skjul-tomme'); }
  return el;
}

// Krymper tekst i hver boks til den passer. Returnerer true hvis noe fortsatt flyter over.
function fit(page){
  let over = false;
  page.querySelectorAll('.box').forEach(b => {
    const base = +b.dataset.base;
    let k = 1;
    const ts = [...b.querySelectorAll('.tittel')];
    ts.forEach(t => t.classList.remove('brk'));
    const wideOk = () => ts.every(t => t.scrollWidth <= t.clientWidth + 1);
    const ok = () => b.scrollHeight <= b.clientHeight + 1 && b.scrollWidth <= b.clientWidth + 1 && wideOk();
    b.style.fontSize = base + 'px';
    // Tekst i spalter måles med 6 % slakk: nedlastingen bryter linjer marginalt annerledes
    const mc = b.querySelector('.body7'); if(mc) mc.style.height = '94%';
    while(!ok() && k > 0.76){ k -= 0.03; b.style.fontSize = (base*k).toFixed(2) + 'px'; }
    if(mc){
      mc.style.height = '';
      // Linjen mellom spaltene går like langt ned som teksten, og vises bare når høyre spalte har tekst
      const r0 = mc.getBoundingClientRect(), sk = mc.offsetWidth / r0.width || 1, mid = r0.left + r0.width/2;
      let bunn = 0, hoyre = false;
      [...mc.children].forEach(c => [...c.getClientRects()].forEach(r => { bunn = Math.max(bunn, (r.bottom - r0.top)*sk); if(r.left > mid) hoyre = true; }));
      const rule = b.querySelector('.rule7');
      if(rule){ rule.style.height = bunn.toFixed(1) + 'px'; rule.style.display = hoyre ? '' : 'none'; }
    }
    // Ord som fortsatt er for lange: tillat brudd og varsle
    if(!wideOk()){ ts.forEach(t => t.classList.add('brk')); over = true; }
    const bad = !ok();
    b.classList.toggle('over', bad);
    if(bad) over = true;
  });
  return over;
}

function scalePage(page, maxW, maxH){
  const w = page.offsetWidth, h = page.offsetHeight;
  return Math.min(maxW/w, maxH/h);
}

function render(){
  const wrap = $('wrap'), stage = $('stage');
  const page = buildPage(S.tpl, S.fmt, hasSide2() && S.side===2 ? 2 : 1, true);
  wrap.innerHTML = '';
  wrap.appendChild(page);
  const over = fit(page);
  $('warn').classList.toggle('on', over);
  const sc = S.zoom === 'fit' ? scalePage(page, stage.clientWidth - 56, stage.clientHeight - 56) : S.zoom;
  document.querySelectorAll('#zoom button').forEach(b => b.classList.toggle('on', String(S.zoom) === b.dataset.z));
  page.style.transform = `scale(${sc})`;
  wrap.style.width = (page.offsetWidth*sc) + 'px';
  wrap.style.height = (page.offsetHeight*sc) + 'px';
  renderThumbs();
  planleggSjekk();
}


/* Miniatyrene av malene (i sidepanelet og på startskjermen) */
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
