/* =========================================================
   V9 · PLANNING — les vues
   Semaine (grille « à la Excel »), Jour (frise), Mois (vue d'ensemble),
   mobile (agenda jour par jour), et « Mon planning » pour le salarié.
   ========================================================= */
Object.assign(UI.plan,{sel:null,alertsOpen:false,team:false,clip:null,mo:0});
const isMob=()=>!!(window.matchMedia&&window.matchMedia('(max-width:700px)').matches);
const selKey=(emp,d)=>emp+'|'+d;
function isSel(emp,d){const s=UI.plan.sel;return !!(s&&s.cells&&s.cells.some(c=>c.emp===emp&&c.d===d));}
function monthOf(mo){return new Date(TODAY.getFullYear(),TODAY.getMonth()+(mo||0),1);}
const monthLabel=mo=>{const m=monthOf(mo);return MOIS[m.getMonth()].charAt(0).toUpperCase()+MOIS[m.getMonth()].slice(1)+' '+m.getFullYear();};

function viewPlanning(){
  if(!EMP.length)return `<div class="ph"><div><h1>Planning</h1></div></div><div class="panel"><div class="empty"><h3>Pas encore d’équipe</h3><p>Ajoute tes salariés pour construire le planning.</p>${CAN().settings?`<div class="acts"><button class="btn primary" data-act="nav" data-v="equipe">Ajouter l’équipe</button></div>`:''}</div></div>`;
  const staff=effRole()==='staff';
  if(staff&&!UI.plan.team)return viewMyPlanning();
  const P=UI.plan;if(!['semaine','jour','mois'].includes(P.mode))P.mode='semaine';
  const w=P.w;const edit=CAN().editPlanning&&!staff;
  const A=edit&&P.mode!=='mois'?planAlerts(w):[];
  let body;
  if(P.mode==='mois')body=monthView(edit);
  else if(staff&&!S.published[String(w)])body=`<div class="panel"><div class="empty"><h3>Pas encore publié</h3><p>Le planning de la ${weekLabel(w).toLowerCase()} est en préparation.</p></div></div>`;
  else if(P.mode==='jour')body=dayView9(w,P.day,edit);
  else body=isMob()?agendaView(w,edit):weekGrid9(w,edit);
  const empty=edit&&P.mode==='semaine'&&!S.shifts.some(x=>x.w===w)?`<section class="panel pl-empty"><div class="al"><span class="ico info">${ic('wand','s')}</span><div><b>Semaine vide</b><p>Laisse Léon proposer un planning à partir des couverts prévus${S.tplWeek&&S.tplWeek.length?' et de ta semaine type':''}, ou repars de la semaine précédente.</p></div><div class="acts"><button class="btn sm primary" data-act="pl-fill">${ic('wand','s')} Léon remplit la semaine</button><button class="btn sm" data-act="pl-copyprev">${ic('copy','s')} Copier S-1</button></div></div></section>`:'';
  return planHead(w,edit,staff)+planBar(w,edit,staff,A)+(edit&&P.alertsOpen&&P.mode!=='mois'?alertsPanel(A):'')+empty+body;
}

function planHead(w,edit,staff){
  const P=UI.plan;const k=String(w);const pub=!!S.published[k];const df=pub?pubDiff(w):null;
  let status='',acts='';
  if(staff)acts=`<button class="btn" data-act="pl-team">${ic('chevL','s')} Mon planning</button>`;
  else if(P.mode!=='mois'){
    status=pub?(df&&df.n?`<span class="pill brass" title="${esc(df.emps.map(id=>empById(id).prenom).join(', '))}"><span class="dot"></span>Publié · ${plur(df.n,'modif non envoyée','modifs non envoyées')}</span>`:`<span class="pill ok"><span class="dot"></span>Publié</span>`):`<span class="pill warn"><span class="dot"></span>Brouillon</span>`;
    if(edit){
      if(!pub)acts+=`<button class="btn primary" data-act="pl-publish">${ic('send','s')} Publier</button>`;
      else if(df&&df.n)acts+=`<button class="btn primary" data-act="pl-publish">${ic('send','s')} Prévenir l’équipe</button>`;
    }
  }
  if(edit)acts+=`<button class="btn icon-only" data-act="pl-more" aria-label="Plus d’actions" aria-haspopup="menu" title="Plus d’actions">${ic('dots')}</button>`;
  const sub=staff?'Le planning de toute l’équipe, en lecture seule.':edit?(isMob()?'Touche un salarié pour modifier sa journée.':`Clique une case et tape <b>11-15</b>, <b>soir</b> ou <b>cp</b>, puis Entrée. Glisse un shift pour le déplacer, <kbd>Alt</kbd> pour le copier. <button class="lnk" data-act="pl-keys">Raccourcis</button>`):'';
  return `<div class="ph pl-ph"><div><h1>Planning</h1><p class="sub">${sub}</p></div><div class="acts">${status}${acts}</div></div>`;
}

function planBar(w,edit,staff,A){
  const P=UI.plan;const h=phOf();const mois=P.mode==='mois';
  const nb=A.filter(a=>a.tone==='bad').length,nw=A.filter(a=>a.tone==='warn').length;
  const postes=POSTE_ORDER.filter(p=>EMP.some(e=>e.poste===p));
  const cur=mois?(P.mo||0):w;
  return `<div class="pl-bar">
   <div class="wk-nav"><button class="icon-btn" data-act="pl-prev" aria-label="${mois?'Mois précédent':'Semaine précédente'}">${ic('chevL')}</button><span class="lbl2">${mois?monthLabel(P.mo):weekLabel(w)}</span><button class="icon-btn" data-act="pl-next" aria-label="${mois?'Mois suivant':'Semaine suivante'}">${ic('chevR')}</button></div>
   ${cur!==0?`<button class="btn sm" data-act="pl-today">Aujourd’hui</button>`:''}
   <div class="seg" role="group" aria-label="Vue">${[['semaine','Semaine'],['jour','Jour'],['mois','Mois']].map(([m,l])=>`<button data-act="plan-mode" data-m="${m}" aria-pressed="${P.mode===m}">${l}</button>`).join('')}</div>
   ${postes.length>1?`<div class="chips pl-chips">${['all',...postes].map(k=>`<button class="chip" data-act="plan-filter" data-f="${k}" aria-pressed="${P.filter===k}" ${k!=='all'?`data-poste="${k}"`:''}>${k!=='all'?`<span class="sw" style="--c:color-mix(in oklab,var(--pc) 84%,#000)"></span>`:''}${k==='all'?'Tous':POSTES[k].l}</button>`).join('')}</div>`:''}
   <span class="sp"></span>
   ${edit&&!mois?`<div class="pl-tools">
     <button class="icon-btn" data-act="pl-undo" ${h.u.length?'':'disabled'} aria-label="Annuler" title="Annuler (Ctrl+Z)">${ic('undo')}</button>
     <button class="icon-btn" data-act="pl-redo" ${h.r.length?'':'disabled'} aria-label="Rétablir" title="Rétablir (Ctrl+Maj+Z)">${ic('redo')}</button>
     <button class="btn sm brass" data-act="pl-fill" title="Léon propose un planning pour la semaine">${ic('wand','s')} Léon remplit</button>
     <button class="chkp ${nb?'bad':nw?'warn':'ok'}" data-act="pl-alerts" aria-expanded="${!!P.alertsOpen}">${nb||nw?ic('alert','s')+`<span>${nb?plur(nb,'bloquant'):''}${nb&&nw?' · ':''}${nw?nw+' à voir':''}</span>`:ic('check','s')+'<span>Conforme</span>'}</button>
   </div>`:''}
  </div>`;
}

function alertsPanel(A){
  return `<section class="panel pl-alerts"><div class="panel-h"><h3>${ic('spark')} Léon a vérifié ce planning</h3><span class="row" style="gap:6px">${['bad','warn','info'].map(t=>{const n=A.filter(a=>a.tone===t).length;return n?`<span class="pill ${t}">${n} ${t==='bad'?'bloquant':t==='warn'?'à surveiller':'info'}${n>1&&t!=='info'?'s':''}</span>`:'';}).join('')}<button class="icon-btn" data-act="pl-alerts" aria-label="Fermer">${ic('x','s')}</button></span></div>
   ${A.length?`<div class="alerts">${A.map(a=>`<div class="al"><span class="ico ${a.tone}">${ic(a.tone==='info'?'clock':'alert','s')}</span><div><b>${esc(a.t)}</b><p>${esc(a.s)}</p></div><div class="acts">${INFO[a.k]?infoBtn(a.k):''}${a.emp&&a.d!=null?`<button class="btn sm" data-act="pl-alert-go" data-emp="${a.emp}" data-d="${a.d}">Voir</button>`:''}</div></div>`).join('')}</div>`
   :`<div class="empty" style="padding:18px"><p>Repos, pauses, durées, contrats et couverture : tout est bon.</p></div>`}</section>`;
}

/* ---------- semaine : la grille ---------- */
function gridRows(w){
  const P=UI.plan;const rows=[];
  POSTE_ORDER.forEach(po=>{
    if(P.filter!=='all'&&P.filter!==po)return;
    const emps=EMP.filter(e=>e.poste===po&&(!e.hidden||S.shifts.some(x=>x.emp===e.id&&x.w===w)));
    const op=(S.openShifts||[]).some(x=>x.w===w&&x.poste===po);
    if(!emps.length&&!op)return;
    rows.push({t:'grp',po});
    if(op)rows.push({t:'open',po});
    emps.forEach(e=>rows.push({t:'emp',e}));
  });
  return rows;
}
const rowKey=r=>r.t==='open'?'@'+r.po:r.e.id;
function weekGrid9(w,edit){
  const can=CAN(),staff=effRole()==='staff';
  const days=[0,1,2,3,4,5,6];const isToday=d=>w===0&&d===TIDX;
  const df=edit&&S.published[String(w)]?pubDiff(w):null;
  const notes=S.dayNotes||{};
  const head=`<thead><tr><th class="ec"><span class="ec-h">Équipe</span></th>${days.map(d=>{const dt=dateAt(w,d);const c=prevOf(d);const iso=isoD(dt);const fe=ferieOf(iso);const note=notes[iso];const cl=isClosed(d);
    return `<th class="${isToday(d)?'today':''} ${cl?'closed':''} ${fe?'fe':''}"><div class="dh"><b>${JC[d]} ${dt.getDate()}${isToday(d)?' · auj.':''}</b><small>${cl?'Fermé':`${c[0]}${c[1]?' · '+c[1]:''} couverts`}</small>${fe?`<span class="fe-tag" title="Jour férié">${esc(fe)}</span>`:''}${note?`<button class="dnote" data-act="pl-note" data-d="${d}" title="${esc(note)}">${ic('note','s')}<span>${esc(note)}</span></button>`:edit&&!cl?`<button class="dnote add" data-act="pl-note" data-d="${d}" aria-label="Ajouter une note le ${JOURS[d].toLowerCase()}">${ic('plus','s')}<span>Note</span></button>`:''}</div></th>`;}).join('')}</tr></thead>`;
  let body='';
  gridRows(w).forEach(r=>{
    if(r.t==='grp'){body+=`<tr class="grp"><td colspan="8"><span class="sw" data-poste="${r.po}"></span>${POSTES[r.po].l}</td></tr>`;return;}
    if(r.t==='open'){
      body+=`<tr class="open-r"><td class="ec"><div class="erow"><span class="av open-av" aria-hidden="true">${ic('hand','s')}</span><div class="nm"><b>À pourvoir</b><small>${POSTES[r.po].l} · l’équipe peut se proposer</small></div></div></td>${days.map(d=>{
        if(isClosed(d))return '<td class="cell closed"></td>';
        const op=openAt(w,d,r.po);const grp=[];op.forEach(x=>{const g=grp.find(g=>g[0].s===x.s&&g[0].e===x.e);if(g)g.push(x);else grp.push([x]);});
        return `<td class="cell c9 open-c ${isSel('@'+r.po,d)?'sel':''}" data-cell9="1" data-emp="@${r.po}" data-d="${d}">${grp.map(g=>{const x=g[0];const cand=(S.swaps||[]).filter(s=>s.kind==='take'&&g.some(o=>o.id===s.openId)&&s.status==='pending');return `<div class="shift s9 open-s ${UI.plan.sel&&UI.plan.sel.shift===x.id?'on':''}" data-poste="${r.po}" data-oid="${x.id}" ${edit?`draggable="true" data-drag9="o:${x.id}"`:''} title="${g.length>1?plur(g.length,'shift identique','shifts identiques')+' à pourvoir':'Shift à pourvoir'}"><span class="t">${x.s}–${x.e}${g.length>1?` <b class="x-n">×${g.length}</b>`:''}</span><span class="m">${cand.length?plur(cand.length,'volontaire'):'personne pour l’instant'}</span></div>`;}).join('')}</td>`;
      }).join('')}</tr>`;
      return;
    }
    const e=r.e;const m=empWeekMin(e.id,w),c=e.contrat*60;
    const credit=S.absences.filter(a=>a.emp===e.id&&a.w===w&&ABS_PAID.includes(a.type)).length*c/5;
    const tone=m>c+30?(e.contrat<35&&m-c>c/10?'bad':'warn'):(m+credit<c-60?'info':'');
    const mine=staff&&e.id===U.empId;
    body+=`<tr class="${mine?'me':''}"><td class="ec"><div class="erow">${avatar(e)}<div class="nm"><b>${esc(e.prenom)} ${esc((e.nom||'')[0]||'')}${e.nom?'.':''}${mine?' <span class="new-tag">moi</span>':''}</b><small>${esc(e.titre||POSTES[e.poste].l)}</small><div class="hrs"><span class="tnum">${dur(m+credit)} / ${e.contrat}h</span><span class="bar"><i class="${tone}" style="width:${clamp((m+credit)/c*100,0,100)}%"></i></span></div></div></div></td>`;
    days.forEach(d=>{
      if(isClosed(d)){body+=`<td class="cell closed"></td>`;return;}
      const sh=empShifts(e.id,w,d);const ab=absOf(e.id,w,d);const na=availOf(e.id,d);
      let inner='';
      if(ab)inner+=`<div class="absb a-${ab.type}">${ABS[ab.type]}${ab.note?`<small>${esc(ab.note)}</small>`:''}</div>`;
      sh.forEach((x,i)=>{
        let dotc='';
        if(isToday(d)){const ev=evsOn(e.id,TODAY_ISO).filter(z=>z.t==='in');if(ev[i])dotc=`<span class="pt ${ev[i].m>sMin(x)+5?'late':''}" title="Pointé à ${hhmm(ev[i].m)}"></span>`;}
        const chg=df&&df.addedSet.has(shKey(x));const cl=availClash(x);
        inner+=`<div class="shift s9 ${chg?'chg':''} ${cl?'clash':''} ${UI.plan.sel&&UI.plan.sel.shift===x.id?'on':''}" data-poste="${x.poste}" data-sid="${x.id}" ${edit?`draggable="true" data-drag9="s:${x.id}"`:''} title="${x.s}–${x.e}${x.p?' · pause '+x.p+' min':''} · ${POSTES[x.poste].l}${chg?' · modifié depuis la publication':''}${cl?' · pas dispo '+AVAIL_L[cl]:''}">${dotc}<span class="t">${x.s}–${x.e}</span><span class="m">${dur(durMin(x))}${x.p?' · p. '+x.p+'′':''}${x.poste!==e.poste?' · '+POSTES[x.poste].l:''}</span></div>`;
      });
      if(na&&!sh.length&&!ab)inner+=`<span class="na-tag">Pas dispo ${AVAIL_L[na]}</span>`;
      if(edit&&!sh.length&&!ab)inner+=`<span class="add-hint" aria-hidden="true">${ic('plus','s')}</span>`;
      body+=`<td class="cell c9 ${isToday(d)?'today':''} ${na?'na':''} ${isSel(e.id,d)?'sel':''}" data-cell9="1" data-emp="${e.id}" data-d="${d}">${inner}</td>`;
    });
    body+='</tr>';
  });
  const foot=[];
  foot.push(`<tr><td class="ec">Heures planifiées</td>${days.map(d=>isClosed(d)?'<td class="closed"></td>':`<td><span class="ft-v">${dur(dayHours(w,d))}</span></td>`).join('')}</tr>`);
  foot.push(`<tr><td class="ec"><span class="row" style="gap:6px">Couverture ${infoBtn('couverture')}</span></td>${days.map(d=>{if(isClosed(d))return '<td class="closed"></td>';const cv=coverage(w,d);return `<td><div class="cov">${cv.map(c=>c.miss.length?`<span class="warn">${ic('alert','s')}${c.svc==='midi'?'Midi':'Soir'} : ${c.miss.map(k=>({salle:'salle',cuisine:'cuis.',bar:'bar'}[k])+' '+c.have[k]+'/'+c.need[k]).join(', ')}</span>`:`<span class="ok">${ic('check','s')}${c.svc==='midi'?'Midi':'Soir'}</span>`).join('')}</div></td>`;}).join('')}</tr>`);
  if(can.salaries){
    foot.push(`<tr><td class="ec"><span class="row" style="gap:6px">Masse salariale ${infoBtn('masse')}</span></td>${days.map(d=>{if(isClosed(d))return '<td class="closed"></td>';const c=dayCost(w,d),ca=dayCA(d),r=ca?c/ca:0;return `<td><span class="ft-v">${eur(c,0)}</span><div class="ft-s">${ca?`<span class="pill ${r<=0.32?'ok':r<=0.36?'warn':'bad'}" style="font-size:11px;padding:.05rem .4rem">${pc(r,0)} du CA</span>`:''}</div></td>`;}).join('')}</tr>`);
    foot.push(`<tr><td class="ec">CA prévu · réel</td>${days.map(d=>{if(isClosed(d))return '<td class="closed"></td>';const dt=dateAt(w,d);let real='';if(dt<=TODAY&&typeof daySum==='function'){try{const ds=daySum(isoD(dt));if(ds&&ds.ht)real=`<div class="ft-s">réel ${eur(ds.ht,0)}</div>`;}catch(e){}}return `<td><span class="ft-v">${eur(dayCA(d),0)}</span>${real}</td>`;}).join('')}</tr>`);
  }
  const totH=sum(S.shifts.filter(x=>x.w===w),durMin);
  const totC=sum(S.shifts.filter(x=>x.w===w),x=>durMin(x)/60*(empById(x.emp).taux||0));
  const totCA=sum(days,d=>dayCA(d));
  return `<div class="pg-wrap pg9-wrap" id="pg9-wrap"><table class="pg pg9 ${edit?'editable':''}" id="pg9" ${edit?'tabindex="0" aria-label="Grille du planning : flèches pour se déplacer, Entrée pour modifier, taper des heures pour ajouter un shift"':''}>${head}<tbody>${body}</tbody><tfoot>${foot.join('')}</tfoot></table></div>
   <div class="row wrap pl-legend" style="justify-content:space-between;margin-top:10px">
     <div class="legend">${POSTE_ORDER.filter(p=>EMP.some(e=>e.poste===p)).map(p=>`<span data-poste="${p}"><i></i>${POSTES[p].l}</span>`).join('')}${w===0?'<span><i style="background:#7CF0AE;border-radius:50%"></i>Pointé</span>':''}${df&&df.n?'<span><i class="chg-i"></i>Modifié depuis la publication</span>':''}</div>
     <div class="muted tnum" style="font-size:13px">Semaine : <b>${dur(totH)}</b> planifiées${can.salaries?` · <b>${eur(totC,0)}</b>${totCA?` · ${pc(totC/totCA)} du CA prévu`:''}`:''}</div>
   </div>`;
}

/* ---------- jour : la frise ---------- */
function dayView9(w,d,edit){
  const can=CAN();const P=UI.plan;
  const tabs=`<div class="seg day-tabs" role="group" aria-label="Jour">${[0,1,2,3,4,5,6].map(i=>`<button data-act="plan-day" data-d="${i}" aria-pressed="${i===d}">${JC[i]} ${dateAt(w,i).getDate()}</button>`).join('')}</div>`;
  if(isClosed(d))return tabs+`<div class="panel"><div class="empty"><h3>Restaurant fermé</h3><p>Jour de fermeture hebdomadaire.</p></div></div>`;
  const H0=420,H1=1560,span=H1-H0;const X=m=>((m-H0)/span*100).toFixed(3)+'%';
  const today=w===0&&d===TIDX;const now=nowMin();
  const rush=`<span class="rush" style="left:${X(720)};width:${(120/span*100).toFixed(3)}%"></span><span class="rush" style="left:${X(1170)};width:${(120/span*100).toFixed(3)}%"></span>`;
  const hours=[];for(let h=7;h<=26;h++)hours.push(h);
  const headRow=`<div class="tl-row tl-head"><div></div><div class="track">${hours.map(h=>`<span style="left:${X(h*60)}">${pad(h%24)}h</span>`).join('')}</div></div>`;
  const emps=EMP.filter(e=>(P.filter==='all'||e.poste===P.filter)&&(!e.hidden||empShifts(e.id,w,d).length));
  const rows=emps.map(e=>{
    const sh=empShifts(e.id,w,d);const ab=absOf(e.id,w,d);const na=availOf(e.id,d);
    let real='';
    if(today){const ev=evsOn(e.id,TODAY_ISO);let open=null;ev.forEach(z=>{if(z.t==='in'||z.t==='back')open=z.m;else if(open!=null){real+=`<span class="real" style="left:${X(open)};width:${((z.m-open)/span*100).toFixed(3)}%"></span>`;open=null;}});if(open!=null&&now>open)real+=`<span class="real" style="left:${X(open)};width:${((now-open)/span*100).toFixed(3)}%"></span>`;}
    const bars=sh.map(x=>`<button class="bar" data-poste="${x.poste}" ${edit?`data-act="pl-qe-shift" data-sid="${x.id}"`:''} style="left:${X(sMin(x))};width:${((eMin(x)-sMin(x))/span*100).toFixed(3)}%" title="${x.s}–${x.e}">${x.s}–${x.e}</button>`).join('');
    return `<div class="tl-row"><div class="who">${avatar(e,'s')}<span>${esc(e.prenom)}${ab?` · <span class="faint">${ABS[ab.type]}</span>`:na?` · <span class="faint">pas dispo ${AVAIL_L[na]}</span>`:''}</span>${edit&&!ab?`<button class="icon-btn tl-add" data-act="pl-qe-cell" data-emp="${e.id}" data-d="${d}" aria-label="Ajouter un shift pour ${esc(e.prenom)}">${ic('plus','s')}</button>`:''}</div><div class="track">${rush}${bars}${real}${today&&now>=H0?`<span class="nowl" style="left:${X(now)}"></span>`:''}</div></div>`;
  }).join('');
  const slots=[];let mx=0;
  for(let m=H0;m<H1;m+=30){const mid=m+15;const n=new Set(shiftsWD(w,d).filter(x=>(P.filter==='all'||x.poste===P.filter||(P.filter==='salle'&&x.poste==='manager'))&&sMin(x)<=mid&&eMin(x)>mid).map(x=>x.emp)).size;slots.push({m,n});mx=Math.max(mx,n);}
  const bw=(30/span*100);
  const chart=`<div class="tl-row cov-chart" style="margin-top:14px"><div class="cov-who">Personnes présentes<small>par demi-heure</small></div><div class="track">${slots.map(s=>s.n?`<span class="cb" style="left:calc(${X(s.m)} + 1px);width:calc(${bw.toFixed(3)}% - 2px);height:${(s.n/(mx||1)*56).toFixed(1)}px" title="${hhmm(s.m)} : ${s.n} personne${s.n>1?'s':''}"></span>`:'').join('')}</div></div>`;
  const cv=coverage(w,d);const c=prevOf(d);const note=(S.dayNotes||{})[isoOf(w,d)];const fe=ferieOf(isoOf(w,d));
  const summary=`<div class="kpis" style="margin-bottom:12px">
    <div class="kpi"><div class="l">Couverts prévus</div><div class="v">${c[0]+c[1]}</div><div class="s">${c[0]} midi · ${c[1]} soir${fe?' · '+esc(fe):''}</div></div>
    <div class="kpi"><div class="l">Heures planifiées</div><div class="v">${dur(dayHours(w,d))}</div><div class="s">${nf((c[0]+c[1])/(dayHours(w,d)/60||1),1)} couverts / heure</div></div>
    <div class="kpi"><div class="l">Couverture ${infoBtn('couverture')}</div><div class="v" style="font-size:20px;margin-top:4px">${cv.map(x=>x.miss.length?`<span style="color:var(--warn)">${x.svc} ⚠</span>`:`<span style="color:var(--ok)">${x.svc} ✓</span>`).join(' · ')||'—'}</div><div class="s">${cv.filter(x=>x.miss.length).map(x=>x.miss.map(k=>`${k} ${x.have[k]}/${x.need[k]} (${x.svc})`).join(', ')).join(' · ')||'Effectif suffisant aux coups de feu'}</div></div>
    ${can.salaries?`<div class="kpi"><div class="l">Masse salariale ${infoBtn('masse')}</div><div class="v">${dayCA(d)?pc(dayCost(w,d)/dayCA(d)):'—'}</div><div class="s">${eur(dayCost(w,d),0)} pour ${eur(dayCA(d),0)} de CA</div></div>`:''}
  </div>`;
  return tabs+(note?`<div class="day-note">${ic('note','s')} ${esc(note)} ${edit?`<button class="lnk" data-act="pl-note" data-d="${d}">Modifier</button>`:''}</div>`:'')+summary+`<div class="dayv"><div class="dayv-in">${headRow}${rows||'<p class="faint" style="padding:16px 0">Personne dans ce filtre.</p>'}${chart}
    <div class="tl-legend"><span><i class="rush"></i>Coup de feu</span>${today?'<span><i></i>Présence réelle (pointage)</span>':''}${edit?'<span>Clique un shift pour le modifier, ＋ pour en ajouter</span>':''}</div></div></div>`;
}

/* ---------- mois : vue d'ensemble, congés en un coup d'œil ---------- */
function monthView(edit){
  const P=UI.plan;const first=monthOf(P.mo);const y=first.getFullYear(),mo=first.getMonth();
  const nDays=new Date(y,mo+1,0).getDate();
  const dates=[...Array(nDays)].map((_,i)=>new Date(y,mo,i+1));
  const emps=EMP.filter(e=>(P.filter==='all'||e.poste===P.filter)&&!e.hidden);
  const head=`<thead><tr><th class="ec">Équipe</th>${dates.map(dt=>{const {d}=wdOf(dt);const iso=isoD(dt);const fe=ferieOf(iso);const t=iso===TODAY_ISO;return `<th class="${d>=5?'we':''} ${t?'today':''} ${fe?'fe':''} ${isClosed(d)?'closed':''}" title="${longDate(dt)}${fe?' · '+esc(fe):''}"><small>${JC[d][0]}</small><b>${dt.getDate()}</b></th>`;}).join('')}<th class="mt">Total</th></tr></thead>`;
  const rows=emps.map(e=>{
    let tot=0;
    const cells=dates.map(dt=>{
      const {w,d}=wdOf(dt);const iso=isoD(dt);
      if(isClosed(d))return `<td class="mc closed"></td>`;
      const ab=absOf(e.id,w,d);const sh=empShifts(e.id,w,d);const m=sum(sh,durMin);tot+=m;
      const inner=ab?`<span class="mab a-${ab.type}" title="${ABS[ab.type]}">${ABS_LETTER[ab.type]||'·'}</span>`:m?`<span class="mvh" data-poste="${sh[0].poste}" title="${sh.map(x=>x.s+'–'+x.e).join(' · ')}">${nf(m/60,m%60?1:0)}</span>`:'';
      return `<td class="mc ${d>=5?'we':''} ${iso===TODAY_ISO?'today':''}" data-mgo="${w}|${d}|${e.id}">${inner}</td>`;
    }).join('');
    const ctr=e.contrat*52/12;
    return `<tr><td class="ec"><div class="erow">${avatar(e,'s')}<div class="nm"><b>${esc(e.prenom)}</b><small>${esc(POSTES[e.poste].l)}</small></div></div></td>${cells}<td class="mt tnum"><b>${nf(tot/60,0)} h</b><small>/ ${nf(ctr,0)}</small></td></tr>`;
  }).join('');
  const foot=`<tr><td class="ec">Heures</td>${dates.map(dt=>{const {w,d}=wdOf(dt);return isClosed(d)?'<td class="mc closed"></td>':`<td class="mc tnum">${nf(dayHours(w,d)/60,0)||''}</td>`;}).join('')}<td class="mt"></td></tr>`;
  const legend=`<div class="legend" style="margin-top:10px">${Object.keys(ABS_LETTER).map(k=>`<span><span class="mab a-${k}">${ABS_LETTER[k]}</span>${ABS[k]}</span>`).join('')}<span><span class="mvh" data-poste="salle">7</span>Heures travaillées</span></div>`;
  return `<div class="mv-wrap"><table class="mv">${head}<tbody>${rows}</tbody><tfoot>${foot}</tfoot></table></div>${legend}<p class="faint" style="font-size:12.5px;margin-top:6px">Clique un jour pour ouvrir la semaine.</p>`;
}

/* ---------- mobile : l'agenda jour par jour ---------- */
function agendaView(w,edit){
  const P=UI.plan;
  return `<div class="ag">${[0,1,2,3,4,5,6].map(d=>{
    const dt=dateAt(w,d);const cl=isClosed(d);const today=w===0&&d===TIDX;const iso=isoD(dt);
    const emps=EMP.filter(e=>(P.filter==='all'||e.poste===P.filter)&&(empShifts(e.id,w,d).length||absOf(e.id,w,d)));
    const c=prevOf(d);const note=(S.dayNotes||{})[iso];const fe=ferieOf(iso);
    const op=(S.openShifts||[]).filter(x=>x.w===w&&x.d===d);
    return `<section class="ag-d ${today?'today':''}"><header><b>${JOURS[d]} ${dt.getDate()} ${MC[dt.getMonth()]}${today?' · aujourd’hui':''}</b><small>${cl?'Fermé':`${c[0]+c[1]} couverts · ${dur(dayHours(w,d))}`}${fe?' · '+esc(fe):''}</small></header>
     ${note?`<div class="day-note">${ic('note','s')} ${esc(note)}</div>`:''}
     ${cl?'':emps.map(e=>{const sh=empShifts(e.id,w,d);const ab=absOf(e.id,w,d);return `<${edit?'button':'div'} class="ag-r" ${edit?`data-act="pl-qe-cell" data-emp="${e.id}" data-d="${d}"`:''}>${avatar(e,'s')}<span class="ag-n"><b>${esc(e.prenom)}</b><small>${esc(POSTES[e.poste].l)}</small></span><span class="ag-t">${ab?`<span class="absb a-${ab.type} sm">${ABS[ab.type]}</span>`:sh.map(x=>`<span class="ag-s" data-poste="${x.poste}">${x.s}–${x.e}</span>`).join('')}</span></${edit?'button':'div'}>`;}).join('')||'<p class="faint ag-none">Personne de prévu.</p>'}
     ${op.map(x=>`<div class="ag-r open"><span class="av open-av">${ic('hand','s')}</span><span class="ag-n"><b>À pourvoir</b><small>${POSTES[x.poste].l}</small></span><span class="ag-t"><span class="ag-s" data-poste="${x.poste}">${x.s}–${x.e}</span></span></div>`).join('')}
     ${edit&&!cl?`<button class="ag-add" data-act="ag-add" data-d="${d}">${ic('plus','s')} Ajouter quelqu’un</button>`:''}
    </section>`;}).join('')}</div>`;
}

/* ---------- salarié : Mon planning ---------- */
function nextShiftOf(emp){
  const now=nowMin();
  for(let k=0;k<28;k++){
    const dt=addDays(TODAY,k);const {w,d}=wdOf(dt);if(!S.published[String(w)])continue;
    const sh=empShifts(emp,w,d).filter(x=>k>0||eMin(x)>now);
    if(sh.length)return {dt,w,d,x:sh[0],all:empShifts(emp,w,d)};
  }
  return null;
}
function viewMyPlanning(){
  const e=empById(U.empId);const P=UI.plan;const w=P.w;const pub=!!S.published[String(w)];
  const nx=nextShiftOf(e.id);
  let hero;
  if(nx){
    const k=Math.round((nx.dt-TODAY)/864e5);const when=k===0?'Aujourd’hui':k===1?'Demain':JOURS[nx.d]+' '+nx.dt.getDate()+' '+MC[nx.dt.getMonth()];
    const mates=EMP.filter(o=>o.id!==e.id&&empShifts(o.id,nx.w,nx.d).some(y=>sMin(y)<eMin(nx.x)&&eMin(y)>sMin(nx.x)));
    const inMin=k===0?sMin(nx.x)-nowMin():null;
    hero=`<section class="my-hero"><div class="mh-l"><span class="eyebrow">Prochain service</span><b class="mh-when">${when} · ${nx.x.s}–${nx.x.e}</b><span class="mh-s">${POSTES[nx.x.poste].l} · ${dur(durMin(nx.x))}${nx.x.p?' dont '+nx.x.p+' min de pause':''}${inMin!=null&&inMin>0?' · dans '+dur(inMin):inMin!=null&&inMin<=0?' · en cours':''}</span>${mates.length?`<span class="mh-mates">Avec ${mates.slice(0,5).map(o=>esc(o.prenom)).join(', ')}${mates.length>5?'…':''}</span>`:''}</div><div class="mh-r">${avatar(e)}</div></section>`;
  }else hero=`<section class="my-hero"><div class="mh-l"><span class="eyebrow">Prochain service</span><b class="mh-when">Rien de prévu pour l’instant</b><span class="mh-s">Le prochain planning arrive dès qu’il est publié.</span></div></section>`;
  const seen=newsSeenAt(e.id);
  const news=(S.planNews||[]).filter(n=>n.emp===e.id&&Date.now()-n.at<14*864e5).slice(-4).reverse();
  const newsHTML=news.length?`<section class="panel my-news"><div class="panel-h"><h3>${ic('bell','s')} Ce qui a changé</h3></div><div class="alerts">${news.map(n=>`<div class="al ${n.at>seen?'fresh':''}"><span class="ico brass">${ic('calendar','s')}</span><div><b>${esc(n.txt)}</b><p>${new Date(n.at).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</p></div></div>`).join('')}</div></section>`:'';
  const days=[0,1,2,3,4,5,6].map(d=>{
    const dt=dateAt(w,d);const sh=pub?empShifts(e.id,w,d):[];const ab=absOf(e.id,w,d);const cl=isClosed(d);const past=dt<TODAY;const today=w===0&&d===TIDX;
    const mySwap=x=>(S.swaps||[]).find(s=>s.shiftId===x.id&&s.status==='pending');
    return `<div class="my-day ${today?'today':''} ${past?'past':''}"><div class="md-d"><b>${JC[d]}</b><span>${dt.getDate()}</span></div><div class="md-c">${cl?'<span class="faint">Fermé</span>':ab?`<span class="absb a-${ab.type} sm">${ABS[ab.type]}</span>`:sh.length?sh.map(x=>`<span class="md-s" data-poste="${x.poste}"><b>${x.s}–${x.e}</b><small>${POSTES[x.poste].l} · ${dur(durMin(x))}</small>${!past?(mySwap(x)?`<span class="pill info sm-pill">Échange demandé</span>`:`<button class="lnk" data-act="my-swap" data-sid="${x.id}">Échanger</button>`):''}</span>`).join(''):`<span class="faint">${pub?'Repos':'—'}</span>`}</div></div>`;
  }).join('');
  const m=empWeekMin(e.id,w);
  const opens=(S.openShifts||[]).filter(x=>x.w>=0&&dateAt(x.w,x.d)>=TODAY).sort((a,b)=>(a.w-b.w)||(a.d-b.d)).filter(x=>x.poste===e.poste||(e.skills||[]).includes(x.poste)||e.poste==='manager');
  const opHTML=opens.length?`<section class="panel"><div class="panel-h"><h3>${ic('hand','s')} Shifts à pourvoir</h3><span class="faint" style="font-size:12.5px">Propose-toi, ton responsable valide</span></div><div class="alerts">${opens.map(x=>{const dt=dateAt(x.w,x.d);const mine=(S.swaps||[]).find(s=>s.kind==='take'&&s.openId===x.id&&s.emp===e.id&&s.status==='pending');return `<div class="al"><span class="ico info">${ic('calendar','s')}</span><div><b>${JOURS[x.d]} ${dt.getDate()} ${MC[dt.getMonth()]} · ${x.s}–${x.e}</b><p>${POSTES[x.poste].l} · ${dur(durMin(x))}</p></div><div class="acts">${mine?'<span class="pill info">Proposé</span>':`<button class="btn sm primary" data-act="my-take" data-oid="${x.id}">Je suis dispo</button>`}</div></div>`;}).join('')}</div></section>`:'';
  const myReq=[...(S.requests||[]).filter(r=>r.emp===e.id).map(r=>({t:`${ABS[r.type]||'Congé'} du ${shortDate(pdate(r.from))} au ${shortDate(pdate(r.to))}`,st:r.status})),...(S.swaps||[]).filter(r=>r.emp===e.id).map(r=>({t:swapLabel(r),st:r.status}))].slice(-5).reverse();
  const reqHTML=myReq.length?`<section class="panel"><div class="panel-h"><h3>Mes demandes</h3></div><div class="alerts">${myReq.map(r=>`<div class="al"><div><b>${esc(r.t)}</b></div><div class="acts"><span class="pill ${r.st==='ok'?'ok':r.st==='no'?'bad':'warn'}">${r.st==='ok'?'Acceptée':r.st==='no'?'Refusée':'En attente'}</span></div></div>`).join('')}</div></section>`:'';
  setTimeout(()=>markNewsSeen(e.id),1500);
  return `<div class="ph"><div><h1>Mon planning</h1><p class="sub">Tes services, tes congés, et les shifts où l’équipe a besoin de toi.</p></div><div class="acts"><button class="btn" data-act="my-avail">${ic('clock','s')} Mes disponibilités</button><button class="btn brass" data-act="req-new">${ic('calendar','s')} Demander un congé</button></div></div>
   ${hero}${newsHTML}
   <section class="panel"><div class="panel-h"><div class="wk-nav"><button class="icon-btn" data-act="pl-prev" aria-label="Semaine précédente">${ic('chevL')}</button><span class="lbl2">${weekLabel(w)}</span><button class="icon-btn" data-act="pl-next" aria-label="Semaine suivante">${ic('chevR')}</button></div><span class="tnum" style="font-size:13px"><b>${dur(m)}</b> / ${e.contrat} h</span></div>
    ${pub?`<div class="my-week">${days}</div>`:`<div class="empty" style="padding:22px"><p>Le planning de cette semaine n’est pas encore publié.</p></div>`}
    <div style="padding:10px 16px 14px"><button class="btn sm" data-act="pl-team">${ic('users','s')} Voir le planning de toute l’équipe</button></div></section>
   ${opHTML}${reqHTML}`;
}
function swapLabel(r){
  const x=r.shiftId?S.shifts.find(s=>s.id===r.shiftId):null;const o=r.openId?(S.openShifts||[]).find(s=>s.id===r.openId):null;
  const sh=x||o||r.snap||{};const dt=sh.w!=null?dateAt(sh.w,sh.d):null;const when=dt?`${JC[sh.d]} ${dt.getDate()} ${MC[dt.getMonth()]} ${sh.s}–${sh.e}`:'un shift';
  if(r.kind==='take')return `Se propose pour ${when}`;
  if(r.kind==='give')return `Met à pourvoir son shift du ${when}`;
  return `Échange du ${when} avec ${r.to?empById(r.to).prenom:'un collègue'}`;
}
function newsSeenAt(emp){try{return +localStorage.getItem('leon:news:'+(S&&S.id)+':'+emp)||0;}catch(e){return 0;}}
function markNewsSeen(emp){try{localStorage.setItem('leon:news:'+(S&&S.id)+':'+emp,String(Date.now()));}catch(e){}}

/* ---------- l'éditeur rapide (s'ouvre sur la case) ---------- */
let QE=null;
function qeTarget(){const s=UI.plan.sel;return s&&s.cells&&s.cells.length?s.cells:[];}
function qeOpen(o){
  closeInfo();
  QE={w:UI.plan.w,cells:o.cells||qeTarget(),sid:o.sid||null,oid:o.oid||null,val:o.val||'',dup:[],sheet:isMob()||!!o.sheet};
  if(!QE.cells.length&&!QE.sid&&!QE.oid){QE=null;return;}
  if(QE.sid){const x=S.shifts.find(s=>s.id===QE.sid);if(!x){QE=null;return;}QE.x=clone(x);}
  if(QE.oid){const x=(S.openShifts||[]).find(s=>s.id===QE.oid);if(!x){QE=null;return;}QE.x=clone(x);QE.open=true;}
  qeRender();
}
function qeClose(){QE=null;const r=$('#qe-root');if(r)r.innerHTML='';if(typeof DIRTY!=='undefined'&&DIRTY)scheduleRender();const g=$('#pg9');if(g&&!isMob())try{g.focus({preventScroll:true});}catch(e){}}
function qeHead(){
  const w=QE.w;
  if(QE.x){const x=QE.x;const dt=dateAt(x.w,x.d);const who=QE.open?'À pourvoir · '+POSTES[x.poste].l:empById(x.emp).prenom;return {t:`${who} · ${JOURS[x.d].toLowerCase()} ${dt.getDate()} ${MC[dt.getMonth()]}`,s:QE.open?'Shift sans personne':`${dur(empDayMin(x.emp,x.w,x.d))} ce jour · ${dur(empWeekMin(x.emp,x.w))} / ${empById(x.emp).contrat} h cette semaine`};}
  const cs=QE.cells;
  if(cs.length===1){const c=cs[0];const dt=dateAt(w,c.d);
    if(c.emp[0]==='@')return {t:`À pourvoir · ${POSTES[c.emp.slice(1)].l} · ${JOURS[c.d].toLowerCase()} ${dt.getDate()}`,s:'Un shift que l’équipe pourra prendre'};
    const e=empById(c.emp);return {t:`${e.prenom} · ${JOURS[c.d].toLowerCase()} ${dt.getDate()} ${MC[dt.getMonth()]}`,s:`${dur(empDayMin(e.id,w,c.d))} ce jour · ${dur(empWeekMin(e.id,w))} / ${e.contrat} h cette semaine${availOf(e.id,c.d)?' · pas dispo '+AVAIL_L[availOf(e.id,c.d)]:''}`};}
  const names=[...new Set(cs.map(c=>c.emp[0]==='@'?'À pourvoir':empById(c.emp).prenom))];
  return {t:`${cs.length} cases sélectionnées`,s:names.slice(0,4).join(', ')+(names.length>4?'…':'')};
}
function qePoste(){
  if(QE.x)return QE.x.poste;
  const c=QE.cells[0];if(!c)return 'salle';
  return c.emp[0]==='@'?c.emp.slice(1):empById(c.emp).poste;
}
function qeHTML(){
  const h=qeHead();const poste=qePoste();
  const c0=QE.cells&&QE.cells[0];const e0=!QE.x&&c0&&c0.emp[0]!=='@'?empById(c0.emp):QE.x&&!QE.open?empById(QE.x.emp):null;
  const ok=[poste,...((e0&&e0.skills)||[])];const all=typesFor(poste);const T=all.filter(t=>ok.includes(t.poste)).length?all.filter(t=>ok.includes(t.poste)):all;
  const typeChips=T.slice(0,8).map(t=>`<button class="qe-ty" data-act="qe-type" data-t="${t.id}" data-poste="${t.poste}" title="${t.seg.map(segTxt).join(' + ')}"><i></i><b>${esc(t.l)}</b><small>${t.seg.map(g=>g.s+'–'+g.e).join(' + ')}</small></button>`).join('');
  const onlyOpen=QE.open||QE.cells.every(c=>c.emp[0]==='@');
  const absChips=onlyOpen?'':`<div class="qe-abs">${['repos','cp','maladie','indispo','formation','recup','evt','absinj'].map(k=>`<button class="qe-ab a-${k}" data-act="qe-abs" data-k="${k}">${ABS_SHORT[k]}</button>`).join('')}</div>`;
  let body='';
  if(QE.x){
    const x=QE.x;
    const empOpts=QE.open?`<option value="">Personne (à pourvoir)</option>${EMP.filter(o=>!o.hidden).map(o=>`<option value="${o.id}">${esc(o.prenom)} ${esc(o.nom)} · ${esc(POSTES[o.poste].l)}</option>`).join('')}`:'';
    body=`<div class="qe-grid">
      <div class="field"><label for="qe-s">Début</label><input class="inp" type="time" step="900" id="qe-s" value="${x.s}" data-qe-f="s"></div>
      <div class="field"><label for="qe-e">Fin</label><input class="inp" type="time" step="900" id="qe-e" value="${x.e}" data-qe-f="e"></div>
      <div class="field"><label for="qe-p">Pause</label><select class="inp" id="qe-p" data-qe-f="p">${[0,15,20,30,45,60].map(v=>`<option value="${v}" ${v===(x.p||0)?'selected':''}>${v?v+' min':'Aucune'}</option>`).join('')}</select></div>
      <div class="field"><label for="qe-po">Poste</label><select class="inp" id="qe-po" data-qe-f="poste">${POSTE_ORDER.filter(p=>EMP.some(e=>e.poste===p)||p===x.poste).map(p=>`<option value="${p}" ${p===x.poste?'selected':''}>${POSTES[p].l}</option>`).join('')}</select></div>
      ${QE.open?`<div class="field full"><label for="qe-who">Attribuer à</label><select class="inp" id="qe-who">${empOpts}</select></div>`:''}
    </div>
    <div class="qe-sum" id="qe-sum">${qeSum()}</div>
    ${!QE.open?`<div class="qe-dup"><span class="lbl">Copier aussi sur</span><div class="days-pick">${[0,1,2,3,4,5,6].map(d=>`<label class="${isClosed(d)||d===x.d?'dis':''}"><input type="checkbox" data-qe-dup="${d}" ${isClosed(d)||d===x.d?'disabled':''}>${JC[d]}</label>`).join('')}</div></div>`:''}
    <div class="qe-types">${typeChips}</div>`;
  }else{
    const c0=QE.cells.length===1?QE.cells[0]:null;
    const cur=c0?(c0.emp[0]==='@'?openAt(QE.w,c0.d,c0.emp.slice(1)).map(x=>({x,open:1})):empShifts(c0.emp,QE.w,c0.d).map(x=>({x,open:0}))):[];
    const curHTML=cur.length?`<div class="qe-cur"><span class="lbl">Déjà prévu</span>${cur.map(({x,open})=>`<button class="qe-cs" data-act="qe-edit-sid" data-sid="${x.id}" data-open="${open}" data-poste="${x.poste}"><b>${x.s}–${x.e}</b><small>${dur(durMin(x))}${x.p?' · p. '+x.p+'′':''}</small>${ic('edit','s')}</button>`).join('')}</div>`:'';
    body=`${curHTML}<div class="qe-inw"><input class="inp qe-in" id="qe-in" autocomplete="off" spellcheck="false" enterkeyhint="done" placeholder="${onlyOpen?'11-15, 18h30-23h…':'11-15, 18h30-23h, soir, cp, repos…'}" value="${esc(QE.val)}" aria-describedby="qe-prev"><span class="kbd-h">Entrée</span></div>
    <div class="qe-prev" id="qe-prev" aria-live="polite">${qePrevHTML()}</div>
    <div class="qe-types">${typeChips}</div>${absChips}`;
  }
  const hasContent=!QE.x&&QE.cells.some(c=>c.emp[0]==='@'?openAt(QE.w,c.d,c.emp.slice(1)).length:(empShifts(c.emp,QE.w,c.d).length||absOf(c.emp,QE.w,c.d)));
  const foot=QE.x?`<div class="qe-f"><button class="btn sm danger" data-act="qe-del">${ic('trash','s')} Supprimer</button>${!QE.open?`<button class="btn sm" data-act="qe-toopen" title="Retirer ce shift de ${esc(empById(QE.x.emp).prenom)} et le proposer à l’équipe">${ic('hand','s')} À pourvoir</button>`:''}<span class="sp"></span><button class="btn sm primary" data-act="qe-save">Enregistrer</button></div>`
    :`<div class="qe-f">${hasContent?`<button class="btn sm ghost" data-act="qe-clear">${ic('trash','s')} Vider</button>`:''}<span class="faint qe-hint">Échap pour fermer</span><span class="sp"></span><button class="btn sm primary" data-act="qe-apply">Valider</button></div>`;
  return `<div class="qe ${QE.sheet?'sheet':''}" role="dialog" aria-label="${esc(h.t)}"><div class="qe-h"><div><b>${esc(h.t)}</b><small>${esc(h.s)}</small></div><button class="icon-btn" data-act="qe-close" aria-label="Fermer">${ic('x','s')}</button></div>${body}${foot}</div>`;
}
function qePrevHTML(){
  if(!QE||QE.x)return '';
  const P=parseCell(QE.val,qePoste());
  if(!P)return `<span class="faint">Tape des heures ou choisis ci-dessous.</span>`;
  if(P.kind==='bad')return `<span class="bad">${esc(P.label)}</span>`;
  const auto=P.kind==='shifts'&&P.segs.some(g=>g.auto)?' · pause de 20 min ajoutée (plus de 6 h)':'';
  const c0=QE.cells.length===1?QE.cells[0]:null;
  const has=c0&&(P.kind==='shifts'||P.kind==='type')&&(c0.emp[0]==='@'?openAt(QE.w,c0.d,c0.emp.slice(1)).length:empShifts(c0.emp,QE.w,c0.d).length);
  const rep=has?(P.append?' · ajouté à ce qui est déjà prévu':' · remplace ce qui est prévu (commence par + pour ajouter)'):'';
  return `<span class="ok">→ ${esc(P.label)}${auto}</span><span class="faint">${rep}</span>`;
}
function qeSum(){
  if(!QE||!QE.x)return '';
  const x=QE.x;if(!/^\d\d:\d\d$/.test(x.s)||!/^\d\d:\d\d$/.test(x.e)||x.s===x.e)return `<span class="bad">Heures incomplètes.</span>`;
  const dm=durMin(x);const lines=[`<b>${dur(dm)}</b> de travail${x.p?` (pause de ${x.p} min déduite)`:''}`];
  if(!QE.open){
    const e=empById(x.emp);const others=empShifts(x.emp,x.w,x.d).filter(s=>s.id!==QE.sid);
    const dayTot=sum(others,durMin)+dm;const wk=empWeekMin(x.emp,x.w)-durMin(S.shifts.find(s=>s.id===QE.sid)||{s:'00:00',e:'00:00'})+dm;
    lines[0]+=` · ${dur(dayTot)} sur la journée · ${dur(wk)} / ${e.contrat} h`;
    if(dm+(x.p||0)>360&&!x.p)lines.push(`<span class="warn">Plus de 6 h d’affilée : ajoute 20 min de pause.</span>`);
    if(dayTot>maxDayMin(e))lines.push(`<span class="bad">Au-delà de ${dur(maxDayMin(e))} sur la journée.</span>`);
    if(others.some(o=>sMin(o)<eMin(x)&&eMin(o)>sMin(x)))lines.push(`<span class="bad">Chevauche un autre shift de ${esc(e.prenom)}.</span>`);
    const cl=availClash(x);if(cl)lines.push(`<span class="warn">${esc(e.prenom)} n’est pas dispo ${AVAIL_L[cl]} ce jour-là.</span>`);
  }
  return lines.join('<br>');
}
function qeRender(){
  let r=$('#qe-root');if(!r){r=document.createElement('div');r.id='qe-root';document.body.appendChild(r);}
  r.innerHTML=QE?qeHTML():'';
  if(!QE)return;
  qePlace();
  const i=$('#qe-in');if(i&&(!QE.sheet||QE.val)){i.focus();try{i.setSelectionRange(i.value.length,i.value.length);}catch(e){}}
  else{const s=$('#qe-s');if(s&&!QE.sheet)s.focus();}
}
function qeAnchor(){
  if(QE.x){if(QE.open)return $(`[data-oid="${QE.x.id}"]`);return $(`#pg9 [data-sid="${QE.x.id}"]`)||$(`.tl-row [data-sid="${QE.x.id}"]`)||$(`#pg9 td[data-emp="${QE.x.emp}"][data-d="${QE.x.d}"]`);}
  const c=QE.cells[QE.cells.length-1];if(!c)return null;
  return $(`#pg9 td[data-emp="${CSS.escape(c.emp)}"][data-d="${c.d}"]`)||$(`.tl-row [data-emp="${CSS.escape(c.emp)}"]`);
}
function qePlace(){
  const box=$('#qe-root .qe');if(!box)return;
  if(QE.sheet){box.style.left='';box.style.top='';return;}
  const a=qeAnchor();const bw=box.offsetWidth,bh=box.offsetHeight;
  let left=(window.innerWidth-bw)/2,top=Math.max(12,(window.innerHeight-bh)/2);
  if(a){const b=a.getBoundingClientRect();left=clamp(b.left+b.width/2-bw/2,12,window.innerWidth-bw-12);top=b.bottom+6;if(top+bh>window.innerHeight-12)top=Math.max(12,b.top-bh-6);}
  box.style.left=left+'px';box.style.top=top+'px';
}

/* ---------- re-rendu fluide : on garde le défilement et la sélection ---------- */
function planRender(){
  if(UI.view!=='planning'){renderView();return;}
  const wrap=$('#pg9-wrap');const sl=wrap?wrap.scrollLeft:0;const y=window.scrollY;
  const hadFocus=document.activeElement&&document.activeElement.id==='pg9';
  renderView();
  const w2=$('#pg9-wrap');if(w2)w2.scrollLeft=sl;window.scrollTo(0,y);
  if(hadFocus){const g=$('#pg9');if(g)try{g.focus({preventScroll:true});}catch(e){}}
  if(QE)qeRender();
}
function selPaint(){
  $$('#pg9 td.sel').forEach(td=>td.classList.remove('sel'));$$('#pg9 .s9.on').forEach(x=>x.classList.remove('on'));
  const s=UI.plan.sel;if(!s)return;
  (s.cells||[]).forEach(c=>{const td=$(`#pg9 td[data-emp="${CSS.escape(c.emp)}"][data-d="${c.d}"]`);if(td)td.classList.add('sel');});
  if(s.shift){const el=$(`#pg9 [data-sid="${s.shift}"],#pg9 [data-oid="${s.shift}"]`);if(el)el.classList.add('on');}
  const last=s.cells&&s.cells[s.cells.length-1];
  if(last){const td=$(`#pg9 td[data-emp="${CSS.escape(last.emp)}"][data-d="${last.d}"]`);if(td){const wr=$('#pg9-wrap');const r=td.getBoundingClientRect(),R=wr.getBoundingClientRect();const ec=$('#pg9 .ec');const ew=ec?ec.offsetWidth:200;if(r.left<R.left+ew)wr.scrollLeft-= (R.left+ew-r.left)+8;else if(r.right>R.right)wr.scrollLeft+=r.right-R.right+8;if(r.top<70||r.bottom>window.innerHeight-10)td.scrollIntoView({block:'nearest'});}}
}
