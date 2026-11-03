/* =========================================================
   V12 · UN SEUL CHEMIN
   Dans le vrai site (/app), la connexion Léon (e-mail + mot de passe, puis code à 4 chiffres)
   est la SEULE porte. Les vieux écrans de l'app (« Crée ton Léon », identifiant + mot de passe
   du resto, verrou de l'appareil) sont sautés : on entre directement dans son resto.
   /app prête le compte via window.parent.__leonCompte. Absent (démo) → rien ne change.
   ========================================================= */
const V12_COMPTE=(()=>{try{return window.parent!==window&&window.parent.__leonCompte||null;}catch(e){return null;}})();
function v12Code(){return String(1000+Math.floor(Math.random()*9000));}
function v12Entrer(){
  if(!V12_COMPTE||!NET.configLoaded)return false;
  // 12.18 · Salarié invité : il entre dans son resto avec sa vue à lui (pas de code, pas d'écran de compte).
  if(V12_COMPTE.salarie){
    const rid=NET.config&&(NET.config.restos||[])[0];
    if(!rid){U.screen='app';document.body.innerHTML='<div style="font:16px system-ui;padding:40px;text-align:center">Ton resto n’est pas encore prêt sur Léon. Réessaie un peu plus tard.</div>';return true;}
    setDevice(null);
    loginAs({role:'staff',rid,empId:V12_COMPTE.empId});
    try{const e=empById(V12_COMPTE.empId);if(!e){document.querySelector('.view')&&(document.querySelector('.view').innerHTML='<div class="panel"><div class="empty"><p>Ton compte n’est plus rattaché à un salarié du resto. Demande un nouveau lien à ton responsable.</p></div></div>');}
      else if(e.acces==='manager'){U.role='manager';render();}}catch(_){}
    return true;
  }
  if(!NET.config){
    // Premier passage : le resto est créé avec le nom donné à l'invitation, sans rien demander.
    const prenom=V12_COMPTE.prenom||'Patron';
    NET.config={adminName:prenom,adminId:slugify(prenom),adminPass:Math.random().toString(36).slice(2,12),adminCode:v12Code(),restos:[]};
    NET.configLoaded=true;
    createResto({nom:V12_COMPTE.resto||'Mon restaurant',type:TEMPLATES.vide.l,ville:V12_COMPTE.ville||'',tpl:'vide',code:v12Code(),closed:[0]});
  }
  // 12.19 · Appli « Léon Tablette » : la tablette reste sur l'écran des codes (chacun tape le sien).
  if(V12_COMPTE.tablette){
    if(U.screen==='lock'&&U.lockRid&&DEVICE&&DEVICE.rid===U.lockRid)return false;
    const r0=(NET.config.restos||[])[0];if(!r0)return false;
    setDevice({rid:r0},true);U.lockRid=r0;U.role=null;U.empId=null;
    mountFull(r0);S=NET.restos[r0];syncCtx();U.screen='lock';render();
    return true;
  }
  const rid=(NET.config.restos||[])[0];
  setDevice({admin:true},true);
  loginAs(rid?{role:'admin',rid}:{role:'admin'});
  return true;
}
{const f=render;render=function(){
  if(V12_COMPTE&&(U.screen==='setup'||U.screen==='login'||U.screen==='lock')&&v12Entrer())return;
  return f.apply(this,arguments);
};}

/* Dans le vrai site, chaque compte = un resto : plus de « Mes restaurants » ni de vue réseau
   (c'est l'espace créateur de /createur qui liste les restos). */
if(V12_COMPTE){
  ROLES.admin='Patron';
  ACT['go-hub']=function(){go('accueil');};
  {const f=go;go=function(v){if(v==='hub'){if(S)return f.call(this,'accueil');}return f.apply(this,arguments);};}
  {const f=navCrumbs;navCrumbs=function(){return (f.apply(this,arguments)||[]).filter(c=>c.l!=='Mes restaurants');};}
  {const f=render;render=function(){
    const r=f.apply(this,arguments);
    $$('.hub-back').forEach(e=>e.remove());
    $$('.ph .sub').forEach(e=>{if(e.textContent.includes('Tu y es en créateur · '))e.textContent=e.textContent.replace('Tu y es en créateur · ','');});
    return r;
  };}
  {const f=renderView;renderView=function(){
    const r=f.apply(this,arguments);
    $$('.hub-back').forEach(e=>e.remove());
    $$('.ph .sub').forEach(e=>{if(e.textContent.includes('Tu y es en créateur · '))e.textContent=e.textContent.replace('Tu y es en créateur · ','');});
    return r;
  };}
}
