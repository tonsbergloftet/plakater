/* Bildebanken og ikonbiblioteket */
'use strict';
/* ═════════ BILDEBANK ═════════
   Leser bilder/bilder.json (lages automatisk av GitHub Actions).
   - Rullering: bankens bilder deles i tre grupper; én gruppe hviler hver måned.
   - Rekkefølgen stokkes på nytt hver dag.
   - Bilder med passert utløpsdato vises ikke.
   - Nettleseren husker hvilke bilder du selv har brukt (bare for deg). */
let BANK = [], bankN = 0, visHvile = false;
const BRUK_KEY = LS_PREFIKS + 'tk-plakat-bildebruk';
const hsh = s => { let h = 2166136261; for(const c of String(s)){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
const idag = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const MND = ['jan.','feb.','mars','apr.','mai','juni','juli','aug.','sep.','okt.','nov.','des.'];
function brukLes(){ try{ return JSON.parse(localStorage.getItem(BRUK_KEY)) || {}; }catch(e){ return {}; } }
function brukSkriv(ids){ try{ const b = brukLes(), t = idag(); ids.forEach(id => b[id] = t); localStorage.setItem(BRUK_KEY, JSON.stringify(b)); }catch(e){} }

async function lastBank(){
  let liste;
  if(location.protocol === 'file:') return; // åpnet som lokal fil: ingen bildebank
  try{ const r = await fetch(RESSURS_ROT + 'bilder/bilder.json', {cache:'no-cache'}); if(!r.ok) return; liste = await r.json(); }
  catch(e){ return; } // f.eks. åpnet som lokal fil – da finnes ingen bildebank
  const t = idag();
  liste = liste.filter(b => !b.utloper || b.utloper >= t);
  if(!liste.length) return;
  const d = new Date(), hvileGruppe = (d.getFullYear()*12 + d.getMonth()) % 3;
  liste.forEach(b => { b.hviler = liste.length >= 9 && hsh(b.id) % 3 === hvileGruppe; b._r = hsh(b.id + t); });
  liste.sort((a,b) => a._r - b._r);
  BANK = liste;
  document.body.classList.add('har-bank');
  // Start med bilder fra bildebanken i stedet for KI-eksemplene
  // Standardbilder (merket i bildeinfo.csv) brukes først, i oppgitt rekkefølge; ellers dagens utvalg
  const std = BANK.filter(b => b.standard).sort((a,b) => (parseFloat(a.standard)||99) - (parseFloat(b.standard)||99));
  const aktive = std.concat(BANK.filter(b => !b.hviler && !b.standard));
  for(const [i,n] of [0,1,4].entries()) if((!S.imgs[n].src || S.imgs[n].ex) && aktive[i]) await velgBank(n, aktive[i], true);
  fillForm(); render();
}
async function tilDataUrl(url){
  const blob = await (await fetch(url)).blob();
  return new Promise((ok, feil) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = feil; r.readAsDataURL(blob); });
}
async function velgBank(n, b, stille){
  try{
    const src = await tilDataUrl(RESSURS_ROT + b.fil);
    S.imgs[n] = {src, w:b.w, h:b.h, fx:b.fx, fy:b.fy, ex:false, bank:b.id, foto:b.fotograf||'', ki:false};
    if(n === 0 && !stille) autoVariant = true;
    oppdaterKi();
  }catch(e){ if(!stille) alert('Kunne ikke hente bildet fra bildebanken.'); }
}
async function lastIkoner(){
  if(location.protocol === 'file:') return;
  try{ const r = await fetch(RESSURS_ROT + 'ikoner/ikoner.json', {cache:'no-cache'}); if(!r.ok) return; const l = await r.json(); if(Array.isArray(l) && l.length){ IKONER = l; fillForm(); render(); } }catch(e){}
}
function apneIkoner(){ $('ikonsok').value = ''; tegnIkoner(); $('ikonvelger').classList.add('on'); $('ikonsok').focus(); }
function lukkIkoner(){ $('ikonvelger').classList.remove('on'); }
function tegnIkoner(){
  const q = $('ikonsok').value.trim().toLowerCase();
  const t = IKONER.filter(i => !q || (i.navn+' '+(i.kategori||'')+' '+(i.sokeord||'')+' '+i.id).toLowerCase().includes(q));
  $('ikongrid').innerHTML = t.map(i => `<button class="iitem${i.id===S.ikon?' on':''}" data-id="${esc(i.id)}">${i.svg}<span>${esc(i.navn)}${i.kategori?` <small style="color:var(--muted)">· ${esc(i.kategori)}</small>`:''}</span></button>`).join('') || '<p class="mnote">Ingen ikoner passer søket.</p>';
  $('ikonantall').textContent = `${IKONER.length} ikoner`;
}
function apneBank(n){
  bankN = n; visHvile = false; $('banksok').value = '';
  tegnBank(); $('bank').classList.add('on'); $('banksok').focus();
}
function lukkBank(){ $('bank').classList.remove('on'); }
function tegnBank(){
  const q = $('banksok').value.trim().toLowerCase(), bruk = brukLes();
  const treff = BANK.filter(b => (visHvile || !b.hviler) && (!q || (b.beskrivelse+' '+b.id+' '+b.fotograf).toLowerCase().includes(q)));
  $('bankgrid').innerHTML = treff.map(b => {
    const u = bruk[b.id] ? (() => { const [y,m,d] = bruk[b.id].split('-'); return `<span class="tag">Du brukte dette ${+d}. ${MND[+m-1]}</span>`; })() : '';
    const tekst = esc(b.beskrivelse || '') + (b.fotograf ? `${b.beskrivelse?' · ':''}Foto: ${esc(b.fotograf)}` : '');
    return `<button class="bitem${b.hviler?' hviler':''}" data-id="${esc(b.id)}"><img src="${esc(RESSURS_ROT + b.mini)}" alt="${esc(b.beskrivelse||'')}" loading="lazy">${u}${(tekst || b.hviler) ? `<span>${tekst || 'Hviler denne måneden'}</span>` : ''}</button>`;
  }).join('') || '<p class="mnote">Ingen bilder passer søket.</p>';
  const nHvile = BANK.filter(b => b.hviler).length;
  $('banknote').textContent = nHvile ? `${BANK.length - nHvile} bilder tilgjengelig denne måneden. Utvalget byttes hver måned, så de samme bildene ikke brukes hele tiden.` : '';
  $('bankhvile').textContent = nHvile ? (visHvile ? 'Skjul bilder som hviler' : `Vis bilder som hviler denne måneden (${nHvile})`) : '';
}

