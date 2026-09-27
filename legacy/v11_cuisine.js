/* =========================================================
   V11 · CUISINE & STOCKS
   - Fiches en mode cuisine : photo, grammages en gros, étapes
   - Inventaire au téléphone, zone par zone, à plusieurs
   - Commande conseillée selon ce qui va partir d'ici la livraison
   - Hausses de prix fournisseur : plats touchés, prix conseillé
   ========================================================= */

/* ---------- 1. fiches en mode cuisine ---------- */
UI.rec.por=UI.rec.por||'one';
function cookHTML(r,o){
  o=o||{};const can=CAN();const isPrep=r.t==='prep';const por=isPrep?1:(r.por||1);
  const one=UI.rec.por!=='all'||por===1;const k=one?1/por:1;
  const al=allergensOf(r);const ph=photoOf('r_'+r.id);
  const rows=r.comps.map(c=>({c,n:compName(c)||'?',u:compUnit(c),q:c.q*k}));
  return `<div class="ck ${o.full?'full':''}">
   <div class="ck-hero">
     <div class="ck-img ${ph?'':'ph0 t-'+r.t}" ${ph?`style="background-image:url('${ph}')"`:''}>${ph?'':ic(RTYPE[r.t]?RTYPE[r.t].ic:'plate')}${can.editRecipes?`<button class="btn sm ck-ph" data-act="photo-rec" data-id="${r.id}">${ic('camera','s')} ${ph?'Changer':'Ajouter'} la photo</button>`:''}</div>
     <div class="ck-t"><span class="pill">${ic(RTYPE[r.t]?RTYPE[r.t].ic:'plate','s')} ${esc(T(isPrep?'Préparation maison':RTYPE[r.t]?RTYPE[r.t].l:''))}</span><h1 data-noi18n>${esc(r.n)}</h1>
       <p class="sub">${r.time?r.time+' min':''}${isPrep?` · ${qtyFmt(r.yq,r.yu)}`:''}</p>
       <div class="ck-al">${al.length?al.map(a=>`<span class="alg-i hit" title="${esc(T(ALLERG[a]))}">${ic('a_'+a,'s')}<span>${esc(T(ALLERG[a]))}</span></span>`).join(''):`<span class="faint">${T('Aucun des 14 allergènes réglementaires.')}</span>`}</div>
       ${por>1?`<div class="seg ck-por"><button data-act="ck-por" data-k="one" aria-pressed="${one}">${T('1 portion')}</button><button data-act="ck-por" data-k="all" aria-pressed="${!one}">${T('Recette complète')} · ${por}</button></div>`:''}
     </div>
   </div>
   <div class="ck-grid">
     <section class="ck-sec"><h2>${T('Ingrédients')}</h2><div class="ck-ings">${rows.map(x=>`<div class="ck-ing ${x.c.k==='p'?'prep':''}" ${x.c.k==='p'?`data-act="rec-open" data-id="${x.c.id}" role="link" tabindex="0"`:''}><span data-noi18n>${esc(x.n)}</span><b class="tnum">${qtyFmt(x.q,x.u)}</b></div>`).join('')}</div></section>
     <section class="ck-sec"><h2>${T('Étapes')}</h2><ol class="ck-steps">${(r.steps||[]).filter(s=>String(s).trim()).map(s=>`<li data-tr><span data-noi18n>${esc(s)}</span>${trBtn(s)}</li>`).join('')||`<li class="faint">${T('Pas d’étapes renseignées.')}</li>`}</ol></section>
   </div></div>`;
}
{const f=recetteDetail;recetteDetail=function(r){
  const can=CAN();
  if(!can.costs){
    return `<div class="row wrap" style="justify-content:space-between;margin-bottom:10px"><button class="back" data-act="rec-back">${ic('chevL','s')} ${T('Toutes les fiches')}</button><button class="btn sm" data-act="rec-cook" data-id="${r.id}">${ic('fullscreen','s')} ${T('Plein écran')}</button></div>${cookHTML(r)}`;
  }
  let h=f(r);
  const btn=`<button class="btn" data-act="rec-cook" data-id="${r.id}">${ic('cook','s')} Mode cuisine</button>`;
  if(h.includes('<div class="acts"><button class="btn" data-act="rec-dup"'))h=h.replace('<div class="acts"><button class="btn" data-act="rec-dup"','<div class="acts">'+btn+'<button class="btn" data-act="rec-dup"');
  else h=h.replace('</p></div>','</p></div><div class="acts">'+btn+'</div>');
  const ph=photoOf('r_'+r.id);
  const phBlk=`<section class="panel rec-ph"><div class="panel-h"><h3>Photo du plat monté</h3>${can.editRecipes?`<span class="row" style="gap:6px"><button class="btn sm" data-act="photo-rec" data-id="${r.id}">${ic('camera','s')} ${ph?'Changer':'Ajouter'}</button>${ph?`<button class="btn sm ghost" data-act="photo-rec-del" data-id="${r.id}">Retirer</button>`:''}</span>`:''}</div>${ph?`<div class="rec-ph-img" style="background-image:url('${ph}')"></div>`:`<div class="empty" style="padding:18px"><p>Une photo du plat tel qu’il part en salle : c’est la référence pour toute l’équipe.</p></div>`}</section>`;
  return h.replace('<div class="stack"><section class="panel"><div class="panel-h"><h3>Allergènes</h3>','<div class="stack">'+phBlk+'<section class="panel"><div class="panel-h"><h3>Allergènes</h3>');
};}
{const f=recListHTML;recListHTML=function(){
  const can=CAN();if(can.costs)return f();
  const R=UI.rec;const q=R.q.trim().toLowerCase();
  let list=S.recipes.filter(r=>(R.cat==='all'||r.t===R.cat)&&(!q||r.n.toLowerCase().includes(q)));
  const order=[...rcats(),'prep'];list.sort((a,b)=>order.indexOf(a.t)-order.indexOf(b.t)||a.n.localeCompare(b.n,'fr'));
  if(!list.length)return `<div class="empty"><h3>Aucune fiche</h3></div>`;
  return `<div class="ck-cards">${list.map(r=>{const al=allergensOf(r);return `<button class="ck-card" data-act="rec-open" data-id="${r.id}">${recThumb(r)}<span class="ck-cn"><b data-noi18n>${esc(r.n)}</b><small>${esc(T(r.t==='prep'?'Préparation maison':RTYPE[r.t].l))}</small><span class="ck-cal">${al.slice(0,6).map(a=>`<span class="alg-i" title="${esc(T(ALLERG[a]))}">${ic('a_'+a,'s')}</span>`).join('')}</span></span></button>`;}).join('')}</div>`;
};}
function cookOpen(id){
  const r=REC(id);if(!r)return;let root=$('#cook-root');if(!root){root=document.createElement('div');root.id='cook-root';document.body.appendChild(root);}
  UI.rec.cook=id;
  root.innerHTML=`<div class="cook-ov" role="dialog" aria-label="${esc(r.n)}"><div class="cook-bar"><b>${ic('cook','s')} ${T('Mode cuisine')}</b><button class="btn" data-act="cook-close">${ic('x','s')} ${T('Fermer')}</button></div>${cookHTML(r,{full:true})}</div>`;
  i18nDom(root);document.body.classList.add('cook-on');
  try{const el=root.firstElementChild;if(el.requestFullscreen&&isMob())el.requestFullscreen().catch(()=>{});}catch(e){}
}
function cookClose(){const root=$('#cook-root');if(root)root.innerHTML='';UI.rec.cook=null;document.body.classList.remove('cook-on');try{if(document.fullscreenElement)document.exitFullscreen();}catch(e){}}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&UI.rec.cook)cookClose();});
Object.assign(ACT,{
  'rec-cook'(t){cookOpen(t.dataset.id);},
  'cook-close'(){cookClose();},
  'ck-por'(t){UI.rec.por=t.dataset.k;if(UI.rec.cook)cookOpen(UI.rec.cook);else renderView();},
});

/* ---------- 2. inventaire zone par zone ---------- */
const INV_ZONES={froid:{l:'Chambre froide & frigos',i:'snow'},congel:{l:'Congélateur',i:'snow'},sec:{l:'Réserve sèche',i:'shelf'},bar:{l:'Bar & boissons',i:'bottle'},entretien:{l:'Entretien & emballages',i:'spray'}};
function zoneOf(i){
  if(i.zone&&INV_ZONES[i.zone])return i.zone;
  if(isConso(i))return 'entretien';
  if(['viande','poisson','cremerie','legume'].includes(i.c))return 'froid';
  if(i.c==='boisson')return 'bar';
  return 'sec';
}
function invItems(z){return S.ingredients.filter(i=>stockStatus(i)&&zoneOf(i)===z).sort((a,b)=>((a.ord??999)-(b.ord??999))||a.n.localeCompare(b.n,'fr'));}
UI.inv={zone:null,arr:false,theo:false};
const invZ=z=>(S.invZones||{})[z]||{zone:z,counts:{},by:[],done:null};
function invCounted(){const c={};Object.keys(S.invZones||{}).forEach(z=>{Object.assign(c,invZ(z).counts||{});});return c;}
function invPush(z,data){S.invZones={...(S.invZones||{}),[z]:data};if(STORE.mode!=='demo')queueWrite(`restos/${S.id}/inv/${z}`,data);}
function invSetCount(z,id,q){
  const Z=clone(invZ(z));Z.counts=Z.counts||{};
  if(q===''||q==null||isNaN(+q))delete Z.counts[id];else Z.counts[id]={q:Math.max(0,+q),by:whoName(),at:Date.now()};
  Z.by=[...new Set([...(Z.by||[]),whoName()])];Z.started=Z.started||Date.now();Z.done=null;invPush(z,Z);
}
function invStep(i){return i.u==='pièce'||i.u==='botte'?1:i.u==='kg'||i.u==='L'?0.5:1;}
function invHTML(){
  const z=UI.inv.zone;const can=CAN();
  if(z&&INV_ZONES[z])return invZoneHTML(z);
  const cnt=invCounted();const all=S.ingredients.filter(i=>stockStatus(i));const n=all.filter(i=>cnt[i.id]).length;
  const started=Object.keys(S.invZones||{}).map(k=>invZ(k).started||0).filter(Boolean);
  const zones=Object.keys(INV_ZONES).map(k=>({k,items:invItems(k)})).filter(x=>x.items.length);
  const hist=(S.invHist||[]).slice().reverse();
  return `<p class="muted" style="margin:-6px 0 12px;font-size:13.5px;max-width:80ch">Compte zone par zone, dans l’ordre de tes étagères. À plusieurs en même temps : un téléphone par zone. Léon compare ensuite avec le stock théorique et chiffre l’écart. ${infoBtn('inventaire')}</p>
   <section class="panel inv-now no-fold"><div class="panel-h"><h2>${ic('list')} ${started.length?'Inventaire en cours':'Nouvel inventaire'}</h2><span class="pill ${n?'info':''}">${n}/${all.length} produits comptés</span></div><div class="panel-b">
     <div class="meter" style="margin-bottom:12px"><i style="width:${all.length?n/all.length*100:0}%"></i></div>
     <div class="inv-zones">${zones.map(({k,items})=>{const Z=invZ(k);const c=items.filter(i=>(Z.counts||{})[i.id]).length;return `<button class="inv-z ${Z.done?'done':c?'doing':''}" data-act="inv-zone" data-k="${k}"><span class="z-ic">${ic(INV_ZONES[k].i)}</span><span class="st-t"><b>${INV_ZONES[k].l}</b><small>${c}/${items.length} comptés${(Z.by||[]).length?' · '+esc(Z.by.join(', ')):''}</small></span>${Z.done?`<span class="pill ok">${ic('check','s')} Fini</span>`:`<span class="z-go">${ic('chevR','s')}</span>`}</button>`;}).join('')}</div>
     ${can.stocks?`<div class="row wrap" style="gap:8px;margin-top:14px;justify-content:flex-end">${n?`<button class="btn ghost" data-act="inv-reset">Tout effacer</button>`:''}<button class="btn primary" data-act="inv-finish" ${n?'':'disabled'}>${ic('check','s')} Terminer l’inventaire</button></div>`:''}
   </div></section>
   ${hist.length?`<h3 class="sec-t" style="margin-top:22px">Derniers inventaires</h3><section class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Par</th><th class="r">Produits</th><th class="r">Écart réel − théorique</th><th>Plus gros écarts</th></tr></thead><tbody>${hist.map(h=>`<tr><td>${frDate(h.date)}</td><td>${esc(h.by)}</td><td class="r tnum">${h.lines.length}</td><td class="r tnum" style="color:${h.ecart<0?'var(--bad)':'var(--ok)'}"><b>${eur(h.ecart)}</b></td><td class="muted" style="font-size:12.5px">${h.lines.slice().sort((a,b)=>a.val-b.val).slice(0,3).filter(l=>l.val<0).map(l=>`${esc(l.n)} ${eur(l.val)}`).join(' · ')||'—'}</td></tr>`).join('')}</tbody></table></div></section>`:''}`;
}
function invZoneHTML(z){
  const items=invItems(z);const Z=invZ(z);const C=Z.counts||{};const c=items.filter(i=>C[i.id]).length;const can=CAN();const arr=UI.inv.arr;const theo=UI.inv.theo&&can.stocks;
  const row=(i,k)=>{const v=C[i.id];const st=invStep(i);
    if(arr)return `<div class="inv-r arr"><span class="inv-n"><b>${esc(i.n)}</b><small>${unitShort(i.u)}</small></span><span class="row" style="gap:4px"><button class="icon-btn" data-act="inv-mv" data-id="${i.id}" data-d="-1" ${k===0?'disabled':''} aria-label="Monter">${ic('up','s')}</button><button class="icon-btn" data-act="inv-mv" data-id="${i.id}" data-d="1" ${k===items.length-1?'disabled':''} aria-label="Descendre">${ic('down','s')}</button><select class="inp inv-zsel" data-ch="inv-rezone" data-id="${i.id}" aria-label="Zone">${Object.keys(INV_ZONES).map(x=>`<option value="${x}" ${x===z?'selected':''}>${INV_ZONES[x].l}</option>`).join('')}</select></span></div>`;
    return `<div class="inv-r ${v?'on':''}"><span class="inv-n"><b>${esc(i.n)}</b><small>${esc(ICAT[i.c]||'')}${theo?' · théorique '+qtyFmt(i.st,i.u):''}${v?` · <span class="faint">${esc(v.by)} ${tsHM(v.at)}</span>`:''}</small></span>
      <span class="inv-ctl"><button class="btn inv-b" data-act="inv-step" data-id="${i.id}" data-d="-${st}" aria-label="Moins">−</button><input class="inv-in tnum" type="number" inputmode="decimal" min="0" step="${st}" value="${v?v.q:''}" placeholder="—" data-in="invz" data-id="${i.id}" aria-label="Quantité de ${esc(i.n)}"><span class="inv-u">${unitShort(i.u)}</span><button class="btn inv-b" data-act="inv-step" data-id="${i.id}" data-d="${st}" aria-label="Plus">+</button>${i.pack>1?`<button class="btn sm inv-pack" data-act="inv-step" data-id="${i.id}" data-d="${i.pack}">+${i.pack}</button>`:''}</span></div>`;};
  return `<div class="inv-zh"><button class="back" data-act="inv-zone" data-k="">${ic('chevL','s')} Toutes les zones</button><div class="row wrap" style="gap:6px">${can.stocks?`<button class="btn sm ${theo?'primary':''}" data-act="inv-theo">${theo?'Masquer':'Afficher'} le théorique</button>`:''}<button class="btn sm ${arr?'primary':''}" data-act="inv-arr">${ic('move','s')} ${arr?'Fini de ranger':'Ranger'}</button></div></div>
   <div class="ph" style="margin-top:6px"><div><h1>${ic(INV_ZONES[z].i)} ${INV_ZONES[z].l}</h1><p class="sub">${arr?'Mets les produits dans l’ordre de tes étagères : le prochain comptage ira plus vite.':`${c}/${items.length} comptés · compte ce que tu vois, sans regarder le théorique`}</p></div></div>
   <section class="panel no-fold"><div class="inv-list">${items.map(row).join('')||'<div class="empty" style="padding:18px">Aucun produit dans cette zone.</div>'}</div></section>
   ${arr?'':`<div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn primary" data-act="inv-zdone" data-k="${z}">${ic('check','s')} Zone terminée</button></div>`}`;
}
function invFinishModal(){
  const cnt=invCounted();const lines=S.ingredients.filter(i=>cnt[i.id]).map(i=>{const reel=cnt[i.id].q;return {i,reel,e:reel-i.st,val:(reel-i.st)*i.p};});
  const tot=sum(lines,l=>l.val);const byZ={};lines.forEach(l=>{const z=zoneOf(l.i);byZ[z]=(byZ[z]||0)+l.val;});
  const worst=lines.slice().sort((a,b)=>a.val-b.val).slice(0,5).filter(l=>l.val<-0.5);
  const missing=S.ingredients.filter(i=>stockStatus(i)&&!cnt[i.id]).length;
  openModal(`<div class="mh"><div><h3>Terminer l’inventaire</h3><p>${plur(lines.length,'produit compté','produits comptés')}${missing?` · ${missing} pas comptés (leur stock théorique ne change pas)`:''}.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <div class="kpis" style="margin-bottom:12px"><div class="kpi"><div class="l">Écart réel − théorique</div><div class="v" style="color:${tot<0?'var(--bad)':'var(--ok)'}">${eur(tot)}</div><div class="s">au prix d’achat HT</div></div></div>
   <div class="alerts">${Object.keys(byZ).map(z=>`<div class="al"><span class="ico info">${ic(INV_ZONES[z].i,'s')}</span><div class="al-x"><b>${INV_ZONES[z].l}</b></div><div class="acts"><b class="tnum" style="color:${byZ[z]<0?'var(--bad)':'inherit'}">${eur(byZ[z])}</b></div></div>`).join('')}</div>
   ${worst.length?`<h3 class="sec-t" style="margin-top:12px">Plus gros écarts</h3><div class="alerts">${worst.map(l=>`<div class="al"><div class="al-x"><b>${esc(l.i.n)}</b><p>Théorique ${qtyFmt(l.i.st,l.i.u)} · compté ${qtyFmt(l.reel,l.i.u)}</p></div><div class="acts"><b class="tnum" style="color:var(--bad)">${eur(l.val)}</b></div></div>`).join('')}</div>`:''}
   <div class="mf"><button class="btn" data-act="modal-close">Continuer à compter</button><button class="btn primary" data-act="inv-validate">${ic('check','s')} Valider l’inventaire</button></div>`,'wide');
}
function invClear(){Object.keys(S.invZones||{}).forEach(z=>{const d={zone:z,counts:{},by:[],done:null,cleared:Date.now()};invPush(z,d);});S.invZones={};}
Object.assign(ACT,{
  'inv-zone'(t){UI.inv.zone=t.dataset.k||null;UI.inv.arr=false;renderView();window.scrollTo({top:0});},
  'inv-arr'(){UI.inv.arr=!UI.inv.arr;renderView();},
  'inv-theo'(){UI.inv.theo=!UI.inv.theo;renderView();},
  'inv-step'(t){const z=UI.inv.zone;const i=ING(t.dataset.id);if(!z||!i)return;const cur=(invZ(z).counts||{})[i.id];const base=cur?cur.q:0;const d=+t.dataset.d;invSetCount(z,i.id,Math.max(0,+(base+d).toFixed(3)));renderView();},
  'inv-zdone'(t){const z=t.dataset.k;const Z=clone(invZ(z));Z.done={by:whoName(),at:Date.now()};invPush(z,Z);UI.inv.zone=null;renderView();window.scrollTo({top:0});toast(`${INV_ZONES[z].l} : fini`,'check');},
  'inv-mv'(t){const z=UI.inv.zone;const items=invItems(z);const k=items.findIndex(i=>i.id===t.dataset.id);const j=k+(+t.dataset.d);if(k<0||j<0||j>=items.length)return;const a=items.splice(k,1)[0];items.splice(j,0,a);const ord={};items.forEach((i,n)=>ord[i.id]=n);S.ingredients=S.ingredients.map(i=>ord[i.id]!=null?{...i,ord:ord[i.id],zone:zoneOf(i)}:i);save();renderView();},
  'inv-reset'(){confirmBox({title:'Effacer le comptage en cours ?',text:'Toutes les quantités saisies dans les zones sont effacées.',ok:'Effacer',danger:true,onOk:()=>{invClear();save();renderView();}});},
  'inv-finish'(){invFinishModal();},
  'inv-validate'(){const cnt=invCounted();UI.stock.inv={};Object.keys(cnt).forEach(id=>UI.stock.inv[id]=String(cnt[id].q));closeModal();ACT['inv-save']();invClear();UI.inv.zone=null;renderView();},
});
IN.invz=t=>{const z=UI.inv.zone;if(!z)return;invSetCount(z,t.dataset.id,t.value===''?null:t.value);const r=t.closest('.inv-r');if(r)r.classList.toggle('on',t.value!=='');};
CH['inv-rezone']=t=>{const id=t.dataset.id;S.ingredients=S.ingredients.map(i=>i.id===id?{...i,zone:t.value,ord:999}:i);save();renderView();toast('Produit rangé dans '+INV_ZONES[t.value].l,'move');};

/* ---------- 3. commande conseillée : ce qui va partir d'ici la livraison ---------- */
function recIngUse(r,portions,acc,depth){
  const por=r.t==='prep'?(r.yq||1):(r.por||1);
  r.comps.forEach(c=>{const g=compGross(c)*portions/por;if(c.k==='i')acc[c.id]=(acc[c.id]||0)+g;else{const p=REC(c.id);if(p&&(depth||0)<3)recIngUse(p,g,acc,(depth||0)+1);}});
}
function useByWeekday(){
  return memo('useWd',()=>{
    const W=[0,1,2,3,4,5,6].map(()=>({n:0,u:{}}));
    daysBack(1,28).forEach(iso=>{const wd=(pdate(iso).getDay()+6)%7;if(isClosed(wd))return;const T0=dayTickets(iso);if(!T0.length)return;W[wd].n++;const acc=W[wd].u;
      T0.forEach(t=>(t.lines||[]).forEach(l=>{const r=REC(l.rid);if(r)recIngUse(r,l.q,acc,0);}));});
    return W.map(x=>{const o={};Object.keys(x.u).forEach(k=>o[k]=x.n?x.u[k]/x.n:0);return o;});
  });
}
function fcScale(date){try{if(typeof fcRatio==='function')return fcRatio(date);}catch(e){}return 1;}
function useOn(date,id){const wd=(date.getDay()+6)%7;if(isClosed(wd))return 0;return ((useByWeekday()[wd]||{})[id]||0)*fcScale(date);}
function nextDelivery(f,from){
  const s=supInfo(f);const delai=s.delai!=null?+s.delai:1;const J=(s.jours||[]).map(Number);
  let d=addDays(from,Math.max(0,delai));
  for(let k=0;k<14;k++){const wd=(d.getDay()+6)%7;if(!J.length||J.includes(wd))return d;d=addDays(d,1);}
  return addDays(from,delai);
}
function smartOrder(){
  const pending={};S.orders.filter(o=>o.status==='envoyee'||o.status==='brouillon').forEach(o=>o.lines.forEach(l=>{pending[l.id]=(pending[l.id]||0)+l.q;}));
  const by={};
  S.ingredients.filter(i=>!i.noStock&&i.f).forEach(i=>{
    const D=nextDelivery(i.f,TODAY);const D2=nextDelivery(i.f,addDays(D,1));
    let need=0;for(let d=new Date(TODAY);d<D2;d=addDays(d,1))need+=useOn(d,i.id);
    const safety=Math.max(i.mn||0,need*0.1);
    const have=i.st+(pending[i.id]||0);
    let q=need+safety-have;
    const low=i.st<i.mn&&!pending[i.id];
    if(q<=0.001&&low)q=(i.par||i.mn*2)-i.st;
    if(q<=0.001)return;
    const st=i.pack>1?i.pack:invStep(i);q=Math.ceil(q/st-1e-9)*st;
    if(UI.stock.oq[i.id]!=null)q=+UI.stock.oq[i.id];
    const g=by[i.f]||(by[i.f]={f:i.f,D,D2,lines:[]});g.lines.push({i,q,need,low,pend:pending[i.id]||0});
  });
  return by;
}
UI.stock.omode=UI.stock.omode||'smart';
function ordersHTML(){
  const smart=UI.stock.omode!=='seuil';
  const head=`<div class="row wrap" style="justify-content:space-between;margin-bottom:12px;gap:10px"><div>${segHTML('ord-mode',smart?'smart':'seuil',[['smart','Selon les ventes prévues'],['seuil','Sous le seuil']])}</div><button class="btn sm" data-act="ord-free">${ic('plus','s')} Commande libre</button></div>
   <p class="muted" style="font-size:13.5px;max-width:82ch;margin:-4px 0 12px">${smart?'Léon regarde ce qui va partir d’ici la livraison suivante (ventes des 4 derniers mêmes jours × fiches techniques), enlève ce que tu as en stock et ce qui est déjà commandé, puis arrondit au colis.':'Léon propose de remonter au niveau cible chaque produit passé sous son seuil.'} ${infoBtn('cmdSmart')}</p>`;
  if(!smart){const by=orderSuggestions();const sups=Object.keys(by);
    return head+(sups.length?sups.map(f=>{const lines=by[f];const tot=sum(lines,l=>l.q*l.i.p);return supBlock(f,null,null,lines.map(l=>({i:l.i,q:l.q,need:null,low:true,pend:0})),tot,'ord-make');}).join(''):`<div class="panel"><div class="empty"><h3>Rien sous le seuil</h3><p>Tous les produits sont au-dessus de leur seuil minimum.</p></div></div>`);}
  const by=smartOrder();const sups=Object.keys(by).sort((a,b)=>by[a].D-by[b].D);
  return head+(sups.length?sups.map(f=>{const g=by[f];const tot=sum(g.lines,l=>l.q*l.i.p);return supBlock(f,g.D,g.D2,g.lines,tot,'ord-make2');}).join(''):`<div class="panel"><div class="empty"><h3>Rien à commander</h3><p>Ton stock couvre les ventes prévues jusqu’aux prochaines livraisons.</p></div></div>`);
}
function supBlock(f,D,D2,lines,tot,act){
  const sup=supInfo(f);const fr=d=>longDate(d).toLowerCase();
  return `<section class="panel sup-block" data-fold-key="stocks:sup:${esc(f)}"><div class="panel-h"><h3>${ic('truck')} ${esc(f)}</h3><span class="muted tnum">${D?`livré ${frDate(isoD(D))} · couvre jusqu’au ${fr(addDays(D2,-1))} · `:''}${plur(lines.length,'produit')} · <b>${eur(tot)}</b> HT${sup.franco&&tot<+sup.franco?` · <span style="color:var(--warn)">sous le minimum de ${eur(+sup.franco,0)}</span>`:''}</span></div>
   <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Produit</th><th class="r">En stock</th>${D?`<th class="r">Va partir d’ici là</th>`:`<th class="r">Niveau cible</th>`}<th class="r">À commander</th><th class="r">Montant</th></tr></thead><tbody>${lines.map(l=>`<tr><td><b>${esc(l.i.n)}</b>${l.low?' <span class="pill warn" style="font-size:11px">sous le seuil</span>':''}${l.pend?` <small class="faint">· ${qtyFmt(l.pend,l.i.u)} déjà commandés</small>`:''}</td><td class="r tnum">${qtyFmt(l.i.st,l.i.u)}</td><td class="r tnum faint">${l.need!=null?qtyFmt(l.need,l.i.u):qtyFmt(l.i.par,l.i.u)}</td><td class="r"><input class="tinp" type="number" min="0" step="${l.i.pack>1?l.i.pack:invStep(l.i)}" value="${+l.q.toFixed(2)}" data-ch="oq" data-id="${l.i.id}" aria-label="Quantité à commander"> <span class="faint">${unitShort(l.i.u)}</span></td><td class="r tnum">${eur(l.q*l.i.p)}</td></tr>`).join('')}</tbody></table></div>
   <div class="panel-b" style="padding-top:10px;display:flex;justify-content:flex-end"><button class="btn primary sm" data-act="${act}" data-f="${esc(f)}">${ic('send','s')} Préparer la commande</button></div></section>`;
}
Object.assign(INFO,{cmdSmart:{t:'Commande conseillée',d:'Léon calcule, produit par produit, ce qui va être consommé entre aujourd’hui et la livraison d’après : les ventes des 4 derniers mêmes jours de la semaine, passées dans les fiches techniques.',f:'À commander = consommation prévue + marge de sécurité − stock − déjà commandé, arrondi au colis',r:'Plus tes fiches et ton stock sont justes, plus la commande est juste. La marge de sécurité est ton seuil mini.'}});
Object.assign(ACT,{
  'ord-mode'(t){UI.stock.omode=t.dataset.k;renderView();},
  'ord-make2'(t){const f=t.dataset.f;const g=smartOrder()[f];if(!g)return;const lines=g.lines.map(l=>({id:l.i.id,q:l.q}));const o=newOrder(f,lines);o.livraison=isoD(g.D);lines.forEach(l=>delete UI.stock.oq[l.id]);save();UI.stock.order=o.id;renderView();window.scrollTo({top:0});toast('Commande préparée : vérifie et envoie','list');},
});

/* ---------- 4. hausses de prix fournisseur ---------- */
function withPrice(ingId,p,fn){const i=ING(ingId);if(!i)return fn();const old=i.p;i.p=p;try{return fn();}finally{i.p=old;}}
function sold30(rid){try{const A=agg(daysBack(0,29));return (A.by[rid]||{}).q||0;}catch(e){return (REC(rid)||{}).sales||0;}}
function priceImpact(x){
  const recs=S.recipes.filter(r=>r.t!=='prep'&&r.pv&&usesIng(r,x.ing));
  return recs.map(r=>{const a=withPrice(x.ing,x.old,()=>metrics(r)),b=withPrice(x.ing,x.nu,()=>metrics(r));const q=sold30(r.id);return {r,a,b,q,loss:(b.cost-a.cost)*q,sp:suggestPrice(b.cost,S.target,b.tva)};}).sort((p,q)=>q.loss-p.loss);
}
function pxLatest(){const lim=isoD(addDays(TODAY,-21));const by={};(S.priceLog||[]).filter(x=>x.date>=lim).forEach(x=>{if(!by[x.ing]||by[x.ing].date<=x.date)by[x.ing]=x;});return Object.values(by).sort((a,b)=>b.date.localeCompare(a.date));}
V11_ALERTS.push(()=>{
  if(!CAN().costs)return [];
  return pxLatest().slice(0,3).map(x=>{const imp=priceImpact(x);const loss=sum(imp,y=>y.loss);const pct=(x.nu-x.old)/x.old;
    return {tone:loss>=50?'warn':'info',ic:'trendUp',t:`${esc(x.n)} : +${nf(pct*100,0)} % chez ${esc(x.f)}`,s:`${eur(x.old)} → ${eur(x.nu)} /${unitShort((ING(x.ing)||{}).u||'')}. ${imp.length?`${plur(imp.length,'plat touché','plats touchés')} · environ ${eur(loss,0)} de marge en moins par mois.`:'Aucun plat de la carte ne l’utilise.'}`,acts:[{l:'Voir les plats',act:'px-open',id:x.id,primary:true}],key:'al:px:'+x.id};});
});
function pxModal(id){
  const x=(S.priceLog||[]).find(y=>y.id===id);if(!x)return;const imp=priceImpact(x);const i=ING(x.ing);const can=CAN();const cur=i?i.p:x.nu;
  openModal(`<div class="mh"><div><h3>${ic('trendUp')} ${esc(x.n)} : ${eur(x.old)} → ${eur(x.nu)}</h3><p>Hausse de ${nf((x.nu-x.old)/x.old*100,1)} % chez ${esc(x.f)}, constatée à la réception du ${frLongDate(x.date)}.${i&&Math.abs(cur-x.nu)>0.004?` Le prix d’achat dans Léon est encore à ${eur(cur)}.`:''}</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   ${imp.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Plat</th><th class="r">Coût portion</th><th class="r">Ratio matière</th><th class="r">Vendus 30 j</th><th class="r">Marge perdue / mois</th><th class="r">Prix conseillé</th><th></th></tr></thead><tbody>${imp.map(y=>`<tr><td><b>${esc(y.r.n)}</b><br><small class="faint">${eur(y.r.pv)} à la carte</small></td><td class="r tnum">${eur(y.a.cost)} → <b>${eur(y.b.cost)}</b></td><td class="r"><span class="pill ${ratioTone(y.b.ratio)}">${pc(y.a.ratio,0)} → ${pc(y.b.ratio,0)}</span></td><td class="r tnum">${nf(y.q)}</td><td class="r tnum" style="color:var(--bad)">${eur(y.loss,0)}</td><td class="r tnum">${y.sp>y.r.pv?eur(y.sp):'<span class="faint">inchangé</span>'}</td><td class="r">${can.editRecipes&&y.sp>y.r.pv?`<button class="btn xs" data-act="px-apply" data-r="${y.r.id}" data-p="${y.sp}" data-id="${x.id}">Passer à ${eur(y.sp)}</button>`:''}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td></td><td></td><td></td><td class="r">${eur(sum(imp,y=>y.loss),0)}</td><td></td><td></td></tr></tfoot></table></div>`:'<p class="muted">Aucun plat de la carte n’utilise ce produit.</p>'}
   <p class="faint" style="font-size:12.5px;margin-top:10px">Le prix conseillé remet le plat à ton objectif de ${pc(S.target,0)}. Tu peux aussi garder le prix et revoir le grammage, ou négocier avec le fournisseur.</p>
   <div class="mf">${i&&Math.abs(cur-x.nu)>0.004&&can.editRecipes?`<button class="btn" data-act="px-ing" data-id="${x.id}">Mettre le prix d’achat à ${eur(x.nu)}</button>`:''}<span class="sp"></span><button class="btn" data-act="modal-close">Fermer</button><button class="btn primary" data-act="px-ok" data-id="${x.id}">${ic('check','s')} C’est géré</button></div>`,'wide');
}
Object.assign(ACT,{
  'px-open'(t){pxModal(t.dataset.id);},
  'px-apply'(t){const r=REC(t.dataset.r);if(!r)return;r.pv=+t.dataset.p;S.recipes=[...S.recipes];save();toast(`${esc(r.n)} passe à ${eur(r.pv)}`,'euro');pxModal(t.dataset.id);},
  'px-ing'(t){const x=(S.priceLog||[]).find(y=>y.id===t.dataset.id);const i=x&&ING(x.ing);if(!i)return;i.p=x.nu;S.ingredients=[...S.ingredients];save();toast(`Prix d’achat de ${esc(i.n)} mis à jour`,'euro');pxModal(x.id);},
  'px-ok'(t){markDone('al:px:'+t.dataset.id,true);closeModal();renderView();toast('C’est noté','check');},
});
{const f=ACT['rc-validate'];ACT['rc-validate']=function(t,e){
  const o=UI.rc&&S.orders.find(x=>x.id===UI.rc.id);if(!o)return f(t,e);
  const before={};o.lines.forEach((l,k)=>{const i=ING(l.id);const c=UI.rc.lines[k]||{};if(i)before[l.id]={p:i.p,pr:c.pr!=null&&c.pr!==''?+c.pr:null};});
  f(t,e);
  const inc=[];o.lines.forEach(l=>{const b=before[l.id];const i=ING(l.id);if(!b||!i||!(l.qr>0))return;const pr=b.pr!=null?b.pr:l.pr;if(pr>0&&b.p>0&&pr>b.p*1.05+0.001)inc.push({id:uid('px'),date:TODAY_ISO,ing:l.id,n:i.n,f:o.f,old:+b.p.toFixed(3),nu:+pr.toFixed(3)});});
  if(inc.length){S.priceLog=[...(S.priceLog||[]),...inc];save();renderView();setTimeout(()=>toastAct(`${plur(inc.length,'hausse de prix repérée','hausses de prix repérées')} : ${esc(inc.map(x=>x.n).join(', '))}`,'trendUp',`<button class="t-act" data-act="px-open" data-id="${inc[0].id}">Voir</button>`),400);}
};}
{const f=mercurialeHTML;mercurialeHTML=function(){
  const L=pxLatest();if(!L.length)return f();
  return `<section class="panel px-list" data-fold-key="recettes:px"><div class="panel-h"><h3>${ic('trendUp')} Hausses de prix récentes</h3><span class="faint" style="font-size:12.5px">repérées à la réception</span></div><div class="alerts">${L.map(x=>{const imp=priceImpact(x);return `<div class="al t-warn"><span class="ico warn">${ic('trendUp','s')}</span><div class="al-x"><b>${esc(x.n)} · +${nf((x.nu-x.old)/x.old*100,0)} %</b><p>${esc(x.f)} · ${eur(x.old)} → ${eur(x.nu)} · ${frDate(x.date)} · ${plur(imp.length,'plat touché','plats touchés')}, ${eur(sum(imp,y=>y.loss),0)} de marge en moins par mois</p></div><div class="acts"><button class="btn sm" data-act="px-open" data-id="${x.id}">Voir les plats</button></div></div>`;}).join('')}</div></section><div style="height:14px"></div>`+f();
};}
