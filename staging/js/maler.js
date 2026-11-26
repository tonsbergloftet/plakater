/* Maler: geometri og bølger, byggeklosser, redigering direkte i plakaten og alle malene (LAYOUTS) */
'use strict';
/* ═════════ GEOMETRI (målt fra profilens Word-mal) ═════════ */

// Rammen: avrundet panel med organisk utsparing øverst til venstre for logoen.
// s = skala for utsparingen (1 = A4-størrelse).
function framePath(x0,y0,x1,y1,r,s){
  const X = v => (x0 + v*s).toFixed(1), Y = v => (y0 + v*s).toFixed(1);
  return `M${x0},${Y(171)} C${x0},${Y(153)} ${X(9)},${Y(141)} ${X(23)},${Y(141)}`
   + ` C${X(46)},${Y(141)} ${X(71)},${Y(168)} ${X(106)},${Y(167)}`
   + ` C${X(146)},${Y(166)} ${X(166)},${Y(149)} ${X(196)},${Y(119)}`
   + ` C${X(236)},${Y(76)} ${X(271)},${Y(19)} ${X(331)},${Y(6)}`
   + ` C${X(351)},${Y(2)} ${X(366)},${y0} ${X(391)},${y0}`
   + ` L${x1-r},${y0} C${x1-r*.45},${y0} ${x1},${y0+r*.45} ${x1},${y0+r}`
   + ` L${x1},${y1-r} C${x1},${y1-r*.45} ${x1-r*.45},${y1} ${x1-r},${y1}`
   + ` L${x0+r},${y1} C${x0+r*.45},${y1} ${x0},${y1-r*.45} ${x0},${y1-r} Z`;
}

// Bølgen fra Word-malen: x 0–736, y relativt til høyeste punkt.
const WAVE_BACK = [[0,122],[32,115],[64,108],[96,99],[128,87],[160,74],[192,64],[224,57],[256,52],[288,54],[320,59],[352,64],[384,70],[416,72],[448,76],[480,75],[512,65],[544,47],[576,25],[608,0],[640,-17],[672,-17],[704,-10],[736,-4]];
const WAVE_FRONT= [[0,153],[32,148],[64,143],[96,136],[128,129],[160,119],[192,106],[224,92],[256,81],[288,74],[320,72],[352,73],[384,76],[416,80],[448,83],[480,83],[512,79],[544,62],[576,38],[608,11],[640,0],[672,4],[704,8],[736,13]];

function smooth(pts){ // Catmull-Rom → kubisk Bézier
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(pts.length-1,i+2)];
    const c1=[p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6];
    const c2=[p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
// Lager bølgepath: x0..x0+w, toppen ligger på yTop, amplitude amp, flip speilvender.
function wavePath(pts,x0,w,yTop,amp,flip,yBottom){
  const m = pts.map(([x,y]) => [x0 + (flip ? 736-x : x)/736*w, yTop + y*amp]);
  if(flip) m.reverse();
  return smooth(m) + ` L${x0+w},${yBottom} L${x0},${yBottom} Z`;
}
/* Sløret er delvis gjennomsiktig, som i profilens originaler (målt: 63–89 % dekkevne,
   varierende langs bølgen). Bilde og bakgrunn skinner derfor gjennom. */
let slorN = 0;
function slorFill(farge, loddrett){
  const id = 'slor' + (slorN++);
  const stopp = [[0,.55],[.3,.88],[.55,.62],[.8,.9],[1,.78]]
    .map(([o,a]) => `<stop offset="${o}" stop-color="${farge}" stop-opacity="${a}"/>`).join('');
  return { defs: `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${loddrett?0:1}" y2="${loddrett?1:0}">${stopp}</linearGradient></defs>`, fill: `url(#${id})` };
}
function waveLayers(o){ // o: x0,w,yTop,amp,flip,yBottom,back,front
  const sl = slorFill(o.back);
  return sl.defs + `<path d="${wavePath(WAVE_BACK,o.x0,o.w,o.yTop,o.amp,o.flip,o.yBottom)}" fill="${sl.fill}"/>`
       + `<path d="${wavePath(WAVE_FRONT,o.x0,o.w,o.yTop,o.amp,o.flip,o.yBottom)}" fill="${o.front}"/>`;
}

/* ═════════ BYGGEKLOSSER ═════════ */
function imageIn(uid, clipD, bx,by,bw,bh, n){
  const I = S.imgs[n||0];
  const id = uid+'im'+Math.random().toString(36).slice(2,7);
  let inner;
  if(I.src){
    const sc = Math.max(bw/I.w, bh/I.h) * (I.z || 1);
    const w = I.w*sc, h = I.h*sc;
    const x = bx + (bw-w)*(I.fx/100), y = by + (bh-h)*(I.fy/100);
    inner = `<image href="${I.src}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" preserveAspectRatio="none"/>`;
  } else {
    const cx = bx+bw/2, cy = by+bh/2, k = Math.min(bw,bh)/9;
    inner = `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#a9c6cf"/><stop offset="1" stop-color="#4d7684"/></linearGradient></defs>
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="url(#${id}g)"/>
      <g transform="translate(${cx-k},${cy-k*.8}) scale(${k/12})" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" stroke-linejoin="round"><rect x="0" y="0" width="24" height="19" rx="2.5"/><circle cx="8" cy="7" r="2.2"/><path d="M1 17l7-7 5 5 3-3 7 6"/></g>`;
  }
  return `<clipPath id="${id}c"><path d="${clipD}"/></clipPath><g clip-path="url(#${id}c)"${EDIT?` class="klikkbilde" data-img="${n||0}"`:''}>${EDIT?'<title>Klikk for å bytte bilde</title>':''}${inner}</g>`;
}

function qrSvg(){
  let u = (S.url||'').trim(); if(!u) return '';
  if(!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try{
    const q = qrcode(0,'M'); q.addData(u); q.make();
    // Bakgrunnen fjernes, så koden tar fargen fra flaten bak (lys bunn) eller fra den hvite rammen (mørk bunn/foto)
    return q.createSvgTag({cellSize:4, margin:0, scalable:true}).replace('fill="white"', 'fill="none"').replace(/<path /, '<path fill="#1d1d1b" ');
  }catch(e){ return ''; }
}
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const KI_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="16" height="14" rx="2"/><circle cx="8" cy="10" r="1.6"/><path d="M3 17l5-4 4 3 3-2 3.5 3"/><path d="M20 2.5v4M18 4.5h4"/></svg>';

const rich = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>');
function urlBreak(u){ return esc(u||'').replace(/([\/.])/g,'$1<wbr>'); }

/* ── Redigering direkte i plakaten ──
   EDIT er sann bare når forhåndsvisningen bygges. Da blir alle tekstfelt redigerbare,
   og tomme felt vises med grå hjelpetekst. Miniatyrer og nedlasting bygges uten. */
let EDIT = false;
const PH = {pIntro:'Innledning til punktlista (valgfri)', ut3:'Underoverskrift', tx3:'Skriv brødtekst',
  stikk:'Tema', tittel:'Skriv en tittel', ingress:'Skriv en kort ingress',
  ut1:'Underoverskrift', tx1:'Skriv brødtekst', pTittel:'Overskrift over punktene',
  punkter:'Ett punkt per linje', ut2:'Underoverskrift', tx2:'Skriv brødtekst',
  praktisk:'Tid: …\nSted: …', cta:'Les mer på', url:'nettadresse', qrTekst:'SKANN MEG!',
  s2Tittel:'Skriv en tittel', s2Ut1:'Underoverskrift', s2Tx1:'Skriv brødtekst', s2Ut2:'Underoverskrift',
  s2Tx2:'Skriv brødtekst', s2Tx3:'Mer tekst', s2Slutt:'Avsluttende setning (fet)',
  s2Merknad:'Kort merknad med pil', s2Kontakt:'Kontaktinformasjon', merke:'Tekst i merket', avslutt:'Avsluttende setning (fet kursiv)',
  merkeTx:'Kort tekst', bs1:'Stikkord om bildet (valgfritt)', bs2:'Stikkord om bildet (valgfritt)', bs3:'Stikkord om bildet (valgfritt)',
};
const KIND = {tittel:'tit', tx1:'rich', tx2:'rich', tx3:'rich', s2Tx1:'rich', s2Tx2:'rich', s2Tx3:'rich', s2Slutt:'rich', punkter:'list', praktisk:'prak', url:'url'};
const SINGLE = new Set(['ut3','stikk','ut1','ut2','pTittel','cta','url','qrTekst','s2Ut1','s2Ut2','s2Slutt','bs1','bs2','bs3']);
const hasE = k => EDIT || has(k);
let EKSPORTERER = false;
function disp(k, kindOverride){ // [MANGLER] fra KI-forslag markeres i forhåndsvisningen
  const h = disp0(k, kindOverride);
  return EKSPORTERER ? h : h.replace(/\[MANGLER\]/g, '<mark class="mangler">[MANGLER]</mark>');
}
function disp0(k, kindOverride){
  const v = String(S[k]||''), kind = kindOverride || KIND[k];
  if(kind==='tit') return esc(v).replace(/\*\*(.+?)\*\*/g, '<span class="tem">$1</span>');
  if(kind==='bold') return esc(v).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  if(kind==='dline') return v.split('\n').map(x=>x.trim()).filter(Boolean).map(l => {
    const i = l.indexOf(':');
    return (i>0 && i<24) ? `<b>${esc(l.slice(0,i))}:</b>${esc(l.slice(i+1))}` : esc(l);
  }).join('<span class="sep">|</span>');
  if(kind==='rich') return rich(v);
  if(kind==='ctab'){ const l = v.split('\n'); return `<b>${esc(l[0])}</b>` + (l.length > 1 ? `<span class="sm">${esc(l.slice(1).join('\n'))}</span>` : ''); }
  if(kind==='url') return urlBreak(v);
  if(kind==='list') return v.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>`<div class="li">${esc(x)}</div>`).join('');
  if(kind==='prak') return v.split('\n').map(x=>x.trim()).filter(Boolean).map(l => {
    if(/^[-•]\s*/.test(l)) return `<div class="pb">${esc(l.replace(/^[-•]\s*/, ''))}</div>`;
    const i = l.indexOf(':');
    return (i>0 && i<24) ? `<div><b>${esc(l.slice(0,i))}:</b>${esc(l.slice(i+1))}</div>` : `<div>${esc(l)}</div>`;
  }).join('');
  return esc(v);
}
function E(k, cls, tag, style, kind){
  tag = tag || 'div';
  if(!EDIT && !has(k)) return '';
  const ed = EDIT ? ` data-k="${k}" contenteditable="plaintext-only" spellcheck="true" data-ph="${esc(PH[k]||'')}"${kind?` data-kind="${kind}"`:''}` : '';
  return `<${tag} class="${cls||''}${EDIT?' ed':''}${has(k)?'':' tom'}"${ed}${style?` style="${style}"`:''}>${disp(k, kind)}</${tag}>`;
}
function T(k, cls, tag){ return E(k, cls, tag); }
function stikk(){ return E('stikk','stikk'); }
function tittel(){ return E('tittel','tittel'); }
function liste(){ return E('punkter','liste'); }
function praktisk(){ return E('praktisk','praktisk'); }
function cta(withQr, mode){
  if(!hasE('url') && !hasE('cta')) return '';
  const q = withQr && S.qr ? qrSvg() : '';
  const C = E('cta','ctx','span'), U = S.visUrl ? E('url','u','b') : '';
  if(mode==='bar') // pil | Les mer på adresse  (som i eksempelmalene)
    return `<div class="cta bar"><div class="pil">${ARROW}</div><div class="skille"></div><div class="ct">${C} ${U}</div>${q?`<div class="qr">${q}</div>`:''}</div>`;
  if(mode==='kort') // lys boks med QR til venstre
    return `<div class="cta kort">${q?`<div class="qr">${q}</div><div class="skille"></div>`:`<div class="pil">${ARROW}</div>`}<div class="ct">${C}${U}</div></div>`;
  return `<div class="cta"><div class="pil">${ARROW}</div><div class="ct">${C}${U}</div>${q?`<div class="qr">${q}</div>`:''}</div>`;
}
function cols(parts){ // kolonner med sløræfarget skillelinje; tomme kolonner droppes
  const ps = parts.filter(x => x && x.trim());
  if(!ps.length) return '';
  return `<div class="cols">${ps.map((x,i)=>`<div class="${i?'col div':'col'}">${x}</div>`).join('')}</div>`;
}
function box(x,y,w,h,base,cls,html){
  return `<div class="box ${cls}" data-base="${base}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;font-size:${base}px">${html}</div>`;
}
function logo(x,y,w){ return `<img class="logo" src="${LOGO}" style="left:${x}px;top:${y}px;width:${w}px;height:${(w*LOGO_RATIO).toFixed(1)}px" alt="Tønsberg kommune">`; }
function kiTag(x,y){ return S.ki ? `<div class="ki" style="left:${x}px;top:${y}px">${KI_ICON}KI-generert bilde</div>` : ''; }
function panelGrad(uid,cx,cy,r){
  return `<radialGradient id="${uid}pg" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ececec"/></radialGradient>`;
}

/* Fellesmål per format */
const G = {
  a4:  {W:794, H:1123, x0:29, y0:29, x1:765, y1:1094, r:54, s:1,   logo:[84,45,95]},
  wide:{W:1280,H:720,  x0:20, y0:20, x1:1260,y1:700,  r:40, s:.72, logo:[60,32,68]},
};

/* ═════════ MALER ═════════ */
const LAYOUTS = {};
const bg = (g,uid,inner,defs) => `<svg class="bg" viewBox="0 0 ${g.W} ${g.H}"><defs>${defs||''}<clipPath id="${uid}p"><path d="${framePath(g.x0,g.y0,g.x1,g.y1,g.r,g.s)}"/></clipPath></defs><g clip-path="url(#${uid}p)">${inner}</g></svg>`;
const light = (g,uid) => `<rect width="${g.W}" height="${g.H}" fill="url(#${uid}pg)"/>`;
const lightDef = (g,uid) => panelGrad(uid,g.W*.55,g.H*.4,g.W*.75);
const ki = (x,y) => kiTag(x,y);

/* 1 · Bildeplakat. A4 er målt fra InDesign-fila (mal3_bildeplakat.idml): samme ramme og bølger som mal 8,
   men bølgen ligger lavere. Lys variant: hvit vask øverst og mørk tekst. Mørk variant: mørkning øverst og hvit tekst.
   Liggende er en tilpasning. */
LAYOUTS.bildedrevet = (uid,f) => {
  const c = SLOR[S.slor], A = f==='a4', M = !!S.mork;
  const W = A?794:1280, H = A?1123:720;
  const pn = A ? {x0:29.3,y0:28.9,x1:766.3,y1:1092.3,r:56.7} : {x0:20,y0:20,x1:1260,y1:700,r:40};
  const panelD = rrect(pn.x0,pn.y0,pn.x1,pn.y1,pn.r);
  const tf = A ? 'translate(0,173.85)' : 'matrix(1.6121,0,0,0.44,0,267)';
  const vask = A ? [638.7,-9.3,497.6,560.9] : [1100,-10,1040,420];      // 50 % vask/mørkning, myknet nedover
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      <linearGradient id="${uid}vk" gradientUnits="userSpaceOnUse" x1="${vask[0]}" y1="${vask[1]}" x2="${vask[2]}" y2="${vask[3]}"><stop offset="0" stop-color="${M?'#000':'#fff'}" stop-opacity=".5"/><stop offset="1" stop-color="${M?'#000':'#fff'}" stop-opacity="0"/></linearGradient>
      <radialGradient id="${uid}rg" gradientUnits="userSpaceOnUse" cx="${A?397.8:640}" cy="${A?505.6:330}" r="${A?426.2:560}"><stop offset="0" stop-color="#a6b9c2" stop-opacity=".1"/><stop offset="1" stop-color="#a6b9c2" stop-opacity="0"/></radialGradient>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="459.1" y1="745.8" x2="471" y2="817.9"><stop offset="0" stop-color="${c.c}" stop-opacity=".75"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/></linearGradient>
      <clipPath id="${uid}pc"><path d="${panelD}"/></clipPath>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <path d="${panelD}" fill="${NAVY}"/>
    ${imageIn(uid, panelD, pn.x0, pn.y0, pn.x1-pn.x0, pn.y1-pn.y0, 0)}
    <g clip-path="url(#${uid}pc)" pointer-events="none">
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${uid}vk)"/>
      <rect x="0" y="0" width="${W}" height="${A?982.3:640}" fill="url(#${uid}rg)"/>
    </g>
    <g pointer-events="none">
      <g transform="${tf}"><path d="${FS8.gronn}" fill="url(#${uid}sl)"/><path d="${FS8.navy}" fill="${NAVY}"/></g>
      <g transform="${A?'':'scale(.75)'}"><path d="${FS8.hvit}" fill="#fff"/><path d="${FS8.hale}" fill="#fff"/></g>
    </g>
  </svg>`;
  const q = S.qr ? qrSvg() : '';
  const ki = S.ki ? `<div class="ki" style="left:${A?50:40}px;top:${A?920:560}px">${KI_ICON}KI-generert bilde</div>` : '';
  const tekst = E('stikk','stikk') + E('tittel','tittel') + E('ingress','ingress');
  const cls = 'bp1' + (M ? ' mork' : '');
  if(A) return svg + logo(90,49,89) + ki
    + box(296,124,404,240,20,cls, tekst)
    + (q ? `<div class="qrbox7" style="left:637.5px;top:967.2px;width:103.3px;height:103.3px;padding:8px">${q}</div>` : '')
    + `<div class="box" data-base="18.22" style="left:${q?408:531}px;top:985px;width:210px;height:80.5px;justify-content:flex-end">${E('cta','qrt1','div',null,'bold')}</div>`;
  return svg + logo(63,34,66) + ki
    + box(780,64,440,230,18,cls, tekst)
    + (q ? `<div class="qrbox7" style="left:1148px;top:602px;width:88px;height:88px;padding:7px">${q}</div>` : '')
    + `<div class="box" data-base="16" style="left:${q?930:1028}px;top:620px;width:200px;height:66px;justify-content:flex-end">${E('cta','qrt1','div',null,'bold')}</div>`;
};

/* 2 · Bilde og forklaring (eksempel 02): bilde, budskap i mørkt bånd, to kolonner */
LAYOUTS.forklaring = (uid,f) => {
  const g = G[f], c = SLOR[S.slor], fr = framePath(g.x0,g.y0,g.x1,g.y1,g.r,g.s);
  const left = T('ut1','h3')+T('tx1','p')+liste();
  if(f==='a4'){
    const right = T('ut2','h3')+T('tx2','p');
    const svg = bg(g,uid, `<rect width="${g.W}" height="${g.H}" fill="#fff"/>` + imageIn(uid,fr,g.x0,g.y0,g.x1-g.x0,440)
      + waveLayers({x0:g.x0,w:g.x1-g.x0,yTop:338,amp:.55,flip:true,yBottom:g.H,back:c.c,front:NAVY})
      + `<path d="${wavePath(WAVE_FRONT,g.x0,g.x1-g.x0,652,.5,false,g.H)}" fill="#fff"/>`
      + waveLayers({x0:g.x0,w:g.x1-g.x0,yTop:1040,amp:.3,flip:true,yBottom:g.y1,back:c.c,front:NAVY}));
    return svg + logo(...g.logo) + ki(52,330)
      + box(85,426,624,222,19,'on-navy', stikk()+tittel()+T('ingress','ingress'))
      + box(85,738,624,288,16,'on-light', cols([left,right])+`<div class="spacer"></div>`+cta(true,'kort'));
  }
  const shape = `M20,178 C20,160 34,150 52,154 C100,166 140,160 182,120 C228,76 262,30 330,26 C410,22 444,80 432,170 C420,262 382,330 398,430 C412,520 436,600 470,700 L20,700 Z`;
  const svg = bg(g,uid, light(g,uid) + imageIn(uid,shape,20,20,460,680)
    + waveLayers({x0:g.x0,w:g.x1-g.x0,yTop:560,amp:.45,flip:false,yBottom:g.y1,back:c.c,front:NAVY}), lightDef(g,uid));
  return svg + logo(...g.logo) + ki(36,520)
    + box(486,44,734,520,16,'on-light', stikk()+tittel()+T('ingress','ingress')+cols([left, T('ut2','h3')+T('tx2','p')]))
    + box(640,615,580,78,14,'on-navy', `<div class="push"></div>${cta(true,'bar')}`);
};

/* 3 · Delt (eksempel 03): bilde i venstre kolonne, tekst og faktaboks til høyre */
LAYOUTS.delt = (uid,f) => {
  const g = G[f], c = SLOR[S.slor];
  let imgD, ib, wave, bxh;
  const fakta = (hasE('pTittel')||hasE('punkter')) ? `<div class="faktaboks">${T('pTittel','h3')}${liste()}</div>` : '';
  if(f==='a4'){
    const R = 352;
    imgD = `M${g.x0},236 C${g.x0},214 46,204 70,210 C120,224 168,214 214,166 C250,126 272,80 304,64 C332,52 ${R},70 ${R},100 L${R},${g.y1} L${g.x0},${g.y1} Z`;
    ib = [g.x0,50,R-g.x0,g.y1-50];
    wave = {x0:g.x0,w:g.x1-g.x0,yTop:968,amp:.5,flip:false,yBottom:g.y1};
    bxh = box(386,82,340,860,16,'on-light', stikk()+tittel()+T('ingress','ingress')+T('ut1','h3')+T('tx1','p')+fakta+`<div class="spacer"></div>`+cta(true,'kort'));
  } else {
    const R = 480;
    imgD = `M${g.x0},178 C${g.x0},160 34,150 52,154 C100,166 140,160 180,120 C222,78 250,40 300,${g.y0} L${R-30},${g.y0} C${R-12},${g.y0} ${R},${g.y0+12} ${R},${g.y0+30} L${R},${g.y1} L${g.x0},${g.y1} Z`;
    ib = [g.x0,g.y0,R-g.x0,g.y1-g.y0];
    wave = {x0:g.x0,w:g.x1-g.x0,yTop:630,amp:.35,flip:true,yBottom:g.y1};
    bxh = box(530,56,690,580,15,'on-light', stikk()+tittel()+T('ingress','ingress')+cols([T('ut1','h3')+T('tx1','p'), fakta])+`<div class="spacer"></div>`+cta(true,'kort'));
  }
  const svg = bg(g,uid, light(g,uid)+imageIn(uid,imgD,...ib)+waveLayers({...wave, back:c.c, front:NAVY}), lightDef(g,uid));
  return svg + logo(...g.logo) + ki(f==='a4'?44:36, f==='a4'?928:610) + bxh;
};

/* 4 · Tekstdrevet (eksempel 04 og Word-malen): lys flate, mye tekst */
LAYOUTS.tekst = (uid,f) => {
  const g = G[f], c = SLOR[S.slor];
  const fakta = (hasE('pTittel')||hasE('punkter')) ? T('pTittel','h3')+liste() : '';
  if(f==='a4'){
    const svg = bg(g,uid, light(g,uid)+waveLayers({x0:g.x0,w:g.x1-g.x0,yTop:888,amp:.72,flip:true,yBottom:g.y1,back:c.c,front:NAVY}), lightDef(g,uid));
    return svg + logo(...g.logo) + ikonHer(560,52,160,NAVY,'#f4f5f6')
      + box(85,224,624,640,19,'on-light', stikk()+tittel()+T('ingress','ingress')+T('ut1','h3')+T('tx1','p')+T('ut2','h3')+T('tx2','p')+fakta+praktisk())
      + box(85,985,624,92,16,'on-navy', `<div class="push"></div>${cta(true,'bar')}`);
  }
  const svg = bg(g,uid, light(g,uid)+waveLayers({x0:g.x0,w:g.x1-g.x0,yTop:552,amp:.42,flip:false,yBottom:g.y1,back:c.c,front:NAVY}), lightDef(g,uid));
  const harIk = !!(S.ikon && ikonSvg(S.ikon));
  return svg + logo(...g.logo) + (harIk ? ikonHer(1070,40,160,NAVY,'#f4f5f6') : '')
    + box(190,82,harIk?870:1030,176,18,'on-light', stikk()+tittel()+T('ingress','ingress'))
    + box(70,286,1150,264,16,'on-light', cols([T('ut1','h3')+T('tx1','p'), T('ut2','h3')+T('tx2','p')+fakta, praktisk()]))
    + box(70,624,1000,70,14,'on-navy', `<div class="push"></div>${cta(true,'bar')}`);
};

/* 5 · Flere bilder (eksempel 05): to bilder i organiske former */
LAYOUTS.bilder = (uid,f) => {
  const g = G[f], c = SLOR[S.slor];
  const colA = T('ut1','h3')+T('tx1','p'), colB = T('ut2','h3')+T('tx2','p')+liste();
  if(f==='a4'){
    const p1 = `M432,112 C428,70 462,42 522,40 L726,32 C752,31 765,46 765,72 L765,326 C700,348 566,388 476,418 C450,426 434,410 432,384 Z`;
    const p2 = `M428,504 C424,474 444,450 484,440 C584,414 690,384 765,362 L765,712 C700,716 560,712 478,708 C446,706 430,690 429,662 Z`;
    const svg = bg(g,uid, light(g,uid)
      + imageIn(uid,p1,430,30,335,400,0) + imageIn(uid,p2,428,360,337,356,1)
      + waveLayers({x0:g.x0,w:g.x1-g.x0,yTop:952,amp:.42,flip:true,yBottom:g.y1,back:c.c,front:NAVY}), lightDef(g,uid));
    return svg + logo(...g.logo) + ki(56,226)
      + box(80,262,334,436,19,'on-light', stikk()+tittel()+T('ingress','ingress'))
      + box(85,742,624,224,15,'on-light', cols([colA,colB]))
      + box(85,1008,624,72,15,'on-navy', `<div class="push"></div>${cta(true,'bar')}`);
  }
  const p1 = `M700,96 C694,54 726,32 780,32 L1196,30 C1232,30 1246,50 1244,90 L1238,236 C1234,290 1190,310 1110,322 L800,370 C746,378 714,350 708,312 Z`;
  const p2 = `M702,500 C698,452 726,424 786,414 L1150,360 C1212,352 1246,380 1245,432 L1245,596 C1245,632 1218,646 1180,646 L766,646 C726,646 706,626 704,592 Z`;
  const svg = bg(g,uid, light(g,uid)
    + imageIn(uid,p1,694,30,552,350,0) + imageIn(uid,p2,698,350,548,300,1)
    + waveLayers({x0:g.x0,w:g.x1-g.x0,yTop:592,amp:.4,flip:false,yBottom:g.y1,back:c.c,front:NAVY}), lightDef(g,uid));
  return svg + logo(...g.logo) + ki(1080,300)
    + box(66,168,604,236,18,'on-light', stikk()+tittel()+T('ingress','ingress'))
    + box(66,420,604,186,14,'on-light', cols([colA,colB]))
    + box(640,628,580,66,14,'on-navy', `<div class="push"></div>${cta(true,'bar')}`);
};

/* 6 · Bilde og QR (ICDP-stil): bilde øverst, slørbølge, tekst på hvitt */
LAYOUTS.bildetekst = (uid,f) => {
  const g = G[f], c = SLOR[S.slor], fr = framePath(g.x0,g.y0,g.x1,g.y1,g.r,g.s);
  const W = g.x1-g.x0;
  const q = S.qr ? qrSvg() : '';
  if(f==='a4'){
    const wave = {x0:0,w:g.W,yTop:465,amp:.82,flip:false,yBottom:g.H};
    const svg = `<svg class="bg" viewBox="0 0 ${g.W} ${g.H}"><defs><clipPath id="${uid}p"><path d="${fr}"/></clipPath></defs>
      <g clip-path="url(#${uid}p)">${imageIn(uid,fr,g.x0,g.y0,W,620)}</g>
      ${waveLayers({...wave, back:c.c, front:'#ffffff'})}</svg>`;
    const badge = q ? `<div class="qrbadge" style="left:560px;top:64px;width:186px;height:186px;--qfs:21px"><div class="qr">${q}</div>${E('qrTekst','','span')}</div>` : '';
    const html = stikk()+tittel()+T('ingress','ingress')+T('tx1','p')+praktisk()+cta(false);
    return svg + logo(...g.logo) + badge + kiTag(62, 548) + box(85,628,624,450,18,'on-light',html);
  }
  // Liggende: tekst til venstre på hvitt, bilde til høyre med organisk kant
  const ex = 590;
  const edge = `M${ex+40},0 C${ex-10},120 ${ex+70},250 ${ex+18},380 C${ex-28},500 ${ex+10},610 ${ex+46},${g.H}`;
  const imgD = edge + ` L${g.W},${g.H} L${g.W},0 Z`;
  const bandD = `M${ex+40-24},0 C${ex-10-24},120 ${ex+70-24},250 ${ex+18-24},380 C${ex-28-24},500 ${ex+10-24},610 ${ex+46-24},${g.H} L${g.W},${g.H} L${g.W},0 Z`;
  const svg = `<svg class="bg" viewBox="0 0 ${g.W} ${g.H}"><defs><clipPath id="${uid}p"><path d="${fr}"/></clipPath></defs>
    <g clip-path="url(#${uid}p)">${(sl => sl.defs + `<path d="${bandD}" fill="${sl.fill}"/>`)(slorFill(c.c, true))}${imageIn(uid,imgD,ex-30,g.y0,g.x1-ex+30,g.y1-g.y0)}</g></svg>`;
  const badge = q ? `<div class="qrbadge" style="left:1050px;top:52px;width:170px;height:170px;--qfs:19px"><div class="qr">${q}</div>${E('qrTekst','','span')}</div>` : '';
  const html = stikk()+tittel()+T('ingress','ingress')+T('tx1','p')+praktisk()+cta(false);
  // Clip uten utsparing for bildet til høyre: rammen trengs ikke på hvit flate
  return `<svg class="bg" viewBox="0 0 ${g.W} ${g.H}"><path d="${fr}" fill="#fff"/></svg>` + svg + logo(...g.logo) + badge + kiTag(1090,656) + box(66,150,462,540,16,'on-light',html);
};

/* 6b · Side 2 (bakside) til ICDP-malen */
LAYOUTS.bildetekst2 = (uid) => {
  const g = G.a4, c = SLOR[S.slor], fr = framePath(g.x0,g.y0,g.x1,g.y1,g.r,g.s);
  const I = S.imgs[2], P = S.imgs[3];
  let top = 140, out = '';
  // Illustrasjon øverst til høyre, med merknad og pil
  if(I.src){
    const ix = 476, iy = 52, iw = 252, ih = 340;
    const sc = Math.min(iw/I.w, ih/I.h), w = I.w*sc, h = I.h*sc;
    const x = ix + (iw-w)/2, y = iy;
    out += `<svg class="bg" viewBox="0 0 ${g.W} ${g.H}"><defs><clipPath id="${uid}ill"><rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="26"/></clipPath></defs>
      <image href="${I.src}" x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" clip-path="url(#${uid}ill)" preserveAspectRatio="none"${EDIT?' class="klikkbilde" data-img="2"':''}/>
      ${has('s2Merknad') ? `<path d="M318,206 C352,178 398,170 ${(x-16).toFixed(0)},182" fill="none" stroke="#1d1d1b" stroke-width="7" stroke-linecap="round"/>
      <path d="M${(x-30).toFixed(0)},166 L${(x-4).toFixed(0)},184 L${(x-32).toFixed(0)},200 Z" fill="#1d1d1b" stroke="#1d1d1b" stroke-width="3" stroke-linejoin="round"/>` : ''}</svg>`;
    if(hasE('s2Merknad')) out += E('s2Merknad','merknad','div','left:132px;top:258px;width:300px');
    top = y + h + 44;
  }
  // Kontaktboks nederst
  let bottom = 1060;
  if(hasE('s2Kontakt')){
    const by = 948, bh = 104, withP = !!P.src;
    out += `<div class="kontakt" style="left:${withP?176:85}px;top:${by}px;width:${withP?544:624}px;height:${bh}px;background:${c.c};padding:0 26px 0 ${withP?120:26}px">${E('s2Kontakt','kt')}</div>`;
    if(withP){
      const d = 156, cx = 104, cy = by + bh/2 - d/2 + 8;
      out += `<div class="avatar" style="left:${cx}px;top:${cy}px;width:${d}px;height:${d}px;background:${c.c}"></div>`;
      const ph = 176, pw = ph * P.w / P.h;
      out += `<img class="avatar-img" src="${P.src}" style="left:${(cx + d/2 - pw/2).toFixed(1)}px;top:${cy + d - ph + 6}px;width:${pw.toFixed(1)}px;height:${ph}px" alt="">`;
    }
    bottom = by - 36;
  }
  const html = E('s2Tittel','tittel m') + E('s2Ut1','h3') + E('s2Tx1','p') + E('s2Ut2','h3') + E('s2Tx2','p') + E('s2Tx3','p') + E('s2Slutt','p slutt');
  return `<svg class="bg" viewBox="0 0 ${g.W} ${g.H}"><path d="${fr}" fill="#fff" stroke="${c.c}" stroke-width="3"/></svg>`
    + logo(...g.logo) + out + box(85, Math.max(top, 210), 624, bottom - Math.max(top, 210), 17, 'on-light s2', html);
};

const INV7 = {"gronn": "M-124.6,537.3 C-114.4,538.0 -104.4,540.5 -94.1,541.1 C-73.8,542.3 -53.3,541.0 -33.2,539.0 C-33.2,539.0 -33.2,539.0 -33.2,539.0 C-11.4,536.9 10.2,533.6 31.7,530.0 C38.5,528.8 45.4,527.6 52.3,526.4 C71.1,523.2 89.0,518.5 107.2,512.6 C120.0,508.4 132.9,504.6 145.2,499.2 C145.2,499.2 145.2,499.2 145.2,499.2 C145.2,499.2 145.2,499.2 145.2,499.2 C173.4,486.8 201.5,476.4 231.8,470.3 C240.4,468.5 248.9,467.0 257.5,465.4 C282.6,460.9 309.3,464.6 334.6,466.1 C334.6,466.1 334.6,466.1 334.6,466.1 C369.0,468.2 402.6,476.1 436.8,480.4 C446.5,481.7 456.2,482.6 466.0,483.1 C475.5,483.5 485.1,483.5 494.6,482.7 C502.9,481.9 511.7,481.7 519.8,479.8 C534.7,476.3 549.3,467.5 562.1,459.4 C562.1,459.4 562.1,459.4 562.1,459.4 C577.1,450.0 591.5,439.2 605.3,428.1 C615.3,420.1 625.0,411.6 635.9,404.8 C643.6,400.1 651.9,396.3 660.8,394.4 C684.3,389.5 707.2,399.3 730.0,403.3 C742.9,405.5 755.8,407.3 768.7,409.3 C768.7,409.3 768.7,409.3 768.7,409.3 C786.4,412.0 804.1,415.1 822.1,416.5 C830.0,417.2 838.1,417.6 846.1,417.9 C846.1,417.9 846.1,417.9 846.1,417.9 C854.6,418.2 838.3,1015.5 820.2,1014.9 C533.1,1004.9 246.0,994.8 -41.1,984.8 C-61.4,984.1 -81.7,983.4 -102.1,982.7 C-109.4,982.4 -116.8,982.1 -124.1,981.9 C-125.6,981.9 -128.3,982.2 -129.7,981.7 C-132.0,980.9 -131.4,980.3 -133.1,978.6 C-134.7,977.6 -136.3,976.5 -137.8,975.4", "navy": "M-21.3,558.8 C-12.5,559.1 -3.8,560.9 5.0,561.1 C22.5,561.5 40.0,559.8 57.2,557.5 C57.2,557.5 57.2,557.5 57.2,557.5 C75.8,555.1 94.2,551.6 112.5,547.8 C118.4,546.6 124.2,545.4 130.1,544.2 C146.2,540.8 161.3,536.3 176.8,530.6 C187.6,526.7 198.5,523.0 208.9,518.0 C208.9,518.0 208.9,518.0 208.9,518.0 C208.9,518.0 208.9,518.0 208.9,518.0 C232.8,506.5 256.5,496.8 282.3,490.6 C289.6,488.9 296.9,487.3 304.2,485.7 C325.6,481.0 348.5,483.4 370.3,484.0 C370.3,484.0 370.3,484.0 370.3,484.0 C399.9,484.8 428.9,490.5 458.3,493.2 C466.7,494.0 475.0,494.5 483.4,494.6 C491.6,494.7 499.8,494.4 508.0,493.4 C515.1,492.5 522.6,492.1 529.5,490.2 C542.1,486.7 554.4,478.7 565.2,471.5 C565.2,471.5 565.2,471.5 565.2,471.5 C577.8,462.9 589.7,453.2 601.3,443.3 C609.6,436.1 617.6,428.5 626.8,422.4 C633.3,418.1 640.3,414.6 647.8,412.8 C667.8,407.9 687.8,415.6 707.4,418.3 C718.5,419.8 729.6,421.0 740.7,422.3 C740.7,422.3 740.7,422.3 740.7,422.3 C756.0,424.1 771.3,426.2 786.7,426.9 C793.6,427.2 800.5,427.4 807.4,427.3 C807.4,427.3 807.4,427.3 807.4,427.3 C814.7,427.3 818.6,939.9 803.0,939.9 C556.6,939.9 310.2,939.9 63.8,939.9 C46.3,939.9 28.9,939.9 11.4,939.9 C5.1,939.9 -1.2,939.9 -7.5,939.9 C-8.8,939.9 -11.1,940.3 -12.3,939.9 C-14.3,939.3 -13.8,938.7 -15.3,937.4 C-16.7,936.5 -18.1,935.7 -19.5,934.8", "hvit": "M0.2,-40.2 C13.9,-17.7 5.2,9.7 0.2,33.4 C-1.4,41.1 -2.7,49.0 -3.1,56.9 C-3.1,56.9 -3.1,56.9 -3.1,56.9 C-4.4,82.6 6.0,109.7 19.0,131.5 C22.8,137.7 26.9,143.7 31.5,149.3 C39.5,159.1 49.0,167.6 59.5,174.5 C65.4,178.4 71.5,181.9 77.8,185.2 C93.7,193.4 111.2,199.2 129.2,199.1 C129.2,199.1 129.2,199.1 129.2,199.1 C159.9,198.8 190.3,183.8 213.9,165.1 C220.6,159.7 227.0,153.8 232.8,147.4 C239.4,140.2 246.6,133.4 252.7,125.6 C258.5,118.1 263.9,110.1 270.4,103.0 C288.4,83.3 307.7,64.4 330.2,49.9 C330.2,49.9 330.2,49.9 330.2,49.9 C330.2,49.9 330.2,49.9 330.2,49.9 C347.3,38.9 367.0,33.1 386.8,29.5 C386.8,29.5 386.8,29.5 386.8,29.5 C386.8,29.5 386.8,29.5 386.8,29.5 C386.8,29.5 386.8,29.5 386.8,29.5 C386.8,29.5 386.8,29.5 386.8,29.5 C386.8,29.5 386.8,29.5 386.8,29.5 C406.8,25.9 427.1,25.0 447.1,22.4 C452.9,21.6 458.7,20.7 464.5,19.6 C472.2,18.1 479.9,16.3 487.5,14.3 C494.0,12.7 501.0,10.3 505.4,4.9 C509.3,0.2 507.8,-7.0 505.1,-11.9 C487.8,-43.3 467.9,-73.5 449.5,-104.1 C431.1,-134.5 412.8,-164.9 394.5,-195.2 C385.3,-210.4 376.1,-225.7 367.0,-240.9 C362.9,-247.6 359.3,-256.1 354.2,-262.1 C352.5,-264.2 351.5,-264.2 349.1,-265.3 C344.3,-267.4 340.2,-269.6 335.0,-270.4 C324.7,-272.1 314.4,-275.1 303.9,-275.3 C295.6,-275.4 284.8,-273.4 276.7,-271.2 C273.1,-270.2 269.9,-267.9 266.5,-266.5 C261.1,-264.4 255.6,-262.7 250.3,-260.5 C243.4,-257.6 236.2,-255.0 229.5,-251.7 C221.2,-247.6 213.5,-242.3 205.7,-237.5 C196.1,-231.6 185.5,-228.4 176.0,-222.6 C164.6,-215.5 152.6,-209.6 141.0,-202.9 C126.1,-194.3 111.6,-185.1 96.9,-176.2 C87.3,-170.5 77.8,-164.7 68.2,-158.9 C55.8,-151.5 43.0,-145.2 30.6,-137.7 C26.9,-135.4 23.8,-133.4 20.5,-130.5 C17.5,-127.8 13.1,-123.9 11.1,-120.4 C9.8,-118.0 9.7,-114.5 8.8,-111.9 C7.9,-109.2 6.5,-107.0 5.4,-104.5 C2.1,-97.6 0.6,-89.8 -0.4,-82.2 C-1.2,-75.7 -2.5,-68.4 -1.8,-62.1 C-1.4,-58.6 -1.0,-55.3 -0.7,-51.8 C-0.7,-50.9 -0.1,-49.2 -0.0,-48.4 C0.3,-46.5 -0.3,-45.5 -0.3,-43.9", "hale": "M67.7,179.6 C67.7,179.6 33.9,123.3 33.9,123.3 C33.9,123.3 -12.3,151.0 -12.3,151.0 C-12.3,151.0 21.6,207.4 21.6,207.4 C21.6,207.4 25.4,152.5 67.7,179.6", "merke": "M664.3,559.7 C698.5,560.9 727.0,540.7 727.9,514.6 C728.9,488.4 701.8,466.3 667.6,465.1 C633.4,463.9 604.9,484.1 604.0,510.2 C603.1,536.4 630.1,558.5 664.3,559.7 Z", "glans": "M665.0,559.9 C699.3,560.5 727.4,539.8 728.0,513.6 C728.5,487.4 701.1,465.6 666.9,465.0 C632.7,464.3 604.5,485.0 604.0,511.2 C603.5,537.4 630.8,559.2 665.0,559.9 Z"};

/* 7 · Invitasjon. A4 er målt fra InDesign-fila (mal1_invitasjon.idml), 1 pt = 4/3 px.
   Liggende versjon er en tilpasning laget her. */
// Standardikon i det gule merket når ingen ikon er valgt (turistinformasjon fra ikonbiblioteket)
const IKON_STD = "<svg fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 53.700 53.700\"><path style=\"fill:currentColor\" d=\"M23.190,17.527c.2070312,0,.375-.1679688.375-.375v-2.035h.9555664v1.020c0,.2070312.167.375.375.375h1.087c.2070312,0,.375-.1679688.375-.375s-.1679688-.375-.375-.375h-.7124023v-1.020c0-.2070312-.1679688-.375-.375-.375h-1.705c-.2070312,0-.375.167-.375.375v2.410c0,.2070312.167.375.375.375Z\"/><path style=\"fill:currentColor\" d=\"M27.133,16.511h.6650391c.2070312,0,.375-.1679688.375-.375s-.1679688-.375-.375-.375h-.6650391c-.2070312,0-.375.167-.375.375s.1679688.375.375.375Z\"/><path style=\"fill:currentColor\" d=\"M28.913,16.511h.6230469c.2070312,0,.375-.1679688.375-.375v-1.020h.9550781v2.035c0,.2070312.167.375.375.375h1.055c.2070312,0,.375-.1679688.375-.375s-.1679688-.375-.375-.375h-.6801758v-2.035c0-.2070312-.1679688-.375-.375-.375h-1.705c-.2070312,0-.375.167-.375.375v1.020h-.2480469c-.2070312,0-.375.167-.375.375s.1679688.375.375.375Z\"/><path style=\"fill:currentColor\" d=\"M35.789,36.978l-2.660-.6518555v-3.221c0-.2070312-.1679688-.375-.375-.375h-1.138v-13.432h.4677734c.3452148,0,.625-.2797852.625-.625s-.2797852-.625-.625-.625h-9.625v-.8955078c0-.4140625-.3359375-.75-.75-.75s-.75.335-.75.75v1.732c0,.203125.082.3974609.228.5390625.145.140625.334.2167969.545.2104492l.2885742-.0092773v12.729h-.7709961c-.4140625,0-.75.335-.75.75v3.428c0,.0441284.017.0823975.025.1243896l-2.510.6124268c-.2011719.048-.324707.251-.2753906.453.0415039.171.1953125.286.3637695.286.0297852,0,.0595703-.003418.089-.0107422l2.989-.729187c.0237427.002.0442505.013.0685425.013.4140625,0,.75-.3359375.75-.75v-2.678h.7709961c.4140625,0,.75-.3359375.75-.75v-13.807h7.344v13.807c0,.2070312.167.375.375.375h1.138v3.140c0,.1728516.118.3232422.285.3642578l2.945.7216797c.0302734.007.0600586.010.0898438.010.168457,0,.3217773-.1147461.363-.2856445.049-.2011719-.0737305-.4042969-.2749023-.4536133Z\"/><path style=\"fill:currentColor\" d=\"M38.014,37.746l-1.169-.3828125c-.1958008-.0639648-.4086914.042-.4731445.239s.0429688.408.2397461.473l1.169.3828125c.0385742.012.078125.018.1166992.018.1577148,0,.3046875-.1000977.356-.2583008.064-.1967773-.0429688-.4086914-.2397461-.4731445Z\"/><path style=\"fill:currentColor\" d=\"M39.419,38.304l-.4428711-.1494141c-.1967773-.0654297-.4091797.040-.4755859.235-.065918.195.0395508.408.2353516.475l.4428711.149c.0400391.013.0805664.019.1201172.019.1567383,0,.3027344-.0986328.355-.2553711.065-.1958008-.0395508-.4086914-.2353516-.4750977Z\"/><path style=\"fill:currentColor\" d=\"M17.034,37.600l-1.270.4047852c-.1972656.062-.3066406.273-.2436523.471.0507812.159.1982422.261.3574219.261.0375977,0,.0761719-.0058594.113-.0175781l1.270-.4047852c.1972656-.0629883.306-.2739258.243-.4711914-.0629883-.1977539-.2739258-.3061523-.4711914-.2436523Z\"/><path style=\"fill:currentColor\" d=\"M14.805,38.404l-.5371094.202c-.1938477.073-.2915039.289-.21875.483.0566406.150.199707.242.3510742.242.0439453,0,.0888672-.0078125.132-.0239258l.5371094-.2026367c.1938477-.0732422.291-.2895508.218-.4833984-.0727539-.1933594-.2885742-.2890625-.4833984-.21875Z\"/><path style=\"fill:currentColor\" d=\"M26.259,22.181c.2070312,0,.375-.1679688.375-.375v-1.467c0-.2070312-.1679688-.375-.375-.375s-.375.167-.375.375v1.467c0,.2070312.167.375.375.375Z\"/><path style=\"fill:currentColor\" d=\"M28.678,21.806v-1.467c0-.2070312-.1679688-.375-.375-.375s-.375.167-.375.375v1.467c0,.2070312.167.375.375.375s.375-.1679688.375-.375Z\"/><path style=\"fill:currentColor\" d=\"M27.906,26.180v-.7700195c0-.3452148-.2797852-.625-.625-.625s-.625.279-.625.625v.7700195c0,.3452148.279.625.625.625s.625-.2797852.625-.625Z\"/><path style=\"fill:currentColor\" d=\"M29.950,31.137v-1.467c0-.3452148-.2797852-.625-.625-.625s-.625.279-.625.625v1.467c0,.3452148.279.625.625.625s.625-.2797852.625-.625Z\"/><path style=\"fill:currentColor\" d=\"M25.862,31.137v-1.467c0-.3452148-.2797852-.625-.625-.625s-.625.279-.625.625v1.467c0,.3452148.279.625.625.625s.625-.2797852.625-.625Z\"/><path style=\"fill:currentColor\" d=\"M31.575,35.852c-.9979248-.1605835-1.983-.2503052-2.896-.2844238v-1.979c0-.2070312-.1679688-.375-.375-.375h-2.124c-.067627-.0250244-.138855-.043457-.21521-.043457-.3452148,0-.625.279-.625.625v1.995l-2.174.1574097c-.206543.014-.3623047.193-.3476562.400.0136719.197.1787109.348.3735352.348.0087891,0,.0180664-.0004883.026-.0009766l2.569-.1858521c.0574341.017.1148071.035.1779175.035.3452148,0,.625-.2797852.625-.625v-1.958h1.339v1.958c0,.0233154.009.0436401.013.0657959.004.026001.005.0531006.015.0769653.008.0214233.024.0380249.037.057251.013.0211792.024.0444336.042.0623779.016.0168457.038.0269165.057.0404053.020.013916.037.0308838.060.0407104.022.0096436.047.0106812.071.0159302.023.005127.045.0150757.070.015564.972.0175781,2.064.1201172,3.159.2958984.020.003418.040.0048828.060.0048828.180,0,.340332-.1313477.369-.3154297.033-.2045898-.105957-.3969727-.3105469-.4296875Z\"/><\/svg>";
const MEGAFON = '<svg viewBox="0 0 48 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 15h5l14-8v26l-14-8h-5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z"/><path d="M19 25l2 9h5l-2-9"/><path d="M33 10v20"/><path d="M38 20h6M37 13l5-3M37 27l5 3M4 16l3 1M3 21h3M4 26l3-1"/></svg>';
// Ikon i plakaten. farge = ikonfarge, bunn = flaten bak (brukes til «utsparinger» i ikonet)
function ikonHer(x,y,str,farge,bunn){
  const sv = ikonSvg(S.ikon); if(!sv) return '';
  return `<div class="ikon7"${EDIT?' data-ikon="1" title="Klikk for å bytte ikon"':''} style="left:${x}px;top:${y}px;width:${str}px;height:${str}px;color:${farge};--ikbg:${bunn}">${sv}</div>`;
}
function rrect(x0,y0,x1,y1,r,bl){ // avrundet rektangel; bl=false gir rett hjørne nede til venstre
  return `M${x0},${y0+r} Q${x0},${y0} ${x0+r},${y0} L${x1-r},${y0} Q${x1},${y0} ${x1},${y0+r} L${x1},${y1-r} Q${x1},${y1} ${x1-r},${y1} L${bl===false?x0:x0+r},${y1} ${bl===false?'':`Q${x0},${y1} ${x0},${y1-r}`} Z`;
}
LAYOUTS.invitasjon = (uid,f) => {
  const c = SLOR[S.slor], A = f==='a4';
  const W = A?794:1280, H = A?1123:720;
  // A4 gir formene direkte; liggende skalerer dem inn i et lavere bølgefelt
  const tf = A ? '' : 'matrix(1.6121,0,0,0.55,0,110)';
  const ph = A ? {x0:22.1,y0:24.6,x1:771,y1:561.3,r:37.8} : {x0:20,y0:20,x1:1260,y1:418,r:30};
  const photoD = rrect(ph.x0,ph.y0,ph.x1,ph.y1,ph.r,false);
  const mork = A ? [200,560] : [140,418];          // mørkning av bildet mot bunnen
  const bunn = A ? [597.7,1114.9] : [380,710];          // mørkning av blåfeltet mot bunnen
  const g0 = A ? [450,435.7,461.9,507.6] : [725,349.6,744.6,389.2]; // slørets fade
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      <clipPath id="${uid}ph"><path d="${photoD}"/></clipPath>
      <linearGradient id="${uid}dk" gradientUnits="userSpaceOnUse" x1="0" y1="${mork[0]}" x2="0" y2="${mork[1]}"><stop offset="0" stop-opacity="0"/><stop offset="1" stop-opacity=".8"/></linearGradient>
      <linearGradient id="${uid}bn" gradientUnits="userSpaceOnUse" x1="0" y1="${bunn[0]}" x2="0" y2="${bunn[1]}"><stop offset="0" stop-opacity="0"/><stop offset="1" stop-opacity=".35"/></linearGradient>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="${g0[0]}" y1="${g0[1]}" x2="${g0[2]}" y2="${g0[3]}"><stop offset="0" stop-color="${c.c}" stop-opacity=".75"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/></linearGradient>
      <filter id="${uid}bl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${A?24:20}"/></filter>
      <filter id="${uid}lt" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feFlood flood-color="${NAVY}" result="n"/><feBlend in="SourceGraphic" in2="n" mode="lighten" result="l"/><feComposite in="SourceGraphic" in2="l" operator="arithmetic" k1="0" k2=".65" k3=".35" k4="0"/></filter>
      <filter id="${uid}sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="${A?13:11}" dy="${A?13:11}" stdDeviation="12" flood-color="#000" flood-opacity=".35"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <g clip-path="url(#${uid}ph)"><g filter="url(#${uid}lt)">${imageIn(uid, photoD, ph.x0, ph.y0, ph.x1-ph.x0, ph.y1-ph.y0, 0)}</g></g>
    <g clip-path="url(#${uid}ph)" pointer-events="none">
      <rect x="${ph.x0}" y="${ph.y0}" width="${ph.x1-ph.x0}" height="${ph.y1-ph.y0}" fill="url(#${uid}dk)"/>
    </g>
    <g pointer-events="none">
      <g transform="${tf}"><path d="${INV7.gronn}" fill="url(#${uid}sl)"/></g>
      <g transform="${tf}"><path d="${INV7.navy}" fill="${NAVY}"/></g>
      <rect x="-20" y="${A?864.3:540}" width="${W+40}" height="${A?262:200}" fill="${NAVY}"/>
      <rect x="-20" y="${bunn[0]}" width="${W+40}" height="${H-bunn[0]+20}" fill="url(#${uid}bn)"/>
      <g transform="${A?'':'scale(.75)'}"><path d="${INV7.hvit}" fill="#fff"/><path d="${INV7.hale}" fill="#fff"/></g>
    </g>
  </svg>`;
  const q = S.qr ? qrSvg() : '';
  const qrDel = q ? (A
    ? `<div class="box" data-base="18.2" style="left:42px;top:362px;width:134px;height:92px;justify-content:flex-end">${E('cta','qrt7','div',null,'bold')}</div><div class="qrbox7" style="left:57.4px;top:469.3px;width:103.4px;height:103.4px">${q}</div>`
    : `<div class="box" data-base="16" style="left:34px;top:176px;width:150px;height:82px;justify-content:flex-end">${E('cta','qrt7','div',null,'bold')}</div><div class="qrbox7" style="left:62px;top:266px;width:92px;height:92px;padding:6px">${q}</div>`) : '';
  const merke = has('merke') ? (A
    ? `<div class="merke7${has('merke')?'':' tom'}" style="left:604px;top:465px;width:124px;height:95px;transform:rotate(2deg)">
         <svg viewBox="0 0 124 95" style="position:absolute;inset:0;overflow:visible"><defs><linearGradient id="${uid}gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
         <ellipse cx="62" cy="47.5" rx="62" ry="47.5" fill="#f1be48" filter="url(#${uid}sh)"/><ellipse cx="62" cy="47.5" rx="62" ry="47.5" fill="url(#${uid}gl)"/></svg>
         ${S.ikon && ikonSvg(S.ikon) ? `<div${EDIT?' data-ikon="1"':''} style="position:absolute;left:27px;top:-6px;width:70px;height:70px;color:${NAVY};--ikbg:#f4cf72">${ikonSvg(S.ikon)}</div>` : `<div${EDIT?' data-ikon="1"':''} style="position:absolute;left:27px;top:-6px;width:70px;height:70px;color:${NAVY};--ikbg:#f4cf72">${IKON_STD}</div>`}
         <div style="position:absolute;left:4px;right:4px;top:46px">${E('merke','mt')}</div></div>`
    : `<div class="merke7${has('merke')?'':' tom'}" style="left:1092px;top:300px;width:124px;height:95px;transform:rotate(2deg)">
         <svg viewBox="0 0 124 95" style="position:absolute;inset:0;overflow:visible"><defs><linearGradient id="${uid}gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
         <ellipse cx="62" cy="47.5" rx="62" ry="47.5" fill="#f1be48" filter="url(#${uid}sh)"/><ellipse cx="62" cy="47.5" rx="62" ry="47.5" fill="url(#${uid}gl)"/></svg>
         ${S.ikon && ikonSvg(S.ikon) ? `<div${EDIT?' data-ikon="1"':''} style="position:absolute;left:27px;top:-6px;width:70px;height:70px;color:${NAVY};--ikbg:#f4cf72">${ikonSvg(S.ikon)}</div>` : `<div${EDIT?' data-ikon="1"':''} style="position:absolute;left:27px;top:-6px;width:70px;height:70px;color:${NAVY};--ikbg:#f4cf72">${IKON_STD}</div>`}
         <div style="position:absolute;left:4px;right:4px;top:46px">${E('merke','mt')}</div></div>`) : '';
  const topp = E('stikk','stikk') + E('tittel','tittel') + E('ingress','ingress');
  const brod = E('ut1','bi') + E('tx1','p') + E('tx2','p') + E('avslutt','bi');
  const kiTop = A ? 36 : 30;
  const ki = S.ki ? `<div class="ki" style="right:${A?40:36}px;top:${kiTop}px">${KI_ICON}KI-generert bilde</div>` : '';
  if(A) return svg + logo(84,45,92.5) + ki + qrDel + merke
    + box(88,563,618,222,20,'inv7', topp + E('praktisk','dline7','div','margin-top:.95em','dline'))
    + box(88,796,618,244,14.667,'', `<div class="body7">${brod}</div><div class="rule7"></div>`)
    + `<div class="fot7" style="top:1059px"><span class="m">Tønsberg</span> <span class="l">kommune</span></div>`;
  return svg + logo(63,34,69) + ki + qrDel + merke
    + `<div class="box inv7" data-base="17" style="left:140px;top:412px;width:1000px;height:236px;font-size:17px;justify-content:center">${topp}${E('praktisk','dline7','div','margin-top:1.1em','dline')}</div>`
    + `<div class="fot7" style="top:672px;font-size:14px"><span class="m">Tønsberg</span> <span class="l">kommune</span></div>`;
};

const FS8 = {"hvit": "M8.7,-34.0 C21.8,-12.4 13.5,13.9 8.7,36.7 C7.2,44.1 5.9,51.6 5.5,59.2 C5.5,59.2 5.5,59.2 5.5,59.2 C4.3,84.0 14.2,110.0 26.8,130.9 C30.3,136.9 34.3,142.6 38.7,148.0 C46.4,157.5 55.5,165.6 65.7,172.3 C71.3,176.0 77.2,179.4 83.2,182.5 C98.5,190.4 115.3,196.0 132.6,195.9 C132.6,195.9 132.6,195.9 132.6,195.9 C162.1,195.6 191.2,181.2 213.9,163.2 C220.4,158.0 226.5,152.4 232.1,146.3 C238.5,139.3 245.4,132.8 251.2,125.3 C256.8,118.0 262.0,110.3 268.2,103.5 C285.5,84.6 304.0,66.5 325.7,52.6 C325.7,52.6 325.7,52.6 325.7,52.6 C325.7,52.6 325.7,52.6 325.7,52.6 C342.1,42.0 361.0,36.4 380.1,33.0 C380.1,33.0 380.1,33.0 380.1,33.0 C380.1,33.0 380.1,33.0 380.1,33.0 C380.1,33.0 380.1,33.0 380.1,33.0 C380.1,33.0 380.1,33.0 380.1,33.0 C380.1,33.0 380.1,33.0 380.1,33.0 C399.2,29.5 418.7,28.6 438.0,26.1 C443.6,25.4 449.2,24.5 454.7,23.4 C462.1,22.0 469.5,20.3 476.8,18.4 C483.0,16.8 489.7,14.5 494.0,9.4 C497.7,4.8 496.3,-2.1 493.7,-6.9 C477.1,-37.0 458.0,-66.0 440.3,-95.4 C422.7,-124.6 405.1,-153.8 387.4,-183.0 C378.6,-197.6 369.8,-212.2 361.0,-226.8 C357.1,-233.3 353.7,-241.4 348.8,-247.2 C347.1,-249.2 346.1,-249.2 343.8,-250.2 C339.2,-252.3 335.3,-254.4 330.3,-255.2 C320.4,-256.8 310.5,-259.7 300.4,-259.8 C292.4,-260.0 282.1,-258.0 274.3,-255.9 C270.9,-255.0 267.8,-252.8 264.5,-251.4 C259.3,-249.4 254.0,-247.8 248.9,-245.6 C242.3,-242.8 235.4,-240.4 228.9,-237.2 C221.0,-233.2 213.6,-228.2 206.0,-223.5 C196.9,-217.9 186.7,-214.8 177.6,-209.2 C166.6,-202.4 155.0,-196.8 143.9,-190.3 C129.6,-182.0 115.7,-173.2 101.6,-164.7 C92.4,-159.2 83.2,-153.6 74.0,-148.1 C62.1,-140.9 49.8,-134.8 37.9,-127.7 C34.3,-125.5 31.3,-123.6 28.2,-120.8 C25.3,-118.1 21.1,-114.4 19.2,-111.0 C17.9,-108.7 17.8,-105.3 16.9,-102.9 C16.0,-100.3 14.7,-98.2 13.6,-95.8 C10.5,-89.1 9.1,-81.7 8.1,-74.4 C7.3,-68.1 6.1,-61.1 6.8,-55.0 C7.2,-51.7 7.6,-48.5 7.8,-45.2 C7.8,-44.3 8.3,-42.7 8.5,-41.8 C8.7,-40.0 8.2,-39.1 8.2,-37.6", "hale": "M73.6,177.2 C73.6,177.2 41.0,123.0 41.0,123.0 C41.0,123.0 -3.3,149.7 -3.3,149.7 C-3.3,149.7 29.2,203.8 29.2,203.8 C29.2,203.8 32.9,151.1 73.6,177.2", "gronn": "M-117.5,847.7 C-107.2,848.4 -97.1,850.9 -86.8,851.5 C-66.5,852.7 -46.0,851.4 -25.7,849.5 C-25.7,849.5 -25.7,849.5 -25.7,849.5 C-3.9,847.3 17.8,844.0 39.4,840.3 C46.2,839.2 53.1,838.0 60.0,836.8 C79.0,833.5 96.9,828.9 115.1,822.9 C127.9,818.7 140.9,814.9 153.2,809.5 C153.2,809.5 153.2,809.5 153.2,809.5 C153.2,809.5 153.2,809.5 153.2,809.5 C181.6,797.0 209.8,786.6 240.2,780.4 C248.8,778.7 257.3,777.2 265.9,775.6 C291.2,771.0 317.9,774.7 343.3,776.3 C343.3,776.3 343.3,776.3 343.3,776.3 C377.8,778.4 411.6,786.3 445.8,790.7 C455.5,791.9 465.3,792.9 475.1,793.3 C484.7,793.8 494.3,793.7 503.8,792.9 C512.2,792.1 521.0,792.0 529.1,790.0 C544.0,786.5 558.7,777.6 571.6,769.6 C571.6,769.6 571.6,769.6 571.6,769.6 C586.7,760.1 601.0,749.3 614.9,738.1 C625.0,730.1 634.7,721.6 645.6,714.8 C653.4,710.0 661.7,706.2 670.6,704.3 C694.2,699.4 717.2,709.2 740.1,713.2 C752.9,715.5 765.9,717.3 778.8,719.3 C778.8,719.3 778.8,719.3 778.8,719.3 C796.6,722.0 814.4,725.0 832.4,726.5 C840.4,727.2 848.4,727.6 856.5,727.9 C856.5,727.9 856.5,727.9 856.5,727.9 C865.1,728.2 848.7,1327.5 830.5,1326.9 C542.4,1316.8 254.4,1306.8 -33.6,1296.7 C-54.0,1296.0 -74.4,1295.3 -94.8,1294.6 C-102.2,1294.3 -109.6,1294.0 -117.0,1293.8 C-118.5,1293.7 -121.1,1294.1 -122.6,1293.6 C-124.9,1292.8 -124.3,1292.2 -126.0,1290.5 C-127.6,1289.5 -129.2,1288.4 -130.7,1287.3", "navy": "M-13.8,869.2 C-4.9,869.5 3.8,871.4 12.6,871.6 C30.1,872.0 47.7,870.3 65.0,868.0 C65.0,868.0 65.0,868.0 65.0,868.0 C83.6,865.5 102.1,862.0 120.5,858.2 C126.3,857.0 132.2,855.8 138.1,854.6 C154.2,851.2 169.5,846.7 184.9,841.0 C195.8,837.1 206.8,833.4 217.2,828.4 C217.2,828.4 217.2,828.4 217.2,828.4 C217.2,828.4 217.2,828.4 217.2,828.4 C241.1,816.8 265.0,807.0 290.9,800.9 C298.1,799.1 305.5,797.5 312.8,795.9 C334.3,791.3 357.3,793.6 379.1,794.2 C379.1,794.2 379.1,794.2 379.1,794.2 C408.8,795.0 438.0,800.7 467.4,803.5 C475.8,804.3 484.2,804.8 492.6,804.9 C500.9,805.0 509.1,804.6 517.3,803.6 C524.4,802.8 531.9,802.3 538.9,800.4 C551.5,797.0 563.9,788.9 574.6,781.7 C574.6,781.7 574.6,781.7 574.6,781.7 C587.3,773.1 599.3,763.3 610.9,753.4 C619.2,746.2 627.3,738.6 636.5,732.4 C643.0,728.1 650.0,724.6 657.6,722.7 C677.6,717.8 697.7,725.6 717.4,728.3 C728.5,729.8 739.7,731.0 750.8,732.3 C750.8,732.3 750.8,732.3 750.8,732.3 C766.1,734.1 781.5,736.2 796.9,736.9 C803.8,737.2 810.7,737.4 817.6,737.4 C817.6,737.4 817.6,737.4 817.6,737.4 C825.0,737.4 828.9,1251.7 813.3,1251.7 C566.0,1251.7 318.8,1251.7 71.6,1251.7 C54.1,1251.7 36.5,1251.7 19.0,1251.7 C12.7,1251.7 6.4,1251.6 0.0,1251.7 C-1.2,1251.7 -3.5,1252.0 -4.8,1251.7 C-6.8,1251.1 -6.3,1250.5 -7.8,1249.1 C-9.2,1248.3 -10.6,1247.4 -12.0,1246.5"};

/* 8 · Forside. A4 er målt fra InDesign-fila (mal2_standard_forside.idml). Liggende er en tilpasning.
   Illustrasjoner med gjennomsiktig bakgrunn plasseres hele; vanlige foto fyller panelet. */
LAYOUTS.forside = (uid,f) => {
  const c = SLOR[S.slor], A = f==='a4', I = S.imgs[0];
  const W = A?794:1280, H = A?1123:720;
  const tf = A ? '' : 'matrix(1.6121,0,0,0.6,0,8)';
  const pn = A ? {x0:29.3,y0:28.9,x1:766.3,y1:982.3,r:56.7} : {x0:20,y0:20,x1:1260,y1:700,r:40};
  const panelD = rrect(pn.x0,pn.y0,pn.x1,pn.y1,pn.r);
  const rc = A ? [397.8,505.6,426.2] : [640,300,560];         // radial overgang i panelet
  const g0 = A ? [459.1,745.8,471,817.9] : [740,455.5,759.3,498.7];
  // Bildet: illustrasjon (gjennomsiktig) = hel og sentrert; foto = fyller panelet
  let bilde;
  if(I && I.src && I.alpha){
    const fr = A ? {x:68,y:119,w:674,h:1026} : {x:380,y:44,w:520,h:820};
    const sc = Math.min(fr.w/I.w, fr.h/I.h) * (I.z||1), w = I.w*sc, h = I.h*sc;
    const x = fr.x + (fr.w-w)*(I.fx/100), y = fr.y + (fr.h-h)*(I.fy/100);
    bilde = `<clipPath id="${uid}pc"><path d="${panelD}"/></clipPath><g clip-path="url(#${uid}pc)"${EDIT?` class="klikkbilde" data-img="0"`:''}>${EDIT?'<title>Klikk for å bytte bilde</title>':''}<image href="${I.src}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" preserveAspectRatio="none"/></g>`;
  } else {
    bilde = imageIn(uid, panelD, pn.x0, pn.y0, pn.x1-pn.x0, pn.y1-pn.y0, 0); // fotoet går helt ned bak bølgen, så ingen kant synes
  }
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      <radialGradient id="${uid}rg" gradientUnits="userSpaceOnUse" cx="${rc[0]}" cy="${rc[1]}" r="${rc[2]}"><stop offset="0" stop-color="#e8eaee" stop-opacity="0"/><stop offset="1" stop-color="#e8eaee" stop-opacity="1"/></radialGradient>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="${g0[0]}" y1="${g0[1]}" x2="${g0[2]}" y2="${g0[3]}"><stop offset="0" stop-color="${c.c}" stop-opacity=".75"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <path d="${panelD}" fill="url(#${uid}rg)"/>
    ${bilde}
    <g pointer-events="none">
      <g transform="${tf}"><path d="${FS8.gronn}" fill="url(#${uid}sl)"/><path d="${FS8.navy}" fill="${NAVY}"/></g>
      ${A ? '' : `<rect x="-20" y="560" width="${W+40}" height="${H}" fill="${NAVY}"/>`}
      <g transform="${A?'':'scale(.75)'}"><path d="${FS8.hvit}" fill="#fff"/><path d="${FS8.hale}" fill="#fff"/></g>
    </g>
  </svg>`;
  const ki = S.ki ? `<div class="ki" style="right:${A?44:36}px;top:${A?44:30}px">${KI_ICON}KI-generert bilde</div>` : '';
  const tekst = E('stikk','stikk') + E('tittel','tittel') + E('ingress','ingress');
  if(A) return svg + logo(90,49,89) + ki
    + box(96,864,603,150,20,'fs8', tekst)
    + `<div class="fot8" style="top:1038px"><span class="m">Tønsberg</span> <span class="l">kommune</span></div>`;
  return svg + logo(63,34,66) + ki
    + `<div class="box fs8" data-base="17" style="left:190px;top:518px;width:900px;height:140px;font-size:17px;justify-content:center">${tekst}</div>`
    + `<div class="fot8" style="top:676px;font-size:13px"><span class="m">Tønsberg</span> <span class="l">kommune</span></div>`;
};


/* 9 · Bymøbel. Målt fra InDesign-fila (mal4_bymøblene.idml, 2160 × 3840 pt). Siden bygges i 720 × 1280 px
   og lastes ned i 2160 × 3840 px. Tre bilder, valgfrie stikkord, sirkelmerke, tittel og QR-felt. */
const BYM9 = {"hvit": "M11.8,-25.6 C23.4,-6.5 16.0,16.7 11.8,36.8 C10.5,43.4 9.3,50.0 9.0,56.7 C9.0,56.7 9.0,56.7 9.0,56.7 C8.0,78.6 16.7,101.5 27.8,120.0 C30.9,125.3 34.5,130.3 38.4,135.1 C45.1,143.4 53.2,150.6 62.1,156.5 C67.1,159.8 72.3,162.8 77.6,165.5 C91.1,172.6 105.9,177.4 121.2,177.3 C121.2,177.3 121.2,177.3 121.2,177.3 C147.3,177.1 173.0,164.4 193.0,148.5 C198.8,143.9 204.1,138.9 209.1,133.5 C214.7,127.3 220.8,121.7 225.9,115.0 C230.9,108.6 235.4,101.8 240.9,95.8 C256.2,79.1 272.6,63.1 291.7,50.8 C291.7,50.8 291.7,50.8 291.7,50.8 C291.7,50.8 291.7,50.8 291.7,50.8 C306.1,41.5 322.9,36.6 339.7,33.5 C339.7,33.5 339.7,33.5 339.7,33.5 C339.7,33.5 339.7,33.5 339.7,33.5 C339.7,33.5 339.7,33.5 339.7,33.5 C339.7,33.5 339.7,33.5 339.7,33.5 C339.7,33.5 339.7,33.5 339.7,33.5 C356.6,30.4 373.8,29.7 390.8,27.5 C395.8,26.8 400.7,26.1 405.6,25.1 C412.1,23.8 418.6,22.3 425.0,20.6 C430.6,19.2 436.5,17.2 440.2,12.7 C443.6,8.6 442.3,2.6 440.0,-1.6 C425.4,-28.2 408.5,-53.8 392.8,-79.8 C377.3,-105.5 361.7,-131.3 346.2,-157.1 C338.4,-170.0 330.6,-182.9 322.9,-195.8 C319.4,-201.5 316.4,-208.7 312.1,-213.8 C310.6,-215.6 309.7,-215.6 307.7,-216.5 C303.6,-218.3 300.2,-220.1 295.7,-220.8 C287.0,-222.3 278.3,-224.8 269.4,-224.9 C262.3,-225.1 253.2,-223.3 246.3,-221.5 C243.2,-220.7 240.6,-218.7 237.6,-217.6 C233.1,-215.8 228.4,-214.3 223.9,-212.4 C218.1,-209.9 211.9,-207.8 206.2,-204.9 C199.3,-201.5 192.7,-197.0 186.1,-192.9 C177.9,-187.9 168.9,-185.2 160.9,-180.2 C151.2,-174.2 141.0,-169.3 131.2,-163.6 C118.6,-156.2 106.3,-148.5 93.8,-141.0 C85.7,-136.1 77.6,-131.2 69.5,-126.3 C59.0,-120.0 48.1,-114.6 37.6,-108.3 C34.4,-106.3 31.8,-104.7 29.1,-102.2 C26.5,-99.9 22.8,-96.6 21.1,-93.6 C19.9,-91.5 19.9,-88.6 19.1,-86.4 C18.3,-84.2 17.2,-82.2 16.2,-80.1 C13.4,-74.3 12.2,-67.7 11.3,-61.2 C10.6,-55.7 9.5,-49.5 10.1,-44.2 C10.5,-41.2 10.8,-38.4 11.0,-35.5 C11.1,-34.7 11.5,-33.3 11.6,-32.5 C11.9,-30.9 11.4,-30.1 11.4,-28.8", "hale": "M69.1,160.8 C69.1,160.8 40.4,113.0 40.4,113.0 C40.4,113.0 1.2,136.5 1.2,136.5 C1.2,136.5 29.9,184.3 29.9,184.3 C29.9,184.3 33.2,137.8 69.1,160.8", "gronn": "M-94.8,797.8 C-85.8,798.4 -76.8,800.6 -67.8,801.1 C-49.8,802.2 -31.7,801.0 -13.8,799.3 C-13.8,799.3 -13.8,799.3 -13.8,799.3 C5.5,797.4 24.6,794.5 43.6,791.2 C49.7,790.2 55.8,789.2 61.9,788.1 C78.6,785.2 94.4,781.1 110.5,775.9 C121.8,772.2 133.2,768.8 144.2,764.0 C144.2,764.0 144.2,764.0 144.2,764.0 C144.2,764.0 144.2,764.0 144.2,764.0 C169.2,753.0 194.1,743.8 220.9,738.4 C228.5,736.9 236.1,735.5 243.7,734.1 C265.9,730.0 289.5,733.3 311.9,734.7 C311.9,734.7 311.9,734.7 311.9,734.7 C342.4,736.6 372.2,743.5 402.4,747.4 C411.0,748.5 419.6,749.4 428.3,749.8 C436.7,750.1 445.2,750.1 453.6,749.4 C461.0,748.7 468.8,748.5 476.0,746.9 C489.1,743.8 502.1,735.9 513.4,728.8 C513.4,728.8 513.4,728.8 513.4,728.8 C526.8,720.5 539.5,710.9 551.7,701.0 C560.6,693.9 569.1,686.4 578.8,680.4 C585.6,676.2 593.0,672.9 600.9,671.2 C621.6,666.9 642.0,675.5 662.2,679.0 C673.5,681.0 685.0,682.6 696.4,684.4 C696.4,684.4 696.4,684.4 696.4,684.4 C712.1,686.8 727.8,689.5 743.7,690.8 C750.8,691.4 757.9,691.8 765.0,692.0 C765.0,692.0 765.0,692.0 765.0,692.0 C772.5,692.2 758.1,1221.3 742.0,1220.8 C487.7,1211.9 233.4,1203.0 -20.8,1194.1 C-38.8,1193.5 -56.8,1192.9 -74.8,1192.2 C-81.3,1192.0 -87.8,1191.8 -94.3,1191.5 C-95.7,1191.5 -98.0,1191.8 -99.3,1191.4 C-101.3,1190.7 -100.8,1190.1 -102.3,1188.7 C-103.8,1187.8 -105.2,1186.8 -106.5,1185.8", "bunn": "M-3.3,816.8 C4.5,817.0 12.2,818.7 20.1,818.9 C35.5,819.2 51.0,817.7 66.2,815.7 C66.2,815.7 66.2,815.7 66.2,815.7 C82.7,813.5 99.0,810.4 115.2,807.0 C120.4,806.0 125.6,804.9 130.8,803.8 C145.0,800.9 158.5,796.9 172.1,791.9 C181.7,788.4 191.4,785.1 200.6,780.7 C200.6,780.7 200.6,780.7 200.6,780.7 C200.6,780.7 200.6,780.7 200.6,780.7 C221.7,770.5 242.8,761.9 265.6,756.4 C272.1,754.9 278.6,753.5 285.0,752.1 C304.0,747.9 324.3,750.0 343.6,750.5 C343.6,750.5 343.6,750.5 343.6,750.5 C369.8,751.2 395.5,756.3 421.5,758.7 C428.9,759.4 436.3,759.9 443.8,760.0 C451.0,760.0 458.3,759.8 465.5,758.9 C471.8,758.1 478.4,757.7 484.6,756.0 C495.8,753.0 506.6,745.9 516.1,739.5 C516.1,739.5 516.1,739.5 516.1,739.5 C527.3,731.9 537.9,723.3 548.1,714.5 C555.5,708.1 562.6,701.4 570.8,696.0 C576.5,692.2 582.7,689.1 589.4,687.5 C607.1,683.1 624.8,689.9 642.2,692.4 C652.0,693.7 661.8,694.7 671.6,695.9 C671.6,695.9 671.6,695.9 671.6,695.9 C685.2,697.5 698.8,699.3 712.4,700.0 C718.5,700.2 724.6,700.4 730.7,700.4 C730.7,700.4 730.7,700.4 730.7,700.4 C737.2,700.4 740.6,1154.4 726.8,1154.4 C508.6,1154.4 290.3,1154.4 72.0,1154.4 C56.6,1154.4 41.1,1154.4 25.7,1154.4 C20.1,1154.4 14.5,1154.3 8.9,1154.4 C7.8,1154.4 5.8,1154.7 4.7,1154.4 C2.9,1153.8 3.4,1153.3 2.0,1152.1 C0.8,1151.4 -0.5,1150.6 -1.7,1149.8"};
LAYOUTS.bymobel = (uid) => {
  const c = SLOR[S.slor], M = !!S.mork, W = 720, H = 1280, R = 33.3;
  const fr = [[0,38.75,38.5,355.5,434.75],[1,365.25,38.5,682,803],[4,38.75,444.75,355.5,851.75]];
  const panelD = rrect(30,30,690,950,R);
  const bilder = fr.map(([n,x0,y0,x1,y1]) => { const d = rrect(x0,y0,x1,y1,R); return `<path d="${d}" fill="#f2f5f6"/>` + imageIn(uid, d, x0, y0, x1-x0, y1-y0, n); }).join('');
  const q = S.qr ? qrSvg() : '';
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      <linearGradient id="${uid}pn" x1="0" y1="30" x2="0" y2="950" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.c}" stop-opacity=".72"/><stop offset=".28" stop-color="${c.c}" stop-opacity="0"/><stop offset=".62" stop-color="${c.c}" stop-opacity="0"/><stop offset="1" stop-color="${c.c}" stop-opacity=".6"/></linearGradient>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="414.2" y1="707.8" x2="424.7" y2="771.5"><stop offset="0" stop-color="${c.c}"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/></linearGradient>
      <linearGradient id="${uid}gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="${uid}sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="3.5" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".45"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    ${M ? `<rect x="0" y="1082" width="${W}" height="${H-1082}" fill="${NAVY}"/>` : ''}
    <path d="${panelD}" fill="#fff"/><path d="${panelD}" fill="url(#${uid}pn)"/>
    ${bilder}
    <g pointer-events="none">
      <path d="${BYM9.hvit}" fill="#fff"/><path d="${BYM9.hale}" fill="#fff"/>
      <path d="${BYM9.gronn}" fill="url(#${uid}sl)"/><path d="${BYM9.bunn}" fill="${M?NAVY:'#fff'}"/>
      <path d="${rrect(45.5,1114,674.5,1243.75,33.3)}" fill="${M?c.c:NAVY}"/>
      ${q ? `<rect x="536.6" y="1133.75" width=".8" height="91" fill="${M?'#1d1d1b':'#fff'}"/>` : ''}
    </g>
    ${has('merke') ? `<g pointer-events="none"><circle cx="628.5" cy="165.9" r="75.9" fill="${NAVY}" filter="url(#${uid}sh)"/><circle cx="628.5" cy="165.9" r="75.9" fill="url(#${uid}gl)"/></g>` : ''}
  </svg>`;
  const qr = q ? `<div class="qr9" style="left:557.75px;top:1131.25px;width:95.25px;height:95.25px">${M ? q : q.replace('fill="#1d1d1b"','fill="#fff"')}</div>` : '';
  const merke = has('merke') ? `<div class="box merke9" data-base="26" style="left:566px;top:104px;width:125px;height:124px;font-size:26px">${E('merke','mt9')}${E('merkeTx','mtx9')}</div>` : '';
  const pill = (k,x,y) => E(k, 'pill9', 'div', `left:${x}px;top:${y}px`);
  const ki = S.ki ? `<div class="ki" style="left:50px;top:806px">${KI_ICON}KI-generert bilde</div>` : '';
  return svg + logo(82.5,47,78.5) + ki
    + pill('bs2',347,55.5) + pill('bs1',23.5,382) + pill('bs3',23.5,460.5) + merke
    + box(90.25,830.5,539.5,230,24.55,'bym9'+(M?' mork':''), E('stikk','stikk') + E('tittel','tittel') + E('ingress','ingress')).replace('font-size:24.55px"','font-size:24.55px;justify-content:center"')
    + `<div class="box" data-base="24" style="left:70px;top:1126.5px;width:${q?443:560}px;height:110px;font-size:24px;justify-content:center">${E('cta','ctat9'+(M?' mork':''),'div',null,'ctab')}</div>`
    + qr;
};


/* 10 · Tekstplakat. A4 er målt fra InDesign-fila (mal5_tekstplakat.idml): lys grå flate med radial overgang,
   samme bølger som mal 1, all tekst i én spalte, valgfritt ikon øverst til høyre. Liggende er en tilpasning. */
LAYOUTS.tekstplakat = (uid,f) => {
  const c = SLOR[S.slor], A = f==='a4', W = A?794:1280, H = A?1123:720;
  const pn = A ? {x0:28.7,y0:28.7,x1:765,y1:1094,r:54.5} : {x0:20,y0:20,x1:1260,y1:700,r:40};
  const panelD = rrect(pn.x0,pn.y0,pn.x1,pn.y1,pn.r);
  const tf = A ? 'translate(0,174.45)' : 'matrix(1.6121,0,0,0.44,0,267)';
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      <radialGradient id="${uid}rg" gradientUnits="userSpaceOnUse" cx="${W/2}" cy="${H/2}" r="${A?561.3:700}"><stop offset="0" stop-color="#fbfbfb"/><stop offset="1" stop-color="#e2e2e2"/></radialGradient>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="459.1" y1="745.8" x2="471" y2="817.9"><stop offset="0" stop-color="${c.c}" stop-opacity=".75"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/></linearGradient>
      <clipPath id="${uid}pc"><path d="${panelD}"/></clipPath>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <g clip-path="url(#${uid}pc)" pointer-events="none">
      <rect width="${W}" height="${H}" fill="url(#${uid}rg)"/>
      <g transform="${tf}"><path d="${FS8.gronn}" fill="url(#${uid}sl)"/><path d="${FS8.navy}" fill="${NAVY}"/></g>
    </g>
    <g pointer-events="none" transform="${A?'':'scale(.75)'}"><path d="${FS8.hvit}" fill="#fff"/><path d="${FS8.hale}" fill="#fff"/></g>
  </svg>`;
  const q = S.qr ? qrSvg() : '';
  const topp = E('stikk','stikk') + E('tittel','tittel') + E('ingress','ingress');
  const brod = E('ut1','h10') + E('tx1','p10','div',null,'rich') + E('ut2','h10') + E('tx2','p10','div',null,'rich')
    + E('pTittel','h10') + E('pIntro','p10') + E('punkter','liste') + E('praktisk','praktisk');
  const harBrod = ['ut1','tx1','ut2','tx2','pTittel','pIntro','punkter','praktisk'].some(hasE);
  if(A) return svg + logo(87.5,48.5,89) + ikonHer(608,90,98,NAVY,'#f3f3f3')
    + box(105,255,584,670,20,'tp10', topp + (harBrod ? '<div class="gap10"></div>' : '') + brod)
    + (q ? `<div class="qrbox7" style="left:628px;top:959px;width:103.3px;height:103.3px;padding:8px">${q}</div>` : '')
    + `<div class="box" data-base="18.22" style="left:${q?399:522}px;top:976px;width:210px;height:80.5px;justify-content:flex-end">${E('cta','qrt1','div',null,'bold')}</div>`;
  return svg + logo(63,34,66) + ikonHer(1150,40,80,NAVY,'#f3f3f3')
    + box(80,170,520,400,18,'tp10', topp)
    + box(660,(S.ikon && ikonSvg(S.ikon)) ? 130 : 60,520,(S.ikon && ikonSvg(S.ikon)) ? 440 : 510,16,'tp10', brod)
    + (q ? `<div class="qrbox7" style="left:1148px;top:602px;width:88px;height:88px;padding:7px">${q}</div>` : '')
    + `<div class="box" data-base="16" style="left:${q?930:1028}px;top:620px;width:200px;height:66px;justify-content:flex-end">${E('cta','qrt1','div',null,'bold')}</div>`;
};


/* 11 · Inndelt plakat. A4 er målt fra InDesign-fila (mal6_inndelt_plakat.idml): bilde øverst, tittel i blått bølgefelt,
   brødtekst i to spalter på hvit bunn med tynn ramme som tones ut oppover. Liggende er en tilpasning. */
const IP11_HVIT = 'M802.4,715.8 C792.1,717.1 782.3,720.3 772.0,721.5 C751.8,723.9 731.3,723.8 711.0,723.1 C711.0,723.1 711.0,723.1 711.0,723.1 C689.2,722.3 667.4,720.3 645.7,718.0 C638.7,717.3 631.8,716.5 624.9,715.7 C605.8,713.6 587.6,710.1 569.1,705.3 C556.1,701.9 543.0,698.8 530.3,694.2 C530.3,694.2 530.3,694.2 530.3,694.2 C530.3,694.2 530.3,694.2 530.3,694.2 C501.3,683.5 472.6,674.8 441.9,670.6 C433.3,669.4 424.6,668.3 416.0,667.3 C390.6,664.3 364.2,669.6 338.9,672.7 C338.9,672.7 338.9,672.7 338.9,672.7 C304.7,676.9 271.6,686.8 237.7,693.3 C228.1,695.1 218.4,696.7 208.7,697.7 C199.2,698.7 189.6,699.3 180.0,699.0 C171.7,698.8 162.9,699.2 154.7,697.7 C139.6,695.1 124.4,687.2 111.2,680.0 C111.2,680.0 111.2,680.0 111.2,680.0 C95.5,671.5 80.5,661.5 66.0,651.2 C55.6,643.8 45.4,635.9 34.0,629.9 C26.0,625.6 17.5,622.3 8.5,621.0 C-15.2,617.5 -37.6,628.7 -60.1,634.1 C-72.8,637.1 -85.6,639.7 -98.4,642.5 C-98.4,642.5 -98.4,642.5 -98.4,642.5 C-116.0,646.3 -133.5,650.4 -151.3,652.9 C-159.3,654.1 -167.2,655.0 -175.2,655.8 C-175.2,655.8 -175.2,655.8 -175.2,655.8 C-183.8,656.6 -131.0,1252.7 -112.8,1250.9 C173.5,1223.3 459.8,1195.8 746.2,1168.2 C766.5,1166.2 786.7,1164.3 807.0,1162.3 C814.3,1161.6 821.7,1160.9 829.0,1160.2 C830.5,1160.1 833.2,1160.3 834.6,1159.7 C836.8,1158.8 836.2,1158.2 837.8,1156.4 C839.3,1155.3 840.8,1154.1 842.3,1152.9';
LAYOUTS.inndelt = (uid,f) => {
  const c = SLOR[S.slor], A = f==='a4', W = A?794:1280, H = A?1123:720;
  const pn = A ? {x0:28.7,y0:28.7,x1:765,y1:1094,r:54.5} : {x0:20,y0:20,x1:1260,y1:700,r:40};
  const panelD = rrect(pn.x0,pn.y0,pn.x1,pn.y1,pn.r);
  const tf = A ? '' : 'matrix(1.6121,0,0,0.6875,0,-56)';   // liggende: A4-formene presses inn i lavere felt
  const ramme = A ? rrect(29.3,579.5,766.3,1097.3,60.5) : rrect(20.3,340,1259.7,699.7,40);
  const rg = A ? [1097,790] : [700,480];
  const fotoH = A ? 489.3 : 300;
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="459.1" y1="745.8" x2="471" y2="817.9"><stop offset="0" stop-color="${c.c}" stop-opacity=".75"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/></linearGradient>
      <linearGradient id="${uid}rm" gradientUnits="userSpaceOnUse" x1="0" y1="${rg[0]}" x2="0" y2="${rg[1]}"><stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${NAVY}" stop-opacity="0"/></linearGradient>
      <clipPath id="${uid}pc"><path d="${panelD}"/></clipPath>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    ${imageIn(uid, panelD, pn.x0, pn.y0, pn.x1-pn.x0, fotoH, 0)}
    <g clip-path="url(#${uid}pc)" pointer-events="none"><g transform="${tf}">
      <g transform="translate(0,-404.35)"><path d="${FS8.gronn}" fill="url(#${uid}sl)"/><path d="${FS8.navy}" fill="${NAVY}"/></g>
    </g></g>
    <g pointer-events="none"><g transform="${tf}"><path d="${IP11_HVIT}" fill="#fff"/></g>${A ? '' : `<rect x="0" y="560" width="${W}" height="${H}" fill="#fff"/>`}</g>
    <g pointer-events="none" transform="${A?'':'scale(.75)'}"><path d="${FS8.hvit}" fill="#fff"/><path d="${FS8.hale}" fill="#fff"/></g>
  </svg>`;
  const q = S.qr ? qrSvg() : '';
  const ki = S.ki ? `<div class="ki" style="right:${A?44:36}px;top:${A?44:30}px">${KI_ICON}KI-generert bilde</div>` : '';
  const topp = E('stikk','stikk') + E('tittel','tittel') + E('ingress','ingress');
  const brod = E('ut1','h11') + E('tx1','p11') + E('ut2','h11') + E('tx2','p11') + E('pTittel','h11') + E('pIntro','p11') + E('punkter','liste') + E('ut3','h11') + E('tx3','p11');
  if(A) return svg + logo(87.5,48.5,89) + ki
    + box(176,437,513,200,20,'ip11', topp)
    + box(105,757,584,252,16,'', `<div class="body7 b11">${brod}</div><div class="rule7 r11"></div>`)
    + (q ? `<div class="qr11" style="left:681px;top:1012px;width:85.5px;height:85.5px">${q}</div>` : '')
    + `<div class="box" data-base="18.22" style="left:${q?443:556}px;top:985px;width:210px;height:80px;justify-content:flex-end">${E('cta','qrt11','div',null,'bold')}</div>`;
  return svg + logo(63,34,66) + ki
    + box(420,240,800,150,17,'ip11', topp)
    + box(80,458,1020,210,15,'', `<div class="body7 b11 k3">${brod}</div>`)
    + (q ? `<div class="qr11" style="left:1150px;top:604px;width:80px;height:80px">${q}</div>` : '')
    + `<div class="box" data-base="15" style="left:${q?950:1050}px;top:600px;width:185px;height:84px;justify-content:flex-end">${E('cta','qrt11','div',null,'bold')}</div>`;
};


/* 5 · Tre bilder. A4 er målt fra InDesign-fila (mal7_plakat_3_bilder.idml): samme flate og bølger som tekstplakaten,
   tekst til venstre og tre bilder med skrå kanter og avrundede hjørner til høyre. Liggende er en tilpasning. */
const TB5 = [ // hjørnene i bilderammene (A4, px); nederste bilde ligger under bølgen
  [[430.9,37.4],[757.8,37.4],[757.8,334.7],[430.9,371.0]],
  [[430.9,380.2],[757.8,343.8],[757.8,677.8],[430.9,646.8]],
  [[430.9,656.6],[757.8,687.8],[757.8,990.2],[430.9,990.2]],
];
function rundPoly(p, r){ // mangekant med avrundede hjørner (samme kurvetype som rrect)
  const n = p.length, pt = (a,b,d) => { const dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx,dy); return [a[0]+dx/l*d, a[1]+dy/l*d]; };
  let d = '';
  for(let i = 0; i < n; i++){
    const a = p[(i-1+n)%n], b = p[i], c = p[(i+1)%n];
    const r1 = Math.min(r, Math.hypot(b[0]-a[0], b[1]-a[1])/2), r2 = Math.min(r, Math.hypot(c[0]-b[0], c[1]-b[1])/2);
    const s1 = pt(b,a,r1), s2 = pt(b,c,r2);
    d += (i ? ' L' : 'M') + s1[0].toFixed(1) + ',' + s1[1].toFixed(1) + ` Q${b[0]},${b[1]} ` + s2[0].toFixed(1) + ',' + s2[1].toFixed(1);
  }
  return d + ' Z';
}
LAYOUTS.trebilder = (uid,f) => {
  const c = SLOR[S.slor], A = f==='a4', W = A?794:1280, H = A?1123:720;
  const pn = A ? {x0:28.7,y0:28.7,x1:765,y1:1094,r:54.5} : {x0:20,y0:20,x1:1260,y1:700,r:40};
  const panelD = rrect(pn.x0,pn.y0,pn.x1,pn.y1,pn.r);
  const tf = A ? 'translate(0,174.45)' : 'matrix(1.6121,0,0,0.44,0,267)';
  const map = A ? (q => q) : (q => [700 + (q[0]-430.9)/326.9*540, 22 + (q[1]-37.4)*.66]);
  const bilder = TB5.map((pts,i) => {
    const P = pts.map(map), xs = P.map(q => q[0]), ys = P.map(q => q[1]);
    const d = rundPoly(P, A ? 52.9 : 40);
    return imageIn(uid, d, Math.min(...xs), Math.min(...ys), Math.max(...xs)-Math.min(...xs), Math.max(...ys)-Math.min(...ys), [0,1,4][i]);
  });
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      <radialGradient id="${uid}rg" gradientUnits="userSpaceOnUse" cx="${W/2}" cy="${H/2}" r="${A?561.3:700}"><stop offset="0" stop-color="#fbfbfb"/><stop offset="1" stop-color="#e2e2e2"/></radialGradient>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="459.1" y1="745.8" x2="471" y2="817.9"><stop offset="0" stop-color="${c.c}" stop-opacity=".75"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/></linearGradient>
      <clipPath id="${uid}pc"><path d="${panelD}"/></clipPath>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <g clip-path="url(#${uid}pc)"><rect width="${W}" height="${H}" fill="url(#${uid}rg)" pointer-events="none"/>
      ${bilder[2]}
      <g transform="${tf}" pointer-events="none"><path d="${FS8.gronn}" fill="url(#${uid}sl)"/><path d="${FS8.navy}" fill="${NAVY}"/></g>
      ${bilder[0]}${bilder[1]}
    </g>
    <g pointer-events="none" transform="${A?'':'scale(.75)'}"><path d="${FS8.hvit}" fill="#fff"/><path d="${FS8.hale}" fill="#fff"/></g>
  </svg>`;
  const q = S.qr ? qrSvg() : '';
  const topp = E('stikk','stikk') + E('tittel','tittel') + E('ingress','ingress');
  const brod = E('ut1','h10') + E('tx1','p10','div',null,'rich') + E('ut2','h10') + E('tx2','p10','div',null,'rich')
    + E('pTittel','h10') + E('pIntro','p10') + E('punkter','liste') + E('praktisk','praktisk');
  const harBrod = ['ut1','tx1','ut2','tx2','pTittel','pIntro','punkter','praktisk'].some(hasE);
  const ki = S.ki ? `<div class="ki" style="right:${A?50:36}px;top:${A?48:32}px">${KI_ICON}KI-generert bilde</div>` : '';
  if(A) return svg + logo(87.5,48.5,89) + ki
    + box(87,257,292,700,20,'tp10 tb5', topp + (harBrod ? '<div class="gap10"></div>' : '') + brod)
    + (q ? `<div class="qrbox7" style="left:628px;top:959px;width:103.3px;height:103.3px;padding:8px">${q}</div>` : '')
    + `<div class="box" data-base="18.22" style="left:${q?399:522}px;top:976px;width:210px;height:80.5px;justify-content:flex-end">${E('cta','qrt1','div',null,'bold')}</div>`;
  return svg + logo(63,34,66) + ki
    + box(80,150,560,440,17,'tp10 tb5', topp + (harBrod ? '<div class="gap10"></div>' : '') + brod)
    + (q ? `<div class="qrbox7" style="left:1148px;top:602px;width:88px;height:88px;padding:7px">${q}</div>` : '')
    + `<div class="box" data-base="16" style="left:${q?930:1028}px;top:620px;width:200px;height:66px;justify-content:flex-end">${E('cta','qrt1','div',null,'bold')}</div>`;
};


/* 10 · Høydebilde. A4 er målt fra InDesign-fila (mal8_plakat_med_hoydebilde.idml): høyt bilde til venstre under bølgen,
   tekst til høyre med samme stiler som mal 5, valgfritt ikon over teksten. Liggende er en tilpasning. */
LAYOUTS.hoydebilde = (uid,f) => {
  const c = SLOR[S.slor], A = f==='a4', W = A?794:1280, H = A?1123:720;
  const pn = A ? {x0:28.7,y0:28.7,x1:765,y1:1094,r:54.5} : {x0:20,y0:20,x1:1260,y1:700,r:40};
  const panelD = rrect(pn.x0,pn.y0,pn.x1,pn.y1,pn.r);
  const tf = A ? 'translate(0,174.45)' : 'matrix(1.6121,0,0,0.44,0,267)';
  const fb = A ? {x0:42,y0:42,x1:369,y1:1083,r:52.9} : {x0:30,y0:30,x1:560,y1:690,r:40};
  const fotoD = rrect(fb.x0,fb.y0,fb.x1,fb.y1,fb.r);
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      <radialGradient id="${uid}rg" gradientUnits="userSpaceOnUse" cx="${W/2}" cy="${H/2}" r="${A?561.3:700}"><stop offset="0" stop-color="#fbfbfb"/><stop offset="1" stop-color="#e2e2e2"/></radialGradient>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="459.1" y1="745.8" x2="471" y2="817.9"><stop offset="0" stop-color="${c.c}" stop-opacity=".75"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/></linearGradient>
      <clipPath id="${uid}pc"><path d="${panelD}"/></clipPath>
      <linearGradient id="${uid}fg" gradientUnits="userSpaceOnUse" x1="${A?240:355}" y1="${A?470:300}" x2="${A?173:300}" y2="${A?60:40}"><stop offset="0" stop-color="${c.c}" stop-opacity="0"/><stop offset=".45" stop-color="${c.c}" stop-opacity=".18"/><stop offset=".8" stop-color="${c.c}" stop-opacity=".42"/><stop offset="1" stop-color="${c.c}" stop-opacity=".55"/></linearGradient>
      <clipPath id="${uid}fc"><path d="${fotoD}"/></clipPath>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <g clip-path="url(#${uid}pc)"><rect width="${W}" height="${H}" fill="url(#${uid}rg)" pointer-events="none"/>
      <path d="${fotoD}" fill="${c.c}" pointer-events="none"/>
      ${imageIn(uid, fotoD, fb.x0, fb.y0, fb.x1-fb.x0, fb.y1-fb.y0, 0)}
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${uid}fg)" clip-path="url(#${uid}fc)" pointer-events="none"/>
      <g transform="${tf}" pointer-events="none"><path d="${FS8.gronn}" fill="url(#${uid}sl)"/><path d="${FS8.navy}" fill="${NAVY}"/></g>
    </g>
    <g pointer-events="none" transform="${A?'':'scale(.75)'}"><path d="${FS8.hvit}" fill="#fff"/><path d="${FS8.hale}" fill="#fff"/></g>
  </svg>`;
  const q = S.qr ? qrSvg() : '';
  const topp = E('stikk','stikk') + E('tittel','tittel') + E('ingress','ingress');
  const brod = E('ut1','h10') + E('tx1','p10','div',null,'rich') + E('ut2','h10') + E('tx2','p10','div',null,'rich')
    + E('pTittel','h10') + E('pIntro','p10') + E('punkter','liste') + E('praktisk','praktisk');
  const harBrod = ['ut1','tx1','ut2','tx2','pTittel','pIntro','punkter','praktisk'].some(hasE);
  const ki = S.ki ? `<div class="ki" style="left:${A?56:44}px;top:${A?210:150}px">${KI_ICON}KI-generert bilde</div>` : '';
  if(A) return svg + logo(87.5,48.5,89) + ki + ikonHer(635.5,82,96,NAVY,'#f3f3f3')
    + box(431,206,292,720,20,'tp10 tb5', topp + (harBrod ? '<div class="gap10"></div>' : '') + brod)
    + (q ? `<div class="qrbox7" style="left:628px;top:959px;width:103.3px;height:103.3px;padding:8px">${q}</div>` : '')
    + `<div class="box" data-base="18.22" style="left:${q?399:522}px;top:976px;width:210px;height:80.5px;justify-content:flex-end">${E('cta','qrt1','div',null,'bold')}</div>`;
  return svg + logo(63,34,66) + ki + ikonHer(1150,36,64,NAVY,'#f3f3f3')
    + box(610,100,560,480,16,'tp10 tb5', topp + (harBrod ? '<div class="gap10"></div>' : '') + brod)
    + (q ? `<div class="qrbox7" style="left:1148px;top:602px;width:88px;height:88px;padding:7px">${q}</div>` : '')
    + `<div class="box" data-base="16" style="left:${q?930:1028}px;top:620px;width:200px;height:66px;justify-content:flex-end">${E('cta','qrt1','div',null,'bold')}</div>`;
};


/* 11 · Infoskjerm (mal9_infoskjerm.idml) og 12 · Infoskjerm med stort bilde (mal10_infoskjerm_stort_bilde.idml).
   Bare 16:9. Siden er 1920 × 1080 pt i InDesign; her 1280 × 720 px (pt × 2/3) og lastes ned i 1920 × 1080.
   «Blåskjær»: et lag i mørkeblått med blandingsmodus Lys (Lighten) over bildene, laget som SVG-filter
   (blandingsmoduser i CSS overlever ikke nedlastingen). */
const SKJ = {"S9": {"bolge": "M-180.7,761.0 C-164.5,762.1 -148.8,766.1 -132.7,767.0 C-100.8,768.9 -68.7,766.9 -37.0,763.8 C-37.0,763.8 -37.0,763.8 -37.0,763.8 C-3.0,760.5 30.9,755.2 64.8,749.5 C75.5,747.7 86.2,745.9 97.0,744.0 C126.7,738.9 154.7,731.5 183.3,722.2 C203.3,715.8 223.6,709.8 242.8,701.2 C242.8,701.2 242.8,701.2 242.8,701.2 C242.8,701.2 242.8,701.2 242.8,701.2 C287.2,681.8 331.3,665.4 378.9,655.8 C392.3,653.1 405.8,650.7 419.1,648.2 C458.6,641.0 500.4,646.9 540.2,649.3 C540.2,649.3 540.2,649.3 540.2,649.3 C594.2,652.6 647.0,665.0 700.5,671.8 C715.8,673.8 731.0,675.2 746.4,676.0 C761.4,676.6 776.4,676.6 791.4,675.2 C804.4,674.1 818.1,673.9 830.9,670.8 C854.2,665.3 877.2,651.5 897.2,638.9 C897.2,638.9 897.2,638.9 897.2,638.9 C920.9,624.0 943.4,607.0 965.1,589.6 C980.8,577.0 996.0,563.7 1013.1,553.1 C1025.2,545.6 1038.3,539.6 1052.2,536.8 C1089.0,529.1 1125.1,544.5 1160.8,550.7 C1181.0,554.2 1201.3,557.0 1221.5,560.1 C1221.5,560.1 1221.5,560.1 1221.5,560.1 C1249.3,564.5 1277.2,569.1 1305.3,571.5 C1317.8,572.5 1330.4,573.2 1343.0,573.6 C1343.0,573.6 1343.0,573.6 1343.0,573.6 C1356.5,574.0 1330.8,1511.7 1302.3,1510.7 C851.7,1494.9 401.1,1479.2 -49.5,1463.5 C-81.3,1462.3 -113.2,1461.2 -145.2,1460.1 C-156.7,1459.7 -168.2,1459.2 -179.8,1458.9 C-182.2,1458.8 -186.3,1459.3 -188.6,1458.5 C-192.2,1457.4 -191.2,1456.3 -193.9,1453.8 C-196.4,1452.1 -198.9,1450.5 -201.3,1448.8", "navy": "M-18.4,794.7 C-4.5,795.2 9.1,798.1 22.9,798.5 C50.2,799.0 77.8,796.4 104.8,792.8 C104.8,792.8 104.8,792.8 104.8,792.8 C133.9,789.0 162.8,783.4 191.7,777.5 C200.8,775.6 210.0,773.7 219.2,771.8 C244.4,766.5 268.2,759.4 292.4,750.6 C309.4,744.4 326.6,738.6 342.9,730.8 C342.9,730.8 342.9,730.8 342.9,730.8 C342.9,730.8 342.9,730.8 342.9,730.8 C380.4,712.8 417.6,697.5 458.1,687.8 C469.6,685.0 481.0,682.6 492.4,680.1 C526.0,672.8 562.1,676.5 596.2,677.4 C596.2,677.4 596.2,677.4 596.2,677.4 C642.6,678.6 688.2,687.5 734.4,691.9 C747.5,693.0 760.6,693.9 773.8,694.0 C786.6,694.2 799.5,693.7 812.4,692.1 C823.5,690.8 835.2,690.1 846.1,687.1 C865.9,681.7 885.2,669.1 902.0,657.7 C902.0,657.7 902.0,657.7 902.0,657.7 C921.9,644.4 940.6,629.0 958.8,613.5 C971.8,602.2 984.5,590.4 998.9,580.8 C1009.0,574.0 1020.0,568.5 1031.8,565.5 C1063.2,557.9 1094.5,570.0 1125.4,574.2 C1142.8,576.6 1160.2,578.5 1177.7,580.5 C1177.7,580.5 1177.7,580.5 1177.7,580.5 C1201.7,583.4 1225.7,586.6 1249.8,587.8 C1260.6,588.2 1271.4,588.5 1282.2,588.5 C1282.2,588.5 1282.2,588.5 1282.2,588.5 C1293.8,588.5 1299.9,1393.0 1275.4,1393.0 C888.6,1393.0 501.9,1393.0 115.1,1393.0 C87.7,1393.0 60.4,1393.0 33.0,1393.0 C23.1,1393.0 13.2,1393.0 3.2,1393.0 C1.2,1393.0 -2.4,1393.5 -4.3,1393.0 C-7.5,1392.0 -6.7,1391.2 -9.1,1389.0 C-11.2,1387.7 -13.4,1386.3 -15.6,1384.9", "hvit": "M7.5,-29.1 C18.0,-11.7 11.3,9.6 7.5,27.9 C6.2,33.9 5.2,39.9 4.9,46.0 C4.9,46.0 4.9,46.0 4.9,46.0 C3.9,66.0 11.9,86.9 22.0,103.8 C24.9,108.5 28.1,113.2 31.6,117.5 C37.8,125.1 45.1,131.7 53.3,137.1 C57.9,140.1 62.6,142.8 67.5,145.2 C79.8,151.7 93.2,156.2 107.2,156.0 C107.2,156.0 107.2,156.0 107.2,156.0 C131.0,155.8 154.4,144.2 172.7,129.7 C177.9,125.5 182.8,121.0 187.3,116.1 C192.4,110.5 198.1,105.2 202.7,99.2 C207.2,93.3 211.4,87.2 216.4,81.7 C230.3,66.5 245.2,51.9 262.6,40.6 C262.6,40.6 262.6,40.6 262.6,40.6 C262.6,40.6 262.6,40.6 262.6,40.6 C275.9,32.1 291.1,27.6 306.4,24.9 C306.4,24.9 306.4,24.9 306.4,24.9 C306.4,24.9 306.4,24.9 306.4,24.9 C306.4,24.9 306.4,24.9 306.4,24.9 C306.4,24.9 306.4,24.9 306.4,24.9 C306.4,24.9 306.4,24.9 306.4,24.9 C321.9,22.1 337.6,21.4 353.1,19.4 C357.6,18.8 362.1,18.1 366.6,17.2 C372.4,16.0 378.4,14.7 384.3,13.2 C389.4,11.8 394.8,10.1 398.1,5.8 C401.2,2.2 400.1,-3.4 397.9,-7.2 C384.6,-31.4 369.2,-54.8 354.9,-78.5 C340.8,-102.0 326.6,-125.5 312.4,-148.9 C305.3,-160.7 298.2,-172.5 291.1,-184.2 C287.9,-189.4 285.2,-196.0 281.2,-200.7 C279.9,-202.3 279.1,-202.3 277.3,-203.1 C273.6,-204.8 270.4,-206.4 266.4,-207.1 C258.4,-208.4 250.4,-210.8 242.3,-210.8 C235.8,-210.9 227.6,-209.4 221.3,-207.7 C218.5,-206.9 216.1,-205.2 213.4,-204.1 C209.2,-202.4 205.0,-201.2 200.8,-199.4 C195.6,-197.2 189.9,-195.2 184.8,-192.6 C178.4,-189.4 172.4,-185.3 166.3,-181.7 C158.9,-177.1 150.8,-174.6 143.4,-170.1 C134.6,-164.6 125.3,-160.1 116.3,-154.8 C104.8,-148.2 93.6,-141.1 82.2,-134.2 C74.8,-129.8 67.5,-125.3 60.0,-120.9 C50.5,-115.1 40.5,-110.2 30.9,-104.5 C28.1,-102.7 25.6,-101.2 23.2,-98.9 C20.9,-96.8 17.4,-93.8 15.9,-91.0 C14.8,-89.2 14.8,-86.5 14.1,-84.5 C13.4,-82.5 12.3,-80.7 11.4,-78.8 C8.9,-73.4 7.8,-67.4 7.0,-61.5 C6.3,-56.5 5.3,-50.9 5.9,-46.0 C6.2,-43.2 6.5,-40.8 6.7,-38.0 C6.8,-37.4 7.2,-36.0 7.3,-35.4 C7.5,-33.9 7.0,-33.1 7.0,-31.9", "hale": "M59.7,141.0 C59.7,141.0 33.5,97.4 33.5,97.4 C33.5,97.4 -2.2,118.8 -2.2,118.8 C-2.2,118.8 24.0,162.4 24.0,162.4 C24.0,162.4 26.9,120.0 59.7,141.0", "pil": "M1070.0,629.9 C1055.0,586.5 1090.8,586.4 1090.8,586.4"}, "S10": {"gronn": "M123.3,725.3 C136.2,726.2 148.8,729.4 161.7,730.1 C187.2,731.6 212.9,730.0 238.3,727.5 C238.3,727.5 238.3,727.5 238.3,727.5 C265.6,724.9 292.8,720.6 319.9,716.1 C328.4,714.6 337.1,713.1 345.7,711.6 C369.4,707.5 391.9,701.7 414.8,694.2 C430.9,689.0 447.1,684.2 462.5,677.5 C462.5,677.5 462.5,677.5 462.5,677.5 C462.5,677.5 462.5,677.5 462.5,677.5 C498.1,661.9 533.4,648.8 571.5,641.0 C582.2,638.9 593.0,637.0 603.8,635.0 C635.4,629.2 668.9,633.9 700.7,635.9 C700.7,635.9 700.7,635.9 700.7,635.9 C744.0,638.5 786.2,648.4 829.1,653.9 C841.3,655.4 853.5,656.6 865.8,657.2 C877.8,657.8 889.9,657.7 901.9,656.6 C912.3,655.7 923.3,655.5 933.5,653.0 C952.2,648.6 970.6,637.5 986.7,627.5 C986.7,627.5 986.7,627.5 986.7,627.5 C1005.6,615.6 1023.6,602.0 1041.0,588.0 C1053.6,578.0 1065.8,567.2 1079.5,558.8 C1089.2,552.8 1099.7,548.0 1110.8,545.7 C1140.3,539.5 1169.2,551.9 1197.8,556.9 C1214.0,559.6 1230.2,561.9 1246.4,564.4 C1246.4,564.4 1246.4,564.4 1246.4,564.4 C1268.7,567.9 1291.0,571.6 1313.5,573.5 C1323.5,574.3 1333.7,574.9 1343.7,575.2 C1343.7,575.2 1343.7,575.2 1343.7,575.2 C1354.5,575.5 1334.0,1326.5 1311.2,1325.8 C950.2,1313.2 589.3,1300.5 228.3,1288.0 C202.8,1287.0 177.2,1286.2 151.7,1285.2 C142.4,1285.0 133.2,1284.6 124.0,1284.3 C122.1,1284.2 118.8,1284.7 116.9,1284.0 C114.0,1283.1 114.8,1282.2 112.7,1280.2 C110.7,1278.9 108.7,1277.5 106.7,1276.2", "navy": "M253.2,752.3 C264.4,752.7 275.2,755.0 286.4,755.3 C308.2,755.8 330.2,753.6 351.9,750.8 C351.9,750.8 351.9,750.8 351.9,750.8 C375.3,747.6 398.4,743.2 421.5,738.5 C428.9,737.0 436.2,735.5 443.6,734.0 C463.8,729.8 482.9,724.0 502.2,717.0 C515.9,712.0 529.6,707.4 542.6,701.1 C542.6,701.1 542.6,701.1 542.6,701.1 C542.6,701.1 542.6,701.1 542.6,701.1 C572.6,686.6 602.5,674.4 635.0,666.6 C644.1,664.5 653.3,662.5 662.5,660.5 C689.4,654.6 718.2,657.6 745.6,658.3 C745.6,658.3 745.6,658.3 745.6,658.3 C782.8,659.3 819.3,666.5 856.2,669.9 C866.7,670.9 877.2,671.5 887.8,671.6 C898.1,671.8 908.5,671.4 918.6,670.1 C927.6,669.0 937.0,668.5 945.8,666.1 C961.6,661.8 977.0,651.7 990.5,642.5 C990.5,642.5 990.5,642.5 990.5,642.5 C1006.4,631.9 1021.5,619.6 1036.0,607.1 C1046.4,598.1 1056.5,588.6 1068.0,580.9 C1076.2,575.5 1085.0,571.1 1094.5,568.8 C1119.6,562.6 1144.7,572.2 1169.4,575.7 C1183.3,577.6 1197.3,579.1 1211.3,580.8 C1211.3,580.8 1211.3,580.8 1211.3,580.8 C1230.5,583.0 1249.8,585.6 1269.1,586.5 C1277.8,586.9 1286.4,587.1 1295.0,587.1 C1295.0,587.1 1295.0,587.1 1295.0,587.1 C1304.3,587.0 1309.2,1231.5 1289.6,1231.5 C979.8,1231.5 670.0,1231.5 360.2,1231.5 C338.2,1231.5 316.3,1231.5 294.4,1231.5 C286.4,1231.5 278.5,1231.5 270.6,1231.5 C268.9,1231.5 266.1,1232.0 264.5,1231.5 C262.0,1230.8 262.6,1230.0 260.8,1228.3 C258.9,1227.2 257.2,1226.2 255.6,1225.0", "hvit": "M9.0,-22.6 C18.6,-6.7 12.5,12.7 9.0,29.4 C7.8,34.9 6.9,40.4 6.6,46.0 C6.6,46.0 6.6,46.0 6.6,46.0 C5.8,64.2 13.1,83.3 22.2,98.7 C24.9,103.0 27.8,107.2 31.1,111.2 C36.7,118.2 43.4,124.2 50.9,129.1 C55.0,131.8 59.4,134.3 63.8,136.6 C75.0,142.4 87.3,146.5 100.0,146.4 C100.0,146.4 100.0,146.4 100.0,146.4 C121.8,146.2 143.2,135.7 159.8,122.3 C164.6,118.6 169.1,114.5 173.2,110.0 C177.8,104.8 182.9,100.0 187.2,94.5 C191.3,89.2 195.2,83.5 199.8,78.5 C212.4,64.7 226.1,51.3 242.0,41.0 C242.0,41.0 242.0,41.0 242.0,41.0 C242.0,41.0 242.0,41.0 242.0,41.0 C254.1,33.3 267.9,29.2 281.9,26.6 C281.9,26.6 281.9,26.6 281.9,26.6 C281.9,26.6 281.9,26.6 281.9,26.6 C281.9,26.6 281.9,26.6 281.9,26.6 C281.9,26.6 281.9,26.6 281.9,26.6 C281.9,26.6 281.9,26.6 281.9,26.6 C296.1,24.1 310.4,23.4 324.6,21.6 C328.6,21.1 332.8,20.4 336.8,19.6 C342.2,18.6 347.6,17.3 353.0,15.9 C357.6,14.8 362.6,13.1 365.7,9.3 C368.4,6.0 367.4,0.9 365.4,-2.6 C353.3,-24.8 339.2,-46.0 326.2,-67.7 C313.2,-89.2 300.3,-110.6 287.4,-132.1 C280.9,-142.8 274.4,-153.5 267.9,-164.2 C265.1,-169.0 262.6,-175.0 258.9,-179.2 C257.8,-180.7 257.0,-180.7 255.3,-181.5 C251.9,-183.0 249.1,-184.5 245.3,-185.2 C238.1,-186.3 230.8,-188.4 223.4,-188.6 C217.5,-188.7 209.9,-187.2 204.2,-185.7 C201.7,-184.9 199.4,-183.3 197.0,-182.4 C193.2,-180.9 189.3,-179.7 185.6,-178.1 C180.7,-176.1 175.6,-174.2 170.8,-171.9 C165.1,-169.0 159.6,-165.2 154.1,-161.9 C147.3,-157.8 139.8,-155.4 133.1,-151.3 C125.0,-146.3 116.5,-142.2 108.3,-137.4 C97.9,-131.3 87.6,-124.8 77.2,-118.6 C70.5,-114.5 63.8,-110.5 57.0,-106.4 C48.2,-101.2 39.2,-96.7 30.4,-91.4 C27.8,-89.8 25.6,-88.4 23.4,-86.3 C21.2,-84.4 18.1,-81.7 16.7,-79.2 C15.8,-77.5 15.7,-75.0 15.1,-73.2 C14.4,-71.3 13.4,-69.7 12.6,-68.0 C10.3,-63.1 9.2,-57.6 8.6,-52.2 C8.0,-47.6 7.0,-42.5 7.5,-38.0 C7.8,-35.5 8.2,-33.2 8.3,-30.8 C8.3,-30.1 8.8,-28.9 8.8,-28.4 C9.0,-27.0 8.6,-26.3 8.7,-25.2", "hale": "M56.6,132.7 C56.6,132.7 32.8,92.8 32.8,92.8 C32.8,92.8 0.1,112.5 0.1,112.5 C0.1,112.5 24.1,152.2 24.1,152.2 C24.1,152.2 26.8,113.5 56.6,132.7", "pil": "M1198.8,648.8 C1236.5,622.6 1207.5,601.4 1207.5,601.4"}};
function blaskjaer(uid, id, styrke){ // Lighten med mørkeblått, styrke = andel (0–1)
  return `<filter id="${uid}${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feFlood flood-color="${NAVY}" result="n"/><feBlend in="SourceGraphic" in2="n" mode="lighten" result="l"/><feComposite in="SourceGraphic" in2="l" operator="arithmetic" k1="0" k2="${1-styrke}" k3="${styrke}" k4="0"/></filter>`;
}
function rrect4(x0,y0,x1,y1,r){ // r = [øvre venstre, øvre høyre, nedre høyre, nedre venstre]
  const [a,b,c,d] = r;
  return `M${x0},${y0+a} Q${x0},${y0} ${x0+a},${y0} L${x1-b},${y0} Q${x1},${y0} ${x1},${y0+b} L${x1},${y1-c} Q${x1},${y1} ${x1-c},${y1} L${x0+d},${y1} Q${x0},${y1} ${x0},${y1-d} Z`;
}
function skjermQr(q, x, y, s, pilD, tekstBoks, rot){
  if(!q) return '';
  return `<div class="qr12" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px">${q}</div>`
    + tekstBoks; // pila fra teksten til QR-koden er tatt bort: teksten varierer, så den kan ikke plasseres pålitelig
}
LAYOUTS.infoskjerm = (uid) => {
  const c = SLOR[S.slor], W = 1280, H = 720, R = 53.3;
  const venstre = rrect(24,23.5,377.5,696,R), hoyre = rrect(934.5,23.5,1256,696,R);
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      ${blaskjaer(uid,'bv',.5)}${blaskjaer(uid,'bh',.5)}
      <clipPath id="${uid}cv"><path d="${venstre}"/></clipPath><clipPath id="${uid}ch"><path d="${hoyre}"/></clipPath>
      <linearGradient id="${uid}fh" gradientUnits="userSpaceOnUse" x1="934.5" y1="0" x2="975" y2="0"><stop offset="0" stop-color="${NAVY}" stop-opacity=".8"/><stop offset="1" stop-color="${NAVY}" stop-opacity="0"/></linearGradient>
      <linearGradient id="${uid}hv" gradientUnits="userSpaceOnUse" x1="514" y1="0" x2="924" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="721.3" y1="601.5" x2="743.8" y2="713.3"><stop offset="0" stop-color="${c.c}" stop-opacity=".9"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <path d="${rrect(918.5,27,1250,745,R)}" fill="#0b2433" pointer-events="none"/>
    <path d="${rrect(34,23.5,394.5,696,R)}" fill="${c.c}" pointer-events="none"/>
    <path d="${rrect(937,26,1253.5,693.5,R-2)}" fill="${NAVY}" pointer-events="none"/>
    <g clip-path="url(#${uid}ch)"><g filter="url(#${uid}bh)">${imageIn(uid, hoyre, 934.5, 23.5, 321.5, 672.5, 1)}</g></g>
    <g clip-path="url(#${uid}cv)"><g filter="url(#${uid}bv)">${imageIn(uid, venstre, 24, 23.5, 353.5, 672.5, 0)}</g></g>
    <g pointer-events="none">
      <path d="${SKJ.S9.bolge}" fill="url(#${uid}hv)"/>
      <path d="${SKJ.S9.bolge}" fill="url(#${uid}sl)"/>
      <path d="${SKJ.S9.navy}" fill="#002233"/>
      <path d="${SKJ.S9.hvit}" fill="#fff"/><path d="${SKJ.S9.hale}" fill="#fff"/>
    </g>
  </svg>`;
  const q = S.qr ? qrSvg() : '';
  const ki = S.ki ? `<div class="ki" style="left:40px;top:640px">${KI_ICON}KI-generert bilde</div>` : '';
  const tekst = E('stikk','stikk') + E('tittel','tittel')
    + `<div class="regel" style="margin:1.13em 0 1.07em"></div>` + E('ut1','h11b') + E('tx1','p11b')
    + (hasE('praktisk') ? `<div class="regel" style="margin:1.22em 0 .87em"></div>` + E('praktisk','praktisk') : '');
  return svg + logo(73,40,71.5) + ki
    + box(434.5,98,449,580,20.18,'is11', tekst)
    + skjermQr(q, 1099, 503.5, 125.5, SKJ.S9.pil,
        `<div class="box" data-base="30.6" style="left:1040px;top:643px;width:200px;height:62px;font-size:30.6px">${E('cta','skript','div','line-height:.81')}</div>`);
};

/* 13 · Invitasjon – stort bilde (mal15_infoskjerm stort bilde 2.idml).
   Ny egen skjermmal målt fra IDML: helflatebilde, midtstilt tittel og QR nederst til høyre. */
LAYOUTS.infoskjerm3 = (uid) => {
  const W = 1280, H = 720;
  const ramme = rrect4(24,24,1256,696,[53.3,68,53.3,68]);
  const photo = rrect4(24,24,1256,696,[53.3,68,53.3,68]);
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      ${blaskjaer(uid,'inv3',.4)}
      <clipPath id="${uid}cr"><path d="${ramme}"/></clipPath>
      <linearGradient id="${uid}bottom" gradientUnits="userSpaceOnUse" x1="0" y1="430" x2="0" y2="720">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".56"/>
      </linearGradient>
      <linearGradient id="${uid}top" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="235">
        <stop offset="0" stop-color="#000" stop-opacity=".3"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <path d="${ramme}" fill="#7f8f99"/>
    <g clip-path="url(#${uid}cr)">
      <g filter="url(#${uid}inv3) ${''}">${imageIn(uid, photo, 24,24,1232,672,0)}</g>
      <rect width="${W}" height="${H}" fill="url(#${uid}top)" pointer-events="none"/>
      <rect width="${W}" height="${H}" fill="url(#${uid}bottom)" pointer-events="none"/>
    </g>
  </svg>`;
  const q = S.qr ? qrSvg() : '';
  const ki = S.ki ? `<div class="ki" style="left:38px;top:650px">${KI_ICON}KI-generert bilde</div>` : '';
  return svg + logo(69,40.5,65) + ki
    + box(205,88,870,150,25.33,'inv13-head', E('stikk','stikk') + E('tittel','tittel'))
    + box(60,488,465,190,24,'inv13-copy', E('ut1','h13') + E('tx1','p13') + E('avslutt','a13'))
    + (q ? `<div class="qr13">${q}</div>` : '')
    + box(1028,560,190,62,24,'inv13-cta', E('cta','qrt13','div',null,'bold'));
};

LAYOUTS.infoskjerm2 = (uid) => {
  const c = SLOR[S.slor], W = 1280, H = 720;
  const ramme = rrect4(24,24,1256,696,[53.3,68,53.3,68]);
  const svg = `<svg class="bg" viewBox="0 0 ${W} ${H}"><defs>
      ${blaskjaer(uid,'bs',.4)}
      <clipPath id="${uid}cr"><path d="${ramme}"/></clipPath>
      <linearGradient id="${uid}mv" gradientUnits="userSpaceOnUse" x1="24" y1="0" x2="498" y2="0"><stop offset="0" stop-color="${NAVY}" stop-opacity=".5"/><stop offset="1" stop-color="${NAVY}" stop-opacity="0"/></linearGradient>
      <linearGradient id="${uid}mh" gradientUnits="userSpaceOnUse" x1="1256" y1="0" x2="782" y2="0"><stop offset="0" stop-color="${NAVY}" stop-opacity=".5"/><stop offset="1" stop-color="${NAVY}" stop-opacity="0"/></linearGradient>
      <radialGradient id="${uid}vg" gradientUnits="userSpaceOnUse" cx="640" cy="360" r="760"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity=".05"/><stop offset=".82" stop-color="#000" stop-opacity=".14"/><stop offset=".92" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>
      <radialGradient id="${uid}tk" gradientUnits="userSpaceOnUse" cx="200" cy="560" r="470"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".35" stop-color="#000" stop-opacity=".27"/><stop offset=".65" stop-color="#000" stop-opacity=".1"/><stop offset=".85" stop-color="#000" stop-opacity=".025"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="${uid}sl" gradientUnits="userSpaceOnUse" x1="845.7" y1="597.5" x2="863.8" y2="687.4"><stop offset="0" stop-color="${c.c}" stop-opacity=".75"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <path d="${ramme}" fill="#7f8f99" pointer-events="none"/>
    <g clip-path="url(#${uid}cr)"><g filter="url(#${uid}bs)">${imageIn(uid, ramme, 24, 24, 1232, 672, 0)}</g>
      <g pointer-events="none">
        <rect width="${W}" height="${H}" fill="url(#${uid}mv)"/><rect width="${W}" height="${H}" fill="url(#${uid}mh)"/>
        <rect width="${W}" height="${H}" fill="url(#${uid}vg)"/><rect width="${W}" height="${H}" fill="url(#${uid}tk)"/>
      </g>
    </g>
    <g pointer-events="none">
      <path d="${SKJ.S10.gronn}" fill="url(#${uid}sl)"/>
      <path d="${SKJ.S10.navy}" fill="${NAVY}"/>
      <path d="${SKJ.S10.hvit}" fill="#fff"/><path d="${SKJ.S10.hale}" fill="#fff"/>
    </g>
  </svg>`;
  const q = S.qr ? qrSvg() : '';
  const ki = S.ki ? `<div class="ki" style="right:40px;top:36px">${KI_ICON}KI-generert bilde</div>` : '';
  return svg + logo(69,40.5,65) + ki
    + box(197.5,92,885,170,23.33,'is12', E('stikk','stikk') + E('tittel','tittel'))
    + box(87.5,250,300,371,26.67,'is12b', E('ut1','h12') + E('tx1','p12') + E('avslutt','a12')).replace('font-size:26.67px"','font-size:26.67px;justify-content:flex-end"') // vokser oppover ved mye tekst
    + skjermQr(q, 1077.5, 468, 125.5, SKJ.S10.pil,
        `<div class="box" data-base="36.2" style="left:1022px;top:613px;width:222px;height:72px;font-size:36.2px;transform:rotate(-2deg)">${E('cta','skript','div','line-height:.81')}</div>`);
};


