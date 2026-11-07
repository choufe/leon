/* =========================================================
   V13.02 · LÉON PLANNING : LE CAHIER DES CHARGES
   Décidé avec Maurice le 7 nov. : Léon faisait le planning « à l'aveugle ». Maintenant :
   1. un CAHIER DES CHARGES du resto (rempli une fois) : jours et services ouverts, horaires,
      créneaux de prépa, nombre de personnes min / max par service, et des règles en texte libre ;
   2. des CONSIGNES pour la semaine, tapées juste avant que Léon remplisse
      (« mercredi soir événement, un peu plus de monde », « dimanche midi 3 personnes suffisent ») ;
   3. les heures que Léon baisse exprès s'affichent « 30h✦ / 35h », et l'étoile explique pourquoi ;
   4. l'avis de Léon vérifie aussi la prépa et l'ouverture / fermeture de chaque service.
   ========================================================= */
const CDC_GRP={salle:['salle','manager'],cuisine:['cuisine'],bar:['bar']};
const CDC_GL={salle:'en salle',cuisine:'en cuisine',bar:'au bar'};
const CDC_JR=[/lundi/,/mardi/,/mercredi/,/jeudi/,/vendredi/,/samedi/,/dimanche/];
const cdcMin=s=>{const m=String(s||'').match(/(\d{1,2})[:h](\d{2})?/);return m?(+m[1])*60+(+(m[2]||0)):null;};
// sauvegarde avec le planning
{const D=DOCS.planning;DOCS.planning={p:D.p,out:R=>({...D.out(R),cdc:R.planCdc||null,consignes:R.planConsignes||{}}),in:(R,d)=>{D.in(R,d);R.planCdc=d.cdc||null;R.planConsignes=d.consignes||{};}};}

function cdcGet(){
  const C=S.planCdc||{};
  return {
    rempli:!!S.planCdc,
    ouv:[0,1,2,3,4,5,6].map(d=>{const o=(C.ouv||[])[d];if(isClosed(d))return {midi:false,soir:false};return o?{midi:o.midi!==false,soir:o.soir!==false}:{midi:true,soir:true};}),
    h:{midi:['11:30','14:30'],soir:['18:30','23:00'],...(C.h||{})},
    prepa:(C.prepa||[]).slice(),
    eff:C.eff||{},
    note:C.note||''
  };
}
const cdcOpen=(d,svc)=>{const C=cdcGet();return !isClosed(d)&&C.ouv[d][svc];};

/* ---------- lire les consignes écrites en français ---------- */
function cdcParse(txt){
  const out=[];
  String(txt||'').split(/[\n.;!]+|,\s*(?=(?:et\s+)?(?:le |les |la |l'|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|tous|chaque))/i).map(s=>s.trim()).filter(s=>s.length>2).forEach(src=>{
    const s=src.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/(\d)\s*h\s*(\d{2})?/g,(m,a,b)=>a+':'+(b||'00'));
    let days=[];CDC_JR.forEach((re,d)=>{if(re.test(s))days.push(d);});
    if(/week-?end/.test(s))days.push(5,6);
    if(/tous les jours|chaque jour|toute la semaine|tous les services/.test(s))days=[0,1,2,3,4,5,6];
    days=[...new Set(days)];
    const svcs=/midi|dej/.test(s)&&!/soir|diner/.test(s)?['midi']:/soir|diner/.test(s)&&!/midi|dej/.test(s)?['soir']:['midi','soir'];
    const g=/salle|serveu|runner/.test(s)?'salle':/cuisin|cuistot|chef|commis/.test(s)?'cuisine':/\bbar/.test(s)?'bar':'tous';
    const sansH=s.replace(/\d{1,2}:\d{2}/g,' ');
    const num=(sansH.match(/(?:^|[^+\-\d])(\d{1,2})(?!\d)/)||[])[1];
    const plus=(sansH.match(/\+\s*(\d{1,2})/)||[])[1],moins=(sansH.match(/(?:-|moins de )\s*(\d{1,2})/)||[])[1];
    let r=null;
    if(/ferm/.test(s))r={k:'ferme'};
    else if(plus)r={k:'delta',n:+plus};
    else if(moins&&!/moins de monde/.test(s))r={k:'delta',n:-moins};
    else if(num&&/suffi|max|pas plus|seulement|que \d|pas besoin de plus/.test(s))r={k:'cap',n:+num};
    else if(num&&/au moins|minimum|min\b|il faut|faut|prevoi|besoin|veux|mettre|met /.test(s))r={k:'min',n:+num};
    else if(num&&/personne|pers\b|gens|salari|employ|serveu|cuisinier|barm|monde|staff/.test(s))r={k:'set',n:+num};
    else if(/beaucoup (plus|de monde)|gros (evenement|event|rush)/.test(s))r={k:'delta',n:2};
    else if(/plus de monde|renfort|un peu plus|monde en plus|quelqu.un de plus|une personne de plus|evenement|event|soiree speciale|charge|rush|affluence/.test(s))r={k:'delta',n:1};
    else if(/moins de monde|calme|tranquille|un de moins|une personne de moins|creux/.test(s))r={k:'delta',n:-1};
    out.push(r&&days.length?{...r,days,svcs,g,src}:{k:'?',src,pourquoi:!days.length&&r?'quel jour ?':'pas compris'});
  });
  return out;
}
function cdcRules(w){
  const C=cdcGet();const base=cdcParse(C.note).map(r=>({...r,from:'cdc'}));
  const sem=cdcParse((S.planConsignes||{})[wkIso(w)]||'').map(r=>({...r,from:'sem'}));
  return [...base,...sem];
}

/* ---------- Léon applique : besoin de chaque service ---------- */
let CDC_CTX=null,CDC_LOG=null;
{const f=rmCouverts;rmCouverts=function(w,d){
  const r=f.apply(this,arguments);CDC_CTX={w,d};
  try{['midi','soir'].forEach((svc,i)=>{
    if(!cdcOpen(d,svc)||cdcRules(w).some(x=>x.k==='ferme'&&x.days.includes(d)&&x.svcs.includes(svc)))r.c[i]=0;});}catch(e){}
  return r;
};}
{const f=leonBesoin;leonBesoin=function(cv,svc,ev){
  const need=f.apply(this,arguments);if(!CDC_CTX||!S)return need;const {w,d}=CDC_CTX;
  try{
    const avant={...need};const C=cdcGet();const src={};
    if(!EMP.some(e=>CDC_GRP.bar.includes(e.poste)))need.bar=0;
    Object.keys(CDC_GRP).forEach(k=>{const E=((C.eff||{})[svc]||{})[k];if(!E)return;
      if(E.min!=null&&need[k]<E.min){need[k]=+E.min;src[k]='cahier des charges';}
      if(E.max!=null&&need[k]>E.max){need[k]=+E.max;src[k]='cahier des charges';}});
    const tot=()=>need.salle+need.cuisine+need.bar;
    cdcRules(w).filter(r=>r.k!=='?'&&r.k!=='ferme'&&r.days.includes(d)&&r.svcs.includes(svc)).forEach(r=>{
      const lab=r.from==='sem'?'consigne de la semaine':'cahier des charges';
      if(r.g!=='tous'){const k=r.g;
        if(r.k==='delta')need[k]=Math.max(0,need[k]+r.n);else if(r.k==='cap')need[k]=Math.min(need[k],r.n);else if(r.k==='min')need[k]=Math.max(need[k],r.n);else need[k]=r.n;
        src[k]=lab;return;}
      let target=r.k==='delta'?tot()+r.n:r.k==='cap'?Math.min(tot(),r.n):r.k==='min'?Math.max(tot(),r.n):r.n;
      let guard=0;
      while(tot()>target&&guard++<20){const k=need.bar>0?'bar':need.cuisine>=need.salle&&need.cuisine>1?'cuisine':need.salle>1?'salle':need.cuisine>0?'cuisine':'salle';need[k]--;src[k]=lab;}
      while(tot()<target&&guard++<40){const k=need.salle<=need.cuisine?'salle':'cuisine';need[k]++;src[k]=lab;}
    });
    if(CDC_LOG)Object.keys(src).forEach(k=>{if(avant[k]!==need[k])CDC_LOG.push({d,svc,k,de:avant[k],a:need[k],src:src[k]});});
  }catch(e){console.error('cdc',e);}
  return need;
};}

/* ---------- Léon remplit : prépa, plafonds, explications ---------- */
{const f=autoFill;autoFill=function(w){
  CDC_LOG=[];let R;
  try{R=f.apply(this,arguments);}finally{var LOG=CDC_LOG;CDC_LOG=null;}
  try{cdcApres(+w,R,LOG);}catch(e){console.error('cdc fill',e);}
  return R;
};}
function cdcApres(w,R,LOG){
  const C=cdcGet();const why=[];
  const shOf=(emp,d)=>[...empShifts(emp,w,d),...R.add.filter(x=>x.emp===emp&&x.d===d)];
  const weekMin=emp=>empWeekMin(emp,w)+sum(R.add.filter(x=>x.emp===emp),durMin);
  /* 1. plafonds : on retire les shifts « pour compléter un contrat » qui dépassent ce que le patron veut */
  R.days.forEach(d=>{let cv;try{cv=rmCouverts(w,d).c;}catch(e){return;}
    ['midi','soir'].forEach((svc,i)=>{if(!cv[i])return;const need=leonBesoin(cv[i],svc,null);const [a,b]=SVC_WIN[svc];
      Object.keys(CDC_GRP).forEach(k=>{
        const on=()=>[...shiftsWD(w,d),...R.add.filter(x=>x.d===d)].filter(x=>sMin(x)<b&&eMin(x)>a&&CDC_GRP[k].includes(x.poste));
        let guard=0;while(new Set(on().map(x=>x.emp)).size>need[k]&&guard++<6){
          const x=R.add.find(x=>x.d===d&&sMin(x)<b&&eMin(x)>a&&CDC_GRP[k].includes(x.poste)&&/Compléter/.test(x.why||''));if(!x)break;
          R.add.splice(R.add.indexOf(x),1);}
      });});});
  /* 2. la prépa : quelqu'un doit être là sur le créneau */
  const manque=[];
  C.prepa.forEach(P=>{const ps=cdcMin(P.s),pe=cdcMin(P.e);if(ps==null||pe==null||pe<=ps)return;
    (P.jours||[]).filter(d=>R.days.includes(d)).forEach(d=>{
      const grp=CDC_GRP[P.p]||[P.p];
      const la=()=>new Set([...shiftsWD(w,d),...R.add.filter(x=>x.d===d)].filter(x=>grp.includes(x.poste)&&sMin(x)<=ps&&eMin(x)>=pe).map(x=>x.emp)).size;
      let guard=0;
      while(la()<(P.n||1)&&guard++<4){
        // on avance le début d'un shift que Léon vient de proposer, si les règles tiennent
        const cand=R.add.filter(x=>x.d===d&&grp.includes(x.poste)&&sMin(x)>ps&&sMin(x)<=pe+240).filter(x=>{
          const e=empById(x.emp);const ext=sMin(x)-ps;const day=shOf(x.emp,d);const test=day.map(y=>y===x?{...y,s:hhmm(ps)}:y);
          if(sum(test,durMin)>maxDayMin(e)||amplitudeOf(test)>780)return false;
          const cib=R.cible&&R.cible[x.emp]?R.cible[x.emp].cible:e.contrat*60;if(weekMin(x.emp)+ext>cib+30)return false;
          let pd=d-1,pw=w;if(pd<0){pd=6;pw=w-1;}const prev=pw===w?shOf(x.emp,pd):empShifts(x.emp,pw,pd);
          if(prev.length&&(1440-Math.max(...prev.map(eMin)))+ps<660)return false;return true;
        }).sort((a,b)=>sMin(a)-sMin(b));
        const x=cand[0];if(!x){manque.push({d,P});break;}
        const old=x.s;x.s=hhmm(ps);x.why=(x.why?x.why+' · ':'')+`commence à ${x.s} pour la prépa (au lieu de ${old})`;
      }
    });});
  R.min=sum(R.add,durMin);R.cost=sum(R.add,x=>durMin(x)/60*(empById(x.emp).taux||0));
  /* 3. ce que Léon a pris en compte */
  const L={salle:'en salle',cuisine:'en cuisine',bar:'au bar'};
  const sem=(S.planConsignes||{})[wkIso(w)]||'';
  const rs=cdcRules(w);
  const vu={};LOG.forEach(l=>{const key=l.d+l.svc+l.k;vu[key]=l;});
  const lignes=Object.values(vu).filter(l=>l.de!==l.a).sort((a,b)=>a.d-b.d||(a.svc<b.svc?-1:1));
  if(lignes.length)why.push({ic:'note',tone:'brass',t:sem?'Tes consignes et ton cahier des charges':'Ton cahier des charges',s:lignes.slice(0,8).map(l=>`${JOURS[l.d]} ${l.svc} : ${l.a} ${L[l.k]} au lieu de ${l.de}`).join(' · ')+(lignes.length>8?'…':'.')});
  rs.filter(r=>r.k==='ferme').forEach(r=>why.push({ic:'note',tone:'brass',t:`« ${r.src} »`,s:'Personne n’est mis sur ce service.'}));
  const pasCompris=rs.filter(r=>r.k==='?');
  if(pasCompris.length)why.push({ic:'alert',tone:'warn',t:'Léon n’a pas compris '+(pasCompris.length>1?'ces consignes':'cette consigne'),s:pasCompris.map(r=>`« ${r.src} » (${r.pourquoi})`).join(' · ')+'. Écris par ex. « mercredi soir +1 en salle » ou « dimanche midi 3 personnes suffisent ».'});
  if(C.prepa.length)why.push(manque.length?{ic:'alert',tone:'warn',t:'Prépa pas couverte partout',s:manque.map(m=>`${JOURS[m.d]} ${m.P.s}–${m.P.e} (${POSTES[m.P.p]?POSTES[m.P.p].l.toLowerCase():m.P.p})`).join(' · ')+' : personne ne peut commencer plus tôt sans casser une règle. À voir à la main.'}
    :{ic:'check',tone:'ok',t:'Prépa couverte',s:C.prepa.map(P=>`${P.s}–${P.e} ${POSTES[P.p]?POSTES[P.p].l.toLowerCase():P.p}`).join(' · ')+'.'});
  if(!C.rempli)why.unshift({ic:'info',tone:'info',t:'Ton cahier des charges n’est pas rempli',s:'Léon ne connaît ni tes horaires, ni ta prépa, ni le nombre de personnes que tu veux par service. Remplis-le une fois (bouton « Cahier des charges » du planning) : les plannings seront bien plus justes.'});
  R.why=[...why,...(R.why||[])];
  R.log=(R.log||[]).filter(l=>{const n=leonBesoinAt(w,l.d,l.svc);return !n||n[l.k]>0;});
}
function leonBesoinAt(w,d,svc){try{const c=rmCouverts(w,d).c;const i=svc==='midi'?0:1;return c[i]?leonBesoin(c[i],svc,null):null;}catch(e){return null;}}

/* ---------- avant de remplir : les consignes de la semaine ---------- */
function consignesFlow(w){
  const C=cdcGet();const cur=(S.planConsignes||{})[wkIso(w)]||'';
  const resume=cdcResume(C);
  openModal(`<div class="mh"><div><h3>${ic('wand')} Léon remplit la semaine ${isoWeek(dateAt(w,0))}</h3><p>Dis-lui ce qu’il ne peut pas deviner : un événement, un service calme, quelqu’un en plus… Une consigne par ligne.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="field"><label for="cs-in">Consignes pour cette semaine (facultatif)</label>
      <textarea class="inp" id="cs-in" rows="4" placeholder="Ex.&#10;Mercredi soir événement, un peu plus de monde&#10;Dimanche midi 3 personnes suffisent&#10;Samedi soir +1 au bar">${esc(cur)}</textarea></div>
    <div class="cs-ex">${['Mercredi soir événement, un peu plus de monde','Dimanche midi 3 personnes suffisent','Samedi soir +1 en salle','Lundi midi fermé'].map(x=>`<button class="btn sm ghost" data-act="cs-ex" data-t="${esc(x)}">+ ${esc(x)}</button>`).join('')}</div>
    <div class="cs-cdc ${C.rempli?'':'vide'}"><span class="rm-ic">${ic(C.rempli?'check':'info','s')}</span><div><b>${C.rempli?'Ton cahier des charges':'Cahier des charges pas encore rempli'}</b><p>${C.rempli?esc(resume):'Léon ne connaît pas encore tes horaires, ta prépa ni combien de personnes tu veux par service. 2 minutes, une seule fois.'}</p></div><button class="btn sm" data-act="cdc-open" data-from="fill">${C.rempli?'Modifier':'Le remplir'}</button></div>
    <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn brass" data-act="cs-go">${ic('wand','s')} Léon remplit</button></div>`,'wide');
}
function cdcResume(C){
  const ouv=[0,1,2,3,4,5,6].filter(d=>C.ouv[d].midi||C.ouv[d].soir);
  const bouts=[`ouvert ${ouv.length} jours (${ouv.map(d=>JC[d]+(C.ouv[d].midi&&C.ouv[d].soir?'':C.ouv[d].midi?' midi':' soir')).join(', ')})`,`midi ${C.h.midi.join('–')}, soir ${C.h.soir.join('–')}`];
  if(C.prepa.length)bouts.push('prépa '+C.prepa.map(P=>`${P.s}–${P.e}`).join(', '));
  const n=Object.values(C.eff).reduce((a,o)=>a+Object.keys(o||{}).length,0);if(n)bouts.push(plur(n,'règle d’effectif','règles d’effectif'));
  if(C.note.trim())bouts.push(plur(cdcParse(C.note).length,'règle écrite','règles écrites'));
  return bouts.join(' · ');
}
ACT['pl-fill-direct']=function(){closeModal();consignesFlow(UI.plan.w);};
ACT['cs-ex']=function(t){const a=$('#cs-in');if(!a)return;a.value=(a.value.trim()?a.value.trim()+'\n':'')+t.dataset.t;a.focus();};
function csSave(){const a=$('#cs-in');if(!a)return;const w=UI.plan.w;const v=a.value.trim();S.planConsignes={...(S.planConsignes||{})};if(v)S.planConsignes[wkIso(w)]=v;else delete S.planConsignes[wkIso(w)];save();}
ACT['cs-go']=function(){csSave();closeModal();fillFlow(UI.plan.w);};

/* ---------- le cahier des charges (réglages de Léon planning) ---------- */
let CDC_EDIT=null;
ACT['cdc-open']=function(t){
  if(t&&t.dataset.from==='fill')csSave();
  closeMenu&&closeMenu();const C=cdcGet();CDC_EDIT={...C,ouv:C.ouv.map(o=>({...o})),h:{midi:C.h.midi.slice(),soir:C.h.soir.slice()},prepa:C.prepa.map(p=>({...p,jours:(p.jours||[]).slice()})),eff:JSON.parse(JSON.stringify(C.eff||{})),from:t&&t.dataset.from};
  cdcRender();
};
function cdcRender(){
  const E=CDC_EDIT;const postes=POSTE_ORDER.filter(p=>EMP.some(e=>e.poste===p)&&p!=='manager');
  const grp=Object.keys(CDC_GRP).filter(k=>EMP.some(e=>CDC_GRP[k].includes(e.poste)));
  const numIn=(svc,k,mm)=>{const v=((E.eff[svc]||{})[k]||{})[mm];return `<input class="inp cdc-n" type="number" min="0" max="20" inputmode="numeric" aria-label="${mm} ${k} ${svc}" data-cdc="eff" data-sv="${svc}" data-k="${k}" data-mm="${mm}" value="${v==null?'':v}" placeholder="–">`;};
  openModal(`<div class="mh"><div><h3>${ic('note')} Cahier des charges du planning</h3><p>Ce que Léon doit savoir sur ton resto. Rempli une fois, il s’en sert à chaque planning.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <div class="cdc">
    <section><h4 class="rm-h">1. Jours et services ouverts</h4>
      <div class="cdc-ouv">${[0,1,2,3,4,5,6].map(d=>`<div class="cdc-j"><b>${JC[d]}</b>${['midi','soir'].map(svc=>`<button class="cdc-t" data-act="cdc-t" data-d="${d}" data-sv="${svc}" aria-pressed="${E.ouv[d][svc]}">${svc==='midi'?'Midi':'Soir'}</button>`).join('')}</div>`).join('')}</div>
      <div class="cdc-h">${['midi','soir'].map(svc=>`<label>${svc==='midi'?'Service du midi':'Service du soir'} <input class="inp tm" type="time" step="900" data-cdc="h" data-sv="${svc}" data-i="0" value="${E.h[svc][0]}"> – <input class="inp tm" type="time" step="900" data-cdc="h" data-sv="${svc}" data-i="1" value="${E.h[svc][1]}"></label>`).join('')}</div>
      <p class="faint">Léon vérifie qu’il y a quelqu’un en salle à l’ouverture et à la fermeture de chaque service.</p></section>
    <section><h4 class="rm-h">2. Prépa et mise en place</h4>
      ${E.prepa.map((P,i)=>`<div class="cdc-p"><select class="inp" data-cdc="pp" data-i="${i}" aria-label="Poste">${postes.map(p=>`<option value="${p}" ${P.p===p?'selected':''}>${POSTES[p].l}</option>`).join('')}</select>
        <input class="inp tm" type="time" step="900" data-cdc="ps" data-i="${i}" value="${P.s}" aria-label="Début"> – <input class="inp tm" type="time" step="900" data-cdc="pe" data-i="${i}" value="${P.e}" aria-label="Fin">
        <span class="cdc-pj">${[0,1,2,3,4,5,6].map(d=>`<button class="cdc-t sm" data-act="cdc-pj" data-i="${i}" data-d="${d}" aria-pressed="${P.jours.includes(d)}">${JC[d].slice(0,2)}</button>`).join('')}</span>
        <button class="icon-btn" data-act="cdc-pdel" data-i="${i}" aria-label="Retirer">${ic('trash','s')}</button></div>`).join('')}
      <button class="btn sm" data-act="cdc-padd">${ic('plus','s')} Ajouter un créneau de prépa</button>
      <p class="faint">Ex. quelqu’un en cuisine de 9 h 30 à 11 h. Léon fait commencer plus tôt un shift du midi.</p></section>
    <section><h4 class="rm-h">3. Combien de personnes par service</h4>
      <table class="cdc-eff"><thead><tr><th></th>${grp.map(k=>`<th>${k==='salle'?'Salle':k==='cuisine'?'Cuisine':'Bar'}</th>`).join('')}</tr></thead>
      <tbody>${['midi','soir'].map(svc=>`<tr><th>${svc==='midi'?'Midi':'Soir'}</th>${grp.map(k=>`<td><em class="cdc-k">${k==='salle'?'Salle':k==='cuisine'?'Cuisine':'Bar'}</em><span>min</span>${numIn(svc,k,'min')}<span>max</span>${numIn(svc,k,'max')}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <p class="faint">Laisse vide : Léon calcule avec les couverts prévus. Le max, c’est ce que tu ne veux jamais dépasser.</p></section>
    <section><h4 class="rm-h">4. Tes règles, en mots simples</h4>
      <textarea class="inp" id="cdc-note" rows="3" placeholder="Ex.&#10;Le dimanche midi, 3 personnes suffisent&#10;Le vendredi soir, +1 au bar">${esc(E.note)}</textarea>
      <div id="cdc-lu" class="cdc-lu">${cdcLuHTML(E.note)}</div></section>
   </div>
   <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="cdc-save">${ic('check','s')} Enregistrer</button></div>`,'wide');
  const n=$('#cdc-note');if(n)n.addEventListener('input',()=>{E.note=n.value;const l=$('#cdc-lu');if(l)l.innerHTML=cdcLuHTML(n.value);});
}
function cdcLuHTML(txt){
  const R=cdcParse(txt);if(!R.length)return '';
  const svc=r=>r.svcs.length===2?'':' '+r.svcs[0];const g=r=>r.g==='tous'?'':' '+CDC_GL[r.g];
  const jours=r=>r.days.length===7?'Tous les jours':r.days.map(d=>JOURS[d].toLowerCase()).join(', ').replace(/^./,c=>c.toUpperCase());
  return R.map(r=>r.k==='?'?`<div class="no">✗ « ${esc(r.src)} » : ${r.pourquoi}</div>`:`<div class="ok">✓ ${jours(r)}${svc(r)} : ${r.k==='ferme'?'fermé':r.k==='cap'?`${r.n} max${g(r)}`:r.k==='min'?`au moins ${r.n}${g(r)}`:r.k==='set'?`${r.n} personnes${g(r)}`:`${r.n>0?'+':''}${r.n}${g(r)}`}</div>`).join('');
}
function cdcRead(){
  const E=CDC_EDIT;const n=$('#cdc-note');if(n)E.note=n.value;
  document.querySelectorAll('[data-cdc]').forEach(el=>{const t=el.dataset.cdc,i=+el.dataset.i;
    if(t==='h')E.h[el.dataset.sv][i]=el.value||E.h[el.dataset.sv][i];
    else if(t==='pp')E.prepa[i].p=el.value;else if(t==='ps')E.prepa[i].s=el.value;else if(t==='pe')E.prepa[i].e=el.value;
    else if(t==='eff'){const s=el.dataset.sv,k=el.dataset.k,mm=el.dataset.mm;E.eff[s]=E.eff[s]||{};E.eff[s][k]=E.eff[s][k]||{};
      if(el.value==='')delete E.eff[s][k][mm];else E.eff[s][k][mm]=Math.max(0,+el.value);
      if(!Object.keys(E.eff[s][k]).length)delete E.eff[s][k];}});
}
ACT['cdc-t']=function(t){cdcRead();const o=CDC_EDIT.ouv[+t.dataset.d];o[t.dataset.sv]=!o[t.dataset.sv];cdcRender();};
ACT['cdc-pj']=function(t){cdcRead();const P=CDC_EDIT.prepa[+t.dataset.i];const d=+t.dataset.d;P.jours=P.jours.includes(d)?P.jours.filter(x=>x!==d):[...P.jours,d].sort();cdcRender();};
ACT['cdc-padd']=function(){cdcRead();CDC_EDIT.prepa.push({p:EMP.some(e=>e.poste==='cuisine')?'cuisine':'salle',s:'09:30',e:'11:00',n:1,jours:[0,1,2,3,4,5,6].filter(d=>CDC_EDIT.ouv[d].midi)});cdcRender();};
ACT['cdc-pdel']=function(t){cdcRead();CDC_EDIT.prepa.splice(+t.dataset.i,1);cdcRender();};
ACT['cdc-save']=function(){
  cdcRead();const E=CDC_EDIT;
  for(const svc of ['midi','soir']){if(cdcMin(E.h[svc][1])<=cdcMin(E.h[svc][0])){toast(`Service du ${svc} : l’heure de fin doit être après le début`,'alert');return;}}
  for(const svc in E.eff)for(const k in E.eff[svc]){const o=E.eff[svc][k];if(o.min!=null&&o.max!=null&&o.min>o.max){toast(`${svc==='midi'?'Midi':'Soir'} ${CDC_GL[k]} : le min est plus grand que le max`,'alert');return;}}
  for(const P of E.prepa){if(cdcMin(P.e)<=cdcMin(P.s)){toast('Prépa : l’heure de fin doit être après le début','alert');return;}}
  const closed=[0,1,2,3,4,5,6].filter(d=>!E.ouv[d].midi&&!E.ouv[d].soir);
  S.closed=closed;
  S.planCdc={ouv:E.ouv.map(o=>({midi:o.midi,soir:o.soir})),h:E.h,prepa:E.prepa.filter(P=>P.jours.length),eff:E.eff,note:E.note.trim()};
  save();const from=E.from;CDC_EDIT=null;closeModal();toast('Cahier des charges enregistré : Léon s’en sert pour chaque planning');
  if(from==='fill')consignesFlow(UI.plan.w);else if(UI.view==='planning')planRender();
};

/* ---------- le bouton dans le planning ---------- */
function cdcBouton(){
  if(!S||UI.view!=='planning'||!CAN().editPlanning||effRole()==='staff')return;
  const a=document.querySelector('[data-act="pl-fill"]');if(!a||a.parentElement.querySelector('[data-act="cdc-open"]'))return;
  a.insertAdjacentHTML('afterend',`<button class="btn sm" data-act="cdc-open" title="Ce que Léon doit savoir pour faire le planning">${ic('note','s')} Cahier des charges</button>`);
}
{const f=renderView;renderView=function(){const r=f.apply(this,arguments);try{cdcBouton();}catch(e){}return r;};}
{const f=planRender;planRender=function(){const r=f.apply(this,arguments);try{cdcBouton();}catch(e){}return r;};}

/* ---------- l'avis de Léon : prépa, ouverture et fermeture ---------- */
{const f=leonAvisPlanning;leonAvisPlanning=function(w){
  const R=f.apply(this,arguments);
  try{
    if(!S.shifts.some(x=>x.w===w))return R;
    const C=cdcGet();const prob=[];
    const days=[0,1,2,3,4,5,6].filter(d=>!isClosed(d));
    days.forEach(d=>{
      C.prepa.filter(P=>(P.jours||[]).includes(d)).forEach(P=>{const ps=cdcMin(P.s),pe=cdcMin(P.e);const grp=CDC_GRP[P.p]||[P.p];
        if(!shiftsWD(w,d).some(x=>grp.includes(x.poste)&&sMin(x)<=ps&&eMin(x)>=pe))prob.push(`${JOURS[d]} : personne à la prépa ${P.s}–${P.e}`);});
      ['midi','soir'].forEach(svc=>{if(!C.ouv[d][svc])return;let cv=1;try{cv=rmCouverts(w,d).c[svc==='midi'?0:1];}catch(e){}if(!cv)return;
        const o=cdcMin(C.h[svc][0]),fe=cdcMin(C.h[svc][1]);const sal=shiftsWD(w,d).filter(x=>CDC_GRP.salle.includes(x.poste));
        if(!sal.length)return;
        if(!sal.some(x=>sMin(x)<=o&&eMin(x)>o))prob.push(`${JOURS[d]} ${svc} : personne en salle à l’ouverture (${C.h[svc][0]})`);
        if(!sal.some(x=>sMin(x)<fe&&eMin(x)>=fe))prob.push(`${JOURS[d]} ${svc} : personne en salle jusqu’à la fermeture (${C.h[svc][1]})`);});
    });
    if(prob.length)R.out.splice(1,0,{tone:'warn',ic:'clock',t:'Ton cahier des charges n’est pas tenu partout',s:prob.slice(0,4).join(' · ')+(prob.length>4?` · et ${prob.length-4} autres`:'')+'.'});
    if(!C.rempli)R.out.push({tone:'info',ic:'note',t:'Remplis ton cahier des charges',s:'Horaires, prépa, combien de personnes par service : Léon jugera ton planning avec tes règles à toi, pas des moyennes.'});
  }catch(e){console.error('cdc avis',e);}
  return R;
};}

/* ---------- « 30h✦ / 35h » : les heures que Léon baisse exprès ---------- */
leonMarques=function(){
  const g=document.getElementById('pg9');if(!g||!S)return;const w=UI.plan.w;
  g.querySelectorAll('.shift[data-sid]').forEach(el=>{const x=S.shifts.find(y=>y.id===el.dataset.sid);if(!x||!x.leon||el.classList.contains('by-leon'))return;
    el.classList.add('by-leon');el.dataset.tip=(el.title?el.title+'\n':'')+'✦ Proposé par Léon'+(x.lw?' : '+x.lw.charAt(0).toLowerCase()+x.lw.slice(1):'')+'.';el.removeAttribute('title');
    const td=el.closest('td');if(td)td.classList.add('cell-leon');});
  if(effRole()==='staff')return;
  const cib=(S.leonCib||{})[wkIso(w)]||{};
  Object.entries(cib).forEach(([emp,C])=>{const td=g.querySelector(`td[data-emp="${CSS.escape(emp)}"]`);const t=td&&td.parentElement.querySelector('td.ec .hrs .tnum');if(!t||t.querySelector('.leon-cib'))return;
    const e=empById(emp);if(!e)return;const fait=t.textContent.split('/')[0].trim();
    const pq=C.sp!=null?`${e.prenom} a déjà fait ${dur(C.sp)} d’heures sup ce mois-ci`:`${e.prenom} : ${C.r}`;
    const moins=e.contrat*60-C.c;
    t.innerHTML=`<span class="leon-cib" tabindex="0" data-tip="${esc(`✦ Léon a baissé ses heures exprès. ${pq} : il lui met ${dur(C.c)} cette semaine au lieu de ${e.contrat}h (${moins>0?'−'+dur(moins):'contrat'}), pour lisser sur le mois et éviter de payer trop d’heures sup.`)}">${esc(fait)}✦</span> / ${e.contrat}h`;});
};

/* ---------- démo : Le Petit Beffroi, des chiffres à la taille de l'équipe ---------- */
if(typeof seedDemo==='function'){
  const f0=seedDemo;
  seedDemo=function(){f0();try{v13DemoPlanning();}catch(e){console.error('v13 seed',e);}};
}
function v13DemoPlanning(){
  const B=NET.restos&&NET.restos.beffroi;if(!B)return;
  withCtx(B,()=>{
    // 10 personnes (4 en salle, 3 en cuisine, 1 au bar) : les couverts de la démo étaient trop gros pour cette équipe,
    // le planning avait forcément des trous. On garde à peu près le même CA (ticket moyen un peu plus haut), avec 20 % de couverts en moins.
    S.ticket={midi:24,soir:38};
    const fixe=t=>{t.n=Math.max(1,Math.round((t.n||1)*0.8));};
    Object.values(S.hist||{}).forEach(T=>(T||[]).forEach(fixe));(S.ventes||[]).forEach(fixe);
    if(!S.planCdc)S.planCdc={
      ouv:[0,1,2,3,4,5,6].map(d=>({midi:!isClosed(d),soir:!isClosed(d)&&d!==2})),
      h:{midi:['11:30','14:30'],soir:['18:30','23:00']},
      prepa:[{p:'cuisine',s:'09:30',e:'11:00',n:1,jours:[0,1,2,4,5,6]}],
      eff:{midi:{bar:{max:0}},soir:{bar:{max:1},salle:{max:3}}},
      note:'Le dimanche midi, 3 personnes suffisent'};
  });
}
