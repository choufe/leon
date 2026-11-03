/* =========================================================
   V12 · LA TABLETTE DU RESTO (appli « Léon Tablette », /tablette)
   Décidé avec Maurice le 3 nov. : sur la tablette on badge, on fait l'hygiène (températures, DLC, étiquettes),
   on voit le planning, le cahier, les plats dispo et les allergènes. Le patron ou un manager qui tape son code
   peut en plus valider les réceptions de commande et faire l'inventaire, et voit « Aujourd'hui ».
   Pas de paie, pas de réglages, pas de modification du planning, pas de badgeuse à corriger : ça, c'est le PC / le téléphone.
   ========================================================= */
// La démo aussi a sa tablette : /leon/demo.html?tablette=1 (Le Petit Beffroi, comme chez un vrai client).
const DEMO_TAB=typeof DEMO!=='undefined'&&(window.__LEON_TAB===1||/[?&]tablette=1/.test(location.search));
const TABLETTE=!!(V12_COMPTE&&V12_COMPTE.tablette)||DEMO_TAB;
if(DEMO_TAB){
  // Installable comme une appli (« Sur l'écran d'accueil ») : icône « Léon Tablette » qui rouvre toujours la tablette.
  try{const h=document.head;const add=(t,at)=>{const e=document.createElement(t);Object.entries(at).forEach(([k,v])=>e.setAttribute(k,v));h.appendChild(e);};
    add('link',{rel:'manifest',href:'/tablette-demo.webmanifest'});add('meta',{name:'apple-mobile-web-app-capable',content:'yes'});add('meta',{name:'mobile-web-app-capable',content:'yes'});
    add('meta',{name:'apple-mobile-web-app-title',content:'Léon Tablette'});add('meta',{name:'apple-mobile-web-app-status-bar-style',content:'black-translucent'});
    add('link',{rel:'apple-touch-icon',href:'/brand/icon-192.png'});document.title='Léon Tablette';}catch(e){}
  const ridDemo=()=>{const l=(NET.config&&NET.config.restos)||[];return l.find(id=>/beffroi/i.test(id))||l[0];};
  {const f=render;render=function(){
    try{const rid=NET.config&&ridDemo();
      if(rid&&!['app','badge','kiosk'].includes(U.screen)&&!(U.screen==='lock'&&U.lockRid===rid)){
        setDevice({rid},true);U.lockRid=rid;U.role=null;U.empId=null;mountFull(rid);S=NET.restos[rid];syncCtx();U.screen='lock';}
    }catch(e){}
    return f.apply(this,arguments);};}
  // les codes de test restent accessibles, mais repliés : l'écran ressemble à celui d'un vrai resto
  if(typeof demoCodesHTML==='function'){const f=demoCodesHTML;demoCodesHTML=function(){const R=U.lockRid&&NET.restos[U.lockRid];return `<details class="demo-codes-d"><summary>Codes de test</summary>${f.apply(this,arguments)}<p class="demo-pass">Mot de passe direction : <b>${esc((R&&R.login&&R.login.pass)||'')}</b> · créateur : <b>${esc(NET.config.adminPass||'')}</b></p></details>`;};}
}
if(TABLETTE){
  const OK=['accueil','planning','hygiene','service','allergenes','liaison','recettes','stocks'];
  {const f=navItems;navItems=function(){return (f.apply(this,arguments)||[]).filter(n=>OK.includes(n.v));};}
  {const f=go;go=function(v){if(v&&!OK.includes(v)&&v!=='hub')v='accueil';return f.call(this,v);};}
  {const f=CAN;CAN=function(){const c=f.apply(this,arguments)||{};return {...c,editPlanning:false,settings:false,salaries:false,team:false};};}
  // l'aperçu « Voir comme » et le retour au hub n'ont rien à faire sur la tablette
  {const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{document.querySelectorAll('.viewas').forEach(x=>x.remove());}catch(e){}return o;};}
  document.documentElement.classList.add('mode-tablette');
}

/* ---------- 12.21 · Tablette : juste le code, mot de passe pour la direction, « Retour » ---------- */
if(TABLETTE){
  // Le directeur et le créateur : code + mot de passe (celui de la tablette, vu dans Réglages → Connexion des appareils).
  const passOK=(r,p)=>{const R=NET.restos[r.rid||U.lockRid];return !!p&&((R&&R.login&&p===R.login.pass)||(r.role==='admin'&&p===NET.config.adminPass));};
  let TAB_ATTENTE=null;
  {const f=pinCheck;pinCheck=function(){
    if(PIN.ctx==='lock'&&!(typeof BORNE!=='undefined'&&BORNE.who)){
      const r=routeCode(PIN.buf);
      if(r&&(r.role==='admin'||r.role==='patron')){
        TAB_ATTENTE=r;PIN.buf='';PIN.ctx='tab-pass';
        openModal(`<div style="text-align:center"><h3>${T('Mot de passe')}</h3><p class="muted" style="margin-top:4px">${T('Accès direction : confirme avec ton mot de passe.')}</p>
          <input class="inp" id="tab-pass" type="password" autocomplete="current-password" style="margin-top:14px;text-align:center;font-size:18px">
          <p class="pin-err" id="tab-pass-err" style="min-height:18px;margin-top:8px"></p>
          <div class="mf" style="justify-content:center"><button class="btn" data-act="tab-pass-annuler">${T('Retour')}</button><button class="btn primary" data-act="tab-pass-ok">${T('Entrer')}</button></div></div>`);
        setTimeout(()=>{const i=document.getElementById('tab-pass');if(i){i.focus();i.addEventListener('keydown',e=>{if(e.key==='Enter')ACT['tab-pass-ok']();});}},50);
        return;
      }
    }
    return f.apply(this,arguments);
  };}
  ACT['tab-pass-ok']=function(){
    const i=document.getElementById('tab-pass');const r=TAB_ATTENTE;if(!i||!r)return;
    if(!passOK(r,i.value)){const e=document.getElementById('tab-pass-err');if(e)e.textContent=T('Mot de passe incorrect.');i.value='';i.focus();return;}
    TAB_ATTENTE=null;closeModal();PIN.ctx=null;loginAs(r);
  };
  ACT['tab-pass-annuler']=function(){TAB_ATTENTE=null;closeModal();PIN.ctx='lock';PIN.buf='';render();};
  // Écran du salarié : pas d'« Ouvrir mon espace » ni d'« Annuler » : juste « Retour » vers le code.
  {const f=render;render=function(){const o=f.apply(this,arguments);try{
    if(U.screen==='badge'){
      document.querySelectorAll('[data-act="badge-open"]').forEach(b=>b.remove());
      document.querySelectorAll('[data-act="lock"],[data-act="badge-cancel"]').forEach(b=>{b.innerHTML=T('Retour');b.setAttribute('data-act','lock');});
    }
    if(U.screen==='lock'){document.querySelectorAll('.bfaces').forEach(x=>x.remove());}
    if(U.screen==='kiosk'){document.querySelectorAll('[data-act="kiosk-home"]').forEach(b=>{b.innerHTML=ic('chevL','s')+' '+T('Retour');b.classList.add('tab-retour');});}
  }catch(e){}return o;};}
}

/* ---------- 12.24 · Refonte visuelle de la tablette ----------
   Écrans d'entrée (code, salarié, « c'est pointé ») : deux panneaux. À gauche (ou en haut sur un écran étroit)
   le panneau Léon : logo, nom du resto, grande heure, qui est au travail. À droite, sur fond crème, une carte
   blanche avec l'action : le pavé de code, ou « Pointer » et les accès rapides.
   Écrans du kiosque : logo Léon dans l'en-tête, « Retour » qui remonte d'un cran (sous-page → Hygiène → salarié). */
if(TABLETTE){
  const LOGO='/brand/leon-logo-creme.png';
  function tlLayout(){
    const st=document.querySelector('#app > .stage:not(.kiosk-stage)');if(!st||st.querySelector('.tl'))return;
    const lock=st.querySelector(':scope > .lock');if(!lock)return;
    const kids=[...lock.children];const left=[],right=[];let cote=left;
    kids.forEach(el=>{
      if(el.matches('.lock-info'))return left.push(el);
      if(cote===left&&el.matches('.who,.pin-dots,.pin-err,.pin-pad,.badge-acts,.row,details'))cote=right;
      cote.push(el);
    });
    const tl=document.createElement('div');tl.className='tl'+(lock.classList.contains('bconf')?' tl-conf '+[...lock.classList].filter(c=>c==='ok'||c==='warn'||c==='bad').join(' '):'');
    const L=document.createElement('div');L.className='tl-left';L.innerHTML=`<img class="tl-logo" src="${LOGO}" alt="Léon">`;
    const Li=document.createElement('div');Li.className='tl-left-in';left.forEach(e=>Li.appendChild(e));L.appendChild(Li);
    const R=document.createElement('div');R.className='tl-right';const C=document.createElement('div');C.className='tl-card';right.forEach(e=>C.appendChild(e));R.appendChild(C);
    if(U.screen==='lock'){const h=document.createElement('div');h.className='tl-card-h';h.innerHTML=`<b>${T('Tape ton code')}</b><span>${T('Pour pointer ou ouvrir ton espace')}</span>`;C.prepend(h);C.querySelectorAll(':scope > .who').forEach(w=>w.remove());}
    tl.append(L,R);lock.replaceChildren(tl);st.classList.add('tl-stage');lock.classList.add('tl-lock');
  }
  function tlKiosk(){
    const top=document.querySelector('.kiosk-top');if(!top||top.querySelector('.tl-klogo'))return;
    top.insertAdjacentHTML('afterbegin','');
    const clock=top.querySelector('.clock');if(clock)clock.insertAdjacentHTML('beforebegin',`<img class="tl-klogo" src="/brand/leon-logo-vert.png" alt="Léon">`);
    const K=UI.kiosk||{};const back=top.querySelector('[data-act="kiosk-home"]');
    if(K.view==='hygiene'&&K.hyg&&back){
      if(K.etqZone){back.setAttribute('data-act','kiosk-etq-zone');back.removeAttribute('data-k');}
      else back.setAttribute('data-act','kiosk-hyg-home');
      const t=top.querySelector('.kiosk-title');const nom={taches:'Entretien',etiquetage:'Étiquetage',ouverts:'Produits ouverts'}[K.hyg];if(t&&nom)t.textContent=T(nom);
      document.querySelectorAll('.kiosk-body [data-act="kiosk-hyg-home"]').forEach(b=>b.remove());
      if(K.etqZone)document.querySelectorAll('.kiosk-body [data-act="kiosk-etq-zone"]:not([data-k]),.kiosk-body [data-act="kiosk-etq-zone"][data-k=""]').forEach(b=>{if(/retour|toutes|catégories/i.test(b.textContent))b.remove();});
    }
  }
  {const f=render;render=function(){const o=f.apply(this,arguments);try{if(U.screen==='lock'||U.screen==='badge')tlLayout();if(U.screen==='kiosk')tlKiosk();}catch(e){}return o;};}
}
