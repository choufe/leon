/* =========================================================
   V10 · LISIBILITÉ
   - Accueil qui résume en 4 lignes et renvoie vers les espaces
   - Un code couleur léger par espace (Équipe, Cuisine, Hygiène, Chiffres)
   - Flèches pour replier / déplier chaque zone (Léon s'en souvient)
   - « C'est géré » sur chaque alerte : elle disparaît
   - Accueil du staff : gros boutons, mots simples
   ========================================================= */
if(!ICONS.chevD)ICONS.chevD='<path d="m5 9 7 7 7-7"/>';

/* ---------- 1. mémoire des zones repliées (par appareil) ---------- */
let FOLD={};
try{FOLD=JSON.parse(localStorage.getItem('leon.fold')||'{}')||{};}catch(e){FOLD={};}
const FOLD_CLOSED=/^(home:more|stats:(Répartition|Pertes|Équipe)|hygiene:Historique|infos:Ce qui marche|plan:foot)/;
function foldOpen(k,def){if(k in FOLD)return !!FOLD[k];return def!=null?def:!FOLD_CLOSED.test(k);}
function foldSet(k,open){FOLD[k]=open?1:0;try{localStorage.setItem('leon.fold',JSON.stringify(FOLD));}catch(e){}}
function foldKeyOf(sec){
  const h=sec.querySelector(':scope>.panel-h h2, :scope>.panel-h h3');if(!h)return null;
  const t=h.textContent.replace(/\d+([,.]\d+)?/g,'#').replace(/\s+/g,' ').trim().slice(0,60);
  return t?(UI.view||'')+':'+t:null;
}
function foldify(){
  const v=document.getElementById('view');if(!v)return;
  v.querySelectorAll('section.panel').forEach(sec=>{
    if(sec.__fold||sec.classList.contains('no-fold')||sec.classList.contains('pl-alerts')||sec.classList.contains('pl-empty'))return;
    const ph=sec.querySelector(':scope>.panel-h');if(!ph)return;
    const h=ph.querySelector('h2,h3');if(!h)return;
    const k=sec.dataset.foldKey||foldKeyOf(sec);if(!k)return;
    sec.__fold=k;sec.dataset.foldKey=k;
    const open=foldOpen(k);
    const b=document.createElement('button');b.type='button';b.className='fold-btn';b.dataset.act='fold';
    b.setAttribute('aria-expanded',String(open));b.setAttribute('aria-label',open?'Réduire':'Déplier');b.title=open?'Réduire':'Déplier';
    b.innerHTML=ic('chevD','s');h.insertBefore(b,h.firstChild);ph.classList.add('foldable');
    if(!open)sec.classList.add('folded');
  });
}
function foldToggle(sec){
  if(!sec)return;const k=sec.dataset.foldKey;if(!k)return;
  const open=sec.classList.contains('folded');
  sec.classList.toggle('folded',!open);foldSet(k,open);
  sec.querySelectorAll('.fold-btn,.more-tg').forEach(b=>{if(b.closest('[data-fold-key]')!==sec)return;b.setAttribute('aria-expanded',String(open));b.setAttribute('aria-label',open?'Réduire':'Déplier');b.title=open?'Réduire':'Déplier';});
}
document.addEventListener('click',e=>{
  const h=e.target.closest&&e.target.closest('.panel-h.foldable h2, .panel-h.foldable h3');
  if(!h||e.target.closest('button,a,input,select,label,textarea'))return;
  foldToggle(h.closest('[data-fold-key]'));
});

/* ---------- 2. code couleur par espace ---------- */
const ZONE_OF={equipe:'eq',cuisine:'cu',hygiene:'hy',chiffres:'ch'};
function zoneNow(){
  if(!S||U.screen!=='app')return 'home';
  const a=appOf(UI.view==='assembleur'?'recettes':UI.view);
  return a?ZONE_OF[a]:'home';
}
function applyZone(){try{document.body.dataset.zone=zoneNow();}catch(e){}}
function zoneEyebrow(){
  const z=zoneNow();if(z==='home')return;
  const v=document.getElementById('view');if(!v)return;
  const h=v.querySelector('.ph h1');if(!h)return;
  const p=h.previousElementSibling;if(p&&p.classList.contains('zone-eb'))return;
  const A=APPS.find(x=>x.c===z);if(!A)return;
  const d=document.createElement('div');d.className='zone-eb';d.innerHTML=`<span class="app-ic ${A.c}">${ic(A.i,'s')}</span>${esc(appLabel(A))}`;
  h.parentNode.insertBefore(d,h);
}
{const f=renderView;renderView=function(){applyZone();const r=f.apply(this,arguments);applyZone();return r;};}
{const f=render;render=function(){const r=f.apply(this,arguments);applyZone();return r;};}
{const f=mcardify;mcardify=function(){f();try{foldify();zoneEyebrow();}catch(e){}};}

/* ---------- 3. « C'est géré » : les alertes qu'on a vues disparaissent ---------- */
function isDone(k){return !!(k&&S&&S.seen&&S.seen[k]);}
function markDone(k,on){
  if(!S||!k)return;const s={...(S.seen||{})};
  if(on)s[k]=TODAY_ISO;else delete s[k];
  const lim=isoD(addDays(TODAY,-45));Object.keys(s).forEach(x=>{if(/^(al|pl):/.test(x)&&s[x]<lim)delete s[x];});
  S.seen=s;save();
}
const plKey=(w,a)=>'pl:'+wkIso(w)+':'+[a.k||'',a.emp||'',a.d!=null?a.d:'',a.t].join('|');
let planAlertsAll=null;
{const f=planAlerts;
 planAlertsAll=function(w){return f(w).map(a=>({...a,key:plKey(w,a)}));};
 planAlerts=function(w){return planAlertsAll(w).filter(a=>!isDone(a.key));};}
function alKey(a){
  const t=String(a.t||'').replace(/<[^>]*>/g,'');
  const daily=['clock','flame','truck','thermo'].includes(a.ic);
  return 'al:'+(daily?TODAY_ISO+':':'')+(a.ic||'')+':'+t.slice(0,90);
}
{const f=leonAlerts;leonAlerts=function(){
  const P0=S?planAlerts(0):[];
  return f().map(a=>{
    const p=P0.find(x=>x.t===a.t);
    const noDismiss=(a.acts||[]).some(x=>x.act==='req-ok');
    return {...a,key:p?p.key:alKey(a),noDismiss};
  }).filter(a=>!isDone(a.key));
};}
const doneBtn=k=>`<button class="btn sm done-btn" data-act="al-ok" data-k="${esc(k)}" title="Je l’ai vu, c’est géré : ce point disparaît">${ic('check','s')}<span>C’est géré</span></button>`;
function actBtn(x){return `<button class="btn ${x.primary?'primary':''} sm" data-act="${x.act}" ${x.id?`data-id="${x.id}"`:''} ${x.v?`data-v="${x.v}"`:''} ${x.t?`data-t="${x.t}"`:''} ${x.p?`data-p="${x.p}"`:''} ${x.w!=null?`data-w="${x.w}"`:''} ${x.d!=null?`data-d="${x.d}"`:''}>${x.ic?ic(x.ic,'s'):''}${esc(x.l)}</button>`;}
function todoRow(a){
  const acts=(a.acts||[]).slice(0,2).map(actBtn).join('');
  return `<div class="al t-${a.tone}"><span class="ico ${a.tone}">${ic(a.ic||'alert','s')}</span><div class="al-x"><b>${a.t}</b>${a.s?`<p>${a.s}</p>`:''}</div><div class="acts">${acts}${a.key&&!a.noDismiss?doneBtn(a.key):''}</div></div>`;
}
function alertsHTML(list){
  if(!list.length)return `<div class="empty" style="padding:20px"><p>Rien à régler pour l’instant. Léon surveille.</p></div>`;
  return `<div class="alerts">${list.map(todoRow).join('')}</div>`;
}
{const f=insCard;insCard=function(x,o){return f(x,o).replace('Vu, je m’en occupe','Vu, c’est géré');};}

/* planning : chaque point peut être marqué « c'est géré » */
function alertsPanel(A){
  const all=planAlertsAll(UI.plan.w);const done=all.filter(a=>isDone(a.key));
  const row=(a,isDoneRow)=>`<div class="al ${isDoneRow?'is-done':''}"><span class="ico ${isDoneRow?'ok':a.tone}">${ic(isDoneRow?'check':a.tone==='info'?'clock':'alert','s')}</span><div class="al-x"><b>${esc(a.t)}</b><p>${esc(a.s)}</p></div><div class="acts">${INFO[a.k]?infoBtn(a.k):''}${a.emp&&a.d!=null?`<button class="btn sm" data-act="pl-alert-go" data-emp="${a.emp}" data-d="${a.d}">Voir</button>`:''}${isDoneRow?`<button class="btn sm" data-act="al-undo" data-k="${esc(a.key)}">Remettre</button>`:doneBtn(a.key)}</div></div>`;
  const pills=['bad','warn','info'].map(t=>{const n=A.filter(a=>a.tone===t).length;return n?`<span class="pill ${t}">${n} ${t==='bad'?(n>1?'bloquants':'bloquant'):t==='warn'?'à surveiller':'info'}</span>`:'';}).join('');
  return `<section class="panel pl-alerts"><div class="panel-h"><h3>${ic('spark')} Léon a vérifié ce planning</h3><span class="row" style="gap:6px">${pills}<button class="icon-btn" data-act="pl-alerts" aria-label="Fermer">${ic('x','s')}</button></span></div>
   ${A.length?`<div class="alerts">${A.map(a=>row(a,false)).join('')}</div>`:`<div class="empty" style="padding:18px"><p>${done.length?'Tout le reste est géré.':'Repos, pauses, durées, contrats et couverture : tout est bon.'}</p></div>`}
   ${done.length?`<div class="more-row"><button class="btn ghost sm" data-act="pl-done-toggle" aria-expanded="${!!UI.plan.showDone}">${UI.plan.showDone?'Masquer':'Revoir'} ${plur(done.length,'point déjà géré','points déjà gérés')} ${ic(UI.plan.showDone?'up':'down','s')}</button></div>${UI.plan.showDone?`<div class="alerts done-list">${done.map(a=>row(a,true)).join('')}</div>`:''}`:''}</section>`;
}

/* ---------- 4. planning : moins de texte, bas de grille repliable ---------- */
{const f=planHead;planHead=function(){
  return f.apply(this,arguments).replace(/Clique une case et tape <b>11-15<\/b>, <b>soir<\/b> ou <b>cp<\/b>, puis Entrée\. Glisse un shift pour le déplacer, <kbd>Alt<\/kbd> pour le copier\. /,'Clique une case, tape <b>11-15</b> ou <b>cp</b>, puis Entrée. ');
};}
{const f=weekGrid9;weekGrid9=function(w,edit){
  let h=f(w,edit);const i=h.indexOf('<tfoot>'),j=h.indexOf('</tfoot>');if(i<0||j<0)return h;
  const open=foldOpen('plan:foot');let n=0;
  let ft=h.slice(i+7,j).replace(/<tr>/g,()=>n++===0?'<tr class="ft-main">':'<tr class="ft-more">');
  if(n>1)ft=ft.replace('<td class="ec">Heures planifiées</td>',`<td class="ec"><button class="ft-tg" data-act="pl-foot" aria-expanded="${open}" title="${open?'Réduire':'Voir couverture, masse salariale et CA'}">${ic('chevD','s')}<span>Heures planifiées</span></button>${open?'':'<small class="ft-hint">+ couverture, masse salariale, CA</small>'}</td>`);
  h=h.slice(0,i+7)+ft+h.slice(j);
  return open?h:h.replace('class="pg pg9 ','class="pg pg9 foot-closed ');
};}

/* ---------- 5. accueil : un résumé, puis les espaces ---------- */
HOME_BLOCKS.raccourcis.t='Tes espaces';
const ZONE_WORDS={equipe:'Planning, pointage, congés, paie',cuisine:'Recettes, stocks, commandes',hygiene:'Frigos, traçabilité, étiquettes',chiffres:'Ventes, stats, infos importantes'};
function keySeg(x){
  const segs=String(x.s||'').split(' · ').map(t=>t.trim()).filter(Boolean);
  if(!segs.length)return '';
  if(x.n){const m=segs.find(t=>parseInt(t,10)===x.n&&/^\d/.test(t));if(m)return m;const d=segs.find(t=>/^\d/.test(t)&&!/^\d+\/\d+/.test(t));if(d)return d;}
  return segs[0];
}
function zoneStatus(a){
  const infos=appViews(a).map(n=>({n,x:modInfo(n.v)||{}}));
  const R={bad:0,warn:1,info:2};
  const hot=infos.filter(o=>o.x.n).sort((p,q)=>(R[p.x.tone]??2)-(R[q.x.tone]??2)).slice(0,2);
  const solo=infos.length===1;
  const line=(o,tone)=>{const seg=keySeg(o.x);if(!seg)return '';return `<span class="z-l ${tone||''}">${tone?'<i class="dot"></i>':''}<span>${solo?'':`<b>${esc(navShort(o.n.v))}</b> `}${esc(seg)}</span></span>`;};
  if(hot.length)return `<span class="z-st">${hot.map(o=>line(o,o.x.tone||'info')).join('')}</span>`;
  const main=infos.find(o=>o.x.s);
  return main?`<span class="z-st">${line(main,'')}</span>`:'';
}
function zoneCardsHTML(){
  const apps=visibleApps();if(!apps.length)return '';
  const staff=effRole()==='staff';
  return `<div class="zones">${apps.map(a=>{const nb=appNb(a);
    const words=staff?appDesc(a):(a.id==='cuisine'&&typeof isSvcBiz==='function'&&isSvcBiz()?'Prestations, produits, commandes':ZONE_WORDS[a.id]||appDesc(a));
    return `<button class="zone z-${a.c}" data-act="app-go" data-a="${a.id}"><span class="z-ic">${ic(a.i)}</span><span class="z-t"><b>${esc(appLabel(a))}</b><small>${esc(words)}</small>${zoneStatus(a)}</span>${nb?`<span class="nb ${nb.tone}">${nb.n>99?'99+':nb.n}</span>`:''}<span class="z-go" aria-hidden="true">${ic('chevR','s')}</span></button>`;
  }).join('')}</div>`;
}
function todayStrip(){
  const can=CAN(),k=liveStats();const ok=v=>navItems().some(n=>n.v===v);
  const cell=(v,t,label,val,sub,tone)=>{const inner=`<small>${label}</small><b>${val}</b>${sub?`<span>${sub}</span>`:''}`;
    return ok(v)?`<button class="ts ${tone||''}" data-act="go-mod" data-v="${v}" ${t?`data-t="${t}"`:''}>${inner}</button>`:`<div class="ts ${tone||''}">${inner}</div>`;};
  const svc=typeof isSvcBiz==='function'&&isSvcBiz();
  const cells=[
    cell('service','',svc?'Encaissé aujourd’hui':'Ventes du jour',`${eur(k.caHT,0)}<i>HT</i>`,k.caPrev?'prévu '+eur(k.caPrev,0):plur(k.tickets,'ticket')),
    cell('pointage','jour','Au travail',`${k.present}<i>/ ${k.planned}</i>`,k.late?plur(k.late,'retard'):(EMP.length?'personne en retard':'équipe à créer'),k.late?'bad':''),
  ];
  if(can.salaries)cells.push(cell('pointage','jour','Masse salariale',k.caHT?pc(k.msr,0):eur(k.ms,0),k.caHT?eur(k.ms,0)+' d’heures':dur(k.msMin)+' pointées',k.caHT&&k.msr>0.36?'warn':''));
  if(can.costs)cells.push(cell('recettes','analyse',svc?'Coût produits':'Coût matière',k.caHT?pc(k.fc,0):'—','objectif '+pc(S.target,0),k.caHT&&k.fcTone==='bad'?'warn':''));
  return `<div class="tstrip">${cells.join('')}</div>`;
}
function todoItems(){
  const L=leonAlerts().slice();const r=effRole();
  if((r==='admin'||r==='patron')&&modOn('infos')){
    try{insVisible().filter(x=>x.tone==='bad'||x.tone==='warn').forEach(x=>L.push({tone:x.tone,ic:catIcon(x.cat),t:esc(x.t),s:x.s,acts:(x.acts||[]).slice(0,1),key:'ins:'+x.id}));}catch(e){}
  }
  const R={bad:0,info:1,brass:2,warn:3,ok:4};
  return L.map((a,i)=>({a,i})).sort((x,y)=>((R[x.a.tone]??3)-(R[y.a.tone]??3))||x.i-y.i).map(x=>x.a);
}
function todoBlock(title){
  const L=todoItems();const lim=3;const show=UI.todoAll?L:L.slice(0,lim);
  const nb=L.filter(a=>a.tone==='bad').length,nr=L.length-nb;
  const pills=`${nb?`<span class="pill bad"><span class="dot"></span>${plur(nb,'urgent')}</span>`:''}${nr?`<span class="pill">${nr} ${nb?'autre'+(nr>1?'s':''):'point'+(nr>1?'s':'')}</span>`:''}`;
  const more=L.length>lim?`<div class="more-row"><button class="btn ghost sm" data-act="todo-more" aria-expanded="${!!UI.todoAll}">${UI.todoAll?'Réduire':'Voir les '+(L.length-lim)+' autres'} ${ic(UI.todoAll?'up':'down','s')}</button></div>`:'';
  const body=L.length?`<div class="alerts">${show.map(todoRow).join('')}</div>${more}`:`<div class="empty todo-ok">${ic('check')}<p>Rien à régler pour l’instant. Léon surveille.</p></div>`;
  return `<section class="panel todo" data-fold-key="home:todo"><div class="panel-h"><h2>${ic('spark')} ${esc(title||'À regarder')}</h2><span class="row wrap" style="gap:6px">${pills}</span></div>${body}</section>`;
}
function annoncesBlock(title){
  const can=CAN();const A=(S.annonces||[]).map((a,i)=>({a,i})).reverse();
  const show=UI.annAll?A:A.slice(0,2);
  const right=can.board?`<button class="btn ghost sm" data-act="annonce-new">${ic('plus','s')} Poster</button>`:'';
  const body=A.length?show.map(({a,i})=>`<div class="note"><small>${esc(a.from)} · ${esc(a.at)}${can.board?` · <button class="btn xs ghost" data-act="annonce-del" data-i="${i}">retirer</button>`:''}</small>${esc(a.m)}</div>`).join('')+(A.length>2?`<div class="more-row"><button class="btn ghost sm" data-act="ann-more">${UI.annAll?'Réduire':'Voir les '+(A.length-2)+' autres'} ${ic(UI.annAll?'up':'down','s')}</button></div>`:'')
    :'<div class="empty" style="padding:18px">Aucune info pour l’équipe.</div>';
  return `<section class="panel" data-fold-key="${UI.view}:annonces"><div class="panel-h"><h2>${ic('list')} ${esc(title)}</h2>${right}</div>${body}</section>`;
}
const STAFF_L={planning:'Mon planning',conges:'Mes congés',pointage:'Mes heures',service:'La carte',hygiene:'Hygiène'};
function staffHome(){
  const e=U.empId&&empById(U.empId);const layout=getLayout('staff');const hid=k=>layout.some(b=>b.k===k&&b.hide);
  if(!e)return `<div class="ph hm-ph"><div><h1>Salut</h1><p class="sub">${esc(S.nom)} · ${svcLabel()}</p></div></div>${zoneCardsHTML()}`;
  const svc=typeof isSvcBiz==='function'&&isSvcBiz();
  const ORD=['planning','pointage','conges','service','recettes','hygiene'];
  const items=navItems().filter(n=>n.v!=='accueil'&&n.v!=='reglages').sort((a,b)=>(ORD.indexOf(a.v)+99)%99-(ORD.indexOf(b.v)+99)%99);
  const tiles=items.map(n=>{const a=appOf(n.v);const c=a?appById(a).c:'';const x=modInfo(n.v)||{};
    const lab=n.v==='service'&&svc?navShort(n.v):(STAFF_L[n.v]||navShort(n.v));
    return `<button class="stile z-${c}" data-act="nav" data-v="${n.v}"><span class="z-ic">${ic(n.i)}</span><span class="st-t"><b>${esc(lab)}</b>${x.s?`<small>${esc(x.s)}</small>`:''}</span>${nbHTML(x)}</button>`;}).join('');
  const k=liveStats();
  const carte=!hid('carte')&&(k.off.length||k.low.length)?carteBlock(svc?'Pas disponible':'Épuisé ou presque'):'';
  const week=hid('semaine')?'':staffWeekBlock('Ma semaine');
  const chk=hid('checklist')||!(CHECKLISTS[e.poste]||[]).length?'':checklistBlock('Checklist');
  return `<div class="ph hm-ph"><div><h1>Salut ${esc(e.prenom)}</h1><p class="sub">${esc(e.titre||'')}${e.titre?' · ':''}${svcLabel()}</p></div></div>
   ${hid('pointage')?'':myPointCard(e.id)}
   <div class="stiles">${tiles}</div>
   ${carte}
   ${week||chk?`<div class="grid2 st-grid">${week}${chk}</div>`:''}
   ${hid('annonces')?'':annoncesBlock('Infos de l’équipe')}`;
}
function viewAccueilLive(){
  const r=effRole();
  if(r==='staff')return staffHome();
  const m=me();const layout=getLayout(r);
  const hid=k=>layout.some(b=>b.k===k&&b.hide);
  const title=k=>{const b=layout.find(x=>x.k===k);return (b&&b.t)||HOME_BLOCKS[k].t;};
  const head=`<div class="ph hm-ph"><div><h1>${r==='admin'?esc(S.nom):'Bonjour '+esc(m.prenom)}</h1><p class="sub">${r==='admin'?'Tu y es en créateur · ':esc(S.nom)+' · '}${svcLabel()}</p></div>${U.role==='admin'?`<div class="acts"><button class="btn sm" data-act="pz-open">${ic('edit','s')} Personnaliser</button></div>`:''}</div>`;
  const can=CAN();
  const setup=(can.settings||can.board)&&!hid('setup')?setupCard():'';
  const zones=hid('raccourcis')?'':`<div class="zones-h"><h2 class="sec-t">${esc(title('raccourcis')==='Tes applis'||title('raccourcis')==='Accès rapide'?'Tes espaces':title('raccourcis'))}</h2></div>${zoneCardsHTML()}`;
  const MORE=['topflop','commandes','carte','presence','ventes'];
  const more=layout.filter(b=>MORE.includes(b.k)&&!b.hide).map(b=>{const h=blockHTML(b);return h?`<div class="hb ${HOME_BLOCKS[b.k].full?'full':''}">${h}</div>`:'';}).join('');
  const mOpen=foldOpen('home:more');
  const moreSec=more?`<section class="more-home ${mOpen?'':'folded'}" data-fold-key="home:more"><button class="more-tg" data-act="fold" aria-expanded="${mOpen}"><span class="fold-ic">${ic('chevD','s')}</span><span><b>Plus de détails</b><small>Top 10 / Flop 10, commandes, qui est là, ventes du jour</small></span></button><div class="home-grid">${more}</div></section>`:'';
  return head+setup+(hid('kpis')?'':todayStrip())+zones+(hid('alerts')?'':todoBlock(title('alerts')==='Léon a repéré'?'À regarder':title('alerts')))+(hid('annonces')?'':annoncesBlock(title('annonces')))+moreSec;
}

/* ---------- 6. actions ---------- */
function toastAct(msg,icn,btn){
  const box=$('#toasts');if(!box)return;while(box.children.length>=2)box.firstElementChild.remove();
  const t=document.createElement('div');t.className='toast has-act';t.innerHTML=ic(icn)+`<span>${msg}</span>${btn||''}`;
  box.appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';},4600);setTimeout(()=>t.remove(),5000);
}
function reRender(){if(UI.view==='planning'&&typeof planRender==='function')planRender();else renderView();}
Object.assign(ACT,{
  fold(t){foldToggle(t.closest('[data-fold-key]'));},
  'al-ok'(t){const k=t.dataset.k;if(!k)return;const id=k.startsWith('ins:')?k.slice(4):k;markDone(id,true);reRender();toastAct('C’est noté : ce point est géré','check',`<button class="t-act" data-act="al-undo" data-k="${esc(id)}">Annuler</button>`);},
  'al-undo'(t){markDone(t.dataset.k,false);reRender();toast('Remis dans la liste','refresh');},
  'todo-more'(){UI.todoAll=!UI.todoAll;renderView();},
  'ann-more'(){UI.annAll=!UI.annAll;renderView();},
  'pl-foot'(){foldSet('plan:foot',!foldOpen('plan:foot'));planRender();},
  'pl-done-toggle'(){UI.plan.showDone=!UI.plan.showDone;planRender();},
});

/* ---------- « espaces » partout dans la navigation ---------- */
{const f=sideHTML;sideHTML=function(){return f.apply(this,arguments).replace('>Tes applis<','>Tes espaces<').replace('>Autres applis<','>Autres espaces<').replace('<small>Appli</small>','<small>Espace</small>');};}
{const f=tabbarHTML;tabbarHTML=function(){return f.apply(this,arguments).replace(/<span>Applis<\/span>/g,'<span>Espaces</span>').replace('aria-label="Toutes les applis"','aria-label="Tous les espaces"');};}
{const f=menuSheet;menuSheet=function(){const r=f.apply(this,arguments);const m=document.querySelector('#modal-root .mh p')||document.querySelector('.modal .mh p');if(m&&/Tes applis Léon/.test(m.textContent))m.textContent='Tes espaces Léon, avec ce qui demande ton attention.';return r;};}

/* ---------- hygiène : le badge baisse quand on a marqué l'alerte « géré » ---------- */
{const f=modInfo;modInfo=function(v){
  const x=f(v);if(v!=='hygiene'||!x||!x.n||!S)return x;
  try{let n=x.n;extraAlerts().forEach(a=>{if(!isDone(alKey(a)))return;if(a.ic==='thermo'&&/hors norme/.test(a.t))n-=1;else if(/DLC/.test(a.t))n-=parseInt(a.t,10)||0;});return {...x,n:Math.max(0,n)};}catch(e){return x;}
};}

/* ---------- mes restaurants (créateur) : même logique, résumé puis restos ---------- */
function hubTodoBlock(){
  let all=[];try{all=netInsights().filter(x=>x.tone!=='ok');}catch(e){}
  const lim=3;const show=UI.hubAll?all:all.slice(0,lim);const nb=all.filter(x=>x.tone==='bad').length;
  const row=x=>`<div class="al t-${x.tone}"><span class="ico ${x.tone}">${ic(catIcon(x.cat),'s')}</span><div class="al-x"><small class="al-r">${esc(x.resto)} · ${esc(catLabel(x.cat))}</small><b>${esc(x.t)}</b><p>${x.s}</p></div><div class="acts"><button class="btn sm" data-act="ins-open" data-r="${x.R.id}">${ic('chevR','s')} Ouvrir</button><button class="btn sm ghost" data-act="ins-flag" data-r="${x.R.id}" data-id="${esc(x.id)}" title="Signaler au directeur">${ic('flag','s')} Signaler</button></div></div>`;
  const more=all.length>lim?`<div class="more-row"><button class="btn ghost sm" data-act="hub-more">${UI.hubAll?'Réduire':'Voir les '+(all.length-lim)+' autres'} ${ic(UI.hubAll?'up':'down','s')}</button></div>`:'';
  return `<section class="panel todo" data-fold-key="hub:todo"><div class="panel-h"><h2>${ic('spark')} À regarder dans ton réseau</h2><span class="row wrap" style="gap:6px">${nb?`<span class="pill bad"><span class="dot"></span>${plur(nb,'urgent')}</span>`:''}<button class="btn ghost sm" data-act="nav" data-v="infos-net">Tout voir ${ic('chevR','s')}</button></span></div>
   ${all.length?`<div class="alerts">${show.map(row).join('')}</div>${more}`:`<div class="empty todo-ok">${ic('check')}<p>Rien d’inquiétant dans ton réseau.</p></div>`}</section>`;
}
VIEWS.hub=function(){
  const list=restoList();
  const st=list.map(R=>({R,k:R._loaded.ventes&&R._loaded.carte?withCtx(R,liveStats):null,al:withCtx(R,()=>R._loaded.planning&&R._loaded.carte?leonAlerts().filter(a=>a.tone==='bad'||a.tone==='warn').length:0)}));
  const tot={ca:sum(st,x=>x.k?x.k.caHT:0),tk:sum(st,x=>x.k?x.k.tickets:0),cost:sum(st,x=>x.k?x.k.cost:0),ms:sum(st,x=>x.k?x.k.ms:0),pres:sum(st,x=>x.k?x.k.present:0),plan:sum(st,x=>x.k?x.k.planned:0),late:sum(st,x=>x.k?x.k.late:0)};
  const hl=hubLayout();const hid=k=>hl.some(b=>b.k===k&&b.hide);
  const name=esc((NET.config&&NET.config.adminName)||'');
  const head=`<div class="ph hm-ph"><div><h1>Salut ${name}</h1><p class="sub">${plur(list.length,'restaurant')} · vue réseau en direct</p></div><div class="acts"><button class="btn sm" data-act="hz-open">${ic('edit','s')} Organiser</button><button class="btn brass sm" data-act="resto-new">${ic('plus','s')} Ajouter un restaurant</button></div></div>`;
  const strip=hid('kpis')?'':`<div class="tstrip">
    <button class="ts" data-act="nav" data-v="stats-net"><small>Ventes du jour</small><b>${eur(tot.ca,0)}<i>HT</i></b><span>${plur(tot.tk,'ticket')}</span></button>
    <div class="ts ${tot.late?'bad':''}"><small>Au travail</small><b>${tot.pres}<i>/ ${tot.plan}</i></b><span>${tot.late?plur(tot.late,'retard'):'personne en retard'}</span></div>
    <button class="ts" data-act="nav" data-v="stats-net"><small>Masse salariale</small><b>${tot.ca?pc(tot.ms/tot.ca,0):eur(tot.ms,0)}</b><span>${eur(tot.ms,0)} d’heures pointées</span></button>
    <button class="ts" data-act="nav" data-v="stats-net"><small>Coût matière</small><b>${tot.ca?pc(tot.cost/tot.ca,0):'—'}</b><span>${eur(tot.cost,0)} d’ingrédients vendus</span></button></div>`;
  const QL=[['service','flame','Service'],['planning','calendar','Planning'],['stocks','box','Stocks']];
  const cards=st.map(({R,k,al})=>`<article class="rcard rc2"><div class="rh"><div><div class="eyebrow">${esc(R.type||'Restaurant')}${R.ville?' · '+esc(R.ville):''}</div><h3>${esc(R.nom||'…')}</h3></div>${R.caisse&&R.caisse.status==='connected'?'<span class="pill ok"><span class="dot"></span>Caisse</span>':'<span class="pill">Caisse à brancher</span>'}</div>
    ${k?`<div class="rc-sum"><span><small>Ventes</small><b>${eur(k.caHT,0)}</b></span><span><small>Au travail</small><b>${k.present}/${k.planned}</b></span><span class="${al?'warn':''}"><small>À regarder</small><b>${al}</b></span></div>
    ${k.late||k.off.length||!(R.emp||[]).length?`<div class="row wrap" style="gap:6px">${k.late?`<span class="pill bad"><span class="dot"></span>${plur(k.late,'retard')}</span>`:''}${k.off.length?`<span class="pill bad">${plur(k.off.length,'épuisé')}</span>`:''}${(R.emp||[]).length?'':'<span class="pill warn">Équipe à créer</span>'}</div>`:''}`:'<p class="faint">Chargement…</p>'}
    <button class="btn primary block" data-act="resto-enter" data-id="${R.id}">Entrer ${ic('chevR','s')}</button>
    <details class="rc-more"><summary>${ic('chevD','s')} Raccourcis, voir comme…</summary><div class="rq go">${QL.map(([v,i,l])=>`<button class="btn xs" data-act="resto-go" data-id="${R.id}" data-v="${v}">${ic(i,'s')} ${l}</button>`).join('')}</div><div class="rq"><span class="faint">Voir comme</span>${['patron','manager','staff'].map(x=>`<button class="btn xs" data-act="view-as-r" data-id="${R.id}" data-r="${x}">${ROLES[x]}</button>`).join('')}</div></details></article>`).join('');
  const restos=`<div class="zones-h"><h2 class="sec-t">Tes restaurants</h2></div><div class="hub-grid">${cards}${list.length?'':`<button class="rcard add" data-act="resto-new">${ic('plus','l')}<b>Ajouter un restaurant</b><small class="muted">Prêt en 1 minute depuis un modèle.</small></button>`}</div>`;
  const tf=()=>{const all=[];list.forEach(R=>{if(!R._loaded.carte)return;withCtx(R,()=>salesAgg(UI.tf.p).forEach(o=>all.push({...o,resto:R.nom})));});const t=topFlop(all,UI.tf.m);
    return `<section class="panel"><div class="panel-h"><h2>Top 10 / Flop 10 du réseau</h2>${tfControls()}</div><div class="panel-b"><div class="tf-grid"><div><div class="eyebrow tf-h ok">${ic('up','s')} Top ${t.top.length}</div>${tfList(t.top,UI.tf.m,false,true)}</div><div><div class="eyebrow tf-h bad">${ic('down','s')} Flop ${t.flop.length}</div>${tfList(t.flop,UI.tf.m,true,true)}</div></div></div></section>`;};
  const compte=`<section class="panel"><div class="panel-h"><h2>Mon compte créateur</h2></div><div class="panel-b"><p class="muted" style="font-size:13.5px;max-width:72ch">Ton identifiant ouvre tous les restaurants. Chaque restaurant a ses propres identifiants (dans Réglages) : c’est ce que tu donnes au directeur pour connecter la tablette du resto.</p><div class="row wrap" style="gap:8px;margin-top:12px"><button class="btn" data-act="admin-edit">${ic('lock','s')} Identifiant, mot de passe, code</button>${DEVICE&&DEVICE.admin?`<button class="btn" data-act="device-out">Déconnecter cet appareil</button>`:''}<a class="btn" href="${DEMO_URL}" target="_blank" rel="noopener">${ic('play','s')} Voir la démo</a></div></div></section>`;
  const moreParts=[hid('topflop')?'':`<div class="hb full">${tf()}</div>`,hid('compte')?'':`<div class="hb full">${compte}</div>`].join('');
  const mOpen=foldOpen('hub:more',false);
  const more=moreParts?`<section class="more-home ${mOpen?'':'folded'}" data-fold-key="hub:more"><button class="more-tg" data-act="fold" aria-expanded="${mOpen}"><span class="fold-ic">${ic('chevD','s')}</span><span><b>Plus de détails</b><small>Top 10 / Flop 10 du réseau, mon compte</small></span></button><div class="home-grid">${moreParts}</div></section>`:'';
  return head+strip+restos+`<div style="height:22px"></div>`+hubTodoBlock()+more;
};
Object.assign(ACT,{'hub-more'(){UI.hubAll=!UI.hubAll;renderView();}});
