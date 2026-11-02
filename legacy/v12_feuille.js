/* =========================================================
   V12 · FEUILLE DE JOUR (pointage) — prévu / badgé / payé
   Chaque matin, le directeur regarde la journée d'hier : ce qui était prévu, ce qui a été badgé,
   et ce que Léon propose de payer. Il corrige si besoin, puis « Valide la journée » : c'est verrouillé
   pour la paie. Seul le directeur (ou le patron) valide ou rouvre. Les managers voient et corrigent.
   Règles de paie (le plus simple et le plus juste pour un patron) :
   - arrivé en avance, ou jusqu'à 5 min de retard → payé à l'heure prévue ;
   - plus de 5 min de retard → payé à partir de l'arrivée réelle ;
   - parti jusqu'à 15 min après la fin → payé jusqu'à la fin prévue ;
   - parti plus tard → l'heure réelle compte, signalée « heures sup ? » (le directeur garde ou ramène à la fin prévue) ;
   - parti plus tôt → payé jusqu'au départ réel ;
   - pause : celle badgée si elle existe, sinon celle prévue au planning.
   ========================================================= */
const PJ_TOL_IN=5, PJ_TOL_OUT=15;
UI.pj=UI.pj==null?-1:UI.pj; // jour affiché : -1 = hier

function pjCanValider(){const r=effRole();return r==='admin'||r==='patron';}
function pjJour(iso){return ((S.hoursOk||{})[iso]||{})._jour||null;}

// Les morceaux travaillés : [{a,b}] d'après les badges (arrivée/retour → pause/départ).
function pjSegs(ev){const out=[];let open=null;ev.forEach(z=>{if(z.t==='in'||z.t==='back')open=z.m;else if((z.t==='pause'||z.t==='out')&&open!=null){out.push({a:open,b:z.m,t:z.t});open=null;}});return {segs:out,open};}

// Calcul d'une ligne : un salarié, un jour.
function pjLigne(e,iso){
  const date=pdate(iso);const {w,d}=wdOf(date);
  const sh=empShifts(e.id,w,d);const ev=evsOn(e.id,iso);const ab=absOf(e.id,w,d);
  const prevu=sh.reduce((s,x)=>s+durMin(x),0);
  const L={e,iso,w,d,sh,ev,ab,prevu,paye:0,payeS:null,payeE:null,flags:[],ok:((S.hoursOk||{})[iso]||{})[e.id]||null};
  if(!ev.length){
    if(sh.length&&!(ab&&ab.type!=='repos'))L.flags.push({k:'nobadge',t:'Pas de badge'});
    return L;
  }
  const {segs,open}=pjSegs(ev);
  if(open!=null){L.flags.push({k:'noout',t:'Départ pas badgé'});}
  if(!segs.length)return L;
  // Chaque morceau badgé est rattaché au service prévu le plus proche (midi, soir…).
  const per=sh.map(x=>({x,g:[]}));const extra=[];
  segs.forEach(g=>{let best=-1,bo=0;sh.forEach((x,i)=>{const o=Math.min(g.b,eMin(x))-Math.max(g.a,sMin(x));if(o>bo){bo=o;best=i;}});
    if(best<0){let bd=61;sh.forEach((x,i)=>{const dd=Math.min(Math.abs(g.a-sMin(x)),Math.abs(g.b-eMin(x)));if(dd<bd){bd=dd;best=i;}});}
    if(best>=0)per[best].g.push(g);else extra.push(g);});
  const hs=L.ok&&L.ok.motif==='hs';
  L.pieces=[];
  per.forEach(({x,g},i)=>{
    if(!g.length){if(segs.length)L.flags.push({k:'nobadge',t:'Pas de badge '+x.s+'–'+x.e});return;}
    const a=g[0].a,b=g[g.length-1].b,s0=sMin(x),e1=eMin(x);
    let deb=a<=s0+PJ_TOL_IN?s0:a,fin=b;
    if(a>s0+PJ_TOL_IN)L.flags.push({k:'late',t:'Retard '+durShort(a-s0)+(sh.length>1?' ('+x.s+')':'')});
    const dernier=i===sh.length-1;
    if(b>=e1&&b<=e1+PJ_TOL_OUT)fin=e1;
    else if(b>e1+PJ_TOL_OUT){if(!hs)L.flags.push({k:'sup',t:'+'+durShort(b-e1)+' après '+x.e});}
    else if(b<e1-PJ_TOL_OUT&&!(dernier&&open!=null))L.flags.push({k:'early',t:'Parti '+durShort(e1-b)+' plus tôt'+(sh.length>1?' ('+x.e+')':'')});
    const pb=g.slice(1).reduce((s,y,k)=>s+Math.max(0,y.a-g[k].b),0);
    L.pieces.push({s:deb,e:fin,p:pb>0?pb:(x.p||0)});
  });
  if(extra.length){L.flags.push({k:'noshift',t:sh.length?'Badge hors planning':'Pas prévu au planning'});extra.forEach(g=>L.pieces.push({s:g.a,e:g.b,p:0}));}
  L.pieces.sort((u,v)=>u.s-v.s);
  L.paye=L.pieces.reduce((s,q)=>s+Math.max(0,q.e-q.s-q.p),0);
  if(L.pieces.length){L.payeS=L.pieces[0].s;L.payeE=L.pieces[L.pieces.length-1].e;}
  return L;
}

function pjJournee(iso){
  const date=pdate(iso);const {w,d}=wdOf(date);
  return EMP.map(e=>pjLigne(e,iso)).filter(L=>L.sh.length||L.ev.length||(L.ab&&L.ab.type!=='repos'));
}

// La paie lit les heures payées (et plus seulement les badges bruts) — voir l'enveloppe de workedMin plus bas.
function pjPayeMin(empId,iso){const e=empById(empId);if(!e)return 0;return pjLigne(e,iso).paye;}

function feuilleHTML(){
  const can=CAN();
  const date=addDays(TODAY,UI.pj);const iso=isoD(date);const fini=UI.pj<0;
  const L=pjJournee(iso);const jour=pjJour(iso);const verrou=!!jour;
  const prevu=L.reduce((s,x)=>s+x.prevu,0),paye=L.reduce((s,x)=>s+x.paye,0);
  const bloquants=L.filter(x=>x.flags.some(f=>f.k==='noout'||(f.k==='nobadge'&&!x.ok)));
  const aVoir=L.filter(x=>x.flags.length&&!x.ok);
  const retards=L.filter(x=>x.flags.some(f=>f.k==='late')).length;
  const cout=can.salaries?L.reduce((s,x)=>s+x.paye/60*(x.e.taux||0),0):null;
  const nav=`<div class="row wrap pj-nav" style="justify-content:space-between;gap:10px;margin-bottom:14px">
    <div class="row" style="gap:6px">
      <button class="btn sm" data-act="pj-day" data-n="-1" aria-label="Jour précédent" ${UI.pj<=-14?'disabled':''}>${ic('chevL','s')}</button>
      <b class="pj-date">${UI.pj===0?'Aujourd’hui':UI.pj===-1?'Hier':''} <span class="${UI.pj>-2?'faint':''}">${esc(longDate(date))}</span></b>
      <button class="btn sm" data-act="pj-day" data-n="1" aria-label="Jour suivant" ${UI.pj>=0?'disabled':''}>${ic('chevR','s')}</button>
    </div>
    ${verrou?`<div class="row" style="gap:8px"><span class="pill ok"><span class="dot"></span>Validée par ${esc(jour.by)} · verrouillée pour la paie</span>${pjCanValider()?`<button class="btn sm" data-act="pj-rouvrir" data-iso="${iso}">Rouvrir</button>`:''}</div>`
      :pjCanValider()?`<button class="btn primary" data-act="pj-valider" data-iso="${iso}" ${!fini||bloquants.length||!L.length?'disabled':''} title="${!fini?'La journée n’est pas finie':bloquants.length?'Règle d’abord les lignes en rouge':''}">${ic('check','s')} Valider la journée</button>`
      :`<span class="pill warn">En attente du directeur</span>`}
  </div>`;
  const kpis=`<div class="kpis">
    <div class="kpi"><div class="l">Prévu</div><div class="v">${dur(prevu)}</div><div class="s">${plur(L.filter(x=>x.sh.length).length,'personne prévue','personnes prévues')}</div></div>
    <div class="kpi"><div class="l">Payé</div><div class="v">${dur(paye)}</div><div class="s">${paye-prevu===0?'Pile le prévu':`${paye>prevu?'+':''}${dur(paye-prevu)} par rapport au prévu`}</div></div>
    <div class="kpi"><div class="l">Retards</div><div class="v">${retards}</div><div class="s">${retards?'au-delà de 5 min':'personne en retard'}</div></div>
    ${cout!=null?`<div class="kpi"><div class="l">Coût de la journée</div><div class="v">${eur(cout,0)}</div><div class="s">heures payées × taux horaire</div></div>`:`<div class="kpi"><div class="l">À regarder</div><div class="v">${aVoir.length}</div><div class="s">${aVoir.length?'lignes signalées':'tout est propre'}</div></div>`}
  </div>`;
  if(!L.length)return nav+`<section class="panel"><div class="empty"><h3>Rien ce jour-là</h3><p>Personne n’était prévu ni n’a badgé.</p></div></section>`;
  const rows=L.map(x=>{
    const bad=x.flags.some(f=>f.k==='noout'||(f.k==='nobadge'&&!x.ok));
    const chips=x.ev.map(z=>`<span class="ev ${z.t}">${z.t==='in'?'↘':z.t==='out'?'↗':'Ⅱ'} ${hhmm(z.m)}</span>`).join('');
    const act=verrou?'':[
      !x.ev.length&&x.flags.some(f=>f.k==='nobadge')?`<button class="btn sm" data-act="pj-here" data-e="${x.e.id}" data-iso="${iso}">Il était là</button>`:'',
      x.flags.some(f=>f.k==='sup')?`<button class="btn sm" data-act="pj-hs" data-e="${x.e.id}" data-iso="${iso}">Garder les heures sup</button><button class="btn sm" data-act="pj-cut" data-e="${x.e.id}" data-iso="${iso}">Ramener à ${x.sh[x.sh.length-1].e}</button>`:'',
      `<button class="btn sm ghost" data-act="pj-edit" data-e="${x.e.id}" data-iso="${iso}">${ic('edit','s')} Corriger</button>`
    ].join('');
    return `<tr class="${bad?'pj-bad':''}">
      <td><div class="name-cell">${avatar(x.e,'s')}<div><b style="font-size:13.5px">${esc(x.e.prenom)} ${esc(x.e.nom||'')}</b>${x.ok&&x.ok.st==='fix'?'<div class="faint" style="font-size:11.5px">corrigé par '+esc(x.ok.by||'')+'</div>':''}</div></div></td>
      <td class="mono">${x.sh.map(s=>s.s+'–'+s.e).join('<br>')||(x.ab?`<span class="faint">${esc(ABS[x.ab.type]||'Absent')}</span>`:'<span class="faint">—</span>')}${x.sh.some(s=>s.p)?`<div class="faint" style="font-size:11.5px">pause ${durShort(x.sh.reduce((s,y)=>s+(y.p||0),0))}</div>`:''}</td>
      <td><div class="evs">${chips||'<span class="faint">—</span>'}</div></td>
      <td class="mono pj-paye">${x.pieces&&x.pieces.length?x.pieces.map(q=>`<b>${hhmm(q.s)}–${hhmm(q.e)}</b>`).join('<br>')+(x.pieces.some(q=>q.p)?`<div class="faint" style="font-size:11.5px">pause ${durShort(x.pieces.reduce((s,q)=>s+q.p,0))}</div>`:''):'<span class="faint">—</span>'}</td>
      <td class="r tnum"><b>${x.paye?dur(x.paye):'—'}</b>${x.prevu&&x.paye&&x.paye!==x.prevu?`<div class="${x.paye>x.prevu?'pj-up':'pj-down'}">${x.paye>x.prevu?'+':''}${dur(x.paye-x.prevu)}</div>`:''}</td>
      <td>${x.flags.length?x.flags.map(f=>`<span class="pill ${f.k==='noout'||f.k==='nobadge'?'bad':'warn'}" style="margin:2px 4px 2px 0">${esc(f.t)}</span>`).join(''):'<span class="pill ok">OK</span>'}</td>
      <td class="r"><div class="row pj-acts" style="gap:6px;justify-content:flex-end;flex-wrap:wrap">${act}</div></td>
    </tr>`;}).join('');
  return nav+kpis+`<section class="panel"><div class="tbl-wrap"><table class="tbl pj-tbl"><thead><tr><th>Salarié</th><th>Prévu</th><th>Badgé</th><th>Payé</th><th class="r">Total</th><th>À regarder</th><th></th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td>Total</td><td class="tnum">${dur(prevu)}</td><td></td><td></td><td class="r tnum">${dur(paye)}</td><td></td><td></td></tr></tfoot></table></div>
    <p class="faint" style="font-size:12.5px;padding:10px 16px">Payé : arrivé en avance ou jusqu’à 5 min de retard = heure prévue ; parti jusqu’à 15 min après = fin prévue ; au-delà, c’est toi qui décides (heures sup ou fin prévue). ${verrou?'Journée verrouillée : la paie prend ces heures.':pjCanValider()?'Une fois validée, la journée est verrouillée pour la paie.':'Le directeur valide la journée.'}</p></section>`;
}

/* ---------- actions ---------- */
function pjX(t){const e=empById(t.dataset.e);return pjLigne(e,t.dataset.iso);}
function pjLocked(iso){if(pjJour(iso)){toast('Journée validée : rouvre-la d’abord','alert');return true;}return false;}
Object.assign(ACT,{
  'pj-day'(t){UI.pj=Math.max(-14,Math.min(0,UI.pj+(+t.dataset.n)));renderView();},
  'pj-edit'(t){const x=pjX(t);if(pjLocked(x.iso))return;hokEditModal(x);},
  'pj-here'(t){const x=pjX(t);if(pjLocked(x.iso))return;
    confirmBox({title:`${esc(x.e.prenom)} était là ?`,text:`On crée ses badges avec les heures prévues (${x.sh.map(s=>s.s+'–'+s.e).join(' et ')}), marqués « corrigé ».`,ok:'Oui, il était là',onOk:()=>{const ev=ensureEv(x.e.id,x.iso);ev.splice(0,ev.length,...evFromSegs(x.sh.map(s=>({s:s.s,e:s.e,p:s.p||0}))));hokSet(x.e.id,x.iso,'fix','oubli');renderView();toast('Heures ajoutées','check');}});},
  'pj-hs'(t){const x=pjX(t);if(pjLocked(x.iso))return;hokSet(x.e.id,x.iso,'ok','hs');renderView();toast('Heures sup gardées','check');},
  'pj-cut'(t){const x=pjX(t);if(pjLocked(x.iso))return;const last=x.sh[x.sh.length-1];const ev=ensureEv(x.e.id,x.iso);const o=ev.filter(z=>z.t==='out').pop();if(o){o.m=eMin(last);o.by=whoName();}hokSet(x.e.id,x.iso,'fix','autre');renderView();toast(`Ramené à ${last.e}`,'check');},
  'pj-valider'(t){if(!pjCanValider())return;const iso=t.dataset.iso;const L=pjJournee(iso);
    confirmBox({title:'Valider la journée ?',text:`${plur(L.length,'ligne')} · ${dur(L.reduce((s,x)=>s+x.paye,0))} payées. La journée est ensuite verrouillée pour la paie (tu pourras la rouvrir).`,ok:'Valider',onOk:()=>{
      S.hoursOk={...(S.hoursOk||{})};const j={...(S.hoursOk[iso]||{})};
      L.forEach(x=>{if(!j[x.e.id])j[x.e.id]={st:'ok',motif:null,by:whoName(),at:Date.now()};});
      j._jour={by:whoName(),at:Date.now()};S.hoursOk[iso]=j;save();renderView();toast('Journée validée, prête pour la paie','check');}});},
  'pj-rouvrir'(t){if(!pjCanValider())return;const iso=t.dataset.iso;const j={...((S.hoursOk||{})[iso]||{})};delete j._jour;S.hoursOk={...S.hoursOk,[iso]:j};save();renderView();toast('Journée rouverte','edit');},
});

/* ---------- l'onglet, en premier pour le directeur et les managers ---------- */
{const f=viewPointage;viewPointage=function(){
  const can=CAN();
  if(!S||!can.board||!can.hours||!EMP.length)return f.apply(this,arguments);
  const veut=UI.point.tab==='feuille';
  if(veut)UI.point.tab='jour';
  let html=f.apply(this,arguments);
  if(veut)UI.point.tab='feuille';
  const i=html.indexOf('<div class="tabs" role="tablist">');if(i<0)return html;
  const j=html.indexOf('</div>',i);
  let tabs=html.slice(i,j);
  if(veut)tabs=tabs.replace(/aria-selected="true"/g,'aria-selected="false"');
  const n=pjJournee(isoD(addDays(TODAY,-1))).filter(x=>x.flags.length&&!x.ok).length;
  const btn=`<button role="tab" aria-selected="${veut}" data-act="point-tab" data-t="feuille">${ic('list','s')}Feuille de jour${!pjJour(isoD(addDays(TODAY,-1)))&&n?` <span class="nb warn">${n}</span>`:''}</button>`;
  tabs=tabs.replace('<div class="tabs" role="tablist">','<div class="tabs" role="tablist">'+btn);
  const head=html.slice(0,i);
  if(veut)return head+tabs+'</div>'+feuilleHTML();
  return head+tabs+html.slice(j);
};}
if(typeof VIEWS!=='undefined'&&VIEWS.pointage)VIEWS.pointage=viewPointage;

/* ---------- la paie (relevé d'heures) compte les heures PAYÉES ---------- */
let PJ_RELEVE=false;
{const f=releveHTML;releveHTML=function(){PJ_RELEVE=true;try{return f.apply(this,arguments);}finally{PJ_RELEVE=false;}};}
{const f=workedMin;workedMin=function(ev,live){
  if(PJ_RELEVE&&S&&ev&&ev.length&&!live){
    for(const emp in S.pointages){const days=S.pointages[emp];for(const iso in days){if(days[iso]===ev)return pjPayeMin(emp,iso);}}
  }
  return f.apply(this,arguments);
};}
