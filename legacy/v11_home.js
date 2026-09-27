/* =========================================================
   V11 · ACCUEIL
   La bande du jour suit les accès : un chef sans accès au CA voit
   les couverts prévus et les plats épuisés à la place des ventes.
   ========================================================= */
function todayStrip(){
  const can=CAN(),k=liveStats();const ok=v=>navItems().some(n=>n.v===v);
  const cell=(v,t,label,val,sub,tone)=>{const inner=`<small>${label}</small><b>${val}</b>${sub?`<span>${sub}</span>`:''}`;
    return ok(v)?`<button class="ts ${tone||''}" data-act="go-mod" data-v="${v}" ${t?`data-t="${t}"`:''}>${inner}</button>`:`<div class="ts ${tone||''}">${inner}</div>`;};
  const svc=isSvcBiz();const cells=[];
  if(can.ca)cells.push(cell('stats','',svc?'Encaissé aujourd’hui':'Ventes du jour',`${eur(k.caHT,0)}<i>HT</i>`,k.caPrev?'prévu '+eur(k.caPrev,0):plur(k.tickets,'ticket')));
  else{const p=prevOf(TIDX);cells.push(cell('planning','',svc?'Clients prévus':'Couverts prévus',`${p[0]+p[1]}`,svc?'':`${p[0]} midi · ${p[1]} soir`));}
  cells.push(cell('pointage','jour','Au travail',`${k.present}<i>/ ${k.planned}</i>`,k.late?plur(k.late,'retard'):(EMP.length?'personne en retard':'équipe à créer'),k.late?'bad':''));
  if(can.salaries)cells.push(cell('pointage','jour','Masse salariale',k.caHT?pc(k.msr,0):eur(k.ms,0),k.caHT?eur(k.ms,0)+' d’heures':dur(k.msMin)+' pointées',k.caHT&&k.msr>0.36?'warn':''));
  if(can.costs&&can.ca)cells.push(cell('recettes','analyse',svc?'Coût produits':'Coût matière',k.caHT?pc(k.fc,0):'—','objectif '+pc(S.target,0),k.caHT&&k.fcTone==='bad'?'warn':''));
  if(!can.ca||cells.length<4)cells.push(cell('service','',svc?'Pas disponible':'Plats épuisés',`${k.off.length}`,k.low.length?plur(k.low.length,'bientôt épuisé','bientôt épuisés'):'tout est dispo',k.off.length?'warn':''));
  return `<div class="tstrip">${cells.slice(0,4).join('')}</div>`;
}
function viewAccueilLive(){
  const r=effRole();
  if(r==='staff')return staffHome();
  const m=me();const layout=getLayout(r);const can=CAN();
  const hid=k=>layout.some(b=>b.k===k&&b.hide);
  const title=k=>{const b=layout.find(x=>x.k===k);return (b&&b.t)||HOME_BLOCKS[k].t;};
  const head=`<div class="ph hm-ph"><div><h1>${r==='admin'?esc(S.nom):'Bonjour '+esc(m.prenom)}</h1><p class="sub">${r==='admin'?'Tu y es en créateur · ':esc(S.nom)+' · '}${svcLabel()}</p></div><div class="acts">${U.empId&&r==='manager'?`<button class="btn sm lang-btn" data-act="lang-open">${ic('globe','s')} ${LANG_SHORT[LANG]||'FR'}</button>`:''}${U.role==='admin'?`<button class="btn sm" data-act="pz-open">${ic('edit','s')} Personnaliser</button>`:''}</div></div>`;
  const setup=(can.settings||can.board)&&!hid('setup')?setupCard():'';
  const zones=hid('raccourcis')?'':`<div class="zones-h"><h2 class="sec-t">${esc(['Tes applis','Accès rapide'].includes(title('raccourcis'))?'Tes espaces':title('raccourcis'))}</h2></div>${zoneCardsHTML()}`;
  const tasks=U.empId&&typeof tasksBlock==='function'?tasksBlock(empById(U.empId)):'';
  const MORE=['topflop','commandes','carte','presence','ventes'].filter(k=>k!=='ventes'||can.ca);
  const more=layout.filter(b=>MORE.includes(b.k)&&!b.hide).map(b=>{const h=blockHTML(b);return h?`<div class="hb ${HOME_BLOCKS[b.k].full?'full':''}">${h}</div>`:'';}).join('');
  const mOpen=foldOpen('home:more');
  const moreSec=more?`<section class="more-home ${mOpen?'':'folded'}" data-fold-key="home:more"><button class="more-tg" data-act="fold" aria-expanded="${mOpen}"><span class="fold-ic">${ic('chevD','s')}</span><span><b>Plus de détails</b><small>${can.ca?'Top 10 / Flop 10, commandes, qui est là, ventes du jour':'Top 10 / Flop 10, commandes, qui est là'}</small></span></button><div class="home-grid">${more}</div></section>`:'';
  return head+setup+(hid('kpis')?'':todayStrip())+zones+(hid('alerts')?'':todoBlock(title('alerts')==='Léon a repéré'?'À regarder':title('alerts')))+tasks+(hid('annonces')?'':annoncesBlock(title('annonces')))+moreSec;
}
