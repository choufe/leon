/* =========================================================
   V13.01 · LA DÉMO, OUVERTE DEPUIS L'ESPACE CRÉATEUR
   Décidé avec Maurice le 4 nov. : la démo n'est plus publique (le site ne propose que
   « Demander une démo »). Maurice l'ouvre depuis son espace créateur et choisit :
   - /leon/demo.html?vue=reseau : Bruno, patron de plusieurs restos (vue d'ensemble) ;
   - /leon/demo.html?vue=resto  : le patron d'un seul resto (Le Petit Beffroi).
   Plus d'écran « Lancer la démo » ni d'identifiant / mot de passe : on arrive directement dedans.
   ========================================================= */
const V13_VUE=(()=>{
  if(typeof DEMO==='undefined'||(typeof DEMO_TAB!=='undefined'&&DEMO_TAB))return null;
  return new URLSearchParams(location.search).get('vue')==='reseau'?'reseau':'resto';
})();
let V13_ENTRE=false;
const V13_PATRON=V13_VUE==='reseau'?'Bruno':'Hugo';
const v13Salon=id=>{const R=NET.restos&&NET.restos[id];return /sylvain|salon/i.test(String(id))||(R&&/coiff/i.test(R.type||''));};
// Bruno a des restaurants : le salon de coiffure (démo faite pour Sylvain) n'a rien à faire dans son groupe.
function v13Groupe(){
  try{if(V13_VUE==='reseau'&&NET.config&&(NET.config.restos||[]).some(v13Salon))NET.config={...NET.config,restos:NET.config.restos.filter(id=>!v13Salon(id)),adminName:V13_PATRON};
      else if(V13_VUE==='reseau'&&NET.config&&NET.config.adminName!==V13_PATRON)NET.config={...NET.config,adminName:V13_PATRON};}catch(e){}
}
function v13Entrer(){
  if(V13_ENTRE||!NET.configLoaded||!NET.config)return false;
  const rid=(NET.config.restos||[]).find(id=>/beffroi/i.test(id))||(NET.config.restos||[])[0];
  if(V13_VUE==='resto'&&!rid)return false;
  V13_ENTRE=true;
  if(V13_VUE==='reseau'){setDevice({admin:true},false);loginAs({role:'admin'});}
  // Patron d'un seul resto : il entre direct dans son resto, avec « Voir comme » (directeur, manager, salarié)
  else{setDevice({admin:true},false);loginAs({role:'admin',rid});}
  setTimeout(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()),30);
  return true;
}
if(V13_VUE){
  ROLES.admin='Patron';
  document.documentElement.classList.add('v13-'+V13_VUE);
  if(V13_VUE==='resto'){
    // un seul resto : pas de « Mes restaurants »
    ACT['go-hub']=function(){go('accueil');};
    {const f=go;go=function(v){if(v==='hub'&&S)return f.call(this,'accueil');return f.apply(this,arguments);};}
    {const f=navCrumbs;navCrumbs=function(){return (f.apply(this,arguments)||[]).filter(c=>c.l!=='Mes restaurants');};}
  }
  {const f=me;me=function(){const m=f.apply(this,arguments);if(m&&m.role==='admin')return {...m,prenom:V13_PATRON,titre:'Patron'};return m;};}
  {const f=render;render=function(){
    v13Groupe();
    if(!V13_ENTRE&&U.screen!=='app'&&v13Entrer())return;
    return f.apply(this,arguments);
  };}
  // Le cadenas ramène à l'espace créateur (plus d'écran de codes ni d'identifiants dans la démo)
  ACT.lock=function(){location.href='/createur';};
}
