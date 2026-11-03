/* =========================================================
   V12 · LÉON APPREND LE RESTO
   Au départ : une règle de base (≈ 1 serveur / 50 couverts, 1 cuisinier / 55, un barman au-delà de 80).
   Ensuite, chaque semaine publiée lui apprend comment CE resto tourne : combien de couverts par personne,
   et le minimum que le patron met toujours (ex. jamais moins de 2 en cuisine le soir).
   Ce n'est pas une règle figée : c'est une moyenne qui bouge doucement, et qui suit les couverts.
   Le patron peut dire en un clic si une semaine était bien planifiée (ou s'il manquait / il y avait trop de monde).
   ========================================================= */
{const D=DOCS.planning;DOCS.planning={p:D.p,out:R=>({...D.out(R),semAvis:R.semAvis||{}}),in:(R,d)=>{D.in(R,d);R.semAvis=d.semAvis||{};}};}
const AP_BASE={salle:50,cuisine:55,bar:80};
const AP_GRP={salle:['salle','manager'],cuisine:['cuisine'],bar:['bar']};
let AP_CACHE=null,AP_SIG='';

function leonAppris(){
  if(!S)return null;
  const sig=JSON.stringify([Object.keys(S.published||{}).length,S.shifts.length,S.semAvis||{}]);
  if(AP_CACHE&&AP_SIG===sig)return AP_CACHE;
  const out={};const semaines=[];
  for(let w=-1;w>=-10;w--)if(S.published&&S.published[String(w)]&&S.shifts.some(x=>x.w===w))semaines.push(w);
  Object.keys(AP_GRP).forEach(k=>{
    const ech={midi:[],soir:[]};
    semaines.forEach(w=>{
      const av=(S.semAvis||{})[wkIso(w)];const f=av==='manque'?0.85:av==='trop'?1.15:1;const poids=av==='bien'?2:1;
      for(let d=0;d<7;d++){if(isClosed(d))continue;let c;try{c=rmCouverts(w,d).c;}catch(_){c=prevOf(d);}
        ['midi','soir'].forEach((svc,i)=>{const cv=c[i];if(!cv)return;const [a,b]=SVC_WIN[svc];
          const n=new Set(shiftsWD(w,d).filter(x=>sMin(x)<b&&eMin(x)>a&&AP_GRP[k].includes(x.poste)).map(x=>x.emp)).size;
          for(let p=0;p<poids;p++)ech[svc].push({cv,n,f});});}
    });
    out[k]={};
    ['midi','soir'].forEach(svc=>{
      const E=ech[svc];const avec=E.filter(x=>x.n>0);
      // couverts par personne : moyenne lissée avec la règle de base (6 services « fictifs »), donc ça bouge doucement
      const K=12;const r=(AP_BASE[k]*K+sum(avec,x=>x.cv/x.n*x.f))/(K+avec.length);
      // minimum que le patron met toujours (dans 80 % des services ou plus)
      let min=k==='bar'?0:1;
      if(E.length>=6){const ns=E.map(x=>x.n).sort((u,v)=>u-v);min=Math.max(k==='bar'?0:1,ns[Math.floor(ns.length*0.2)]);}
      const presence=E.length?avec.length/E.length:null;
      // à partir de combien de couverts le patron met quelqu'un (utile pour le bar : pas tous les services)
      const cvs=E.map(x=>x.cv).sort((u,v)=>u-v);const seuil=presence!=null&&cvs.length?cvs[Math.min(cvs.length-1,Math.floor((1-presence)*cvs.length))]:0;
      out[k][svc]={r,min,n:E.length,presence,seuil};
    });
  });
  out.semaines=semaines.length;
  AP_CACHE=out;AP_SIG=sig;return out;
}
/* combien il faut de monde pour ce service, dans CE resto */
function leonBesoin(cv,svc,ev){
  const A=leonAppris();const need={};
  Object.keys(AP_GRP).forEach(k=>{
    const L=A&&A[k]&&A[k][svc];
    if(!L||L.n<6){need[k]=k==='bar'?(cv>=80||(ev&&ev.l==='Match'&&svc==='soir')?1:0):Math.max(1,Math.ceil(cv/AP_BASE[k]));return;}
    let n=Math.round(cv/L.r+0.25);
    need[k]=Math.max(L.min,n);
    if(k==='bar'&&L.presence!=null&&L.presence<0.9&&cv<L.seuil&&!(ev&&ev.l==='Match'))need[k]=0;
    if(k==='bar'&&ev&&ev.l==='Match'&&svc==='soir')need[k]=Math.max(1,need[k]);
  });
  return need;
}
/* la couverture du planning utilise ce que Léon a appris (et les événements notés) */
coverage=function(w,d){
  if(isClosed(d))return [];
  if(!EMP.some(e=>['salle','cuisine','bar'].includes(e.poste)))return [];
  let c,ev;try{({c,ev}=rmCouverts(w,d));}catch(_){c=prevOf(d);}
  const out=[];const sh=shiftsWD(w,d);
  ['midi','soir'].forEach((svc,i)=>{
    const cv=c[i];if(!cv)return;const [a,b]=SVC[svc];
    // un shift à pourvoir compte : le besoin est posé et l'équipe est prévenue
    const on=[...sh,...(S.openShifts||[]).filter(o=>o.w===w&&o.d===d).map(o=>({...o,emp:'@'+o.id}))].filter(x=>sMin(x)<b&&eMin(x)>a);
    const cnt=ps=>new Set(on.filter(x=>ps.includes(x.poste)).map(x=>x.emp)).size;
    const need=leonBesoin(cv,svc,ev);
    if(!EMP.some(e=>e.poste==='bar'))need.bar=0;
    const have={salle:cnt(AP_GRP.salle),cuisine:cnt(AP_GRP.cuisine),bar:cnt(AP_GRP.bar)};
    out.push({svc,cv,need,have,miss:Object.keys(need).filter(k=>have[k]<need[k])});
  });
  return out;
};

/* ---------- « La semaine dernière, c'était bien planifié ? » (1 clic, facultatif) ---------- */
function apQuestionHTML(){
  if(!S||!CAN().editPlanning||effRole()==='staff'||UI.plan.w!==0)return '';
  const w=-1;const k=wkIso(w);if(!S.published||!S.published[String(w)]||(S.semAvis||{})[k])return '';
  if(!S.shifts.some(x=>x.w===w))return '';
  return `<div class="ap-q"><span class="ap-ic">${ic('spark','s')}</span><span class="ap-t">La semaine dernière, c’était bien planifié ? <span class="faint">Léon s’en sert pour apprendre ton resto.</span></span>
    <span class="ap-b"><button class="btn sm" data-act="ap-avis" data-v="bien">${ic('check','s')} Bien</button><button class="btn sm" data-act="ap-avis" data-v="manque">Il manquait du monde</button><button class="btn sm" data-act="ap-avis" data-v="trop">Trop de monde</button></span></div>`;
}
{const f=planBar;planBar=function(){return apQuestionHTML()+f.apply(this,arguments);};}
ACT['ap-avis']=function(t){
  S.semAvis={...(S.semAvis||{}),[wkIso(-1)]:t.dataset.v};save();AP_CACHE=null;renderView();
  toast(t.dataset.v==='bien'?'Noté : Léon garde ce rythme':t.dataset.v==='manque'?'Noté : Léon mettra un peu plus de monde':'Noté : Léon allègera un peu','check');
};

/* ---------- l'avis de Léon dit ce qu'il a appris (une ligne, seulement s'il a appris quelque chose) ---------- */
function apResume(){
  const A=leonAppris();if(!A||A.semaines<2)return '';
  const bits=[];const L={salle:'serveur',cuisine:'cuisinier'};
  ['salle','cuisine'].forEach(k=>{const m=A[k].midi,s=A[k].soir;if((m.n||0)+(s.n||0)<6)return;
    const r=Math.round(((m.r||0)*(m.n||0)+(s.r||0)*(s.n||0))/((m.n||0)+(s.n||0))/5)*5;
    bits.push(`1 ${L[k]} pour ~${r} couverts${Math.max(m.min,s.min)>1?`, jamais moins de ${Math.max(m.min,s.min)}`:''}`);});
  return bits.length?`Appris sur tes ${A.semaines} dernières semaines : ${bits.join(' · ')}.`:'';
}
{const f=avisFlow;avisFlow=function(w){
  f.apply(this,arguments);const t=apResume();if(!t)return;
  const p=document.querySelector('#modal-root .mh p');if(p)p.insertAdjacentHTML('afterend',`<p class="ap-appris">${ic('spark','s')} ${esc(t)}</p>`);
};}

/* ce que la règle de base trouve suffisant mais que tes habitudes demandent en plus : une simple info, pas une alerte */
{const f=planAlerts;planAlerts=function(w){return (f.apply(this,arguments)||[]).map(a=>{
  if(a.k!=='couverture'||a.d==null)return a;
  const cv=coverage(w,a.d).find(c=>a.t.includes(c.svc));if(!cv)return a;
  const k=Object.keys(AP_GRP).find(k=>a.t.includes({salle:'en salle',cuisine:'en cuisine',bar:'au bar'}[k]));if(!k)return a;
  const base=k==='bar'?(cv.cv>=80?1:0):Math.max(1,Math.ceil(cv.cv/AP_BASE[k]));
  return cv.have[k]>=base?{...a,tone:'info',s:`D’habitude, tu mets ${cv.need[k]} personnes pour autant de couverts. Ce n’est pas obligatoire.`}:a;
}).sort((x,y)=>({bad:0,warn:1,info:2}[x.tone]-{bad:0,warn:1,info:2}[y.tone]));};}
