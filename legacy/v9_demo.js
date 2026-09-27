/* =========================================================
   V9 · DÉMO : de quoi tester l'appli Équipe tout de suite
   (semaine type, shift à pourvoir, échange, dispos, notes, congés)
   ========================================================= */
if(typeof seedDemo==='function'){
  const f0=seedDemo;
  seedDemo=function(){f0();try{v9DemoSeed();}catch(e){console.error('v9 seed',e);}};
}
function v9DemoSeed(){
  const mon1=isoD(new Date(TODAY.getFullYear(),TODAY.getMonth(),1));
  const openDays=R=>[0,1,2,3,4,5,6].filter(d=>!(R.closed||[]).includes(d));
  const setup=(R,cps,skills)=>{
    R.emp=R.emp.map(e=>{const c=cps[e.id];const o={...e};if(c){o.cp={solde:c[0],au:mon1};o.entree=c[1];}if(skills[e.id])o.skills=skills[e.id];return o;});
  };
  const snap=(R,w,at)=>withCtx(R,()=>({at,by:R.patron&&R.patron.prenom||'Direction',list:weekKeys(w)}));
  const B=NET.restos.beffroi;
  if(B){
    setup(B,{camille:[14.5,'2024-03-04'],ines:[8,'2025-06-02'],nathan:[11,'2023-09-11'],chloe:[6.5,'2025-01-13'],julien:[18,'2021-05-17'],lucas:[9.5,'2024-08-26'],mehdi:[4,'2025-10-06'],yanis:[12,'2023-04-03'],sofia:[7,'2024-11-18']},{nathan:['bar'],yanis:['salle'],mehdi:['plonge'],camille:['bar']});
    B.tplWeek=B.shifts.filter(x=>x.w===0).map(({emp,d,s,e,p,poste})=>({emp,d,s,e,p:p||0,poste}));
    B.pubSnap={'-1':snap(B,-1,Date.now()-9*864e5),'0':snap(B,0,Date.now()-3*864e5)};
    /* une modif après publication : Lucas finit plus tard un jour à venir */
    const od=openDays(B);const fut=od.filter(d=>d>TIDX);const dd=fut.length?fut[0]:od[od.length-1];
    const lx=B.shifts.find(x=>x.emp==='lucas'&&x.w===0&&x.d===dd&&x.e==='22:30')||B.shifts.find(x=>x.emp==='lucas'&&x.w===0&&x.d>=TIDX);
    if(lx)lx.e='23:30';
    /* semaine prochaine : un shift à pourvoir le jour le plus chargé, avec une volontaire */
    const busy=od.slice().sort((a,b)=>sum(B.prev[b])-sum(B.prev[a]))[0];
    B.openShifts=[{id:'o_demo1',w:1,d:busy,s:'18:30',e:'23:30',p:0,poste:'salle'}];
    B.published['1']=false;
    /* un échange demandé par Nathan, une proposition de Chloé */
    const nx=B.shifts.filter(x=>x.emp==='nathan'&&x.w===1&&sMin(x)>=1000).sort((a,b)=>a.d-b.d)[0];
    B.swaps=[];
    if(nx)B.swaps.push({id:'sw_demo1',kind:'swap',emp:'nathan',to:'ines',shiftId:nx.id,snap:{w:1,d:nx.d,s:nx.s,e:nx.e,poste:nx.poste},note:'Anniversaire de ma sœur, Inès est d’accord',status:'pending',at:Date.now()-5*3600e3});
    B.swaps.push({id:'sw_demo2',kind:'take',emp:'chloe',openId:'o_demo1',snap:{w:1,d:busy,s:'18:30',e:'23:30',poste:'salle'},status:'pending',at:Date.now()-2*3600e3});
    /* disponibilités */
    const chloeOff=[0,1,2,3,4,5,6].find(d=>(B.absences||[]).some(a=>a.emp==='chloe'&&a.type==='indispo'&&a.d===d))??od[0];
    B.avail={chloe:{days:{[String(chloeOff)]:'jour'},note:'Cours à la fac',at:Date.now()-20*864e5},sofia:{days:{[String(od[1])]:'midi'},note:'Garde de mon fils le midi',at:Date.now()-40*864e5}};
    /* notes du jour */
    B.dayNotes={[TODAY_ISO]:'Groupe de 18 à 20 h (anniversaire)'};
    const fri=od.filter(d=>d>=4)[0];if(fri!=null&&fri!==TIDX)B.dayNotes[isoD(dateAt(fri>=TIDX?0:1,fri))]='Match du LOSC · écran géant';
    /* ce que l'équipe a reçu */
    B.planNews=[];
    withCtx(B,()=>{EMP.forEach(e=>{const n=S.shifts.filter(x=>x.emp===e.id&&x.w===0);if(n.length)S.planNews.push({id:uid('nw'),at:Date.now()-3*864e5,w:wkIso(0),emp:e.id,txt:`Planning de la semaine ${isoWeek(dateAt(0,0))} publié : ${plur(n.length,'service')}, ${dur(sum(n,durMin))}`});});});
  }
  const T=NET.restos.trefle;
  if(T){
    setup(T,{lea:[16,'2022-02-14'],paul:[10,'2023-06-05'],sarah:[5.5,'2025-03-03'],karim:[13,'2022-11-21']},{paul:['salle'],lea:['bar']});
    T.pubSnap={'-1':snap(T,-1,Date.now()-9*864e5),'0':snap(T,0,Date.now()-3*864e5)};
    T.avail={sarah:{days:{[String(openDays(T)[0])]:'soir'},note:'Cours du soir',at:Date.now()-30*864e5}};
  }
  const Sa=NET.restos.salon;
  if(Sa){
    setup(Sa,Object.fromEntries((Sa.emp||[]).map((e,i)=>[e.id,[9+i*2.5,'2024-0'+(i+1)+'-01']])),{});
    Sa.pubSnap={'-1':snap(Sa,-1,Date.now()-9*864e5),'0':snap(Sa,0,Date.now()-3*864e5)};
  }
}
