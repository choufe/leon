/* =========================================================
   V12 · LA TABLETTE DU RESTO (appli « Léon Tablette », /tablette)
   Décidé avec Maurice le 3 nov. : sur la tablette on badge, on fait l'hygiène (températures, DLC, étiquettes),
   on voit le planning, le cahier, les plats dispo et les allergènes. Le patron ou un manager qui tape son code
   peut en plus valider les réceptions de commande et faire l'inventaire, et voit « Aujourd'hui ».
   Pas de paie, pas de réglages, pas de modification du planning, pas de badgeuse à corriger : ça, c'est le PC / le téléphone.
   ========================================================= */
// La démo aussi a sa tablette : /leon/demo.html?tablette=1 (Le Petit Beffroi, comme chez un vrai client).
const DEMO_TAB=typeof DEMO!=='undefined'&&/[?&]tablette=1/.test(location.search);
const TABLETTE=!!(V12_COMPTE&&V12_COMPTE.tablette)||DEMO_TAB;
if(DEMO_TAB){
  const ridDemo=()=>{const l=(NET.config&&NET.config.restos)||[];return l.find(id=>/beffroi/i.test(id))||l[0];};
  {const f=render;render=function(){
    try{const rid=NET.config&&ridDemo();
      if(rid&&U.screen!=='app'&&U.screen!=='badge'&&!(U.screen==='lock'&&U.lockRid===rid)){
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
  }catch(e){}return o;};}
}
