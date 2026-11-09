/* =========================================================
   V14.01–14.04 · LE TRONC VERS 60 %
   Décidé avec Maurice le 9 nov. : « amène le tronc à 60 % ».
   1. Démarrer Léon : la mise en route suit tout le démarrage d'un resto
      (resto, équipe, carte, produits, fournisseurs, hygiène, tablette, imprimante,
      inventaire, planning, caisse), avec « la prochaine étape » bien visible.
   2. L'accueil rangé selon les 4 points de Léon (masse salariale, marchandise,
      paperasse, le resto dans la poche).
   3. La démo a sa visite guidée de 5 minutes, pour la montrer en rendez-vous.
   4. Salariés & accès : rappel de la note d'information RGPD avant de badger.
   ========================================================= */

/* ---------- 1. Démarrer Léon ---------- */
const v14Set=k=>{S.setup={...(S.setup||{}),[k]:true};save();};
function setupStepsV14(){
  const sups=Object.values(S.suppliers||{});const temps=(S.hyg&&S.hyg.temps)||[];const lots=(S.hyg&&S.hyg.lots)||[];const st=S.setup||{};
  return [
    {g:'Le resto',k:'resto',t:'Vérifier ton resto',s:'Nom, jours de fermeture, ticket moyen, objectif de coût matière',done:!!st.resto,act:'v14-go',v:'reglages',manual:true},
    {g:'Le resto',k:'equipe',t:'Ajouter l’équipe',s:`${plur(EMP.length,'salarié')} · depuis Excel ou à la main, chacun avec sa langue`,done:EMP.length>0,act:'imp-open',v:'equipe',imp:true},
    {g:'Le resto',k:'carte',t:'Importer la carte',s:'Colle ton menu ou le fichier de ta caisse, puis vérifie les prix',done:!!(st.carte||st.imported),act:'imp-open',v:'carte',imp:true},
    {g:'La marchandise',k:'produits',t:'Importer les produits',s:'Ta mercuriale : prix d’achat, fournisseur, unité',done:S.ingredients.length>5,act:'imp-open',v:'produits',imp:true},
    {g:'La marchandise',k:'fourn',t:'Régler tes fournisseurs',s:'Jours de livraison, e-mail, minimum de commande : Léon prépare les commandes',done:sups.some(s=>(s.jours||[]).length&&s.email),act:'v14-go',v:'stocks',tab:'fourn'},
    {g:'La marchandise',k:'inv',t:'Faire le premier inventaire',s:'Zone par zone, sur la tablette ou le téléphone',done:!!st.inv,act:'goto-inv'},
    {g:'Sur place',k:'hyg',t:'Lister tes frigos et faire un relevé',s:'Léon te rappelle les relevés chaque jour',done:temps.length>0,act:'v14-go',v:'hygiene'},
    {g:'Sur place',k:'tablette',t:'Installer la tablette du resto',s:'La borne : badger, hygiène, réceptions',done:!!st.tablette,act:'v14-tab',manual:true},
    {g:'Sur place',k:'imprimante',t:'Imprimer une étiquette test',s:'L’imprimante d’étiquettes DLC, branchée en wifi',done:!!st.imprimante||lots.length>0&&!!st.label,act:'v14-print',manual:true},
    {g:'Sur place',k:'planning',t:'Publier un premier planning',s:'L’équipe le voit sur son téléphone',done:Object.keys(S.published||{}).some(k=>S.published[k]),act:'nav',v:'planning'},
    {g:'Plus tard',k:'caisse',t:'Brancher la caisse',s:S.caisse&&S.caisse.provider?`${esc(S.caisse.provider)} · Maurice s’en occupe`:'Maurice s’en occupe avec toi',done:!!(S.caisse&&S.caisse.status==='connected'),act:'nav',v:'reglages',later:true},
  ];
}
setupSteps=setupStepsV14;
setupCard=function(){
  const st=setupStepsV14();const req=st.filter(x=>!x.later);const n=req.filter(x=>x.done).length;if(n===req.length)return '';
  const next=req.find(x=>!x.done);
  const btn=(x,primary)=>`<button class="btn sm ${primary?'primary':''}" data-act="${x.act}" ${x.v?`data-v="${x.v}" data-k="${x.v}"`:''} ${x.tab?`data-t="${x.tab}"`:''}>${x.imp?ic('upload','s')+' Importer':primary?'Commencer':'Y aller'}</button>${x.manual&&!x.done?`<button class="btn sm ghost" data-act="v14-done" data-k="${x.k}">${ic('check','s')} C’est fait</button>`:''}`;
  const groups=[...new Set(st.map(x=>x.g))];
  return `<section class="panel onb v14-onb"><div class="panel-h"><h2>${ic('list')} Démarrer Léon</h2><span class="faint" style="font-size:12.5px">${n}/${req.length} étapes · environ 1 heure en tout</span></div><div class="panel-b" style="padding-top:0">
   <div class="meter" style="margin:0 0 12px"><i style="width:${n/req.length*100}%"></i></div>
   <div class="v14-next"><span class="v14-next-n">${req.indexOf(next)+1}</span><div><small>Prochaine étape</small><b>${next.t}</b><p>${next.s}</p></div><div class="v14-next-a">${btn(next,true)}</div></div>
   <details class="v14-all"><summary>Voir toutes les étapes</summary>${groups.map(g=>`<div class="v14-g"><span class="v14-gt">${g}</span>${st.filter(x=>x.g===g).map(x=>`<div class="onb-row"><span class="${x.done?'ok':'faint'}">${ic(x.done?'check':'clock','s')}</span><span style="flex:1"><b style="${x.done?'text-decoration:line-through;color:var(--ink-3)':''}">${x.t}</b><br><small class="muted">${x.s}</small></span>${x.done||x.later?'':btn(x,false)}</div>`).join('')}</div>`).join('')}</details>
  </div></section>`;
};
function v14TabModal(){
  const site=location.origin;const L=S.login||{};
  openModal(`<div class="mh"><div><h3>Installer la tablette du resto</h3><p>La tablette reste au resto : l’équipe y badge, fait l’hygiène et les réceptions. 5 minutes.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <ol class="v14-steps">
     <li><b>Sur la tablette, ouvre Safari</b> (ou Chrome) et va sur <code>${esc(site)}/tablette</code>.</li>
     <li><b>Connecte le resto</b> avec l’identifiant et le mot de passe de la tablette${L.id?` (identifiant : <code>${esc(L.id)}</code>)`:''}. Tu les trouves dans Réglages → La tablette du resto.</li>
     <li><b>Partager → « Sur l’écran d’accueil »</b> : Léon s’ouvre en plein écran, comme une appli.</li>
     <li><b>Fais un essai</b> : tape ton code à 4 chiffres, badge, puis « Retour ».</li>
     <li>Laisse la tablette branchée, près de l’entrée du personnel. Elle revient toute seule sur l’écran des codes.</li>
   </ol>
   <p class="faint" style="font-size:12.5px">Avant le premier badge, remets à chaque salarié la <a href="/info-salaries" target="_blank" rel="noopener">note d’information</a> (obligatoire).</p>
   <div class="mf"><button class="btn" data-act="v14-go" data-v="reglages">Ouvrir les réglages</button><span class="sp"></span><button class="btn primary" data-act="v14-done" data-k="tablette">${ic('check','s')} La tablette est installée</button></div>`,'wide');
}
Object.assign(ACT,{
  'v14-go'(t){closeModal();goMod(t.dataset.v,t.dataset.t||null);window.scrollTo({top:0});},
  'v14-done'(t){const k=t.dataset.k;v14Set(k);closeModal();renderView();toast('Étape faite','check');},
  'v14-tab'(){v14TabModal();},
  'v14-print'(){
    openModal(`<div class="mh"><div><h3>Imprimer une étiquette test</h3><p>L’imprimante d’étiquettes (Brother QL) se branche en wifi, sur le même réseau que la tablette.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
     <ol class="v14-steps"><li>Allume l’imprimante et connecte-la au wifi du resto (bouton wifi, puis l’appli Brother sur un téléphone).</li><li>Sur la tablette, touche « Imprimer le test » ci-dessous et choisis l’imprimante.</li><li>L’étiquette sort avec le nom du resto et une date : c’est bon.</li></ol>
     <div class="mf"><button class="btn" data-act="v14-print-go">${ic('copy','s')} Imprimer le test</button><span class="sp"></span><button class="btn primary" data-act="v14-done" data-k="imprimante">${ic('check','s')} L’étiquette est sortie</button></div>`);},
  'v14-print-go'(){try{printLabel({nom:'Étiquette test',dlc:isoD(addDays(TODAY,3)),sub:'Léon · imprimante OK'});}catch(e){toast('Impression indisponible ici','alert');}},
});
// Démo : le Petit Beffroi tourne déjà (resto vérifié, tablette et imprimante installées)
{const f=render;render=function(){try{if(typeof DEMO!=='undefined'&&DEMO&&S&&S.setup&&!S.setup.tablette)S.setup={...S.setup,resto:true,tablette:true,imprimante:true};}catch(e){}return f.apply(this,arguments);};}
// La tablette se déclare installée dès qu'elle tourne dans le resto
{const f=render;render=function(){try{if(typeof TABLETTE!=='undefined'&&TABLETTE&&S&&!(S.setup&&S.setup.tablette)&&!(typeof DEMO!=='undefined'))v14Set('tablette');}catch(e){}return f.apply(this,arguments);};}
// Réglages ouverts par le patron = il a vu son resto (on ne coche pas pour lui : bouton « C'est fait »)

/* ---------- 2. l'accueil rangé selon les 4 points ---------- */
const V14_PROMISE={equipe:'Masse salariale',cuisine:'Marchandise',hygiene:'Paperasse',chiffres:'Le resto dans la poche',service:'Le resto dans la poche'};
const V14_ORDER=['equipe','cuisine','hygiene','chiffres','service'];
{const f=zoneCardsHTML;zoneCardsHTML=function(){
  const h=f.apply(this,arguments);if(!h||effRole()==='staff')return h;
  const cards=h.match(/<button class="zone [\s\S]*?<\/button>/g)||[];if(!cards.length)return h;
  const id=c=>(c.match(/data-a="([^"]+)"/)||[])[1];
  cards.sort((a,b)=>{const i=V14_ORDER.indexOf(id(a)),j=V14_ORDER.indexOf(id(b));return (i<0?99:i)-(j<0?99:j);});
  return `<div class="zones v14-zones">${cards.map(c=>{const p=V14_PROMISE[id(c)];return p?c.replace('<span class="z-t">',`<span class="z-t"><em class="z-prom">${p}</em>`):c;}).join('')}</div>`;
};}
{const f=viewAccueilLive;viewAccueilLive=function(){
  const h=f.apply(this,arguments);if(effRole()==='staff')return h;
  return h.replace(/<h2 class="sec-t">Tes espaces<\/h2><\/div>/,'<h2 class="sec-t">Tes 4 points</h2><p class="v14-zh">Ton équipe, ta marchandise, ta paperasse, et le resto dans ta poche.</p></div>');
};}

/* ---------- 3. la visite guidée de la démo (5 minutes) ---------- */
const V14_TOUR=[
  {v:'accueil',t:'Aujourd’hui',d:'En ouvrant Léon, le patron voit sa journée : couverts du midi et du soir, qui travaille, et ce qu’il y a à faire. Rien à faire ? Léon le dit.'},
  {v:'planning',t:'Le planning que Léon remplit',d:'Léon remplit la semaine avec les couverts prévus, les contrats et les règles HCR (repos, heures sup). Il explique chaque choix, le patron valide.'},
  {v:'pointage',t:'La badgeuse',d:'Chacun badge sur la tablette du resto avec son code. Ici : prévu, badgé, payé. Les heures du mois partent au comptable.'},
  {v:'stocks',tab:'cmd',t:'Les commandes',d:'Une carte par fournisseur. Léon prépare la commande au colis près, montre le stock prévu chaque soir et le minimum de commande. On vérifie, on envoie.'},
  {v:'stocks',tab:'stock',t:'Où part la marchandise',d:'Pertes déclarées et écarts d’inventaire, famille par famille. La plus grosse fuite est en rouge, avec un conseil pour la stopper.'},
  {v:'recettes',t:'Les fiches techniques',d:'Le coût de chaque plat au centime. Une hausse de prix repérée à la réception ? Léon montre les plats touchés et le prix conseillé.'},
  {v:'hygiene',t:'L’hygiène',d:'Relevés de températures guidés, étiquettes DLC en un clic, et un dossier prêt le jour du contrôle sanitaire.'},
  {v:'stats',t:'Les chiffres',d:'Ventes, coût matière, masse salariale, pertes et résultat estimé. Sur le téléphone, partout.'},
  {v:'accueil',end:true,t:'Et sur la tablette',d:'La tablette reste dans le resto : badger, hygiène, réception des livraisons produit par produit. Tout remonte ici.'},
];
UI.v14tour=UI.v14tour==null?null:UI.v14tour;
const v14Demo=()=>typeof DEMO!=='undefined'&&!!DEMO&&!(typeof TABLETTE!=='undefined'&&TABLETTE);
function v14TourHTML(){
  const k=UI.v14tour;if(k==null||!V14_TOUR[k])return '';const s=V14_TOUR[k];const N=V14_TOUR.length;
  return `<div class="v14-tour" role="dialog" aria-label="Visite guidée"><div class="v14-tour-h"><span>Visite guidée · ${k+1}/${N}</span><button class="icon-btn" data-act="v14-tour-x" aria-label="Fermer la visite">${ic('x','s')}</button></div>
   <b>${s.t}</b><p>${s.d}</p><div class="v14-tour-dots">${V14_TOUR.map((_,i)=>`<i class="${i===k?'on':i<k?'done':''}"></i>`).join('')}</div>
   <div class="v14-tour-a">${k>0?`<button class="btn sm" data-act="v14-tour" data-k="${k-1}">${ic('chevL','s')} Avant</button>`:'<span></span>'}${s.end?`<a class="btn sm" href="/tablette-demo" target="_blank" rel="noopener">${ic('tablet','s')} Tablette de démo</a><button class="btn sm primary" data-act="v14-tour-x">Terminer</button>`:`<button class="btn sm primary" data-act="v14-tour" data-k="${k+1}">Suivant ${ic('chevR','s')}</button>`}</div></div>`;
}
function v14TourPaint(){let el=document.getElementById('v14-tour');if(!el){el=document.createElement('div');el.id='v14-tour';document.body.appendChild(el);}el.innerHTML=v14Demo()&&U.screen==='app'?v14TourHTML():'';}
Object.assign(ACT,{
  'v14-tour'(t){const k=+t.dataset.k;const s=V14_TOUR[k];if(!s)return;UI.v14tour=k;if(s.v==='accueil')go('accueil');else goMod(s.v,s.tab||null);window.scrollTo({top:0});v14TourPaint();},
  'v14-tour-x'(){UI.v14tour=null;v14TourPaint();},
});
{const f=render;render=function(){const o=f.apply(this,arguments);try{v14TourPaint();}catch(e){}return o;};}
{const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{v14TourPaint();}catch(e){}return o;};}
{const f=viewAccueilLive;viewAccueilLive=function(){
  const h=f.apply(this,arguments);if(!v14Demo()||effRole()==='staff'||UI.v14tour!=null)return h;
  const card=`<section class="panel v14-tourc"><div class="panel-b"><span class="v14-tourc-ic">${ic('play')}</span><div><b>Visite guidée de Léon</b><p>5 minutes pour faire le tour : la journée, le planning, la badgeuse, les commandes, l’hygiène, les chiffres.</p></div><button class="btn brass" data-act="v14-tour" data-k="0">Commencer la visite</button></div></section>`;
  const i=h.indexOf('</div>',h.indexOf('class="ph hm-ph"'));const j=i<0?-1:h.indexOf('</div></div>',h.indexOf('class="ph hm-ph"'));
  return j<0?card+h:h.slice(0,j+12)+card+h.slice(j+12);
};}

/* ---------- 4. Salariés & accès : la note d'information avant de badger ---------- */
{const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{
  if(UI.view==='equipe'&&CAN().settings&&!document.querySelector('.v14-rgpd')){const ph=document.querySelector('.view .ph');
    if(ph)ph.insertAdjacentHTML('afterend',`<div class="v14-rgpd">${ic('alert','s')}<span>Avant le premier badge, chaque salarié doit recevoir la note d’information sur la badgeuse (RGPD). <a href="/info-salaries" target="_blank" rel="noopener">Voir le modèle à imprimer</a></span></div>`);}
}catch(e){}return o;};}
