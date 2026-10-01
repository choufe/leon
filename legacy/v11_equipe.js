/* =========================================================
   V11 · ÉQUIPE
   - Borne : on touche sa photo, on tape son code, grand écran vert
   - Photos des salariés, langue, accès du manager dans la fiche
   - Heures de la veille à valider (oublis, heures sup, retards)
   - Dossier salarié : échéances (titre de séjour, visite médicale…)
   - Accueil du staff : gros boutons, tâches, cahier, dans sa langue
   ========================================================= */

/* ---------- 1. la borne en 2 gestes ---------- */
function borneFaces(R){
  return withCtx(R,()=>{
    const now=nowMin();
    const L=EMP.filter(e=>!e.hidden).map(e=>{
      const sh=todayShifts(e.id);const st=presence(e.id);const ev=evsOn(e.id,TODAY_ISO);
      if(st.k==='present'||st.k==='pause')return {e,st,t:-1};
      const next=sh[ev.filter(x=>x.t==='in').length];
      if(next&&now>=sMin(next)-90&&now<=eMin(next))return {e,st,t:sMin(next)};
      return null;
    }).filter(Boolean).sort((a,b)=>a.t-b.t||a.e.prenom.localeCompare(b.e.prenom));
    return L.slice(0,12);
  });
}
function borneWho(R){
  const e=(R.emp||[]).find(x=>x.id===BORNE.who);if(!e){BORNE.who=null;return '';}
  return withCtx(R,()=>{
    const acts=nextActions(e.id);const sh=todayShifts(e.id);const st=presence(e.id);
    const act=BORNE.act||(acts.length===1?acts[0]:null);
    const choose=!act?`<div class="bw-acts">${acts.map(a=>`<button class="btn launch big block" data-act="borne-act" data-t="${a}">${ic(PT[a].ic)} ${T(PT[a].l)}</button>`).join('')}</div>`:'';
    const pad=act?`<div class="bw-do"><span class="pill ok">${ic(PT[act].ic,'s')} ${T(PT[act].s)}</span></div><h1>${T('Tape ton code')}</h1>${pinPadHTML()}`:'';
    return `<div class="stage"><div class="lock bw" style="width:min(460px,100%)">
      <div class="bw-av">${avatar(e,'xl')}</div>
      <div class="wordmark bw-n">${esc(e.prenom)}</div>
      <p class="sub">${sh.length?sh.map(x=>x.s+'–'+x.e).join(' · '):T('Pas de service prévu aujourd’hui')} · ${esc(T(st.l))}</p>
      ${choose}${pad}
      <div class="row" style="justify-content:center;margin-top:16px"><button class="btn demo-link" data-act="borne-back">${ic('chevL','s')} ${T('Retour')}</button></div>
      ${act&&typeof demoCodesHTML==='function'?`<div data-noi18n style="width:100%">${demoCodesHTML()}</div>`:''}
    </div></div>`;
  });
}
{const f=lockHTML;lockHTML=function(){
  const R=U.lockRid&&NET.restos[U.lockRid];
  if(!R||!R._loaded||!R._loaded.planning)return f();
  if(BORNE.who)return borneWho(R)||f();
  const h=f();const faces=borneFaces(R);
  if(!faces.length)return h;
  const sec=`<div class="bfaces"><div class="bf-h"><b>${T('Qui es-tu ?')}</b><span>${T('Touche ta photo')}</span></div><div class="bf-grid">${faces.map(({e,st})=>`<button class="bf" data-act="borne-who" data-id="${e.id}">${withCtx(R,()=>avatar(e,'xl'))}<b>${esc(e.prenom)}</b><small class="pill ${st.tone}">${st.tone?'<span class="dot"></span>':''}${esc(st.l)}</small>${st.d?`<small class="bf-d">${esc(st.d)}</small>`:''}</button>`).join('')}</div><div class="bf-or">${T('Autre personne')} : ${T('Tape ton code').toLowerCase()}</div></div>`;
  return h.replace(/<h1>Tape ton code<\/h1>\s*<p class="sub">Pour pointer ou ouvrir ton espace\.<\/p>/,sec);
};}
{const f=lock;lock=function(){BORNE.who=null;BORNE.act=null;return f.apply(this,arguments);};}
function borneMsg(empId,type,m){
  const e=empById(empId);const sh=todayShifts(empId);const ev=evsOn(empId,TODAY_ISO);
  let t='',s=[],tone='ok';
  if(type==='in'){
    t=T('Bonjour')+' '+e.prenom;
    const k=ev.filter(z=>z.t==='in').length-1;const x=sh[k];
    if(!x){s.push(T('Pas de shift prévu à cette heure : ton responsable validera ces heures.'));tone='warn';}
    else{const df=m-sMin(x);if(df>4){s.push(`${T('En retard')} : ${durShort(df)}`);tone='warn';}else s.push(T('À l’heure. Bon service !'));s.push(`${T('Tu finis à')} ${x.e}`);}
  }else if(type==='out'){
    const nx=sh.find(x=>sMin(x)>m);
    t=nx?T('Bonne pause'):T('À demain')+' '+e.prenom;
    s.push(`${dur(workedMin(ev,false))} ${T('travaillées aujourd’hui')}`);
    if(nx)s.push(`${T('Tu reprends à')} ${nx.s}`);
  }else if(type==='pause'){t=T('Bonne pause');}
  else{t=T('Bon retour');const x=sh.find(y=>eMin(y)>m);if(x)s.push(`${T('Tu finis à')} ${x.e}`);}
  return {v11:1,t,s:s.join(' · '),type,m,tone};
}
function borneDo(empId,type){
  const m=nowMin();const ev=ensureEv(empId);ev.push({t:type,m});ev.sort((a,b)=>a.m-b.m);save();
  U.badgeMsg=borneMsg(empId,type,m);LAST_ACT=Date.now();U.screen='badge';BORNE.who=null;BORNE.act=null;render();
}
{const f=badgeHTML;badgeHTML=function(){
  const msg=U.badgeMsg;if(!msg||!msg.v11)return f();
  const e=empById(U.empId);
  return `<div class="stage"><div class="lock bconf ${msg.tone}" style="width:min(480px,100%)">
    <div class="bc-check">${ic(msg.tone==='ok'?'check':'alert','l')}</div>
    <div class="bw-av">${avatar(e,'xl')}</div>
    <h1>${esc(msg.t)}</h1>
    <div class="bc-type">${T(PT[msg.type].s)} · <b class="tnum">${hhmm(msg.m)}</b></div>
    ${msg.s?`<p class="sub bc-s">${esc(msg.s)}</p>`:''}
    <div class="row" style="gap:8px;margin-top:18px;justify-content:center;flex-wrap:wrap"><button class="btn demo-link" data-act="badge-open">${ic('home','s')} ${T('Ouvrir mon espace')}</button><button class="btn launch" style="width:auto" data-act="lock">${T('Terminé')}</button></div>
  </div></div>`;
};}
{const f=pinCheck;pinCheck=function(){
  if(PIN.ctx==='lock'&&BORNE.who&&U.lockRid){
    const R=NET.restos[U.lockRid];const e=R&&(R.emp||[]).find(x=>x.id===BORNE.who);
    if(!e){BORNE.who=null;return f();}
    if(PIN.buf!==e.code)return pinFail(T('Ce n’est pas ton code.'));
    const act=BORNE.act||withCtx(R,()=>nextActions(e.id)[0]);
    PIN.buf='';PIN.ctx=null;
    U.role=e.acces==='manager'?'manager':'staff';U.empId=e.id;U.rid=R.id;U.viewAs=null;
    mountFull(R.id);S=R;syncCtx();
    borneDo(e.id,act);return;
  }
  return f();
};}
Object.assign(ACT,{
  'borne-who'(t){BORNE.who=t.dataset.id;BORNE.act=null;PIN.buf='';render();},
  'borne-act'(t){BORNE.act=t.dataset.t;PIN.buf='';render();},
  'borne-back'(){BORNE.who=null;BORNE.act=null;PIN.buf='';render();},
  'badge-go'(t){borneDo(U.empId,t.dataset.t);},
});
/* le pointage depuis son téléphone : même message, dans sa langue */
function showPointConfirm(empId,type,m,byManager){
  const msg=borneMsg(empId,type,m);const e=empById(empId);
  openModal(`<div class="confirm"><div class="big-check ${msg.tone==='ok'?'':'warn'}">${ic(msg.tone==='ok'?'check':'alert','l')}</div><div class="eyebrow">${T(PT[type].s)}${byManager?' · saisie par le responsable':''}</div><div class="tm">${hhmm(m)}</div><h3>${esc(byManager?e.prenom+' '+(e.nom||''):msg.t)}</h3>${msg.s?`<p class="muted" style="margin-top:8px">${esc(msg.s)}</p>`:''}<div class="mf" style="justify-content:center"><button class="btn primary" data-act="modal-close" autofocus>${T('OK')}</button></div></div>`,'narrow');
}

/* ---------- 2. la carte de pointage et la semaine, traduites ---------- */
function myPointCard(emp){
  const e=empById(emp);const sh=todayShifts(emp);const st=presence(emp);const acts=nextActions(emp);
  const ev=evsOn(emp,TODAY_ISO);const worked=workedMin(ev,true);
  let hint='';
  if(sh.length){const n=nowMin();const next=sh[ev.filter(x=>x.t==='in').length];if(next&&acts[0]==='in'){const df=sMin(next)-n;hint=df>0?trText(`Prise de poste dans ${durShort(df)}`)||`Prise de poste dans ${durShort(df)}`:`Prise de poste prévue à ${next.s}`;}}
  return `<section class="pcard"><div>
     <div class="eyebrow">${T('Ton service aujourd’hui')}</div>
     <h2 style="margin-top:4px">${sh.length?`${T(sh.length>1?'Coupure':'Service continu')} · ${dur(sum(sh,durMin))}`:T('Pas de service prévu')}</h2>
     <div class="shifts">${sh.map(x=>`<span class="shift" data-poste="${x.poste}"><span class="t">${x.s} – ${x.e}</span><span class="m">${T(POSTES[x.poste].l)}</span></span>`).join('')}</div>
     <div class="st"><span class="pill ${st.tone}">${st.tone?'<span class="dot"></span>':''}${st.l}${st.d?' · '+st.d:''}</span>${ev.length?`<span class="evs">${ev.map(x=>`<span class="ev ${x.t}">${x.t==='in'?'↘':x.t==='out'?'↗':'Ⅱ'} ${hhmm(x.m)}</span>`).join('')}</span>`:''}${worked?`<span>${dur(worked)} faites</span>`:''}</div>
   </div>
   <div class="pacts">${acts.map((a,i)=>`<button class="btn ${i===0?'primary':''} big block" data-act="self-point" data-t="${a}">${ic(PT[a].ic)} ${T(PT[a].l)}</button>`).join('')}<p class="faint" style="font-size:12.5px;text-align:center;display:flex;gap:6px;justify-content:center;align-items:center">${hint||T('Tu confirmes avec ton code')} ${infoBtn('pointage')}</p></div>
  </section>`;
}
function staffWeekBlock(title){
  const e=empById(U.empId);const pub=!!S.published['0'];const tot=empWeekMin(e.id,0);
  return panelBlock(T(title),`<span class="muted tnum" style="font-size:13px">${dur(tot)} / ${e.contrat}h</span>`,pub?`<div class="week-mini">${[0,1,2,3,4,5,6].map(d=>{const sh=empShifts(e.id,0,d);const ab=absOf(e.id,0,d);const dt=dateAt(0,d);return `<div class="wm ${d===TIDX?'today':''}"><span class="d">${T(JC[d])} ${dt.getDate()}</span><span class="s">${isClosed(d)?`<span class="faint">${T('Fermé')}</span>`:ab?`<span class="pill">${T(ABS[ab.type])}</span>`:sh.length?sh.map(x=>`<span class="shift" data-poste="${x.poste}"><span class="t">${x.s}–${x.e}</span></span>`).join(''):`<span class="faint">${T('Repos')}</span>`}</span><span class="faint tnum">${sh.length?dur(sum(sh,durMin)):''}</span></div>`;}).join('')}</div>`:`<div class="empty">${T('Planning pas encore publié.')}</div>`);
}

/* ---------- 3. l'accueil du staff ---------- */
const STAFF_ORD=['planning','pointage','conges','service','allergenes','liaison','recettes','hygiene'];
const STAFF_L2={planning:'Mon planning',pointage:'Pointage',conges:'Mes congés',service:'Plats dispo',allergenes:'Allergènes',liaison:'Cahier',recettes:'Fiches',hygiene:'Hygiène'};
function staffHome(){
  const e=U.empId&&empById(U.empId);const layout=getLayout('staff');const hid=k=>layout.some(b=>b.k===k&&b.hide);
  if(!e)return `<div class="ph hm-ph"><div><h1>Salut</h1><p class="sub">${esc(S.nom)} · ${svcLabel()}</p></div></div>${zoneCardsHTML()}`;
  const svc=isSvcBiz();
  const items=navItems().filter(n=>STAFF_ORD.includes(n.v)).sort((a,b)=>STAFF_ORD.indexOf(a.v)-STAFF_ORD.indexOf(b.v));
  const tiles=items.map(n=>{const a=appOf(n.v);const c=a?appById(a).c:'';const x=modInfo(n.v)||{};
    const lab=n.v==='service'&&svc?'Disponibilités':n.v==='recettes'&&svc?'Prestations':STAFF_L2[n.v]||navShort(n.v);
    return `<button class="stile z-${c}" data-act="nav" data-v="${n.v}"><span class="z-ic">${ic(n.i)}</span><span class="st-t"><b>${esc(T(lab))}</b>${LANG==='fr'&&x.s?`<small>${esc(x.s)}</small>`:''}</span>${nbHTML(x)}</button>`;}).join('');
  const k=liveStats();
  const carte=!hid('carte')&&(k.off.length||k.low.length)?carteBlock(svc?'Pas disponible':T('Épuisé ou presque')):'';
  const week=hid('semaine')?'':staffWeekBlock('Ma semaine');
  const tasks=typeof tasksBlock==='function'?tasksBlock(e):'';
  const hasPh=!!photoOf('e_'+e.id);
  const head=`<div class="ph hm-ph"><div><h1>${esc(T('Bonjour'))} ${esc(e.prenom)}</h1><p class="sub">${esc(e.titre?T(e.titre):'')}${e.titre?' · ':''}${svcLabel()}</p></div><div class="acts"><button class="btn sm lang-btn" data-act="lang-open" title="${T('Langue')}">${ic('globe','s')} ${LANG_SHORT[LANG]||'FR'}</button>${hasPh?'':`<button class="btn sm" data-act="photo-emp">${ic('camera','s')} ${T('Ajouter ma photo')}</button>`}</div></div>`;
  return `${head}
   ${hid('pointage')?'':myPointCard(e.id)}
   <div class="stiles">${tiles}</div>
   ${tasks}
   ${carte}
   ${hid('annonces')?'':annoncesBlock('Cahier de liaison')}
   ${week}`;
}

/* ---------- 4. la fiche salarié : photo, langue, accès, échéances ---------- */
const DOC_FIELDS=[
 ['sejour','Titre de séjour / autorisation de travail : valable jusqu’au',60,'Prépare le renouvellement avec lui avant cette date.'],
 ['visite','Prochaine visite médicale',30,'À programmer avec la médecine du travail.'],
 ['essai','Fin de la période d’essai',15,'Décide avant cette date : on garde, on prolonge ou on arrête.'],
 ['cdd','Fin du CDD',30,'Renouveler, passer en CDI ou préparer la fin de contrat.'],
];
function docDue(){
  const out=[];
  EMP.filter(e=>!e.hidden).forEach(e=>{const D=e.docs||{};DOC_FIELDS.forEach(([k,l,win,tip])=>{const v=D[k];if(!v)return;const days=Math.round((pdate(v)-TODAY)/864e5);if(days<=win)out.push({e,k,l,v,days,tip});});});
  return out.sort((a,b)=>a.days-b.days);
}
const DOC_SHORT={sejour:'titre de séjour',visite:'visite médicale',essai:'fin de période d’essai',cdd:'fin de CDD'};
V11_ALERTS.push(()=>{
  if(!CAN().settings)return [];
  return docDue().slice(0,4).map(x=>({tone:x.days<0?'bad':x.days<=14?'warn':'info',ic:'idcard',t:`${esc(x.e.prenom)} : ${DOC_SHORT[x.k]} ${x.days<0?'dépassé depuis '+plur(-x.days,'jour'):x.days===0?'aujourd’hui':'le '+frLongDate(x.v)}`,s:(x.days>0?`Dans ${plur(x.days,'jour')}. `:'')+x.tip,acts:[{l:'Ouvrir la fiche',act:'emp-edit',id:x.e.id}],key:'al:doc:'+x.e.id+':'+x.k+':'+x.v}));
});
function permsHTML(e){
  const p=permsOf(e);const pk=presetOf(p);
  return `<div class="em-perms" ${e.acces==='manager'?'':'hidden'}>
    <div class="lbl">Ce que ce manager voit et peut faire</div>
    <div class="seg em-preset">${Object.keys(PERM_PRESETS).map(k=>`<button type="button" data-act="em-preset" data-k="${k}" aria-pressed="${pk===k}">${PERM_PRESETS[k].l}</button>`).join('')}<button type="button" disabled aria-pressed="${pk==='perso'}">Personnalisé</button></div>
    <div class="em-plist">${PERM_KEYS.map(([k,l,d])=>`<label class="em-p"><input type="checkbox" data-perm="${k}" ${p[k]?'checked':''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div>
  </div>`;
}
{const f=empModal;empModal=function(id){
  f(id);
  const e=id?empById(id):(EM||{});const can=CAN();const D=e.docs||{};
  const root=$('#modal-root');if(!root)return;
  const grid=root.querySelector('.form-grid');
  if(grid){
    const langSel=`<div class="field"><label for="em-lang">${ic('globe','s')} Langue de Léon pour ${id?esc(e.prenom):'lui'}</label><select class="inp" id="em-lang">${LANGS.map(([k,n])=>`<option value="${k}" ${(e.lang||'fr')===k?'selected':''}>${n}</option>`).join('')}</select></div>`;
    grid.insertAdjacentHTML('beforeend',langSel);
  }
  const acc=$('#em-acces');
  if(acc&&can.settings){acc.closest('.field').insertAdjacentHTML('afterend',`<div class="field full">${permsHTML({...e,acces:acc.value})}</div>`);}
  const photo=id?`<div class="em-photo">${avatar(e,'l')}<div><b>Photo</b><small class="faint">Elle s’affiche sur la borne : chacun touche sa photo pour pointer.</small></div><button type="button" class="btn sm" data-act="photo-emp" data-id="${id}">${ic('camera','s')} ${photoOf('e_'+id)?'Changer':'Ajouter'}</button>${photoOf('e_'+id)?`<button type="button" class="btn sm ghost" data-act="photo-emp-del" data-id="${id}">Retirer</button>`:''}</div>`:'';
  const docs=can.settings?`<details class="eperso em-docs" ${DOC_FIELDS.some(([k])=>D[k])?'open':''}><summary>Dossier et dates à surveiller</summary><div class="form-grid" style="margin-top:10px">${DOC_FIELDS.map(([k,l])=>`<div class="field"><label for="em-d-${k}">${l}</label><input class="inp" type="date" id="em-d-${k}" value="${esc(D[k]||'')}"></div>`).join('')}<div class="field"><label for="em-d-hyg">Formation hygiène (HACCP) faite le</label><input class="inp" type="date" id="em-d-hyg" value="${esc(D.hyg||'')}"></div></div><p class="faint" style="font-size:12.5px;margin-top:6px">Léon te prévient avant chaque date. On ne garde que la date, jamais le numéro du document.</p></details>`:'';
  const anchor=root.querySelector('.pin-err#em-err');
  if(anchor)anchor.insertAdjacentHTML('beforebegin',photo+docs);
};}
document.addEventListener('change',e=>{
  const t=e.target;
  if(t&&t.id==='em-acces'){const b=$('#modal-root .em-perms');if(b)b.hidden=t.value!=='manager';}
  if(t&&t.dataset&&t.dataset.perm){const p={};$$('#modal-root [data-perm]').forEach(x=>p[x.dataset.perm]=x.checked?1:0);const k=presetOf(p);$$('#modal-root .em-preset button').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.k||'perso')===k)));}
});
ACT['em-preset']=t=>{const p=PERM_PRESETS[t.dataset.k].p;$$('#modal-root [data-perm]').forEach(x=>{x.checked=!!p[x.dataset.perm];});$$('#modal-root .em-preset button').forEach(b=>b.setAttribute('aria-pressed',String(b===t)));};
{const f=ACT['emp-save'];ACT['emp-save']=function(t,ev){
  if(EM){
    const l=($('#em-lang')||{}).value;if(l)EM.lang=l==='fr'?undefined:l;
    const boxes=$$('#modal-root [data-perm]');if(boxes.length){const p={};boxes.forEach(x=>p[x.dataset.perm]=x.checked?1:0);EM.perms=p;}
    if($('#em-d-sejour')){const D={};DOC_FIELDS.forEach(([k])=>{const v=($('#em-d-'+k)||{}).value;if(v)D[k]=v;});const h=($('#em-d-hyg')||{}).value;if(h)D.hyg=h;EM.docs=D;}
  }
  return f(t,ev);
};}

/* ---------- 5. Salariés & accès : qui voit quoi, échéances ---------- */
{const f=viewEquipe2;viewEquipe2=function(){
  let h=f();const can=CAN();
  const i=h.indexOf('<section class="panel" style="margin-top:18px"><div class="panel-h"><h2>Qui voit quoi</h2>');
  if(i>=0)h=h.slice(0,i);
  const mgr=EMP.filter(e=>e.acces==='manager'&&!e.hidden);
  const Y=`<span class="yes">${ic('check','s')}</span>`,N='<span class="no">—</span>',R=t=>`<span class="ro">${t}</span>`;
  const rows=[
   ['Ventes, chiffre d’affaires, statistiques',Y,R('Selon ses accès'),N],
   ['Coûts, marges, prix fournisseurs',Y,R('Selon ses accès'),N],
   ['Salaires, masse salariale, paie',Y,R('Selon ses accès'),N],
   ['Planning : créer, modifier, publier',Y,R('Selon ses accès'),R('Voit le sien')],
   ['Congés et échanges : valider',Y,R('Selon ses accès'),R('Demande')],
   ['Heures : corriger, valider',Y,R('Selon ses accès'),R('Voit les siennes')],
   ['Commandes, réceptions, inventaire',Y,R('Selon ses accès'),N],
   ['Plats dispo, allergènes, cahier de liaison',Y,Y,Y],
   ['Fiches techniques',Y,R('Avec les prix s’il voit les coûts'),R('Sans les prix')],
   ['Hygiène : relevés, tâches, étiquettes',Y,Y,Y],
   ['Réglages, codes, équipe',Y,N,N],
  ];
  const due=can.settings?docDue():[];
  const dueHTML=can.settings?`<section class="panel" style="margin-top:18px" data-fold-key="equipe:docs"><div class="panel-h"><h2>${ic('idcard')} Dates à surveiller</h2><span class="faint" style="font-size:12.5px">titre de séjour, visite médicale, essai, CDD</span></div>${due.length?`<div class="alerts">${due.map(x=>`<div class="al t-${x.days<0?'bad':x.days<=14?'warn':'info'}"><span class="av-w">${avatar(x.e,'s')}</span><div class="al-x"><b>${esc(x.e.prenom)} · ${DOC_SHORT[x.k]}</b><p>${x.days<0?'Dépassé depuis '+plur(-x.days,'jour'):x.days===0?'Aujourd’hui':'Le '+frLongDate(x.v)+' · dans '+plur(x.days,'jour')}. ${x.tip}</p></div><div class="acts"><button class="btn sm" data-act="emp-edit" data-id="${x.e.id}">Fiche</button></div></div>`).join('')}</div>`:`<div class="empty" style="padding:18px"><p>Rien dans les semaines qui viennent. Renseigne les dates dans la fiche de chaque salarié (« Dossier et dates à surveiller »).</p></div>`}</section>`:'';
  const mgrHTML=mgr.length?`<div class="mgr-list">${mgr.map(e=>`<div class="mgr-r">${avatar(e,'s')}<b>${esc(e.prenom)}</b><span class="pill brass">${esc(presetLabel(permsOf(e)))}</span><span class="faint mgr-d">${PERM_KEYS.filter(([k])=>permsOf(e)[k]).map(([,l])=>l.replace(/^Voit l(es|e) /,'').replace(/^Voit /,'')).join(' · ')}</span>${can.settings?`<button class="btn sm" data-act="emp-edit" data-id="${e.id}">Régler</button>`:''}</div>`).join('')}</div>`:'';
  return h+dueHTML+`<section class="panel" style="margin-top:18px" data-fold-key="equipe:acces"><div class="panel-h"><h2>Qui voit quoi</h2><span class="faint" style="font-size:12.5px">Chaque manager a ses propres accès</span></div>${mgrHTML}<div class="tbl-wrap"><table class="tbl matrix"><thead><tr><th>Fonction</th><th>Directeur</th><th>Manager</th><th>Staff</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></section>`;
};}
{const f=viewConges;viewConges=function(){if(effRole()==='manager'&&!CAN().team&&U.empId)return viewMesConges();return f();};VIEWS.conges=viewConges;}

/* ---------- 6. heures de la veille à valider ---------- */
const HOK_MOTIFS=[['oubli','Oubli de badge'],['hs','Heures sup demandées'],['retard','Retard excusé'],['erreur','Erreur de badge'],['autre','Autre']];
function hourIssues(iso){
  const {w,d}=wdOf(pdate(iso));const out=[];
  if(!dayHasPt(iso))return out;
  EMP.forEach(e=>{
    const sh=empShifts(e.id,w,d);const ev=evsOn(e.id,iso);const ab=absOf(e.id,w,d);
    if(!sh.length&&!ev.length)return;
    const P=[];
    if(sh.length&&!ev.length){if(!ab||ab.type==='repos')P.push({k:'missed',t:'Pas de badge du tout',s:`Prévu ${sh.map(x=>x.s+'–'+x.e).join(' et ')}. Absent, ou oubli de badge ?`});}
    else if(ev.length){
      const last=ev[ev.length-1];
      if(last.t==='in'||last.t==='back')P.push({k:'noOut',t:'Sortie pas badgée',s:`Dernier badge : ${last.t==='in'?'arrivée':'retour de pause'} à ${hhmm(last.m)}.`});
      else if(last.t==='pause')P.push({k:'noOut',t:'Retour de pause pas badgé',s:`Pause commencée à ${hhmm(last.m)}, rien ensuite.`});
      if(!sh.length)P.push({k:'noShift',t:'Badge sans shift prévu',s:`${dur(workedMin(ev,false))} pointées alors que rien n’était prévu.`});
      else{
        const ins=ev.filter(z=>z.t==='in');
        sh.forEach((x,i)=>{const z=ins[i];if(z&&z.m>sMin(x)+5)P.push({k:'late',t:`Retard de ${durShort(z.m-sMin(x))}`,s:`Arrivé à ${hhmm(z.m)} au lieu de ${x.s}.`});});
        const outs=ev.filter(z=>z.t==='out');const lastSh=sh[sh.length-1];const lo=outs[outs.length-1];
        if(lo&&last.t==='out'&&lo.m>eMin(lastSh)+30)P.push({k:'over',t:`Parti ${durShort(lo.m-eMin(lastSh))} après la fin`,s:`Fin prévue ${lastSh.e}, sortie badgée à ${hhmm(lo.m)}. Heures sup, ou oubli de badger en partant ?`});
        if(lo&&last.t==='out'&&lo.m<eMin(lastSh)-30)P.push({k:'early',t:`Parti ${durShort(eMin(lastSh)-lo.m)} plus tôt`,s:`Fin prévue ${lastSh.e}, sortie à ${hhmm(lo.m)}.`});
      }
    }
    if(P.length)out.push({e,iso,w,d,sh,ev,P,ok:(S.hoursOk[iso]||{})[e.id]||null});
  });
  return out;
}
function hourIssuesAll(){const L=[];for(let k=1;k<=7;k++){const iso=isoD(addDays(TODAY,-k));L.push(...hourIssues(iso));}return L;}
V11_ALERTS.push(()=>{
  if(!CAN().hours)return [];
  const L=hourIssuesAll().filter(x=>!x.ok);if(!L.length)return [];
  const y=isoD(addDays(TODAY,-1));const yd=L.filter(x=>x.iso===y);
  return [{tone:'warn',ic:'clock',t:plur(L.length,'point d’heures à valider','points d’heures à valider'),s:(yd.length?'Hier : ':'')+L.slice(0,3).map(x=>`${esc(x.e.prenom)} ${x.P[0].t.toLowerCase()}`).join(', ')+(L.length>3?'…':'')+'. À régler avant la paie.',acts:[{l:'Valider les heures',act:'go-mod',v:'pointage',t:'valider',primary:true}],noDismiss:true,key:'al:hours:'+TODAY_ISO}];
});
function hokRow(x){
  const can=CAN();const k=x.P.map(p=>p.k);const lastSh=x.sh[x.sh.length-1];
  const quick=[];
  if(k.includes('noOut')&&lastSh)quick.push(`<button class="btn sm" data-act="hok-out" data-e="${x.e.id}" data-iso="${x.iso}">${ic('out','s')} Sortie à ${lastSh.e}</button>`);
  if(k.includes('over')&&lastSh)quick.push(`<button class="btn sm" data-act="hok-cut" data-e="${x.e.id}" data-iso="${x.iso}">Ramener à ${lastSh.e}</button><button class="btn sm" data-act="hok-ok" data-e="${x.e.id}" data-iso="${x.iso}" data-m="hs">Heures sup OK</button>`);
  if(k.includes('missed'))quick.push(`<button class="btn sm" data-act="hok-here" data-e="${x.e.id}" data-iso="${x.iso}">Il était là</button><button class="btn sm" data-act="hok-abs" data-e="${x.e.id}" data-iso="${x.iso}">Absent</button>`);
  if(k.includes('late')&&!k.includes('over')&&!k.includes('noOut')&&!k.includes('missed'))quick.push(`<button class="btn sm" data-act="hok-ok" data-e="${x.e.id}" data-iso="${x.iso}" data-m="retard">OK, c’est noté</button>`);
  const d=pdate(x.iso);const dl=x.iso===isoD(addDays(TODAY,-1))?'Hier':JOURS[(d.getDay()+6)%7]+' '+d.getDate();
  return `<div class="al hok ${x.ok?'is-done':''}"><span class="av-w">${avatar(x.e,'s')}</span><div class="al-x"><b>${esc(x.e.prenom)} · ${dl}</b>${x.P.map(p=>`<p><b class="hok-t">${esc(p.t)}</b> · ${esc(p.s)}</p>`).join('')}
    <p class="faint hok-ev">Prévu : ${x.sh.map(s=>s.s+'–'+s.e).join(' · ')||'rien'} · Badgé : ${x.ev.map(z=>(z.t==='in'?'↘':z.t==='out'?'↗':'Ⅱ')+' '+hhmm(z.m)).join('  ')||'rien'}${x.ok?` · <span class="pill ok">${x.ok.st==='fix'?'Corrigé':'Validé'} par ${esc(x.ok.by||'')}${x.ok.motif?' · '+esc((HOK_MOTIFS.find(m=>m[0]===x.ok.motif)||[,x.ok.motif])[1]):''}</span>`:''}</p></div>
    <div class="acts">${x.ok?`<button class="btn sm" data-act="hok-reopen" data-e="${x.e.id}" data-iso="${x.iso}">Rouvrir</button>`:quick.join('')+`<button class="btn sm" data-act="hok-edit" data-e="${x.e.id}" data-iso="${x.iso}">${ic('edit','s')} Corriger</button><button class="btn sm primary" data-act="hok-ok" data-e="${x.e.id}" data-iso="${x.iso}">${ic('check','s')} Valider</button>`}</div></div>`;
}
function hoursValidHTML(){
  const L=hourIssuesAll();const todo=L.filter(x=>!x.ok),done=L.filter(x=>x.ok);
  return `<p class="muted" style="font-size:13.5px;margin:-4px 0 12px;max-width:80ch">Chaque matin, 2 minutes : Léon ne te montre que ce qui cloche sur les 7 derniers jours. Tu valides ou tu corriges, et la paie sort propre.</p>
   <section class="panel no-fold"><div class="panel-h"><h2>${ic('clock')} À valider</h2><span class="pill ${todo.length?'warn':'ok'}">${todo.length?plur(todo.length,'point'):'Tout est propre'}</span></div>${todo.length?`<div class="alerts">${todo.map(hokRow).join('')}</div>`:`<div class="empty todo-ok">${ic('check')}<p>Aucun oubli, aucune heure sup à valider.</p></div>`}</section>
   ${done.length?`<div class="more-row"><button class="btn ghost sm" data-act="hok-done-t">${UI.point.showOk?'Masquer':'Revoir'} ${plur(done.length,'point déjà réglé','points déjà réglés')} ${ic(UI.point.showOk?'up':'down','s')}</button></div>${UI.point.showOk?`<div class="alerts done-list">${done.map(hokRow).join('')}</div>`:''}`:''}`;
}
function viewPointage(){
  const can=CAN();
  if(!EMP.length)return `<div class="ph"><div><h1>Pointage</h1></div></div><div class="panel"><div class="empty"><h3>Pas encore d’équipe</h3><p>Chaque salarié pointe avec son code personnel, créé dans Équipe & accès.</p>${can.settings?`<div class="acts"><button class="btn primary" data-act="nav" data-v="equipe">Ajouter l’équipe</button></div>`:''}</div></div>`;
  if(!can.board){
    const e=empById(U.empId);
    return `<div class="ph"><div><h1>${T('Pointage')}</h1><p class="sub">${T('Pointe en arrivant, en partant et pour tes pauses. Tu retapes ton code à chaque fois : personne ne peut pointer à ta place.')}</p></div></div>${myPointCard(e.id)}<section class="panel" style="margin-top:18px"><div class="panel-h"><h2>${T('Tes 7 derniers jours')}</h2></div>${myHistory(e.id)}</section>`;
  }
  const TABS=[['jour','Aujourd’hui','clock'],...(can.hours?[['valider','Heures à valider','check']]:[]),['borne','Borne de pointage','tablet'],['releve','Relevé d’heures','list']];
  let t=UI.point.tab;if(!TABS.some(x=>x[0]===t))t=UI.point.tab='jour';
  const n=can.hours?hourIssuesAll().filter(x=>!x.ok).length:0;
  const tabs=`<div class="tabs" role="tablist">${TABS.map(([k,l,i])=>`<button role="tab" aria-selected="${t===k}" data-act="point-tab" data-t="${k}">${ic(i,'s')}${l}${k==='valider'&&n?` <span class="nb warn">${n}</span>`:''}</button>`).join('')}</div>`;
  let body='';
  if(t==='jour')body=(U.empId?myPointCard(U.empId)+'<div style="height:18px"></div>':'')+presenceBoard();
  else if(t==='valider')body=hoursValidHTML();
  else if(t==='borne')body=kioskHTML();
  else body=releveHTML(UI.point.rw);
  return `<div class="ph"><div><h1>Pointage</h1><p class="sub">Qui est là en direct, les heures à valider, la borne à l’entrée et le relevé pour la paie.</p></div></div>${tabs}${body}`;
}
{const f=modInfo;modInfo=function(v){
  const x=f(v);if(v!=='pointage'||!S||!CAN().hours)return x;
  try{const n=hourIssuesAll().filter(y=>!y.ok).length;if(!n)return x;return {...x,s:(x.s?x.s+' · ':'')+plur(n,'heure à valider','heures à valider'),n:(x.n||0)+n,tone:x.tone==='bad'?'bad':'warn'};}catch(e){return x;}
};}
function hokSet(emp,iso,st,motif){S.hoursOk={...(S.hoursOk||{})};S.hoursOk[iso]={...(S.hoursOk[iso]||{}),[emp]:{st,motif:motif||null,by:whoName(),at:Date.now()}};save();}
function hokFind(t){const iso=t.dataset.iso,emp=t.dataset.e;const x=hourIssues(iso).find(y=>y.e.id===emp);return x;}
function hokMotifModal(title,sub,onOk,def){
  openModal(`<div class="mh"><div><h3>${title}</h3><p>${sub}</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <div class="field"><label for="hok-m">Pourquoi ?</label><select class="inp" id="hok-m">${HOK_MOTIFS.map(([k,l])=>`<option value="${k}" ${k===def?'selected':''}>${l}</option>`).join('')}</select></div>
   <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="hok-go">Enregistrer</button></div>`,'narrow');
  UI.hokOk=onOk;
}
function hokEditModal(x){
  const segs=x.sh.length?x.sh.map((s,i)=>{const ins=x.ev.filter(z=>z.t==='in'),outs=x.ev.filter(z=>z.t==='out');return {s:ins[i]?hhmm(ins[i].m):s.s,e:outs[i]?hhmm(outs[i].m%1440):s.e,p:s.p||0};}):[{s:x.ev[0]?hhmm(x.ev[0].m):'11:00',e:(x.ev.find(z=>z.t==='out')?hhmm(x.ev.find(z=>z.t==='out').m%1440):'15:00'),p:0}];
  UI.hokEdit={emp:x.e.id,iso:x.iso,n:segs.length};
  openModal(`<div class="mh"><div><h3>Corriger les heures de ${esc(x.e.prenom)}</h3><p>${esc(longDate(pdate(x.iso)))} · prévu ${x.sh.map(s=>s.s+'–'+s.e).join(' et ')||'rien'}. Les pointages sont remplacés par ces heures, marqués « corrigé ».</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   ${segs.map((g,i)=>`<div class="form-grid hok-seg" style="margin-top:0"><div class="field"><label for="hk-s${i}">Arrivée ${segs.length>1?i+1:''}</label><input class="inp" type="time" id="hk-s${i}" value="${g.s}"></div><div class="field"><label for="hk-e${i}">Départ ${segs.length>1?i+1:''}</label><input class="inp" type="time" id="hk-e${i}" value="${g.e}"></div><div class="field"><label for="hk-p${i}">Pause (min)</label><input class="inp" type="number" min="0" step="5" id="hk-p${i}" value="${g.p}"></div></div>`).join('')}
   <div class="field" style="margin-top:10px"><label for="hok-m">Pourquoi ?</label><select class="inp" id="hok-m">${HOK_MOTIFS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></div>
   <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="hok-edit-save">Enregistrer</button></div>`,'wide');
}
function evFromSegs(segs){const ev=[];segs.forEach(g=>{let a=toMin(g.s),b=toMin(g.e);if(b<=a)b+=1440;ev.push({t:'in',m:a,by:whoName()});if(g.p>0){const mid=a+Math.round((b-a)/2);ev.push({t:'pause',m:mid,by:whoName()});ev.push({t:'back',m:mid+g.p,by:whoName()});}ev.push({t:'out',m:b,by:whoName()});});return ev;}
Object.assign(ACT,{
  'hok-done-t'(){UI.point.showOk=!UI.point.showOk;renderView();},
  'hok-ok'(t){hokSet(t.dataset.e,t.dataset.iso,'ok',t.dataset.m||null);renderView();toastAct('Heures validées','check',`<button class="t-act" data-act="hok-reopen" data-e="${t.dataset.e}" data-iso="${t.dataset.iso}">Annuler</button>`);},
  'hok-reopen'(t){const iso=t.dataset.iso;if(S.hoursOk&&S.hoursOk[iso]){delete S.hoursOk[iso][t.dataset.e];S.hoursOk={...S.hoursOk};save();}renderView();},
  'hok-out'(t){const x=hokFind(t);if(!x)return;const last=x.sh[x.sh.length-1];
    hokMotifModal(`Sortie de ${esc(x.e.prenom)} à ${last.e}`,'On ajoute un badge de sortie à l’heure de fin prévue.',m=>{const ev=ensureEv(x.e.id,x.iso);const lt=ev[ev.length-1];if(lt&&lt.t==='pause')ev.push({t:'back',m:Math.min(lt.m+20,eMin(last)),by:whoName()});ev.push({t:'out',m:eMin(last),by:whoName()});ev.sort((a,b)=>a.m-b.m);hokSet(x.e.id,x.iso,'fix',m);},'oubli');},
  'hok-cut'(t){const x=hokFind(t);if(!x)return;const last=x.sh[x.sh.length-1];
    hokMotifModal(`Ramener la sortie de ${esc(x.e.prenom)} à ${last.e}`,'La sortie badgée est remplacée par l’heure de fin prévue.',m=>{const ev=ensureEv(x.e.id,x.iso);const o=ev.filter(z=>z.t==='out').pop();if(o){o.m=eMin(last);o.by=whoName();}hokSet(x.e.id,x.iso,'fix',m);},'oubli');},
  'hok-here'(t){const x=hokFind(t);if(!x)return;
    hokMotifModal(`${esc(x.e.prenom)} était là`,'On crée ses pointages avec les heures prévues au planning.',m=>{const ev=ensureEv(x.e.id,x.iso);ev.splice(0,ev.length,...evFromSegs(x.sh.map(s=>({s:s.s,e:s.e,p:s.p||0}))));hokSet(x.e.id,x.iso,'fix',m);},'oubli');},
  'hok-abs'(t){const x=hokFind(t);if(!x)return;
    confirmBox({title:`${esc(x.e.prenom)} absent ?`,text:'On pose une absence injustifiée ce jour-là (visible dans la paie). Tu peux la changer en arrêt maladie dans Congés & absences.',ok:'Poser l’absence',onOk:()=>{S.absences=[...S.absences.filter(a=>!(a.emp===x.e.id&&a.w===x.w&&a.d===x.d)),{id:uid('ab'),emp:x.e.id,w:x.w,d:x.d,type:'absinj',note:'Pas venu, pas prévenu'}];hokSet(x.e.id,x.iso,'fix','autre');renderView();toast('Absence posée','calendar');}});},
  'hok-edit'(t){const x=hokFind(t);if(x)hokEditModal(x);},
  'hok-edit-save'(){const E=UI.hokEdit;if(!E)return;const segs=[];for(let i=0;i<E.n;i++){const s=$('#hk-s'+i).value,e=$('#hk-e'+i).value,p=+$('#hk-p'+i).value||0;if(!/^\d\d:\d\d$/.test(s)||!/^\d\d:\d\d$/.test(e)){toast('Vérifie les heures','alert');return;}segs.push({s,e,p});}
    const ev=ensureEv(E.emp,E.iso);ev.splice(0,ev.length,...evFromSegs(segs));hokSet(E.emp,E.iso,'fix',$('#hok-m').value);UI.hokEdit=null;closeModal();renderView();toast('Heures corrigées','check');},
  'hok-go'(){const f=UI.hokOk;UI.hokOk=null;const m=($('#hok-m')||{}).value;closeModal();if(f){f(m);save();}renderView();toast('C’est corrigé','check');},
});

/* ---------- 4. accueil borne : accès rapide depuis l'écran de badge ---------- */
const KIOSK_TILES=[
  {v:'hygiene',l:'Hygiène',i:'thermo'},
  {v:'recettes',l:'Recettes',i:'chef'},
  {v:'planning',l:'Mon planning',i:'calendar'},
];
function kioskTilesHTML(){
  const tiles=KIOSK_TILES.filter(x=>navItems().some(n=>n.v===x.v));
  if(!tiles.length)return '';
  return `<div class="who" style="margin-top:20px">${T('Accès rapide')}</div><div class="badge-acts">${tiles.map(x=>`<button class="btn demo-link big block" data-act="badge-goto" data-v="${x.v}">${ic(x.i)} ${T(x.l)}</button>`).join('')}</div>`;
}
{const f=badgeHTML;badgeHTML=function(){
  const html=f();
  if(U.screen!=='badge'||!U.empId)return html;
  return html.replace('<div class="row"', kioskTilesHTML()+'<div class="row"');
};}
Object.assign(ACT,{
  'badge-goto'(t){
    const v=t.dataset.v;U.badgeMsg=null;
    if(v==='hygiene'||v==='planning'){UI.kiosk={view:v};U.screen='kiosk';render();return;}
    U.screen='app';go(v);
  },
});

/* =========================================================
   MODE BORNE : écrans dédiés, plein écran, qui ne renvoient
   jamais vers le site complet. Pensés pour rester ouverts H24
   sur la tablette du restaurant : gros boutons, peu de texte,
   et le même verrouillage automatique après inactivité que
   l'écran de badge.
   ========================================================= */
UI.kiosk=null;
function kioskShellHTML(){
  if(!UI.kiosk)UI.kiosk={view:'hygiene'};
  const v=UI.kiosk.view;
  const title=v==='planning'?T('Mon planning'):T('Hygiène');
  const body=v==='planning'?kioskPlanningHTML():kioskHygieneHTML();
  return `<div class="stage kiosk-stage"><div class="kiosk-shell">
    <header class="kiosk-top"><button class="btn demo-link sm" data-act="kiosk-home">${ic('chevL','s')} ${T('Accueil')}</button><b class="kiosk-title">${esc(title)}</b><span class="clock" data-clock>${hhmm(nowMin())}</span></header>
    <div class="kiosk-body">${body}</div>
  </div></div>`;
}
{const f=render;render=function(){
  if(U.screen==='kiosk'){
    closeInfo();$('#chat-root').innerHTML='';$('#app').innerHTML=kioskShellHTML();
    return;
  }
  return f.apply(this,arguments);
};}
/* même filet de sécurité qu'en mode badge : personne ne reste dessus H24 */
setInterval(()=>{if(U.screen==='kiosk'&&!MODAL&&Date.now()-LAST_ACT>180e3)lock();},3000);

/* ---------- Mon planning (lecture seule, très simple) ---------- */
function kioskPlanningHTML(){
  const e=empById(U.empId);if(!e)return `<p class="faint">${T('Compte introuvable.')}</p>`;
  const rows=[0,1,2,3,4,5,6].map(d=>{
    const date=addDays(MON0,d);const iso=isoD(date);const today=iso===TODAY_ISO;
    const sh=empShifts(U.empId,0,d);const closed=isClosed(d);
    const body=closed?`<span class="faint">${T('Fermé')}</span>`:sh.length?sh.map(x=>`<span class="pill ok">${esc(x.s)}–${esc(x.e)}</span>`).join(' '):`<span class="faint">${T('Repos')}</span>`;
    return `<div class="kiosk-day ${today?'today':''}"><div class="kiosk-day-h">${ic('calendar','s')} ${JC[d]} ${date.getDate()}${today?` <span class="pill info">${T('Aujourd’hui')}</span>`:''}</div><div class="kiosk-day-b">${body}</div></div>`;
  }).join('');
  return `<p class="sub" style="margin:0 0 14px">${T('Ta semaine,')} ${esc(e.prenom)}.</p>${rows}`;
}

/* ---------- Hygiène : tâches, produit ouvert (photo), étiquette ---------- */
function kioskTaskItemHTML(L,iso,i,it){
  const done=!!tkDoneOf(iso,L.id).items[i];
  return `<button class="kiosk-item ${done?'done':''}" data-act="kiosk-tk-tick" data-l="${L.id}" data-i="${i}"><span class="kiosk-check">${done?ic('check','s'):''}</span><span>${ic(it.ic,'s')} ${esc(it.t)}</span></button>`;
}
function kioskTasksHTML(){
  const iso=TODAY_ISO;const L=tasksOf().filter(x=>tkAssign(x,iso).length);
  if(!L.length)return `<p class="faint">${T('Aucune liste pour aujourd’hui.')}</p>`;
  return L.map(x=>{
    const p=tkProgress(x,iso);const st=tkState(x,iso);
    return `<div class="panel kiosk-tasklist ${st.k}" style="margin-bottom:14px"><div class="panel-h"><h3>${ic((TK_MOMENTS[x.moment]||{}).i||'check','s')} ${esc(x.n)}</h3><span class="pill ${st.tone||''}">${p.k}/${p.n}</span></div><div class="panel-b">${x.items.map((it,i)=>kioskTaskItemHTML(x,iso,i,it)).join('')}</div></div>`;
  }).join('');
}
function kioskLotCard(lot){
  const eff=lotEffDlc(lot);const expired=eff&&eff<TODAY_ISO;const soon=eff&&!expired&&eff<=isoD(addDays(TODAY,1));
  const ph=photoOf('lot_'+lot.id);
  return `<div class="kiosk-lot">${ph?`<img class="kiosk-lot-ph" src="${ph}" alt="">`:`<span class="kiosk-lot-ph ph-empty">${ic('camera')}</span>`}
   <div class="kiosk-lot-b"><b>${esc(lot.nom)}</b><span class="pill ${expired?'bad':soon?'warn':'ok'}">${T('à consommer avant le')} ${eff?frLongDate(eff):'—'}</span></div>
   <div class="kiosk-lot-acts"><button class="btn sm" data-act="kiosk-lot-print" data-id="${lot.id}">${ic('print','s')} ${T('Étiquette')}</button><button class="icon-btn" data-act="kiosk-lot-del" data-id="${lot.id}" aria-label="${T('Retirer')}">${ic('trash','s')}</button></div></div>`;
}
function kioskHygieneHTML(){
  if(!S.hyg)S.hyg={equip:defaultHygEquip(),temps:[],lots:[]};
  const lots=(S.hyg.lots||[]).filter(l=>l.statut==='ouvert').sort((a,b)=>(lotEffDlc(a)||'9999').localeCompare(lotEffDlc(b)||'9999'));
  return `<h2 class="kiosk-h2">${ic('check','s')} ${T('Tâches importantes')}</h2>${kioskTasksHTML()}
   <h2 class="kiosk-h2" style="margin-top:22px">${ic('camera','s')} ${T('Produits ouverts')}</h2>
   <button class="btn launch big block" data-act="kiosk-lot-new" style="margin-bottom:14px">${ic('camera','s')} ${T('Photo d’un produit qu’on vient d’ouvrir')}</button>
   <div class="kiosk-lots">${lots.length?lots.map(kioskLotCard).join(''):`<p class="faint">${T('Aucun produit ouvert suivi pour l’instant.')}</p>`}</div>
   <h2 class="kiosk-h2" style="margin-top:22px">${ic('tag','s')} ${T('Étiquette rapide')}</h2>
   <div class="field"><label for="kq-n">${T('Produit')}</label><input class="inp" id="kq-n" placeholder="${T('Ex. sauce maison')}"></div>
   <div class="field" style="margin-top:8px"><label for="kq-d">${T('À consommer avant le')}</label><input class="inp" id="kq-d" type="date" value="${isoD(addDays(TODAY,3))}"></div>
   <button class="btn primary big block" data-act="kiosk-quick-print" style="margin-top:12px">${ic('print','s')} ${T('Imprimer l’étiquette')}</button>`;
}
Object.assign(ACT,{
  'kiosk-home'(){UI.kiosk=null;U.screen='badge';render();},
  'kiosk-tk-tick'(t){
    const L=tasksOf().find(x=>x.id===t.dataset.l);if(!L)return;const i=+t.dataset.i;const iso=TODAY_ISO;
    const on=!tkDoneOf(iso,L.id).items[i];tkMark(L,i,on);save();render();
    if(on&&tkProgress(L,iso).done)toast(`${esc(L.n)} : ${T('Tout est fait')}`,'check');
  },
  'kiosk-lot-new'(){
    const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.setAttribute('capture','environment');inp.style.display='none';document.body.appendChild(inp);
    inp.onchange=async()=>{
      const f=inp.files&&inp.files[0];inp.remove();if(!f)return;
      let d;try{d=await imgToDataUrl(f,640,false,0.7);}catch(e){toast('Impossible de lire cette photo','alert');return;}
      UI.kiosk=UI.kiosk||{};UI.kiosk.photo=d;
      openModal(`<div class="mh"><div><h3>${T('Produit ouvert')}</h3><p>${T('La photo garde la date de péremption visible, en plus de la date ci-dessous.')}</p></div></div>
       <img src="${d}" style="width:100%;border-radius:12px;margin-bottom:12px">
       <div class="field"><label for="kl-n">${T('Produit')}</label><input class="inp" id="kl-n" autofocus placeholder="${T('Ex. jambon blanc')}"></div>
       <div class="field" style="margin-top:8px"><label for="kl-d">${T('À consommer avant le')}</label><input class="inp" id="kl-d" type="date" value="${isoD(addDays(TODAY,3))}"></div>
       <div class="mf"><button class="btn" data-act="modal-close">${T('Annuler')}</button><button class="btn primary" data-act="kiosk-lot-save">${T('Enregistrer')}</button></div>`,'wide');
    };
    inp.click();
  },
  'kiosk-lot-save'(){
    const n=(($('#kl-n')||{}).value||'').trim();if(!n){toast('Indique un produit','alert');return;}
    const dlc=($('#kl-d')||{}).value||null;const id=uid('lot');
    S.hyg.lots=[{id,nom:n,dlc,recep:TODAY_ISO,dateOuverture:TODAY_ISO,statut:'ouvert'},...(S.hyg.lots||[])];
    if(UI.kiosk&&UI.kiosk.photo)photoSet('lot_'+id,UI.kiosk.photo);
    if(UI.kiosk)UI.kiosk.photo=null;
    save();closeModal();render();toast(T('Produit enregistré'),'camera');
  },
  'kiosk-lot-print'(t){const lot=(S.hyg.lots||[]).find(l=>l.id===t.dataset.id);if(!lot)return;printLabel({nom:lot.nom,dlc:lotEffDlc(lot)});},
  'kiosk-lot-del'(t){S.hyg.lots=(S.hyg.lots||[]).filter(l=>l.id!==t.dataset.id);save();render();},
  'kiosk-quick-print'(){
    const n=(($('#kq-n')||{}).value||'').trim();if(!n){toast('Indique un nom de produit','alert');return;}
    printLabel({nom:n,dlc:($('#kq-d')||{}).value});
  },
});
