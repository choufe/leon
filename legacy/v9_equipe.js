/* =========================================================
   V9 · ÉQUIPE — congés & absences, échanges, paie, fiche salarié
   ========================================================= */
UI.conges={tab:'valider'};
UI.paie={mo:TODAY.getDate()<=10?-1:0};
function dateRange(from,to){const a=pdate(from),b=pdate(to);const out=[];for(let d=new Date(a);d<=b&&out.length<120;d=addDays(d,1))out.push(new Date(d));return out;}
function rangeLabel(from,to){const a=pdate(from),b=pdate(to);return from===to?`le ${a.getDate()} ${MC[a.getMonth()]}`:`du ${a.getDate()}${a.getMonth()!==b.getMonth()?' '+MC[a.getMonth()]:''} au ${b.getDate()} ${MC[b.getMonth()]}`;}
function ouvrables(from,to){return dateRange(from,to).filter(dt=>{const {d}=wdOf(dt);return d!==6&&!ferieOf(isoD(dt));}).length;}

/* ---------- impact d'une demande de congé ---------- */
function reqImpact(r){
  const e=empById(r.emp);const days=dateRange(r.from,r.to);let shifts=0;const busy=[];
  days.forEach(dt=>{const {w,d}=wdOf(dt);if(isClosed(d))return;shifts+=empShifts(r.emp,w,d).length;
    const others=S.absences.filter(a=>a.w===w&&a.d===d&&a.emp!==r.emp&&a.type!=='repos'&&empById(a.emp).poste===e.poste).map(a=>empById(a.emp).prenom);
    if(others.length)busy.push(`${JC[d]} ${dt.getDate()} : ${others.join(', ')}`);});
  const bits=[];
  if(shifts)bits.push(`${plur(shifts,'shift planifié retiré','shifts planifiés retirés')}`);
  if(busy.length)bits.push(`déjà absents en ${POSTES[e.poste].l.toLowerCase()} — ${busy.slice(0,3).join(' · ')}`);
  if(r.type==='cp'){const c=cpInfo(e);if(c)bits.push(`solde après : ${nf(c.apres-ouvrables(r.from,r.to),1)} j`);}
  return bits;
}

/* ---------- vue Congés & absences ---------- */
function viewConges(){
  const staff=effRole()==='staff';
  if(staff)return viewMesConges();
  const can=CAN();
  const reqs=(S.requests||[]).filter(r=>r.status==='pending').sort((a,b)=>a.from<b.from?-1:1);
  const sws=(S.swaps||[]).filter(r=>r.status==='pending');
  const pend=reqs.length+sws.length;
  const T=UI.conges.tab;
  const tabs=`<div class="tabs" role="tablist">${[['valider','À valider',pend],['absences','Absences',0],['compteurs','Compteurs de congés',0]].map(([k,l,n])=>`<button role="tab" aria-selected="${T===k}" data-act="cg-tab" data-t="${k}">${l}${n?` <span class="nb info">${n}</span>`:''}</button>`).join('')}</div>`;
  let body='';
  if(T==='valider'){
    const reqHTML=reqs.map(r=>{const e=empById(r.emp);const imp=reqImpact(r);const n=ouvrables(r.from,r.to);
      return `<div class="rq-card"><div class="rq-h">${avatar(e)}<div><b>${esc(e.prenom)} ${esc(e.nom)}</b><small>${esc(POSTES[e.poste].l)}</small></div><span class="pill ${r.type==='cp'?'brass':''}">${ABS[r.type]||r.type}</span></div>
       <p class="rq-t">${rangeLabel(r.from,r.to)}${r.type==='cp'?` · ${plur(n,'jour ouvrable','jours ouvrables')}`:''}${r.note?` · « ${esc(r.note)} »`:''}</p>
       ${imp.length?`<p class="rq-i">${ic('alert','s')} ${esc(imp.join(' · '))}</p>`:`<p class="rq-i ok">${ic('check','s')} Pas de conflit avec l’équipe</p>`}
       <div class="rq-a"><button class="btn sm" data-act="req-no" data-id="${r.id}">Refuser</button><button class="btn sm primary" data-act="req-ok" data-id="${r.id}">Accepter</button></div></div>`;}).join('');
    const swHTML=sws.map(r=>{const e=empById(r.emp);const sh=r.snap||{};const dt=sh.w!=null?dateAt(sh.w,sh.d):null;const still=r.kind==='take'?(S.openShifts||[]).some(o=>o.id===r.openId):S.shifts.some(x=>x.id===r.shiftId);
      const t=r.kind==='take'?`se propose pour le shift à pourvoir`:r.kind==='give'?`met son shift à pourvoir`:`donne son shift à <b>${esc(empById(r.to).prenom)}</b>`;
      let chk='';if(r.kind==='swap'&&r.to&&sh.w!=null){const x={emp:r.to,w:sh.w,d:sh.d,s:sh.s,e:sh.e};const busy=empShifts(r.to,sh.w,sh.d).some(y=>sMin(y)<eMin(x)&&eMin(y)>sMin(x));const m=empWeekMin(r.to,sh.w)+durMin(x);const o=empById(r.to);chk=busy?`${esc(o.prenom)} travaille déjà sur ce créneau`:`${esc(o.prenom)} passerait à ${dur(m)} / ${o.contrat} h`;}
      if(r.kind==='take'&&sh.w!=null){const m=empWeekMin(r.emp,sh.w)+durMin(sh);chk=`${esc(e.prenom)} passerait à ${dur(m)} / ${e.contrat} h`;}
      return `<div class="rq-card"><div class="rq-h">${avatar(e)}<div><b>${esc(e.prenom)} ${esc(e.nom)}</b><small>${esc(POSTES[e.poste].l)}</small></div><span class="pill info">${r.kind==='take'?'Shift à pourvoir':'Échange'}</span></div>
       <p class="rq-t">${t}${dt?` · ${JOURS[sh.d]} ${dt.getDate()} ${MC[dt.getMonth()]} · ${sh.s}–${sh.e}`:''}${r.note?` · « ${esc(r.note)} »`:''}</p>
       ${!still?`<p class="rq-i">${ic('alert','s')} Ce shift a changé depuis la demande</p>`:chk?`<p class="rq-i ${/déjà/.test(chk)?'':'ok'}">${ic(/déjà/.test(chk)?'alert':'clock','s')} ${chk}</p>`:''}
       <div class="rq-a"><button class="btn sm" data-act="sw-no" data-id="${r.id}">Refuser</button><button class="btn sm primary" data-act="sw-ok" data-id="${r.id}" ${still?'':'disabled'}>Valider</button></div></div>`;}).join('');
    body=pend?`<div class="rq-grid">${reqHTML}${swHTML}</div>`:`<div class="panel"><div class="empty"><h3>Rien à valider</h3><p>Les demandes de congé, les échanges de shifts et les volontaires pour les shifts à pourvoir arrivent ici.</p></div></div>`;
    const done=[...(S.requests||[]).filter(r=>r.status!=='pending'),...(S.swaps||[]).filter(r=>r.status!=='pending')].slice(-6).reverse();
    if(done.length)body+=`<section class="panel" style="margin-top:18px"><div class="panel-h"><h3>Déjà traité</h3></div><div class="alerts">${done.map(r=>`<div class="al"><span class="av-w">${avatar(empById(r.emp),'s')}</span><div><b>${esc(empById(r.emp).prenom)}</b><p>${r.from?`${ABS[r.type]||'Congé'} ${rangeLabel(r.from,r.to)}`:esc(swapLabel(r))}</p></div><div class="acts"><span class="pill ${r.status==='ok'?'ok':'bad'}">${r.status==='ok'?'Acceptée':'Refusée'}</span></div></div>`).join('')}</div></section>`;
  }
  if(T==='absences'){
    const list=[];const lim=addDays(TODAY,60);const start=addDays(TODAY,-7);
    S.absences.filter(a=>a.type!=='repos').forEach(a=>{const dt=dateAt(a.w,a.d);if(dt>=start&&dt<=lim)list.push({a,dt});});
    list.sort((x,y)=>x.dt-y.dt);
    const groups=[];list.forEach(({a,dt})=>{const g=groups.find(g=>g.emp===a.emp&&g.type===a.type&&Math.round((dt-g.to)/864e5)<=2);if(g){g.to=dt;g.ids.push(a.id);g.n++;}else groups.push({emp:a.emp,type:a.type,from:dt,to:dt,ids:[a.id],n:1,note:a.note});});
    body=`<section class="panel"><div class="panel-h"><h3>Absences des 2 prochains mois</h3><span class="faint" style="font-size:12.5px">${plur(groups.length,'période')}</span></div>${groups.length?`<div class="alerts">${groups.map(g=>{const e=empById(g.emp);return `<div class="al"><span class="av-w">${avatar(e,'s')}</span><div><b>${esc(e.prenom)} · ${ABS[g.type]}</b><p>${g.n===1?longDate(g.from):`du ${longDate(g.from)} au ${longDate(g.to)}`}${g.note?' · '+esc(g.note):''}</p></div><div class="acts"><button class="btn sm ghost" data-act="abs-del" data-ids="${g.ids.join(',')}">${ic('trash','s')} Retirer</button></div></div>`;}).join('')}</div>`:'<div class="empty"><p>Aucune absence prévue. Les congés acceptés et les absences posées au planning apparaissent ici.</p></div>'}</section>`;
  }
  if(T==='compteurs'){
    const rows=EMP.filter(e=>!e.hidden).map(e=>{const c=cpInfo(e);return `<tr><td><div class="name-cell">${avatar(e,'s')}<div class="cell-name"><b>${esc(e.prenom)} ${esc(e.nom)}</b><small>${esc(POSTES[e.poste].l)}</small></div></div></td>${c?`<td class="tnum">${nf(c.depart,1)} j <small class="faint">au ${shortDate(pdate(c.au))}</small></td><td class="tnum">+${nf(c.acquis,1)} j</td><td class="tnum">−${nf(c.pris,0)} j</td><td class="tnum">${c.poses?nf(c.poses,0)+' j':'—'}</td><td class="tnum"><b class="${c.solde<0?'bad-t':''}">${nf(c.solde,1)} j</b></td>`:`<td colspan="5"><span class="faint">Solde de départ à renseigner</span></td>`}<td>${can.team?`<button class="btn sm" data-act="cp-edit" data-id="${e.id}">${c?'Modifier':'Renseigner'}</button>`:''}</td></tr>`;}).join('');
    body=`<section class="panel"><div class="panel-h"><h3>Congés payés ${infoBtn('cp')}</h3><span class="faint" style="font-size:12.5px">2,5 jours ouvrables par mois</span></div><div class="tbl-wrap"><table class="tbl mgrid"><thead><tr><th>Salarié</th><th>Départ</th><th>Acquis</th><th>Pris</th><th>Posés à venir</th><th>Solde</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }
  return `<div class="ph"><div><h1>Congés & absences</h1><p class="sub">Les demandes de l’équipe, les absences à venir et les soldes de congés.</p></div><div class="acts"><button class="btn brass" data-act="abs-new">${ic('plus','s')} Poser une absence</button></div></div>${tabs}${body}`;
}
function viewMesConges(){
  const e=empById(U.empId);const c=cpInfo(e);
  const mine=[...(S.requests||[]).filter(r=>r.emp===e.id)].reverse();
  const up=S.absences.filter(a=>a.emp===e.id&&a.type!=='repos'&&dateAt(a.w,a.d)>=TODAY).sort((a,b)=>dateAt(a.w,a.d)-dateAt(b.w,b.d));
  return `<div class="ph"><div><h1>Mes congés</h1><p class="sub">Ton solde, tes demandes et tes absences à venir.</p></div><div class="acts"><button class="btn" data-act="my-avail">${ic('clock','s')} Mes disponibilités</button><button class="btn brass" data-act="req-new">${ic('calendar','s')} Demander un congé</button></div></div>
   <div class="kpis" style="margin-bottom:18px"><div class="kpi"><div class="l">Solde de congés ${infoBtn('cp')}</div><div class="v">${c?nf(c.solde,1)+' j':'—'}</div><div class="s">${c?`${nf(c.acquis,1)} j acquis depuis le ${shortDate(pdate(c.au))}${c.poses?' · '+nf(c.poses,0)+' j déjà posés à venir':''}`:'Ton responsable n’a pas encore renseigné ton solde'}</div></div>
   <div class="kpi"><div class="l">Demandes en cours</div><div class="v">${mine.filter(r=>r.status==='pending').length}</div><div class="s">Tu es prévenu dès qu’elles sont traitées</div></div></div>
   <section class="panel"><div class="panel-h"><h3>Mes demandes</h3></div>${mine.length?`<div class="alerts">${mine.map(r=>`<div class="al"><div><b>${ABS[r.type]||'Congé'} ${rangeLabel(r.from,r.to)}</b><p>${r.note?esc(r.note):'&nbsp;'}</p></div><div class="acts"><span class="pill ${r.status==='ok'?'ok':r.status==='no'?'bad':'warn'}">${r.status==='ok'?'Acceptée':r.status==='no'?'Refusée':'En attente'}</span></div></div>`).join('')}</div>`:'<div class="empty"><p>Aucune demande pour l’instant.</p></div>'}</section>
   <section class="panel" style="margin-top:18px"><div class="panel-h"><h3>Mes absences à venir</h3></div>${up.length?`<div class="alerts">${up.map(a=>`<div class="al"><div><b>${ABS[a.type]}</b><p>${longDate(dateAt(a.w,a.d))}</p></div></div>`).join('')}</div>`:'<div class="empty"><p>Rien de prévu.</p></div>'}</section>`;
}

/* ---------- vue Paie : les variables du mois ---------- */
function paieData(mo){
  const first=monthOf(mo);const y=first.getFullYear(),m=first.getMonth();const n=new Date(y,m+1,0).getDate();
  const dates=[...Array(n)].map((_,i)=>new Date(y,m,i+1));
  const minOf=(emp,dt)=>{const iso=isoD(dt);const {w,d}=wdOf(dt);const sh=empShifts(emp,w,d);const ev=evsOn(emp,iso);
    if(dt<TODAY)return ev.length?{m:workedMin(ev,false),src:'pt',sh,ev}:{m:sum(sh,durMin),src:'pl',sh,ev};
    if(iso===TODAY_ISO)return ev.length?{m:Math.max(workedMin(ev,true),0),src:'pt',sh,ev}:{m:sum(sh,durMin),src:'pl',sh,ev};
    return {m:sum(sh,durMin),src:'fut',sh,ev};};
  const rows=EMP.map(e=>{
    const R={e,min:0,night:0,sun:0,fer:0,meals:0,abs:{},late:0,h10:0,h20:0,h50:0,compl:0,fut:false,pl:0};
    dates.forEach(dt=>{
      const {w,d}=wdOf(dt);const iso=isoD(dt);const ab=absOf(e.id,w,d);
      if(ab&&ab.type!=='repos')R.abs[ab.type]=(R.abs[ab.type]||0)+1;
      const x=minOf(e.id,dt);if(x.src==='fut')R.fut=true;if(x.src==='pl'&&x.m)R.pl++;
      R.min+=x.m;
      if(x.m){R.night+=sum(x.sh,nightMin);if(d===6)R.sun+=x.m;if(ferieOf(iso))R.fer+=x.m;R.meals+=mealsOfDay(x.sh);}
      const ins=x.ev.filter(z=>z.t==='in');x.sh.forEach((s,i)=>{if(ins[i]&&ins[i].m>sMin(s)+5)R.late++;});
    });
    /* semaines qui se terminent dans le mois */
    const firstSun=addDays(first,6-((first.getDay()+6)%7));
    for(let k=0;k<6;k++){
      const su=addDays(firstSun,7*k);if(su.getMonth()!==m||su.getFullYear()!==y)break;
      let wm=0;for(let j=6;j>=0;j--)wm+=minOf(e.id,addDays(su,-j)).m;
      const b=hsBrackets(wm);R.h10+=b.h10;R.h20+=b.h20;R.h50+=b.h50;
      if(e.contrat<35)R.compl+=Math.max(0,wm/60-e.contrat);
    }
    R.ctr=e.contrat*52/12;
    return R;
  }).filter(R=>R.min||Object.keys(R.abs).length||!R.e.hidden);
  return {first,rows};
}
function viewPaie(){
  if(!CAN().salaries)return `<div class="ph"><div><h1>Paie</h1></div></div><div class="panel"><div class="empty"><p>Réservé à la direction.</p></div></div>`;
  const mo=UI.paie.mo;const {first,rows}=paieData(mo);const mk=monthKey(first);const val=(S.paieVal||{})[mk];
  const cur=mo===0;const h=m=>nf(m/60,1);
  const absTxt=R=>Object.keys(R.abs).map(k=>`${R.abs[k]} ${ABS_LETTER[k]||k}`).join(' · ')||'—';
  const tot=k=>sum(rows,R=>R[k]);
  const table=`<div class="tbl-wrap"><table class="tbl paie-t"><thead><tr><th>Salarié</th><th>Contrat</th><th>Heures</th><th>Écart</th><th>Sup. +10 %</th><th>Sup. +20 %</th><th>Sup. +50 %</th><th>Compl.</th><th>Nuit ${infoBtn('nuit')}</th><th>Dimanche</th><th>Férié</th><th>Absences</th><th>Repas ${infoBtn('repas')}</th><th>Retards</th></tr></thead><tbody>${rows.map(R=>{const ec=R.min/60-R.ctr;return `<tr><td><div class="name-cell">${avatar(R.e,'s')}<div class="cell-name"><b>${esc(R.e.prenom)} ${esc(R.e.nom)}</b><small>${esc(CONTRAT_TYPES[R.e.typeContrat]||'CDI')} · ${R.e.contrat} h/sem.</small></div></div></td><td class="tnum">${nf(R.ctr,1)} h</td><td class="tnum"><b>${h(R.min)} h</b>${R.pl?`<small class="faint" title="Jours sans pointage : heures du planning">${R.pl} j planifiés</small>`:''}</td><td class="tnum ${ec>0.5?'warn-t':ec<-8?'info-t':''}">${ec>=0?'+':''}${nf(ec,1)} h</td><td class="tnum">${R.h10?nf(R.h10,1)+' h':'—'}</td><td class="tnum">${R.h20?nf(R.h20,1)+' h':'—'}</td><td class="tnum">${R.h50?nf(R.h50,1)+' h':'—'}</td><td class="tnum">${R.compl?nf(R.compl,1)+' h':'—'}</td><td class="tnum">${R.night?h(R.night)+' h':'—'}</td><td class="tnum">${R.sun?h(R.sun)+' h':'—'}</td><td class="tnum">${R.fer?h(R.fer)+' h':'—'}</td><td>${absTxt(R)}</td><td class="tnum">${R.meals||'—'}</td><td class="tnum">${R.late||'—'}</td></tr>`;}).join('')}</tbody>
   <tfoot><tr><td>Total</td><td class="tnum">${nf(tot('ctr'),0)} h</td><td class="tnum"><b>${h(tot('min'))} h</b></td><td></td><td class="tnum">${nf(tot('h10'),1)} h</td><td class="tnum">${nf(tot('h20'),1)} h</td><td class="tnum">${nf(tot('h50'),1)} h</td><td class="tnum">${nf(tot('compl'),1)} h</td><td class="tnum">${h(tot('night'))} h</td><td class="tnum">${h(tot('sun'))} h</td><td class="tnum">${h(tot('fer'))} h</td><td></td><td class="tnum">${tot('meals')}</td><td class="tnum">${tot('late')}</td></tr></tfoot></table></div>`;
  const ml=MOIS[first.getMonth()]+' '+first.getFullYear();
  return `<div class="ph"><div><h1>Paie</h1><p class="sub">Les variables de paie de ${ml}, prêtes pour ton comptable. ${infoBtn('paieExport')}</p></div><div class="acts">${val?`<span class="pill ok"><span class="dot"></span>Validé par ${esc(val.by)}</span>`:''}<button class="btn" data-act="paie-copy">${ic('copy','s')} Copier</button><button class="btn" data-act="paie-csv">${ic('download','s')} Fichier CSV</button>${!val?`<button class="btn primary" data-act="paie-val">${ic('check','s')} Valider ${MOIS[first.getMonth()]}</button>`:''}</div></div>
   <div class="pl-bar"><div class="wk-nav"><button class="icon-btn" data-act="paie-m" data-dir="-1" aria-label="Mois précédent">${ic('chevL')}</button><span class="lbl2">${ml.charAt(0).toUpperCase()+ml.slice(1)}</span><button class="icon-btn" data-act="paie-m" data-dir="1" aria-label="Mois suivant" ${mo>=0?'disabled':''}>${ic('chevR')}</button></div>${cur?'<span class="pill warn">Mois en cours : les jours à venir sont comptés au planning</span>':''}</div>
   ${table}
   <p class="faint" style="font-size:12.5px;margin-top:10px">Heures pointées quand il y a un pointage, sinon celles du planning. Heures sup calculées par semaine (lundi → dimanche) et rattachées au mois où la semaine se termine. Absences en jours (${Object.keys(ABS_LETTER).filter(k=>k!=='repos').map(k=>ABS_LETTER[k]+' = '+ABS[k].toLowerCase()).join(', ')}).</p>`;
}
function paieTable(){
  const {first,rows}=paieData(UI.paie.mo);const d1=(v)=>nf(v,2).replace(/\s/g,'');
  const head=['Salarié','Contrat (h/mois)','Heures réalisées','Écart','HS 10 %','HS 20 %','HS 50 %','Heures complémentaires','Heures de nuit','Heures dimanche','Heures fériées',...Object.keys(ABS_LETTER).filter(k=>k!=='repos').map(k=>'Jours '+ABS[k].toLowerCase()),'Repas','Retards'];
  const body=rows.map(R=>[`${R.e.prenom} ${R.e.nom}`,d1(R.ctr),d1(R.min/60),d1(R.min/60-R.ctr),d1(R.h10),d1(R.h20),d1(R.h50),d1(R.compl),d1(R.night/60),d1(R.sun/60),d1(R.fer/60),...Object.keys(ABS_LETTER).filter(k=>k!=='repos').map(k=>String(R.abs[k]||0)),String(R.meals),String(R.late)]);
  return {first,head,body};
}
async function saveFile(name,text){
  try{if(window.claude&&typeof window.claude.use==='function'){const dl=await window.claude.use('downloads');if(dl){await dl.save({filename:name,data:text});return 'saved';}}}catch(e){if(e&&e.code==='declined')return 'declined';}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);return 'saved';}catch(e){return 'fail';}
}

/* ---------- fiche salarié : entrée, congés, polyvalence ---------- */
{const f=empModal;empModal=function(id){
  f(id);
  const e=id?empById(id):{};const cp=e.cp||{};const sk=e.skills||[];
  const box=$('#modal-root .eperso');if(!box)return;
  const html=`<details class="eperso" open style="margin-top:12px"><summary>Contrat et congés</summary>
    <div class="form-grid" style="margin-top:10px">
     <div class="field"><label for="em-entree">Date d’entrée</label><input class="inp" id="em-entree" type="date" value="${esc(e.entree||'')}"></div>
     <div class="field"><label for="em-cps">Solde de congés (jours)</label><input class="inp" id="em-cps" type="number" step="0.5" min="0" value="${cp.solde!=null?cp.solde:''}" placeholder="Ex. 12,5"></div>
     <div class="field"><label for="em-cpau">Solde au</label><input class="inp" id="em-cpau" type="date" value="${esc(cp.au||isoD(new Date(TODAY.getFullYear(),TODAY.getMonth(),1)))}"></div>
     <div class="field full"><span class="lbl">Peut aussi travailler en</span><div class="days-pick">${POSTE_ORDER.filter(p=>p!=='coiffeur'||EMP.some(o=>o.poste==='coiffeur')).map(p=>`<label><input type="checkbox" data-skill="${p}" ${sk.includes(p)?'checked':''}>${POSTES[p].l}</label>`).join('')}</div><small class="faint">Léon s’en sert pour proposer des remplaçants et remplir la semaine.</small></div>
    </div></details>`;
  box.insertAdjacentHTML('beforebegin',html);
};}
{const f=ACT['emp-save'];ACT['emp-save']=function(t,ev){
  if(EM){const g=id=>{const el=$('#'+id);return el?el.value.trim():'';};
    const ent=g('em-entree');if(ent)EM.entree=ent;else delete EM.entree;
    const cs=g('em-cps');if(cs!==''){EM.cp={solde:parseFloat(cs.replace(',','.'))||0,au:g('em-cpau')||TODAY_ISO};}
    const sk=$$('#modal-root [data-skill]').filter(x=>x.checked).map(x=>x.dataset.skill);EM.skills=sk;}
  return f(t,ev);
};}

/* ---------- demande de congé acceptée : l'intéressé est prévenu ---------- */
{const f=acceptReq;acceptReq=function(r){f(r);pushNews(r.emp,wOf(isoD(addDays(pdate(r.from),-((pdate(r.from).getDay()+6)%7)))),`Ta demande de ${(ABS[r.type]||'congé').toLowerCase()} ${rangeLabel(r.from,r.to)} est acceptée`);save();};}
{const f=ACT['req-no'];ACT['req-no']=function(t,e){const r=(S.requests||[]).find(x=>x.id===t.dataset.id);if(r)pushNews(r.emp,wOf(isoD(addDays(pdate(r.from),-((pdate(r.from).getDay()+6)%7)))),`Ta demande de ${(ABS[r.type]||'congé').toLowerCase()} ${rangeLabel(r.from,r.to)} est refusée`);return f(t,e);};}

let CPE=null;
Object.assign(ACT,{
 'cg-tab'(t){UI.conges.tab=t.dataset.t;renderView();},
 'sw-ok'(t){const r=(S.swaps||[]).find(x=>x.id===t.dataset.id);if(!r)return;const sh=r.snap||{};
   const lab=r.kind==='take'?`${empById(r.emp).prenom} prend le shift à pourvoir`:r.kind==='give'?`Shift de ${empById(r.emp).prenom} mis à pourvoir`:`${empById(r.to).prenom} reprend le shift de ${empById(r.emp).prenom}`;
   const ok=planDo(lab,()=>{
     if(r.kind==='take'){const o=(S.openShifts||[]).find(x=>x.id===r.openId);if(!o)return false;S.openShifts=S.openShifts.filter(x=>x.id!==o.id);S.shifts.push({id:uid('s'),emp:r.emp,w:o.w,d:o.d,s:o.s,e:o.e,p:o.p||0,poste:o.poste});(S.swaps||[]).forEach(z=>{if(z!==r&&z.kind==='take'&&z.openId===o.id&&z.status==='pending')z.status='no';});}
     else{const x=S.shifts.find(y=>y.id===r.shiftId);if(!x)return false;if(r.kind==='give'){S.shifts=S.shifts.filter(y=>y.id!==x.id);(S.openShifts=S.openShifts||[]).push({id:uid('o'),w:x.w,d:x.d,s:x.s,e:x.e,p:x.p||0,poste:x.poste});}else{x.emp=r.to;}}
     r.status='ok';
   },{ic:'swap'});
   if(ok){const dt=sh.w!=null?dateAt(sh.w,sh.d):null;const when=dt?`${JOURS[sh.d].toLowerCase()} ${dt.getDate()} ${MC[dt.getMonth()]} ${sh.s}–${sh.e}`:'';
     pushNews(r.emp,sh.w||0,r.kind==='take'?`C’est validé : tu travailles ${when}`:r.kind==='give'?`Ton shift du ${when} est proposé à l’équipe`:`Échange validé : ${empById(r.to).prenom} reprend ton shift du ${when}`);
     if(r.kind==='swap'&&r.to)pushNews(r.to,sh.w||0,`Tu reprends le shift de ${empById(r.emp).prenom} : ${when}`);save();}
 },
 'sw-no'(t){const r=(S.swaps||[]).find(x=>x.id===t.dataset.id);if(!r)return;r.status='no';const sh=r.snap||{};pushNews(r.emp,sh.w||0,`Ta demande (${swapLabel(r).toLowerCase()}) n’a pas été acceptée`);save();renderView();toast('Demande refusée','x');},
 'abs-new'(){
   const d0=TODAY_ISO;
   openModal(`<div class="mh"><div><h3>Poser une absence</h3><p>Sur un ou plusieurs jours. Les shifts de ces jours-là sont retirés du planning.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="form-grid" style="margin-top:0"><div class="field"><label for="an-emp">Salarié</label><select class="inp" id="an-emp">${visEmps().map(e=>`<option value="${e.id}">${esc(e.prenom)} ${esc(e.nom)}</option>`).join('')}</select></div>
    <div class="field"><label for="an-type">Type</label><select class="inp" id="an-type">${Object.keys(ABS).map(k=>`<option value="${k}">${ABS[k]}</option>`).join('')}</select></div>
    <div class="field"><label for="an-from">Du</label><input class="inp" type="date" id="an-from" value="${d0}"></div><div class="field"><label for="an-to">Au (inclus)</label><input class="inp" type="date" id="an-to" value="${d0}"></div>
    <div class="field full"><label for="an-note">Note (facultatif)</label><input class="inp" id="an-note" placeholder="Ex. arrêt jusqu’à nouvel ordre, mariage…"></div></div><p class="pin-err" id="an-err"></p>
    <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="abs-save">Poser l’absence</button></div>`);
 },
 'abs-save'(){const emp=$('#an-emp').value,type=$('#an-type').value,f=$('#an-from').value,to=$('#an-to').value,note=($('#an-note').value||'').trim();
   if(!f||!to||to<f){$('#an-err').textContent='La date de fin doit être après la date de début.';return;}
   const days=dateRange(f,to);if(days.length>=120){$('#an-err').textContent='120 jours maximum d’un coup.';return;}
   closeModal();let n=0;
   planDo(`${ABS[type]} pour ${empById(emp).prenom} ${rangeLabel(f,to)}`,()=>{days.forEach(dt=>{const {w,d}=wdOf(dt);if(isClosed(d))return;cellClear(emp,w,d);S.absences.push({id:uid('ab'),emp,w,d,type,note});n++;});},{ic:'calendar'});
   pushNews(emp,wOf(isoD(addDays(pdate(f),-((pdate(f).getDay()+6)%7)))),`${ABS[type]} posé ${rangeLabel(f,to)}`);save();
 },
 'abs-del'(t){const ids=t.dataset.ids.split(',');planDo('Absence retirée',()=>{S.absences=S.absences.filter(a=>!ids.includes(a.id));},{ic:'trash'});},
 'abs-edit'(t){const a=S.absences.find(x=>x.id===t.dataset.id);if(!a)return;planDo(`Absence de ${empById(a.emp).prenom} retirée`,()=>{S.absences=S.absences.filter(x=>x!==a);},{ic:'trash'});},
 'cp-edit'(t){const e=empById(t.dataset.id);const cp=e.cp||{};CPE=e.id;
   openModal(`<div class="mh"><div><h3>Congés de ${esc(e.prenom)}</h3><p>Reprends le solde de sa dernière fiche de paie : Léon ajoute ensuite 2,5 jours par mois et retire les congés posés.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="form-grid" style="margin-top:0"><div class="field"><label for="cp-s">Solde (jours ouvrables)</label><input class="inp" id="cp-s" type="number" step="0.5" min="0" value="${cp.solde!=null?cp.solde:''}" autofocus></div><div class="field"><label for="cp-au">Au</label><input class="inp" id="cp-au" type="date" value="${esc(cp.au||isoD(new Date(TODAY.getFullYear(),TODAY.getMonth(),1)))}"></div></div>
    <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="cp-save">Enregistrer</button></div>`,'narrow');},
 'cp-save'(){const v=parseFloat(String($('#cp-s').value).replace(',','.'));if(isNaN(v)){toast('Indique un nombre de jours','alert');return;}const au=$('#cp-au').value||TODAY_ISO;
   S.emp=S.emp.map(o=>o.id===CPE?{...o,cp:{solde:v,au}}:o);syncCtx();save();closeModal();renderView();toast('Solde de congés enregistré');},
 'paie-m'(t){UI.paie.mo=Math.min(0,UI.paie.mo+(+t.dataset.dir));renderView();},
 'paie-val'(){const {first}=paieData(UI.paie.mo);const mk=monthKey(first);S.paieVal=S.paieVal||{};S.paieVal[mk]={by:me().prenom,at:Date.now()};save();renderView();toast(`${MOIS[first.getMonth()].charAt(0).toUpperCase()+MOIS[first.getMonth()].slice(1)} validé pour la paie`);},
 'paie-copy'(){const {first,head,body}=paieTable();const txt=[head,...body].map(r=>r.join('\t')).join('\n');
   openModal(`<div class="mh"><div><h3>Variables de paie · ${MOIS[first.getMonth()]} ${first.getFullYear()}</h3><p>Copie ce tableau et colle-le dans Excel, Google Sheets ou un mail à ton comptable.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div><textarea class="inp wa-t" id="wa-t" rows="12" readonly>${esc(txt)}</textarea><div class="mf"><button class="btn" data-act="modal-close">Fermer</button><button class="btn primary" data-act="pl-wa-copy">${ic('copy','s')} Copier</button></div>`,'wide');
   setTimeout(()=>{const t=$('#wa-t');if(t)t.select();},40);},
 async 'paie-csv'(){const {first,head,body}=paieTable();const q=v=>/[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;
   const csv='﻿'+[head,...body].map(r=>r.map(q).join(';')).join('\r\n');
   const name=`variables-paie-${(S.nom||'resto').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${monthKey(first)}.csv`;
   const r=await saveFile(name,csv);if(r==='saved')toast('Fichier prêt','download');else if(r==='fail')toast('Téléchargement impossible ici : utilise « Copier »','alert');},
});
VIEWS.conges=viewConges;VIEWS.paie=viewPaie;
