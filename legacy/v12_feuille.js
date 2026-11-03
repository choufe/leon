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
  L.pieces=[];L.per=per;L.extra=extra;
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
    L.pieces.push({s:deb,e:fin,p:pb>0?pb:(x.p||0),sh:i,pb});
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
function pjPeutModifier(){return pjCanValider();} // patron / admin ; les managers regardent
UI.pjTab='prevus'; // un seul onglet : les gens prévus (les absences, on s'en fiche ici)

// Les lignes d'un salarié : une par service prévu (midi, soir…), alignées colonne par colonne.
function pjSousLignes(x){
  const n=Math.max(x.sh.length,(x.pieces||[]).length,1);
  const out=[];
  for(let i=0;i<n;i++){
    const sh=x.sh[i]||null;
    const grp=x.per&&x.per[i]?x.per[i].g:[];
    const b=grp.length?{a:grp[0].a,b:grp[grp.length-1].b,pause:grp.slice(1).reduce((s,y,k)=>s+Math.max(0,y.a-grp[k].b),0),fin:grp[grp.length-1].t}:null;
    out.push({sh,b,pc:(x.pieces||[])[i]||null});
  }
  // badges hors planning (pas de service prévu)
  if(x.extra&&x.extra.length&&!x.sh.length)x.extra.forEach((g,k)=>{if(out[k])out[k].b={a:g.a,b:g.b,pause:0,fin:g.t};});
  return out;
}

function pjChip(v,c){return `<span class="pjc ${c}">${v}</span>`;}

function feuilleHTML(){
  const can=CAN();const edit=pjPeutModifier();
  const date=addDays(TODAY,UI.pj);const iso=isoD(date);const fini=UI.pj<0;
  const tout=pjJournee(iso);const jour=pjJour(iso);const verrou=!!jour;
  const absents=tout.filter(x=>!x.sh.length&&!x.ev.length);
  const prevus=tout.filter(x=>x.sh.length||x.ev.length);
  const L=UI.pjTab==='abs'?absents:prevus;
  const prevu=prevus.reduce((s,x)=>s+x.prevu,0),paye=prevus.reduce((s,x)=>s+x.paye,0);
  const bloquants=prevus.filter(x=>!x.override&&x.flags.some(f=>f.k==='noout'||f.k==='nobadge'));
  const valides=prevus.filter(x=>x.ok||verrou).length;
  const cout=can.salaries?prevus.reduce((s,x)=>s+x.paye/60*(x.e.taux||0),0):null;
  // colonne des jours
  const {d:dIdx}=wdOf(date);const lundi=addDays(date,-dIdx);
  const jours=[0,1,2,3,4,5,6].map(k=>{
    const dt=addDays(lundi,k);const off=Math.round((dt-TODAY)/864e5);const i2=isoD(dt);
    const futur=off>0;const st=futur?null:pjEtatJour(i2);
    const ico=futur||!st.n?'':st.ok?`<span class="pj-ck ok" title="Journée validée">${ic('check','s')}</span>`:st.bad?`<span class="pj-ck bad" title="${st.bad} à régler">${st.bad}</span>`:`<span class="pj-ck" title="À valider"></span>`;
    return `<button class="pj-day ${off===UI.pj?'on':''}" data-act="pj-goto" data-n="${off}" ${futur||off<-60?'disabled':''}><span>${JOURS[k]} ${dt.getDate()} ${MC[dt.getMonth()]}</span>${ico}</button>`;
  }).join('');
  const side=`<aside class="pj-side"><div class="pj-wk"><button class="icon-btn" data-act="pj-week" data-n="-7" aria-label="Semaine précédente">${ic('chevL','s')}</button><span>Semaine ${isoWeek(lundi)}</span><button class="icon-btn" data-act="pj-week" data-n="7" aria-label="Semaine suivante" ${UI.pj+7-dIdx>0?'disabled':''}>${ic('chevR','s')}</button></div>${jours}</aside>`;

  const filtres=`<div class="pj-filtres"><span class="pj-nb">${plur(prevus.length,'personne prévue','personnes prévues')}</span>
    <span class="pj-sp"></span>
    <span class="pj-sum">Prévu <b>${dur(prevu)}</b> · Payé <b>${dur(paye)}</b>${cout!=null?` · Coût <b>${eur(cout,0)}</b>`:''}</span></div>`;
  const banniere=verrou?`<div class="pj-ban ok">${ic('check','s')}<span>Journée validée par <b>${esc(jour.by)}</b> : c’est bon pour la paie.${edit?' Si tu changes une heure, il faudra la revalider.':''}</span></div>`
    :`<div class="pj-ban">${ic('info','s')}<span>${!fini?'Journée en cours : on la valide demain matin.':bloquants.length?`<b>${plur(bloquants.length,'ligne')} à régler</b> avant de valider (en rouge).`:`<b>À valider</b> : vérifie le payé, puis valide la journée.`}${edit?' Clique une heure payée pour la changer.':''}</span>
      ${pjCanValider()?`<button class="btn primary sm" data-act="pj-valider" data-iso="${iso}" ${!fini||bloquants.length||!prevus.length?'disabled':''}>${ic('check','s')} Valider la journée</button>`:''}</div>`;

  let body='';
  if(!L.length)body=`<div class="empty" style="padding:28px"><p>${UI.pjTab==='abs'?'Personne en absence ce jour-là.':'Personne n’était prévu ni n’a badgé.'}</p></div>`;
  else if(UI.pjTab==='abs')body=`<table class="pj-t"><thead><tr><th>Employé</th><th>Absence</th></tr></thead><tbody>${L.map(x=>`<tr><td class="pj-nm"><b>${esc(x.e.prenom)}</b> ${esc(x.e.nom||'')}</td><td>${x.ab?esc(ABS[x.ab.type]||'Absent'):'—'}${x.ab&&x.ab.note?` · <span class="faint">${esc(x.ab.note)}</span>`:''}</td></tr>`).join('')}</tbody></table>`;
  else{
    const dis=!edit?'disabled':'';
    const rows=L.map(x=>{
      const subs=pjSousLignes(x);const n=subs.length;
      const bad=!x.override&&x.flags.some(f=>f.k==='noout'||f.k==='nobadge');
      const valide=verrou;
      const menu=edit?`<button class="pj-dots" data-act="pj-menu" data-e="${x.e.id}" data-iso="${iso}" aria-label="Actions pour ${esc(x.e.prenom)}">${ic('dots','s')}</button>`:'';
      return subs.map((r,i)=>{
        const sh=r.sh,b=r.b,pc=r.pc;
        const prev=sh?`${pjChip(sh.s,'in')}<span class="pj-dash">-</span>${pjChip(sh.e,'out')}`:'<span class="faint">—</span>';
        const pprev=sh?pjChip(durShort(sh.p||0).replace(' min',' mn'),'pz'):'';
        let bad1='';
        if(b){const lateIn=sh&&b.a>sMin(sh)+PJ_TOL_IN,supOut=sh&&b.b>eMin(sh)+PJ_TOL_OUT;
          bad1=`<span class="pj-bt ${lateIn?'late':sh&&b.a<=sMin(sh)+PJ_TOL_IN?'okin':''}">${pjT(b.a)}</span><span class="pj-dash">-</span><span class="pj-bt ${b.fin==='pause'||(i===n-1&&x.flags.some(f=>f.k==='noout'))?'miss':supOut?'sup':'okout'}">${b.fin==='pause'&&i===n-1&&x.flags.some(f=>f.k==='noout')?'?':pjT(b.b)}</span>`;}
        else bad1=`<span class="pj-nob">Pas de badge</span>`;
        const pbad=b?`${b.pause} mn`:'-';
        const pay=x.abs?(i===0?'<span class="faint">Absent</span>':''):`<div class="pj-pay-r" data-e="${x.e.id}" data-iso="${iso}" data-i="${i}">
            <input class="pj-in s" value="${pc?pjT(pc.s):''}" placeholder="--:--" inputmode="numeric" maxlength="5" aria-label="Payé début" ${dis}><span class="pj-dash">-</span><input class="pj-in e" value="${pc?pjT(pc.e):''}" placeholder="--:--" inputmode="numeric" maxlength="5" aria-label="Payé fin" ${dis}></div>`;
        const ppay=x.abs?'':`<input class="pj-in p" value="${pc?pc.p:(sh?sh.p||0:0)}" inputmode="numeric" maxlength="3" aria-label="Pause payée (min)" data-row="${x.e.id}|${i}" ${dis}>`;
        const first=i===0;
        return `<tr class="${bad?'pj-bad':''} ${first?'pj-first':'pj-sub'}">
          ${first?`<td class="pj-v" rowspan="${n}">${valide?`<span class="pj-ck ok">${ic('check','s')}</span>`:'<span class="pj-ck"></span>'}</td>
          <td class="pj-nm" rowspan="${n}"><b>${esc(x.e.prenom)}</b><span>${esc((x.e.nom||'').toUpperCase())}</span>${x.flags.length?`<div class="pj-flags">${x.flags.map(f=>`<i class="pj-f ${f.k==='noout'||f.k==='nobadge'?'bad':f.k==='abs'?'':'warn'}">${esc(f.t)}</i>`).join('')}</div>`:''}</td>`:''}
          <td class="pj-c">${prev}</td><td class="pj-c">${pprev}</td>
          <td class="pj-c pj-sep">${bad1}</td><td class="pj-c pj-mut">${pbad}</td>
          <td class="pj-c pj-sep">${pay}</td><td class="pj-c">${ppay}</td>
          ${first?`<td class="pj-c" rowspan="${n}"><input type="checkbox" class="pj-absc" data-e="${x.e.id}" data-iso="${iso}" ${x.abs?'checked':''} ${dis} aria-label="Absent"></td>
          <td class="pj-tot" rowspan="${n}"><b>${x.paye?dur(x.paye):'—'}</b></td>
          <td class="pj-c" rowspan="${n}">${menu}</td>`:''}
        </tr>`;}).join('');
    }).join('');
    body=`<table class="pj-t"><thead><tr><th>Validé</th><th>Employé</th><th>Prévu</th><th>Pause</th><th class="pj-sep">Badgé</th><th>Pause</th><th class="pj-sep">Payé</th><th>Pause</th><th>Abs.</th><th>Total</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  const top=`<div class="pj-top"><h2 class="pj-titre">${UI.pj===0?'Aujourd’hui · ':UI.pj===-1?'Hier · ':''}${esc(longDate(date))}</h2></div>`;
  return `<div class="pj">${side}<section class="pj-main">${top}${filtres}${banniere}<div class="pj-card">${body}</div>
    <p class="faint pj-regle">Payé = ce qui part en paie. Léon le calcule (en avance ou jusqu’à 5 min de retard = heure prévue ; jusqu’à 15 min après la fin = fin prévue) et ${edit?'tu peux le changer : clique une heure, choisis au quart d’heure ou tape-la':'le patron peut le changer'}. Le badgé ne bouge jamais.</p></section></div>`;
}

/* ---------- actions ---------- */
function pjX(t){const e=empById(t.dataset.e);return pjLigne(e,t.dataset.iso);}
function pjLocked(iso){if(!pjPeutModifier()){toast('Seul le patron ou le directeur modifie le payé','alert');return true;}return false;}
// Toute modif d'une journée validée la remet « à valider » : on revalide pour être sûr que c'est bon.
function pjDevalider(iso){const j=(S.hoursOk||{})[iso];if(j&&j._jour){const k={...j};delete k._jour;S.hoursOk={...S.hoursOk,[iso]:k};return true;}return false;}
function pjSetPaye(emp,iso,paye,extra){
  if(pjDevalider(iso))setTimeout(()=>toast('Modifié : pense à revalider la journée','alert'),50);
  S.hoursOk={...(S.hoursOk||{})};S.hoursOk[iso]={...(S.hoursOk[iso]||{}),[emp]:{st:'fix',motif:'autre',paye,by:whoName(),at:Date.now(),...(extra||{})}};save();
}
// « 1500 », « 15h », « 15:00 », « 9h30 » → « 15:00 »
function pjHeure(v){v=String(v||'').trim().toLowerCase().replace('h',':');if(!v)return null;let m=v.match(/^(\d{1,2}):?(\d{2})?$/);if(!m&&/^\d{3,4}$/.test(v))m=[0,v.slice(0,-2),v.slice(-2)];if(!m)return null;const h=+m[1],mi=+(m[2]||0);if(h>23||mi>59)return null;return pad(h)+':'+pad(mi);}
const pjFmt=q=>({s:hhmm(q.s),e:hhmm(q.e),p:q.p||0});
Object.assign(ACT,{
  'pj-goto'(t){UI.pj=+t.dataset.n;renderView();},
  'pj-tab'(t){UI.pjTab=t.dataset.t;renderView();},
  'pj-week'(t){UI.pj=Math.min(0,Math.max(-60,UI.pj+(+t.dataset.n)));renderView();},
  'pj-menu'(t){const x=pjX(t);const last=x.sh[x.sh.length-1];
    const items=[
      !x.ev.length&&x.sh.length?['pj-here','Il était là (payé = prévu)']:null,
      x.flags.some(f=>f.k==='sup')?['pj-hs','Garder les heures sup']:null,
      last&&(x.pieces||[]).length?['pj-cut',`Payé jusqu’à ${last.e} (fin prévue)`]:null,
      x.override?['pj-reset','Revenir au calcul de Léon']:null,
    ].filter(Boolean);
    openModal(`<div class="mh"><div><h3>${esc(x.e.prenom)} ${esc(x.e.nom||'')}</h3><p>${esc(longDate(pdate(x.iso)))}</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
      <div class="stack" style="gap:8px">${items.map(([a,l])=>`<button class="btn block" data-act="${a}" data-e="${x.e.id}" data-iso="${x.iso}">${l}</button>`).join('')||'<p class="faint">Rien à proposer : change directement les heures payées dans le tableau.</p>'}</div>`);},
  'pj-here'(t){closeModal();const x=pjX(t);if(pjLocked(x.iso))return;pjSetPaye(x.e.id,x.iso,x.sh.map(s=>({s:s.s,e:s.e,p:s.p||0})));renderView();toast('Payé = heures prévues','check');},
  'pj-hs'(t){closeModal();const x=pjX(t);if(pjLocked(x.iso))return;pjDevalider(x.iso);hokSet(x.e.id,x.iso,'ok','hs');renderView();toast('Heures sup gardées','check');},
  'pj-cut'(t){closeModal();const x=pjX(t);if(pjLocked(x.iso))return;const last=x.sh[x.sh.length-1];const pcs=(x.pieces||[]).map(pjFmt);if(pcs.length)pcs[pcs.length-1].e=last.e;pjSetPaye(x.e.id,x.iso,pcs);renderView();toast(`Payé jusqu’à ${last.e}`,'check');},
  'pj-reset'(t){closeModal();const x=pjX(t);if(pjLocked(x.iso))return;pjDevalider(x.iso);const j={...((S.hoursOk||{})[x.iso]||{})};delete j[x.e.id];S.hoursOk={...S.hoursOk,[x.iso]:j};save();renderView();toast('Retour au calcul de Léon','edit');},
  'pj-valider'(t){if(!pjCanValider())return;const iso=t.dataset.iso;const L=pjJournee(iso).filter(x=>x.sh.length||x.ev.length);
    confirmBox({title:'Valider la journée ?',text:`${plur(L.length,'salarié')} · ${dur(L.reduce((s,x)=>s+x.paye,0))} payées. Tout passe au vert. Si tu changes une heure ensuite, il faudra revalider.`,ok:'Valider',onOk:()=>{
      S.hoursOk={...(S.hoursOk||{})};const j={...(S.hoursOk[iso]||{})};
      L.forEach(x=>{if(!j[x.e.id])j[x.e.id]={st:'ok',motif:null,by:whoName(),at:Date.now()};});
      j._jour={by:whoName(),at:Date.now()};S.hoursOk[iso]=j;save();renderView();toast('Journée validée : tout est vert','check');}});},
  'pj-rouvrir'(t){if(!pjCanValider())return;const iso=t.dataset.iso;const j={...((S.hoursOk||{})[iso]||{})};delete j._jour;S.hoursOk={...S.hoursOk,[iso]:j};save();renderView();toast('Journée rouverte','edit');},
});

/* ---------- saisie du payé : choix au quart d'heure, ou à la main ---------- */
function pjSauver(td){
  const tr=td.closest('tr');if(!tr)return;
  const first=td.closest('tbody').querySelectorAll('tr');
  const row=td.querySelector('.pj-pay-r')||tr.querySelector('.pj-pay-r');if(!row)return;
  const emp=row.dataset.e,iso=row.dataset.iso;if(pjLocked(iso)){renderView();return;}
  const rs=[...document.querySelectorAll(`.pj-pay-r[data-e="${CSS.escape(emp)}"][data-iso="${iso}"]`)];
  const pcs=[];let bad=false;
  rs.forEach(r=>{const s=pjHeure(r.querySelector('.s').value),e=pjHeure(r.querySelector('.e').value);
    const pz=document.querySelector(`.pj-in.p[data-row="${CSS.escape(emp+'|'+r.dataset.i)}"]`);const p=Math.max(0,Math.min(240,+((pz&&pz.value)||0)||0));
    if(s&&e)pcs.push({s,e,p});else if(r.querySelector('.s').value||r.querySelector('.e').value)bad=true;});
  if(bad){toast('Heure pas comprise : écris par exemple 15:00 ou 1500','alert');return;}
  if(!pcs.length)return;
  pjSetPaye(emp,iso,pcs);renderView();
}
let PJ_PICK=null;
function pjFermerPick(){if(PJ_PICK){PJ_PICK.el.remove();PJ_PICK=null;}}
function pjOuvrirPick(inp){
  pjFermerPick();
  const cur=pjHeure(inp.value);const cm=cur?toMin(cur):(inp.classList.contains('s')?600:900);
  const base=Math.round(cm/15)*15;const opts=[];for(let k=-16;k<=16;k++){const m=((base+k*15)%1440+1440)%1440;opts.push(m);}
  const el=document.createElement('div');el.className='pj-pick';el.setAttribute('role','listbox');
  el.innerHTML=opts.map(m=>`<button type="button" role="option" data-m="${m}" class="${m===cm?'on':''} ${m%60===0?'h':''}">${hhmm(m)}</button>`).join('');
  document.body.appendChild(el);
  const r=inp.getBoundingClientRect();el.style.left=(r.left+window.scrollX)+'px';el.style.top=(r.bottom+window.scrollY+4)+'px';
  const on=el.querySelector('.on')||el.children[16];if(on)el.scrollTop=on.offsetTop-el.clientHeight/2+on.offsetHeight/2;
  el.addEventListener('mousedown',ev=>{const b=ev.target.closest('button');if(!b)return;ev.preventDefault();inp.value=hhmm(+b.dataset.m);pjFermerPick();pjSauver(inp.closest('td'));});
  PJ_PICK={el,inp};
}
document.addEventListener('focusin',ev=>{const t=ev.target;if(t.classList&&t.classList.contains('pj-in')&&(t.classList.contains('s')||t.classList.contains('e'))&&!t.disabled){pjOuvrirPick(t);setTimeout(()=>{try{t.select();}catch(e){}},0);}});
document.addEventListener('focusout',ev=>{const t=ev.target;if(PJ_PICK&&t===PJ_PICK.inp)setTimeout(()=>{if(PJ_PICK&&document.activeElement!==PJ_PICK.inp)pjFermerPick();},120);});
document.addEventListener('keydown',ev=>{const t=ev.target;if(ev.key==='Enter'&&t.classList&&t.classList.contains('pj-in')){ev.preventDefault();t.blur();}if(ev.key==='Escape')pjFermerPick();});
document.addEventListener('change',ev=>{
  const t=ev.target;if(!S)return;
  if(t.classList&&t.classList.contains('pj-absc')){const iso=t.dataset.iso,emp=t.dataset.e;if(pjLocked(iso)){renderView();return;}
    if(t.checked)pjSetPaye(emp,iso,[],{abs:true});else{pjDevalider(iso);const j={...((S.hoursOk||{})[iso]||{})};delete j[emp];S.hoursOk={...S.hoursOk,[iso]:j};save();}
    renderView();return;}
  if(t.classList&&t.classList.contains('pj-in')){pjFermerPick();pjSauver(t.closest('td'));}
});

/* ---------- Pointage = la badgeuse, et rien d'autre ---------- */
{const f=viewPointage;viewPointage=function(){
  const can=CAN();
  if(!S||!can.board||!can.hours)return f.apply(this,arguments);
  if(!EMP.length)return f.apply(this,arguments);
  return `<div class="ph pj-ph"><div><h1>Badgeuse</h1></div></div>`+feuilleHTML();
};}
if(typeof VIEWS!=='undefined'&&VIEWS.pointage)VIEWS.pointage=viewPointage;
// Le staff n'a pas d'onglet badgeuse : il pointe sur la tablette, c'est tout.
try{const n=NAV.find(x=>x.v==='pointage');if(n){n.r=n.r.filter(r=>r!=='staff');n.l='Badgeuse';}}catch(e){}

/* ---------- la paie (relevé d'heures) compte les heures PAYÉES ---------- */
let PJ_RELEVE=false;
{const f=releveHTML;releveHTML=function(){PJ_RELEVE=true;try{return f.apply(this,arguments);}finally{PJ_RELEVE=false;}};}
{const f=workedMin;workedMin=function(ev,live){
  if(PJ_RELEVE&&S&&ev&&ev.length&&!live){
    for(const emp in S.pointages){const days=S.pointages[emp];for(const iso in days){if(days[iso]===ev)return pjPayeMin(emp,iso);}}
  }
  return f.apply(this,arguments);
};}
