/* =========================================================
   V8 · STATISTIQUES & INFOS IMPORTANTES
   - Statistiques : CA, tickets, marge, pertes, masse salariale,
     résultat estimé, produits stars / rentables, jour par jour.
   - Infos importantes : Léon analyse 30 jours et sort tout seul
     les problèmes qui reviennent (retards, CA en baisse, pertes…).
   - Réseau (créateur) : les mêmes infos pour tous les restos.
   ========================================================= */
const HIST_DAYS=63;
Object.assign(ICONS,{
 chart:'<path d="M3.5 20.5h17"/><rect x="5" y="11" width="3" height="6.5" rx=".8"/><rect x="10.5" y="5.5" width="3" height="12" rx=".8"/><rect x="16" y="13.5" width="3" height="4" rx=".8"/>',
 bulb:'<path d="M9.2 18h5.6M10.2 21h3.6"/><path d="M12 3a6 6 0 0 0-3.7 10.7c.8.7 1.2 1.4 1.2 2.3h5c0-.9.4-1.6 1.2-2.3A6 6 0 0 0 12 3z"/>',
 trendUp:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
 trendDown:'<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
 flag:'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
});

/* ---------- navigation : nouveaux onglets ---------- */
(function(){
  const ia=NAV.findIndex(n=>n.v==='accueil');
  NAV.splice(ia+1,0,{v:'infos',l:'Infos importantes',i:'bulb',r:['admin','patron'],mod:'infos'},{v:'stats',l:'Statistiques',i:'chart',r:['admin','patron'],mod:'stats'});
  const ih=NAV.findIndex(n=>n.v==='hub');
  NAV.splice(ih+1,0,{v:'infos-net',l:'Infos importantes',i:'bulb',r:['admin'],hub:true},{v:'stats-net',l:'Statistiques réseau',i:'chart',r:['admin'],hub:true});
})();
Object.assign(NAV_SHORT,{infos:'Infos',stats:'Stats','infos-net':'Infos','stats-net':'Stats'});
MODULES.push(['infos','Infos importantes'],['stats','Statistiques']);
META_KEYS.push('charges','seen','memos');
const HUB_VIEWS=['infos-net','stats-net'];
UI.st={p:'mois',date:null,sort:'q',all:false};
UI.ins={cat:'all',rid:'all',seen:false};

/* ---------- données : pertes, charges fixes, infos vues, messages ---------- */
function blankResto(id){const R=blankResto__v7(id);R.pertes=[];R.charges=null;R.seen={};R.memos=[];return R;}
{const D=DOCS.stock;DOCS.stock={p:D.p,out:R=>({...D.out(R),pertes:R.pertes||[]}),in:(R,d)=>{D.in(R,d);R.pertes=d.pertes||[];}};}

/* historique : 2 mois de ventes et de pointages (au lieu de 30 et 15 jours) */
function subVentesHist(rid,cb){
  const since=isoD(addDays(TODAY,-HIST_DAYS));
  if(STORE.mode==='db'){
    try{return STORE.db.collection(`restos/${rid}/ventes`).where('date','>=',since).onSnapshot(q=>cb(q.docs.map(d=>d.data())),e=>onStoreErr(e));}catch(e){onStoreErr(e);return ()=>{};}
  }
  setTimeout(()=>{const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(LS+`restos/${rid}/ventes/`)){const v=JSON.parse(localStorage.getItem(k));if(v&&v.date>=since)out.push(v);}}}catch(e){}cb(out);},0);
  return ()=>{};
}
function subPointages(rid,cb){
  const since=isoD(addDays(TODAY,-HIST_DAYS));
  if(STORE.mode==='db'){
    try{return STORE.db.collection(`restos/${rid}/pointages`).where('date','>=',since).onSnapshot(q=>cb(q.docs.filter(d=>!d.metadata||!d.metadata.hasPendingWrites).map(d=>d.data())),e=>onStoreErr(e));}catch(e){onStoreErr(e);return ()=>{};}
  }
  setTimeout(()=>{const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(LS+`restos/${rid}/pointages/`)){const v=JSON.parse(localStorage.getItem(k));if(v&&v.date>=since)out.push(v);}}}catch(e){}cb(out);},0);
  return ()=>{};
}
/* l'historique des ventes n'était plus abonné depuis la V4 : on le rebranche */
function mountFull(id){
  mountFull__v7(id);
  if(STORE.mode==='demo')return;
  if(SUBS[id]&&!SUBS[id].hist){
    SUBS[id].hist=subVentesHist(id,list=>{const R2=NET.restos[id];if(!R2)return;R2.hist={};list.forEach(x=>{if(x&&x.date&&x.date!==TODAY_ISO)R2.hist[x.date]=x.tickets||[];});R2._loaded.hist=true;scheduleRender();});
  }
}

/* ---------- petites aides ---------- */
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
const isoRange=(a,b)=>{const out=[];let d=pdate(a);const e=pdate(b);let g=0;while(d<=e&&g++<400){out.push(isoD(d));d=addDays(d,1);}return out;};
const dimOf=d=>new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
const histMin=()=>isoD(addDays(TODAY,-(HIST_DAYS-1)));
const daysBack=(k0,k1)=>isoRange(isoD(addDays(TODAY,-k1)),isoD(addDays(TODAY,-k0)));
const FRM=d=>d.getDate()+(d.getDate()===1?'er':'')+' '+MOIS[d.getMonth()];
const dayShort=iso=>{const d=pdate(iso);return JC[(d.getDay()+6)%7].toLowerCase()+'. '+d.getDate()+' '+MC[d.getMonth()];};
const pcs=(r,d=0)=>(r>0?'+':r<0?'−':'')+nf(Math.abs(r)*100,d)+' %';
const svcNames=()=>isSvcBiz()?['Matin','Après-midi']:['Midi','Soir'];
const svcCut=()=>isSvcBiz()?780:900;
const saleWord=(q)=>isSvcBiz()?(q>1?'prestations':'prestation'):(q>1?'ventes':'vente');
const prodWord=()=>isSvcBiz()?'prestation':'produit';

/* cache par affichage (vidé à chaque rendu) */
const V8={c:{}};
function v8Reset(){V8.c={};}
function memo(k,fn){const key=(S?S.id:'-')+'|'+k;if(!(key in V8.c))V8.c[key]=fn();return V8.c[key];}

/* ---------- une journée ---------- */
function dayTickets(iso){return iso===TODAY_ISO?(S.ventes||[]):((S.hist&&S.hist[iso])||[]);}
function unitCost(rid){return memo('uc:'+rid,()=>{const r=REC(rid);return r?metrics(r).cost:0;});}
function daySum(iso){
  return memo('d:'+iso,()=>{
    const s={iso,ht:0,ttc:0,cost:0,tk:0,items:0,by:{},svc:[0,0],mode:{sp:0,emp:0},hours:{},cats:{}};
    const cut=svcCut();
    dayTickets(iso).forEach(t=>{
      let tht=0;
      (t.lines||[]).forEach(l=>{
        const tva=(l.tva!=null?l.tva:10)/100;const ht=l.q*l.pu/(1+tva);const c=unitCost(l.rid)*l.q;
        tht+=ht;s.ttc+=l.q*l.pu;s.cost+=c;s.items+=l.q;
        const o=s.by[l.rid]||(s.by[l.rid]={rid:l.rid,n:l.n,q:0,ht:0,cost:0});o.q+=l.q;o.ht+=ht;o.cost+=c;
        const r=REC(l.rid);const ct=r?r.t:'autre';s.cats[ct]=(s.cats[ct]||0)+ht;
      });
      s.ht+=tht;s.tk+=t.n||1;
      s.svc[(t.at||0)<cut?0:1]+=tht;
      if(t.mode==='emp')s.mode.emp+=tht;else if(t.mode==='sp')s.mode.sp+=tht;
      const h=Math.floor((t.at||0)/60);s.hours[h]=(s.hours[h]||0)+tht;
    });
    return s;
  });
}
function dayHasPt(iso){return memo('hp:'+iso,()=>EMP.some(e=>evsOn(e.id,iso).length));}
function dayMs(iso){
  return memo('ms:'+iso,()=>{
    let min=0,cost=0;const has=dayHasPt(iso);
    if(has)EMP.forEach(e=>{const m=workedMin(evsOn(e.id,iso),iso===TODAY_ISO);min+=m;cost+=m/60*(e.taux||0);});
    let plan=0;if(!has){const {w,d}=wdOf(pdate(iso));plan=sum(S.shifts.filter(x=>x.w===w&&x.d===d),x=>durMin(x)/60*(empById(x.emp).taux||0));}
    return {has,min,cost,plan};
  });
}
function dayLoss(iso){
  return memo('lo:'+iso,()=>{
    const decl=sum((S.pertes||[]).filter(p=>p.date===iso),p=>p.val||0);
    const inv=sum((S.invHist||[]).filter(h=>h.date===iso),h=>sum(h.lines||[],l=>l.val<0?-l.val:0));
    return {decl,inv};
  });
}
function chargesTotal(){const c=S.charges;if(!c)return 0;return (+c.loyer||0)+(+c.energie||0)+(+c.assur||0)+(+c.autres||0);}

/* ---------- une période ---------- */
function agg(dates){
  const key='ag:'+dates[0]+':'+dates[dates.length-1]+':'+dates.length;
  return memo(key,()=>{
    const A={ht:0,ttc:0,cost:0,tk:0,items:0,by:{},svc:[0,0],mode:{sp:0,emp:0},hours:{},cats:{},ms:0,msMin:0,msPt:0,lossDecl:0,lossInv:0,fixed:0,open:0,days:dates.length};
    const fx=chargesTotal();
    dates.forEach(iso=>{
      const d=daySum(iso);
      A.ht+=d.ht;A.ttc+=d.ttc;A.cost+=d.cost;A.tk+=d.tk;A.items+=d.items;A.svc[0]+=d.svc[0];A.svc[1]+=d.svc[1];A.mode.sp+=d.mode.sp;A.mode.emp+=d.mode.emp;
      Object.values(d.by).forEach(o=>{const x=A.by[o.rid]||(A.by[o.rid]={rid:o.rid,n:o.n,q:0,ht:0,cost:0});x.q+=o.q;x.ht+=o.ht;x.cost+=o.cost;});
      Object.keys(d.hours).forEach(h=>A.hours[h]=(A.hours[h]||0)+d.hours[h]);
      Object.keys(d.cats).forEach(c=>A.cats[c]=(A.cats[c]||0)+d.cats[c]);
      if(d.ht>0)A.open++;
      const m=dayMs(iso);
      if(m.has){A.ms+=m.cost;A.msMin+=m.min;A.msPt++;}else if(d.ht>0)A.ms+=m.plan;
      const l=dayLoss(iso);A.lossDecl+=l.decl;A.lossInv+=l.inv;
      if(fx)A.fixed+=fx/dimOf(pdate(iso));
    });
    A.marge=A.ht-A.cost;A.fc=A.ht?A.cost/A.ht:0;A.tm=A.tk?A.ttc/A.tk:0;A.loss=A.lossDecl+A.lossInv;A.msr=A.ht?A.ms/A.ht:0;
    A.res=A.ht-A.cost-A.ms-A.loss-A.fixed;
    return A;
  });
}
function statPeriod(){
  const p=UI.st.p;const T=TODAY;const y=addDays(T,-1);
  const R=(a,b)=>isoRange(isoD(a),isoD(b));
  const jr=d=>JOURS[(d.getDay()+6)%7].toLowerCase();
  if(p==='jour'){const pv=addDays(T,-7);return {p,cur:[TODAY_ISO],prev:[isoD(pv)],label:'Aujourd’hui, '+longDate(T).toLowerCase()+' · journée en cours',vs:cap(jr(pv))+' dernier',cmp:'comparé à '+jr(pv)+' dernier à la même heure',single:true};}
  if(p==='date'){const d=pdate(UI.st.date||isoD(y));const pv=addDays(d,-7);return {p,cur:[isoD(d)],prev:[isoD(pv)],label:cap(longDate(d).toLowerCase())+' '+d.getFullYear()+(isoD(d)===TODAY_ISO?' · journée en cours':''),vs:cap(jr(pv))+' précédent',cmp:'comparé au '+jr(pv)+' précédent ('+shortDate(pv)+')',single:true};}
  if(p==='7j'){const a=addDays(T,-7);return {p,cur:R(a,y),prev:R(addDays(T,-14),addDays(T,-8)),label:'7 derniers jours complets · du '+FRM(a)+' au '+FRM(y),vs:'Les 7 jours d’avant',cmp:'comparé aux 7 jours d’avant'};}
  if(p==='mprec'){const m0=new Date(T.getFullYear(),T.getMonth()-1,1),m1=new Date(T.getFullYear(),T.getMonth(),0);return {p,cur:R(m0,m1),prev:R(addDays(m0,-35),addDays(m1,-35)),label:cap(MOIS[m0.getMonth()])+' '+m0.getFullYear()+' · mois complet',vs:'5 semaines plus tôt',cmp:'comparé aux mêmes jours de la semaine, 5 semaines plus tôt'};}
  const m0=new Date(T.getFullYear(),T.getMonth(),1);const dn=T.getDate();const sh=dn-1>28?35:28;
  return {p:'mois',cur:R(m0,T),curCmp:dn>1?R(m0,y):null,prev:dn>1?R(addDays(m0,-sh),addDays(y,-sh)):[],label:cap(MOIS[T.getMonth()])+' · du 1er au '+FRM(T)+' (aujourd’hui en cours)',vs:(sh/7)+' semaines plus tôt',cmp:'évolution comparée aux mêmes jours de la semaine, '+(sh/7)+' semaines plus tôt'};
}
function periodCmp(P){
  const A=agg(P.cur);const Ac=P.curCmp?agg(P.curCmp):A;
  if(P.p==='jour'){
    /* journée en cours : on compare à la même heure la semaine dernière */
    const m=nowMin();const iso=P.prev[0];if(iso<histMin())return {A,Ac,B:null};
    let ht=0,ttc=0,tk=0;const by={};
    dayTickets(iso).filter(t=>(t.at||0)<=m).forEach(t=>{tk+=t.n||1;(t.lines||[]).forEach(l=>{const tva=(l.tva!=null?l.tva:10)/100;const h=l.q*l.pu/(1+tva);ht+=h;ttc+=l.q*l.pu;const o=by[l.rid]||(by[l.rid]={rid:l.rid,n:l.n,q:0,ht:0,cost:0});o.q+=l.q;o.ht+=h;});});
    return {A,Ac,B:ht>0?{ht,ttc,tk,tm:tk?ttc/tk:0,loss:null,by}:null};
  }
  const ok=P.prev.length>0&&P.prev[0]>=histMin();
  const B=ok?agg(P.prev):null;
  return {A,Ac,B:B&&B.ht>0?B:null};
}
/* pastille d'évolution : flèche + signe, jamais la couleur seule */
function dchip(cur,prev,good){
  if(prev==null||!isFinite(prev)||prev<=0||cur==null)return '';
  const r=(cur-prev)/prev;
  if(Math.abs(r)<0.005)return '<span class="dl eq">= stable</span>';
  const up=r>0;const tone=(up===(good!=='down'))?'ok':'bad';
  return `<span class="dl ${tone}" title="${up?'En hausse':'En baisse'}">${up?'▲':'▼'} ${nf(Math.abs(r)*100,1)} %</span>`;
}

/* ---------- retards, services sans pointage, heures sup ---------- */
function empLates(e,iso){
  return memo('lt:'+e.id+':'+iso,()=>{
    const {w,d}=wdOf(pdate(iso));const sh=empShifts(e.id,w,d);const ev=evsOn(e.id,iso).filter(x=>x.t==='in');const out=[];
    sh.forEach((x,i)=>{if(ev[i]&&ev[i].m>sMin(x)+5)out.push(ev[i].m-sMin(x));});
    return out;
  });
}
function empMissed(e,iso){
  if(iso>=TODAY_ISO||!dayHasPt(iso))return false;
  const {w,d}=wdOf(pdate(iso));if(!empShifts(e.id,w,d).length)return false;
  if(absOf(e.id,w,d))return false;
  return !evsOn(e.id,iso).length;
}
