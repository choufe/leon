/* =========================================================
   V9 · PLANNING — données, règles HCR, compteurs, annuler
   ========================================================= */
Object.assign(ABS,{recup:'Récupération',evt:'Événement familial',absinj:'Absence injustifiée'});
const ABS_SHORT={cp:'CP',repos:'Repos',maladie:'Arrêt',indispo:'Indispo',formation:'Form.',recup:'Récup',evt:'Évén.',absinj:'Abs. inj.'};
const ABS_LETTER={cp:'CP',repos:'R',maladie:'AM',indispo:'I',formation:'F',recup:'RC',evt:'EF',absinj:'AI'};
const ABS_PAID=['cp','maladie','formation','evt','recup'];
META_KEYS.push('shiftTypes','tplWeek');

/* ---------- nouvelles données du resto ---------- */
{const f=blankResto;blankResto=function(id){const R=f(id);Object.assign(R,{openShifts:[],dayNotes:{},pubSnap:{},planNews:[],swaps:[],avail:{},paieVal:{},shiftTypes:null,tplWeek:null});return R;};}
{const D=DOCS.planning;DOCS.planning={p:D.p,
  out:R=>({...D.out(R),
    open:(R.openShifts||[]).map(({w,...x})=>({...x,wk:wkIso(w)})),
    notes:R.dayNotes||{},
    snap:Object.fromEntries(Object.keys(R.pubSnap||{}).filter(k=>R.pubSnap[k]).map(k=>[wkIso(k),R.pubSnap[k]])),
    news:(R.planNews||[]).slice(-80)}),
  in:(R,d)=>{D.in(R,d);R.openShifts=(d.open||[]).map(({wk,...x})=>({...x,w:wOf(wk)}));R.dayNotes=d.notes||{};R.pubSnap={};Object.keys(d.snap||{}).forEach(k=>{R.pubSnap[String(wOf(k))]=d.snap[k];});R.planNews=d.news||[];}};}
{const D=DOCS.equipe;DOCS.equipe={p:D.p,
  out:R=>({...D.out(R),swaps:R.swaps||[],avail:R.avail||{},paieVal:R.paieVal||{}}),
  in:(R,d)=>{D.in(R,d);R.swaps=d.swaps||[];R.avail=d.avail||{};R.paieVal=d.paieVal||{};}};}

/* ---------- petites aides ---------- */
const WK_MIN=-26,WK_MAX=26;
const monthKey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1);
const isoOf=(w,d)=>isoD(dateAt(w,d));
const visEmps=()=>EMP.filter(e=>!e.hidden);
const openAt=(w,d,poste)=>(S.openShifts||[]).filter(x=>x.w===w&&x.d===d&&(!poste||x.poste===poste)).sort((a,b)=>sMin(a)-sMin(b));
const empDayMin=(emp,w,d)=>sum(empShifts(emp,w,d),durMin);
function amplitudeOf(sh){return sh.length?Math.max(...sh.map(eMin))-Math.min(...sh.map(sMin)):0;}
function overlapMin(a0,a1,b0,b1){return Math.max(0,Math.min(a1,b1)-Math.max(a0,b0));}
function nightMin(x){const a=sMin(x),b=eMin(x);return overlapMin(a,b,0,420)+overlapMin(a,b,1320,1860)+overlapMin(a,b,2760,2880);}
function mealsOfDay(sh){let m=0;if(sh.some(x=>sMin(x)<840&&eMin(x)>690))m++;if(sh.some(x=>sMin(x)<1260&&eMin(x)>1110))m++;return m;}
const hsBrackets=min=>{const h=min/60;return {h10:clamp(h-35,0,4),h20:clamp(h-39,0,4),h50:Math.max(0,h-43)};};
const maxDayMin=e=>e&&e.poste==='cuisine'?660:690;

/* ---------- jours fériés (France métropolitaine) ---------- */
const FERIES={};
function easterOf(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da);}
function feriesOf(y){
  if(FERIES[y])return FERIES[y];
  const E=easterOf(y);const o={};
  [[0,1,'Jour de l’an'],[4,1,'Fête du Travail'],[4,8,'Victoire 1945'],[6,14,'Fête nationale'],[7,15,'Assomption'],[10,1,'Toussaint'],[10,11,'Armistice'],[11,25,'Noël']].forEach(([m,d,n])=>o[isoD(new Date(y,m,d))]=n);
  o[isoD(addDays(E,1))]='Lundi de Pâques';o[isoD(addDays(E,39))]='Ascension';o[isoD(addDays(E,50))]='Lundi de Pentecôte';
  return FERIES[y]=o;
}
const ferieOf=iso=>feriesOf(+iso.slice(0,4))[iso]||'';

/* ---------- types de shifts (un clic = un shift, ou une coupure) ---------- */
const ST_DEF={
 manager:[['Ouverture',[['10:00','15:00',0]]],['Fermeture',[['18:00','23:30',0]]],['Coupure',[['10:00','15:00',0],['18:00','23:30',0]]]],
 salle:[['Midi',[['11:00','15:00',0]]],['Soir',[['18:30','23:30',0]]],['Coupure',[['11:00','15:00',0],['18:30','23:30',0]]]],
 cuisine:[['Matin',[['09:30','14:30',0]]],['Soir',[['18:00','22:30',0]]],['Coupure',[['09:30','14:30',0],['18:00','22:30',0]]]],
 bar:[['Midi',[['11:00','15:30',0]]],['Soir',[['17:30','00:00',20]]],['Coupure',[['11:00','15:00',0],['18:30','00:00',0]]]],
 plonge:[['Midi',[['11:30','15:30',0]]],['Soir',[['19:30','23:30',0]]],['Coupure',[['11:30','15:30',0],['19:30','23:30',0]]]],
 coiffeur:[['Matin',[['09:30','13:00',0]]],['Après-midi',[['13:00','19:00',0]]],['Journée',[['09:30','19:00',60]]]],
};
function defaultTypes(){
  const postes=[...new Set(EMP.map(e=>e.poste))];const use=postes.length?POSTE_ORDER.filter(p=>postes.includes(p)):['salle','cuisine'];
  const out=[];use.forEach(p=>(ST_DEF[p]||[]).forEach(([l,seg],i)=>out.push({id:'st_'+p+i,l,poste:p,seg:seg.map(([s,e,pz])=>({s,e,p:pz}))})));
  return out;
}
const shiftTypes=()=>(S&&S.shiftTypes&&S.shiftTypes.length?S.shiftTypes:defaultTypes());
function typesFor(poste){const T=shiftTypes();return [...T.filter(t=>t.poste===poste),...T.filter(t=>t.poste!==poste)];}
const typeMin=t=>sum(t.seg,g=>durMin(g));
const segTxt=g=>g.s+'–'+g.e+(g.p?' ('+g.p+'′)':'');

/* ---------- saisie « à la Excel » : 11-15, 9h30-14h30 18h-22h30, soir, cp… ---------- */
function tm(h,m){h=+h;m=m==null||m===''?0:+m;if(isNaN(h)||isNaN(m)||h>30||m>59)return null;return pad(h%24)+':'+pad(m);}
const ABS_WORDS=[[/^(cp|cong[eé]s?( pay[eé]s?)?|vacances?|vac)$/,'cp'],[/^(r|repos|off|ferm[eé])$/,'repos'],[/^(am|mal|malade|maladie|arr[eê]t( maladie)?)$/,'maladie'],[/^(i|ind|indispo(nible)?)$/,'indispo'],[/^(f|form|formation)$/,'formation'],[/^(rc|r[eé]cup([eé]ration)?)$/,'recup'],[/^(ai|abs|absent|absence( injustifi[eé]e)?)$/,'absinj'],[/^(ef|[eé]v[eé]nement( familial)?|mariage|d[eé]c[eè]s|naissance)$/,'evt']];
function parseCell(raw,poste){
  let s=String(raw||'').trim().toLowerCase();
  let append=false;if(s[0]==='+'){append=true;s=s.slice(1).trim();}
  if(!s)return null;
  const R=parseCell0(s,poste);if(R&&append&&(R.kind==='shifts'||R.kind==='type'))R.append=true;
  return R;
}
function parseCell0(s,poste){
  if(/^(x|suppr|supprimer|efface|effacer|vide|vider|del)$/.test(s))return {kind:'clear',label:'Vider la case'};
  for(const [re,t] of ABS_WORDS)if(re.test(s))return {kind:'abs',type:t,label:ABS[t]};
  const T=typesFor(poste||'salle');
  const ty=T.find(t=>t.l.toLowerCase()===s&&(!poste||t.poste===poste))||T.find(t=>t.l.toLowerCase()===s)||(s.length>=2?T.find(t=>t.l.toLowerCase().startsWith(s)):null);
  if(ty)return {kind:'type',t:ty,label:ty.l+' · '+ty.seg.map(segTxt).join(' + ')};
  const src=s.replace(/\s+(et|puis)\s+/g,' , ');
  const re=/(\d{1,2})(?:\s*[h:.]\s*(\d{2})?)?\s*(?:-|–|—|à|a|>|→|\/)\s*(\d{1,2})(?:\s*[h:.]\s*(\d{2})?)?(?:\s*(?:p|pause)\s*(\d{1,3})(?:\s*(?:min|m|′))?)?/g;
  const segs=[];let m;
  while((m=re.exec(src))){const a=tm(m[1],m[2]),b=tm(m[3],m[4]);if(!a||!b||a===b)return {kind:'bad',label:'Heures incomplètes'};segs.push({s:a,e:b,p:m[5]?clamp(+m[5],0,120):0});}
  if(!segs.length)return {kind:'bad',label:'Je n’ai pas compris : essaie « 11-15 » ou « cp »'};
  segs.forEach(g=>{if(!g.p&&durMin(g)>360){g.p=20;g.auto=true;}});
  return {kind:'shifts',segs,label:segs.map(segTxt).join(' + ')+' · '+dur(sum(segs,durMin))};
}

/* ---------- disponibilités déclarées par le salarié ---------- */
const AVAIL_L={midi:'midi',soir:'soir',jour:'la journée'};
function availOf(emp,d){const a=S.avail&&S.avail[emp];return a&&a.days?a.days[String(d)]||null:null;}
function availClash(x){
  const a=availOf(x.emp,x.d);if(!a)return null;
  const s=sMin(x),e=eMin(x);
  if(a==='jour')return a;
  if(a==='midi'&&s<960)return a;
  if(a==='soir'&&e>1050)return a;
  return null;
}

/* ---------- vérifications : Code du travail + HCR ---------- */
function planAlerts(w){
  const A=[];const wk=String(w);
  EMP.forEach(e=>{
    const m=empWeekMin(e.id,w);const abs=S.absences.filter(a=>a.emp===e.id&&a.w===w);
    if(!m&&!abs.length)return;
    const c=e.contrat*60;
    const credit=abs.filter(a=>ABS_PAID.includes(a.type)).length*c/5;
    if(e.contrat>=35&&m>c+30){const b=hsBrackets(m);A.push({tone:'warn',k:'heuresSup',emp:e.id,t:`${e.prenom} : ${dur(m)} planifiées pour ${e.contrat} h au contrat`,s:`${dur(m-c)} au-delà du contrat.${b.h20||b.h50?` Dont ${b.h20?nf(b.h20,1)+' h à +20 %':''}${b.h20&&b.h50?' et ':''}${b.h50?nf(b.h50,1)+' h à +50 %':''}.`:''}`});}
    if(e.contrat<35&&m>c){const lim=c/10;A.push({tone:m-c>lim?'bad':'warn',k:'complementaires',emp:e.id,t:`${e.prenom} (temps partiel ${e.contrat} h) : ${dur(m-c)} complémentaires`,s:m-c>lim?`Au-delà du 1/10e autorisé (${dur(lim)}). Enlève un service ou fais un avenant.`:'Dans la limite du 1/10e du contrat.'});}
    if(m>2880)A.push({tone:'bad',k:'hebdo',emp:e.id,t:`${e.prenom} : ${dur(m)} sur la semaine`,s:'Au-delà de 48 h, le maximum absolu sur une semaine.'});
    else if(m>2760)A.push({tone:'warn',k:'hebdo',emp:e.id,t:`${e.prenom} : ${dur(m)} sur la semaine`,s:'Plus de 46 h : la moyenne sur 12 semaines ne doit pas dépasser 46 h.'});
    if(m+credit<c-60&&m>0)A.push({tone:'info',k:'sous',emp:e.id,t:`${e.prenom} : ${dur(m+credit)} planifiées`,s:`Il manque ${dur(c-m-credit)} pour atteindre son contrat de ${e.contrat} h.`});
    let worked=0;
    for(let d=0;d<7;d++){
      const sh=empShifts(e.id,w,d);const ab=absOf(e.id,w,d);
      if(sh.length)worked++;
      if(!sh.length)continue;
      if(ab&&ab.type!=='repos')A.push({tone:'bad',k:'absShift',emp:e.id,d,t:`${e.prenom} : shift le ${JOURS[d].toLowerCase()} alors qu’il est en ${ABS[ab.type].toLowerCase()}`,s:'Retire le shift ou l’absence.'});
      const tot=sum(sh,durMin);const mx=maxDayMin(e);
      if(tot>mx)A.push({tone:'bad',k:'maxJour',emp:e.id,d,t:`${e.prenom} : ${dur(tot)} de travail le ${JOURS[d].toLowerCase()}`,s:`Au-delà de ${dur(mx)} de travail sur la journée${e.poste==='cuisine'?' (cuisinier)':''}.`});
      const amp=amplitudeOf(sh);if(amp>780)A.push({tone:'warn',k:'amplitude',emp:e.id,d,t:`${e.prenom} : amplitude de ${dur(amp)} le ${JOURS[d].toLowerCase()}`,s:`De ${hhmm(Math.min(...sh.map(sMin)))} à ${hhmm(Math.max(...sh.map(eMin)))} : au-delà de 13 h, le repos de 11 h n’est plus possible.`});
      for(let i=1;i<sh.length;i++)if(sMin(sh[i])<eMin(sh[i-1]))A.push({tone:'bad',k:'chevauche',emp:e.id,d,t:`${e.prenom} : deux shifts se chevauchent le ${JOURS[d].toLowerCase()}`,s:`${sh[i-1].s}–${sh[i-1].e} et ${sh[i].s}–${sh[i].e}.`});
      sh.forEach(x=>{if(durMin(x)+(x.p||0)>360&&!x.p)A.push({tone:'warn',k:'pause',emp:e.id,d,t:`${e.prenom} : ${x.s}–${x.e} sans pause (${JOURS[d].toLowerCase()})`,s:'Plus de 6 h d’affilée : 20 min de pause obligatoires.'});
        const cl=availClash(x);if(cl)A.push({tone:'warn',k:'dispo',emp:e.id,d,t:`${e.prenom} n’est pas dispo le ${JOURS[d].toLowerCase()} ${AVAIL_L[cl]}`,s:`Il l’a indiqué dans ses disponibilités${(S.avail[e.id]||{}).note?' : « '+(S.avail[e.id]||{}).note+' »':''}.`});});
      let pw=w,pd=d-1;if(pd<0){pd=6;pw=w-1;}
      const prev=empShifts(e.id,pw,pd);
      if(prev.length){const lastEnd=Math.max(...prev.map(eMin));const rest=(1440-lastEnd)+sMin(sh[0]);
        if(rest<660)A.push({tone:'bad',k:'repos',emp:e.id,d,t:`${e.prenom} : ${dur(Math.max(0,rest))} de repos entre ${JOURS[pd].toLowerCase()} et ${JOURS[d].toLowerCase()}`,s:`Fin à ${hhmm(lastEnd)}, reprise à ${sh[0].s}. Il faut 11 h de repos d’affilée.`});}
    }
    const openDays=[0,1,2,3,4,5,6].filter(d=>!isClosed(d)).length;
    if(worked>=7)A.push({tone:'bad',k:'reposHebdo',emp:e.id,t:`${e.prenom} travaille 7 jours sur 7`,s:'Il faut au moins un jour de repos complet par semaine.'});
    else if(worked>5&&openDays>5)A.push({tone:'warn',k:'reposHebdo',emp:e.id,t:`${e.prenom} : ${worked} jours travaillés`,s:'En HCR, on prévoit 2 jours de repos par semaine.'});
  });
  for(let d=0;d<7;d++){
    if(!shiftsWD(w,d).length)continue;
    coverage(w,d).forEach(cv=>{cv.miss.forEach(k=>{const lab={salle:'en salle',cuisine:'en cuisine',bar:'au bar'}[k];A.push({tone:'warn',k:'couverture',d,t:`${JOURS[d]} ${cv.svc} : ${cv.have[k]} personne${cv.have[k]>1?'s':''} ${lab} pour ${cv.cv} couverts`,s:`Il en faudrait ${cv.need[k]} au coup de feu.`});});});
  }
  const op=(S.openShifts||[]).filter(x=>x.w===w);
  if(op.length)A.push({tone:'info',k:'ouvert',t:`${plur(op.length,'shift à pourvoir','shifts à pourvoir')}`,s:'L’équipe les voit dans son planning et peut se proposer.'});
  const order={bad:0,warn:1,info:2};
  return A.sort((a,b)=>order[a.tone]-order[b.tone]);
}
Object.assign(INFO,{
 hebdo:{t:'Durée maximale par semaine',d:'Jamais plus de 48 h sur une semaine, et pas plus de 46 h en moyenne sur 12 semaines d’affilée.'},
 maxJour:{t:'Durée maximale par jour',d:'En HCR : 11 h pour les cuisiniers, 11 h 30 pour le reste du personnel (12 h pour le veilleur de nuit).'},
 amplitude:{t:'Amplitude de la journée',d:'Le temps entre le début du premier service et la fin du dernier, coupure comprise.',r:'Au-delà de 13 h, les 11 h de repos quotidien ne tiennent plus.'},
 reposHebdo:{t:'Repos hebdomadaire',d:'Au moins 24 h de repos d’affilée par semaine, en plus des 11 h de repos quotidien.',r:'En HCR, les établissements permanents donnent 2 jours de repos par semaine.'},
 chevauche:{t:'Shifts qui se chevauchent',d:'Un salarié ne peut pas être à deux endroits en même temps : un des deux shifts est sûrement une erreur.'},
 absShift:{t:'Shift pendant une absence',d:'Le salarié est en congé, en arrêt ou en formation ce jour-là.'},
 dispo:{t:'Disponibilités',d:'Chaque salarié peut indiquer les créneaux où il ne peut pas travailler (cours, garde d’enfant…). Léon te prévient si tu le plannifies quand même.'},
 ouvert:{t:'Shifts à pourvoir',d:'Un shift sans personne dessus. L’équipe le voit et peut se proposer ; tu valides.'},
 cp:{t:'Compteur de congés payés',d:'2,5 jours ouvrables acquis par mois travaillé, soit 30 jours (5 semaines) par an.',f:'Solde = solde de départ + 2,5 × mois écoulés − jours posés',r:'Les jours ouvrables vont du lundi au samedi, hors jours fériés. Renseigne le solde de départ dans la fiche du salarié.'},
 repas:{t:'Repas (avantage en nature)',d:'En HCR, le salarié présent au moment d’un repas est nourri, ou touche une indemnité compensatrice.',r:'Léon compte 1 repas par service couvert (déjeuner 11 h 30–14 h, dîner 18 h 30–21 h), 2 au maximum par jour.'},
 nuit:{t:'Heures de nuit',d:'Les heures travaillées entre 22 h et 7 h.',r:'La définition exacte et la majoration dépendent de ton accord : vérifie avec ton comptable.'},
 paieExport:{t:'Variables de paie',d:'Léon prépare les éléments variables du mois ; ton comptable ou ton logiciel de paie fait la fiche de paie.',list:['Heures : pointées quand il y a un pointage, sinon planifiées','Heures sup comptées par semaine (lundi → dimanche), rattachées au mois où la semaine se termine','Absences en jours, repas, heures de nuit, dimanches et fériés'],r:'Ce sont des estimations à contrôler avant envoi.'},
 autoFill:{t:'Léon remplit la semaine',d:'Léon part de ta semaine type s’il y en a une, puis place l’équipe là où il manque du monde pour les couverts prévus.',list:['Respecte les absences et les disponibilités','Ne dépasse pas le contrat de chacun','Garde 2 jours de repos et 11 h entre deux journées','Ne touche pas aux shifts déjà posés'],r:'Tout arrive en brouillon : tu corriges puis tu publies.'},
});

/* ---------- publication : photo de la semaine et changements ---------- */
const shKey=x=>[x.emp,x.d,x.s,x.e,x.p||0,x.poste].join('|');
function weekKeys(w){return [...S.shifts.filter(x=>x.w===w).map(shKey),...S.absences.filter(a=>a.w===w).map(a=>['A',a.emp,a.d,a.type].join('|'))].sort();}
function pubDiff(w){
  const k=String(w);const sn=S.pubSnap&&S.pubSnap[k];
  if(!S.published[k]||!sn||!sn.list)return null;
  const cur=weekKeys(w);const A=new Set(sn.list),B=new Set(cur);
  const added=cur.filter(x=>!A.has(x)),removed=sn.list.filter(x=>!B.has(x));
  const who=x=>x[0]==='A'?x.split('|')[1]:x.split('|')[0];const day=x=>x[0]==='A'?x.split('|')[2]:x.split('|')[1];
  const emps=[...new Set([...added,...removed].map(who))];
  const n=new Set([...added,...removed].map(x=>who(x)+'|'+day(x))).size;
  return {added,removed,n,emps,addedSet:new Set(added)};
}
function diffText(emp,df){
  const f=x=>{const p=x.split('|');if(p[0]==='A')return {d:+p[2],t:ABS[p[3]]};return {d:+p[1],t:p[2]+'–'+p[3]};};
  const add=df.added.filter(x=>(x[0]==='A'?x.split('|')[1]:x.split('|')[0])===emp).map(f);
  const rem=df.removed.filter(x=>(x[0]==='A'?x.split('|')[1]:x.split('|')[0])===emp).map(f);
  const days=[...new Set([...add,...rem].map(x=>x.d))].sort();
  return days.map(d=>{const a=add.filter(x=>x.d===d).map(x=>x.t),r=rem.filter(x=>x.d===d).map(x=>x.t);return `${JC[d]} : ${r.length?r.join(', '):'—'} → ${a.length?a.join(', '):'repos'}`;}).join(' · ');
}
function snapWeek(w){S.pubSnap=S.pubSnap||{};S.pubSnap[String(w)]={at:Date.now(),by:me().prenom,list:weekKeys(w)};}
function pushNews(emp,w,txt){S.planNews=S.planNews||[];S.planNews.push({id:uid('nw'),at:Date.now(),w:wkIso(w),emp,txt});if(S.planNews.length>80)S.planNews=S.planNews.slice(-80);}

/* ---------- compteurs de congés payés ---------- */
function cpInfo(e){
  if(!e||!e.cp||e.cp.solde==null||!e.cp.au)return null;
  const au=pdate(e.cp.au);if(isNaN(au))return null;
  const months=Math.max(0,(TODAY.getFullYear()-au.getFullYear())*12+(TODAY.getMonth()-au.getMonth())-(TODAY.getDate()<au.getDate()?1:0));
  const acquis=months*2.5;
  let pris=0,poses=0;
  S.absences.filter(a=>a.emp===e.id&&a.type==='cp').forEach(a=>{
    const dt=dateAt(a.w,a.d);if(dt<au)return;if(a.d===6)return;if(ferieOf(isoD(dt)))return;
    if(dt<=TODAY)pris++;else poses++;
  });
  const solde=(+e.cp.solde||0)+acquis-pris;
  return {depart:+e.cp.solde||0,au:e.cp.au,acquis,pris,poses,solde,apres:solde-poses};
}

/* ---------- demandes en attente (congés, échanges, shifts à pourvoir) ---------- */
function pendingCount(){return (S.requests||[]).filter(r=>r.status==='pending').length+(S.swaps||[]).filter(r=>r.status==='pending').length;}
function upcomingAbs(days){
  const out=[];const lim=addDays(TODAY,days);
  S.absences.forEach(a=>{const dt=dateAt(a.w,a.d);if(dt>=TODAY&&dt<=lim&&a.type!=='repos')out.push(a);});
  return out;
}

/* ---------- annuler / rétablir (Ctrl+Z / Ctrl+Maj+Z) ---------- */
const PH={};
function phOf(){const k=S?S.id:'_';return PH[k]||(PH[k]={u:[],r:[]});}
function planState(){return JSON.stringify({sh:S.shifts,ab:S.absences,op:S.openShifts||[],no:S.dayNotes||{}});}
function planRestore(js){const o=JSON.parse(js);S.shifts=o.sh;S.absences=o.ab;S.openShifts=o.op;S.dayNotes=o.no;}
function planDo(label,fn,o={}){
  const before=planState();
  const r=fn();
  if(r===false)return false;
  if(planState()===before){if(o.same)toast(o.same,'alert');return false;}
  const h=phOf();h.u.push({label,js:before});if(h.u.length>80)h.u.shift();h.r=[];
  save();planRender();
  if(!o.quiet)toastUndo(o.msg||label,o.ic||'check');
  return true;
}
function planUndo(){const h=phOf();const x=h.u.pop();if(!x){toast('Rien à annuler','alert');return;}h.r.push({label:x.label,js:planState()});planRestore(x.js);save();planRender();toast('Annulé · '+x.label,'undo');}
function planRedo(){const h=phOf();const x=h.r.pop();if(!x){toast('Rien à rétablir','alert');return;}h.u.push({label:x.label,js:planState()});planRestore(x.js);save();planRender();toast('Rétabli · '+x.label,'redo');}
function toastUndo(msg,icn){
  const box=$('#toasts');while(box.children.length>=2)box.firstElementChild.remove();
  const t=document.createElement('div');t.className='toast has-act';t.innerHTML=ic(icn)+`<span>${msg}</span><button class="t-act" data-act="pl-undo">Annuler</button>`;
  box.appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';},4600);setTimeout(()=>t.remove(),5000);
}

/* ---------- écrire dans une case ---------- */
function cellClear(emp,w,d){S.shifts=S.shifts.filter(x=>!(x.emp===emp&&x.w===w&&x.d===d));S.absences=S.absences.filter(a=>!(a.emp===emp&&a.w===w&&a.d===d));}
function cellApply(emp,w,d,P,{append=false}={}){
  if(isClosed(d)||!P)return 0;
  const e=empById(emp);
  if(P.kind==='clear'){cellClear(emp,w,d);return 1;}
  if(P.kind==='abs'){cellClear(emp,w,d);S.absences.push({id:uid('ab'),emp,w,d,type:P.type,note:P.note||''});return 1;}
  const segs=P.kind==='type'?P.t.seg.map(g=>({...g})):P.kind==='shifts'?P.segs:P.kind==='paste'?P.items:[];
  if(!segs.length)return 0;
  if(!append)S.shifts=S.shifts.filter(x=>!(x.emp===emp&&x.w===w&&x.d===d));
  S.absences=S.absences.filter(a=>!(a.emp===emp&&a.w===w&&a.d===d));
  const poste=P.kind==='type'&&P.t.poste&&(P.t.poste===e.poste||(e.skills||[]).includes(P.t.poste))?P.t.poste:e.poste;
  segs.forEach(g=>{let p=g.p||0;if(!p&&durMin(g)>360)p=20;S.shifts.push({id:uid('s'),emp,w,d,s:g.s,e:g.e,p,poste:g.poste&&P.kind==='paste'?g.poste:poste});});
  return 1;
}
function cellContent(emp,w,d){
  const ab=absOf(emp,w,d);if(ab)return {kind:'abs',type:ab.type,note:ab.note};
  const sh=empShifts(emp,w,d);if(sh.length)return {kind:'paste',items:sh.map(x=>({s:x.s,e:x.e,p:x.p||0,poste:x.poste}))};
  return {kind:'clear'};
}

/* ---------- semaine type ---------- */
function weekToTpl(w){return S.shifts.filter(x=>x.w===w).map(x=>({emp:x.emp,d:x.d,s:x.s,e:x.e,p:x.p||0,poste:x.poste}));}

/* ---------- Léon remplit la semaine ---------- */
const SVC_WIN={midi:[690,840],soir:[1140,1290]};
function autoFill(w){
  const days=[0,1,2,3,4,5,6].filter(d=>!isClosed(d)&&dateAt(w,d)>=TODAY);
  const emps=visEmps();
  const add=[];const log=[];
  const shOf=(emp,d)=>[...empShifts(emp,w,d),...add.filter(x=>x.emp===emp&&x.d===d)].sort((a,b)=>sMin(a)-sMin(b));
  const weekMin=emp=>empWeekMin(emp,w)+sum(add.filter(x=>x.emp===emp),durMin);
  const workDays=emp=>days.filter(d=>shOf(emp,d).length).length;
  const blocked=(emp,d)=>!!absOf(emp,w,d);
  const fits=(e,d,seg)=>{
    if(blocked(e.id,d))return false;
    const x={emp:e.id,d,...seg};if(availClash(x))return false;
    const cur=shOf(e.id,d);
    if(cur.some(o=>sMin(o)<eMin(x)&&eMin(o)>sMin(x)))return false;
    const dayTot=sum(cur,durMin)+durMin(x);if(dayTot>maxDayMin(e))return false;
    const all=[...cur,x];if(amplitudeOf(all)>780)return false;
    if(!cur.length&&workDays(e.id)>=5)return false;
    if(weekMin(e.id)+durMin(x)>e.contrat*60+30)return false;
    let pd=d-1,pw=w;if(pd<0){pd=6;pw=w-1;}
    const prev=pw===w?shOf(e.id,pd):empShifts(e.id,pw,pd);
    if(prev.length&&(1440-Math.max(...prev.map(eMin)))+Math.min(...all.map(sMin))<660)return false;
    let nd=d+1;if(nd<=6){const nx=shOf(e.id,nd);if(nx.length&&(1440-Math.max(...all.map(eMin)))+Math.min(...nx.map(sMin))<660)return false;}
    return true;
  };
  const push=(e,d,seg,poste,why)=>{const x={id:uid('s'),emp:e.id,w,d,s:seg.s,e:seg.e,p:seg.p||(durMin(seg)>360?20:0),poste};add.push(x);return x;};
  /* 1. la semaine type, là où la case est vide */
  if(S.tplWeek&&S.tplWeek.length){
    S.tplWeek.forEach(t=>{const e=EMP.find(o=>o.id===t.emp);if(!e||e.hidden||!days.includes(t.d))return;if(empShifts(e.id,w,t.d).length&&!add.some(a=>a.emp===e.id&&a.d===t.d))return;if(fits(e,t.d,t))push(e,t.d,t,t.poste||e.poste,'tpl');});
  }
  /* 2. le besoin des services selon les couverts prévus */
  const pick=(svc,poste)=>{const T=typesFor(poste).filter(t=>t.poste===poste&&t.seg.length===1);const [a,b]=SVC_WIN[svc];return T.find(t=>overlapMin(sMin(t.seg[0]),eMin(t.seg[0]),a,b)>60)||null;};
  const covHave=(d,svc,ps)=>{const [a,b]=SVC_WIN[svc];const on=[...shiftsWD(w,d),...add.filter(x=>x.d===d)].filter(x=>sMin(x)<b&&eMin(x)>a&&ps.includes(x.poste));return new Set(on.map(x=>x.emp)).size;};
  days.forEach(d=>{
    const c=prevOf(d);
    ['midi','soir'].forEach((svc,i)=>{
      const cv=c[i];if(!cv)return;
      const need={salle:Math.max(1,Math.ceil(cv/50)),cuisine:Math.max(1,Math.ceil(cv/55)),bar:cv>=80?1:0};
      const grp={salle:['salle','manager'],cuisine:['cuisine'],bar:['bar']};
      Object.keys(need).forEach(k=>{
        let have=covHave(d,svc,grp[k]);
        const pool=emps.filter(e=>grp[k].includes(e.poste)||(e.skills||[]).includes(k));
        if(!pool.length)return;
        let guard=0;
        while(have<need[k]&&guard++<8){
          const cands=pool.filter(e=>{const ty=pick(svc,grp[k].includes(e.poste)?e.poste:k);return ty&&fits(e,d,ty.seg[0]);})
            .sort((a,b)=>(weekMin(a.id)/(a.contrat*60))-(weekMin(b.id)/(b.contrat*60))||(shOf(a.id,d).length-shOf(b.id,d).length));
          const e=cands[0];
          if(!e){const ty=pick(svc,k);log.push({d,svc,k,miss:need[k]-have,seg:ty?ty.seg[0]:null});break;}
          const po=grp[k].includes(e.poste)?e.poste:k;const ty=pick(svc,po);
          push(e,d,ty.seg[0],po,'need');have=covHave(d,svc,grp[k]);
        }
      });
    });
  });
  /* 3. compléter les contrats trop bas (mise en place, renfort) */
  emps.forEach(e=>{
    let guard=0;
    const credit=S.absences.filter(a=>a.emp===e.id&&a.w===w&&ABS_PAID.includes(a.type)).length*e.contrat*12;
    while(weekMin(e.id)+credit<e.contrat*60-150&&guard++<6){
      let done=false;
      for(const d of days.slice().sort((a,b)=>sum(prevOf(b))-sum(prevOf(a)))){
        const T=typesFor(e.poste).filter(t=>t.poste===e.poste&&t.seg.length===1);
        for(const t of T){if(fits(e,d,t.seg[0])){push(e,d,t.seg[0],e.poste,'contrat');done=true;break;}}
        if(done)break;
      }
      if(!done)break;
    }
  });
  const cost=sum(add,x=>durMin(x)/60*(empById(x.emp).taux||0));
  return {add,log,min:sum(add,durMin),cost,days};
}
