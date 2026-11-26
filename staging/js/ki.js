/* Forbedre teksten med KI */
'use strict';
/* ═════════ FORBEDRE TEKSTEN MED KI ═════════
   Ingen server: generatoren lager en instruks (prompt) brukeren limer inn i et godkjent KI-verktøy,
   og leser svaret (JSON) tilbake. Brukeren ser forslagene og velger hva som skal brukes. */
const KI_FELT = { // hva feltet skal gjøre, og omtrent hvor langt det kan være (tegn)
  stikk:   ['Tema / stikktittel', 'Tema i 1–3 ord. Skrives over tittelen.', 25],
  tittel:  ['Tittel', 'Fengende hovedtittel på 3–8 ord. Kan utheve 1–2 nøkkelord med **ord**. Bruk linjeskift (\\n) bare hvis det gjør tittelen lettere å lese.', 50],
  ingress: ['Ingress', '1–2 korte setninger som vekker interesse og sier det viktigste.', 120],
  ut1:     ['Underoverskrift 1', 'Kort underoverskrift, gjerne et spørsmål leseren har.', 40],
  tx1:     ['Brødtekst 1', '2–3 korte setninger.', 200],
  ut2:     ['Underoverskrift 2', 'Kort underoverskrift.', 40],
  tx2:     ['Brødtekst 2', '2–3 korte setninger.', 200],
  ut3:     ['Underoverskrift 3', 'Kort underoverskrift.', 40],
  tx3:     ['Brødtekst 3', '1–3 korte setninger med tilleggsinformasjon.', 160],
  innhold: ['Brødtekst', 'All brødtekst i ett felt. Format: avsnitt skilles med tom linje (\\n\\n). En kort linje øverst i et avsnitt blir mellomtittel. Punkter starter med «- ». Praktisk informasjon skrives «Etikett: verdi», én per linje. Ikke bruk annen markdown enn **ord** for utheving.', 600],
  pTittel: ['Overskrift over punktene', 'Kort overskrift.', 40],
  pIntro:  ['Innledning til punktlista', 'Én kort setning.', 80],
  punkter: ['Punktliste', '3–5 punkter, ett per linje (skilles med \\n). Hvert punkt kort, gjerne med verb først.', 160],
  praktisk:['Praktisk informasjon', 'Én opplysning per linje (\\n) på formen «Tid: …», «Sted: …», «Påmelding: …». En linje som starter med «- » blir et lite tilleggspunkt under linja over.', 260],
  cta:     ['Tekst ved QR-koden', 'Sier kort hva man får ved å skanne koden, f.eks. «Meld deg på her». Kan utheve med **ord**.', 50],
  merke:   ['Tekst i merket', '2–4 ord, kan ha linjeskift (\\n).', 25],
  merkeTx: ['Kort tekst under merket', 'Noen få ord.', 30],
  avslutt: ['Avsluttende setning', 'Én kort, vennlig setning.', 60],
  bs1: ['Stikkord på bilde 1', 'Valgfritt stikkord om bildet, maks 4 ord.', 30],
  bs2: ['Stikkord på bilde 2', 'Valgfritt stikkord om bildet, maks 4 ord.', 30],
  bs3: ['Stikkord på bilde 3', 'Valgfritt stikkord om bildet, maks 4 ord.', 30],
};
// Mal-spesifikke lengder der feltet har mindre plass enn vanlig
const KI_LENGDE = {
  bymobel: {cta:60, tittel:40, ingress:60},
  infoskjerm2: {tittel:60, ut1:40, tx1:90, avslutt:40},
  infoskjerm: {tx1:90, praktisk:300},
  bildedrevet: {ingress:60, cta:45},
  forside: {ingress:70},
  hoydebilde: {tx1:150, tx2:150, innhold:450},
  trebilder: {tx1:150, tx2:150, innhold:450},
};
const kiFelt = () => TPLS[S.tpl].felt.filter(k => KI_FELT[k] && !(/^bs\d$/.test(k) && !has(k)));
function kiInstruks(){
  const felt = kiFelt(), L = KI_LENGDE[S.tpl] || {};
  const inn = {}; felt.forEach(k => inn[k] = String(S[k] || ''));
  const beskr = felt.map(k => `- "${k}" (${KI_FELT[k][0]}): ${KI_FELT[k][1]} Maks ca. ${L[k] || KI_FELT[k][2]} tegn.`).join('\n');
  const forLang = $('warn').classList.contains('on') ? '\nNB: Teksten får ikke plass på plakaten nå. Kort den ned.\n' : '';
  return `Du er kommunikasjonsrådgiver i en norsk kommune og skriver klarspråk på bokmål.
Forbedre teksten til en plakat (malen «${TPLS[S.tpl].navn}»). Plakaten skal kunne leses raskt, gjerne på avstand.

Regler:
- Skriv klart og enkelt: du-form, aktive setninger, det viktigste først, korte og vanlige ord.
- Hold deg innenfor lengden for hvert felt. Kortere er bedre.
- Ikke finn på nye fakta. Datoer, klokkeslett, steder, priser, navn, telefonnumre og nettadresser skal stå nøyaktig som i originalen.
- Mangler en opplysning som feltet trenger, skriv [MANGLER] der den skal stå.
- Felt som er tomme, skal forbli tomme.
- Behold **ord**-markeringer bare der de er nyttige.
${forLang}
Feltene i malen:
${beskr}

Teksten nå:
\`\`\`json
${JSON.stringify(inn, null, 2)}
\`\`\`

Svar KUN med én JSON-kodeblokk med nøyaktig de samme nøklene, pluss nøkkelen "_endringer": en liste med 2–3 korte setninger på enkelt språk om hva du har forbedret og hvorfor (for en leser som ikke er tekstekspert). Bruk \\n for linjeskift inne i en verdi. Ingen forklaring før eller etter kodeblokken.`;
}
// Leser svaret fra KI-en: tåler kodeblokk, tekst rundt og «nøkkel: verdi»-linjer
function kiLes(tekst){
  tekst = String(tekst || '').replace(/[“”«»]/g, m => '"«»'.includes(m) && m !== '"' ? m : '"');
  const blokk = tekst.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let kandidat = blokk ? blokk[1] : tekst;
  const a = kandidat.indexOf('{'), b = kandidat.lastIndexOf('}');
  if(a >= 0 && b > a){
    try{ const o = JSON.parse(kandidat.slice(a, b + 1)); if(o && typeof o === 'object') return o; }catch(e){}
  }
  const o = {}, felt = kiFelt();
  kandidat.split('\n').forEach(l => { const m = l.match(/^\s*"?([A-Za-z0-9]+)"?\s*:\s*"?(.*?)"?,?\s*$/); if(m && felt.includes(m[1])) o[m[1]] = m[2].replace(/\\n/g, '\n'); });
  return Object.keys(o).length ? o : null;
}
// Ord-for-ord-forskjell: bare det som faktisk er endret, markeres
function kiDiff(gml, ny){
  const tok = t => String(t).replace(/\r/g, '').split(/(\n)/).flatMap(d => d === '\n' ? ['\n'] : d.split(/[ \t]+/).filter(Boolean));
  const A = tok(gml), B = tok(ny), n = A.length, m = B.length;
  const L = Array.from({length:n+1}, () => new Int16Array(m+1));
  for(let i = n-1; i >= 0; i--) for(let j = m-1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i+1][j+1] + 1 : Math.max(L[i+1][j], L[i][j+1]);
  const ops = []; let i = 0, j = 0;
  while(i < n || j < m){
    if(i < n && j < m && A[i] === B[j]){ ops.push(['=', A[i]]); i++; j++; }
    else if(i < n && (j >= m || L[i+1][j] >= L[i][j+1])){ ops.push(['-', A[i]]); i++; } // det som fjernes, vises før det nye
    else { ops.push(['+', B[j]]); j++; }
  }
  // Skrevet mye om? Da er gammel og ny tekst hver for seg lettere å lese enn ord-for-ord
  const like = ops.filter(o => o[0] === '=' && o[1] !== '\n').length;
  if(like < 0.5 * Math.max(A.filter(t => t !== '\n').length, B.filter(t => t !== '\n').length)){
    const vis = t => t.split('\n').map(l => { const st = {b:false}; return l.split('**').map((d, x) => { if(x) st.b = !st.b; return d ? (st.b ? `<b>${esc(d)}</b>` : esc(d)) : ''; }).join(''); }).join('<br>');
    return `<div class="gml">${vis(gml) || '(tomt)'}</div><div class="ny" style="margin-top:3px">${vis(ny) || '(tomt)'}</div>`;
  }
  const gS = {b:false}, nS = {b:false};
  const fet = (v, st) => v.split('**').map((d, x) => { if(x) st.b = !st.b; return d ? (st.b ? `<b>${esc(d)}</b>` : esc(d)) : ''; }).join('');
  let h = '', forrige = '\n', apen = '';
  const lukk = () => { if(apen){ h += '</span>'; apen = ''; } };
  ops.forEach(([t, v]) => {
    if(v === '\n'){
      lukk();
      h += t === '=' ? '<br>' : t === '+' ? '<span class="ins" title="Nytt linjeskift">↵</span><br>' : '<span class="del" title="Linjeskift fjernet">↵</span> ';
    } else {
      const ord = t === '-' ? fet(v, gS) : t === '+' ? fet(v, nS) : (fet(v, gS), fet(v, nS));
      const mellom = forrige === '\n' ? '' : ' ';
      if(t === '='){ lukk(); h += mellom + ord; }
      else { const kl = t === '+' ? 'ins' : 'del'; if(apen === kl) h += mellom + ord; else { lukk(); h += mellom + `<span class="${kl}">` + ord; apen = kl; } }
    }
    forrige = v;
  });
  lukk();
  return h;
}
let kiForslag = null, kiForrige = null, kiToastTimer = null;
function initKI(){
  const m = $('kimodal');
  const lukk = () => m.classList.remove('on');
  $('kiknapp').onclick = () => {
    $('kiprompt').value = kiInstruks(); $('kiprompt').style.display = 'none'; $('kikopiert').textContent = '';
    $('kisvar').value = ''; $('kisvar').style.display = ''; $('kilest').style.display = 'none'; $('kifeil').textContent = ''; $('kiforslag').innerHTML = ''; $('kibruk').style.display = 'none'; kiForslag = null;
    m.classList.add('on'); $('kikopier').focus();
  };
  $('kilukk').onclick = lukk;
  m.addEventListener('click', e => { if(e.target === m) lukk(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && m.classList.contains('on')) lukk(); });
  $('kikopier').onclick = async () => {
    const t = kiInstruks(); $('kiprompt').value = t;
    try{ await navigator.clipboard.writeText(t); $('kikopiert').textContent = 'Kopiert! Lim den inn i KI-verktøyet.'; }
    catch(e){ // f.eks. når fila er åpnet fra disk: vis teksten så den kan kopieres for hånd
      const ta = $('kiprompt'); ta.style.display = ''; ta.focus(); ta.select();
      let ok = false; try{ ok = document.execCommand('copy'); }catch(_){}
      $('kikopiert').textContent = ok ? 'Kopiert! Lim den inn i KI-verktøyet.' : 'Marker teksten under og kopier den (Ctrl+C).';
    }
  };
  const visForslag = () => {
    $('kifeil').textContent = ''; $('kiforslag').innerHTML = ''; $('kibruk').style.display = 'none';
    if(!$('kisvar').value.trim()) return;
    const o = kiLes($('kisvar').value);
    if(!o){ $('kifeil').textContent = 'Fant ingen forslag i teksten. Lim inn hele svaret fra KI-verktøyet.'; return; }
    const felt = kiFelt().filter(k => k in o);
    if(!felt.length){ $('kifeil').textContent = 'Svaret passer ikke til malen som er valgt nå. Har du byttet mal? Kopier bestillingen på nytt.'; return; }
    kiForslag = {}; felt.forEach(k => kiForslag[k] = String(o[k] ?? '').replace(/\r/g, '').trim());
    const endret = felt.filter(k => String(S[k] || '').trim() !== kiForslag[k]);
    let opps = o._endringer; if(typeof opps === 'string') opps = opps.split(/\n+/);
    opps = Array.isArray(opps) ? opps.map(t => String(t).replace(/^[-•*\s]+/, '').trim()).filter(Boolean) : [];
    $('kiforslag').innerHTML =
      (opps.length ? `<div class="kiopps"><b>Dette har KI-en gjort</b><ul>${opps.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : '') +
      (endret.length ? '<div class="kiliste">' + endret.map(k => `<label class="kirad"><input type="checkbox" data-k="${k}" checked><span class="navn">${esc(KI_FELT[k][0])}</span><span class="diff">${kiDiff(S[k] || '', kiForslag[k])}</span></label>`).join('')
        + (felt.length > endret.length ? `<div class="kiuendret">${felt.length - endret.length} felt er ikke endret.</div>` : '') + '</div>'
        : '<p class="kinote">KI-en foreslo ingen endringer.</p>');
    $('kisvar').style.display = 'none'; $('kilest').style.display = '';
    if(endret.length) $('kibruk').style.display = '';
  };
  $('kisvar').addEventListener('input', () => { clearTimeout($('kisvar')._t); $('kisvar')._t = setTimeout(visForslag, 250); });
  $('kinytt').onclick = () => { $('kisvar').value = ''; $('kisvar').style.display = ''; $('kilest').style.display = 'none'; $('kiforslag').innerHTML = ''; $('kibruk').style.display = 'none'; $('kisvar').focus(); };
  $('kibruk').onclick = () => {
    if(!kiForslag) return;
    kiForrige = {};
    $('kiforslag').querySelectorAll('input[data-k]:checked').forEach(c => { const k = c.dataset.k; kiForrige[k] = S[k]; S[k] = kiForslag[k]; });
    lukk(); fillForm(); render();
    if(Object.keys(kiForrige).length){ $('kitoast').classList.add('on'); clearTimeout(kiToastTimer); kiToastTimer = setTimeout(() => $('kitoast').classList.remove('on'), 15000); }
  };
  $('kiangre').onclick = () => {
    if(kiForrige) Object.entries(kiForrige).forEach(([k,v]) => S[k] = v);
    kiForrige = null; $('kitoast').classList.remove('on'); fillForm(); render();
  };
}

