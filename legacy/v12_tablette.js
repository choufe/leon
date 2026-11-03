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
  if(typeof demoCodesHTML==='function'){const f=demoCodesHTML;demoCodesHTML=function(){return `<details class="demo-codes-d"><summary>Codes de test</summary>${f.apply(this,arguments)}</details>`;};}
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
