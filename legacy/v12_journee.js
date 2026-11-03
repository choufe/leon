/* =========================================================
   V12 · « TA JOURNÉE » — ce que le patron voit en ouvrant Léon (tablette ou PC)
   En haut de l'accueil : aujourd'hui (couverts, qui est là midi et soir, qui manque)
   et ce qu'il y a à faire, avec un bouton qui mène direct au bon endroit.
   + ménage : la suppression du resto se fait depuis l'espace créateur (avec double vérification).
   ========================================================= */
function tjHTML(){
  if(!S||effRole()==='staff'||!CAN().editPlanning)return '';
  const d=TIDX,w=0;if(isClosed(d))return `<section class="tj"><div class="tj-h"><b>Aujourd’hui</b><span class="faint">Fermé. Bonne journée.</span></div></section>`;
  let c;try{c=rmCouverts(w,d).c;}catch(_){c=prevOf(d);}
  const sh=shiftsWD(w,d);
  const qui=midi=>[...new Set(sh.filter(x=>midi?sMin(x)<900:eMin(x)>1080).map(x=>x.emp))].map(empById).filter(Boolean);
  const av=L=>L.slice(0,8).map(e=>`<span class="tj-av" title="${esc(e.prenom)}">${avatar(e,'s')}</span>`).join('')+(L.length>8?`<span class="faint">+${L.length-8}</span>`:'');
  const abs=S.absences.filter(a=>a.w===w&&a.d===d&&a.type!=='repos').map(a=>empById(a.emp)).filter(Boolean);
  const svc=(l,cv,L)=>cv||L.length?`<div class="tj-svc"><span class="tj-l">${l}</span><span class="tj-cv">${cv?plur(cv,'couvert'):'—'}</span><span class="tj-avs">${L.length?av(L):'<span class="faint">personne</span>'}</span></div>`:'';
  // à faire
  const todo=[];
  try{const hier=isoD(addDays(TODAY,-1));const st=pjEtatJour(hier);if(st.n&&!st.ok&&pjCanValider())todo.push({t:st.bad?`Badgeuse d’hier : ${plur(st.bad,'ligne à régler','lignes à régler')}`:'Badgeuse d’hier à valider',a:'tj-badge',tone:st.bad?'bad':''});}catch(_){}
  const pend=typeof pendingCount==='function'?pendingCount():0;if(pend)todo.push({t:plur(pend,'demande à valider','demandes à valider'),a:'tj-conges'});
  try{const pub=S.published&&S.published['1'];if(!pub&&S.shifts.some(x=>x.w===1)||!pub&&TIDX>=2)todo.push({t:'Planning de la semaine prochaine à publier',a:'tj-plan',tone:TIDX>=4?'bad':''});}catch(_){}
  try{const b=(planAlerts(0)||[]).filter(a=>a.tone==='bad').length+(planAlerts(1)||[]).filter(a=>a.tone==='bad').length;if(b)todo.push({t:`${plur(b,'problème','problèmes')} au planning (Léon a une solution)`,a:'tj-plan-al'});}catch(_){}
  return `<section class="tj"><div class="tj-h"><b>Aujourd’hui</b><span class="faint">${esc(longDate(TODAY))}</span></div>
    <div class="tj-row">${svc('Midi',c[0],qui(true))}${svc('Soir',c[1],qui(false))}</div>
    ${abs.length?`<p class="tj-abs">${ic('alert','s')} Absent${abs.length>1?'s':''} : ${abs.map(e=>esc(e.prenom)).join(', ')}</p>`:''}
    <div class="tj-todo">${todo.length?todo.map(x=>`<button class="tj-do ${x.tone||''}" data-act="${x.a}">${esc(x.t)} ${ic('chevR','s')}</button>`).join(''):`<span class="tj-ok">${ic('check','s')} Rien à faire de ton côté. Bon service.</span>`}</div></section>`;
}
{const f=todayStrip;todayStrip=function(){return tjHTML()+f.apply(this,arguments);};}
Object.assign(ACT,{
  'tj-badge'(){UI.pj=-1;go('pointage');},
  'tj-conges'(){UI.conges.tab='valider';go('conges');},
  'tj-plan'(){UI.plan.w=1;UI.plan.mode='semaine';go('planning');},
  'tj-plan-al'(){const b1=(planAlerts(0)||[]).some(a=>a.tone==='bad');UI.plan.w=b1?0:1;UI.plan.mode='semaine';UI.plan.alertsOpen=true;go('planning');},
});

/* ---------- ménage ---------- */
// La suppression d'un resto se fait depuis l'espace créateur (code demandé deux fois). On retire le bouton des Réglages.
{const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{if(UI.view==='reglages')document.querySelectorAll('.view section.panel').forEach(s=>{const h=s.querySelector('.panel-h h2,.panel-h h3,summary');if(h&&/Zone administrateur/.test(h.textContent))s.remove();});}catch(e){}return o;};}
