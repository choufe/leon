/* =========================================================
   V11 · CHIFFRES
   - Prévision automatique des couverts (historique, fériés,
     vacances scolaires) : elle nourrit le planning et les commandes
   - Équipe et activité heure par heure : les créneaux où la salle
     est nombreuse pour peu de ventes
   ========================================================= */
const VACANCES={
 common:[['2026-07-04','2026-08-31'],['2026-10-17','2026-11-01'],['2026-12-19','2027-01-03'],['2027-07-03','2027-08-31']],
 A:[['2027-02-13','2027-02-28'],['2027-04-10','2027-04-25']],
 B:[['2027-02-20','2027-03-07'],['2027-04-17','2027-05-02']],
 C:[['2027-02-06','2027-02-21'],['2027-04-03','2027-04-18']],
};
const FC_DEF={mode:'auto',zone:'B',vac:0,fer:0,ovr:{}};
const fcSet=()=>({...FC_DEF,...((S&&S.fcst)||{}),ovr:{...(((S&&S.fcst)||{}).ovr||{})}});
function inVacances(iso,zone){return [...VACANCES.common,...(VACANCES[zone||'B']||[])].some(([a,b])=>iso>=a&&iso<=b);}
let FCW=null;
function fcBase(date){
  const iso=isoD(date);
  return memo('fcb:'+iso,()=>{
    const wd=(date.getDay()+6)%7;let d=addDays(TODAY,-1);while((d.getDay()+6)%7!==wd)d=addDays(d,-1);
    const W=[6,5,4,3,2,1];let sm=0,ss=0,sw=0,n=0;const cut=typeof svcCut==='function'?svcCut():900;const used=[];
    for(let k=0;k<6;k++){const di=isoD(addDays(d,-7*k));if(di<histMin())break;const T0=dayTickets(di);if(!T0.length)continue;
      let m=0,s=0;T0.forEach(t=>{const c=t.n||1;if((t.at||0)<cut)m+=c;else s+=c;});sm+=m*W[k];ss+=s*W[k];sw+=W[k];n++;used.push(di);}
    if(n<2)return null;
    return {m:Math.round(sm/sw),s:Math.round(ss/sw),n,used};
  });
}
function fcFor(date){
  const F=fcSet();const iso=isoD(date);const wd=(date.getDay()+6)%7;
  if(isClosed(wd))return {v:[0,0],why:'Fermé'};
  if(F.ovr[iso])return {v:F.ovr[iso].slice(),why:'Modifié à la main',ovr:true};
  const b=fcBase(date);if(!b)return null;
  let k=1;const why=[`moyenne des ${b.n} derniers ${JOURS[wd].toLowerCase()}s`];
  const fe=typeof ferieOf==='function'?ferieOf(iso):'';
  if(fe&&F.fer){k*=1+F.fer/100;why.push(`${fe} ${F.fer>0?'+':''}${F.fer} %`);}else if(fe)why.push(fe);
  if(F.vac&&inVacances(iso,F.zone)&&!b.used.every(u=>inVacances(u,F.zone))){k*=1+F.vac/100;why.push(`vacances scolaires ${F.vac>0?'+':''}${F.vac} %`);}
  return {v:[Math.round(b.m*k),Math.round(b.s*k)],why:why.join(' · '),k};
}
function fcRatio(date){const F=fcSet();if(F.mode==='manual')return 1;const r=fcFor(date);return r&&r.k?r.k:1;}
{const f=prevOf;prevOf=d=>{
  if(!S)return f(d);const F=fcSet();if(F.mode==='manual')return f(d);
  try{const r=fcFor(dateAt(FCW!=null?FCW:0,d));return r?r.v:f(d);}catch(e){return f(d);}
};}
function withW(fn){return function(w){const o=FCW;FCW=+w||0;try{return fn.apply(this,arguments);}finally{FCW=o;}};}
coverage=withW(coverage);weekGrid9=withW(weekGrid9);dayView9=withW(dayView9);autoFill=withW(autoFill);agendaView=withW(agendaView);fillFlow=withW(fillFlow);publishFlow=withW(publishFlow);

/* ---------- réglages : prévisions automatiques ---------- */
function fcPanel(){
  const F=fcSet();const auto=F.mode!=='manual';const can=CAN();
  const days=[...Array(14)].map((_,k)=>addDays(TODAY,k));
  const man=d=>(S.prev&&S.prev[d])||[0,0];
  const pct=[-30,-20,-10,0,10,20,30,50];
  const autoT=`<div class="tbl-wrap"><table class="tbl fc-t"><thead><tr><th>Jour</th><th class="r">Midi</th><th class="r">Soir</th><th>D’après</th></tr></thead><tbody>${days.map(dt=>{const iso=isoD(dt);const r=fcFor(dt);const wd=(dt.getDay()+6)%7;if(isClosed(wd))return `<tr class="faint"><td>${cap(dayShort(iso))}</td><td class="r">—</td><td class="r">—</td><td>Fermé</td></tr>`;
      const v=r?r.v:man(wd);return `<tr><td><b>${cap(dayShort(iso))}</b>${iso===TODAY_ISO?' <small class="faint">aujourd’hui</small>':''}</td><td class="r"><input class="tinp" type="number" min="0" data-ch="fc-ovr" data-iso="${iso}" data-s="0" value="${r&&r.ovr?v[0]:''}" placeholder="${v[0]}" aria-label="Couverts midi" ${can.settings?'':'disabled'}></td><td class="r"><input class="tinp" type="number" min="0" data-ch="fc-ovr" data-iso="${iso}" data-s="1" value="${r&&r.ovr?v[1]:''}" placeholder="${v[1]}" aria-label="Couverts soir" ${can.settings?'':'disabled'}></td><td class="muted" style="font-size:12.5px">${r?esc(r.why):'Pas assez d’historique : tes prévisions par jour'}${r&&r.ovr?` <button class="btn xs ghost" data-act="fc-unovr" data-iso="${iso}">remettre Léon</button>`:''}</td></tr>`;}).join('')}</tbody></table></div>
    <div class="form-grid" style="margin-top:12px"><div class="field"><label for="fc-zone">Zone de vacances scolaires</label><select class="inp" id="fc-zone" data-ch="fc-set" data-k="zone" ${can.settings?'':'disabled'}>${['A','B','C'].map(z=>`<option ${F.zone===z?'selected':''}>${z}</option>`).join('')}</select></div>
    <div class="field"><label for="fc-vac">Pendant les vacances</label><select class="inp" id="fc-vac" data-ch="fc-set" data-k="vac" ${can.settings?'':'disabled'}>${pct.map(p=>`<option value="${p}" ${F.vac===p?'selected':''}>${p?(p>0?'+':'')+p+' % de couverts':'comme d’habitude'}</option>`).join('')}</select></div>
    <div class="field"><label for="fc-fer">Les jours fériés</label><select class="inp" id="fc-fer" data-ch="fc-set" data-k="fer" ${can.settings?'':'disabled'}>${pct.map(p=>`<option value="${p}" ${F.fer===p?'selected':''}>${p?(p>0?'+':'')+p+' % de couverts':'comme d’habitude'}</option>`).join('')}</select></div></div>
    <p class="faint" style="font-size:12.5px;margin-top:8px">Un match, un groupe, un salon ? Tape le chiffre dans la case du jour : il remplace celui de Léon. La météo arrivera avec la vraie version.</p>`;
  const manT=`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Jour</th><th class="r">Couverts midi</th><th class="r">Couverts soir</th></tr></thead><tbody>${JOURS.map((j,d)=>`<tr><td>${j}${isClosed(d)?' <span class="faint">· fermé</span>':''}</td><td class="r"><input class="tinp" type="number" min="0" data-ch="rg-prev" data-d="${d}" data-s="0" value="${man(d)[0]}" ${isClosed(d)||!can.settings?'disabled':''} aria-label="Couverts midi ${j}"></td><td class="r"><input class="tinp" type="number" min="0" data-ch="rg-prev" data-d="${d}" data-s="1" value="${man(d)[1]}" ${isClosed(d)||!can.settings?'disabled':''} aria-label="Couverts soir ${j}"></td></tr>`).join('')}</tbody></table></div>`;
  return `<section class="panel fc-p"><div class="panel-h"><h2>Prévisions ${infoBtn('prev')}</h2>${segHTML('fc-mode',auto?'auto':'manual',[['auto','Léon calcule'],['manual','Je les tape']],can.settings?'':'disabled')}</div><div class="panel-b">
    <p class="muted" style="font-size:13px;margin:-4px 0 10px">${auto?'Léon prévoit les couverts à partir des mêmes jours des semaines passées, des jours fériés et des vacances. Ces chiffres servent au planning, à la couverture et aux commandes.':'Les couverts attendus par jour de la semaine. Ils servent au planning, à la couverture et aux commandes.'}</p>
    ${auto?autoT:manT}
    <div class="row wrap" style="gap:14px;margin-top:12px"><div class="field"><label for="rg-tm">Ticket moyen midi (HT)</label><input class="inp" id="rg-tm" type="number" min="0" step="0.1" data-ch="rg" data-f="ticket.midi" value="${S.ticket.midi}" style="max-width:120px" ${can.settings?'':'disabled'}></div><div class="field"><label for="rg-ts">Ticket moyen soir (HT)</label><input class="inp" id="rg-ts" type="number" min="0" step="0.1" data-ch="rg" data-f="ticket.soir" value="${S.ticket.soir}" style="max-width:120px" ${can.settings?'':'disabled'}></div></div>
  </div></section>`;
}
{const f=viewReglages;viewReglages=function(){
  let h=f();const i=h.indexOf('<section class="panel"><div class="panel-h"><h2>Prévisions');if(i<0)return h;
  const j=h.indexOf('</section>',i);if(j<0)return h;
  return h.slice(0,i)+fcPanel()+h.slice(j+10);
};}
function fcSave(F){S.fcst=F;save();renderView();}
Object.assign(ACT,{
  'fc-mode'(t){const F=fcSet();F.mode=t.dataset.k;fcSave(F);toast(F.mode==='auto'?'Léon calcule les prévisions':'Prévisions à la main','spark');},
  'fc-unovr'(t){const F=fcSet();delete F.ovr[t.dataset.iso];fcSave(F);},
});
CH['fc-ovr']=t=>{const F=fcSet();const iso=t.dataset.iso;const s=+t.dataset.s;const cur=F.ovr[iso]||(fcFor(pdate(iso))||{v:[0,0]}).v.slice();if(t.value===''){delete F.ovr[iso];}else{cur[s]=Math.max(0,parseInt(t.value)||0);F.ovr[iso]=cur;}Object.keys(F.ovr).forEach(k=>{if(k<TODAY_ISO)delete F.ovr[k];});fcSave(F);};
CH['fc-set']=t=>{const F=fcSet();F[t.dataset.k]=t.dataset.k==='zone'?t.value:+t.value;fcSave(F);};
Object.assign(INFO,{prev:{t:'Prévisions de couverts',d:'Combien de couverts tu attends, service par service. Léon s’en sert pour le planning (qui faut-il au coup de feu ?), la masse salariale prévue et la commande conseillée.',f:'Moyenne pondérée des 6 derniers mêmes jours (les plus récents comptent plus) × ajustement fériés et vacances',r:'Tu peux toujours remplacer un jour à la main : un match, un groupe, un événement dans le quartier.'}});

/* ---------- équipe et activité heure par heure ---------- */
const FOH=['salle','bar','manager'];
function slotStats(){
  return memo('slots',()=>{
    const W=[...Array(7)].map(()=>({n:0,h:[...Array(24)].map(()=>({ca:0,st:0}))}));
    daysBack(1,28).forEach(iso=>{
      const wd=(pdate(iso).getDay()+6)%7;if(isClosed(wd))return;const ds=daySum(iso);if(!ds.ht||!dayHasPt(iso))return;
      W[wd].n++;const H=W[wd].h;
      Object.keys(ds.hours).forEach(h=>{if(H[+h])H[+h].ca+=ds.hours[h];});
      EMP.filter(e=>FOH.includes(e.poste)).forEach(e=>{
        let open=null;evsOn(e.id,iso).forEach(z=>{if(z.t==='in'||z.t==='back')open=z.m;else if(open!=null){const a=open,b=z.m;for(let h=Math.floor(a/60);h<=Math.floor((b-1)/60)&&h<24;h++){const o=Math.max(0,Math.min(b,(h+1)*60)-Math.max(a,h*60));H[h].st+=o/60;}open=null;}});
      });
    });
    const cells=[];
    W.forEach((w,wd)=>{if(!w.n)return;const mx=Math.max(...w.h.map(x=>x.ca));w.h.forEach((x,h)=>{const ca=x.ca/w.n,st=x.st/w.n;if(mx>0&&x.ca>=mx*0.05&&st>0.3)cells.push({wd,h,ca,st,p:ca/st});});});
    const ps=cells.map(c=>c.p).sort((a,b)=>a-b);const med=ps.length?ps[Math.floor(ps.length/2)]:0;
    cells.forEach(c=>{c.flag=c.st>=1.5&&med>0&&c.p<med*0.45;c.extra=c.flag?Math.max(1,Math.floor(c.st-c.ca/(med*0.8))):0;});
    const flags=[];
    [0,1,2,3,4,5,6].forEach(wd=>{const L=cells.filter(c=>c.wd===wd&&c.flag).sort((a,b)=>a.h-b.h);let cur=null;L.forEach(c=>{if(cur&&c.h===cur.h1+1){cur.h1=c.h;cur.cells.push(c);}else{cur={wd,h0:c.h,h1:c.h,cells:[c]};flags.push(cur);}});});
    flags.forEach(g=>{g.st=sum(g.cells,c=>c.st)/g.cells.length;g.ca=sum(g.cells,c=>c.ca)/g.cells.length;g.extra=Math.max(...g.cells.map(c=>c.extra));g.hours=(g.h1-g.h0+1)*g.extra;});
    flags.sort((a,b)=>b.hours-a.hours);
    return {W,cells,med,flags,days:sum(W,w=>w.n)};
  });
}
function staffSlotsHTML(){
  const R=slotStats();if(!R.cells.length)return '';
  const hs=[...new Set(R.cells.map(c=>c.h))].sort((a,b)=>a-b);const h0=hs[0],h1=hs[hs.length-1];const hours=[];for(let h=h0;h<=h1;h++)hours.push(h);
  const maxP=Math.max(...R.cells.map(c=>c.p))||1;
  const cell=(wd,h)=>{const c=R.cells.find(x=>x.wd===wd&&x.h===h);if(!c)return `<span class="hm-c off" aria-hidden="true"></span>`;const lvl=Math.max(0.08,Math.min(1,c.p/maxP));
    const lab=`${JOURS[wd]} ${h}h–${h+1}h : ${nf(c.st,1)} personne${c.st>=2?'s':''} en salle, ${eur(c.ca,0)} de ventes par heure, ${eur(c.p,0)} par personne${c.flag?' · équipe trop nombreuse':''}`;
    return `<button type="button" class="hm-c ${c.flag?'flag':''}" style="--l:${(lvl*88+8).toFixed(0)}%" data-tip="${esc(lab)}" aria-label="${esc(lab)}">${c.flag?'!':''}</button>`;};
  const grid=`<div class="hm" data-hm><div class="hm-row hm-hd"><span></span>${hours.map(h=>`<span>${h}h</span>`).join('')}</div>${[0,1,2,3,4,5,6].filter(wd=>R.W[wd].n).map(wd=>`<div class="hm-row"><span class="hm-d">${JC[wd]}</span>${hours.map(h=>cell(wd,h)).join('')}</div>`).join('')}<div class="hm-tip" role="status"></div></div>
   <div class="hm-leg"><span>Moins de ventes par personne en salle</span><i></i><span>Plus</span><span class="hm-lf"><b>!</b> équipe trop nombreuse</span></div>`;
  const list=R.flags.length?`<div class="alerts">${R.flags.slice(0,4).map(g=>`<div class="al t-warn"><span class="ico warn">${ic('users','s')}</span><div class="al-x"><b>${JOURS[g.wd]} ${g.h0}h–${g.h1+1}h : environ ${plur(g.extra,'personne','personnes')} de trop en salle</b><p>${nf(g.st,1)} personnes en salle en moyenne pour ${eur(g.ca,0)} de ventes par heure (${eur(g.ca/g.st,0)} par personne, contre ${eur(R.med,0)} d’habitude). Sur 4 semaines, ${plur(Math.round(g.hours*4),'heure')} qui ne rapportent presque rien.</p></div><div class="acts"><button class="btn sm" data-act="nav" data-v="planning">Planning</button></div></div>`).join('')}</div>`:`<div class="empty todo-ok">${ic('check')}<p>L’équipe de salle suit bien l’activité : pas de créneau calme avec trop de monde.</p></div>`;
  return `<section class="panel slots-p" data-fold-key="stats:slots"><div class="panel-h"><h2>${ic('users')} Équipe et activité, heure par heure</h2><span class="faint" style="font-size:12.5px">salle et bar · ${plur(R.days,'jour')} sur 4 semaines</span></div><div class="panel-b">${list}<details class="hm-det" ${R.flags.length?'':'open'}><summary>Voir la carte heure par heure</summary>${grid}</details></div></section>`;
}
function hmTip(el){const hm=el.closest('[data-hm]');if(!hm)return;const tip=hm.querySelector('.hm-tip');tip.textContent=el.dataset.tip||'';tip.style.display='block';const r=el.getBoundingClientRect(),v=hm.getBoundingClientRect();const w=tip.offsetWidth;tip.style.left=Math.max(0,Math.min(v.width-w,r.left-v.left+r.width/2-w/2))+'px';tip.style.top=(r.top-v.top-tip.offsetHeight-6)+'px';}
function hmHide(el){const hm=el&&el.closest&&el.closest('[data-hm]');const t=hm&&hm.querySelector('.hm-tip');if(t)t.style.display='none';}
document.addEventListener('pointerover',e=>{const c=e.target.closest&&e.target.closest('.hm-c[data-tip]');if(c)hmTip(c);});
document.addEventListener('pointerout',e=>{const c=e.target.closest&&e.target.closest('.hm-c[data-tip]');if(c)hmHide(c);});
document.addEventListener('focusin',e=>{const c=e.target.closest&&e.target.closest('.hm-c[data-tip]');if(c)hmTip(c);});
document.addEventListener('focusout',e=>{const c=e.target.closest&&e.target.closest('.hm-c[data-tip]');if(c)hmHide(c);});
{const f=viewStats;viewStats=function(){const h=f();try{const x=staffSlotsHTML();if(!x)return h;const k=h.lastIndexOf('</div>');return k>0?h.slice(0,k)+x+h.slice(k):h+x;}catch(e){console.error(e);return h;}};VIEWS.stats=viewStats;}
{const f=insightsFor;insightsFor=function(){
  const L=f();
  return memo('ins11',()=>{
    const out=L.slice();
    try{const R=slotStats();const g=R.flags[0];if(g&&!out.some(x=>x.id==='slots')){out.push({id:'slots:'+g.wd+':'+g.h0,cat:'equipe',tone:'warn',t:`${JOURS[g.wd]} ${g.h0}h–${g.h1+1}h : ${plur(g.extra,'personne','personnes')} de trop en salle`,s:`${nf(g.st,1)} en salle pour ${eur(g.ca,0)} de ventes par heure, sur les 4 dernières semaines. Décale une arrivée ou avance un départ ce jour-là.`,acts:[{l:'Planning',act:'nav',v:'planning'},{l:'Voir le détail',act:'st-go',p:'mois'}],sc:g.hours});}}catch(e){}
    return out.sort((a,b)=>(INS_RANK[a.tone]-INS_RANK[b.tone])||(b.sc||0)-(a.sc||0));
  });
};}
