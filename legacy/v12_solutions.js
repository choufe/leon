/* =========================================================
   V12 · LÉON PROPOSE UNE SOLUTION À CHAQUE PROBLÈME
   Pour chaque alerte du planning (panneau « Léon a vérifié ce planning » et ⚠ sur les cases),
   Léon calcule UNE solution, la plus petite possible, et un bouton « Faire » l'applique (annulable).
   Exemples : 11 h de repos → finir un peu plus tôt la veille ET commencer un peu plus tard le lendemain
   (la coupure est partagée, au quart d'heure) ; trop d'heures → donner un shift à quelqu'un à qui
   il en manque ; il manque du monde → ajouter la bonne personne au bon créneau.
   ========================================================= */
const SOLS={};let SOL_N=0;
const q15=m=>Math.ceil(m/15)*15;
const solJour=(w,d)=>{const dt=dateAt(w,d);return `${JOURS[d].toLowerCase()} ${dt.getDate()}`;};
const solCred=(e,w)=>S.absences.filter(a=>a.emp===e.id&&a.w===w&&ABS_PAID.includes(a.type)).length*e.contrat*12;

/* qui peut prendre ce créneau sans casser une règle ? (le moins d'impact possible) */
function solCand(x,{excl=[],only=null,sansSup=false}={}){
  const dm=durMin(x);let best=null;
  const ok=e=>e.poste===x.poste||(e.skills||[]).includes(x.poste)||(x.poste==='salle'&&e.poste==='manager');
  EMP.forEach(e=>{
    if(e.hidden||excl.includes(e.id)||(only&&e.id!==only))return;if(!ok(e))return;
    const ab=absOf(e.id,x.w,x.d);if(ab)return;
    try{if(availClash({...x,emp:e.id}))return;}catch(_){}
    const ce=empShifts(e.id,x.w,x.d);if(ce.some(y=>sMin(y)<eMin(x)&&eMin(y)>sMin(x)))return;
    if(sum(ce,durMin)+dm>maxDayMin(e))return;
    if(ce.length&&amplitudeOf([...ce,x])>780)return;
    if(!ce.length){
      const p=wdOf(addDays(dateAt(x.w,x.d),-1)),n=wdOf(addDays(dateAt(x.w,x.d),1));
      const pl=empShifts(e.id,p.w,p.d),nl=empShifts(e.id,n.w,n.d);
      if(pl.length&&sMin(x)+1440-Math.max(...pl.map(eMin))<660)return;
      if(nl.length&&Math.min(...nl.map(sMin))+1440-eMin(x)<660)return;
      const jours=[0,1,2,3,4,5,6].filter(d=>empShifts(e.id,x.w,d).length||(absOf(e.id,x.w,d)&&absOf(e.id,x.w,d).type!=='repos')).length;
      if(jours>=5)return;
    }
    const c=e.contrat*60,cred=solCred(e,x.w),avant=empWeekMin(e.id,x.w),apres=avant+dm;
    if(apres>2880)return;if(sansSup&&apres+cred>c+15)return;
    const score=Math.max(0,apres+cred-c)*3-Math.max(0,c-avant-cred)+(ce.length?-30:0);
    if(!best||score<best.score)best={e,score,avant:avant+cred,apres:apres+cred};
  });
  return best;
}
const solHrs=b=>`${dur(b.avant)} → ${dur(b.apres)} / ${b.e.contrat}h${b.apres>b.e.contrat*60+15?' : heures en plus':''}`;
const toPourvoir=x=>{S.shifts=S.shifts.filter(y=>y.id!==x.id);(S.openShifts=S.openShifts||[]).push({id:uid('o'),w:x.w,d:x.d,s:x.s,e:x.e,p:x.p||0,poste:x.poste});};
const donner=(x,b)=>{const e0=empById(x.emp);x.emp=b.e.id;x.leon=1;x.lw=`repris de ${e0.prenom}`;pushNews(b.e.id,x.w,`Nouveau shift : ${solJour(x.w,x.d)} ${x.s}–${x.e}`);};

/* la cible d'heures de la semaine : le contrat, ou moins si Léon lisse les heures sup du mois */
function solCible(e,w){const c=S.leonCib&&S.leonCib[wkIso(w)]&&S.leonCib[wkIso(w)][e.id];return c&&c.c?c.c:e.contrat*60;}

/* il manque des heures : d'abord allonger ses shifts (commencer comme les autres, finir comme les autres),
   puis, s'il manque encore beaucoup, lui donner un jour de plus là où il y a le plus de couverts */
function solEtendre(e,w){
  const cred=solCred(e,w);let manque=solCible(e,w)-empWeekMin(e.id,w)-cred;if(manque<45)return null;
  const mods=[];const tmp={};const cur=x=>tmp[x.id]||x;
  const days=[0,1,2,3,4,5,6].filter(d=>dateAt(w,d)>TODAY&&empShifts(e.id,w,d).length).sort((a,b)=>sum(prevOf(b),v=>v||0)-sum(prevOf(a),v=>v||0));
  for(const d of days){if(manque<15)break;
    const sh=empShifts(e.id,w,d);
    for(const x0 of sh){if(manque<15)break;
      const midi=sMin(x0)<900;const autres=shiftsWD(w,d).filter(y=>y.emp!==e.id&&(sMin(y)<900)===midi);if(!autres.length)continue;
      const lo=Math.min(...autres.map(sMin)),hi=Math.max(...autres.map(eMin));
      let x={...x0};
      const essai=(ns,ne)=>{const y={...x,s:hhmm(ns),e:hhmm(ne)};if(durMin({...y,p:0})>360&&!y.p)y.p=20;
        const jour=sh.map(z=>z.id===x0.id?y:cur(z));if(sum(jour,durMin)>maxDayMin(e)||amplitudeOf(jour)>780)return null;
        const p=wdOf(addDays(dateAt(w,d),-1)),n=wdOf(addDays(dateAt(w,d),1));const pl=empShifts(e.id,p.w,p.d),nl=empShifts(e.id,n.w,n.d);
        if(pl.length&&ns+1440-Math.max(...pl.map(eMin))<660)return null;if(nl.length&&Math.min(...nl.map(sMin))+1440-ne<660)return null;return y;};
      // plus tôt (jusqu'au premier arrivé du service), puis plus tard (jusqu'au dernier parti), au quart d'heure, 1 h max de chaque côté
      for(const sens of ['tot','tard']){
        for(let k=4;k>=1;k--){const step=k*15;if(step>manque+15)continue;
          const ns=sens==='tot'?sMin(x)-step:sMin(x),ne=sens==='tard'?eMin(x)+step:eMin(x);
          if(ns<lo||ne>hi)continue;const y=essai(ns,ne);if(!y)continue;const gain=durMin(y)-durMin(x);if(gain<=0)continue;
          x=y;manque-=gain;break;}
        if(manque<15)break;}
      if(x.s!==x0.s||x.e!==x0.e){tmp[x0.id]=x;mods.push({x0,y:x});}
    }}
  let ajout=null;
  if(manque>=180){
    const libres=[0,1,2,3,4,5,6].filter(d=>dateAt(w,d)>TODAY&&!isClosed(d)&&!empShifts(e.id,w,d).length&&!absOf(e.id,w,d)).sort((a,b)=>sum(prevOf(b),v=>v||0)-sum(prevOf(a),v=>v||0));
    for(const d of libres){
      const mod=shiftsWD(w,d).filter(y=>y.poste===e.poste);if(!mod.length)continue;
      const t=mod.find(y=>durMin(y)<=manque+60)||mod[0];const x={w,d,s:t.s,e:t.e,p:t.p||0,poste:e.poste};
      if(solCand(x,{only:e.id})){ajout=x;manque-=durMin(x);break;}}
  }
  if(!mods.length&&!ajout)return null;
  const tot=empWeekMin(e.id,w)+cred+sum(mods,m=>durMin(m.y)-durMin(m.x0))+(ajout?durMin(ajout):0);
  const bits=mods.map(m=>{const t=[];if(m.y.s!==m.x0.s)t.push(`commence à <b>${m.y.s}</b>`);if(m.y.e!==m.x0.e)t.push(`finit à <b>${m.y.e}</b>`);return `${t.join(' et ')} ${JOURS[m.x0.d].toLowerCase()}`;});
  if(ajout)bits.push(`travaille aussi ${JOURS[ajout.d].toLowerCase()} <b>${ajout.s}–${ajout.e}</b>`);
  return {txt:`${esc(e.prenom)} ${bits.join(', ')}, comme le reste de l’équipe sur ces services : ${dur(tot)} / ${dur(solCible(e,w))}.`,label:`Heures de ${e.prenom} complétées`,
    run:()=>{mods.forEach(m=>{const x=S.shifts.find(z=>z.id===m.x0.id);if(x){x.s=m.y.s;x.e=m.y.e;x.p=m.y.p||0;}});if(ajout){S.shifts.push({id:uid('s'),emp:e.id,...ajout,leon:1,lw:'pour atteindre son contrat'});}}};
}

/* trop d'heures de peu : finir un peu plus tôt là où quelqu'un d'autre du même poste reste jusqu'au bout */
function solRaboter(e,w,trop){
  if(trop<15)return null;const mods=[];let reste=trop;
  const grp=p=>p==='manager'?['manager','salle']:p==='salle'?['salle','manager']:[p];
  const sh=S.shifts.filter(x=>x.emp===e.id&&x.w===w&&dateAt(w,x.d)>TODAY).sort((a,b)=>sum(prevOf(a.d),v=>v||0)-sum(prevOf(b.d),v=>v||0));
  for(const x of sh){if(reste<15)break;
    for(let k=Math.min(4,Math.ceil(reste/15));k>=1;k--){const ne=eMin(x)-k*15;if(ne-sMin(x)<180)continue;
      const relai=shiftsWD(w,x.d).some(y=>y.emp!==e.id&&grp(x.poste).includes(y.poste)&&sMin(y)<=ne&&eMin(y)>=eMin(x));
      const relaiD=shiftsWD(w,x.d).some(y=>y.emp!==e.id&&grp(x.poste).includes(y.poste)&&sMin(y)<=sMin(x)+k*15&&eMin(y)>=sMin(x)+k*15&&sMin(y)<=sMin(x));
      if(relai){const y={...x,e:hhmm(ne)};if(durMin({...y,p:0})<=360)y.p=0;mods.push({x,y,txt:`finit à <b>${y.e}</b> ${JOURS[x.d].toLowerCase()}`});reste-=durMin(x)-durMin(y);break;}
      if(relaiD){const y={...x,s:hhmm(sMin(x)+k*15)};if(durMin({...y,p:0})<=360)y.p=0;mods.push({x,y,txt:`commence à <b>${y.s}</b> ${JOURS[x.d].toLowerCase()}`});reste-=durMin(x)-durMin(y);break;}
    }}
  if(!mods.length)return null;const gain=trop-reste;
  return {txt:`${esc(e.prenom)} ${mods.map(m=>m.txt).join(', ')} : un collègue du même poste est là, le service reste couvert. ${dur(gain)} de moins.`,label:`${e.prenom} : ${dur(gain)} de moins (${[...new Set(mods.map(m=>JOURS[m.x.d].toLowerCase()))].join(', ')})`,
    run:()=>mods.forEach(m=>{const x=S.shifts.find(z=>z.id===m.x.id);if(x){x.s=m.y.s;x.e=m.y.e;x.p=m.y.p||0;}})};
}

/* la solution pour une alerte */
function leonSol(w,a){
  const e=a.emp?empById(a.emp):null;const d=a.d;
  if(d!=null&&dateAt(w,d)<=TODAY)return null; // ni le passé ni aujourd’hui (trop tard pour prévenir)
  const supTot=(emp,m)=>Math.max(0,m+solCred(emp,w)-emp.contrat*60);
  try{switch(a.k){
  case 'repos':{
    if(!e||d==null)return null;const sh=empShifts(e.id,w,d);if(!sh.length)return null;
    const p=wdOf(addDays(dateAt(w,d),-1));const prev=empShifts(e.id,p.w,p.d);if(!prev.length)return null;
    const lx=prev.reduce((u,v)=>eMin(v)>eMin(u)?v:u),nx=sh[0];
    const rest=sMin(nx)+1440-eMin(lx),manque=660-rest;if(manque<=0)return null;
    let cA=q15(manque/2),cB=q15(Math.max(0,manque-cA));
    const rA=durMin(lx)-cA>=120,rB=durMin(nx)-cB>=120;
    if(dateAt(p.w,p.d)<=TODAY){cA=0;cB=durMin(nx)-q15(manque)>=120?q15(manque):-1;if(cB<0)cA=-1;}
    else if(!rA&&durMin(nx)-q15(manque)>=120){cA=0;cB=q15(manque);}else if(!rB&&durMin(lx)-q15(manque)>=120){cA=q15(manque);cB=0;}else if(!rA||!rB)cA=cB=-1;
    if(cA>=0){
      const fA=hhmm(eMin(lx)-cA),dB=hhmm(sMin(nx)+cB);
      const bits=[cA?`finit à <b>${fA}</b> ${JOURS[p.d].toLowerCase()} (au lieu de ${lx.e})`:'',cB?`commence à <b>${dB}</b> ${JOURS[d].toLowerCase()} (au lieu de ${nx.s})`:''].filter(Boolean);
      return {txt:`${esc(e.prenom)} ${bits.join(' et ')} : ça fait 11 h de repos pile${cA&&cB?', et chaque journée ne bouge que de '+dur(Math.max(cA,cB)):''}.`,
        label:`Repos de ${e.prenom} : 11 h`,run:()=>{if(cA)lx.e=fA;if(cB)nx.s=dB;}};
    }
    const b=solCand(nx,{excl:[e.id]});
    return b?{txt:`Trop court à raboter : Léon donne le shift de ${esc(e.prenom)} ${solJour(w,d)} (${nx.s}–${nx.e}) à <b>${esc(b.e.prenom)}</b> (${solHrs(b)}).`,label:`Shift donné à ${b.e.prenom}`,run:()=>donner(nx,b)}
      :{txt:`Le shift ${solJour(w,d)} ${nx.s}–${nx.e} passe à pourvoir : l’équipe est prévenue.`,label:'Shift mis à pourvoir',run:()=>toPourvoir(nx)};
  }
  case 'maxJour':case 'amplitude':{
    if(!e||d==null)return null;const sh=empShifts(e.id,w,d);if(!sh.length)return null;
    const trop=a.k==='maxJour'?sum(sh,durMin)-maxDayMin(e):amplitudeOf(sh)-780;if(trop<=0)return null;const c=q15(trop);
    const last=sh[sh.length-1],first=sh[0];
    if(durMin(last)-c>=120){const f=hhmm(eMin(last)-c);return {txt:`${esc(e.prenom)} finit à <b>${f}</b> ${solJour(w,d)} au lieu de ${last.e}.`,label:`${e.prenom} finit à ${f} ${solJour(w,d)}`,run:()=>{last.e=f;}};}
    if(durMin(first)-c>=120){const s=hhmm(sMin(first)+c);return {txt:`${esc(e.prenom)} commence à <b>${s}</b> ${solJour(w,d)} au lieu de ${first.s}.`,label:`${e.prenom} commence à ${s} ${solJour(w,d)}`,run:()=>{first.s=s;}};}
    return null;
  }
  case 'chevauche':{
    const sh=empShifts(e.id,w,d);for(let i=1;i<sh.length;i++)if(sMin(sh[i])<eMin(sh[i-1])){const A2=sh[i-1],B=sh[i];
      if(eMin(B)-eMin(A2)>=60)return {txt:`Le 2ᵉ shift commence à <b>${A2.e}</b> (à la fin du 1ᵉʳ).`,label:'Shifts remis bout à bout',run:()=>{B.s=A2.e;}};
      return {txt:`Le shift ${B.s}–${B.e} est en double : Léon le retire.`,label:'Shift en double retiré',run:()=>{S.shifts=S.shifts.filter(y=>y.id!==B.id);}};}
    return null;
  }
  case 'pause':{
    const x=empShifts(e.id,w,d).find(x=>durMin(x)+(x.p||0)>360&&!x.p);if(!x)return null;
    return {txt:`Ajouter <b>20 min de pause</b> sur ${x.s}–${x.e} (le minimum légal).`,label:'Pause ajoutée',run:()=>{x.p=20;}};
  }
  case 'absShift':{
    const sh=empShifts(e.id,w,d);if(!sh.length)return null;const x=sh[0];const b=solCand(x,{excl:[e.id]});
    return b&&sh.length===1?{txt:`${esc(e.prenom)} est absent : Léon donne le shift ${x.s}–${x.e} à <b>${esc(b.e.prenom)}</b> (${solHrs(b)}).`,label:`Shift donné à ${b.e.prenom}`,run:()=>donner(x,b)}
      :{txt:`${esc(e.prenom)} est absent : ${sh.length>1?'les shifts passent':'le shift passe'} à pourvoir, l’équipe est prévenue.`,label:'Mis à pourvoir',run:()=>sh.forEach(toPourvoir)};
  }
  case 'dispo':{
    const x=empShifts(e.id,w,d).find(y=>availClash(y));if(!x)return null;const b=solCand(x,{excl:[e.id]});
    return b?{txt:`Léon donne ce shift (${x.s}–${x.e}) à <b>${esc(b.e.prenom)}</b>, qui est dispo (${solHrs(b)}).`,label:`${solJour(w,d)} : shift de ${e.prenom} (pas dispo) donné à ${b.e.prenom}`,run:()=>donner(x,b)}:null;
  }
  case 'heuresSup':case 'complementaires':case 'hebdo':{
    if(!e)return null;const c=e.contrat*60,cred=solCred(e,w),m=empWeekMin(e.id,w);let best=null;
    S.shifts.filter(x=>x.emp===e.id&&x.w===w&&dateAt(w,x.d)>TODAY).forEach(x=>{
      const b=solCand(x,{excl:[e.id]});if(!b)return;
      const av=supTot(e,m)+supTot(b.e,b.avant-solCred(b.e,w)),ap=supTot(e,m-durMin(x))+supTot(b.e,b.apres-solCred(b.e,w));if(ap>=av)return;
      const reste=m+cred-durMin(x);const ecart=Math.abs(reste-c)+(reste<c-60?120:0)+b.score/10;
      if(!best||ecart<best.ecart)best={x,b,ecart,reste};});
    const trop=a.k==='complementaires'?m-(c+c/10):a.k==='hebdo'?m-2880:m+cred-solCible(e,w);
    const rab=solRaboter(e,w,trop);
    if(rab&&(!best||trop<=90))return rab;
    if(!best)return rab;const {x,b}=best;
    return {txt:`Léon donne le shift ${solJour(w,x.d)} ${x.s}–${x.e} à <b>${esc(b.e.prenom)}</b> (${solHrs(b)}). ${esc(e.prenom)} revient à ${dur(best.reste)}.`,label:`${solJour(w,x.d)} : shift de ${e.prenom} donné à ${b.e.prenom}`,run:()=>donner(x,b)};
  }
  case 'sous':{
    if(!e)return null;let best=null;
    EMP.forEach(o=>{if(o.id===e.id)return;const mo=empWeekMin(o.id,w)+solCred(o,w);if(mo<=o.contrat*60+30)return;
      S.shifts.filter(x=>x.emp===o.id&&x.w===w&&dateAt(w,x.d)>TODAY).forEach(x=>{const b=solCand(x,{only:e.id});const mo0=empWeekMin(o.id,w);if(b&&supTot(o,mo0-durMin(x))+supTot(e,b.apres-solCred(e,w))<supTot(o,mo0)+supTot(e,b.avant-solCred(e,w))&&(!best||durMin(x)>durMin(best.x)))best={x,b,o};});});
    if(best){const {x,b,o}=best;
      return {txt:`${esc(o.prenom)} fait des heures en plus : Léon lui reprend ${solJour(w,x.d)} ${x.s}–${x.e} pour ${esc(e.prenom)} (${solHrs(b)}).`,label:`${solJour(w,x.d)} : shift de ${o.prenom} donné à ${e.prenom}`,run:()=>donner(x,b)};}
    return solEtendre(e,w);
  }
  case 'reposHebdo':{
    if(!e)return null;const ds=[0,1,2,3,4,5,6].filter(dd=>empShifts(e.id,w,dd).length&&dateAt(w,dd)>TODAY);if(!ds.length)return null;
    let best=null;ds.forEach(dd=>{const sh=empShifts(e.id,w,dd);const bs=sh.map(x=>solCand(x,{excl:[e.id]}));const n=bs.filter(Boolean).length;const sc=(sh.length-n)*1000+sum(sh,durMin);if(!best||sc<best.sc)best={dd,sh,bs,sc};});
    const {dd,sh,bs}=best;const qui=[...new Set(bs.filter(Boolean).map(b=>b.e.prenom))];
    return {txt:`${esc(e.prenom)} prend son ${JOURS[dd].toLowerCase()} : ${qui.length?`Léon donne ${sh.length>1?'ses shifts':'son shift'} à <b>${esc(qui.join(' et '))}</b>`:''}${bs.some(b=>!b)?`${qui.length?', le reste':'ses shifts'} passe à pourvoir`:''}.`,
      label:`Repos de ${e.prenom} le ${JOURS[dd].toLowerCase()}`,run:()=>sh.forEach((x,i)=>bs[i]?donner(x,bs[i]):toPourvoir(x))};
  }
  case 'couverture':{
    if(d==null)return null;const cv=coverage(w,d).find(c=>c.miss.some(k=>a.t.includes(c.svc)&&a.t.includes({salle:'en salle',cuisine:'en cuisine',bar:'au bar'}[k])));if(!cv)return null;
    const k=cv.miss.find(k=>a.t.includes({salle:'en salle',cuisine:'en cuisine',bar:'au bar'}[k]));const [A0,B0]=SVC_WIN[cv.svc];
    const mod=shiftsWD(w,d).filter(x=>(x.poste===k||(k==='salle'&&x.poste==='manager'))&&sMin(x)<B0&&eMin(x)>A0);
    const t=mod.length?mod[0]:{s:cv.svc==='midi'?'11:00':'18:30',e:cv.svc==='midi'?'15:00':'23:00'};
    const x={w,d,s:t.s,e:t.e,p:durMin({s:t.s,e:t.e})>360?20:0,poste:k};const b=solCand(x);
    if(!b&&(S.openShifts||[]).some(o=>o.w===w&&o.d===d&&o.poste===k&&sMin(o)<B0&&eMin(o)>A0))return null; // déjà à pourvoir
    if(b)return {txt:`Ajouter <b>${esc(b.e.prenom)}</b> ${solJour(w,d)} ${x.s}–${x.e} (${solHrs(b)}).`,label:`${b.e.prenom} en renfort ${solJour(w,d)} ${cv.svc}`,run:()=>{S.shifts.push({id:uid('s'),emp:b.e.id,...x,leon:1,lw:`renfort ${cv.svc} (${cv.cv} couverts)`});pushNews(b.e.id,w,`Nouveau shift : ${solJour(w,d)} ${x.s}–${x.e}`);}};
    return {txt:`Personne de libre : Léon crée un shift à pourvoir ${x.s}–${x.e}, l’équipe est prévenue.`,label:`Shift à pourvoir ${solJour(w,d)} ${cv.svc}`,run:()=>{(S.openShifts=S.openShifts||[]).push({id:uid('o'),...x});}};
  }
  }}catch(err){return null;}
  return null;
}
function solBloc(w,a){
  const s=leonSol(w,a);if(!s)return '';const id='s'+(++SOL_N);SOLS[id]={...s,w};
  return `<div class="sol"><span class="sol-ic">${ic('spark','s')}</span><span class="sol-t">${s.txt}</span><button class="btn sm brass" data-act="sol-go" data-id="${id}">Faire</button></div>`;
}
ACT['sol-go']=function(t){const s=SOLS[t.dataset.id];if(!s)return;closeModal&&document.querySelector('#modal-root .modal')&&closeModal();planDo(s.label,()=>{s.run();});};

/* dans le panneau « Léon a vérifié ce planning » */
{const f=alertsPanel;alertsPanel=function(A){
  let h=f.apply(this,arguments);const w=UI.plan.w;
  (A||[]).forEach(a=>{const k=`<b>${esc(a.t)}</b><p>${esc(a.s)}</p>`;const i=h.indexOf(k);if(i<0)return;const sb=solBloc(w,a);if(sb)h=h.slice(0,i+k.length)+sb+h.slice(i+k.length);});
  return h.replace('Léon a vérifié ce planning</h3>','Léon a vérifié ce planning</h3><span class="faint sol-h">Une solution par problème : clique « Faire »</span>');
};}
/* dans le ⚠ d'une case */
{const f=ACT['pl-w'];ACT['pl-w']=function(t){
  f(t);const m=document.querySelector('#modal-root .alerts');if(!m)return;
  const d=t.dataset.d;const L=d!=null&&d!==''?(V12_AL.cell[t.dataset.e+'|'+d]||[]):(V12_AL.emp[t.dataset.e]||[]);
  [...m.querySelectorAll('.al')].forEach((el,i)=>{const a=L[i];if(!a)return;const sb=solBloc(UI.plan.w,a);if(sb){const box=el.querySelector('div:not(.ico)')||el;box.insertAdjacentHTML('beforeend',sb);}});
};}

/* ---------- l'heure voulue par Léon n'est pas un « manque » ---------- */
{const f=planAlerts;planAlerts=function(w){return (f.apply(this,arguments)||[]).filter(a=>{
  if(a.k!=='sous'||!a.emp)return true;const e=empById(a.emp);if(!e)return true;
  return empWeekMin(e.id,w)+solCred(e,w)<solCible(e,w)-60;});};}

/* ---------- tout régler d'un coup ----------
   Léon applique ses solutions une par une (la plus grave d'abord) et recalcule après chaque coup,
   jusqu'à ce qu'il n'y ait plus rien qu'il sache régler. Il s'arrête s'il tourne en rond. */
function solFixables(w){return (planAlerts(w)||[]).filter(a=>leonSol(w,a));}
function leonPolish(w){
  const faits=[],vus=new Set([planState()]);
  for(let i=0;i<40;i++){
    const A=planAlerts(w)||[];let s=null;
    for(const a of A){s=leonSol(w,a);if(s)break;}
    if(!s)break;
    const avant=planState();try{s.run();}catch(e){break;}
    const apres=planState();if(apres===avant||vus.has(apres)){restorePlan(avant);break;}
    vus.add(apres);faits.push(s.label);
  }
  return faits;
}
function restorePlan(js){const o=JSON.parse(js);S.shifts=o.sh;S.absences=o.ab;S.openShifts=o.op;S.dayNotes=o.no;}
function polishRecap(w,faits,titre){
  const reste=(planAlerts(w)||[]).filter(a=>a.tone!=='info');
  openModal(`<div class="mh"><div><h3>${ic('spark')} ${titre}</h3><p>${faits.length?`Léon a réglé ${plur(faits.length,'point','points')} tout seul.`:'Rien à régler de plus.'} ${reste.length?`Il reste ${plur(reste.length,'point')} que tu dois trancher.`:'Le planning est propre.'}</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    ${faits.length?`<details class="sol-det"><summary>Voir ${faits.length>1?`les ${faits.length} changements`:'le changement'}</summary><ul>${faits.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>`:''}
    ${reste.length?`<p style="margin:14px 0 6px;font-weight:600">À toi de voir</p><div class="rm-why">${reste.slice(0,5).map(a=>`<div class="rm-w ${a.tone}"><span class="rm-ic">${ic('alert','s')}</span><div><b>${esc(a.t)}</b><p>${esc(a.s)}</p></div></div>`).join('')}</div>`:''}
    <div class="mf">${faits.length?'<button class="btn" data-act="pl-undo-close">Annuler ce que Léon a fait</button>':''}<button class="btn primary" data-act="modal-close">${reste.length?'OK, je regarde':'Parfait'}</button></div>`,'wide');
}
ACT['sol-all']=function(){
  const w=UI.plan.w;closeModal();let faits=[];
  planDo('Léon a tout réglé',()=>{faits=leonPolish(w);},{quiet:true});
  polishRecap(w,faits,'Léon a repassé le planning');
};
ACT['pl-undo-close']=function(){closeModal();ACT['pl-undo']&&ACT['pl-undo']();};

/* ---------- quand Léon remplit : il repasse derrière lui-même, tout de suite ---------- */
{const f=ACT['pl-fill-go'];ACT['pl-fill-go']=function(){
  const w=FILL&&FILL.w;const r=f.apply(this,arguments);
  if(w!=null){let faits=[];planDo('Léon a peaufiné son planning',()=>{faits=leonPolish(w);},{quiet:true});
    polishRecap(w,faits,'Ton planning est prêt');}
  return r;
};}

/* ---------- le panneau et l'avis : un bouton « Tout régler » ---------- */
{const f=alertsPanel;alertsPanel=function(A){
  const h=f.apply(this,arguments);const n=(A||[]).filter(a=>leonSol(UI.plan.w,a)).length;if(!n)return h;
  return h.replace('<span class="faint sol-h">Une solution par problème : clique « Faire »</span>',`<button class="btn sm brass sol-all" data-act="sol-all">${ic('spark','s')} Tout régler (${n})</button>`);
};}
{const f=avisFlow;avisFlow=function(w){
  f.apply(this,arguments);const n=solFixables(w).length;if(!n)return;
  const mf=document.querySelector('#modal-root .mf');if(!mf)return;
  mf.innerHTML=`<button class="btn" data-act="sol-voir">Voir le détail</button><button class="btn brass" data-act="sol-all">${ic('spark','s')} Léon règle ${n>1?`les ${n} points`:'ça'}</button>`;
};}
ACT['sol-voir']=function(){closeModal();UI.plan.alertsOpen=true;planRender();setTimeout(()=>{const p=document.querySelector('.pl-alerts');p&&p.scrollIntoView({behavior:'smooth',block:'start'});},50);};
