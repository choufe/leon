/* =========================================================
   V11 · DÉMO : de quoi tester tout de suite
   accès des managers, un plongeur qui lit en tamoul, cahier de liaison,
   heures à valider, échéances, hausse de prix, tâches, action corrective
   ========================================================= */
if(typeof seedDemo==='function'&&typeof BEFF_EMP!=='undefined'){
  if(!BEFF_EMP.some(e=>e.id==='kumaran')){
    BEFF_EMP.push({id:'kumaran',prenom:'Kumaran',nom:'Sivalingam',poste:'plonge',titre:'Plongeur',contrat:35,taux:16.6,tel:'06 39 98 11 41',code:'3009',acces:'staff'});
    BEFF_SPEC.kumaran=[null,['11:30-15:30','19:00-23:30'],'19:00-23:30',['11:30-15:30','19:00-23:30'],['11:30-15:30','19:00-23:30'],'19:00-23:30','11:30-16:00'];
  }
  const f0=seedDemo;
  seedDemo=function(){f0();try{v11DemoSeed();}catch(e){console.error('v11 seed',e);}};
}
function v11DemoSeed(){
  const B=NET.restos.beffroi;if(!B)return;ensureV11(B);
  const at=(k,h,m)=>{const d=addDays(TODAY,-k);d.setHours(h,m,0,0);return d.getTime();};
  const y=isoD(addDays(TODAY,-1));
  withCtx(B,()=>{
    /* accès et langues */
    S.emp=S.emp.map(e=>{
      const o={...e};
      if(e.id==='camille')o.perms={...PERM_PRESETS.salle.p};
      if(e.id==='julien')o.perms={...PERM_PRESETS.chef.p};
      if(e.id==='kumaran'){o.lang='ta';o.entree=isoD(addDays(TODAY,-48));o.cp={solde:1,au:isoD(new Date(TODAY.getFullYear(),TODAY.getMonth(),1))};}
      const D={};
      if(e.id==='nathan')D.sejour=isoD(addDays(TODAY,41));
      if(e.id==='kumaran')D.essai=isoD(addDays(TODAY,12));
      if(e.id==='sofia')D.visite=isoD(addDays(TODAY,9));
      if(e.id==='chloe'){D.cdd=isoD(addDays(TODAY,26));o.typeContrat='cdd';}
      if(e.id==='julien')D.hyg='2023-03-14';
      if(e.id==='lucas')D.hyg='2024-11-05';
      if(e.id==='camille')D.hyg='2025-02-10';
      if(Object.keys(D).length)o.docs=D;
      return o;
    });
    syncCtx();
    /* cahier de liaison */
    const mk=(k,h,m,by,byId,cat,txt,x)=>({id:uid('lia'),ts:at(k,h,m),date:isoD(addDays(TODAY,-k)),svc:h*60+m<900?'midi':'soir',by,byId,cat,txt,read:{},...(x||{})});
    S.liaison=[
      mk(1,15,10,'Camille','camille','client','Table 12 : client mécontent de l’attente sur les moules (25 min). On a offert les cafés, il est reparti content.',{read:{julien:at(1,15,30),nathan:at(1,18,40)}}),
      mk(1,22,40,'Yanis','yanis','afaire','Fût de blonde presque vide : en changer un avant le service de ce soir.',{read:{camille:at(1,23,0)}}),
      mk(1,23,5,'Lucas','lucas','casse','Bac de frites maison renversé en fin de service.',{loss:{key:'r:p_frites',n:'Frites maison',u:'kg',q:2,val:0,st:'pending'},read:{julien:at(0,9,40)}}),
      mk(0,9,45,'Julien','julien','rupture','Plus de crevettes grises : la croquette passe à 12 portions max, livraison Marée du Nord demain matin.',{read:{}}),
      mk(0,10,5,'Camille','camille','livraison','Metro livre avant 11 h par la porte de service : Lucas réceptionne dans Léon.',{read:{lucas:at(0,10,20)}}),
    ];
    const u=perteUnit('r:p_frites');if(u)S.liaison[2].loss.val=+(u.pu*2).toFixed(2);
    /* heures d'hier à valider */
    const {w,d}=wdOf(addDays(TODAY,-1));
    const on=S.emp.filter(e=>empShifts(e.id,w,d).length&&(S.pointages[e.id]||{})[y]);
    const pick=(fn)=>on.find(fn);
    const a=pick(e=>e.id==='yanis')||on[0];
    if(a){const ev=S.pointages[a.id][y];const i=ev.map(z=>z.t).lastIndexOf('out');if(i>=0)ev.splice(i,1);}
    const b=pick(e=>e.id==='nathan'&&e!==a)||on.find(e=>e!==a&&e.poste==='salle');
    if(b){const ev=S.pointages[b.id][y];const sh=empShifts(b.id,w,d);const o=ev.filter(z=>z.t==='out').pop();if(o&&sh.length)o.m=eMin(sh[sh.length-1])+55;}
    const c=pick(e=>e.id==='lucas'&&e!==a&&e!==b)||on.find(e=>e!==a&&e!==b&&e.poste==='cuisine');
    if(c){const ev=S.pointages[c.id][y];const sh=empShifts(c.id,w,d);const i0=ev.find(z=>z.t==='in');if(i0&&sh.length)i0.m=sMin(sh[0])+22;}
    /* hausse de prix repérée à la réception */
    const bh=ING('boeuf_hache');
    if(bh){const old=bh.p;const nu=+(old*1.09).toFixed(2);bh.p=nu;const o=S.orders.find(x=>x.id==='o_vand');if(o){const l=o.lines.find(x=>x.id==='boeuf_hache');if(l){l.pr=nu;l.rs='prix';}}
      S.priceLog=[{id:'px_demo1',date:isoD(addDays(TODAY,-2)),ing:'boeuf_hache',n:bh.n,f:'Boucherie Vandamme',old,nu}];}
    /* zones d'inventaire */
    S.ingredients=S.ingredients.map(i=>['pdt','oignon','cassonade','farine','sucre'].includes(i.id)?{...i,zone:'sec'}:i);
    /* tâches : 7 jours d'historique, ouverture cuisine en cours aujourd'hui */
    const TL=tasksOf();const done={};
    for(let k=7;k>=0;k--){
      const iso=isoD(addDays(TODAY,-k));const {d:wd}=wdOf(addDays(TODAY,-k));if(isClosed(wd))continue;const day={};
      TL.forEach(L=>{const who=tkAssign(L,iso);if(!who.length)return;const by=who[0].prenom;const items={};
        let nOk=L.items.length;
        if(k===0){if(L.moment!=='ouverture'||L.id!=='tk_ouv_cui')return;nOk=3;}
        if(k===1&&L.id==='tk_fer_sal')nOk=L.items.length-1;
        if(k===4&&L.id==='tk_fer_cui')nOk=L.items.length-2;
        const base=L.moment==='ouverture'?(L.id==='tk_ouv_cui'?555:680):L.moment==='fermeture'?1370:900;
        L.items.slice(0,nOk).forEach((_,i)=>{items[i]={by,at:at(k,Math.floor((base+i*4)/60)%24,(base+i*4)%60)};});
        day[L.id]={items};});
      done[iso]=day;
    }
    S.taskDone=done;
    /* action corrective sur un ancien relevé, l'autre reste à noter */
    const eq=S.hyg.equip[1];const bad=S.hyg.temps.filter(t=>t.eq===eq.id&&hygBad(eq,t.val)).sort((p,q)=>p.date.localeCompare(q.date));
    if(bad[0]&&bad.length>1)bad[0].action={k:'thermo',note:'Joint de porte changé le lendemain',by:'Julien',at:at(10,9,0)};
    /* prévisions : fériés un peu plus chargés */
    S.fcst={mode:'auto',zone:'B',vac:0,fer:10,ovr:{}};
  });
  const Tr=NET.restos.trefle;
  if(Tr){ensureV11(Tr);Tr.fcst={mode:'auto',zone:'B',vac:20,fer:15,ovr:{}};
    Tr.liaison=[{id:uid('lia'),ts:at(1,23,50),date:isoD(addDays(TODAY,-1)),svc:'soir',by:'Paul',byId:'paul',cat:'rupture',txt:'Plus de stout en réserve : deux fûts à commander pour la soirée quiz.',read:{}}];}
  const Sa=NET.restos.salon;if(Sa){ensureV11(Sa);Sa.fcst={mode:'auto',zone:'B',vac:0,fer:0,ovr:{}};}
}
