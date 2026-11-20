/* =========================================================
   V15.04 · TAILLE DE L'ÉCRAN (20 nov. 2026, demandé par Maurice)
   Selon le téléphone ou la tablette, Léon paraît trop petit ou trop gros.
   Un petit bouton « Aa », discret : PC → en bas du menu de gauche, à côté du prénom ;
   téléphone → dans « Plus », en bas ; tablette → sur l'écran Direction (directeur seulement).
   Le choix est gardé sur l'appareil (la tablette en gros, le téléphone en normal).
   + Démo : Camille (code 2222) ne pointe plus toute seule, pour montrer une arrivée en vrai.
   ========================================================= */
const TAILLES=[0.85,1,1.15,1.3],TAILLE_CLE='leon:taille';
function tailleLue(){try{const v=+localStorage.getItem(TAILLE_CLE);return TAILLES.includes(v)?v:1;}catch(_){return 1;}}
function tailleAppliquer(z){
  const h=document.documentElement;
  if(z===1){h.style.removeProperty('zoom');h.removeAttribute('data-taille');h.style.removeProperty('--leon-z');}
  else{h.style.zoom=z;h.setAttribute('data-taille',z);h.style.setProperty('--leon-z',z);}
}
function tailleRegler(z){try{if(z===1)localStorage.removeItem(TAILLE_CLE);else localStorage.setItem(TAILLE_CLE,String(z));}catch(_){}tailleAppliquer(z);}
tailleAppliquer(tailleLue());

/* traductions */
[['Taille de l’écran','Screen size','திரை அளவு','حجم الشاشة','Tamanho do ecrã','Tamaño de pantalla'],
 ['Gardée sur cet appareil.','Saved on this device.','இந்த சாதனத்தில் சேமிக்கப்படும்.','تُحفظ على هذا الجهاز.','Fica guardado neste aparelho.','Se guarda en este dispositivo.'],
 ['Plus petit','Smaller','சிறியது','أصغر','Mais pequeno','Más pequeño'],
 ['Plus grand','Bigger','பெரியது','أكبر','Maior','Más grande'],
 ['Taille normale','Normal size','சாதாரண அளவு','الحجم العادي','Tamanho normal','Tamaño normal'],
 ['Taille','Size','அளவு','الحجم','Tamanho','Tamaño'],
].forEach(r=>LANGS.forEach(([k],i)=>{if(i&&I18N[k])I18N[k][r[0]]=r[i];}));

function tailleCtrlHTML(){
  const z=tailleLue(),i=TAILLES.indexOf(z);
  return `<div class="tl-ctrl" role="group" aria-label="${T('Taille de l’écran')}">
    <button class="btn tl-b" data-act="taille-pas" data-d="-1" ${i<=0?'disabled':''} aria-label="${T('Plus petit')}"><span class="tl-a s">A</span>−</button>
    <button class="btn tl-v" data-act="taille-pas" data-d="0" title="${T('Taille normale')}">${Math.round(z*100)} %</button>
    <button class="btn tl-b" data-act="taille-pas" data-d="1" ${i>=TAILLES.length-1?'disabled':''} aria-label="${T('Plus grand')}"><span class="tl-a l">A</span>+</button>
  </div>`;
}
function tailleModal(){
  openModal(`<div class="mh"><div><h3>${T('Taille de l’écran')}</h3><p>${T('Gardée sur cet appareil.')}</p></div><button class="icon-btn" data-act="modal-close" aria-label="${T('Fermer')}">${ic('x')}</button></div>
    <div class="tl-modal">${tailleCtrlHTML()}</div>`,'tl-sheet');
}
ACT['taille-open']=function(){tailleModal();};
ACT['taille-pas']=function(t){
  const d=+t.dataset.d,i=TAILLES.indexOf(tailleLue());
  const z=d===0?1:TAILLES[Math.max(0,Math.min(TAILLES.length-1,i+d))];
  tailleRegler(z);
  const box=t.closest('.tl-ctrl');if(box)box.outerHTML=tailleCtrlHTML();
};

/* le bouton « Aa » : PC (pied du menu), téléphone (« Plus »), tablette (Direction) */
const TAILLE_BTN=()=>`<button class="icon-btn tl-aa" data-act="taille-open" title="${T('Taille de l’écran')}" aria-label="${T('Taille de l’écran')}"><span aria-hidden="true">Aa</span></button>`;
{const f=render;render=function(){const o=f.apply(this,arguments);try{
  const pied=document.querySelector('.side-foot');
  if(pied&&!pied.querySelector('.tl-aa')){const l=pied.querySelector('[data-act="lock"]');if(l)l.insertAdjacentHTML('beforebegin',TAILLE_BTN());else pied.insertAdjacentHTML('beforeend',TAILLE_BTN());}
  if(U.screen==='kiosk'&&UI.kiosk&&UI.kiosk.view==='direction'){
    const b=document.querySelector('.kiosk-body');
    if(b&&!b.querySelector('.tl-dir'))b.insertAdjacentHTML('beforeend',`<div class="tl-dir"><span>${ic('eye','s')} ${T('Taille de l’écran')}</span>${tailleCtrlHTML()}</div>`);
  }
}catch(e){}return o;};}
{const f=menuSheet;menuSheet=function(){const o=f.apply(this,arguments);try{
  const mf=document.querySelector('#modal-root .mf');
  if(mf&&!mf.querySelector('.tl-aa'))mf.insertAdjacentHTML('afterbegin',`<button class="btn tl-aa" data-act="taille-open"><span aria-hidden="true" class="tl-aa-t">Aa</span> ${T('Taille')}</button>`);
}catch(e){}return o;};}

/* ---------- Démo : Camille n'arrive pas toute seule ----------
   Maurice montre la badgeuse avec Camille (code 2222) : il faut qu'elle n'ait pas encore pointé aujourd'hui. */
if(typeof demoNPC==='function'){const f=demoNPC;demoNPC=function(){const o=f.apply(this,arguments);try{
  const ev=S&&S.pointages&&S.pointages.camille&&S.pointages.camille[TODAY_ISO];
  // On garde les services déjà finis ; seule l'arrivée en cours (automatique) est retirée.
  if(ev&&ev.length){let i=-1;ev.forEach((z,k)=>{if(z.t==='in')i=k;});
    if(i>=0&&ev[i].auto&&!ev.slice(i).some(z=>z.t==='out'))ev.splice(i);}
}catch(e){}return o;};}
/* Le Petit Beffroi : la démo s'ouvre à 10 h 52. Camille prend son poste à 11 h aujourd'hui,
   pour qu'elle arrive « pile à l'heure » quand Maurice la fait badger (au lieu de 52 min de retard). */
if(typeof seedDemo==='function'){const f=seedDemo;seedDemo=function(){const o=f.apply(this,arguments);try{
  const R=NET.restos.beffroi;if(R){const sh=R.shifts.filter(x=>x.emp==='camille'&&x.w===0&&x.d===TIDX).sort((a,b)=>sMin(a)-sMin(b));
    // jour de repos de Camille : on lui met quand même un service, pour pouvoir la montrer
    if(!sh.length&&!withCtx(R,()=>isClosed(TIDX))){const x={id:'scamille_demo',emp:'camille',w:0,d:TIDX,s:'11:00',e:'15:00',p:0,poste:'manager'};R.shifts.push(x);sh.push(x);}
    if(sh.length&&sMin(sh[0])<=DEMO.sim0&&eMin(sh[0])>DEMO.sim0+60){sh[0].s='11:00';
      const ev=R.pointages.camille&&R.pointages.camille[TODAY_ISO];if(ev)ev.length=0;}}
}catch(e){}return o;};}
