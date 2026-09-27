/* =========================================================
   V11 · CŒUR
   - Nouvel espace « Service » (plats dispo, allergènes, cahier)
   - Chiffres réservé à ceux qui ont le droit de voir le CA
   - Accès réglables par manager (interrupteurs + profils)
   - Nouvelles données : doc « ops », photos, comptage par zone
   ========================================================= */
Object.assign(ICONS,{
 book:'<path d="M5 4.5h11a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h11"/><path d="M9 8.5h5"/>',
 camera:'<path d="M4 8h3l1.6-2.5h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.3"/>',
 globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z"/>',
 broom:'<path d="M14.5 3.5 11 10"/><path d="M8.2 9.6 13.8 12.4 12 20.5H4.8z"/><path d="M7.4 14.2 6 20.3M10 15.3l-.8 5"/>',
 power:'<path d="M12 3.5v8"/><path d="M7.2 6.6a7 7 0 1 0 9.6 0"/>',
 tag:'<path d="M3.5 11.8V4.5h7.3l9.7 9.7-7.3 7.3z"/><circle cx="8" cy="9" r="1.3"/>',
 snow:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2"/>',
 shelf:'<path d="M4 4v16M20 4v16M4 9.5h16M4 15h16"/><rect x="6.5" y="5.8" width="4" height="3.7" rx=".6"/><rect x="13" y="11.3" width="4.5" height="3.7" rx=".6"/>',
 bottle:'<path d="M10 3h4v3.5l1.8 2.4c.5.7.7 1.4.7 2.3V20a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1v-8.8c0-.9.2-1.6.7-2.3L10 6.5z"/><path d="M7.5 13h9"/>',
 spray:'<path d="M8 8h5v12.5H8z"/><path d="M9.5 8V5.5h3"/><path d="M12.5 5.5h2l1.5-1.5M16 7h2M16 9.5l1.8 1"/>',
 filter:'<path d="M4 5h16l-6.2 7.4V19l-3.6-1.8v-4.8z"/>',
 warn2:'<path d="M12 4.2 21 19.5H3z"/><path d="M12 10v4.2M12 17h.01"/>',
 shield:'<path d="M12 3.5 19 6v5.6c0 4.2-2.9 7.6-7 8.9-4.1-1.3-7-4.7-7-8.9V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>',
 upload:'<path d="M12 16V4.5"/><path d="m7 9.5 5-5 5 5"/><path d="M5 20h14"/>',
 file:'<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14.5 3.5V8H19"/>',
 cart:'<path d="M3.5 4.5h2.2l2.3 11h10.5l2-8H7"/><circle cx="9.5" cy="19.3" r="1.3"/><circle cx="17" cy="19.3" r="1.3"/>',
 grid:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>',
 cook:'<path d="M7 20.5h10"/><path d="M8 20.5v-6.2c-2.4-.6-4-2.6-4-4.9 0-2.6 2.2-4.8 4.9-4.8.5 0 1 .1 1.5.2a4.4 4.4 0 0 1 3.2-1.3c1.3 0 2.4.5 3.2 1.3.5-.1 1-.2 1.5-.2 2.7 0 4.9 2.2 4.9 4.8 0 2.3-1.6 4.3-4 4.9v6.2"/>',
 fullscreen:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
 /* 14 allergènes : pictos simples, lisibles sans lire */
 a_gluten:'<path d="M12 21V8"/><path d="M12 8c-2.3-.2-3.6-1.6-3.6-4 2.3.2 3.6 1.6 3.6 4zM12 8c2.3-.2 3.6-1.6 3.6-4-2.3.2-3.6 1.6-3.6 4z"/><path d="M12 13c-2.3-.2-3.6-1.6-3.6-4 2.3.2 3.6 1.6 3.6 4zM12 13c2.3-.2 3.6-1.6 3.6-4-2.3.2-3.6 1.6-3.6 4z"/><path d="M12 18c-2.3-.2-3.6-1.6-3.6-4 2.3.2 3.6 1.6 3.6 4zM12 18c2.3-.2 3.6-1.6 3.6-4-2.3.2-3.6 1.6-3.6 4z"/>',
 a_crustaces:'<path d="M17.5 8.5c-1.8-2.7-5.8-3.5-8.9-1.7C5.4 8.7 4.3 12.6 6 15.7c1.3 2.3 3.8 3.6 6.4 3.3"/><path d="M12.4 19c1.3-1.2 1.6-3.1.6-4.6M9.5 16.8l2.7-2.3M8 13.8l3.5-.9M8 10.5l3.5.6"/><path d="M17.5 8.5 20 6M17.5 8.5l2.8 1.2"/>',
 a_oeufs:'<path d="M12 3.5c3.4 0 6 5.1 6 9.2A6 6 0 0 1 6 12.7c0-4.1 2.6-9.2 6-9.2z"/>',
 a_poissons:'<path d="M3.5 12c2.4-3.5 5.5-5.2 9.2-5.2 3.6 0 6.3 2.2 7.8 5.2-1.5 3-4.2 5.2-7.8 5.2-3.7 0-6.8-1.7-9.2-5.2z"/><path d="M3.5 12 1.8 9.2M3.5 12l-1.7 2.8"/><circle cx="16.4" cy="11" r=".9"/>',
 a_arachides:'<path d="M12 3.5c2.6 0 4.3 1.9 4.3 4.2 0 1.5-.8 2.5-.8 4.3s.8 2.8.8 4.3c0 2.3-1.7 4.2-4.3 4.2s-4.3-1.9-4.3-4.2c0-1.5.8-2.5.8-4.3s-.8-2.8-.8-4.3c0-2.3 1.7-4.2 4.3-4.2z"/><path d="M10.4 8h.01M13.4 7h.01M10.6 15.6h.01M13.5 16.8h.01"/>',
 a_soja:'<path d="M6 19c-1-4.5 1.5-10.5 7-13.5 3-1.6 5-.9 5.3.8.4 2-1.6 3.4-3.2 5.6-1.8 2.4-2.5 5.4-5.6 7.3-1.4.8-3.1.8-3.5-.2z"/><circle cx="14" cy="8.6" r="1.2"/><circle cx="11.4" cy="12.4" r="1.2"/><circle cx="8.8" cy="16" r="1.2"/>',
 a_lait:'<path d="M9 3.5h6v2.6l2 3.1V20a.8.8 0 0 1-.8.8H7.8A.8.8 0 0 1 7 20V9.2l2-3.1z"/><path d="M7 12.5h10"/>',
 a_fruits_coque:'<path d="M5 10.5c0-3.4 3.1-6 7-6s7 2.6 7 6z"/><path d="M5.8 10.5c.4 4.8 3 8.6 6.2 9.5 3.2-.9 5.8-4.7 6.2-9.5"/><path d="M12 4.5v-1"/>',
 a_celeri:'<path d="M9 21c-.6-4-.6-8 0-12M12 21V8M15 21c.6-4 .6-8 0-12"/><path d="M12 8c-1.6-2.4-4.2-3.4-6.5-3 .3 2.4 2.4 4 5 4.3M12 8c1.6-2.4 4.2-3.4 6.5-3-.3 2.4-2.4 4-5 4.3"/>',
 a_moutarde:'<path d="M8 8.5h8l-.8 12H8.8z"/><path d="M9.5 8.5V6.3h5v2.2"/><path d="M12 6.3V3.5"/><path d="M9.2 13.5h5.6"/>',
 a_sesame:'<path d="M8 5.5c1.3 0 2 1.4 2 2.8s-.7 2.7-2 2.7-2-1.3-2-2.7.7-2.8 2-2.8zM16 5.5c1.3 0 2 1.4 2 2.8s-.7 2.7-2 2.7-2-1.3-2-2.7.7-2.8 2-2.8zM12 12.5c1.3 0 2 1.4 2 2.8s-.7 2.7-2 2.7-2-1.3-2-2.7.7-2.8 2-2.8z"/>',
 a_sulfites:'<path d="M7.5 3.5h9c0 4.4-1.5 7.5-4.5 7.9-3-.4-4.5-3.5-4.5-7.9z"/><path d="M12 11.4v8.1M8.5 20.5h7"/><path d="M8 7h8"/>',
 a_lupin:'<path d="M12 21V11"/><circle cx="12" cy="5.3" r="1.6"/><circle cx="9.3" cy="8.1" r="1.6"/><circle cx="14.7" cy="8.1" r="1.6"/><circle cx="12" cy="10.2" r="1.4"/><path d="M12 17c-2-.3-3.4-1.5-4-3.4 2 .3 3.4 1.5 4 3.4zM12 17c2-.3 3.4-1.5 4-3.4-2 .3-3.4 1.5-4 3.4z"/>',
 a_mollusques:'<path d="M12 20.5 4.2 11.3C4 6.8 7.5 3.5 12 3.5s8 3.3 7.8 7.8z"/><path d="M12 20.5 9 5M12 20.5l3-15.5M12 20.5V3.5M12 20.5 6 7.4M12 20.5l6-13.1"/>',
});

/* ---------- données : doc « ops », photos, comptages ---------- */
const d45=()=>isoD(addDays(TODAY,-45));
DOCS.ops={p:id=>`restos/${id}/data/ops`,
  out:R=>{
    const lim21=isoD(addDays(TODAY,-21)),lim30=isoD(addDays(TODAY,-30)),lim90=isoD(addDays(TODAY,-90));
    const hk={};Object.keys(R.hoursOk||{}).filter(k=>k>=lim30).forEach(k=>hk[k]=R.hoursOk[k]);
    const td={};Object.keys(R.taskDone||{}).filter(k=>k>=lim90).forEach(k=>td[k]=R.taskDone[k]);
    return {liaison:(R.liaison||[]).filter(x=>x.date>=lim21).slice(-220),hoursOk:hk,priceLog:(R.priceLog||[]).filter(x=>x.date>=lim90).slice(-120),tasks:R.tasks||null,taskDone:td,fcst:R.fcst||null};
  },
  in:(R,d)=>{R.liaison=d.liaison||[];R.hoursOk=d.hoursOk||{};R.priceLog=d.priceLog||[];R.tasks=d.tasks||null;R.taskDone=d.taskDone||{};R.fcst=d.fcst||null;}};
{const f=blankResto;blankResto=function(id){const R=f(id);Object.assign(R,{liaison:[],hoursOk:{},priceLog:[],tasks:null,taskDone:{},fcst:null,photos:{},invZones:{}});return R;};}
function ensureV11(R){
  if(!R)return;
  ['liaison','priceLog'].forEach(k=>{if(!Array.isArray(R[k]))R[k]=[];});
  ['hoursOk','taskDone','photos','invZones'].forEach(k=>{if(!R[k]||typeof R[k]!=='object')R[k]={};});
}
/* un abonnement à une collection (photos, comptages), comme les pointages */
function subColl(path,cb){
  if(STORE.mode==='db'){
    try{return STORE.db.collection(path).onSnapshot(q=>cb(q.docs.filter(d=>!d.metadata||!d.metadata.hasPendingWrites).map(d=>d.data())),e=>onStoreErr(e));}catch(e){onStoreErr(e);return ()=>{};}
  }
  if(STORE.mode==='demo')return ()=>{};
  setTimeout(()=>{const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(LS+path+'/')){const v=JSON.parse(localStorage.getItem(k));if(v)out.push(v);}}}catch(e){}cb(out);},0);
  return ()=>{};
}
{const f=mountFull;mountFull=function(id){
  f(id);
  const s=SUBS[id];const R=NET.restos[id];if(!s||!R||STORE.mode==='demo')return;ensureV11(R);
  if(!s.ops)s.ops=subDoc(DOCS.ops.p(id),(d,m)=>onDoc(id,'ops',d,m));
  if(!s.ph)s.ph=subColl(`restos/${id}/photos`,list=>{const R2=NET.restos[id];if(!R2)return;const P={};list.forEach(x=>{if(x&&x.k&&x.d)P[x.k]=x.d;});Object.keys(R2.photos||{}).forEach(k=>{if(PH_PENDING[id+'/'+k])P[k]=R2.photos[k];});R2.photos=P;scheduleRender();});
  if(!s.inv)s.inv=subColl(`restos/${id}/inv`,list=>{const R2=NET.restos[id];if(!R2)return;const Z={};list.forEach(x=>{if(x&&x.zone&&!pendingW(`restos/${id}/inv/${x.zone}`))Z[x.zone]=x;});Object.keys(R2.invZones||{}).forEach(z=>{if(pendingW(`restos/${id}/inv/${z}`))Z[z]=R2.invZones[z];});R2.invZones=Z;scheduleRender();});
};}
const PH_PENDING={};

/* ---------- photos (salariés, plats) : petites images compressées ---------- */
function imgToDataUrl(file,max,square,q){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file);const img=new Image();
    img.onload=()=>{
      let sw=img.naturalWidth,sh=img.naturalHeight,sx=0,sy=0;
      if(square){const m=Math.min(sw,sh);sx=(sw-m)/2;sy=(sh-m)/2;sw=sh=m;}
      const s=Math.min(1,max/Math.max(sw,sh));const c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(sw*s));c.height=Math.max(1,Math.round(sh*s));
      const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,sx,sy,sw,sh,0,0,c.width,c.height);
      URL.revokeObjectURL(url);
      let d=c.toDataURL('image/jpeg',q||0.74);
      if(d.length>190000)d=c.toDataURL('image/jpeg',0.5);
      res(d);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('image'));};
    img.src=url;
  });
}
const photoOf=k=>(S&&S.photos&&S.photos[k])||null;
function photoSet(k,d){
  if(!S)return;ensureV11(S);const id=S.id;
  if(d)S.photos[k]=d;else delete S.photos[k];
  if(STORE.mode==='demo')return;
  const path=`restos/${id}/photos/${k}`;PH_PENDING[id+'/'+k]=1;
  (d?storeSet(path,{k,d,at:Date.now()}):storeDel(path)).catch(e=>onStoreErr(e)).finally(()=>{setTimeout(()=>{delete PH_PENDING[id+'/'+k];},1500);});
}
function photoPick(k,o){
  o=o||{};
  const inp=document.createElement('input');inp.type='file';inp.accept='image/*';if(o.capture)inp.setAttribute('capture',o.capture);
  inp.style.display='none';document.body.appendChild(inp);
  inp.onchange=async()=>{
    const f=inp.files&&inp.files[0];inp.remove();if(!f)return;
    try{const d=await imgToDataUrl(f,o.max||480,!!o.square,o.q);photoSet(k,d);save();closeModal();if(U.screen==='app')renderView();else render();toast(o.msg||'Photo ajoutée','camera');}
    catch(e){toast('Impossible de lire cette image','alert');}
  };
  inp.click();
}
{const f=avatar;avatar=(p,cls='')=>{
  const ph=p&&p.id&&S&&S.photos?S.photos['e_'+p.id]:null;
  return ph?`<span class="av ph ${cls}" data-poste="${p.poste}" aria-hidden="true" style="background-image:url('${ph}')"></span>`:f(p,cls);
};}
Object.assign(ACT,{
  'photo-emp'(t){photoPick('e_'+(t.dataset.id||U.empId),{square:true,max:220,capture:'user',msg:'Photo enregistrée'});},
  'photo-emp-del'(t){photoSet('e_'+t.dataset.id,null);save();closeModal();renderView();toast('Photo retirée','trash');},
  'photo-rec'(t){photoPick('r_'+t.dataset.id,{max:560,capture:'environment',msg:'Photo du plat ajoutée'});},
  'photo-rec-del'(t){photoSet('r_'+t.dataset.id,null);save();renderView();toast('Photo retirée','trash');},
});

/* ---------- accès réglables par manager ---------- */
const PERM_KEYS=[
 ['ca','Voit le chiffre d’affaires','Ventes du jour, statistiques, tickets de caisse'],
 ['costs','Voit les coûts et les marges','Prix d’achat, coût matière, marges, fiches avec les prix'],
 ['salaries','Voit les salaires','Taux horaires, masse salariale, paie'],
 ['planning','Fait le planning','Créer, modifier, publier'],
 ['team','Valide congés et échanges','Demandes de l’équipe, fiches des salariés'],
 ['hours','Valide les heures','Oublis de badge, heures sup, retards'],
 ['stocks','Commandes et inventaire','Commander, réceptionner, compter le stock'],
];
const PERM_PRESETS={
 adjoint:{l:'Adjoint de direction',p:{ca:1,costs:1,salaries:0,planning:1,team:1,hours:1,stocks:1}},
 salle:{l:'Responsable de salle',p:{ca:1,costs:0,salaries:0,planning:1,team:1,hours:1,stocks:0}},
 chef:{l:'Chef de cuisine',p:{ca:0,costs:1,salaries:0,planning:1,team:0,hours:0,stocks:1}},
};
const PERM_DEFAULT=PERM_PRESETS.adjoint.p;
function permsOf(e){const p={...PERM_DEFAULT,...((e&&e.perms)||{})};Object.keys(p).forEach(k=>p[k]=p[k]?1:0);return p;}
function presetOf(p){for(const k of Object.keys(PERM_PRESETS)){const q=PERM_PRESETS[k].p;if(PERM_KEYS.every(([x])=>!!q[x]===!!p[x]))return k;}return 'perso';}
const presetLabel=p=>{const k=presetOf(p);return k==='perso'?'Accès personnalisés':PERM_PRESETS[k].l;};
{const f=CAN;CAN=function(){
  const c=f();const r=effRole();
  if(r==='admin'||r==='patron')return {...c,ca:true,hours:true};
  if(r==='manager'){
    const e=U.empId&&!U.viewAs?EMP.find(x=>x.id===U.empId):null;const p=e?permsOf(e):PERM_DEFAULT;
    return {...c,ca:!!p.ca,costs:!!p.costs,editRecipes:!!p.costs,salaries:!!p.salaries,editPlanning:!!p.planning,team:!!p.team,hours:!!p.hours,stocks:!!p.stocks};
  }
  return {...c,ca:false,hours:false};
};}

/* ---------- nouvel espace « Service », Chiffres pour ceux qui voient le CA ---------- */
(function(){
  const is=NAV.findIndex(n=>n.v==='service');
  const sv=NAV[is];if(sv){sv.l='Plats dispo';sv.i='flame';}
  NAV.splice(is+1,0,
    {v:'allergenes',l:'Allergènes',i:'a_gluten',r:['admin','patron','manager','staff']},
    {v:'liaison',l:'Cahier de liaison',i:'book',r:['admin','patron','manager','staff']});
  ['stats','infos','paie'].forEach(v=>{const n=NAV.find(x=>x.v===v);if(n&&!n.r.includes('manager'))n.r.push('manager');});
  const svApp={id:'service',l:'Service',i:'flame',d:'Plats dispo, allergènes, cahier de liaison',views:['service','allergenes','liaison'],c:'sv'};
  const ie=APPS.findIndex(a=>a.id==='equipe');APPS.splice(ie+1,0,svApp);
  const ch=APPS.find(a=>a.id==='chiffres');if(ch){ch.views=['stats','infos'];ch.d='Statistiques, infos importantes';}
  ZONE_OF.service='sv';
  ZONE_WORDS.service='Plats dispo, allergènes, cahier de liaison';
  ZONE_WORDS.chiffres='Statistiques, infos importantes';
})();
Object.assign(NAV_SHORT,{service:'Plats dispo',allergenes:'Allergènes',liaison:'Cahier'});
{const f=navLabel;navLabel=function(v){if(v==='service'&&typeof isSvcBiz==='function'&&isSvcBiz())return 'Disponibilités';return f(v);};}
{const f=navShort;navShort=function(v){if(v==='service'&&typeof isSvcBiz==='function'&&isSvcBiz())return 'Dispo';return f(v);};}
{const f=appDesc;appDesc=function(a){
  if(a.id==='service')return isSvcBiz()?'Disponibilités, cahier de liaison':a.d;
  if(a.id==='chiffres')return a.d;
  return f(a);
};}
{const f=navItems;navItems=function(){
  const c=CAN();const svc=typeof isSvcBiz==='function'&&isSvcBiz();
  return f().filter(n=>{
    if(n.v==='stocks')return c.stocks;
    if(n.v==='stats'||n.v==='infos')return c.ca;
    if(n.v==='paie')return c.salaries;
    if(n.v==='equipe')return c.team||c.settings;
    if(n.v==='allergenes')return !svc;
    return true;
  });
};}
/* on ne reste pas sur un écran qu'on n'a plus le droit de voir */
{const f=renderView;renderView=function(){
  try{
    if(S){ensureV11(S);
      const nav=NAV.find(n=>n.v===UI.view);
      if(nav&&!nav.hub&&UI.view!=='accueil'&&!(U.role==='admin'&&!U.viewAs)&&!navItems().some(n=>n.v===UI.view))UI.view='accueil';
    }
  }catch(e){}
  return f.apply(this,arguments);
};}

/* ---------- alertes V11 : chaque module ajoute les siennes ---------- */
const V11_ALERTS=[];
{const f=leonAlerts;leonAlerts=function(){
  const A=f();if(!S)return A;ensureV11(S);
  V11_ALERTS.forEach(fn=>{try{(fn()||[]).forEach(a=>{const key=a.key||alKey(a);if(!isDone(key))A.push({...a,key});});}catch(e){console.error('alerte v11',e);}});
  return A;
};}
/* état des nouveaux écrans (tuiles, badges du menu) */
const V11_MOD={};
{const f=modInfo;modInfo=function(v){
  if(V11_MOD[v]){if(!MI)MI={};const k='v11'+v;if(!MI[k]){try{MI[k]=V11_MOD[v]();}catch(e){console.error('modInfo v11',e);MI[k]={s:''};}}return MI[k];}
  return f(v);
};}

/* ---------- petites aides partagées ---------- */
const whoKey=()=>U.empId||(U.role==='admin'?'admin':'patron');
const whoName=()=>me().prenom||'';
function segHTML(act,cur,opts,extra){return `<span class="seg" role="group">${opts.map(([k,l])=>`<button data-act="${act}" data-k="${k}" ${extra||''} aria-pressed="${cur===k}">${l}</button>`).join('')}</span>`;}
function nowTs(){return Date.now();}
function tsHM(ts){const d=new Date(ts);return pad(d.getHours())+':'+pad(d.getMinutes());}
function isoOfTs(ts){return isoD(new Date(ts));}
function svcOfMin(m){return m<(typeof svcCut==='function'?svcCut():900)?'midi':'soir';}
function printHTML(id,cls,html){
  let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;document.body.appendChild(el);}
  el.innerHTML=html;document.body.classList.add(cls);
  const done=()=>{document.body.classList.remove(cls);window.removeEventListener('afterprint',done);};
  window.addEventListener('afterprint',done);
  setTimeout(()=>{try{window.print();}catch(e){toast('Impression indisponible dans cet aperçu','alert');}setTimeout(done,1500);},60);
}
