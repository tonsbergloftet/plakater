/* Start: kjører når siden er lastet. Må lastes sist. */
'use strict';
/* ═════════ START ═════════ */
S.imgs = EKS.map((e,n) => n===2 || n===3 ? {...e, ex:true} : {src:null, fx:50, fy:45, z:1});
initUI(); fillForm(); lastBank(); lastIkoner();
// Last alle fontvariantene med en gang, og tegn på nytt når de er klare. Bare å vente på fontene som
// er i bruk ved oppstart gjorde at en mal med en ny vekt kunne få teksten tilpasset med feil mål.
Promise.all([...document.fonts].map(f => f.load().catch(() => {}))).then(render);
render();

