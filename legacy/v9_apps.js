/* =========================================================
   V9 · LÉON EN MINI-APPLIS
   Équipe (le « Skello » de Léon), Cuisine & stocks (l’« Inpulse »),
   Hygiène, Chiffres. Chaque appli a son propre menu ; l’accueil
   sert de lanceur. Les données restent partagées (même restaurant).
   ========================================================= */
Object.assign(ICONS,{
 apps:'<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
 undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
 redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
 printer:'<path d="M6 9V3.5h12V9"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6.5 14h11v6.5h-11z"/>',
 chat:'<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z"/>',
 wand:'<path d="m4 20 10.5-10.5"/><path d="m12.5 7.5 2-2 4 4-2 2"/><path d="M19 2.8v2.4M20.2 4h-2.4M6 3.3v2.4M7.2 4.5H4.8M19.5 14.3v2.4M20.7 15.5h-2.4"/>',
 swap:'<path d="M7.5 4 3.5 8l4 4"/><path d="M3.5 8h14"/><path d="m16.5 20 4-4-4-4"/><path d="M20.5 16h-14"/>',
 dots:'<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
 note:'<path d="M5 4h14v10.5L13.5 20H5z"/><path d="M13.5 20v-5.5H19"/>',
 keyb:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6.5 10h.01M10.5 10h.01M14.5 10h.01M18 10h.01M7.5 14h9"/>',
 download:'<path d="M12 4v11"/><path d="m7 10.5 5 5 5-5"/><path d="M5 20h14"/>',
 therm:'<path d="M14 14.6V5a2 2 0 1 0-4 0v9.6a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
 calok:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="m9.2 15.2 2 2 3.8-3.9"/>',
 wallet:'<rect x="3" y="6" width="18" height="13" rx="2.2"/><path d="M3 10.5h18"/><path d="M15.5 15h2.5"/>',
 idcard:'<rect x="3" y="5" width="18" height="14" rx="2.2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.6 16.3c.6-1.5 1.9-2.4 3.4-2.4s2.8.9 3.4 2.4M14.5 10h4M14.5 13.5h3"/>',
 hand:'<path d="M8 12.5V6a1.5 1.5 0 0 1 3 0v5"/><path d="M11 10.5V4.8a1.5 1.5 0 0 1 3 0v5.7"/><path d="M14 10.5V6.3a1.5 1.5 0 0 1 3 0v7.2c0 4-2.6 7-6.5 7-2.2 0-3.8-1-5-2.8l-2.2-3.4a1.4 1.4 0 0 1 2.2-1.7L8 14.4"/>',
 bell:'<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
 moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
});
if(!ICONS.chevR)ICONS.chevR='<path d="m9 5 7 7-7 7"/>';
if(!ICONS.chevD)ICONS.chevD='<path d="m5 9 7 7 7-7"/>';

const APPS=[
 {id:'equipe',l:'Équipe',i:'users',d:'Planning, pointage, congés, paie',views:['planning','pointage','conges','equipe','paie'],c:'eq'},
 {id:'cuisine',l:'Cuisine & stocks',i:'box',d:'Fiches techniques, stocks, commandes, pertes',views:['recettes','stocks'],c:'cu'},
 {id:'hygiene',l:'Hygiène',i:'therm',d:'Températures, traçabilité, étiquettes',views:['hygiene'],c:'hy'},
 {id:'chiffres',l:'Chiffres',i:'chart',d:'Service en direct, statistiques, infos importantes',views:['stats','infos','service'],c:'ch'},
];
const appById=id=>APPS.find(a=>a.id===id);
function appLabel(a){if(a.id==='cuisine'&&typeof isSvcBiz==='function'&&isSvcBiz())return 'Prestations & stocks';return a.l;}
function appDesc(a){
  const staff=effRole()==='staff';
  if(a.id==='equipe')return staff?'Mon planning, pointage, mes congés':a.d;
  if(a.id==='cuisine'&&typeof isSvcBiz==='function'&&isSvcBiz())return 'Prestations, produits, commandes';
  if(a.id==='cuisine'&&staff)return 'Fiches techniques et allergènes';
  if(a.id==='chiffres'&&staff)return 'Service en direct';
  return a.d;
}
function appOf(v){if(v==='assembleur')return 'cuisine';const a=APPS.find(x=>x.views.includes(v));return a?a.id:null;}
function appViews(a){const items=navItems();return a.views.map(v=>items.find(n=>n.v===v)).filter(Boolean);}
const visibleApps=()=>APPS.filter(a=>appViews(a).length);
UI.appLast=UI.appLast||{};
function goApp(id){
  const a=appById(id);if(!a)return;const vs=appViews(a);if(!vs.length)return;
  const last=UI.appLast[id];const v=vs.some(n=>n.v===last)?last:vs[0].v;
  goMod(v,DEF_TAB[v]);
}
function appNb(a){
  let n=0,tone='info';
  appViews(a).forEach(x=>{const m=modInfo(x.v);if(m&&m.n){n+=m.n;if(m.tone==='bad')tone='bad';else if(m.tone==='warn'&&tone!=='bad')tone='warn';}});
  return n?{n,tone}:null;
}

/* ---------- navigation : nouveaux onglets de l'appli Équipe ---------- */
(function(){
  const ip=NAV.findIndex(n=>n.v==='pointage');
  NAV.splice(ip+1,0,
    {v:'conges',l:'Congés & absences',i:'calok',r:['admin','patron','manager','staff'],mod:'planning'},
    {v:'paie',l:'Paie',i:'wallet',r:['admin','patron'],mod:'planning'});
  const eq=NAV.find(n=>n.v==='equipe');if(eq){eq.l='Salariés & accès';eq.i='idcard';}
  const hy=NAV.find(n=>n.v==='hygiene');if(hy)hy.i='therm';
})();
Object.assign(NAV_SHORT,{conges:'Congés',paie:'Paie',equipe:'Salariés'});
{const f=navLabel;navLabel=function(v){
  const staff=S&&effRole()==='staff';
  if(staff&&v==='planning')return 'Mon planning';
  if(staff&&v==='conges')return 'Mes congés';
  if(v==='hygiene')return 'Hygiène';
  return f(v);
};}
{const f=navShort;navShort=function(v){if(S&&effRole()==='staff'&&v==='planning')return 'Planning';return f(v);};}

/* on se souvient du dernier écran de chaque appli */
{const f=goMod;goMod=function(v,t){const a=appOf(v);if(a)UI.appLast[a]=v;return f(v,t);};}

/* ---------- barre latérale : l'appli en cours, puis les autres ---------- */
{const f=sideHTML;sideHTML=function(){
  if(!S)return f();
  const m=me();const cur=UI.view==='assembleur'?'recettes':UI.view;const r=effRole();
  const items=navItems();const aid=appOf(cur);const A=aid?appById(aid):null;
  const navBtn=n=>`<button data-act="nav" data-v="${n.v}" ${cur===n.v?'aria-current="page"':''}>${ic(n.i)}<span class="nl">${esc(navLabel(n.v))}${n.mod&&!modOn(n.mod)?' <small class="off-tag">masqué</small>':''}</span>${n.v==='accueil'?'':nbHTML(modInfo(n.v))}</button>`;
  const appBtn=a=>{const nb=appNb(a);return `<button class="app-nav" data-act="app-go" data-a="${a.id}"><span class="app-ic ${a.c}">${ic(a.i,'s')}</span><span class="nl">${esc(appLabel(a))}</span>${nb?`<span class="nb ${nb.tone}">${nb.n>99?'99+':nb.n}</span>`:''}</button>`;};
  const home=items.find(n=>n.v==='accueil');
  const reg=items.find(n=>n.v==='reglages');
  let body=(home?navBtn(home):'');
  if(A){
    body+=`<div class="app-head ${A.c}"><span class="app-ic ${A.c}">${ic(A.i)}</span><span><small>Appli</small><b>${esc(appLabel(A))}</b></span></div>`;
    body+=appViews(A).map(navBtn).join('');
    const others=visibleApps().filter(a=>a.id!==A.id);
    if(others.length)body+=`<div class="nav-sep">Autres applis</div>`+others.map(appBtn).join('');
  }else{
    body+=`<div class="nav-sep">Tes applis</div>`+visibleApps().map(appBtn).join('');
  }
  const loose=items.filter(n=>n.v!=='accueil'&&n.v!=='reglages'&&!appOf(n.v));
  body+=loose.map(navBtn).join('');
  if(reg)body+=`<div class="nav-sep"></div>`+navBtn(reg);
  return `<button class="brand" data-act="home" title="Retour à l’accueil" aria-label="Léon · retour à l’accueil"><span class="wordmark">L<em>é</em>on</span><small>${esc(S.nom)}</small></button>
   ${U.role==='admin'?`<button class="hub-back" data-act="go-hub">${ic('chevL','s')} Mes restaurants</button>`:''}
   <nav class="nav" aria-label="Navigation">${body}</nav>
   <div class="side-foot">${avatar(m)}<div class="who"><b>${esc(m.prenom)} ${esc(m.nom||'')}</b><small>${ROLES[r]}${(r==='staff'||r==='manager')&&m.titre&&U.empId?' · '+esc(m.titre):''}</small></div><a class="icon-btn" href="${DEMO_URL}" target="_blank" rel="noopener" title="Voir la démo" aria-label="Voir la démo">${ic('play')}</a><button class="icon-btn" data-act="lock" title="Verrouiller" aria-label="Verrouiller">${ic('lock')}</button></div>`;
};}

/* ---------- barre du bas (mobile) : l'appli en cours + « Applis » ---------- */
{const f=tabbarHTML;tabbarHTML=function(){
  if(!S)return f();
  const cur=UI.view==='assembleur'?'recettes':UI.view;const aid=appOf(cur);
  const btn=n=>`<button data-act="nav" data-v="${n.v}" ${cur===n.v?'aria-current="page"':''}>${ic(n.i)}<span>${esc(navShort(n.v))}</span>${n.v==='accueil'?'':nbHTML(modInfo(n.v))}</button>`;
  if(aid){
    const vs=appViews(appById(aid));const pick=vs.slice(0,4);const rest=vs.slice(4);
    const restAlert=rest.some(n=>modInfo(n.v).n)||visibleApps().some(a=>a.id!==aid&&appNb(a));
    return pick.map(btn).join('')+`<button data-act="nav-menu" ${pick.some(n=>n.v===cur)?'':'aria-current="page"'} aria-label="Toutes les applis">${ic('apps')}<span>Applis</span>${restAlert?'<span class="nb dot"></span>':''}</button>`;
  }
  const home=navItems().find(n=>n.v==='accueil');
  const apps=visibleApps().slice(0,3);
  return (home?btn(home):'')+apps.map(a=>{const nb=appNb(a);return `<button data-act="app-go" data-a="${a.id}">${ic(a.i)}<span>${esc(a.id==='cuisine'?(typeof isSvcBiz==='function'&&isSvcBiz()?'Presta.':'Cuisine'):appLabel(a))}</span>${nb?`<span class="nb ${nb.tone}">${nb.n>99?'99+':nb.n}</span>`:''}</button>`;}).join('')
    +`<button data-act="nav-menu" aria-label="Toutes les applis">${ic('apps')}<span>Plus</span></button>`;
};}

/* ---------- feuille « Applis » (mobile) ---------- */
{const f=menuSheet;menuSheet=function(){
  if(!S)return f();
  const cur=UI.view==='assembleur'?'recettes':UI.view;
  const restos=U.role==='admin'?restoList().filter(R=>!S||R.id!==S.id):[];
  const tile=n=>{const x=modInfo(n.v);return `<button class="tile" data-act="sheet-go" data-v="${n.v}" ${cur===n.v?'aria-current="page"':''}><span class="ti">${ic(n.i)}</span><span class="tt"><b>${esc(navLabel(n.v))}</b><small>${esc(x.s||'')}</small></span>${nbHTML(x)}</button>`;};
  const items=navItems();
  const loose=items.filter(n=>n.v!=='accueil'&&!appOf(n.v));
  openModal(`<div class="mh"><div><h3>${esc(S.nom)}</h3><p>Tes applis Léon, avec ce qui demande ton attention.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <button class="tile" data-act="sheet-go" data-v="accueil" style="margin-bottom:12px" ${cur==='accueil'?'aria-current="page"':''}><span class="ti">${ic('home')}</span><span class="tt"><b>Accueil</b><small>Ta page de départ</small></span></button>
   ${visibleApps().map(a=>`<div class="sheet-app"><div class="eyebrow app-eb"><span class="app-ic ${a.c}">${ic(a.i,'s')}</span>${esc(appLabel(a))}</div><div class="sheet-grid">${appViews(a).map(tile).join('')}</div></div>`).join('')}
   ${loose.length?`<div class="sheet-app"><div class="eyebrow app-eb">Réglages</div><div class="sheet-grid">${loose.map(tile).join('')}</div></div>`:''}
   ${U.role==='admin'?`<div class="eyebrow" style="margin:18px 0 8px">Mes restaurants</div><div class="sheet-list"><button class="btn" data-act="sheet-go" data-v="hub">${ic('store','s')} Tous mes restaurants</button>${restos.map(R=>`<button class="btn" data-act="sheet-resto" data-id="${R.id}">${ic('chevR','s')} ${esc(R.nom)}</button>`).join('')}</div>`:''}
   <div class="mf"><button class="btn" data-act="sheet-lock">${ic('lock','s')} Verrouiller</button><button class="btn brass" data-act="sheet-chat">${ic('spark','s')} Demander à Léon</button></div>`,'sheet');
};}

/* ---------- fil d'Ariane : Accueil › Équipe › Planning ---------- */
{const f=navCrumbs;navCrumbs=function(){
  const C=f();if(!S)return C;
  const mv=UI.view==='assembleur'?'recettes':UI.view;const aid=appOf(mv);if(!aid)return C;
  const lab=navLabel(mv);const i=C.findIndex(c=>c.l===lab);
  if(i>0){const A=appById(aid);C.splice(i,0,{l:appLabel(A),go:()=>goApp(aid)});}
  return C;
};}

/* ---------- accueil : le lanceur d'applis ---------- */
HOME_BLOCKS.raccourcis.t='Tes applis';
function tilesBlock(title){
  const apps=visibleApps();if(!apps.length)return '';
  const t=(title==='Accès rapide'?'Tes applis':title);
  return `<section class="quick"><h2 class="sec-t">${esc(t)}</h2><div class="apps-grid">${apps.map(a=>{
    const vs=appViews(a);const nb=appNb(a);
    const lines=vs.slice(0,3).map(n=>{const x=modInfo(n.v);return x&&x.s?`<span class="al-l"><b>${esc(navShort(n.v))}</b> ${esc(x.s)}</span>`:'';}).filter(Boolean).join('');
    return `<button class="app-card ${a.c}" data-act="app-go" data-a="${a.id}"><span class="ac-top"><span class="app-ic ${a.c} lg">${ic(a.i)}</span><span class="ac-t"><b>${esc(appLabel(a))}</b><small>${esc(appDesc(a))}</small></span>${nb?`<span class="nb ${nb.tone}">${nb.n>99?'99+':nb.n}</span>`:''}</span>${lines?`<span class="ac-lines">${lines}</span>`:''}<span class="go" aria-hidden="true">${ic('chevR','s')}</span></button>`;
  }).join('')}</div></section>`;
}

/* ---------- état des nouveaux onglets ---------- */
{const f=modInfo;modInfo=function(v){
  if(v==='conges'||v==='paie'||v==='equipe'){if(!MI)MI={};if(!MI['v9'+v]){try{MI['v9'+v]=modInfoV9(v);}catch(e){MI['v9'+v]={s:''};}}return MI['v9'+v];}
  return f(v);
};}
function modInfoV9(v){
  const staff=effRole()==='staff';
  if(v==='equipe')return {s:plur(EMP.length,'salarié')+' · contrats, codes, accès'};
  if(v==='conges'){
    if(staff){const e=empById(U.empId);const c=cpInfo(e);const p=(S.requests||[]).filter(r=>r.emp===U.empId&&r.status==='pending').length+(S.swaps||[]).filter(r=>r.emp===U.empId&&r.status==='pending').length;return {s:(c?'Solde : '+nf(c.solde,1)+' j de congés':'Tes congés et demandes')+(p?' · '+plur(p,'demande en cours','demandes en cours'):'')};}
    const p=pendingCount();const soon=upcomingAbs(7).length;
    return {s:(p?plur(p,'demande à valider','demandes à valider'):'Aucune demande en attente')+(soon?' · '+plur(soon,'absence','absences')+' cette semaine':''),n:p,tone:'info'};
  }
  if(v==='paie'){
    const mk=monthKey(TODAY);const val=(S.paieVal||{})[mk];
    const pm=monthKey(new Date(TODAY.getFullYear(),TODAY.getMonth()-1,1));const pv=(S.paieVal||{})[pm];
    return {s:`${MOIS[TODAY.getMonth()]} en cours${val?' · validé':''}${!pv&&TODAY.getDate()<=10?' · '+MOIS[(TODAY.getMonth()+11)%12]+' à valider':''}`,n:!pv&&TODAY.getDate()<=10?1:0,tone:'warn'};
  }
  return {s:''};
}

Object.assign(ACT,{
  'app-go'(t){closeModal();goApp(t.dataset.a);},
});
