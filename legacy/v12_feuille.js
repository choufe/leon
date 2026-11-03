/* =========================================================
   V12 · BADGEUSE (pointage) — prévu / badgé / payé, façon Skello
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
   Le BADGÉ n'est jamais modifié. Le directeur corrige le PAYÉ directement dans le tableau.
   ========================================================= */
const PJ_TOL_IN=5, PJ_TOL_OUT=15;
UI.pj=UI.pj==null?-1:UI.pj; // jour affiché : -1 = hier

function pjCanValider(){const r=effRole();return r==='admin'||r==='patron';}
function pjJour(iso){return ((S.hoursOk||{})[iso]||{})._jour||null;}

// Les morceaux travaillés : [{a,b}] d'après les badges (arrivée/retour → pause/départ).
function pjSegs(ev){const out=[];let open=null;ev.forEach(z=>{if(z.t==='in'||z.t==='back')open=z.m;else if((z.t==='pause'||z.t==='out')&&open!=null){out.push({a:open,b:z.m,t:z.t});open=null;}});return {segs:out,open};}

// Calcul brut d'une ligne : un salarié, un jour, d'après le planning et les badges.
function pjCalc(e,iso){
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

// Ligne finale : le calcul de Léon, ou le payé retenu par le directeur s'il l'a corrigé.
function pjLigne(e,iso){
  const L=pjCalc(e,iso);
  const o=L.ok;
  if(o&&Array.isArray(o.paye)){
    L.calcPieces=L.pieces||[];
    L.pieces=o.paye.map(q=>{const s=toMin(q.s);let f=toMin(q.e);if(f<=s)f+=1440;return {s,e:f,p:+q.p||0};}).sort((u,v)=>u.s-v.s);
    L.paye=L.pieces.reduce((t,q)=>t+Math.max(0,q.e-q.s-q.p),0);
    L.override=true;L.abs=!!o.abs;
    L.flags=L.flags.filter(f=>f.k==='late'||f.k==='early');
    if(L.abs)L.flags=[{k:'abs',t:'Absent'}];
  }
  return L;
}

function pjJournee(iso){
  return EMP.map(e=>pjLigne(e,iso)).filter(L=>L.sh.length||L.ev.length||(L.ab&&L.ab.type!=='repos'));
}
function pjEtatJour(iso){
  const L=pjJournee(iso);
  if(iso>=TODAY_ISO)return {n:L.length,bad:0,voir:0,ok:!!pjJour(iso)};
  return {n:L.length,bad:L.filter(x=>x.flags.some(f=>f.k==='noout'||f.k==='nobadge')).length,voir:L.filter(x=>x.flags.some(f=>f.k!=='abs')&&!x.ok).length,ok:!!pjJour(iso)};
}

// La paie lit les heures payées (et plus seulement les badges bruts) — voir l'enveloppe de workedMin plus bas.
function pjPayeMin(empId,iso){const e=empById(empId);if(!e)return 0;return pjLigne(e,iso).paye;}

const pjT=m=>hhmm(m);
function pjBadgeHTML(x){
  if(!x.ev.length)return '<span class="pj-nob">Pas de badge</span>';
  const {segs,open}=pjSegs(x.ev);
  const parts=segs.map(g=>{
    const sh=x.sh.find(y=>Math.min(g.b,eMin(y))-Math.max(g.a,sMin(y))>0)||null;
    const inC=sh?(g.a>sMin(sh)+PJ_TOL_IN?'late':'ok'):'';const outC=sh?(g.b>eMin(sh)+PJ_TOL_OUT?'sup':g.b<eMin(sh)-PJ_TOL_OUT?'late':'ok'):'';
    return `<span class="pj-b"><i class="${inC}">${pjT(g.a)}</i>–<i class="${outC}">${g.t==='pause'?'pause':pjT(g.b)}</i></span>`;});
  if(open!=null)parts.push(`<span class="pj-b"><i>${pjT(open)}</i>–<i class="miss">?</i></span>`);
  return parts.join('');
}

function feuilleHTML(){
  const can=CAN();
  const date=addDays(TODAY,UI.pj);const iso=isoD(date);const fini=UI.pj<0;
  const L=pjJournee(iso);const jour=pjJour(iso);const verrou=!!jour;
  const prevu=L.reduce((s,x)=>s+x.prevu,0),paye=L.reduce((s,x)=>s+x.paye,0);
  const bloquants=L.filter(x=>!x.override&&x.flags.some(f=>f.k==='noout'||f.k==='nobadge'));
  const retards=L.filter(x=>x.flags.some(f=>f.k==='late')).length;
  const cout=can.salaries?L.reduce((s,x)=>s+x.paye/60*(x.e.taux||0),0):null;
  // colonne des jours (la semaine du jour affiché)
  const {d:dIdx}=wdOf(date);
  const lundi=addDays(date,-dIdx);
  const jours=[0,1,2,3,4,5,6].map(k=>{
    const dt=addDays(lundi,k);const off=Math.round((dt-TODAY)/864e5);const i2=isoD(dt);
    const futur=off>0;const st=futur?null:pjEtatJour(i2);
    const ico=futur?'':st.ok?`<span class="pj-ck ok" title="Validée">${ic('check','s')}</span>`:st.bad?`<span class="pj-ck bad" title="${st.bad} à régler">${st.bad}</span>`:st.n?`<span class="pj-ck" title="À valider"></span>`:'';
    return `<button class="pj-day ${off===UI.pj?'on':''}" data-act="pj-goto" data-n="${off}" ${futur||off<-60?'disabled':''}><span><b>${JOURS[dt.getDay()===0?6:dt.getDay()-1]}</b> ${dt.getDate()} ${MC[dt.getMonth()]}</span>${ico}</button>`;
  }).join('');
  const side=`<aside class="pj-side"><div class="pj-wk"><button class="icon-btn" data-act="pj-week" data-n="-7" aria-label="Semaine précédente">${ic('chevL','s')}</button><span>Sem. ${isoWeek(lundi)}</span><button class="icon-btn" data-act="pj-week" data-n="7" aria-label="Semaine suivante" ${UI.pj+7-dIdx>0?'disabled':''}>${ic('chevR','s')}</button></div>${jours}</aside>`;
  const top=`<div class="pj-top">
    <div><h2 class="pj-titre">${UI.pj===0?'Aujourd’hui · ':UI.pj===-1?'Hier · ':''}${esc(longDate(date))}</h2>
      <div class="pj-stats"><span>Prévu <b>${dur(prevu)}</b></span><span>Payé <b>${dur(paye)}</b>${paye!==prevu&&prevu?` <em class="${paye>prevu?'up':'down'}">${paye>prevu?'+':''}${dur(paye-prevu)}</em>`:''}</span><span>Retards <b>${retards}</b></span>${cout!=null?`<span>Coût <b>${eur(cout,0)}</b></span>`:''}</div></div>
    ${verrou?`<div class="row" style="gap:8px"><span class="pill ok"><span class="dot"></span>Validée par ${esc(jour.by)} · verrouillée pour la paie</span>${pjCanValider()?`<button class="btn sm" data-act="pj-rouvrir" data-iso="${iso}">Rouvrir</button>`:''}</div>`
      :pjCanValider()?`<button class="btn primary" data-act="pj-valider" data-iso="${iso}" ${!fini||bloquants.length||!L.length?'disabled':''} title="${!fini?'La journée n’est pas finie':bloquants.length?'Règle d’abord les lignes en rouge':''}">${ic('check','s')} Valider la journée</button>`
      :`<span class="pill warn">En attente du directeur</span>`}
  </div>`;
  if(!L.length)return `<div class="pj">${side}<section class="pj-main">${top}<div class="panel"><div class="empty"><h3>Rien ce jour-là</h3><p>Personne n’était prévu ni n’a badgé.</p></div></div></section></div>`;
  const dis=verrou?'disabled':'';
  const rows=L.map(x=>{
    const bad=!x.override&&x.flags.some(f=>f.k==='noout'||f.k==='nobadge');
    const pcs=x.pieces&&x.pieces.length?x.pieces:(x.sh.length?[]:[]);
    const inputs=x.abs?'<span class="faint">Absent</span>':(!x.sh.length&&!x.ev.length)?'<span class="faint">—</span>':(pcs.length?pcs:[{s:null,e:null,p:0}]).map((q,i)=>`<div class="pj-in-row" data-e="${x.e.id}" data-iso="${iso}" data-i="${i}">
        <input class="pj-in s" type="text" inputmode="numeric" maxlength="5" placeholder="--:--" value="${q.s!=null?pjT(q.s):''}" aria-label="Payé début" ${dis}><span>–</span><input class="pj-in e" type="text" inputmode="numeric" maxlength="5" placeholder="--:--" value="${q.e!=null?pjT(q.e):''}" aria-label="Payé fin" ${dis}>
        <input class="pj-in p" type="number" min="0" max="180" step="5" value="${q.p||0}" aria-label="Pause en minutes" title="Pause (min)" ${dis}></div>`).join('');
    const quick=verrou?'':[
      !x.ev.length&&x.sh.length&&!x.override?`<button class="btn xs" data-act="pj-here" data-e="${x.e.id}" data-iso="${iso}">Il était là</button>`:'',
      x.flags.some(f=>f.k==='sup')&&!x.override?`<button class="btn xs" data-act="pj-hs" data-e="${x.e.id}" data-iso="${iso}">Garder les heures sup</button><button class="btn xs" data-act="pj-cut" data-e="${x.e.id}" data-iso="${iso}">Fin à ${x.sh[x.sh.length-1].e}</button>`:'',
      x.override?`<button class="btn xs ghost" data-act="pj-reset" data-e="${x.e.id}" data-iso="${iso}" title="Revenir au calcul de Léon">${ic('undo','s')} Calcul Léon</button>`:''].join('');
    const valide=verrou||x.ok;
    return `<tr class="${bad?'pj-bad':''} ${x.override?'pj-ovr':''}">
      <td class="pj-v">${valide?`<span class="pj-ck ok">${ic('check','s')}</span>`:'<span class="pj-ck"></span>'}</td>
      <td><div class="name-cell">${avatar(x.e,'s')}<div><b>${esc(x.e.prenom)} ${esc(x.e.nom||'')}</b>${x.flags.length?`<div class="pj-flags">${x.flags.map(f=>`<span class="pj-f ${f.k==='noout'||f.k==='nobadge'?'bad':f.k==='abs'?'':'warn'}">${esc(f.t)}</span>`).join('')}</div>`:''}</div></div></td>
      <td class="mono pj-prev">${x.sh.map(s=>`<span>${s.s}–${s.e}</span>`).join('')||(x.ab?`<span class="faint">${esc(ABS[x.ab.type]||'Absent')}</span>`:'<span class="faint">—</span>')}</td>
      <td class="mono pj-pz">${x.sh.reduce((s,y)=>s+(y.p||0),0)?durShort(x.sh.reduce((s,y)=>s+(y.p||0),0)):'—'}</td>
      <td class="mono pj-bdg">${pjBadgeHTML(x)}</td>
      <td class="pj-pay">${inputs}${x.override?`<div class="pj-ovr-t">corrigé${x.ok&&x.ok.by?' par '+esc(x.ok.by):''}</div>`:''}${quick?`<div class="pj-q">${quick}</div>`:''}</td>
      <td class="pj-abs"><input type="checkbox" class="pj-absc" data-e="${x.e.id}" data-iso="${iso}" ${x.abs?'checked':''} ${dis} aria-label="Absent"></td>
      <td class="r tnum pj-tot"><b>${x.paye?dur(x.paye):'—'}</b>${x.prevu&&x.paye!==x.prevu&&!x.abs?`<div class="${x.paye>x.prevu?'up':'down'}">${x.paye>x.prevu?'+':''}${dur(x.paye-x.prevu)}</div>`:''}</td>
    </tr>`;}).join('');
  return `<div class="pj">${side}<section class="pj-main">${top}
    <div class="panel pj-panel"><div class="tbl-wrap"><table class="tbl pj-tbl"><thead><tr><th></th><th>Salarié</th><th>Prévu</th><th>Pause</th><th>Badgé</th><th>Payé <span class="faint" style="text-transform:none;letter-spacing:0">(début – fin · pause min)</span></th><th>Abs.</th><th class="r">Total</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td></td><td>Total</td><td class="tnum">${dur(prevu)}</td><td></td><td></td><td></td><td></td><td class="r tnum">${dur(paye)}</td></tr></tfoot></table></div>
    <p class="faint pj-regle">Badgé : vert = à l’heure, rouge = retard ou départ manquant, bleu = parti après la fin. Payé : Léon le calcule (en avance ou jusqu’à 5 min de retard = heure prévue ; jusqu’à 15 min après la fin = fin prévue). Tu peux le changer directement : c’est le payé qui part en paie, le badgé ne bouge jamais.</p></div></section></div>`;
}

/* ---------- actions ---------- */
function pjX(t){const e=empById(t.dataset.e);return pjLigne(e,t.dataset.iso);}
function pjLocked(iso){if(pjJour(iso)){toast('Journée validée : rouvre-la d’abord','alert');return true;}return false;}
function pjSetPaye(emp,iso,paye,extra){
  S.hoursOk={...(S.hoursOk||{})};S.hoursOk[iso]={...(S.hoursOk[iso]||{}),[emp]:{st:'fix',motif:'autre',paye,by:whoName(),at:Date.now(),...(extra||{})}};save();
}
// « 1500 », « 15h », « 15:00 », « 9h30 » → « 15:00 »
function pjHeure(v){v=String(v||'').trim().toLowerCase().replace('h',':');if(!v)return null;let m=v.match(/^(\d{1,2}):?(\d{2})?$/);if(!m&&/^\d{3,4}$/.test(v))m=[0,v.slice(0,-2),v.slice(-2)];if(!m)return null;const h=+m[1],mi=+(m[2]||0);if(h>23||mi>59)return null;return pad(h)+':'+pad(mi);}
const pjFmt=q=>({s:hhmm(q.s),e:hhmm(q.e),p:q.p||0});
Object.assign(ACT,{
  'pj-goto'(t){UI.pj=+t.dataset.n;renderView();},
  'pj-week'(t){UI.pj=Math.min(0,Math.max(-60,UI.pj+(+t.dataset.n)));renderView();},
  'pj-day'(t){UI.pj=Math.max(-60,Math.min(0,UI.pj+(+t.dataset.n)));renderView();},
  'pj-here'(t){const x=pjX(t);if(pjLocked(x.iso))return;pjSetPaye(x.e.id,x.iso,x.sh.map(s=>({s:s.s,e:s.e,p:s.p||0})));renderView();toast('Payé = heures prévues','check');},
  'pj-hs'(t){const x=pjX(t);if(pjLocked(x.iso))return;hokSet(x.e.id,x.iso,'ok','hs');renderView();toast('Heures sup gardées','check');},
  'pj-cut'(t){const x=pjX(t);if(pjLocked(x.iso))return;const last=x.sh[x.sh.length-1];const pcs=(x.pieces||[]).map(pjFmt);if(pcs.length)pcs[pcs.length-1].e=last.e;pjSetPaye(x.e.id,x.iso,pcs);renderView();toast(`Payé jusqu’à ${last.e}`,'check');},
  'pj-reset'(t){const x=pjX(t);if(pjLocked(x.iso))return;const j={...((S.hoursOk||{})[x.iso]||{})};delete j[x.e.id];S.hoursOk={...S.hoursOk,[x.iso]:j};save();renderView();toast('Retour au calcul de Léon','edit');},
  'pj-valider'(t){if(!pjCanValider())return;const iso=t.dataset.iso;const L=pjJournee(iso);
    confirmBox({title:'Valider la journée ?',text:`${plur(L.length,'ligne')} · ${dur(L.reduce((s,x)=>s+x.paye,0))} payées. La journée est ensuite verrouillée pour la paie (tu pourras la rouvrir).`,ok:'Valider',onOk:()=>{
      S.hoursOk={...(S.hoursOk||{})};const j={...(S.hoursOk[iso]||{})};
      L.forEach(x=>{if(!j[x.e.id])j[x.e.id]={st:'ok',motif:null,by:whoName(),at:Date.now()};});
      j._jour={by:whoName(),at:Date.now()};S.hoursOk[iso]=j;save();renderView();toast('Journée validée, prête pour la paie','check');}});},
  'pj-rouvrir'(t){if(!pjCanValider())return;const iso=t.dataset.iso;const j={...((S.hoursOk||{})[iso]||{})};delete j._jour;S.hoursOk={...S.hoursOk,[iso]:j};save();renderView();toast('Journée rouverte','edit');},
});
// Saisie directe du payé : on enregistre dès qu'une heure change.
document.addEventListener('change',ev=>{
  const t=ev.target;if(!S)return;
  if(t.classList&&t.classList.contains('pj-absc')){const iso=t.dataset.iso,emp=t.dataset.e;if(pjLocked(iso)){renderView();return;}
    if(t.checked)pjSetPaye(emp,iso,[],{abs:true});else{const j={...((S.hoursOk||{})[iso]||{})};delete j[emp];S.hoursOk={...S.hoursOk,[iso]:j};save();}
    renderView();return;}
  if(!(t.classList&&t.classList.contains('pj-in')))return;
  const row=t.closest('.pj-in-row');if(!row)return;const iso=row.dataset.iso,emp=row.dataset.e;if(pjLocked(iso)){renderView();return;}
  const cell=row.parentElement;const pcs=[];
  let bad=false;
  cell.querySelectorAll('.pj-in-row').forEach(r=>{const s=pjHeure(r.querySelector('.s').value),e=pjHeure(r.querySelector('.e').value),p=+r.querySelector('.p').value||0;if(s&&e)pcs.push({s,e,p});else if(r.querySelector('.s').value||r.querySelector('.e').value)bad=true;});
  if(bad){toast('Heure pas comprise : écris par exemple 15:00 ou 1500','alert');return;}
  if(!pcs.length)return;
  pjSetPaye(emp,iso,pcs);renderView();toast('Payé enregistré','check');
});

/* ---------- l'onglet « Badgeuse », en premier pour le directeur et les managers ---------- */
{const f=viewPointage;viewPointage=function(){
  const can=CAN();
  if(S&&!can.board)return f.apply(this,arguments).replace(/<p class="sub">[\s\S]*?<\/p>/,`<p class="sub">${T('Tes services et tes heures. Pour pointer, c’est sur la tablette du resto.')}</p>`);
  if(!S||!can.board||!can.hours||!EMP.length)return f.apply(this,arguments);
  if(!UI.point._v12){UI.point._v12=1;UI.point.tab='feuille';}
  const veut=UI.point.tab==='feuille';
  if(veut)UI.point.tab='jour';
  let html=f.apply(this,arguments);
  if(veut)UI.point.tab='feuille';
  const i=html.indexOf('<div class="tabs" role="tablist">');if(i<0)return html;
  const j=html.indexOf('</div>',i);
  let tabs=html.slice(i,j);
  if(veut)tabs=tabs.replace(/aria-selected="true"/g,'aria-selected="false"');
  const hier=isoD(addDays(TODAY,-1));const st=pjEtatJour(hier);
  const btn=`<button role="tab" aria-selected="${veut}" data-act="point-tab" data-t="feuille">${ic('list','s')}Badgeuse${!st.ok&&st.bad?` <span class="nb bad">${st.bad}</span>`:''}</button>`;
  tabs=tabs.replace('<div class="tabs" role="tablist">','<div class="tabs" role="tablist">'+btn).replace(/(data-t="jour">[\s\S]*?)Aujourd’hui/,'$1En direct');
  const head=html.slice(0,i).replace(/<p class="sub">[\s\S]*?<\/p>/,'');
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
