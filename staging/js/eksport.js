/* Eksport (PDF og PNG) og arbeidsfil (utkast i PDF-en) */
'use strict';
/* ═════════ EKSPORT ═════════ */
// Felt i malen som fortsatt har eksempelteksten
const NAVN_FELT = {stikk:'tema', tittel:'tittel', ingress:'ingress', ut1:'underoverskrift 1', tx1:'brødtekst 1', ut2:'underoverskrift 2', tx2:'brødtekst 2', ut3:'underoverskrift 3', tx3:'brødtekst 3', pTittel:'overskrift over punktene', punkter:'punktliste', praktisk:'praktisk informasjon', cta:'tekst ved QR-koden', merke:'merket', merkeTx:'merket', avslutt:'avslutning'};
function demoIgjen(){
  const f = TPLS[S.tpl].felt.filter(k => k in DEMO && k !== 'url' && S[k] === DEMO[k]);
  return [...new Set(f.map(k => NAVN_FELT[k] || k))];
}
async function exportFile(type, stille){
  const slots = bildeSlots(S.tpl).map(i => S.imgs[i]);
  if(!stille){
    const usedEx = slots.some(I => I.ex) || (hasSide2() && S.imgs.slice(2,4).some(I => I.ex));
    const demo = demoIgjen();
    const urlDemo = S.qr && TPLS[S.tpl].felt.includes('url') && (S.url||'').trim() === DEMO.url;
    const varsel = [];
    if(demo.length) varsel.push('Disse feltene har fortsatt eksempeltekst: ' + demo.join(', ') + '.');
    if(urlDemo) varsel.push('QR-koden går fortsatt til eksempeladressen (' + DEMO.url + ').');
    if(usedEx) varsel.push('Plakaten bruker fortsatt et eksempelbilde.');
    if(SJEKK.kontrast) varsel.push('Teksten kan bli vanskelig å lese på bildet (se tipset over plakaten).');
    SJEKK.opplosning.forEach(t => varsel.push(t));
    const mangler = TPLS[S.tpl].felt.filter(k => String(S[k]||'').includes('[MANGLER]'));
    if(mangler.length) varsel.push('Noen felt inneholder fortsatt [MANGLER] fra KI-forslaget: ' + mangler.map(k => NAVN_FELT[k] || k).join(', ') + '.');
    if(varsel.length && !confirm(varsel.join('\n') + '\n\nVil du laste ned likevel?')) return;
  }
  const btns = [$('dlpdf'), $('dlpng')]; btns.forEach(b => b.disabled = true);
  try{
    await document.fonts.ready;
    EKSPORTERER = true;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;';
    document.body.appendChild(host);
    const ratio = FMT[S.fmt].ratio; // A4 ≈ 290 dpi, skjerm = 1920×1080, bymøbel = 2160×3840
    const qrRuter = []; // QR-kodens plassering per side (andel av siden), for klikkbar lenke i PDF-en
    const snap = async side => {
      const page = buildPage(S.tpl, S.fmt, side);
      page.classList.add('export');
      host.innerHTML = ''; host.appendChild(page);
      fit(page);
      await Promise.all([...page.querySelectorAll('img')].map(i => i.decode().catch(()=>{})));
      const qe = page.querySelector('.qr svg, .qrbadge svg, .qrbox7 svg, .qr9 svg, .qr11 svg, .qr12 svg');
      if(qe){ const p = page.getBoundingClientRect(), r = qe.getBoundingClientRect(); qrRuter.push({side, x:(r.left-p.left)/p.width, y:(r.top-p.top)/p.height, w:r.width/p.width, h:r.height/p.height}); }
      return htmlToImage.toCanvas(page, {pixelRatio: ratio, backgroundColor:'#ffffff', width: page.offsetWidth, height: page.offsetHeight});
    };
    // PDF: begge sider når side 2 er på. PNG: siden som vises.
    const sides = type==='pdf' ? (hasSide2() ? [1,2] : [1]) : [hasSide2() ? S.side : 1];
    const canvases = [];
    for(const sd of sides) canvases.push(await snap(sd));
    host.remove();
    const canvas = canvases[0];
    const brukt = slots.concat(hasSide2() ? S.imgs.slice(2,3) : []).filter(I => I.bank).map(I => I.bank);
    if(brukt.length) brukSkriv(brukt);
    const name = 'plakat-' + (S.tittel||'tonsberg').toLowerCase().replace(/[æ]/g,'ae').replace(/[ø]/g,'o').replace(/[å]/g,'a').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) + FMT[S.fmt].navn;
    if(type==='png'){
      download(canvas.toDataURL('image/png'), name + (sides[0]===2 ? '-side2' : '') + '.png');
    } else {
      const { jsPDF } = window.jspdf;
      const pdf = S.fmt==='a4'
        ? new jsPDF({orientation:'portrait', unit:'mm', format:'a4'})
        : S.fmt==='bym' ? new jsPDF({orientation:'portrait', unit:'px', format:[2160,3840], hotfixes:['px_scaling']})
        : new jsPDF({orientation:'landscape', unit:'px', format:[1920,1080], hotfixes:['px_scaling']});
      const w = S.fmt==='a4' ? 210 : S.fmt==='bym' ? 2160 : 1920, h = S.fmt==='a4' ? 297 : S.fmt==='bym' ? 3840 : 1080;
      let lenke = (S.url||'').trim(); if(lenke && !/^https?:\/\//i.test(lenke)) lenke = 'https://' + lenke;
      canvases.forEach((cv, i) => {
        if(i) pdf.addPage();
        pdf.addImage(cv.toDataURL('image/jpeg', .93), 'JPEG', 0, 0, w, h);
        const q = qrRuter.find(r => r.side === sides[i]);
        if(q && lenke) pdf.link(q.x*w, q.y*h, q.w*w, q.h*h, {url: lenke}); // QR-koden er klikkbar i PDF-en
      });
      // Arbeidsfil: hele oppsettet legges inn i PDF-en, så den kan åpnes i generatoren igjen
      const arbeid = b64utf8(JSON.stringify(utkastData()));
      pdf.internal.events.subscribe('putCatalog', () => pdf.internal.write('/TkPlakat (' + arbeid + ')'));
      pdf.setProperties({title: (S.tittel||'Plakat').replace(/\*\*/g,''), creator: 'Plakatgenerator – Tønsberg kommune'});
      pdf.save(name + '.pdf');
    }
    if(S.fmt === 'a4' && !stille && TPLS[S.tpl].fmts.includes('wide')) $('ogsa').classList.add('on');
  }catch(err){ alert('Eksporten feilet: ' + err.message); console.error(err); }
  finally{ EKSPORTERER = false; }
  btns.forEach(b => b.disabled = false);
}
function download(href, name){ const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

/* ═════════ UTKAST ═════════ */
function utkastData(){
  // Bare bildene malen bruker tas med (holder PDF-en mindre)
  const brukes = new Set(bildeSlots(S.tpl).concat(hasSide2() ? [2,3] : []));
  return {type:'tk-plakat', v:4, ...S, imgs: S.imgs.map((I,n) => !brukes.has(n) ? {ex:!!I.ex, fx:I.fx, fy:I.fy, z:I.z} : I.ex ? {ex:true, fx:I.fx, fy:I.fy, z:I.z} : I.bank ? {bank:I.bank, fx:I.fx, fy:I.fy, z:I.z, ki:false} : I)};
}
function b64utf8(t){
  const b = new TextEncoder().encode(t); let s = '';
  for(let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
function utf8b64(t){ const s = atob(t), b = new Uint8Array(s.length); for(let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return new TextDecoder().decode(b); }
function loadDraft(e){
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try{
      const buf = new Uint8Array(r.result);
      let tekst;
      if(buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46){ // %PDF
        const pdfTekst = new TextDecoder('latin1').decode(buf);
        const m = pdfTekst.match(/\/TkPlakat \(([A-Za-z0-9+\/=]+)\)/);
        if(!m){ alert('Denne PDF-en kan ikke redigeres her. Det går bare med PDF-er som er lastet ned fra plakatgeneratoren etter november 2026.'); return; }
        tekst = utf8b64(m[1]);
      } else tekst = new TextDecoder().decode(buf);
      const d = JSON.parse(tekst);
      if(d.type !== 'tk-plakat') throw new Error('ukjent fil');
      Object.keys(S).forEach(k => { if(k in d) S[k] = d[k]; });
      if(d.img && !d.imgs) S.imgs[0] = {src:d.img, w:d.imgW, h:d.imgH, fx:d.fx??50, fy:d.fy??40}; // eldre utkast
      while(S.imgs.length < EKS.length) S.imgs.push({ex:true});
      S.imgs = S.imgs.map((I,n) => I.ex ? {...EKS[n], fx:I.fx??EKS[n].fx, fy:I.fy??EKS[n].fy, z:I.z||1, ex:true} : I);
      for(let n = 0; n < S.imgs.length; n++){
        const I = S.imgs[n];
        if(I.bank && !I.src){
          const b = BANK.find(x => x.id === I.bank);
          if(b){ await velgBank(n, b, true); S.imgs[n].fx = I.fx ?? b.fx; S.imgs[n].fy = I.fy ?? b.fy; S.imgs[n].z = I.z || 1; }
          else S.imgs[n] = {src:null, fx:I.fx??50, fy:I.fy??45, z:I.z||1}; // bildet finnes ikke (lenger) i banken
        }
      }
      if(ERSTATTET[S.tpl]) S.tpl = ERSTATTET[S.tpl];
      if(!TPLS[S.tpl]) S.tpl = 'bildedrevet';
      if(!SLOR[S.slor]) S.slor = 'gronn';
      if(!FMT[S.fmt] || !TPLS[S.tpl].fmts.includes(S.fmt)) S.fmt = TPLS[S.tpl].fmts[0];
      if(!('visUrl' in d)) S.visUrl = true;
      autoVariant = false; // utkastet har allerede valgt variant
      fillForm(); render();
    }catch(err){ alert('Kunne ikke åpne fila. Er det en PDF lastet ned fra plakatgeneratoren?'); console.error(err); }
  };
  r.readAsArrayBuffer(f); e.target.value = '';
}

