/* =========================================================
   V12 · APERÇU DES DEMANDES — « voir ce que ça change » avant d'accepter
   - Chaque demande (congé, échange, shift à pourvoir) a un bouton « Voir » qui ouvre le planning
     de la bonne semaine avec la demande dessinée dessus (shift qui part, shift qui arrive).
   - Pour un congé qui tombe sur un planning déjà fait : « Léon trouve une solution » cherche
     un remplaçant par shift, en ne touchant à rien d'autre (on réattribue le shift, c'est tout),
     en respectant les règles HCR et en évitant les heures sup.
   - Planning pas encore fait sur ces dates : la carte le dit, rien ne bouge.
   ========================================================= */
UI.pv=null; // {kind:'req'|'sw', id, sol:[{sid, to|null}]}

/* les shifts du demandeur touchés par une demande de congé */
function pvShifts(r){
  const out=[];dateRange(r.from,r.to).forEach(dt=>{const {w,d}=wdOf(dt);if(isClosed(d))return;out.push(...empShifts(r.emp,w,d));});
  return out;
}
const pvJour=x=>{const dt=dateAt(x.w,x.d);return `${JC[x.d]} ${dt.getDate()}`;};
const pvSvc=x=>sMin(x)<900?'midi':'soir';

/* Léon cherche un remplaçant pour chaque shift, sans bouger le reste */
function pvSolution(r){
  const pris=[];// shifts ajoutés virtuellement {emp,w,d,s,e}
  const dayOf=(emp,w,d)=>[...empShifts(emp,w,d),...pris.filter(p=>p.emp===emp&&p.w===w&&p.d===d)];
  const wkMin=(emp,w)=>empWeekMin(emp,w)+sum(pris.filter(p=>p.emp===emp&&p.w===w),durMin);
  const jours=(emp,w)=>[0,1,2,3,4,5,6].filter(d=>{if(dayOf(emp,w,d).length)return true;const a=absOf(emp,w,d);return a&&a.type!=='repos';}).length; // jours pas en repos
  const prev=(emp,w,d)=>{const t=wdOf(addDays(dateAt(w,d),-1));const l=dayOf(emp,t.w,t.d);return l.length?Math.max(...l.map(eMin))-1440:null;};
  const next=(emp,w,d)=>{const t=wdOf(addDays(dateAt(w,d),1));const l=dayOf(emp,t.w,t.d);return l.length?Math.min(...l.map(sMin))+1440:null;};
  return pvShifts(r).sort((a,b)=>a.w-b.w||a.d-b.d||sMin(a)-sMin(b)).map(x=>{
    const dm=durMin(x);let best=null;
    EMP.forEach(e=>{
      if(e.id===r.emp||e.hidden)return;
      if(!(e.poste===x.poste||(e.skills||[]).includes(x.poste)))return;
      if(absOf(e.id,x.w,x.d))return;
      const ce=dayOf(e.id,x.w,x.d);if(ce.some(y=>sMin(y)<eMin(x)&&eMin(y)>sMin(x)))return; // déjà là sur ce créneau
      if(sum(ce,durMin)+dm>660)return;                                    // 11 h max par jour
      const p=prev(e.id,x.w,x.d),n=next(e.id,x.w,x.d);
      if(!ce.length&&((p!=null&&sMin(x)-p<660)||(n!=null&&n-eMin(x)<660)))return; // 11 h de repos
      const avant=wkMin(e.id,x.w),apres=avant+dm;if(apres>48*60)return;    // 48 h max
      if(!ce.length&&jours(e.id,x.w)>=5)return;                           // 2 jours de repos
      const c=e.contrat*60;const cred=S.absences.filter(a=>a.emp===e.id&&a.w===x.w&&ABS_PAID.includes(a.type)).length*c/5;let surplus=0;try{surplus=Math.max(0,rmMois(e,x.w).surplus||0);}catch(_){}
      // le moins d'impact : d'abord ceux à qui il manque des heures, puis ceux qui travaillent déjà ce jour-là (pas de journée en plus)
      const score=Math.max(0,apres+cred-c)*3+surplus*0.5-Math.max(0,c-avant-cred)+(ce.length?-30:0);
      if(!best||score<best.score)best={e,score,avant,apres,cred};
    });
    if(best)pris.push({emp:best.e.id,w:x.w,d:x.d,s:x.s,e:x.e});
    return {x,to:best?best.e.id:null,avant:best&&best.avant,apres:best&&best.apres,cred:best&&best.cred};
  });
}

/* ---------- les cartes de demandes : bouton « Voir » ---------- */
{const f=viewConges;viewConges=function(){
  let h=f.apply(this,arguments);if(effRole()==='staff'||UI.conges.tab!=='valider')return h;
  (S.requests||[]).filter(r=>r.status==='pending').forEach(r=>{
    const n=pvShifts(r).length;
    const plan=dateRange(r.from,r.to).some(dt=>{const {w}=wdOf(dt);return S.shifts.some(x=>x.w===w);});
    const add=n?`<button class="btn sm pv-voir" data-act="pv-voir" data-k="req" data-id="${r.id}">${ic('eye','s')} Voir ce que ça change</button>`
      :`<span class="pv-rien">${plan?'Pas de shift sur ces jours : rien ne bouge':'Planning pas encore fait : rien ne bouge'}</span>`;
    h=h.replace(`<button class="btn sm" data-act="req-no" data-id="${r.id}">`,add+`<button class="btn sm" data-act="req-no" data-id="${r.id}">`);
  });
  (S.swaps||[]).filter(r=>r.status==='pending').forEach(r=>{
    h=h.replace(`<button class="btn sm" data-act="sw-no" data-id="${r.id}">`,`<button class="btn sm pv-voir" data-act="pv-voir" data-k="sw" data-id="${r.id}">${ic('eye','s')} Voir</button><button class="btn sm" data-act="sw-no" data-id="${r.id}">`);
  });
  return h;
};VIEWS.conges=viewConges;}

/* ---------- l'aperçu dessiné sur le planning ---------- */
function pvReq(){const p=UI.pv;if(!p)return null;return p.kind==='req'?(S.requests||[]).find(x=>x.id===p.id&&x.status==='pending'):(S.swaps||[]).find(x=>x.id===p.id&&x.status==='pending');}
function pvBanner(){
  const p=UI.pv,r=pvReq();if(!r)return '';const e=empById(r.emp);
  let titre='',lignes='',acts='';
  if(p.kind==='req'){
    const sh=pvShifts(r);
    titre=`${esc(e.prenom)} demande ${r.type==='cp'?'des congés payés':(ABS[r.type]||'une absence').toLowerCase()} ${rangeLabel(r.from,r.to)}`;
    if(!p.sol){
      lignes=`<p>${plur(sh.length,'shift à remplacer','shifts à remplacer')} : ${sh.map(x=>`${pvJour(x)} ${pvSvc(x)}`).join(', ')}. ${sh.length>1?'Ils sont barrés':'Il est barré'} sur le planning.</p>`;
      acts=`<button class="btn sm" data-act="pv-no">Refuser</button><button class="btn sm" data-act="pv-ok">Accepter sans remplacer</button><button class="btn sm brass" data-act="pv-leon">${ic('spark','s')} Léon trouve une solution</button>`;
    }else{
      const ok=p.sol.filter(s=>s.to),ko=p.sol.filter(s=>!s.to);
      lignes=`<p>${ok.length?'Léon ne touche qu’à ces shifts, le reste du planning ne bouge pas :':'Personne n’est dispo sans casser une règle (repos, 11 h par jour, 48 h par semaine). Le mieux : le mettre en shift à pourvoir, l’équipe peut se proposer.'}</p><ul class="pv-sol">${p.sol.map(s=>{const o=s.to&&empById(s.to);
        return `<li>${ic(s.to?'check':'alert','s')} <b>${pvJour(s.x)} ${s.x.s}–${s.x.e}</b> → ${o?`${esc(o.prenom)} <span class="faint">(${dur(s.avant+s.cred)} → ${dur(s.apres+s.cred)} / ${o.contrat}h${s.cred?', congés compris':''})</span>`:'<span class="pv-ko">à pourvoir</span>'}</li>`;}).join('')}</ul>${ko.length&&ok.length?'<p class="faint">Les shifts sans remplaçant partent en « shift à pourvoir ».</p>':''}`;
      acts=`<button class="btn sm" data-act="pv-no">Refuser</button><button class="btn sm primary" data-act="pv-ok-sol">${ic('check','s')} ${p.sol.some(s=>s.to)?'Accepter avec cette solution':'Accepter, shift à pourvoir'}</button>`;
    }
  }else{
    const sh=r.snap||{};const dt=sh.w!=null?dateAt(sh.w,sh.d):null;const when=dt?`${JC[sh.d]} ${dt.getDate()} · ${sh.s}–${sh.e}`:'';
    const who=r.kind==='take'?e:r.kind==='swap'&&r.to?empById(r.to):null;
    titre=r.kind==='take'?`${esc(e.prenom)} se propose pour le shift à pourvoir`:r.kind==='give'?`${esc(e.prenom)} met son shift à pourvoir`:`${esc(e.prenom)} donne son shift à ${esc(who.prenom)}`;
    const cr=who&&sh.w!=null?S.absences.filter(z=>z.emp===who.id&&z.w===sh.w&&ABS_PAID.includes(z.type)).length*who.contrat*12:0;const m=who&&sh.w!=null?empWeekMin(who.id,sh.w)+durMin(sh)+cr:0;
    const clash=who&&sh.w!=null&&empShifts(who.id,sh.w,sh.d).some(y=>sMin(y)<eMin(sh)&&eMin(y)>sMin(sh));
    lignes=`<p>${when}${who?` · ${esc(who.prenom)} passerait à ${dur(m)} / ${who.contrat}h${cr?', congés compris':''}${m>who.contrat*60?' (heures en plus)':''}`:''}</p>${clash?`<p class="pv-ko">${ic('alert','s')} ${esc(who.prenom)} travaille déjà sur ce créneau : ça ferait deux shifts en même temps.</p>`:''}`;
    acts=`<button class="btn sm" data-act="pv-no">Refuser</button><button class="btn sm primary" data-act="pv-ok">${ic('check','s')} Valider</button>`;
  }
  return `<div class="pv-ban"><div class="pv-ic">${ic('eye')}</div><div class="pv-tx"><b>Aperçu · ${titre}</b>${lignes}</div><div class="pv-acts"><button class="btn sm ghost" data-act="pv-close">Fermer l’aperçu</button>${acts}</div></div>`;
}
function pvDessine(){
  const p=UI.pv,r=pvReq();if(!r){UI.pv=null;return;}
  const w=UI.plan.w;const root=document.querySelector('.view');if(!root)return;
  const tbl=root.querySelector('.pg9');if(!tbl)return;
  if(!root.querySelector('.pv-ban')){const box=document.createElement('div');box.innerHTML=pvBanner();const wrap=tbl.closest('.tbl-wrap,.pg9-wrap,section,div')||tbl;wrap.parentNode.insertBefore(box.firstElementChild,wrap);}
  const cell=(emp,d)=>tbl.querySelector(`td[data-emp="${emp}"][data-d="${d}"]`);
  const ghost=(emp,x,txt)=>{const td=cell(emp,x.d);if(!td)return;td.classList.add('pv-in');const g=document.createElement('div');g.className='shift s9 pv-ghost';g.dataset.poste=x.poste||'';g.innerHTML=`<span>${x.s}–${x.e}</span><small>${esc(txt)}</small>`;td.prepend(g);};
  const barre=sid=>{const s=tbl.querySelector(`.shift[data-sid="${sid}"]`);if(s){s.classList.add('pv-out');s.closest('td')&&s.closest('td').classList.add('pv-cell');}};
  if(p.kind==='req'){
    dateRange(r.from,r.to).forEach(dt=>{const t=wdOf(dt);if(t.w!==w)return;const td=cell(r.emp,t.d);if(td){td.classList.add('pv-cell');if(!td.querySelector('.pv-lab')){const l=document.createElement('div');l.className='pv-lab';l.textContent=(ABS[r.type]||'Absence')+' demandé';td.appendChild(l);}}});
    pvShifts(r).filter(x=>x.w===w).forEach(x=>barre(x.id));
    (p.sol||[]).filter(s=>s.to&&s.x.w===w).forEach(s=>ghost(s.to,s.x,'remplace '+empById(r.emp).prenom));
  }else{
    const sh=r.snap||{};if(sh.w!==w)return;
    if(r.kind==='take')ghost(r.emp,sh,'se propose');
    else{barre(r.shiftId);if(r.kind==='swap'&&r.to)ghost(r.to,sh,'reprend le shift de '+empById(r.emp).prenom);}
  }
}
{const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{if(UI.view==='planning'&&UI.pv)pvDessine();}catch(e){}return o;};}

const pvFin=(msg)=>{UI.pv=null;renderView();if(msg)toast(msg,'check');};
Object.assign(ACT,{
  'pv-voir'(t){
    const k=t.dataset.k,id=t.dataset.id;UI.pv={kind:k,id,sol:null};const r=pvReq();if(!r){UI.pv=null;return;}
    let w;if(k==='req'){const sh=pvShifts(r);w=sh.length?Math.min(...sh.map(x=>x.w)):wdOf(pdate(r.from)).w;}else w=(r.snap||{}).w||0;
    UI.plan.w=w;UI.plan.mode='semaine';UI.plan.sel=null;go('planning');
  },
  'pv-close'(){UI.pv=null;go('conges');},
  'pv-leon'(){const r=pvReq();if(!r)return;UI.pv.sol=pvSolution(r);renderView();},
  'pv-no'(){const p=UI.pv,r=pvReq();if(!r)return;
    const b=document.createElement('button');b.dataset.id=r.id;ACT[p.kind==='req'?'req-no':'sw-no'](b);pvFin();},
  'pv-ok'(){const p=UI.pv,r=pvReq();if(!r)return;
    if(p.kind==='req'){acceptReq(r);pvFin();}else{const b=document.createElement('button');b.dataset.id=r.id;ACT['sw-ok'](b);pvFin();}},
  'pv-ok-sol'(){const p=UI.pv,r=pvReq();if(!r||!p.sol)return;const sol=p.sol;const e=empById(r.emp);
    const nR=sol.filter(s=>s.to).length,nO=sol.length-nR;
    planDo(`Congé de ${e.prenom} accepté${nR?` · ${plur(nR,'shift remplacé','shifts remplacés')}`:''}${nO?` · ${plur(nO,'shift à pourvoir','shifts à pourvoir')}`:''}`,()=>{
      sol.forEach(s=>{const x=S.shifts.find(y=>y.id===s.x.id);if(!x)return;
        if(s.to){x.emp=s.to;x.leon=1;x.lw=`remplace ${e.prenom} (congé)`;}
        else{S.shifts=S.shifts.filter(y=>y.id!==x.id);(S.openShifts=S.openShifts||[]).push({id:uid('o'),w:x.w,d:x.d,s:x.s,e:x.e,p:x.p||0,poste:x.poste});}});
      const t0=toast;toast=function(){};try{acceptReq(r);}finally{toast=t0;}
      sol.filter(s=>s.to).forEach(s=>pushNews(s.to,s.x.w,`Tu remplaces ${e.prenom} ${pvJour(s.x).toLowerCase()} ${s.x.s}–${s.x.e}`));
    },{ic:'check'});
    UI.pv=null;renderView();
  },
});

/* ---------- shift à pourvoir : notif à toute l'équipe ----------
   Dès qu'un shift à pourvoir est visible (semaine publiée, date pas passée), chaque salarié reçoit
   « Shift à pourvoir … : propose-toi ». Sauf ceux qui bossent déjà sur ce créneau ou sont absents ce jour-là.
   Faire une grosse journée, c'est son choix : il se propose, le patron valide. Une seule notif par shift. */
function openNotifier(){
  let n=0;
  (S.openShifts||[]).forEach(o=>{
    if(o.nf!=null||!S.published||!S.published[String(o.w)])return;
    const dt=dateAt(o.w,o.d);if(dt<TODAY&&isoD(dt)!==TODAY_ISO){o.nf=0;return;}
    const qui=EMP.filter(e=>!e.hidden&&!(absOf(e.id,o.w,o.d)&&absOf(e.id,o.w,o.d).type!=='repos')
      &&!empShifts(e.id,o.w,o.d).some(y=>sMin(y)<eMin(o)&&eMin(y)>sMin(o)));
    const when=`${JOURS[o.d].toLowerCase()} ${dt.getDate()} ${MC[dt.getMonth()]} · ${o.s}–${o.e}`;
    qui.forEach(e=>pushNews(e.id,o.w,`Shift à pourvoir ${when} (${(POSTES[o.poste]||{l:o.poste}).l.toLowerCase()}) : propose-toi si ça te va`));
    o.nf=qui.length;n++;
  });
  return n;
}
{const f=save;save=function(){try{openNotifier();}catch(e){}return f.apply(this,arguments);};}
{const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{if(UI.view==='planning')document.querySelectorAll('.pg9 .open-s[data-oid]').forEach(el=>{const x=(S.openShifts||[]).find(z=>z.id===el.dataset.oid);if(!x)return;
  el.dataset.tip=x.nf!=null?(x.nf?`Notif envoyée à ${plur(x.nf,'personne')}  : tous ceux qui ne bossent pas déjà sur ce créneau. Chacun peut se proposer, tu valides.`:'Personne de libre sur ce créneau à prévenir.'):'L’équipe sera prévenue dès que la semaine sera publiée.';el.removeAttribute('title');});}catch(e){}return o;};}
