/* Sidepanelet og redigeringen: felt, bilder, malvalg, startskjermen og forklaringen */
'use strict';
// Forklaringen («Slik virker det»): husker om den er vist, og lar startskjermen åpne den
let visTourExt = () => {};
const TOUR_KEY_G = LS_PREFIKS + 'tk-plakat-sett-forklaring-2';

/* ═════════ SIDEPANEL ═════════ */
function syncFields(){
  const used = TPLS[S.tpl].felt;
  document.querySelectorAll('.f[data-k]').forEach(f => {
    const k = f.dataset.k;
    if(k==='qrTekst'){ f.classList.toggle('hide', !(used.includes('qrTekst') && S.qr)); return; }
    f.classList.toggle('hide', !used.includes(k));
  });
}
const TEXT_KEYS = ['innhold','pIntro','ut3','tx3','merkeTx','bs1','bs2','bs3','stikk','tittel','ingress','ut1','tx1','pTittel','punkter','ut2','tx2','praktisk','cta','url','qrTekst','s2Tittel','s2Ut1','s2Tx1','s2Ut2','s2Tx2','s2Tx3','s2Slutt','s2Merknad','s2Kontakt','merke','avslutt'];
function fillForm(){
  TEXT_KEYS.forEach(k => { $(k).value = S[k] || ''; });
  tegnTemavalg();
  $('urlqr').value = S.url || '';
  $('visurl').checked = S.visUrl !== false;
  $('visurlrad').style.display = ['forklaring','delt','tekst','bilder','bildetekst'].includes(S.tpl) ? '' : 'none';
  $('qrapner').textContent = has('url') ? 'Når noen skanner koden med mobilkameraet, åpnes: ' + (/^https?:\/\//i.test(S.url.trim()) ? '' : 'https://') + S.url.trim() : '';
  // Forside/bakside vises alltid; bakside er bare aktiv når malen har en
  const kanBak = S.tpl === 'bildetekst' && S.fmt === 'a4';
  if(!hasSide2()) S.side = 1;
  $('sidetabs').classList.add('on');
  document.querySelectorAll('#sidetabs button').forEach(b => {
    b.classList.toggle('on', +b.dataset.side === S.side);
    if(b.dataset.side === '2'){ b.disabled = !kanBak; b.title = kanBak ? '' : 'Denne malen har ingen bakside'; }
  });
  $('sidehint').textContent = kanBak ? (S.side2 ? '' : 'Baksiden er slått av') : S.tpl === 'bildetekst' ? 'Bakside finnes bare i A4' : 'Malen har ingen bakside';
  $('ogsa').classList.remove('on');
  $('sec-merke').classList.toggle('hide', !TPLS[S.tpl].felt.includes('merke'));
  $('merkeh').textContent = S.tpl === 'bymobel' ? 'Merke (blå sirkel)' : 'Gult merke';
  $('morkrad').style.display = TPLS[S.tpl].mork ? '' : 'none';
  $('morktxt').textContent = TPLS[S.tpl].mork || '';
  $('mork').checked = !!S.mork;
  document.querySelectorAll('#fmtseg button').forEach(b => b.style.display = TPLS[S.tpl].fmts.includes(b.dataset.fmt) ? '' : 'none');
  const IKON_TXT = {invitasjon:'Ikonet vises i det gule merket.', tekstplakat:'Ikonet vises øverst til høyre.', hoydebilde:'Ikonet vises over teksten.'};
  $('sec-ikon').classList.toggle('hide', !IKON_TXT[S.tpl]);
  $('ikonnote').textContent = IKON_TXT[S.tpl] || '';
  const sv = ikonSvg(S.ikon);
  $('ikonprev').innerHTML = sv || 'Ingen ikon valgt';
  $('fjernikon').style.display = sv ? '' : 'none';
  $('qr').checked = !!S.qr; $('ki').checked = !!S.ki;
  const nImg = TPLS[S.tpl].bilder;
  $('sec-img').classList.toggle('hide', nImg===0);
  document.querySelectorAll('.imgblk').forEach(b => {
    const n = +b.dataset.n, I = S.imgs[n], im = b.querySelector('.upl img');
    if(n < 2 || n === 4){
      b.classList.toggle('hide', !bildeSlots(S.tpl).includes(n));
      b.querySelector('.imglbl').style.display = nImg > 1 ? '' : 'none';
      b.querySelector('[data-a=fx]').value = I.fx; b.querySelector('[data-a=fy]').value = I.fy; b.querySelector('[data-a=z]').value = I.z || 1;
    }
    const up = b.querySelector('.upl');
    if(I.src){ im.src = I.src; up.classList.add('has'); } else { im.removeAttribute('src'); up.classList.remove('has'); }
    up.classList.toggle('ex', !!I.ex);
    const medBank = BANK.length && n !== 3;
    up.classList.toggle('velg', !!medBank);
    up.querySelector('b').textContent = medBank ? (I.src ? 'Bytt bilde' : 'Velg bilde') : (I.src && !I.ex ? 'Last opp et annet bilde' : 'Last opp eget bilde');
    up.querySelector('.uplh').textContent = I.ex ? EKS[n].txt : I.bank ? 'Fra bildebanken' + (I.foto ? ' · Foto: ' + I.foto : '') : medBank ? 'Fra bildebanken eller ditt eget' : (n===3 ? 'PNG med gjennomsiktig bakgrunn' : 'JPG eller PNG');
    b.querySelector('.eks').style.display = I.ex ? 'none' : '';
  });
  $('sec-s2').classList.toggle('hide', !(S.tpl==='bildetekst' && S.fmt==='a4'));
  $('side2').checked = !!S.side2;
  $('s2body').style.display = S.side2 ? '' : 'none';
  document.querySelectorAll('#sideseg button').forEach(b => b.classList.toggle('on', +b.dataset.side===S.side));
  document.querySelectorAll('.tplbtn').forEach(b => b.classList.toggle('on', b.dataset.tpl===S.tpl));
  document.querySelectorAll('#fmtseg button').forEach(b => b.classList.toggle('on', b.dataset.fmt===S.fmt));
  document.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', b.dataset.s===S.slor));
  $('dlnote').textContent = S.fmt==='a4' ? 'PDF i A4 for utskrift. PNG i høy oppløsning.' : S.fmt==='a4l' ? 'PDF i A4 liggende for utskrift. PNG i høy oppløsning.' : S.fmt==='bym' ? 'PNG i 2160 × 3840 (9:16) for skjermene på bymøblene. PDF i samme format.' : 'PNG i 1920 × 1080 for infoskjerm. PDF i samme format.';
  syncFields();
}

function initUI(){
  const tp = $('tpls');
  GRUPPER.forEach(gr => {
    tp.insertAdjacentHTML('beforeend', `<div class="grp">${esc(gr.navn)}</div>`);
    gr.maler.forEach(k => {
      const t = TPLS[k], b = document.createElement('button');
      b.className = 'tplbtn'; b.dataset.tpl = k;
      b.innerHTML = `<div class="thumb"></div><span class="lbl">${t.navn}</span><span class="sub">${t.sub}</span>`;
      b.onclick = () => velgMal(k);
      tp.appendChild(b);
    });
  });
  $('startgrp').addEventListener('click', e => {
    const b = e.target.closest('.skort'); if(!b) return;
    const forste = $('start').dataset.forste === '1';
    $('start').classList.remove('on'); velgMal(b.dataset.tpl);
    if(forste) setTimeout(visTourExt, 350);
  });
  $('startapne').onchange = e => { const forste = $('start').dataset.forste === '1'; $('start').classList.remove('on'); loadDraft(e); try{ localStorage.setItem(TOUR_KEY_G, '1'); }catch(_){} };
  $('startlukk').onclick = () => { const forste = $('start').dataset.forste === '1'; $('start').classList.remove('on'); if(forste) setTimeout(visTourExt, 200); };
  $('allemaler').onclick = () => apneStart(false);
  initKI();
  $('visurl').onchange = () => { S.visUrl = $('visurl').checked; render(); };
  $('dlwide').onclick = async () => { const f = S.fmt; S.fmt = 'wide'; try{ await exportFile('png', true); } finally { S.fmt = f; fillForm(); render(); } };
  document.querySelectorAll('#sidetabs button').forEach(b => b.onclick = () => { if(b.disabled) return; S.side = +b.dataset.side; if(S.side === 2) S.side2 = true; fillForm(); render(); });
  const sw = $('swatches');
  Object.entries(SLOR).forEach(([k,c]) => {
    const b = document.createElement('button');
    b.className = 'sw'; b.dataset.s = k;
    b.innerHTML = `<i style="background:${c.c}"></i>${c.navn}`;
    b.onclick = () => { S.slor = k; fillForm(); render(); };
    sw.appendChild(b);
  });
  document.querySelectorAll('#fmtseg button').forEach(b => b.onclick = () => { S.fmt = b.dataset.fmt; fillForm(); render(); });
  let t = null;
  TEXT_KEYS.forEach(k => $(k).addEventListener('input', () => { S[k] = $(k).value; clearTimeout(t); t = setTimeout(render, 120); }));
  initTema();
  $('urlqr').addEventListener('input', () => { S.url = $('urlqr').value; $('url').value = S.url; $('qrapner').textContent = has('url') ? 'Når noen skanner koden med mobilkameraet, åpnes: ' + (/^https?:\/\//i.test(S.url.trim()) ? '' : 'https://') + S.url.trim() : ''; clearTimeout(t); t = setTimeout(render, 200); });
  $('url').addEventListener('input', () => { $('urlqr').value = $('url').value; });
  $('qr').onchange = () => { S.qr = $('qr').checked; syncFields(); render(); };
  $('ki').onchange = () => { S.ki = $('ki').checked; bildeSlots(S.tpl).forEach(i => { if(S.imgs[i]) S.imgs[i].ki = S.ki; }); render(); };
  $('mork').onchange = () => { S.mork = $('mork').checked; autoVariant = false; render(); };
  $('side2').onchange = () => { S.side2 = $('side2').checked; if(!S.side2) S.side = 1; fillForm(); render(); };
  document.querySelectorAll('#sideseg button').forEach(b => b.onclick = () => { S.side = +b.dataset.side; fillForm(); render(); });
  // Når man skriver i et side 2-felt, vis side 2
  ['s2Tittel','s2Ut1','s2Tx1','s2Ut2','s2Tx2','s2Tx3','s2Slutt','s2Merknad','s2Kontakt'].forEach(k => $(k).addEventListener('focus', () => { if(S.side!==2){ S.side = 2; fillForm(); render(); } }));
  ['stikk','tittel','ingress','tx1','praktisk','cta','url','qrTekst'].forEach(k => $(k).addEventListener('focus', () => { if(S.side!==1){ S.side = 1; fillForm(); render(); } }));
  document.querySelectorAll('.imgblk').forEach(b => {
    const n = +b.dataset.n;
    b.querySelector('input[type=file]').onchange = e => { const f = e.target.files[0]; if(f) loadImage(f, n); e.target.value=''; };
    // Med bildebank: klikk åpner velgeren (bildebank + «Last opp eget bilde»)
    b.querySelector('.upl').addEventListener('click', e => { if(BANK.length && n !== 3){ e.preventDefault(); apneBank(n); } });
    b.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { S.imgs[n][r.dataset.a] = +r.value; render(); });
    if(n >= 2) b.querySelector('input[type=file]').addEventListener('change', () => { S.side = 2; });
    b.querySelector('.rm').onclick = () => { S.imgs[n].src = null; S.imgs[n].ex = false; S.imgs[n].ki = false; oppdaterKi(); fillForm(); render(); };
    b.querySelector('.eks').onclick = () => { S.imgs[n] = {...EKS[n], ex:true, ki:EKS[n].ki}; oppdaterKi(); fillForm(); render(); };
  });
  document.querySelectorAll('.bankbtn').forEach(b => b.onclick = () => apneBank(+b.dataset.n));
  $('banklukk').onclick = lukkBank;
  $('bankopp').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if(!f) return; lukkBank(); if(bankN >= 2 && bankN !== 4) S.side = 2; loadImage(f, bankN); };
  // Ikonbibliotek
  $('velgikon').onclick = apneIkoner;
  $('fjernikon').onclick = () => { S.ikon = null; fillForm(); render(); };
  $('ikonlukk').onclick = lukkIkoner;
  $('ikonvelger').onclick = e => { if(e.target.id === 'ikonvelger') lukkIkoner(); };
  document.addEventListener('keydown', e => { if(e.key === 'Escape'){ lukkIkoner(); $('bytt').classList.remove('on'); if($('start').classList.contains('on')) $('startlukk').click(); } });
  $('ikonsok').oninput = tegnIkoner;
  $('ikongrid').onclick = e => { const it = e.target.closest('.iitem'); if(!it) return; S.ikon = it.dataset.id; lukkIkoner(); fillForm(); render(); };
  $('bank').onclick = e => { if(e.target.id === 'bank') lukkBank(); };
  document.addEventListener('keydown', e => { if(e.key === 'Escape') lukkBank(); });
  $('banksok').oninput = tegnBank;
  $('bankhvile').onclick = () => { visHvile = !visHvile; tegnBank(); };
  $('bankgrid').onclick = async e => {
    const it = e.target.closest('.bitem'); if(!it) return;
    const b = BANK.find(x => x.id === it.dataset.id); if(!b) return;
    lukkBank(); await velgBank(bankN, b); if(bankN === 2) S.side = 2; fillForm(); render();
  };
  // Redigering direkte i plakaten
  const wrap = $('wrap');
  const refit = () => { const p = wrap.querySelector('.page'); if(p) $('warn').classList.toggle('on', fit(p)); };
  let urlVed = null;
  wrap.addEventListener('focusin', e => {
    const el = e.target.closest('.ed'); if(!el) return;
    const k = el.dataset.k;
    el.classList.add('editing');
    el.textContent = el.dataset.kind === 'dline' ? (S[k]||'').split('\n').map(x=>x.trim()).filter(Boolean).join('  |  ') : (S[k] || ''); // råtekst mens man skriver
    if(k === 'url') urlVed = S.url;
    if(k === 'innhold'){ const h = document.querySelector('.hint'); if(h){ h.dataset.std = h.dataset.std || h.textContent; h.textContent = INNHOLD_TIPS; h.classList.add('tips'); } }
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  });
  wrap.addEventListener('input', e => {
    const el = e.target.closest('.ed'); if(!el) return;
    const k = el.dataset.k;
    S[k] = el.dataset.kind === 'dline' ? el.innerText.split(/\s*[|\n]\s*/).map(x=>x.trim()).filter(Boolean).join('\n') : el.innerText.replace(/\n$/, '');
    el.classList.toggle('tom', !S[k].trim());
    if($(k)) $(k).value = S[k];
    refit();
  });
  wrap.addEventListener('focusout', e => {
    const el = e.target.closest('.ed'); if(!el) return;
    const k = el.dataset.k;
    el.classList.remove('editing');
    if(k === 'innhold'){ const h = document.querySelector('.hint'); if(h && h.dataset.std){ h.textContent = h.dataset.std; h.classList.remove('tips'); } }
    el.innerHTML = disp(k, el.dataset.kind);
    if((k === 'merke' && !has(k)) || /^bs\d$/.test(k)){ setTimeout(render, 0); return; } // tomt merke fjernes
    el.classList.toggle('tom', !has(k));
    if(k === 'url' && S.url !== urlVed){
      // QR-koden må lages på nytt: bygg plakaten og gå videre til feltet brukeren klikket på
      const neste = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.ed');
      const nk = neste ? neste.dataset.k : null;
      setTimeout(() => { render(); if(nk){ const n = wrap.querySelector(`.ed[data-k="${nk}"]`); if(n) n.focus(); } }, 0);
    } else { refit(); renderThumbs(); }
  });
  wrap.addEventListener('keydown', e => {
    const el = e.target.closest('.ed'); if(!el) return;
    if(e.key === 'Enter' && el.dataset.kind === 'dline'){ e.preventDefault(); document.execCommand('insertText', false, '  |  '); return; }
    if(e.key === 'Escape' || (e.key === 'Enter' && SINGLE.has(el.dataset.k) && el.dataset.kind !== 'ctab')){ e.preventDefault(); el.blur(); }
  });
  wrap.addEventListener('paste', e => {
    const el = e.target.closest('.ed'); if(!el) return;
    e.preventDefault();
    let t = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
    if(SINGLE.has(el.dataset.k) && el.dataset.kind !== 'ctab') t = t.replace(/\s*\n\s*/g, ' ');
    document.execCommand('insertText', false, t);
  });
  $('skjultom').onchange = () => { S.skjulTomme = $('skjultom').checked; render(); };
  // Klikk på bilde eller QR i plakaten → riktig del av sidepanelet
  const tilPanel = (sec, fokus) => {
    if(!sec) return;
    sec.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center'});
    sec.classList.remove('blink'); void sec.offsetWidth; sec.classList.add('blink');
    if(fokus) setTimeout(() => fokus.focus({preventScroll:true}), 350);
  };
  // Bytt bilde: liten knapp der man klikket, i stedet for å hoppe rett til sidepanelet
  const bytt = $('bytt'); let byttN = 0;
  const skjulBytt = () => bytt.classList.remove('on');
  const apneBilde = n => {
    if(BANK.length && n !== 3){ apneBank(n); return; }
    const blk = document.querySelector(`.imgblk[data-n="${n}"]`); const inp = blk && blk.querySelector('input[type=file]');
    if(inp) inp.click();
  };
  $('byttbilde').onclick = () => { skjulBytt(); apneBilde(byttN); };
  // Flytt og zoom direkte i plakaten
  const jl = $('juster'), stage = $('stage'); let jN = null, drag = null, raf = 0;
  const avsluttJuster = () => { jN = null; jl.classList.remove('on'); stage.classList.remove('justerer','drar'); fillForm(); };
  $('byttjuster').onclick = () => {
    skjulBytt(); jN = byttN; const I = S.imgs[jN]; if(!I || !I.src){ apneBilde(byttN); return; }
    $('justerz').value = I.z || 1;
    jl.style.left = Math.max(12, Math.min(parseFloat(bytt.style.left), innerWidth - 470)) + 'px'; jl.style.top = bytt.style.top;
    jl.classList.add('on'); stage.classList.add('justerer');
  };
  $('justerz').oninput = () => { if(jN === null) return; S.imgs[jN].z = +$('justerz').value; render(); };
  $('justerok').onclick = avsluttJuster;
  wrap.addEventListener('pointerdown', e => {
    if(jN === null) return;
    const g = e.target.closest('[data-img]'); if(!g || +g.dataset.img !== jN) return;
    const im = g.querySelector('image'), svg = g.ownerSVGElement; if(!im || !svg) return;
    e.preventDefault();
    const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width; // skjerm-px per plakat-px
    const cp = document.getElementById(((g.getAttribute('clip-path')||'').match(/#([^)]+)/)||[])[1]);
    const bb = cp && cp.firstElementChild ? cp.firstElementChild.getBBox() : g.getBBox();
    const ox = Math.max(1, +im.getAttribute('width') - bb.width), oy = Math.max(1, +im.getAttribute('height') - bb.height);
    drag = {x:e.clientX, y:e.clientY, fx:S.imgs[jN].fx, fy:S.imgs[jN].fy, k, ox, oy};
    stage.classList.add('drar'); wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', e => {
    if(!drag) return;
    const I = S.imgs[jN];
    I.fx = Math.max(0, Math.min(100, drag.fx - (e.clientX - drag.x) / drag.k / drag.ox * 100));
    I.fy = Math.max(0, Math.min(100, drag.fy - (e.clientY - drag.y) / drag.k / drag.oy * 100));
    if(!raf) raf = requestAnimationFrame(() => { raf = 0; render(); });
  });
  const slipp = () => { if(drag){ drag = null; stage.classList.remove('drar'); } };
  wrap.addEventListener('pointerup', slipp); wrap.addEventListener('pointercancel', slipp);
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && jN !== null) avsluttJuster(); });
  document.addEventListener('click', e => { if(!e.target.closest('#bytt') && !e.target.closest('#wrap')) skjulBytt(); });
  $('stage').addEventListener('scroll', skjulBytt);
  wrap.addEventListener('click', e => {
    skjulBytt();
    if(jN !== null) return; // justerer bildet
    if(e.target.closest('.ed')) return;
    if(e.target.closest('[data-ikon]')){ apneIkoner(); return; }
    if(e.target.closest('.qr, .qrbadge, .qrbox7, .qr9, .qr11, .qr12')){ tilPanel($('sec-qr'), $('urlqr')); return; }
    // Bommet litt på en tekst? Gå til nærmeste tekstfelt hvis det er innenfor 26 px
    let best = null, bd = 26;
    wrap.querySelectorAll('.ed').forEach(el => {
      if(!el.offsetParent) return;
      const r = el.getBoundingClientRect();
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      const d = Math.hypot(dx, dy); if(d < bd){ bd = d; best = el; }
    });
    if(best){ best.focus(); return; }
    const bi = e.target.closest('[data-img], .avatar-img');
    if(bi){
      byttN = bi.classList.contains('avatar-img') ? 3 : +bi.dataset.img;
      bytt.style.left = Math.min(e.clientX + 8, innerWidth - 140) + 'px'; bytt.style.top = (e.clientY + 8) + 'px';
      bytt.classList.add('on'); $('byttbilde').focus();
    }
  });
  // Forklaring ved første besøk, og ved klikk på «Slik virker det»
  const TOUR_KEY = LS_PREFIKS + 'tk-plakat-sett-forklaring-2'; // ny versjon: alle ser den nye oppstarten én gang
  const bildeRekt = g => {
    const svg = g.ownerSVGElement, page = g.closest('.page'); if(!svg || !page) return null;
    let bb;
    const cpId = (g.getAttribute('clip-path')||'').match(/#([^)]+)/);
    const cp = cpId && document.getElementById(cpId[1]);
    try{ bb = (cp && cp.firstElementChild ? cp.firstElementChild : g).getBBox(); }catch(e){ return null; }
    const s = svg.getBoundingClientRect(), k = s.width / svg.viewBox.baseVal.width, p = page.getBoundingClientRect();
    const l = Math.max(p.left, s.left + bb.x*k), t = Math.max(p.top, s.top + bb.y*k);
    const r = Math.min(p.right, s.left + (bb.x+bb.width)*k), b = Math.min(p.bottom, s.top + (bb.y+bb.height)*k);
    return {left:l, top:t, right:r, bottom:b, width:r-l, height:b-t, stor: (r-l)*(b-t) > .55 * p.width * p.height, page:p};
  };
  const plasser = (kort, ring, mal, pad, rekt, side, minY) => {
    const t = document.querySelector('.tour .' + kort), r = document.querySelector('.tour .' + ring);
    if(!mal){ t.style.display = r.style.display = 'none'; return; }
    t.style.display = r.style.display = '';
    let b = rekt || mal.getBoundingClientRect();
    const W = innerWidth, H = innerHeight, page = document.querySelector('#wrap .page').getBoundingClientRect();
    if(b.stor){ // bildet dekker nesten hele plakaten: ingen ring, kortet peker på plakatens nedre del
      r.style.display = 'none';
      b = {left:page.left, right:page.right, top:page.top + page.height*.55, bottom:page.top + page.height*.7, width:page.width, height:page.height*.15};
    } else {
      Object.assign(r.style, {left:(b.left-pad)+'px', top:(b.top-pad)+'px', width:(b.width+pad*2)+'px', height:(b.height+pad*2)+'px'});
    }
    const kw = 270; t.style.maxWidth = kw + 'px';
    const kh = t.offsetHeight || 120;
    let x, cls;
    // Utenfor plakaten når det er plass: tekstkortet til høyre, bildekortet til venstre
    if(side === 'right' && page.right + 18 + kw < W - 12){ x = page.right + 18; cls = 'pv'; }
    else if(side === 'left' && page.left - 18 - kw > 12){ x = page.left - 18 - kw; cls = 'ph'; }
    else { x = Math.min(Math.max(16, b.right + pad + 18), W - kw - 16); cls = ''; }
    const y = Math.min(Math.max(minY || 16, b.top), H - kh - 100);
    t.classList.remove('pv','ph'); if(cls) t.classList.add(cls);
    Object.assign(t.style, {left:x+'px', top:y+'px'});
  };
  // Veiledningen vises ett steg om gangen: tekst → bilde → sidepanelet
  let tSteg = 0;
  const tegnSteg = () => {
    ['k1','k2','k3'].forEach((k,i) => plasser(k, 'r'+(i+1), null));
    if(tSteg === 0) plasser('k2', 'r2', document.querySelector('#wrap .tittel.ed') || document.querySelector('#wrap .ed'), 6, null, 'right');
    if(tSteg === 1){ const kb = document.querySelector('#wrap .klikkbilde'); if(!kb){ tSteg = 2; return tegnSteg(); } plasser('k3', 'r3', kb, 4, bildeRekt(kb), 'left'); }
    if(tSteg === 2) plasser('k1', 'r1', document.querySelector('aside'), -4, null, null, 60);
    const k = document.querySelector('.tour .' + ['k2','k3','k1'][tSteg]);
    const harBilde = !!document.querySelector('#wrap .klikkbilde');
    k.querySelector('.tsteg').textContent = `Veiledning · ${tSteg + 1 - (tSteg === 2 && !harBilde ? 1 : 0)} av ${harBilde ? 3 : 2}`;
    k.querySelector('.tneste').focus();
  };
  const visTour = () => { $('tour').classList.add('on'); tSteg = 0; tegnSteg(); };
  $('tour').addEventListener('click', e => {
    const t = e.target.closest('[data-t]'); if(!t) return;
    if(t.dataset.t === 'hopp' || (t.dataset.t === 'neste' && tSteg === 2)){ lukkTour(); return; }
    if(t.dataset.t === 'neste') tSteg++;
    if(t.dataset.t === 'tilbake'){ tSteg--; if(tSteg === 1 && !document.querySelector('#wrap .klikkbilde')) tSteg = 0; }
    tegnSteg();
  });
  var lukkTour = () => { $('tour').classList.remove('on'); try{ localStorage.setItem(TOUR_KEY, '1'); }catch(e){} };
  $('hjelp').onclick = visTour;
  visTourExt = visTour;
  $('tourok').onclick = lukkTour;
  $('tour').addEventListener('click', e => { if(e.target.classList.contains('dim')) lukkTour(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && $('tour').classList.contains('on')) lukkTour(); });
  let sett = false; try{ sett = localStorage.getItem(TOUR_KEY) === '1'; }catch(e){}
  // Valget av mal vises hver gang siden åpnes; veiledningen bare første gang
  if(!window.__ingenStart) setTimeout(() => apneStart(!sett), 500);
  document.querySelectorAll('#zoom button').forEach(b => b.onclick = () => { S.zoom = b.dataset.z === 'fit' ? 'fit' : +b.dataset.z; render(); });
  $('dlpdf').onclick = () => exportFile('pdf');
  $('dlpng').onclick = () => exportFile('png');
  $('load').onchange = loadDraft;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(render, 150); });
}

// Skalerer ned store bilder ved opplasting (raskere, mindre utkastfiler)
function loadImage(file, n){
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const max = n===3 ? 900 : 2600, sc = Math.min(1, max/Math.max(im.width, im.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(im.width*sc); cv.height = Math.round(im.height*sc);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      // Gjennomsiktige PNG-er (illustrasjoner) beholdes som PNG; vanlige foto lagres som JPEG
      let alpha = false;
      if(/png|webp|gif/i.test(file.type)){
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        for(let i = 3; i < d.length; i += 4*97){ if(d[i] < 250){ alpha = true; break; } }
      }
      const png = n===3 || alpha;
      S.imgs[n] = {src: png ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', .9), w: cv.width, h: cv.height, ex:false, fx:50, fy:alpha?0:45, z:1, alpha, ki:false};
      if(n === 0) autoVariant = true;
      fillForm(); render();
      if(n !== 3) spørKi().then(ja => { S.imgs[n].ki = ja; oppdaterKi(); fillForm(); render(); });
    };
    im.src = r.result;
  };
  r.readAsDataURL(file);
}

// Spør om et opplastet bilde er KI-generert. Ja gir automatisk KI-merke på plakaten.
function spørKi(){
  return new Promise(ok => {
    const m = $('kispm'); m.classList.add('on'); $('kinei').focus();
    const svar = ja => { m.classList.remove('on'); $('kija').onclick = $('kinei').onclick = null; ok(ja); };
    $('kija').onclick = () => svar(true); $('kinei').onclick = () => svar(false);
  });
}
// KI-merket følger bildene i malen som er valgt (kan fortsatt slås av/på for hånd)
function oppdaterKi(){
  const n = bildeSlots(S.tpl).concat(hasSide2() ? [2] : []);
  S.ki = n.some(i => S.imgs[i] && S.imgs[i].src && S.imgs[i].ki);
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
