import re

def rep(src, old, new, count=1, last=False):
    n = src.count(old)
    if n < 1:
        raise SystemExit('demo_patch: not found: ' + old[:90])
    if last:
        i = src.rfind(old)
        return src[:i] + new + src[i + len(old):]
    if count == 1 and n != 1:
        raise SystemExit('demo_patch: ambiguous (%d): %s' % (n, old[:90]))
    return src.replace(old, new)

NEW_PAST = r"""function demoPast(R,spec){
  spec=spec||{};const pts={};const r=rng(R.id+'pt');
  const shOn=(eid,k)=>{const {w,d}=wdOf(addDays(TODAY,-k));return R.shifts.some(x=>x.emp===eid&&x.w===w&&x.d===d);};
  const late={},miss={};
  Object.keys(spec.late||{}).forEach(eid=>{late[eid]={};spec.late[eid].forEach(([k,m])=>{let kk=k;while(kk<k+4&&!shOn(eid,kk))kk++;if(shOn(eid,kk))late[eid][kk]=m;});});
  Object.keys(spec.miss||{}).forEach(eid=>{miss[eid]=[];spec.miss[eid].forEach(k=>{let kk=k;while(kk<k+4&&!shOn(eid,kk))kk++;if(shOn(eid,kk))miss[eid].push(kk);});});
  for(let k=1;k<=62;k++){
    const date=addDays(TODAY,-k);const {w,d}=wdOf(date);const iso=isoD(date);
    R.emp.forEach(e=>{
      const sh=R.shifts.filter(x=>x.emp===e.id&&x.w===w&&x.d===d).sort((a,b)=>sMin(a)-sMin(b));if(!sh.length)return;
      if(miss[e.id]&&miss[e.id].includes(k))return;
      const lt=late[e.id]&&late[e.id][k];
      const ev=[];
      sh.forEach((x,i)=>{let inn=sMin(x)-8+Math.floor(r()*11);if(lt&&i===0)inn=sMin(x)+lt;ev.push({t:'in',m:inn});if(x.p){const mid=sMin(x)+Math.round((eMin(x)-sMin(x))/2);ev.push({t:'pause',m:mid});ev.push({t:'back',m:mid+x.p+Math.floor(r()*3)});}ev.push({t:'out',m:eMin(x)-3+Math.floor(r()*15)});});
      (pts[e.id]=pts[e.id]||{})[iso]=ev;
    });
  }
  return pts;
}"""

NEW_HIST = r"""function demoHist(R,perDay,o){
  o=o||{};
  return withCtx(R,()=>{
    const H={};const recs=S.recipes.filter(r=>r.t!=='prep'&&r.pv);const svc=mainCat()!=='plat';
    const slots=svc?[600,660,720,840,960,1080]:[735,780,825,1170,1230,1290];
    const prov=(S.caisse&&S.caisse.provider)||'Caisse';
    for(let k=1;k<=62;k++){
      const date=addDays(TODAY,-k);const iso=isoD(date);const {d}=wdOf(date);if(isClosed(d))continue;
      const [cm,cs]=prevOf(d);const cov=cm+cs;if(!cov)continue;const rnd=rng(S.id+iso);
      const g=o.trend?o.trend(k,date):1;
      const B={};
      recs.forEach(r=>{
        const q=Math.max(0,Math.round(perDay(r,cov)*g*(o.mult?o.mult(r,k):1)*(0.75+rnd()*0.5)));
        for(let u=0;u<q;u++){
          const soir=rnd()*cov<cs;
          if(o.drop&&rnd()<o.drop(k,soir))continue;
          const x=rnd();const si=(soir?3:0)+(x<0.3?0:x<0.75?1:2);
          const mode=svc?'':(rnd()<(o.emp||0)?'emp':'sp');
          const key=si+mode;const b=B[key]||(B[key]={si,mode,l:{}});b.l[r.id]=(b.l[r.id]||0)+1;
        }
      });
      const div=svc?1.15:2.6;
      H[iso]=Object.values(B).map(b=>{const lines=Object.keys(b.l).map(id=>{const r=REC(id);return {rid:id,n:r.n,q:b.l[id],pu:r.pv,tva:r.tva!=null?r.tva:10};});const items=sum(lines,l=>l.q);const t={id:'h'+k+'_'+b.si+b.mode,at:slots[b.si],by:prov,n:Math.max(1,Math.round(items/div)),lines,total:+sum(lines,l=>l.q*l.pu).toFixed(2)};if(b.mode)t.mode=b.mode;return t;});
    }
    return H;
  });
}
function seedPertes(R,list){
  withCtx(R,()=>{R.pertes=list.map(([k,kind,ref,q,motif,by,note],j)=>{const u=perteUnit(kind+':'+ref);if(!u)return null;return {id:'pl'+R.id+j,date:isoD(addDays(TODAY,-k)),at:560+j*13,by,k:kind,ref,n:u.n,q,u:u.u,val:+(u.pu*q).toFixed(2),motif,note:note||''};}).filter(Boolean);});
}
const inMonth=d=>d.getMonth()===TODAY.getMonth()&&d.getFullYear()===TODAY.getFullYear();"""

def patch(src):
    # 9 semaines de planning passé, publiées
    src = rep(src, "for(const w of [-1,0,1])emps.forEach", "for(let w=-9;w<=1;w++)emps.forEach")
    src = src.replace("published:{'-1':true,'0':true}", "published:Object.fromEntries([-9,-8,-7,-6,-5,-4,-3,-2,-1,0].map(w=>[String(w),true]))")
    src = rep(src, "R.absences=[-1,0,1].map(w=>", "R.absences=[-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1].map(w=>")
    # pointages sur 2 mois avec retards / oublis répétés
    i = src.index('function demoPast(R,lateId){'); j = src.index('\n}\n', i)
    src = src[:i] + NEW_PAST + src[j + 2:]
    # ventes sur 2 mois, par créneau, sur place / à emporter, avec tendances
    i = src.index('function demoHist(R,perDay){'); j = src.index('\n}\n', i)
    src = src[:i] + NEW_HIST + src[j + 2:]
    src = rep(src, "function salesFromHist(R){const tot={};Object.values(R.hist).forEach(",
                   "function salesFromHist(R){const tot={};const lim=isoD(addDays(TODAY,-30));Object.keys(R.hist).filter(k=>k>=lim).map(k=>R.hist[k]).forEach(")
    # Petit Beffroi
    src = rep(src, "R.pointages=demoPast(R,'mehdi');",
              "R.pointages=demoPast(R,{late:{mehdi:[[3,17],[9,12],[16,25],[23,9]]},miss:{ines:[6]}});")
    src = rep(src, "R.hist=demoHist(R,(r,cov)=>(r.sales||0)/26*cov/147);salesFromHist(R);",
              "R.hist=demoHist(R,(r,cov)=>(r.sales||0)/26*cov/147*2.2,{emp:0.16,trend:(k,d)=>inMonth(d)?1.07:1,mult:(r,k)=>r.id==='welsh'&&k<=14?0.5:r.id==='tartare'&&k<=14?1.5:1});salesFromHist(R);")
    src = rep(src, "R.invHist=[{date:dm6,at:1400,by:'Camille',lines:invL,ecart:+sum(invL,l=>l.val).toFixed(2)}];",
              "R.invHist=[{date:dm6,at:1400,by:'Camille',lines:invL,ecart:+sum(invL,l=>l.val).toFixed(2)}];\n"
              "  {const dm13=isoD(addDays(TODAY,-13));const old=[['fut_blonde',-4],['rumsteck',-0.2],['creme',-0.6]].map(([id,dq])=>{const i=INGD(id);return {id,n:i.n,u:i.u,theo:+(12-dq).toFixed(2),reel:12,val:+(dq*i.p).toFixed(2)};});R.invHist.unshift({date:dm13,at:1400,by:'Camille',lines:old,ecart:+sum(old,l=>l.val).toFixed(2)});}\n"
              "  {const dm12=isoD(addDays(TODAY,-12)),dm13=isoD(addDays(TODAY,-13));R.orders.push({id:'o_maree0',f:'Marée du Nord',lines:[line('moules',30,{qr:26,pr:4.6,rs:'partiel',temp:'3.0'}),line('crevettes',1,{qr:1,pr:38,rs:'ok',temp:'3.4'})],status:'recue_ecarts',created:dm13,createdAt:600,by:'Julien',livraison:dm12,sent:dm13,received:dm12,receivedAt:550,recBy:'Julien',recTotal:157.6,avoir:18.4,avoirStatus:'recu',note:''});}")
    src = rep(src, "  demoHygSeed(R);\n  return finishDemo(R);\n}\nfunction buildTrefle(){",
              "  demoHygSeed(R);\n"
              "  seedPertes(R,[[2,'i','moules',3,'dlc','Julien'],[9,'i','moules',2.5,'dlc','Lucas'],[16,'i','moules',4,'dlc','Julien','livraison trop grosse'],[4,'i','crevettes',0.3,'dlc','Julien'],[6,'r','carbonade',2,'erreur','Camille','table renvoyée, trop salée'],[11,'i','fut_blonde',6,'casse','Yanis','fût mal branché'],[20,'r','tarte',8,'casse','Camille'],[1,'i','maroilles',0.4,'dlc','Lucas']]);\n"
              "  R.charges={loyer:6500,energie:2800,assur:1500,autres:13500};\n"
              "  return finishDemo(R);\n}\nfunction buildTrefle(){")
    # Le Trèfle
    src = rep(src, "R.pointages=demoPast(R,null);", "R.pointages=demoPast(R,{late:{paul:[[2,11],[8,22],[15,14]]}});")
    src = rep(src, "R.hist=demoHist(R,(r,cov)=>cov*(TREF_WEIGHTS[r.id]||5)/100);salesFromHist(R);",
              "R.hist=demoHist(R,(r,cov)=>cov*(TREF_WEIGHTS[r.id]||5)/100*0.55,{emp:0.08,trend:(k)=>k<=7?0.9:1,drop:(k,soir)=>k<=7&&soir?0.14:0,mult:(r,k)=>r.id==='wings'&&k<=14?1.6:1});salesFromHist(R);")
    src = rep(src, "  demoHygSeed(R);\n  return finishDemo(R);\n}\nfunction buildSalonSylvain(){",
              "  demoHygSeed(R);\n"
              "  seedPertes(R,[[3,'i','fut_stout',8,'casse','Paul','purge et mousse'],[10,'i','fut_stout',5,'casse','Paul'],[5,'i','cabillaud',1.2,'dlc','Karim'],[18,'i','ailes',2,'dlc','Karim']]);\n"
              "  R.charges={loyer:4800,energie:2200,assur:900,autres:8000};\n"
              "  return finishDemo(R);\n}\nfunction buildSalonSylvain(){")
    # Salon Sylvain
    src = rep(src, "R.pointages=demoPast(R,'nadia');", "R.pointages=demoPast(R,{late:{nadia:[[5,12],[12,19]]}});")
    src = rep(src, "R.hist=demoHist(R,(r,cov)=>cov*(SALON_WEIGHTS[r.id]||3)/100);salesFromHist(R);",
              "R.hist=demoHist(R,(r,cov)=>cov*(SALON_WEIGHTS[r.id]||3)/100*1.5,{trend:(k,d)=>inMonth(d)?1.08:1,mult:(r,k)=>r.id==='balayage'&&k<=14?1.8:1});salesFromHist(R);R.charges={loyer:2200,energie:450,assur:350,autres:2800};")
    # hygiène : 2 semaines d'historique, un frigo qui décroche deux fois, des oublis au Trèfle
    src = rep(src, "for(let k=6;k>=1;k--){\n    const date=isoD(addDays(TODAY,-k));\n    eq.forEach((e,i)=>{",
              "for(let k=14;k>=1;k--){\n    if(R.id==='trefle'&&[4,5,8,11].includes(k))continue;\n    const date=isoD(addDays(TODAY,-k));\n    eq.forEach((e,i)=>{")
    src = rep(src, "if(R.id==='beffroi'&&i===1&&k===3)val=e.max+2.3;", "if(R.id==='beffroi'&&i===1&&(k===3||k===10))val=e.max+(k===3?2.3:1.6);")
    # tickets du jour : sur place / à emporter
    src = rep(src, "S.ventes=[...(S.ventes||[]),{id:uid('t'),at:m,by:provider,lines,total}];\n  lines.forEach(l=>{const r=REC(l.rid);consume(r,l.q,1);",
              "S.ventes=[...(S.ventes||[]),{id:uid('t'),at:m,by:provider,lines,total,mode:rnd()<(S.id==='trefle'?0.08:0.16)?'emp':'sp'}];\n  lines.forEach(l=>{const r=REC(l.rid);consume(r,l.q,1);")
    # page d'accueil de la démo
    src = rep(src, "<div>${ic('thermo')}<span>Hygiène : relevés de température des frigos, traçabilité des produits, étiquettes DLC à imprimer</span></div>",
              "<div>${ic('thermo')}<span>Hygiène : relevés de température des frigos, traçabilité des produits, étiquettes DLC à imprimer</span></div>\n       <div>${ic('chart')}<span>Statistiques et infos importantes : CA du mois, pertes, produits stars, et les problèmes qui reviennent repérés tout seuls</span></div>")
    src = rep(src, "des relevés de température à faire et des crevettes à surveiller</dd>",
              "des relevés de température à faire, des crevettes à surveiller, et les infos importantes du mois (retards répétés, CA du Trèfle en baisse, moules jetées trop souvent)</dd>")
    return src
