/* Oppsett: RESSURS_ROT og LS_PREFIKS, logo og eksempelbilder, malene (TPLS), formater, eksempeltekst og tilstanden S */
'use strict';
// STAGING: ved opprykk til prod settes begge til ''
const RESSURS_ROT = '../';     // bildebank og ikoner ligger i rota, felles for prod og staging
const LS_PREFIKS = 'staging-'; // egne localStorage-nøkler, så staging ikke forstyrrer prod
const LOGO = 'grafikk/logo.png';
// Eksempelbilder (KI-genererte, fra malforslagene) – vises til brukeren laster opp egne
const EKS = [
  {src:'grafikk/eksempel-1.jpg', w:995, h:515, fx:50, fy:45, ki:true, txt:'Nå vises et KI-generert eksempelbilde. Last opp ditt eget.'},
  {src:'grafikk/eksempel-2.jpg', w:570, h:238, fx:50, fy:50, ki:true, txt:'Nå vises et KI-generert eksempelbilde. Last opp ditt eget.'},
  {src:'grafikk/eksempel-3.jpg', w:760, h:1054, fx:50, fy:0,  txt:'Eksempel: ICDP-modellen fra Bufdir. Last opp din egen illustrasjon.'},
  {src:'grafikk/eksempel-4.png', w:420, h:621, fx:50, fy:50, txt:'Eksempelillustrasjon fra ICDP-plakaten. Bruk PNG med gjennomsiktig bakgrunn.'},
  {src:'grafikk/eksempel-1.jpg', w:995, h:515, fx:0, fy:50, ki:true, txt:'Nå vises et KI-generert eksempelbilde. Last opp ditt eget.'},
];
const LOGO_RATIO = 1.0781; // høyde / bredde
const ikonSvg = id => { const i = IKONER.find(x => x.id === id); return i ? i.svg : ''; };
const NAVY = '#013952';

const SLOR = {
  gronn:  {navn:'Grønn',   c:'#c5daaf', mork:'#6f9a4a', tint:'#eef4e7'},
  korall: {navn:'Korall',  c:'#e69d7d', mork:'#c96a43', tint:'#fbebe4'},
  gul:    {navn:'Gul',     c:'#f1be48', mork:'#d79b12', tint:'#fdf3db'},
  bla:    {navn:'Lyseblå', c:'#91cef2', mork:'#3d9bd0', tint:'#e6f4fc'},
};

const TPLS = {
  bildedrevet:{navn:'Bildeplakat', sub:'Stort bilde, tittel og QR', bilder:1,
    felt:['stikk','tittel','ingress','cta','url'], mork:'Hvit tekst (for mørke bilder)'},
  forklaring:{navn:'Bilde og forklaring', sub:'Bilde, budskap, to kolonner', bilder:1,
    felt:['stikk','tittel','ingress','ut1','tx1','punkter','ut2','tx2','cta','url']},
  delt:{navn:'Delt', sub:'Bilde ved siden av tekst', bilder:1,
    felt:['stikk','tittel','ingress','ut1','tx1','pTittel','punkter','cta','url']},
  tekst:{navn:'Tekstdrevet', sub:'Mye tekst, lite pynt', bilder:0,
    felt:['stikk','tittel','ingress','ut1','tx1','ut2','tx2','pTittel','punkter','praktisk','cta','url']},
  bilder:{navn:'Flere bilder', sub:'To bilder og tekst', bilder:2,
    felt:['stikk','tittel','ingress','ut1','tx1','ut2','tx2','punkter','cta','url']},
  bildetekst:{navn:'Bilde og QR', sub:'Forside og bakside', bilder:1,
    felt:['stikk','tittel','ingress','tx1','praktisk','cta','url','qrTekst']},
  invitasjon:{navn:'Invitasjon', sub:'Fagdag og arrangement', bilder:1,
    felt:['stikk','tittel','ingress','praktisk','ut1','tx1','tx2','avslutt','cta','url','merke']},
  forside:{navn:'Forside', sub:'Tema, tittel og illustrasjon', bilder:1,
    felt:['stikk','tittel','ingress']},
  bymobel:{navn:'Bymøbel', sub:'Bymøbelskjerm, 9:16', bilder:3, fmts:['bym'],
    felt:['stikk','tittel','ingress','cta','url','merke','merkeTx','bs1','bs2','bs3'], mork:'Mørk bunn'},
  tekstplakat:{navn:'Tekstplakat', sub:'Tekst, punkter og QR', bilder:0,
    felt:['stikk','tittel','ingress','innhold','cta','url']},
  trebilder:{navn:'Tre bilder', sub:'Tekst og tre bilder', bilder:3,
    felt:['stikk','tittel','ingress','innhold','cta','url']},
  tekstplakatliggende:{navn:'Tekstplakat, liggende', sub:'A4 liggende, tekst i to spalter', bilder:0, fmts:['a4l'],
    felt:['stikk','tittel','ingress','innhold','cta','url']},
  trebilderliggende:{navn:'Tre bilder, liggende', sub:'A4 liggende, tekst og tre bilder', bilder:3, fmts:['a4l'],
    felt:['stikk','tittel','ingress','innhold','cta','url']},
  tekstplakatskjerm:{navn:'Tekstplakat, skjerm', sub:'Infoskjerm 16:9, tekst i to spalter', bilder:0, fmts:['wide'],
    felt:['stikk','tittel','ingress','innhold','cta','url']},
  trebilderskjerm:{navn:'Tre bilder, skjerm', sub:'Infoskjerm 16:9, tekst og tre bilder', bilder:3, fmts:['wide'],
    felt:['stikk','tittel','ingress','innhold','cta','url']},
  hoydebilde:{navn:'Høydebilde', sub:'Høyt bilde og tekst ved siden av', bilder:1,
    felt:['stikk','tittel','ingress','innhold','cta','url']},
  infoskjerm:{navn:'Infoskjerm', sub:'To bilder, tittel og praktisk info', bilder:2, fmts:['wide'],
    felt:['stikk','tittel','ut1','tx1','praktisk','cta','url']},
  infoskjerm2:{navn:'Infoskjerm, stort bilde', sub:'Ett stort bilde og lite tekst', bilder:1, fmts:['wide'],
    felt:['stikk','tittel','ut1','tx1','avslutt','cta','url']},
  // Svømmehallen (ENHETER): forslag, ikke godkjent av designer
  forbudsskilt:{navn:'Forbudsskilt', sub:'Tre forbudsskilt og tekst på to språk', bilder:0,
    felt:['tittel','ut1','tx1','ut2','tx2','cta','url'],
    demo:{tittel:'Ikke tillatt i svømmehallen', ut1:'Mobil, kamera og mat', tx1:'Det er ikke lov å bruke mobil eller kamera, eller å spise, i garderober og ved bassengene.', ut2:'Phones, cameras and food', tx2:'Using phones or cameras, and eating, is not allowed in the changing rooms or by the pools.'}},
  forbudsskiltliggende:{navn:'Forbudsskilt, liggende', sub:'A4 liggende, tre forbudsskilt og to språk', bilder:0, fmts:['a4l'],
    felt:['tittel','ut1','tx1','ut2','tx2','cta','url'],
    demo:{tittel:'Ikke tillatt i svømmehallen', ut1:'Mobil, kamera og mat', tx1:'Det er ikke lov å bruke mobil eller kamera, eller å spise, i garderober og ved bassengene.', ut2:'Phones, cameras and food', tx2:'Using phones or cameras, and eating, is not allowed in the changing rooms or by the pools.'}},
  qrplakat:{navn:'Stor QR-kode', sub:'Lite tekst og en stor QR-kode', bilder:0,
    felt:['stikk','tittel','ingress','cta','url'],
    demo:{stikk:'Svømmehallen', tittel:'Se **åpningstider**', ingress:'Skann koden med mobilkameraet.', cta:'Skann meg!'}},
  prisliste:{navn:'Prisliste', sub:'Priser med prikker fram til beløpet', bilder:0,
    felt:['stikk','tittel','ingress','innhold','cta','url'],
    demo:{stikk:'Svømmehallen', tittel:'Priser', ingress:'Gjelder fra 1. januar.', innhold:'Enkeltbillett\nVoksen: 95 kr\nBarn (4–15 år): 50 kr\nHonnør: 60 kr\n\nKlippekort (10 bad)\nVoksen: 800 kr\nBarn: 400 kr\n\nBarn under 4 år bader gratis.'}},
  inndelt:{navn:'Inndelt plakat', sub:'Bilde, tittel og to spalter', bilder:1,
    felt:['stikk','tittel','ingress','ut1','tx1','ut2','tx2','pTittel','pIntro','punkter','ut3','tx3','cta','url']},
};
Object.values(TPLS).forEach(t => { t.fmts = t.fmts || ['a4']; }); // én mal = ett format (liggende plakatversjoner er skjult; liggende og skjerm er egne maler)
// Maler som er erstattet av designerens nye versjoner. De vises ikke lenger, men gamle PDF-er åpnes i erstatteren.
const ERSTATTET = {forklaring:'inndelt', tekst:'tekstplakat', bilder:'trebilder', delt:'hoydebilde', bildetekst:'hoydebilde'};
// Malene gruppert etter hva plakaten skal gjøre (innhold først)
const GRUPPER = [
  {navn:'Vise fram noe med et stort bilde', tekst:'Kort budskap der bildet gjør mye av jobben.', maler:['bildedrevet','forside']},
  {navn:'Forklare og informere', tekst:'Når leseren trenger litt mer tekst, punkter eller fakta.', maler:['inndelt','hoydebilde','trebilder','tekstplakat','trebilderliggende','tekstplakatliggende']},
  {navn:'Invitere til noe', tekst:'Kurs, møter og arrangementer.', maler:['invitasjon']},
  {navn:'Skjermer', tekst:'Infoskjermer (16:9) og skjermene på bymøblene (9:16).', maler:['infoskjerm','infoskjerm2','tekstplakatskjerm','trebilderskjerm','bymobel']},
];
/* Egne seksjoner for en enhet: vises bare når siden åpnes med ?enhet=… (for eksempel staging/svommehallen/).
   Malene her ligger ikke i GRUPPER og er derfor ikke en del av testlista før de er godkjent. */
const ENHETER = {
  svommehallen:{navn:'Svømmehallen', tekst:'Maler laget for svømmehallen. Forslag, ikke godkjent av designer.', maler:['forbudsskilt','forbudsskiltliggende','qrplakat','prisliste','tekstplakat']},
};
const ENHET = (() => { try { const e = new URLSearchParams(location.search).get('enhet') || ''; return ENHETER[e] ? e : ''; } catch(_){ return ''; } })();
const visGrupper = () => ENHET ? [ENHETER[ENHET], ...GRUPPER] : GRUPPER;
const fmtFor = k => TPLS[k].fmts.includes(S.fmt) ? S.fmt : TPLS[k].fmts[0];
const bildeSlots = k => TPLS[k].bilder === 3 ? [0,1,4] : [0,1].slice(0, TPLS[k].bilder);
const FMT = {a4:{W:794,H:1123,ratio:3,navn:'-a4'}, a4l:{W:1123,H:794,ratio:3,navn:'-a4-liggende'}, wide:{W:1280,H:720,ratio:1.5,navn:'-skjerm'}, bym:{W:720,H:1280,ratio:3,navn:'-bymobel'}};

// Eksempeltekst: forteller hva feltet skal formidle. Brukes som starttekst, og nedlastingen varsler hvis den står igjen.
const DEMO = {
  stikk:'Tema',
  tittel:'En skikkelig **fengende** tittel',
  ingress:'En ingress som vekker interesse og sier det viktigste på én–to linjer.',
  ut1:'Hva handler det om?',
  tx1:'Forklar kort hva saken gjelder. Skriv som du snakker, og ta bare med det leseren trenger å vite.',
  pTittel:'Dette får du',
  punkter:'Korte punkter blir lest først\nHøyst fem punkter\nBegynn gjerne med et verb',
  ut2:'Hvem gjelder det?',
  tx2:'Fortell hvem dette er for, og hva de bør gjøre. Ett budskap per avsnitt holder lenge.',
  praktisk:'Tid: Dag, dato og klokkeslett\nSted: Hvor det skjer\nPåmelding: Hvordan man melder seg på',
  cta:'Skann koden og les mer',
  url:'tonsberg.kommune.no',
  merke:'Kort og\nviktig!', merkeTx:'Litt mer tekst',
  avslutt:'En hyggelig avslutning, for eksempel «Velkommen!»',
  ut3:'Noe mer?', tx3:'Plass til litt ekstra informasjon som ikke er like viktig.',
};
const S = {
  tpl:'bildedrevet', fmt:'a4', slor:'gronn',
  ...DEMO,
  qr:true, visUrl:true, qrTekst:'SKANN MEG!',
  imgs:[], ki:false, zoom:'fit', skjulTomme:false, ikon:null, mork:false,
  bs1:'', bs2:'', bs3:'', pIntro:'',
  side2:true, side:1,
  tema:null, // valgfritt tema (se js/tema.js)
  innhold:null, // brødtekst som fritekst (se INNHOLD_MALER)
  s2Tittel:'Et foreldrekurs for migrasjonsfamilier',
  s2Ut1:'Hva er ICDP-kurs?',
  s2Tx1:'ICDP (International Child Development Programme) er et foreldreveiledningskurs som styrker samspillet mellom foreldre og barn. Kurset tar utgangspunkt i hverdagslige situasjoner og gir konkrete verktøy for å forstå barnets behov, regulere følelser og bygge en trygg og positiv relasjon.',
  s2Ut2:'Praktisk informasjon og påmelding',
  s2Tx2:'Tønsberg kommune tilbyr nå ICDP-kurs på **enkel norsk**, **engelsk**, **tigrinja** og **arabisk**. Alle foreldre kan melde interesse, også dersom ønsket språk ikke er tilgjengelig ennå.',
  s2Tx3:'Foreldre trenger ingen henvisning, og deltakelse er gratis.',
  s2Slutt:'Skann QR-koden for mer informasjon og påmelding.',
  s2Merknad:'Alle kursene holdes av sertifiserte ICDP-instruktører',
  s2Kontakt:'Om du er fagperson og har spørsmål om kurset kan du ta kontakt med Kari Misfjord på tlf. 00 00 00 00',
};

const $ = id => document.getElementById(id);
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
/* ═════════ BRØDTEKST SOM FRITEKST ═════════
   I malene med brødtekst (INNHOLD_MALER) skriver brukeren brødteksten i ett felt, S.innhold, med lett formatering:
     en kort linje øverst i et avsnitt blir mellomtittel (eller en linje som starter med #),
     «- » gir punkt, «Etikett: verdi» gir fet etikett, «---» gir skillelinje, tom linje gir nytt avsnitt.
   De faste feltene (INNHOLD_FELT) holdes oppdatert fra teksten. Da virker arbeidsfila i prod, og teksten følger med til
   maler som bruker de faste feltene. Endres feltene et annet sted (annen mal, arbeidsfil fra prod), lages teksten på nytt. */
const INNHOLD_MALER = ['prisliste','tekstplakat','tekstplakatliggende','tekstplakatskjerm','trebilder','trebilderliggende','trebilderskjerm','hoydebilde'];
const INNHOLD_FELT = ['ut1','tx1','ut2','tx2','pTittel','pIntro','punkter','praktisk'];
const INNHOLD_TIPS = 'Tom linje gir nytt avsnitt · kort linje øverst i avsnittet blir mellomtittel · «- » gir punkt · «Etikett: verdi» gir fet etikett · «---» gir linje';
const erEtikett = l => /^[^:*#\-•\s][^:]{0,22}:\s+\S/.test(l) && !/^https?:/i.test(l);
function lesInnhold(tekst){ // → [{t:'h'|'p'|'liste'|'etikett'|'linje', v}]
  const ut = [], punkt = /^[-*•]\s+/, linje = /^(-{3,}|\*{3,}|_{3,})$/;
  for(const a of String(tekst || '').replace(/\r/g, '').split(/\n[ \t]*\n/)){
    const L = a.split('\n').map(x => x.trim()).filter(Boolean);
    let i = 0;
    while(i < L.length){
      const l = L[i];
      if(linje.test(l)){ ut.push({t:'linje', v:''}); i++; continue; }
      if(/^#{1,6}\s+/.test(l)){ ut.push({t:'h', v:l.replace(/^#+\s+/, '').replace(/\*\*/g, '')}); i++; continue; }
      if(punkt.test(l)){ const p = []; while(i < L.length && punkt.test(L[i])) p.push(L[i++].replace(punkt, '')); ut.push({t:'liste', v:p.join('\n')}); continue; }
      if(erEtikett(l)){ const p = []; while(i < L.length && erEtikett(L[i])) p.push(L[i++]); ut.push({t:'etikett', v:p.join('\n')}); continue; }
      if(i === 0 && L.length > 1 && l.length <= 60 && !/[.,;]$/.test(l)){ ut.push({t:'h', v:l.replace(/\*\*/g, '')}); i++; continue; }
      const p = []; while(i < L.length && !linje.test(L[i]) && !/^#{1,6}\s/.test(L[i]) && !punkt.test(L[i]) && !erEtikett(L[i])) p.push(L[i++]);
      ut.push({t:'p', v:p.join('\n')});
    }
  }
  return ut;
}
function fraGamle(o){ // de faste feltene → fritekst
  o = o || S; const v = k => String(o[k] || '').trim();
  const grupper = [[v('ut1'), v('tx1')], [v('ut2'), v('tx2')],
    [v('pTittel'), v('pIntro'), v('punkter').split('\n').map(x => x.trim()).filter(Boolean).map(x => '- ' + x).join('\n')], [v('praktisk')]];
  return grupper.map(g => g.filter(Boolean).join('\n')).filter(Boolean).join('\n\n');
}
function tilGamle(){ // fritekst → de faste feltene (best mulig)
  const b = lesInnhold(S.innhold), av = t => b.filter(x => x.t === t && x.v.trim()).map(x => x.v);
  const h = av('h'), p = av('p');
  S.ut1 = h[0] || ''; S.ut2 = h[1] || ''; S.pTittel = h.slice(2).join(' / ');
  S.tx1 = p[0] || ''; S.tx2 = p.slice(1).join('\n\n'); S.pIntro = '';
  S.punkter = av('liste').join('\n'); S.praktisk = av('etikett').join('\n');
}
const gamleNokkel = () => JSON.stringify(INNHOLD_FELT.map(k => S[k] || ''));
let INNHOLD_SIST = null, GAMLE_SIST = null;
function synkInnhold(){ // kalles før hver tegning og lagring
  if(S.innhold == null) S.innhold = fraGamle();
  else if(S.innhold !== INNHOLD_SIST) tilGamle();                 // teksten er endret (brukeren, KI, arbeidsfil)
  else if(gamleNokkel() !== GAMLE_SIST) S.innhold = fraGamle();   // feltene er endret (annen mal, arbeidsfil fra prod)
  INNHOLD_SIST = S.innhold; GAMLE_SIST = gamleNokkel();
}
const has = k => S[k] && String(S[k]).trim() !== '';


DEMO.innhold = fraGamle(DEMO); // eksempelteksten viser formatet
