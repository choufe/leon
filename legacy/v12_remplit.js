/* =========================================================
   V12 · « LÉON REMPLIT », VERSION MALINE
   Part de l'algorithme existant (couverts prévus, dispos, contrats, règles HCR, semaine type) et ajoute :
   1. les ÉVÉNEMENTS du planning (note du jour) : match du LOSC, concert, braderie, groupe de 18…
      → plus de monde sur le bon service, et la fin du soir repoussée quand ça finit tard ;
   2. le LISSAGE DES HEURES SUP sur le mois : quelqu'un qui a déjà fait trop d'heures ce mois-ci
      est visé un peu plus bas cette semaine (et passe après les autres pour les renforts) ;
   3. 2 jours de repos par semaine, jamais plus de 5 jours travaillés ;
   4. le coût : masse salariale par rapport au CA prévu, affichée avant d'accepter ;
   5. une explication claire de chaque choix. Rien n'est ajouté sans « Ajouter au brouillon ».
   ========================================================= */
const RM_EVTS=[
  {re:/match|losc|foot|ligue|\bldc\b|psg|stade|derby|coupe d|rugby/i,l:'Match',ic:'spark',k:{midi:1,soir:1.3},fin:30,txt:'plus de monde le soir, et ça finit plus tard'},
  {re:/concert|spectacle|z[ée]nith|festival|show|th[ée]âtre/i,l:'Concert / spectacle',ic:'spark',k:{midi:1,soir:1.25},fin:30,txt:'du monde avant et après le spectacle'},
  {re:/braderie|march[ée] de no[ëe]l|salon|foire|f[êe]te de|nouvel an|saint[- ]valentin|r[ée]veillon|f[êe]te des m[èe]res|f[êe]te des p[èe]res/i,l:'Grosse affluence',ic:'spark',k:{midi:1.35,soir:1.35},fin:0,txt:'grosse affluence toute la journée'},
  {re:/privatis|s[ée]minaire|anniv|groupe|r[ée]sa|banquet|mariage|baptême|comit[ée]/i,l:'Groupe',ic:'users',k:null,fin:0,txt:'un groupe réservé'},
];
function rmEvent(w,d){
  const iso=isoD(dateAt(w,d));const note=((S.dayNotes||{})[iso]||'').trim();if(!note)return null;
  for(const E of RM_EVTS){if(!E.re.test(note))continue;
    const add={midi:0,soir:0};
    if(E.l==='Groupe'){const m=note.match(/(\d{1,3})\s*(?:pers|personnes|couverts|pax|convives)?/i);const n=m?+m[1]:12;
      const soir=/soir|d[îi]ner|\b(1[89]|2[0-3])\s*h/i.test(note)||!/midi|d[ée]jeuner|\b1[0-4]\s*h/i.test(note);add[soir?'soir':'midi']=n;}
    return {...E,note,add,iso};}
  return null;
}
function rmCouverts(w,d){
  const c=prevOf(d).slice();const ev=rmEvent(w,d);
  if(ev){if(ev.k){c[0]=Math.round(c[0]*ev.k.midi);c[1]=Math.round(c[1]*ev.k.soir);}c[0]+=ev.add.midi;c[1]+=ev.add.soir;}
  return {c,ev};
}
// Heures déjà faites ce mois-ci, semaines d'avant (payé si la badgeuse l'a, sinon planifié).
function rmMois(e,w){
  const lundi=dateAt(w,0);const mo=lundi.getMonth();let fait=0,du=0,sem=0;
  for(let pw=w-1;pw>=w-5;pw--){
    const l=dateAt(pw,0);if(l.getMonth()!==mo&&dateAt(pw,6).getMonth()!==mo)break;
    // une semaine à venir pas encore planifiée ne compte pas (sinon elle ferait croire à un manque d'heures)
    if(dateAt(pw,0)>TODAY&&!S.shifts.some(x=>x.w===pw))continue;
    let m=0,jours=0;for(let d=0;d<7;d++){const dt=dateAt(pw,d);if(dt.getMonth()!==mo)continue;jours++;
      if(dt<TODAY&&typeof pjPayeMin==='function'&&evsOn(e.id,isoD(dt)).length)m+=pjPayeMin(e.id,isoD(dt));
      else m+=sum(empShifts(e.id,pw,d),durMin);}
    fait+=m;du+=e.contrat*60*jours/7;sem++; // semaine à cheval sur 2 mois : on ne compte que les jours du mois
  }
  return {surplus:fait-du,sem};
}
function rmCible(e,w){
  const M=rmMois(e,w);const base=e.contrat*60;
  if(M.surplus>60){const baisse=Math.min(M.surplus,Math.round(base*0.2/30)*30);return {cible:base-Math.round(baisse/30)*30,surplus:M.surplus,baisse};}
  return {cible:base,surplus:M.surplus,baisse:0};
}

function autoFillMalin(w){
  const days=[0,1,2,3,4,5,6].filter(d=>!isClosed(d)&&dateAt(w,d)>=TODAY);
  const emps=visEmps();
  const add=[];const log=[];const why=[];
  const CIB={};emps.forEach(e=>CIB[e.id]=rmCible(e,w));
  const shOf=(emp,d)=>[...empShifts(emp,w,d),...add.filter(x=>x.emp===emp&&x.d===d)].sort((a,b)=>sMin(a)-sMin(b));
  const weekMin=emp=>empWeekMin(emp,w)+sum(add.filter(x=>x.emp===emp),durMin);
  const workDays=emp=>[0,1,2,3,4,5,6].filter(d=>shOf(emp,d).length).length;
  const blocked=(emp,d)=>!!absOf(emp,w,d);
  const fits=(e,d,seg)=>{
    if(blocked(e.id,d))return false;
    const x={emp:e.id,d,...seg};if(availClash(x))return false;
    const cur=shOf(e.id,d);
    if(cur.some(o=>sMin(o)<eMin(x)&&eMin(o)>sMin(x)))return false;
    const dayTot=sum(cur,durMin)+durMin(x);if(dayTot>maxDayMin(e))return false;
    const all=[...cur,x];if(amplitudeOf(all)>780)return false;
    if(!cur.length&&workDays(e.id)>=5)return false;                    // 2 jours de repos minimum
    if(weekMin(e.id)+durMin(x)>CIB[e.id].cible+30)return false;          // contrat, lissé sur le mois
    let pd=d-1,pw=w;if(pd<0){pd=6;pw=w-1;}
    const prev=pw===w?shOf(e.id,pd):empShifts(e.id,pw,pd);
    if(prev.length&&(1440-Math.max(...prev.map(eMin)))+Math.min(...all.map(sMin))<660)return false; // 11 h de repos
    let nd=d+1;if(nd<=6){const nx=shOf(e.id,nd);if(nx.length&&(1440-Math.max(...all.map(eMin)))+Math.min(...nx.map(sMin))<660)return false;}
    return true;
  };
  const push=(e,d,seg,poste,pourquoi)=>{const x={id:uid('s'),emp:e.id,w,d,s:seg.s,e:seg.e,p:seg.p||(durMin(seg)>360?20:0),poste,why:pourquoi};add.push(x);return x;};
  // ordre de priorité pour les renforts : d'abord ceux qui ont le moins fait (par rapport à leur cible), jamais ceux en heures sup
  const rang=e=>weekMin(e.id)/Math.max(60,CIB[e.id].cible);

  /* 1. la semaine type, là où la case est vide */
  if(S.tplWeek&&S.tplWeek.length){
    S.tplWeek.forEach(t=>{const e=EMP.find(o=>o.id===t.emp);if(!e||e.hidden||!days.includes(t.d))return;if(empShifts(e.id,w,t.d).length&&!add.some(a=>a.emp===e.id&&a.d===t.d))return;if(fits(e,t.d,t))push(e,t.d,t,t.poste||e.poste,'Semaine type');});
  }
  /* 2. le besoin de chaque service : couverts prévus + événements */
  const pick=(svc,poste)=>{const T=typesFor(poste).filter(t=>t.poste===poste&&t.seg.length===1);const [a,b]=SVC_WIN[svc];return T.find(t=>overlapMin(sMin(t.seg[0]),eMin(t.seg[0]),a,b)>60)||null;};
  const covHave=(d,svc,ps)=>{const [a,b]=SVC_WIN[svc];const on=[...shiftsWD(w,d),...add.filter(x=>x.d===d)].filter(x=>sMin(x)<b&&eMin(x)>a&&ps.includes(x.poste));return new Set(on.map(x=>x.emp)).size;};
  const evs={};
  days.forEach(d=>{
    const {c,ev}=rmCouverts(w,d);if(ev)evs[d]=ev;
    ['midi','soir'].forEach((svc,i)=>{
      const cv=c[i];if(!cv)return;
      const need={salle:Math.max(1,Math.ceil(cv/50)),cuisine:Math.max(1,Math.ceil(cv/55)),bar:cv>=80||(ev&&ev.l==='Match'&&svc==='soir')?1:0};
      const grp={salle:['salle','manager'],cuisine:['cuisine'],bar:['bar']};
      Object.keys(need).forEach(k=>{
        let have=covHave(d,svc,grp[k]);
        const pool=emps.filter(e=>grp[k].includes(e.poste)||(e.skills||[]).includes(k));
        if(!pool.length)return;
        let guard=0;
        while(have<need[k]&&guard++<8){
          const cands=pool.filter(e=>{const ty=pick(svc,grp[k].includes(e.poste)?e.poste:k);return ty&&fits(e,d,ty.seg[0]);})
            .sort((a,b)=>rang(a)-rang(b)||(shOf(a.id,d).length-shOf(b.id,d).length));
          const e=cands[0];
          if(!e){const ty=pick(svc,k);log.push({d,svc,k,miss:need[k]-have,seg:ty?ty.seg[0]:null});break;}
          const po=grp[k].includes(e.poste)?e.poste:k;const ty=pick(svc,po);
          push(e,d,ty.seg[0],po,ev?`${ev.l} : ${cv} couverts ${svc==='midi'?'le midi':'le soir'}`:`${cv} couverts ${svc==='midi'?'le midi':'le soir'}`);have=covHave(d,svc,grp[k]);
        }
      });
    });
  });
  /* 3. soirs d'événement qui finissent tard : on repousse la fin des shifts ajoutés (salle, bar) */
  const repousses=[];
  Object.entries(evs).forEach(([d,ev])=>{d=+d;if(!ev.fin)return;
    add.filter(x=>x.d===d&&sMin(x)>=960&&['salle','manager','bar'].includes(x.poste)).forEach(x=>{
      const e=empById(x.emp);const old=x.e;const ne=hhmm(eMin(x)+ev.fin);
      const test={...x,e:ne};const cur=shOf(x.emp,d).filter(o=>o!==x);
      const tot=sum(cur,durMin)+durMin(test);const nx=d<6?shOf(x.emp,d+1):[];
      const okRepos=!nx.length||(1440-eMin(test))+Math.min(...nx.map(sMin))>=660;
      if(tot<=maxDayMin(e)&&amplitudeOf([...cur,test])<=780&&okRepos&&weekMin(x.emp)+ev.fin<=CIB[x.emp].cible+30){x.e=ne;x.why=(x.why?x.why+' · ':'')+`fin repoussée à ${ne} (au lieu de ${old})`;repousses.push({e,d,ne});}
    });
  });
  /* 4. compléter les contrats trop bas (sans dépasser la cible lissée) */
  emps.forEach(e=>{
    let guard=0;
    const credit=S.absences.filter(a=>a.emp===e.id&&a.w===w&&ABS_PAID.includes(a.type)).length*e.contrat*12;
    while(weekMin(e.id)+credit<CIB[e.id].cible-150&&guard++<6){
      let done=false;
      for(const d of days.slice().sort((a,b)=>sum(rmCouverts(w,b).c)-sum(rmCouverts(w,a).c))){
        const T=typesFor(e.poste).filter(t=>t.poste===e.poste&&t.seg.length===1);
        for(const t of T){if(fits(e,d,t.seg[0])){push(e,d,t.seg[0],e.poste,'Compléter son contrat, sur un jour chargé');done=true;break;}}
        if(done)break;
      }
      if(!done)break;
    }
  });

  /* ---------- ce que Léon a pris en compte ---------- */
  Object.entries(evs).forEach(([d,ev])=>{d=+d;const c0=prevOf(d),c1=rmCouverts(w,d).c;
    why.push({ic:ev.ic,tone:'brass',t:`${JOURS[d]} : ${ev.note}`,s:`${ev.txt}. Couverts prévus ${c0[0]+c0[1]} → ${c1[0]+c1[1]}.${repousses.some(r=>r.d===d)?' Fin du soir repoussée de '+ev.fin+' min pour '+plur(repousses.filter(r=>r.d===d).length,'personne')+'.':''}`});});
  emps.filter(e=>CIB[e.id].baisse>0).forEach(e=>why.push({ic:'clock',tone:'warn',t:`${e.prenom} : déjà +${dur(CIB[e.id].surplus)} ce mois-ci`,s:`Léon vise ${dur(CIB[e.id].cible)} cette semaine au lieu de ${e.contrat}h, pour lisser ses heures sup sur le mois, et ${e.prenom} passe après les autres pour les renforts.`}));
  const sansDispo=emps.filter(e=>[0,1,2,3,4,5,6].some(d=>typeof availOf==='function'&&availOf(e.id,d))).length;
  why.push({ic:'check',tone:'ok',t:'Les règles sont respectées',s:`2 jours de repos par semaine, 11 h de repos entre deux journées, pas plus de ${dur(690)} par jour, contrats${sansDispo?', et les indisponibilités de '+plur(sansDispo,'salarié')+' ':' '}respectés. Les absences et les congés ne sont pas touchés.`});
  if(!Object.keys(evs).length)why.push({ic:'info',tone:'info',t:'Aucun événement noté cette semaine',s:'Ajoute un match, un concert ou un groupe dans la note du jour (en haut de la colonne) : Léon renforcera le bon service.'});

  const cost=sum(add,x=>durMin(x)/60*(empById(x.emp).taux||0));
  return {add,log,why,cible:CIB,min:sum(add,durMin),cost,days};
}

function fillFlowMalin(w){
  const R=autoFill(w);FILL={w,R};
  if(!R.days.length){toast('Cette semaine est passée : Léon ne remplit que les jours à venir','alert');FILL=null;return;}
  const can=CAN();
  const totCA=sum([0,1,2,3,4,5,6],d=>dayCA(d));
  const curC=sum(S.shifts.filter(x=>x.w===w),x=>durMin(x)/60*(empById(x.emp).taux||0));
  const ratio=totCA?(curC+R.cost)/totCA:0;
  const by={};R.add.forEach(x=>{(by[x.emp]=by[x.emp]||[]).push(x);});
  const whyHTML=`<div class="rm-why">${(R.why||[]).map(x=>`<div class="rm-w ${x.tone}"><span class="rm-ic">${ic(x.ic,'s')}</span><div><b>${esc(x.t)}</b><p>${esc(x.s)}</p></div></div>`).join('')}</div>`;
  const list=Object.keys(by).map(id=>{const e=empById(id);const avant=empWeekMin(id,w);const apres=avant+sum(by[id],durMin);const C=R.cible&&R.cible[id];
    return `<div class="rm-r"><div class="rm-n">${avatar(e,'s')}<div><b>${esc(e.prenom)}</b><small>${dur(avant)} → <b>${dur(apres)}</b> / ${e.contrat}h${C&&C.baisse?` <span class="rm-lisse" title="Heures sup lissées sur le mois">visé ${dur(C.cible)}</span>`:''}</small></div></div>
      <div class="rm-sh">${by[id].sort((a,b)=>a.d-b.d||sMin(a)-sMin(b)).map(x=>`<span class="rm-c" data-poste="${x.poste}" title="${esc(x.why||'')}"><b>${JC[x.d]}</b> ${x.s}–${x.e}${/repoussée/.test(x.why||'')?' <i>finit tard</i>':''}</span>`).join('')}</div></div>`;}).join('');
  openModal(`<div class="mh"><div><h3>${ic('wand')} ${R.add.length?`Léon propose ${plur(R.add.length,'shift')}`:'Léon a regardé ta semaine'}</h3>
      <p>${R.add.length?`${dur(R.min)} en plus`:'Rien à ajouter sans casser une règle'}${can.salaries&&totCA?` · masse salariale <b>${pc(ratio,0)}</b> du CA prévu${ratio>0.33?' (un peu haut)':ratio&&ratio<0.25?' (bien tenu)':''}`:''}. Rien n’est ajouté tant que tu n’as pas validé.</p></div>
      <button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <h4 class="rm-h">Ce que Léon a pris en compte</h4>${whyHTML}
    ${R.add.length?`<h4 class="rm-h">Les shifts proposés</h4><div class="rm-list">${list}</div>`:''}
    ${R.log.length?`<h4 class="rm-h">Ce qui manque encore</h4><div class="alerts fill-log">${fillLogHTML(R.log)}</div>${R.log.some(l=>l.seg)?`<label class="fill-opt"><input type="checkbox" id="fill-open" ${fillOpenCount(R)<=6?'checked':''}> Proposer à l’équipe ${plur(fillOpenCount(R),'shift à pourvoir','shifts à pourvoir')} (ceux qui veulent des heures se proposent)</label>`:''}`:''}
    <p class="faint" style="font-size:12.5px;margin-top:10px">Survole un shift pour voir pourquoi Léon l’a proposé. Seulement les jours à venir ; les shifts déjà posés ne bougent pas. Tout s’annule en un clic.</p>
    <div class="mf"><button class="btn" data-act="modal-close">Annuler</button>${R.add.length?`<button class="btn primary" data-act="pl-fill-go">${ic('check','s')} Ajouter au brouillon</button>`:R.log.some(l=>l.seg)?`<button class="btn primary" data-act="pl-fill-open">${ic('hand','s')} Créer les shifts à pourvoir</button>`:''}</div>`,'wide');
}
autoFill=withW(autoFillMalin);
fillFlow=withW(fillFlowMalin);
// on ne garde pas l'explication dans le planning enregistré
{const f=ACT['pl-fill-go'];ACT['pl-fill-go']=function(){if(FILL&&FILL.R)FILL.R.add.forEach(x=>{delete x.why;});return f.apply(this,arguments);};}
