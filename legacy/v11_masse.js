/* =========================================================
   11.05 · OBJECTIF MASSE SALARIALE
   - Le patron fixe son objectif (% du CA HT, 30 % par défaut)
   - Bandeau « Budget de la semaine » au-dessus du planning :
     heures planifiées vs heures que le CA prévu peut payer
   - Détail jour par jour, avec les heures en trop ou la marge
   - Alerte d'accueil sur la semaine en cours / la suivante
   Les managers sans accès aux salaires voient le budget en
   heures seulement (jamais de montants).
   ========================================================= */
META_KEYS.push('msTarget');
const MS_DEF=0.30;
const msTarget=()=>{const t=S&&+S.msTarget;return t>0.1&&t<0.6?t:MS_DEF;};
/* ok = dans l'objectif, warn = jusqu'à 4 points au-dessus, bad = au-delà */
function msTone(r){const t=msTarget();return r<=t+0.0005?'ok':r<=t+0.04?'warn':'bad';}

Object.assign(INFO,{
  msBudget:{t:'Budget heures',d:'Combien d’heures tes ventes prévues peuvent payer, pour tenir ton objectif de masse salariale.',f:'CA HT prévu × objectif ÷ coût horaire chargé moyen de l’équipe',r:'Au-dessus : quelqu’un est de trop sur un créneau calme. En dessous : vérifie que la couverture des coups de feu tient.'},
});

/* coût horaire moyen : pondéré par les heures de la semaine, sinon moyenne de l'équipe */
function msAvgRate(w){
  const sh=S.shifts.filter(x=>x.w===w);const m=sum(sh,durMin);
  if(m>0){const c=sum(sh,x=>durMin(x)/60*(empById(x.emp).taux||0));if(c>0)return c/(m/60);}
  const t=EMP.filter(e=>!e.hidden&&e.taux>0);return t.length?sum(t,e=>e.taux)/t.length:0;
}
const msWeek=withW(function(w){
  const rate=msAvgRate(w);const tg=msTarget();
  const days=[0,1,2,3,4,5,6].filter(d=>!isClosed(d)).map(d=>{
    const ca=dayCA(d);const min=sum(shiftsWD(w,d),durMin);const cost=dayCost(w,d);
    const bMin=rate?ca*tg/rate*60:0;
    return {d,ca,min,cost,bMin,gap:min-bMin,r:ca?cost/ca:0};
  });
  const T={ca:sum(days,x=>x.ca),min:sum(days,x=>x.min),cost:sum(days,x=>x.cost),bMin:sum(days,x=>x.bMin)};
  T.gap=T.min-T.bMin;T.r=T.ca?T.cost/T.ca:0;
  return {w,rate,tg,days,T};
});
/* on arrondit à la demi-heure : un écart de 10 min ne veut rien dire */
const msRound=m=>Math.round(m/30)*30;
function msGapTxt(gap){const g=msRound(gap);if(Math.abs(g)<60)return 'pile dans le budget';return g>0?`${dur(g)} de trop`:`${dur(-g)} de marge`;}

function msStrip(w){
  const can=CAN();const W=msWeek(w);if(!W.T.ca||!W.rate)return '';
  const tone=msTone(W.T.r);const pct=Math.min(100,W.T.bMin?W.T.min/W.T.bMin*100:0);
  const over=W.days.filter(x=>msRound(x.gap)>=60).sort((a,b)=>b.gap-a.gap);
  const main=can.salaries
    ?`<b>${pc(W.T.r,1)}</b> de masse salariale prévue <span class="faint">· objectif ${pc(W.tg,0)}</span>`
    :`<b>${dur(W.T.min)}</b> planifiées <span class="faint">· budget ${dur(msRound(W.T.bMin))}</span>`;
  const sub=`${dur(W.T.min)} planifiées pour ${dur(msRound(W.T.bMin))} de budget : <b class="${tone}-t">${msGapTxt(W.T.gap)}</b>${over.length?` · surtout ${over.slice(0,2).map(x=>JOURS[x.d].toLowerCase()).join(' et ')}`:''}`;
  return `<section class="ms-strip ${tone}" aria-label="Budget de la semaine">
    <span class="ico ${tone}">${ic('euro','s')}</span>
    <div class="ms-txt"><div>${main}</div><p>${can.salaries?sub:`${msGapTxt(W.T.gap)}${over.length?` · surtout ${over.slice(0,2).map(x=>JOURS[x.d].toLowerCase()).join(' et ')}`:''}`}</p>
      <div class="ms-meter" title="Heures planifiées / budget"><i style="width:${pct}%"></i></div></div>
    <button class="btn sm" data-act="ms-open" data-w="${w}">Détail</button>
  </section>`;
}

{const f=planBar;planBar=function(w,edit,staff,A){
  const out=f.apply(this,arguments);
  try{const P=UI.plan;if(staff||!edit||P.mode==='mois')return out;return out+msStrip(w);}catch(e){console.error('budget semaine',e);return out;}
};}

function msModal(w){
  const can=CAN();const W=msWeek(w);
  const rows=W.days.map(x=>{const t=x.ca?msTone(x.r):'';const g=msRound(x.gap);
    return `<tr><td><b>${JOURS[x.d]}</b></td>${can.ca?`<td class="tnum">${eur(x.ca,0)}</td>`:''}<td class="tnum">${dur(msRound(x.bMin))}</td><td class="tnum">${dur(x.min)}</td><td class="tnum ${g>=60?'bad-t':g<=-60?'info-t':''}">${Math.abs(g)<60?'✓':(g>0?'+':'')+dur(g)}</td>${can.salaries?`<td class="tnum"><span class="pill ${t}" style="font-size:11px;padding:.05rem .4rem">${x.ca?pc(x.r,0):'—'}</span></td>`:''}<td><button class="btn xs ghost" data-act="ms-day" data-w="${w}" data-d="${x.d}">Voir</button></td></tr>`;}).join('');
  const editT=can.salaries&&can.settings;
  openModal(`<div class="mh"><div><h3>Budget de la ${weekLabel(w).toLowerCase()}</h3><p>Combien d’heures tes ventes prévues peuvent payer, jour par jour. ${infoBtn('msBudget')}</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   ${editT?`<div class="field ms-tg"><label for="ms-in">Mon objectif de masse salariale (% du CA HT)</label><div class="row" style="gap:8px"><input class="inp" id="ms-in" type="number" min="15" max="50" step="0.5" inputmode="decimal" value="${nf(W.tg*100,1).replace(',','.')}" style="max-width:110px"><button class="btn sm primary" data-act="ms-save" data-w="${w}">Enregistrer</button></div><small class="faint">En brasserie, on vise souvent 30 à 35 % patron compris.</small></div>`:''}
   <div class="tbl-wrap"><table class="tbl ms-t"><thead><tr><th>Jour</th>${can.ca?'<th>CA prévu</th>':''}<th>Budget</th><th>Planifié</th><th>Écart</th>${can.salaries?'<th>Masse sal.</th>':''}<th></th></tr></thead><tbody>${rows}</tbody>
   <tfoot><tr><td>Semaine</td>${can.ca?`<td class="tnum">${eur(W.T.ca,0)}</td>`:''}<td class="tnum">${dur(msRound(W.T.bMin))}</td><td class="tnum">${dur(W.T.min)}</td><td class="tnum">${Math.abs(msRound(W.T.gap))<60?'✓':(W.T.gap>0?'+':'')+dur(msRound(W.T.gap))}</td>${can.salaries?`<td class="tnum"><b>${pc(W.T.r,1)}</b></td>`:''}<td></td></tr></tfoot></table></div>
   <p class="faint" style="font-size:12.5px;margin-top:10px">${can.ca?'CA prévu = couverts prévus × ticket moyen (Réglages › Prévisions). ':''}Budget = ventes prévues × objectif ÷ coût horaire moyen de l’équipe${can.salaries?` (${eur(W.rate,2)} chargé)`:''}. Un jour en trop : regarde la vue Jour, la courbe montre les créneaux calmes.</p>
   <div class="mf"><button class="btn" data-act="modal-close">Fermer</button></div>`,'wide');
}

Object.assign(ACT,{
  'ms-open'(t){msModal(+t.dataset.w||0);},
  'ms-save'(t){const v=+(($('#ms-in')||{}).value||'').replace(',','.');
    if(!(v>=15&&v<=50)){toast('Entre un objectif entre 15 et 50 %','alert');return;}
    S.msTarget=Math.round(v*10)/1000;save();toast(`Objectif masse salariale : ${pc(S.msTarget,0)}`,'euro');msModal(+t.dataset.w||0);renderView();},
  'ms-day'(t){closeModal();UI.view='planning';UI.plan.w=+t.dataset.w||0;UI.plan.mode='jour';UI.plan.day=+t.dataset.d;render();window.scrollTo({top:0});},
});

/* ---------- accueil : on remplace l'ancienne alerte « un jour à 34 % » par le budget de la semaine ---------- */
{const f=leonAlerts;leonAlerts=function(){
  const A=f();if(!S)return A;
  return A.filter(a=>!(a.ic==='euro'&&/masse salariale à .* du CA prévu$/.test(a.t||'')));
};}
V11_ALERTS.push(()=>{
  const can=CAN();if(!can.salaries&&!can.editPlanning)return [];
  const out=[];
  [0,1].forEach(w=>{
    if(!S.shifts.some(x=>x.w===w))return;
    const W=msWeek(w);if(!W.T.ca||!W.rate)return;
    const g=msRound(W.T.gap);if(g<120)return;
    const tone=msTone(W.T.r);if(tone==='ok')return;
    const lbl=w===0?'Cette semaine':`Semaine ${isoWeek(dateAt(w,0))}`;
    const worst=W.days.slice().sort((a,b)=>b.gap-a.gap)[0];
    out.push({tone:tone==='bad'?'bad':'warn',ic:'euro',
      t:can.salaries?`${lbl} : masse salariale à ${pc(W.T.r,0)} (objectif ${pc(W.tg,0)})`:`${lbl} : ${dur(g)} de plus que le budget`,
      s:`${dur(g)} planifiées en trop pour les ventes prévues${worst&&msRound(worst.gap)>=60?`, surtout ${JOURS[worst.d].toLowerCase()} (+${dur(msRound(worst.gap))})`:''}.`,
      acts:[{l:'Voir le budget',act:'ms-open',w}],
      key:`al:ms:${isoWeek(dateAt(w,0))}:${Math.round(W.T.r*100)}`});
  });
  return out;
});
