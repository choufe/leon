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
let tabDirection=r=>loginAs(r); // remplacée plus bas : le directeur reste sur la tablette
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
      if(r&&r.role==='manager'&&r.empId){
        PIN.buf='';PIN.ctx=null;U.role='manager';U.empId=r.empId;U.rid=r.rid;U.viewAs=null;U.badgeMsg=null;
        mountFull(r.rid);S=NET.restos[r.rid];syncCtx();LAST_ACT=Date.now();U.screen='badge';render();return;
      }
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
    TAB_ATTENTE=null;closeModal();PIN.ctx=null;tabDirection(r);
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
  // Composition « page de connexion du site » : barre du haut (logo, resto, heure), carte blanche, portes vertes.
  const SOUS={hygiene:'Températures, étiquettes, produits ouverts',reception:'Photo de la facture, contrôle',planning:'Ta semaine',dispo:'Plats disponibles'};
  function tlLayout(){
    const st=document.querySelector('#app > .stage:not(.kiosk-stage)');if(!st||st.querySelector('.tb'))return;
    const lock=st.querySelector(':scope > .lock');if(!lock)return;
    const conf=lock.classList.contains('bconf');const q=sel=>lock.querySelector(sel);
    const R=U.lockRid&&NET.restos[U.lockRid];
    const tb=document.createElement('div');tb.className='tb'+(conf?' tb-conf '+[...lock.classList].filter(c=>c==='ok'||c==='warn'||c==='bad').join(' '):'');
    const top=document.createElement('header');top.className='tb-top';
    top.innerHTML=`<img src="${LOGO}" alt="Léon"><span class="tb-resto">${esc(R?R.nom:(S&&S.nom)||'')}</span>`;
    const clk=q('.lock-clock');if(clk)top.appendChild(clk);else top.insertAdjacentHTML('beforeend',`<span class="lock-clock" data-clock>${hhmm(nowMin())}</span>`);
    const main=document.createElement('main');main.className='tb-main';
    const card=document.createElement('section');card.className='tb-card';
    const side=document.createElement('aside');side.className='tb-side';
    const head=document.createElement('div');head.className='tb-head';
    if(U.screen==='lock'){
      head.innerHTML=`<span class="tb-ic">${ic('lock')}</span><div><div class="tb-eb">${T('Tablette du restaurant')}</div><h1 class="tb-h1">${T('Tape ton code')}</h1></div>`;
      card.appendChild(head);
      ['.pin-dots','.pin-err','.pin-pad','details'].forEach(k=>{const e=q(k);if(e)card.appendChild(e);});
      const info=[...lock.querySelectorAll('.lock-info .lk')];
      if(info.length){side.insertAdjacentHTML('beforeend',`<div class="tb-side-h">${T('Aujourd’hui')}</div>`);
        info.forEach(lk=>{const d=document.createElement('div');d.className='tb-door info';d.innerHTML=`<span class="tb-dic">${lk.querySelector('svg')?lk.querySelector('svg').outerHTML:ic('users','s')}</span><div><b>${esc(lk.textContent.trim())}</b></div><span></span>`;side.appendChild(d);});}
    }else{
      const av=q('.bw-av .av')||q('span.av');const chk=q('.bc-check');const h1=q('h1');
      head.innerHTML=`<div></div>`;const hd=head.firstChild;
      if(chk)head.prepend(chk);else if(av)head.prepend(av);
      hd.innerHTML=`<div class="tb-eb">${conf?T('C’est noté'):T('Bonjour')}</div>`;if(h1){h1.classList.add('tb-h1');hd.appendChild(h1);}
      card.appendChild(head);
      [...lock.children].forEach(e=>{if(e.matches('p,.sub,.bc-type,.bc-s'))card.appendChild(e);});
      const acts=[...lock.querySelectorAll(':scope > .badge-acts')];
      const tiles=acts.find(a=>a.querySelector('[data-act="badge-goto"]'));
      acts.filter(a=>a!==tiles).forEach(a=>card.appendChild(a));
      const back=lock.querySelector('[data-act="lock"]');
      if(back){back.className='tb-back';back.innerHTML=T('Retour');card.appendChild(back);}
      if(tiles){side.insertAdjacentHTML('beforeend',`<div class="tb-side-h">${T('Accès rapide')}</div>`);
        [...tiles.querySelectorAll('[data-act="badge-goto"]')].forEach(b=>{const v=b.dataset.v;const svg=b.querySelector('svg');const lab=b.textContent.trim();
          const d=document.createElement('button');d.className='tb-door';d.setAttribute('data-act','badge-goto');d.dataset.v=v;
          d.innerHTML=`<span class="tb-dic">${svg?svg.outerHTML:''}</span><div><b>${esc(lab)}</b><small>${esc(T(SOUS[v]||''))}</small></div><span class="tb-go">→</span>`;side.appendChild(d);});}
    }
    main.append(card);if(side.children.length)main.append(side);else main.classList.add('solo');
    tb.append(top,main);lock.replaceChildren(tb);st.classList.add('tb-stage');lock.classList.add('tb-lock');
  }
  function tlKiosk(){
    const top=document.querySelector('.kiosk-top');if(!top||top.querySelector('.tl-klogo'))return;
    top.insertAdjacentHTML('afterbegin','');
    const clock=top.querySelector('.clock');if(clock)clock.insertAdjacentHTML('beforebegin',`<img class="tl-klogo lt" src="/brand/leon-logo-vert.png" alt="Léon"><img class="tl-klogo dk" src="/brand/leon-logo-creme.png" alt="">`);
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

/* ---------- 12.28 · Tablette = tablette, pour tout le monde ----------
   - Toujours en clair (même rendu que le site, quel que soit le réglage clair/sombre de l'appareil).
   - Le directeur et le créateur (code + mot de passe) restent sur la tablette : écran « Direction »
     avec Aujourd'hui (couverts, qui est là, absents), Hygiène, Réception. Jamais l'appli PC / téléphone. */
if(TABLETTE){
  try{document.documentElement.setAttribute('data-theme','light');}catch(e){}
  // à la place de loginAs : on reste sur la tablette
  tabDirection=function(r){
    const rid=r.rid||U.lockRid;U.role=r.role;U.empId=null;U.rid=rid;U.viewAs=null;U.badgeMsg=null;
    mountFull(rid);S=NET.restos[rid];syncCtx();LAST_ACT=Date.now();
    UI.kiosk={view:'direction'};UI.kioskDir=true;U.screen='kiosk';render();
  };
  {const f=ACT['kiosk-home'];ACT['kiosk-home']=function(){if(UI.kioskDir){UI.kiosk={view:'direction'};render();return;}return f.apply(this,arguments);};}
  {const f=lock;lock=function(){UI.kioskDir=false;return f.apply(this,arguments);};}
  {const f=kioskShellHTML;kioskShellHTML=function(){
    if(!UI.kiosk||UI.kiosk.view!=='direction')return f.apply(this,arguments);
    const nom=U.role==='admin'?(NET.config.adminName||'Maurice'):((S.patron&&S.patron.prenom)||'Direction');
    return `<div class="stage kiosk-stage"><div class="kiosk-shell">
      <header class="kiosk-top"><button class="btn demo-link sm" data-act="lock">${ic('chevL','s')} ${T('Retour')}</button><b class="kiosk-title">${T('Direction')} · ${esc(nom)}</b><span class="clock" data-clock>${hhmm(nowMin())}</span></header>
      <div class="kiosk-body">${dirHTML()}</div></div></div>`;
  };}
  function dirHTML(){
    const d=TIDX,w=0;let c;try{c=rmCouverts(w,d).c;}catch(_){c=prevOf(d);}
    const sh=shiftsWD(w,d);
    const qui=midi=>[...new Set(sh.filter(x=>midi?sMin(x)<900:eMin(x)>1080).map(x=>x.emp))].map(empById).filter(Boolean);
    const abs=S.absences.filter(a=>a.w===w&&a.d===d&&a.type!=='repos').map(a=>empById(a.emp)).filter(Boolean);
    const lig=(l,cv,L)=>`<div class="dir-svc"><b>${l}</b><span>${cv?plur(cv,'couvert'):'—'}</span><div class="dir-avs">${L.map(e=>avatar(e,'s')).join('')||'<span class="faint">personne</span>'}</div></div>`;
    const recs=(S.hyg&&S.hyg.recs||[]).filter(r=>r.iso===TODAY_ISO);
    const door=(v,i,t,s)=>`<button class="tb-door light" data-act="dir-go" data-v="${v}"><span class="tb-dic">${ic(i)}</span><div><b>${T(t)}</b><small>${esc(s)}</small></div><span class="tb-go">→</span></button>`;
    return `<h2 class="kiosk-h2">${T('Aujourd’hui')}</h2>
      <div class="dir-card">${lig(T('Midi'),c[0],qui(true))}${lig(T('Soir'),c[1],qui(false))}${abs.length?`<p class="dir-abs">${ic('alert','s')} ${T('Absent')} : ${abs.map(e=>esc(e.prenom)).join(', ')}</p>`:''}</div>
      <h2 class="kiosk-h2">${T('Sur la tablette')}</h2>
      <div class="dir-doors">${door('hygiene','thermo','Hygiène','Températures, étiquettes, produits ouverts')}${door('reception','truck','Réception',recs.length?plur(recs.length,'livraison reçue aujourd’hui','livraisons reçues aujourd’hui'):'Photo de la facture, contrôle')}</div>
      <p class="faint" style="margin-top:16px;font-size:13px">${T('Planning, paie et réglages : sur ton téléphone ou ton ordinateur.')}</p>`;
  }
  ACT['dir-go']=function(t){UI.kiosk={view:t.dataset.v};render();};
}
