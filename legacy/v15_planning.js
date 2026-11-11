/* =========================================================
   15.04 — Retours de Maurice du 11 nov. (menu, planning, avis de Léon, retour de fin de semaine)
   1. Menu de gauche : les espaces restent à leur place. Celui qu'on ouvre déplie ses pages juste en dessous,
      au lieu de monter tout en haut (« ça téléporte tout »).
   2. Planning : moins de texte en haut. « Clique une case… » retiré (les raccourcis restent dans « ⋯ »),
      les filtres par poste descendent sous la grille avec la légende, le rond vert devient un ✓ « arrivé ».
   3. Avis de Léon : un jour qu'on rouvre (ex. le lundi) n'a pas d'historique, donc 0 couvert prévu, donc
      personne au planning et « Conforme ». Maintenant Léon estime les couverts avec les autres jours,
      signale le service vide, et peut refaire la semaine selon le cahier des charges.
   4. « La semaine dernière, c'était bien planifié ? » : on parle à Léon en quelques mots
      (« trop de monde mardi midi, ouverture trop tard samedi »). Il montre ce qu'il a compris,
      puis l'écrit dans le cahier des charges pour les prochains plannings.
   ========================================================= */

/* ---------- 1. menu de gauche : un ordre fixe ---------- */
{const f=sideHTML;sideHTML=function(){
  const h=f.apply(this,arguments);
  if(!S)return h;
  try{
    const cur=UI.view==='assembleur'?'recettes':UI.view;
    const items=navItems();const aid=appOf(cur);
    const navBtn=n=>`<button data-act="nav" data-v="${n.v}" ${cur===n.v?'aria-current="page"':''}>${ic(n.i)}<span class="nl">${esc(navLabel(n.v))}${n.mod&&!modOn(n.mod)?' <small class="off-tag">masqué</small>':''}</span>${n.v==='accueil'?'':nbHTML(modInfo(n.v))}</button>`;
    const home=items.find(n=>n.v==='accueil'),reg=items.find(n=>n.v==='reglages');
    let body=home?navBtn(home):'';
    const apps=visibleApps();
    if(apps.length)body+=`<div class="nav-sep">Tes espaces</div>`;
    apps.forEach(a=>{
      const on=a.id===aid;const nb=appNb(a);
      body+=`<button class="app-nav${on?' on':''}" data-act="app-go" data-a="${a.id}" ${on&&appViews(a).length===1?'aria-current="page"':`aria-expanded="${on}"`}><span class="app-ic ${a.c}">${ic(a.i,'s')}</span><span class="nl">${esc(appLabel(a))}</span>${!on&&nb?`<span class="nb ${nb.tone}">${nb.n>99?'99+':nb.n}</span>`:''}</button>`;
      const vs=appViews(a);
      if(on&&vs.length>1)body+=`<div class="app-sub ${a.c}">${vs.map(navBtn).join('')}</div>`;
    });
    body+=items.filter(n=>n.v!=='accueil'&&n.v!=='reglages'&&!appOf(n.v)).map(navBtn).join('');
    if(reg)body+=`<div class="nav-sep"></div>`+navBtn(reg);
    return h.replace(/<nav class="nav" aria-label="Navigation">[\s\S]*?<\/nav>/,`<nav class="nav" aria-label="Navigation">${body}</nav>`);
  }catch(e){console.error('menu',e);return h;}
};}
// le menu ne doit pas sauter : on garde sa position de défilement d'un écran à l'autre
{let navTop=0;
  document.addEventListener('scroll',e=>{const n=e.target;if(n&&n.classList&&n.classList.contains('nav'))navTop=n.scrollTop;},true);
  const keep=()=>{const n=document.querySelector('.side .nav');if(n&&navTop)n.scrollTop=navTop;};
  const f=renderView;renderView=function(){const r=f.apply(this,arguments);try{keep();}catch(e){}return r;};}

/* ---------- 2. planning : moins de choses en haut ---------- */
{const f=planHead;planHead=function(){
  return f.apply(this,arguments).replace(/<p class="sub">(?:(?!<\/p>)[\s\S])*data-act="pl-keys"(?:(?!<\/p>)[\s\S])*<\/p>/,'');
};}
function v15PlanRange(){
  if(UI.view!=='planning')return;
  const ch=document.querySelector('.pl-bar .pl-chips');const lg=document.querySelector('.pl-legend');
  if(ch&&lg&&!lg.contains(ch)){ch.classList.add('v15-chips');lg.prepend(ch);lg.classList.add('v15-lg');}
  if(lg)lg.querySelectorAll('.legend span').forEach(sp=>{if(/Pointé/.test(sp.textContent)&&!sp.querySelector('.v15-pt'))sp.innerHTML='<i class="v15-pt">✓</i>Arrivé (badgé)';});
}
{const f=renderView;renderView=function(){const r=f.apply(this,arguments);try{v15PlanRange();}catch(e){}return r;};}
{const f=planRender;planRender=function(){const r=f.apply(this,arguments);try{v15PlanRange();}catch(e){}return r;};}

/* ---------- 3. un jour rouvert sans historique : Léon estime les couverts ---------- */
const V15_ESTIME={};
{const f=prevOf;prevOf=d=>{
  const c=f(d);
  if(!S||typeof cdcOpen!=='function'||isClosed(d))return c;
  try{
    const out=c.slice();let est=false;
    [0,1].forEach(i=>{const svc=i?'soir':'midi';if(out[i]>0||!cdcOpen(d,svc))return;
      const autres=[0,1,2,3,4,5,6].filter(x=>x!==d&&!isClosed(x)).map(x=>f(x)[i]).filter(v=>v>0);
      if(!autres.length)return;out[i]=Math.round(sum(autres,v=>v)/autres.length);est=true;});
    if(est)V15_ESTIME[d]=out;else delete V15_ESTIME[d];
    return out;
  }catch(e){return c;}
};}
// un service ouvert sans personne dessus n'est pas « conforme »
{const f=planAlerts;planAlerts=function(w){
  const A=f.apply(this,arguments)||[];
  try{
    for(let d=0;d<7;d++){if(isClosed(d))continue;let c;try{c=rmCouverts(w,d).c;}catch(_){c=prevOf(d);}
      ['midi','soir'].forEach((svc,i)=>{if(!c[i])return;const [a,b]=SVC_WIN[svc];
        const on=shiftsWD(w,d).filter(x=>sMin(x)<b&&eMin(x)>a).length+(S.openShifts||[]).filter(o=>o.w===w&&o.d===d&&sMin(o)<b&&eMin(o)>a).length;
        if(!on)A.push({tone:'warn',k:'vide',d,t:`${JOURS[d]} ${svc} : personne au planning`,s:`Le resto est ouvert et Léon prévoit environ ${c[i]} couverts${V15_ESTIME[d]?' (estimés avec les autres jours : pas encore d’historique ce jour-là)':''}. Demande l’avis de Léon pour remplir.`});});}
  }catch(e){console.error('vide',e);}
  const order={bad:0,warn:1,info:2};
  return A.sort((x,y)=>order[x.tone]-order[y.tone]);
};}
// l'avis dit d'où viennent les couverts d'un jour sans historique
{const f=leonAvisPlanning;leonAvisPlanning=function(w){
  const R=f.apply(this,arguments);
  try{const d0=Object.keys(V15_ESTIME).map(Number).filter(d=>!isClosed(d));
    if(d0.length)R.out.push({tone:'info',ic:'info',t:'Pas encore d’historique '+d0.map(d=>'le '+JOURS[d].toLowerCase()).join(', '),s:d0.map(d=>`${JOURS[d]} : ${V15_ESTIME[d][0]} couverts le midi, ${V15_ESTIME[d][1]} le soir`).join(' · ')+', d’après la moyenne de tes autres jours. Ça s’affinera avec tes ventes.'});
  }catch(e){}
  return R;
};}
// l'avis peut refaire la semaine (jours à venir) avec le cahier des charges
let V15_REDO=null;
{const f=avisFlow;avisFlow=function(w){
  f.apply(this,arguments);
  try{
    if(!CAN().editPlanning)return;
    const R=leonAvisPlanning(w);if(R.vide)return;
    const souci=R.out.some(x=>x.tone==='bad'||x.tone==='warn')||planAlerts(w).some(a=>a.k==='vide');
    const futur=[0,1,2,3,4,5,6].some(d=>!isClosed(d)&&dateAt(w,d)>=TODAY);
    const mf=document.querySelector('#modal-root .mf');if(!mf||!souci||!futur)return;
    const fill=mf.querySelector('[data-act="pl-fill-direct"]');
    if(fill)fill.classList.remove('brass');
    mf.insertAdjacentHTML('beforeend',`<button class="btn brass" data-act="v15-redo">${ic('wand','s')} Léon refait la semaine</button>`);
    const p=document.querySelector('#modal-root .mh p');
    if(p)p.insertAdjacentHTML('afterend',`<p class="v15-redo-t">Pas d’accord avec ce planning ? Léon peut le refaire en entier pour les jours à venir, avec ton cahier des charges. Tu vois sa proposition avant, rien ne change sans ton accord.</p>`);
  }catch(e){console.error('redo',e);}
};}
ACT['v15-redo']=function(){
  const w=UI.plan.w;closeModal();
  const jours=[0,1,2,3,4,5,6].filter(d=>!isClosed(d)&&dateAt(w,d)>=TODAY);
  const ok=planDo('Léon a vidé les jours à venir',()=>{
    S.shifts=S.shifts.filter(x=>!(x.w===w&&jours.includes(x.d)));
    S.openShifts=(S.openShifts||[]).filter(o=>!(o.w===w&&jours.includes(o.d)));
  },{quiet:true});
  V15_REDO=ok?{w}:null;
  fillFlow(w);
};
// si on ferme la proposition sans la valider, on remet le planning d'avant
{const f=closeModal;closeModal=function(){
  const r=f.apply(this,arguments);
  if(V15_REDO){const x=V15_REDO;V15_REDO=null;if(typeof FILL!=='undefined'&&FILL&&FILL.w===x.w){FILL=null;planUndo();}}
  return r;
};}
{const f=ACT['pl-fill-go'];ACT['pl-fill-go']=function(){V15_REDO=null;return f.apply(this,arguments);};}
{const f=ACT['pl-fill-open'];ACT['pl-fill-open']=function(){V15_REDO=null;return f.apply(this,arguments);};}

/* ---------- 4. le retour de fin de semaine, en quelques mots ---------- */
{const D=DOCS.planning;DOCS.planning={p:D.p,out:R=>({...D.out(R),semRetour:R.semRetour||{}}),in:(R,d)=>{D.in(R,d);R.semRetour=d.semRetour||{};}};}
const V15_EX=[['bien','C’était bien'],['trop','Trop de monde'],['manque','Pas assez de monde'],['ouv','Ouverture trop tard'],['prepa','Pas assez en prépa']];
apQuestionHTML=function(){
  if(!S||!CAN().editPlanning||effRole()==='staff'||UI.plan.w!==0)return '';
  const w=-1;const k=wkIso(w);if(!S.published||!S.published[String(w)]||(S.semAvis||{})[k])return '';
  if(!S.shifts.some(x=>x.w===w))return '';
  return `<div class="ap-q v15-ret"><span class="ap-ic">${ic('spark','s')}</span>
    <div class="ret-b"><div class="ret-h"><b>La semaine dernière, c’était comment ?</b><span class="faint">Dis-le à Léon en quelques mots : il corrige les prochains plannings.</span></div>
      <div class="ret-row"><input class="inp" id="ret-in" placeholder="Ex. trop de monde mardi midi, ouverture trop tard samedi" aria-label="Ce qui n’allait pas la semaine dernière"><button class="btn brass sm" data-act="ret-go">Dire à Léon</button></div>
      <div class="ret-ex">${V15_EX.map(([v,l])=>`<button class="chip" data-act="ret-ex" data-v="${v}">${l}</button>`).join('')}</div></div>
    <button class="icon-btn" data-act="ret-skip" aria-label="Plus tard" title="Plus tard">${ic('x','s')}</button></div>`;
};
ACT['ret-ex']=function(t){
  const v=t.dataset.v;
  if(v==='bien'){S.semAvis={...(S.semAvis||{}),[wkIso(-1)]:'bien'};save();AP_CACHE=null;renderView();toast('Noté : Léon garde ce rythme','check');return;}
  const a=$('#ret-in');if(!a)return;
  const l=(V15_EX.find(x=>x[0]===v)||[])[1]||'';
  a.value=(a.value.trim()?a.value.trim().replace(/[,.]$/,'')+', ':'')+l.toLowerCase()+' ';
  a.focus();a.setSelectionRange(a.value.length,a.value.length);
};
ACT['ret-skip']=function(){S.semAvis={...(S.semAvis||{}),[wkIso(-1)]:'passe'};save();renderView();};

/* lire le retour : « trop de monde mardi midi, ouverture trop tard samedi, pas assez en prépa » */
function v15Retour(txt){
  const out=[];
  String(txt||'').split(/[\n.;!]+|,|\s+et\s+(?=(?:trop|pas|il|ouverture|manqu|personne|bien|l'|la |le ))/i).map(s=>s.trim()).filter(s=>s.length>2).forEach(src=>{
    const s=src.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    let days=[];CDC_JR.forEach((re,d)=>{if(re.test(s))days.push(d);});
    if(/week-?end/.test(s))days.push(5,6);
    if(/tous les jours|chaque jour|toute la semaine/.test(s))days=[0,1,2,3,4,5,6];
    days=[...new Set(days)].filter(d=>!isClosed(d)).sort();
    const svcs=/midi|dej/.test(s)&&!/soir|diner/.test(s)?['midi']:/soir|diner/.test(s)&&!/midi|dej/.test(s)?['soir']:null;
    const g=/salle|serveu|runner/.test(s)?'salle':/cuisin|cuistot|chef|commis/.test(s)?'cuisine':/\bbar/.test(s)?'bar':null;
    let k=null;
    if(/ouverture|ouvr|pas assez tot|trop tard|arrive.* tard|en retard a l.ouverture/.test(s))k='ouv';
    else if(/prepa|mise en place|mep\b/.test(s))k='prepa';
    else if(/trop de (monde|personnes?|gens|staff|serveu|cuisin)|trop nombreu|sur-?effectif|trop charge en personnel|on etait trop/.test(s))k='trop';
    else if(/pas assez|manqu|sous-?effectif|on etait pas assez|rush|debord|charrette|un de plus|renfort/.test(s))k='manque';
    else if(/^(c.etait )?(bien|parfait|nickel|top|ok|super)\b|tout (allait|etait) bien|rien a dire/.test(s))k='bien';
    out.push(k?{k,days,svcs,g,src}:{k:'?',src});
  });
  return out;
}
const V15_JOURS=d=>d.length===7?'tous les jours':d.map(x=>JOURS[x].toLowerCase()).join(', ');
function v15Plan(R){
  // ce que Léon va faire, ligne par ligne (en français), et les changements du cahier des charges
  const C=cdcGet();const lignes=[];const notes=[];const prepa=C.prepa.map(p=>({...p,jours:(p.jours||[]).slice()}));let global=null;
  const L={salle:'en salle',cuisine:'en cuisine',bar:'au bar'};
  R.forEach(r=>{
    if(r.k==='?'){lignes.push({ok:false,t:`« ${r.src} » : pas compris. Écris par ex. « trop de monde mardi midi » ou « ouverture trop tard samedi ».`});return;}
    if(r.k==='bien'){global=global||'bien';lignes.push({ok:true,t:'C’était bien : Léon garde ce rythme.'});return;}
    const jours=r.days.length?r.days:[0,1,2,3,4,5,6].filter(d=>!isClosed(d));
    if(r.k==='trop'||r.k==='manque'){
      if(!r.days.length){global=r.k;lignes.push({ok:true,t:r.k==='trop'?'Trop de monde en général : Léon mettra un peu moins de monde pour autant de couverts.':'Pas assez de monde en général : Léon mettra un peu plus de monde pour autant de couverts.'});return;}
      const svcs=r.svcs||['midi','soir'];const n=r.k==='trop'?-1:1;
      jours.forEach(d=>svcs.forEach(svc=>{if(!C.ouv[d][svc])return;notes.push(`${JOURS[d]} ${svc} ${n>0?'+1':'-1'}${r.g?' '+L[r.g]:''}`);}));
      lignes.push({ok:true,t:`${V15_JOURS(r.days).replace(/^./,c=>c.toUpperCase())}${r.svcs?' '+r.svcs[0]:''} : ${n>0?'une personne de plus':'une personne de moins'}${r.g?' '+L[r.g]:''}.`});return;}
    if(r.k==='ouv'){
      const svcs=r.svcs||['midi'];const p=r.g||'salle';
      svcs.forEach(svc=>{const o=cdcMin(C.h[svc][0]);const s=hhmm(Math.max(0,o-30)),e=hhmm(o);
        const ex=prepa.find(P=>P.p===p&&P.s===s&&P.e===e);const js=jours.filter(d=>C.ouv[d][svc]);
        if(ex)ex.jours=[...new Set([...ex.jours,...js])].sort();else prepa.push({p,s,e,n:1,jours:js});
        lignes.push({ok:true,t:`${V15_JOURS(js).replace(/^./,c=>c.toUpperCase())} ${svc} : quelqu’un ${L[p]||''} dès ${s}, 30 min avant l’ouverture (${C.h[svc][0]}).`});});
      return;}
    if(r.k==='prepa'){
      const p=r.g||'cuisine';const mine=prepa.filter(P=>P.p===p);
      if(mine.length){mine.forEach(P=>{const js=r.days.length?r.days:P.jours;if(js.some(d=>P.jours.includes(d))||!r.days.length){P.n=(P.n||1)+1;}else P.jours=[...new Set([...P.jours,...js])].sort();});
        lignes.push({ok:true,t:`Prépa ${L[p]||''}${r.days.length?' '+V15_JOURS(r.days):''} : une personne de plus (${mine.map(P=>P.s+'–'+P.e).join(', ')}).`});}
      else{prepa.push({p,s:'09:30',e:'11:00',n:1,jours:jours.filter(d=>C.ouv[d].midi)});
        lignes.push({ok:true,t:`Prépa ${L[p]||''} ajoutée : quelqu’un de 9 h 30 à 11 h${r.days.length?' '+V15_JOURS(r.days):' les jours ouverts le midi'}. Tu peux changer l’horaire dans le cahier des charges.`});}
      return;}
  });
  return {lignes,notes,prepa,global};
}
let V15_RET=null;
ACT['ret-go']=function(){
  const a=$('#ret-in');const txt=a?a.value.trim():'';
  if(!txt){toast('Écris en quelques mots ce qui n’allait pas','alert');if(a)a.focus();return;}
  const P=v15Plan(v15Retour(txt));V15_RET={txt,P};
  const ok=P.lignes.some(l=>l.ok);
  openModal(`<div class="mh"><div><h3>${ic('spark')} Ce que Léon a compris</h3><p>« ${esc(txt)} »</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="cdc-lu v15-lu">${P.lignes.map(l=>`<div class="${l.ok?'ok':'no'}">${l.ok?'✓':'✗'} ${esc(l.t)}</div>`).join('')}</div>
    ${ok?`<p class="faint" style="font-size:12.5px;margin-top:10px">Léon l’écrit dans ton cahier des charges : il s’en sert pour chaque planning, et tu peux le modifier quand tu veux.</p>`:''}
    <div class="mf"><button class="btn" data-act="modal-close">${ok?'Annuler':'Fermer'}</button>${ok?`<button class="btn brass" data-act="ret-ok">${ic('check','s')} C’est ça, garde-le</button>`:''}</div>`,'wide');
};
ACT['ret-ok']=function(){
  if(!V15_RET)return;const {txt,P}=V15_RET;V15_RET=null;
  const C=cdcGet();const note=[C.note.trim(),...P.notes].filter(Boolean).join('\n');
  S.planCdc={ouv:C.ouv.map(o=>({midi:o.midi,soir:o.soir})),h:C.h,prepa:P.prepa.filter(p=>p.jours.length),eff:C.eff,note};
  S.semAvis={...(S.semAvis||{}),[wkIso(-1)]:P.global||'dit'};
  S.semRetour={...(S.semRetour||{}),[wkIso(-1)]:txt};
  save();AP_CACHE=null;closeModal();renderView();
  toast('Noté : Léon s’en sert dès le prochain planning','check');
};

[
 ['Tes espaces','Your spaces','உங்கள் பகுதிகள்','أقسامك','Os teus espaços','Tus espacios'],
 ['La semaine dernière, c’était comment ?','How was last week?','கடந்த வாரம் எப்படி இருந்தது?','كيف كان الأسبوع الماضي؟','Como foi a semana passada?','¿Qué tal la semana pasada?'],
 ['Dire à Léon','Tell Léon','லியோனிடம் சொல்','قل لليون','Dizer ao Léon','Decírselo a Léon'],
 ['C’était bien','It was fine','நன்றாக இருந்தது','كان جيدًا','Correu bem','Estuvo bien'],
 ['Trop de monde','Too many people','அதிக ஆட்கள்','عدد كبير جدًا','Gente a mais','Demasiada gente'],
 ['Pas assez de monde','Not enough people','போதுமான ஆட்கள் இல்லை','عدد غير كافٍ','Gente a menos','Falta gente'],
 ['Ouverture trop tard','Opening too late','திறப்பு தாமதம்','الافتتاح متأخر','Abertura tarde demais','Apertura demasiado tarde'],
 ['Pas assez en prépa','Not enough prep staff','தயாரிப்பில் ஆட்கள் குறைவு','عدد غير كافٍ في التحضير','Pouca gente na preparação','Falta gente en preparación'],
 ['Léon refait la semaine','Léon redoes the week','லியோன் வாரத்தை மீண்டும் செய்கிறார்','ليون يعيد الأسبوع','O Léon refaz a semana','Léon rehace la semana'],
 ['Arrivé (badgé)','Arrived (clocked in)','வந்துவிட்டார் (பதிவு)','وصل (سجّل)','Chegou (picou)','Llegó (fichó)'],
].forEach(r=>{LANGS.forEach(([k],n)=>{if(n&&r[n]){I18N[k][r[0]]=r[n];const alt=r[0].replace(/’/g,"'");if(alt!==r[0])I18N[k][alt]=r[n];}});});

/* ---------- Léon remplit en deux temps : d'abord le minimum partout, ensuite les renforts ----------
   Avant : les jours les plus chargés d'abord, jusqu'au bout. Quand l'équipe arrivait au bout de ses contrats,
   le dernier jour (ex. un lundi rouvert) restait presque vide. Maintenant chaque service ouvert a d'abord
   une personne en salle et une en cuisine ; le reste des heures va aux renforts. */
let V15_PASS=0;
{const f=leonBesoin;leonBesoin=function(){
  const need=f.apply(this,arguments);
  if(V15_PASS===1)Object.keys(need).forEach(k=>{need[k]=Math.min(need[k],k==='bar'?0:1);});
  return need;
};}
{const f=autoFill;autoFill=function(w){
  // passe 1 : sans la semaine type et sans « compléter les contrats », juste le minimum sur chaque service ouvert
  let R1=null;V15_PASS=1;const tpl=S.tplWeek;S.tplWeek=null;
  try{R1=f.apply(this,arguments);}catch(e){console.error('passe 1',e);}finally{V15_PASS=0;S.tplWeek=tpl;}
  if(R1&&R1.add)R1.add=R1.add.filter(x=>!/Compléter|Semaine type/.test(x.why||''));
  if(!R1||!R1.add||!R1.add.length)return f.apply(this,arguments);
  const tmp=R1.add.map(x=>({...x,w:+w,__v15:1}));
  S.shifts.push(...tmp);AP_CACHE=null;
  let R2;
  try{R2=f.apply(this,arguments);}finally{S.shifts=S.shifts.filter(x=>!x.__v15);AP_CACHE=null;}
  R2.add=[...R1.add,...R2.add];
  R2.min=sum(R2.add,durMin);R2.cost=sum(R2.add,x=>durMin(x)/60*((empById(x.emp)||{}).taux||0));
  return R2;
};}
