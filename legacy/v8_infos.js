
/* =========================================================
   INFOS IMPORTANTES : Léon analyse 30 jours tout seul
   ========================================================= */
const INS_CAT={equipe:{l:'Équipe',i:'users'},ca:{l:'Chiffre d’affaires',i:'euro'},produits:{l:'Produits',i:'plate'},pertes:{l:'Pertes',i:'trash'},hygiene:{l:'Hygiène',i:'thermo'},fourn:{l:'Fournisseurs',i:'truck'}};
const INS_RANK={bad:0,warn:1,info:2,ok:3};
const catLabel=c=>c==='produits'&&isSvcBiz()?'Prestations':(INS_CAT[c]||{l:c}).l;
const catIcon=c=>c==='produits'&&isSvcBiz()?'scissors':(INS_CAT[c]||{i:'spark'}).i;
const caOf=list=>sum(list,iso=>daySum(iso).ht);
const openOf=list=>list.filter(iso=>daySum(iso).ht>0).length;
function lotName(n){return String(n||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();}

function insightsFor(){
  return memo('ins',()=>{
    const I=[];const can=CAN();
    const add=o=>I.push(o);
    const d7=daysBack(1,7),p7=daysBack(8,14),d14=daysBack(1,14),p14=daysBack(15,28),d30=daysBack(0,29);
    const svc=isSvcBiz();

    /* ---- chiffre d'affaires ---- */
    const c7=caOf(d7),q7=caOf(p7);
    const d28=daysBack(1,28),p28=daysBack(29,56);const c28=caOf(d28),q28=caOf(p28);
    const r28=p28[0]>=histMin()&&openOf(d28)>=12&&openOf(p28)>=12&&q28>0?(c28-q28)/q28:null;
    const t28=r28!=null?` Sur 4 semaines : ${pcs(r28)} (${eur(c28,0)} contre ${eur(q28,0)}).`:'';
    let ca7=false;
    if(openOf(d7)>=3&&openOf(p7)>=3&&q7>0){
      const r=(c7-q7)/q7;
      if(r<=-0.1){
        ca7=true;
        let worst=null;d7.forEach((iso,i)=>{const df=daySum(iso).ht-daySum(p7[i]).ht;if(!worst||df<worst.df)worst={iso,df};});
        const a=agg(d7),b=agg(p7);const sm=b.svc[0]?(a.svc[0]-b.svc[0])/b.svc[0]:0,ss=b.svc[1]?(a.svc[1]-b.svc[1])/b.svc[1]:0;
        const where=Math.min(sm,ss)<-0.08?` Surtout ${(ss<sm?(svc?'l’après-midi':'le soir'):(svc?'le matin':'le midi'))} (${pcs(Math.min(sm,ss))}).`:'';
        add({id:'ca7',cat:'ca',tone:r<=-0.2||(r28!=null&&r28<=-0.1)?'bad':'warn',t:`CA en baisse : ${pcs(r)} sur 7 jours`,s:`${eur(c7,0)} HT sur les 7 derniers jours contre ${eur(q7,0)} la semaine d’avant.${where}${worst&&worst.df<0?` Le plus gros recul : ${JOURS[(pdate(worst.iso).getDay()+6)%7].toLowerCase()} (${eur(worst.df,0)}).`:''}${t28}`,acts:[{l:'Voir les stats',act:'st-go',p:'7j'}],sc:-r});
      }else if(r>=0.1){ca7=true;add({id:'ca7up',cat:'ca',tone:'ok',t:`CA en hausse : ${pcs(r)} sur 7 jours`,s:`${eur(c7,0)} HT contre ${eur(q7,0)} la semaine d’avant.${t28}`,acts:[{l:'Voir les stats',act:'st-go',p:'7j'}],sc:r});}
    }
    if(!ca7&&r28!=null){
      if(r28<=-0.08)add({id:'ca28',cat:'ca',tone:r28<=-0.15?'bad':'warn',t:`CA en baisse : ${pcs(r28)} sur 4 semaines`,s:`${eur(c28,0)} HT sur les 4 dernières semaines contre ${eur(q28,0)} les 4 d’avant (mêmes jours de la semaine).`,acts:[{l:'Voir les stats',act:'st-go',p:'mois'}],sc:-r28});
      else if(r28>=0.08)add({id:'ca28up',cat:'ca',tone:'ok',t:`CA en hausse : ${pcs(r28)} sur 4 semaines`,s:`${eur(c28,0)} HT sur les 4 dernières semaines contre ${eur(q28,0)} les 4 d’avant (mêmes jours de la semaine).`,acts:[{l:'Voir les stats',act:'st-go',p:'mois'}],sc:r28});
    }
    const A14=agg(d14),B14=agg(p14);
    if(A14.tk>=30&&B14.tk>=30&&B14.tm>0){
      const r=(A14.tm-B14.tm)/B14.tm;
      if(r<=-0.08){
        let hint='';const cats=Object.keys({...A14.cats,...B14.cats});let w=null;
        cats.forEach(c=>{const qa=sum(Object.values(A14.by).filter(o=>(REC(o.rid)||{}).t===c),o=>o.q)/A14.tk,qb=sum(Object.values(B14.by).filter(o=>(REC(o.rid)||{}).t===c),o=>o.q)/B14.tk;if(qb>0.05){const d=(qa-qb)/qb;if(!w||d<w.d)w={c,d,qa,qb};}});
        if(w&&w.d<=-0.12)hint=` Moins de ${(RTYPE[w.c]?RTYPE[w.c].pl:'produits').toLowerCase()} par ${svc?'client':'ticket'} (${nf(w.qa,2)} contre ${nf(w.qb,2)}) : à relancer en salle.`;
        add({id:'tm',cat:'ca',tone:'warn',t:`${svc?'Panier':'Ticket'} moyen en baisse : ${pcs(r)}`,s:`${eur(A14.tm)} TTC sur 14 jours contre ${eur(B14.tm)} avant.${hint}`,acts:[{l:'Voir les stats',act:'st-go',p:'mois'}],sc:-r});
      }
    }
    if(can.costs&&A14.ht>0&&A14.fc>S.target+0.03){
      const rows=Object.values(A14.by).filter(o=>o.ht>0).map(o=>({o,over:o.cost-S.target*o.ht})).sort((a,b)=>b.over-a.over);const top=rows[0];
      add({id:'fc',cat:'produits',tone:A14.fc>S.target+0.06?'bad':'warn',t:`${svc?'Coût produits':'Coût matière'} à ${pc(A14.fc)} sur 14 jours`,s:`Objectif ${pc(S.target,0)}. ${eur(A14.cost-S.target*A14.ht,0)} de marge en moins sur la période.${top&&top.over>0?` Le plus gros écart : ${esc(top.o.n)}.`:''}`,acts:[{l:'Analyse de la carte',act:'go-mod',v:'recettes',t:'analyse'}],sc:A14.fc});
    }
    if(can.salaries&&A14.ht>0&&A14.msPt>=5&&A14.msr>0.36)add({id:'ms',cat:'equipe',tone:A14.msr>0.4?'bad':'warn',t:`Masse salariale à ${pc(A14.msr,0)} du CA sur 14 jours`,s:`${eur(A14.ms,0)} d’heures pour ${eur(A14.ht,0)} HT. On vise 30 à 35 %. Regarde les jours calmes où l’équipe est au complet.`,acts:[{l:'Planning',act:'nav',v:'planning'}],sc:A14.msr});

    /* ---- produits ---- */
    const recs=S.recipes.filter(r=>r.t!=='prep'&&r.pv);
    const drops=[],rises=[];
    recs.forEach(r=>{const a=(A14.by[r.id]||{q:0}).q,b=(B14.by[r.id]||{q:0}).q;if(b>=10){const d=(a-b)/b;if(d<=-0.35)drops.push({r,a,b,d});else if(d>=0.4&&a>=10)rises.push({r,a,b,d});}});
    drops.sort((x,y)=>x.d-y.d).slice(0,2).forEach(x=>add({id:'pdown:'+x.r.id,cat:'produits',tone:'warn',t:`${x.r.n} : ${pcs(x.d)} de ventes`,s:`${nf(x.a)} ${saleWord(x.a)} sur les 14 derniers jours contre ${nf(x.b)} les 14 jours d’avant. Qualité, visibilité sur la carte, rupture ? À vérifier avec l’équipe.`,acts:[{l:'Voir la fiche',act:'goto-rec',id:x.r.id}],sc:-x.d}));
    rises.sort((x,y)=>y.d-x.d).slice(0,1).forEach(x=>add({id:'pup:'+x.r.id,cat:'produits',tone:'ok',t:`${x.r.n} décolle : ${pcs(x.d)}`,s:`${nf(x.a)} ${saleWord(x.a)} en 14 jours contre ${nf(x.b)} avant.${svc?'':' Pense à ajuster les commandes et la mise en place.'}`,acts:[{l:'Voir la fiche',act:'goto-rec',id:x.r.id}],sc:x.d}));
    if(openOf(d14)>=7){
      const A60=agg(daysBack(15,HIST_DAYS-1));
      const none=recs.filter(r=>!(A14.by[r.id]&&A14.by[r.id].q)&&!(daySum(TODAY_ISO).by[r.id]));
      if(none.length)add({id:'nosale',cat:'produits',tone:'info',t:`${none.length} ${none.length>1?prodWord()+'s':prodWord()} pas ${svc?'réalisée':'vendu'}${none.length>1?'s':''} depuis 14 jours`,s:none.slice(0,4).map(r=>esc(r.n)+((A60.by[r.id]||{}).q?' (avant : '+nf(A60.by[r.id].q)+')':'')).join(', ')+(none.length>4?'…':'')+'. Les garder coûte du stock et de la place à la carte.',acts:[{l:svc?'Prestations':'Recettes',act:'nav',v:'recettes'}],sc:none.length});
    }
    if(can.costs){
      const A30=agg(d30);const cand=[];
      Object.values(A30.by).filter(o=>REC(o.rid)&&REC(o.rid).t!=='prep').sort((a,b)=>b.q-a.q).slice(0,6).forEach(o=>{
        const r=REC(o.rid);const m=metrics(r);
        if(m.ratio>S.target+0.05&&o.q>=10){const np=suggestPrice(m.cost,S.target,m.tva);const gain=(m.ratio-S.target)*o.ht;if(gain>=150)cand.push({r,m,o,np,gain});}
      });
      cand.sort((a,b)=>b.gain-a.gain).slice(0,1).forEach(({r,m,o,np,gain})=>add({id:'lowm:'+r.id,cat:'produits',tone:'warn',t:`${r.n} : beaucoup vendu, peu rentable`,s:`${nf(o.q)} ${saleWord(o.q)} en 30 jours avec ${pc(m.ratio)} de ${svc?'coût produits':'coût matière'} (objectif ${pc(S.target,0)}) : environ ${eur(gain,0)} de marge en moins par mois. ${np<=m.pv*1.15?`Le passer à ${eur(np)} au lieu de ${eur(m.pv)} suffirait.`:`Il faudrait le vendre ${eur(np)} : trop d’écart, revois plutôt ${svc?'les doses de produit':'le grammage'} ou le prix d’achat.`}${cand.length>1?` ${cand.length-1} autre${cand.length>2?'s':''} dans le même cas : ${cand.slice(1).map(x=>esc(x.r.n)).join(', ')}.`:''}`,acts:[{l:'Voir la fiche',act:'goto-rec',id:r.id},{l:'Analyse de la carte',act:'go-mod',v:'recettes',t:'analyse'}],sc:gain}));
    }

    /* ---- pertes ---- */
    const P30=(S.pertes||[]).filter(p=>p.date>=d30[0]);
    const pby={};P30.forEach(p=>{const o=pby[p.n]||(pby[p.n]={n:p.n,val:0,cnt:0,m:{},ref:p.ref,k:p.k});o.val+=p.val||0;o.cnt++;o.m[p.motif]=(o.m[p.motif]||0)+1;});
    Object.values(pby).filter(o=>o.val>=40||o.cnt>=3).sort((a,b)=>b.val-a.val).slice(0,2).forEach(o=>{
      const main=Object.keys(o.m).sort((a,b)=>o.m[b]-o.m[a])[0];
      const tip=main==='dlc'?'Commande plus petit et plus souvent, ou mets-le en plat du jour avant la date.':main==='casse'?'Regarde où et comment il est stocké, et qui le manipule.':main==='erreur'?'Vois avec la cuisine : cuisson, dressage, bon de commande mal lu ?':'Vois avec l’équipe d’où ça vient.';
      add({id:'loss:'+o.n,cat:'pertes',tone:o.val>=100?'bad':'warn',t:`${o.n} : ${o.cnt} perte${o.cnt>1?'s':''} en 30 jours`,s:`${eur(o.val)} jetés (${Object.keys(o.m).map(k=>o.m[k]+' × '+(MOTIFS[k]||k).toLowerCase()).join(', ')}). ${tip}`,acts:[{l:'Voir les pertes',act:'st-go',p:'mois'}],sc:o.val});
    });
    const A30b=agg(d30);
    if(A30b.ht>0&&A30b.loss/A30b.ht>0.02)add({id:'losspct',cat:'pertes',tone:A30b.loss/A30b.ht>0.04?'bad':'warn',t:`Pertes : ${pc(A30b.loss/A30b.ht)} du CA sur 30 jours`,s:`${eur(A30b.loss,0)} perdus (${eur(A30b.lossDecl,0)} déclarés${A30b.lossInv>0.5?', '+eur(A30b.lossInv,0)+' d’écart d’inventaire':''}). Au-delà de 2 %, il y a presque toujours une commande trop grosse.`,acts:[{l:'Voir les pertes',act:'st-go',p:'mois'}],sc:A30b.loss/A30b.ht});
    const inv=(S.invHist||[]).filter(h=>h.date>=daysBack(0,60)[0]).slice(-3);
    if(inv.length>=2){
      const neg={};inv.forEach(h=>(h.lines||[]).forEach(l=>{if(l.val<-2){const o=neg[l.id]||(neg[l.id]={n:l.n,u:l.u,cnt:0,q:[],val:0});o.cnt++;o.q.push(l.reel-l.theo);o.val+=l.val;}}));
      const rep=Object.values(neg).filter(o=>o.cnt>=2).sort((a,b)=>a.val-b.val);
      if(rep.length)add({id:'inv',cat:'pertes',tone:'warn',t:`Écarts d’inventaire qui reviennent : ${rep.slice(0,2).map(o=>o.n).join(', ')}`,s:rep.slice(0,3).map(o=>`${esc(o.n)} (${o.q.map(q=>nf(q,Math.abs(q)%1?1:0)+' '+o.u).join(' puis ')})`).join(' · ')+`. ${eur(-sum(rep,o=>o.val),0)} au total : casse non déclarée, vol ou portions trop généreuses.`,acts:[{l:'Inventaire',act:'goto-stock',t:'inv'}],sc:-sum(rep,o=>o.val)});
    }

    /* ---- équipe ---- */
    if(EMP.length){
      let ptDays=0;d30.forEach(iso=>{if(dayHasPt(iso))ptDays++;});
      let anyLate=false;const HS=[];
      EMP.forEach(e=>{
        const L=[];d30.forEach(iso=>empLates(e,iso).forEach(m=>L.push({iso,m})));
        if(L.length)anyLate=true;
        if(L.length>=3){
          const tot=sum(L,x=>x.m);const last=L.slice().sort((a,b)=>b.iso.localeCompare(a.iso))[0];
          const wd={};L.forEach(x=>{const k=(pdate(x.iso).getDay()+6)%7;wd[k]=(wd[k]||0)+1;});const wk=Object.keys(wd).sort((a,b)=>wd[b]-wd[a])[0];
          add({id:'late:'+e.id,cat:'equipe',tone:L.length>=5||tot>=90?'bad':'warn',t:`${e.prenom} : ${L.length} retards en 30 jours`,s:`${durShort(tot)} cumulées. Le dernier : ${frDate(last.iso)} (+${last.m} min)${wd[wk]>=2?`, souvent le ${JOURS[wk].toLowerCase()}`:''}. Un point avec ${e.prenom} s’impose.`,acts:[{l:'Relevé d’heures',act:'go-mod',v:'pointage',t:'releve'}],sc:L.length*10+tot/10});
        }
        const M=d30.filter(iso=>empMissed(e,iso));
        if(M.length>=2)add({id:'miss:'+e.id,cat:'equipe',tone:M.length>=3?'bad':'warn',t:`${e.prenom} : ${M.length} services sans pointage`,s:`${M.slice(-3).map(frDate).join(', ')}. Absence non prévenue ou oubli de badge : à clarifier avant la paie.`,acts:[{l:'Relevé d’heures',act:'go-mod',v:'pointage',t:'releve'}],sc:M.length*8});
        if(can.salaries){
          let over=0,wks=0;for(let w=-1;w>=-4;w--){let m=0;for(let d=0;d<7;d++)m+=workedMin(evsOn(e.id,isoD(dateAt(w,d))),false);if(m>e.contrat*60+120){wks++;over+=m-e.contrat*60;}}
          if(wks>=3)HS.push({e,avg:over/wks,cost:over/60*(e.taux||0),wks});
        }
      });
      if(HS.length){HS.sort((a,b)=>b.avg-a.avg);const cost=sum(HS,x=>x.cost);
        add({id:'hs',cat:'equipe',tone:'warn',t:HS.length>1?`${HS.length} salariés font des heures sup chaque semaine`:`${HS[0].e.prenom} fait des heures sup chaque semaine`,s:`${HS.map(x=>`${esc(x.e.prenom)} +${dur(x.avg)} (contrat ${x.e.contrat} h)`).join(', ')} en moyenne sur les 4 dernières semaines. Environ ${eur(cost,0)} sur le mois. Ajuste les plannings ou les contrats.`,acts:[{l:'Planning',act:'nav',v:'planning'}],sc:cost/10});}
      if(!anyLate&&ptDays>=10)add({id:'ontime',cat:'equipe',tone:'ok',t:'Équipe à l’heure',s:`Aucun retard sur les 30 derniers jours (${ptDays} jours pointés).`,acts:[],sc:1});
    }

    /* ---- hygiène ---- */
    if(modOn('hygiene')&&S.hyg&&(S.hyg.temps||[]).length){
      const T=S.hyg.temps;const open=d14.filter(iso=>!isClosed((pdate(iso).getDay()+6)%7));
      const miss=open.filter(iso=>!T.some(t=>t.date===iso));
      if(miss.length>=3)add({id:'hyg-miss',cat:'hygiene',tone:miss.length>=6?'bad':'warn',t:`Relevés de température oubliés ${miss.length} jours sur ${open.length}`,s:`${miss.slice(-3).map(frDate).join(', ')}${miss.length>3?'…':''}. En cas de contrôle sanitaire, un jour sans relevé est un jour sans preuve.`,acts:[{l:'Températures',act:'go-mod',v:'hygiene',t:'temp'}],sc:miss.length});
      (S.hyg.equip||[]).forEach(eq=>{
        const bad=T.filter(t=>t.eq===eq.id&&t.date>=d14[0]&&hygBad(eq,t.val));
        if(bad.length>=2)add({id:'hyg-eq:'+eq.id,cat:'hygiene',tone:'bad',t:`${eq.nom} hors plage ${bad.length} fois en 2 semaines`,s:`${bad.slice(-3).map(t=>frDate(t.date)+' : '+nf(t.val,1)+' °C').join(' · ')} (plage ${eq.min} à ${eq.max} °C). Fais vérifier l’appareil (joint, thermostat, dégivrage) avant qu’un produit ne s’abîme.`,acts:[{l:'Températures',act:'go-mod',v:'hygiene',t:'temp'}],sc:bad.length*10});
      });
    }

    /* ---- fournisseurs ---- */
    if(can.stocks){
      const rec=S.orders.filter(o=>o.received&&o.received>=d30[0]);
      const byF={};rec.forEach(o=>{const x=byF[o.f]||(byF[o.f]={f:o.f,n:0,ec:0,av:0,late:0});x.n++;if(o.status==='recue_ecarts'){x.ec++;x.av+=o.avoir||0;}if(o.livraison&&o.received>o.livraison)x.late++;});
      Object.values(byF).forEach(x=>{
        if(x.ec>=2)add({id:'sup:'+x.f,cat:'fourn',tone:'warn',t:`${x.f} : ${x.ec} livraisons avec des écarts sur ${x.n}`,s:`Manquants, produits abîmés ou prix différents du bon de commande${x.av?`, ${eur(x.av)} d’avoirs au total`:''}. À aborder avec ton commercial.`,acts:[{l:'Commandes',act:'goto-stock',t:'suivi'}],sc:x.ec});
        else if(x.late>=2)add({id:'supl:'+x.f,cat:'fourn',tone:'info',t:`${x.f} livre souvent en retard`,s:`${x.late} livraisons après la date prévue sur ${x.n} ce mois.`,acts:[{l:'Commandes',act:'goto-stock',t:'suivi'}],sc:x.late});
      });
      const old=S.orders.filter(o=>o.avoirStatus==='a_demander'&&o.received&&o.received<=isoD(addDays(TODAY,-5)));
      if(old.length)add({id:'avoir',cat:'fourn',tone:'warn',t:`${eur(sum(old,o=>o.avoir||0))} d’avoirs pas encore demandés`,s:`${old.map(o=>esc(o.f)+' ('+frDate(o.received)+')').join(', ')}. Au-delà de quelques jours, le fournisseur les accorde rarement.`,acts:[{l:'Commandes',act:'goto-stock',t:'suivi'}],sc:sum(old,o=>o.avoir||0)});
    }

    return I.sort((a,b)=>(INS_RANK[a.tone]-INS_RANK[b.tone])||(b.sc||0)-(a.sc||0));
  });
}
const insSeen=id=>!!(S.seen&&S.seen[id]&&S.seen[id]>=isoD(addDays(TODAY,-7)));
function insVisible(){return insightsFor().filter(x=>!insSeen(x.id));}
function insCounts(list){return {bad:list.filter(x=>x.tone==='bad').length,warn:list.filter(x=>x.tone==='warn'||x.tone==='info').length,ok:list.filter(x=>x.tone==='ok').length};}
function memosOpen(){return (S.memos||[]).filter(m=>!m.done);}
function memoFor(R,id){return (R.memos||[]).filter(m=>m.ins===id&&m.at>=isoD(addDays(TODAY,-30))).slice(-1)[0]||null;}

function insCard(x,o){
  o=o||{};
  const acts=(x.acts||[]).map(a=>`<button class="btn sm ${a.primary?'primary':''}" data-act="${a.act}" ${a.id?`data-id="${a.id}"`:''} ${a.v?`data-v="${a.v}"`:''} ${a.t?`data-t="${a.t}"`:''} ${a.p?`data-p="${a.p}"`:''}>${esc(a.l)}</button>`).join('');
  const memo=o.R?memoFor(o.R,x.id):null;
  return `<article class="ins ${x.tone}"><span class="ico ${x.tone}">${ic(x.tone==='ok'?'trendUp':catIcon(x.cat),'s')}</span><div>
    <div class="eyebrow">${o.resto?`<b class="ins-r">${esc(o.resto)}</b> · `:''}${esc(catLabel(x.cat))}${x.tone==='bad'?' · urgent':''}</div>
    <b class="t">${esc(x.t)}</b><p>${x.s}</p>
    ${memo?`<div class="ins-flag ${memo.done?'ok':''}">${ic(memo.done?'check':'flag','s')} ${effRole()==='patron'?'Signalé par '+esc(memo.by||'le créateur'):'Signalé au directeur'} ${frDate(memo.at)}${memo.done?` · vu par ${esc(memo.done.by)} ${frDate(memo.done.at)}`:' · pas encore vu'}</div>`:''}
    <div class="acts">${o.net?`<button class="btn sm" data-act="ins-open" data-r="${o.R.id}">${ic('chevR','s')} Ouvrir ${esc(o.resto)}</button>${x.tone!=='ok'&&!(memo&&!memo.done)?`<button class="btn sm" data-act="ins-flag" data-r="${o.R.id}" data-id="${esc(x.id)}">${ic('flag','s')} Signaler au directeur</button>`:''}`:acts}${!o.net&&x.tone!=='ok'?`<button class="btn sm ghost" data-act="ins-seen" data-id="${esc(x.id)}">${ic('check','s')} Vu, je m’en occupe</button>`:''}</div>
  </div></article>`;
}
function insSections(list,o){
  const G=[['bad','À traiter en priorité'],['warn','À surveiller'],['ok','Ce qui marche']];
  return G.map(([k,l])=>{const L=list.filter(x=>k==='warn'?(x.tone==='warn'||x.tone==='info'):x.tone===k);if(!L.length)return '';
    return `<section class="panel ins-sec"><div class="panel-h"><h2>${l}</h2><span class="faint" style="font-size:12.5px">${L.length} point${L.length>1?'s':''}</span></div><div class="ins-list">${L.map(x=>insCard(x,o&&o.per?o.per(x):o)).join('')}</div></section>`;}).join('');
}
function insChips(list){
  const cats=Object.keys(INS_CAT).filter(c=>list.some(x=>x.cat===c));
  if(cats.length<2)return '';
  return `<div class="chips" role="group" aria-label="Filtrer par thème"><button class="chip" data-act="ins-cat" data-c="all" aria-pressed="${UI.ins.cat==='all'}">Tout · ${list.length}</button>${cats.map(c=>`<button class="chip" data-act="ins-cat" data-c="${c}" aria-pressed="${UI.ins.cat===c}">${ic(catIcon(c),'s')} ${esc(catLabel(c))} · ${list.filter(x=>x.cat===c).length}</button>`).join('')}</div>`;
}
function memosHTML(){
  const M=(S.memos||[]).filter(m=>!m.done||m.done.at>=isoD(addDays(TODAY,-3)));
  if(!M.length)return '';
  const who=(NET.config&&NET.config.adminName)||'Léon';const pat=effRole()==='patron';
  return `<section class="panel memo-p"><div class="panel-h"><h2>${ic('flag')} Message${M.length>1?'s':''} de ${esc(who)}</h2></div><div class="plist">${M.slice().reverse().map(m=>`<div class="prow"><span class="ico-s ${m.done?'ok':'warn'}">${ic(m.done?'check':'flag','s')}</span><div><b>${esc(m.t||'Point à regarder')}</b><small>${esc(m.m)} · ${frDate(m.at)}${m.done?` · vu par ${esc(m.done.by)}`:''}</small></div>${!m.done&&(pat||effRole()==='admin'&&U.viewAs)?`<button class="btn sm primary" data-act="memo-ok" data-id="${m.id}">C’est noté</button>`:m.done?'<span class="pill ok">Vu</span>':'<span class="pill warn">Pas encore vu</span>'}</div>`).join('')}</div></section>`;
}
function viewInfos(){
  const all=insightsFor();const vis=all.filter(x=>!insSeen(x.id));const hidden=all.length-vis.length;
  const list=UI.ins.seen?all:vis;
  const f=UI.ins.cat==='all'?list:list.filter(x=>x.cat===UI.ins.cat);
  const c=insCounts(vis);
  const enough=openOf(daysBack(1,14))>=5||EMP.some(e=>daysBack(1,14).some(iso=>evsOn(e.id,iso).length));
  return `<div class="ph"><div><h1>Infos importantes</h1><p class="sub">Léon analyse tout seul les 30 derniers jours de ${esc(S.nom)} : les problèmes qui reviennent (retards, ventes en baisse, pertes…) et ce qui marche. Pas besoin de fouiller.</p></div></div>
   ${memosHTML()}
   <div class="ins-sum">${c.bad?`<span class="pill bad"><span class="dot"></span>${plur(c.bad,'urgent')}</span>`:''}${c.warn?`<span class="pill warn">${c.warn} à surveiller</span>`:''}${c.ok?`<span class="pill ok">${plur(c.ok,'bonne nouvelle','bonnes nouvelles')}</span>`:''}${!vis.length&&enough?'<span class="pill ok">Rien à signaler</span>':''}</div>
   ${insChips(list)}
   ${f.length?insSections(f,{R:S}):`<div class="panel"><div class="empty"><h3>${enough?'Rien d’inquiétant':'Pas encore assez d’historique'}</h3><p>${enough?'Léon n’a repéré aucun problème récurrent. Il continue de surveiller.':'Léon a besoin d’environ deux semaines de ventes et de pointages pour repérer ce qui revient. Les infos apparaîtront ici toutes seules.'}</p></div></div>`}
   ${hidden?`<div class="more-row"><button class="btn ghost sm" data-act="ins-seen-toggle">${UI.ins.seen?'Masquer les points déjà vus':`Afficher les ${plur(hidden,'point déjà vu','points déjà vus')} (masqués 7 jours)`}</button></div>`:''}`;
}

/* ---------- réseau (créateur) ---------- */
function netReady(R){return R._loaded&&R._loaded.planning&&R._loaded.carte&&R._loaded.stock&&R._loaded.ventes;}
function netInsights(){
  const out=[];
  restoList().forEach(R=>{if(!netReady(R))return;withCtx(R,()=>insVisible().forEach(x=>out.push({...x,R,resto:R.nom})));});
  return out.sort((a,b)=>(INS_RANK[a.tone]-INS_RANK[b.tone])||(b.sc||0)-(a.sc||0));
}
function viewInfosNet(){
  const all=netInsights();const restos=restoList();
  const fr=UI.ins.rid==='all'?all:all.filter(x=>x.R.id===UI.ins.rid);
  const f=UI.ins.cat==='all'?fr:fr.filter(x=>x.cat===UI.ins.cat);
  const sumCards=`<div class="net-sum">${restos.map(R=>{const L=all.filter(x=>x.R.id===R.id);const c=insCounts(L);const pend=(R.memos||[]).filter(m=>!m.done).length;
    return `<button class="ns ${UI.ins.rid===R.id?'on':''}" data-act="ins-rid" data-r="${UI.ins.rid===R.id?'all':R.id}" aria-pressed="${UI.ins.rid===R.id}"><b>${esc(R.nom||'…')}</b><span class="row wrap" style="gap:5px">${!netReady(R)?'<span class="pill">Chargement…</span>':c.bad||c.warn?`${c.bad?`<span class="pill bad"><span class="dot"></span>${plur(c.bad,'urgent')}</span>`:''}${c.warn?`<span class="pill warn">${c.warn} à surveiller</span>`:''}`:'<span class="pill ok">Rien à signaler</span>'}${pend?`<span class="pill">${ic('flag','s')} ${pend} signalé${pend>1?'s':''}</span>`:''}</span></button>`;}).join('')}</div>`;
  const cats=Object.keys(INS_CAT).filter(c=>fr.some(x=>x.cat===c));
  const chips=cats.length>1?`<div class="chips"><button class="chip" data-act="ins-cat" data-c="all" aria-pressed="${UI.ins.cat==='all'}">Tout · ${fr.length}</button>${cats.map(c=>`<button class="chip" data-act="ins-cat" data-c="${c}" aria-pressed="${UI.ins.cat===c}">${ic((INS_CAT[c]||{}).i||'spark','s')} ${esc((INS_CAT[c]||{l:c}).l)} · ${fr.filter(x=>x.cat===c).length}</button>`).join('')}</div>`:'';
  return `<div class="ph"><div><h1>Infos importantes du réseau</h1><p class="sub">Ce que Léon a repéré dans tous tes établissements sur les 30 derniers jours. Tu vois le problème, tu le signales au directeur, tu suis s’il l’a vu.</p></div></div>
   ${sumCards}${chips}
   ${f.length?insSections(f,{per:x=>({net:true,R:x.R,resto:x.resto})}):`<div class="panel"><div class="empty"><h3>Rien à signaler</h3><p>Aucun problème récurrent ${UI.ins.rid==='all'?'dans ton réseau':'dans cet établissement'} pour l’instant.</p></div></div>`}`;
}
function viewStatsNet(){
  const P=statPeriod();
  const rows=restoList().map(R=>{if(!netReady(R))return {R,load:true};return withCtx(R,()=>{const P2=statPeriod();const {A,Ac,B}=periodCmp(P2);const c=insCounts(insVisible());return {R,A,Ac,B,c};});});
  const ok=rows.filter(r=>!r.load);
  const T={ht:sum(ok,r=>r.A.ht),ttc:sum(ok,r=>r.A.ttc),tk:sum(ok,r=>r.A.tk),cost:sum(ok,r=>r.A.cost),ms:sum(ok,r=>r.A.ms),loss:sum(ok,r=>r.A.loss),res:sum(ok,r=>r.A.res),fixed:sum(ok,r=>r.A.fixed)};
  const Tc=sum(ok,r=>r.Ac.ht),Tb=ok.every(r=>r.B)?sum(ok,r=>r.B.ht):null;
  const mx=Math.max(1,...ok.map(r=>r.A.ht));
  const kp=`<div class="kpis st-kpis">
    <div class="kpi"><div class="l">CA du réseau</div><div class="v">${eur(T.ht,0)}<small>HT</small></div><div class="s">${nf(T.tk)} tickets ${Tb?dchip(Tc,Tb):''}</div></div>
    <div class="kpi"><div class="l">Marge sur matière</div><div class="v">${eur(T.ht-T.cost,0)}</div><div class="s">Coût matière ${T.ht?pc(T.cost/T.ht):'—'}</div></div>
    <div class="kpi"><div class="l">Pertes</div><div class="v">${eur(T.loss,0)}</div><div class="s">${T.ht?pc(T.loss/T.ht)+' du CA':''}</div></div>
    <div class="kpi"><div class="l">Masse salariale</div><div class="v">${T.ht?pc(T.ms/T.ht):eur(T.ms,0)}</div><div class="s">${eur(T.ms,0)}</div></div>
    <div class="kpi res"><div class="l">${T.fixed?'Résultat estimé':'Reste avant charges fixes'}</div><div class="v ${T.ht?(T.res>=0?'pos':'neg'):''}">${T.ht?(T.res<0?'− ':'')+eur(Math.abs(T.res),0):'—'}</div><div class="s">tous établissements</div></div></div>`;
  const bars=`<section class="panel"><div class="panel-h"><h2>CA par établissement</h2></div><div class="panel-b">${ok.slice().sort((a,b)=>b.A.ht-a.A.ht).map(r=>`<div class="hb-row wide"><span class="hb-n">${esc(r.R.nom)}</span><span class="hb-track"><i style="width:${r.A.ht/mx*100}%"></i></span><span class="hb-v">${eur(r.A.ht,0)} ${r.B?dchip(r.Ac.ht,r.B.ht):''}</span></div>`).join('')||'<p class="faint">Chargement…</p>'}</div></section>`;
  const tbl=`<section class="panel"><div class="panel-h"><h2>Comparatif</h2><span class="faint" style="font-size:12.5px">Touche un établissement pour ouvrir ses statistiques</span></div><div class="tbl-wrap"><table class="tbl mgrid"><thead><tr><th>Établissement</th><th class="r">CA HT</th><th class="r">Évolution</th><th class="r">Tickets</th><th class="r">Ticket moyen</th><th class="r">Coût matière</th><th class="r">Masse sal.</th><th class="r">Pertes</th><th class="r">Résultat estimé</th><th class="r">Infos</th></tr></thead><tbody>
    ${rows.map(r=>r.load?`<tr><td><b>${esc(r.R.nom||'…')}</b></td><td class="r faint" colspan="9">Chargement…</td></tr>`:`<tr class="click" data-act="net-stats-open" data-r="${r.R.id}"><td><b>${esc(r.R.nom)}</b> <small class="faint">${esc(r.R.type||'')}</small></td><td class="r">${eur(r.A.ht,0)}</td><td class="r">${r.B?dchip(r.Ac.ht,r.B.ht):'—'}</td><td class="r">${nf(r.A.tk)}</td><td class="r">${r.A.tk?eur(r.A.tm):'—'}</td><td class="r">${r.A.ht?`<span class="pill ${withCtx(r.R,()=>ratioTone(r.A.fc))}">${pc(r.A.fc,0)}</span>`:'—'}</td><td class="r">${r.A.ht?pc(r.A.msr,0):'—'}</td><td class="r">${eur(r.A.loss,0)}</td><td class="r"><b class="${r.A.ht?(r.A.res>=0?'pos':'neg'):''}">${r.A.ht?(r.A.res<0?'− ':'')+eur(Math.abs(r.A.res),0):'—'}</b></td><td class="r nw">${r.c.bad?`<span class="pill bad">${r.c.bad}</span> `:''}${r.c.warn?`<span class="pill warn">${r.c.warn}</span>`:''}${!r.c.bad&&!r.c.warn?'<span class="pill ok">OK</span>':''}</td></tr>`).join('')}
    </tbody></table></div></section>`;
  return `<div class="ph"><div><h1>Statistiques du réseau</h1><p class="sub">Tous tes établissements côte à côte, sur la même période.</p></div></div>
   ${statBar(P,Tb?true:null,'')}${kp}<div class="stack">${bars}${tbl}</div>`;
}
function hubInfosBlock(){
  const all=netInsights();const c=insCounts(all);
  const top=all.filter(x=>x.tone!=='ok').slice(0,3);
  return `<section class="panel hub-ins"><div class="panel-h"><h2>${ic('bulb')} Infos importantes du réseau</h2><span class="row wrap" style="gap:6px">${c.bad?`<span class="pill bad"><span class="dot"></span>${plur(c.bad,'urgent')}</span>`:''}${c.warn?`<span class="pill warn">${c.warn} à surveiller</span>`:''}<button class="btn sm" data-act="nav" data-v="infos-net">Tout voir ${ic('chevR','s')}</button></span></div>
   ${top.length?`<div class="ins-list">${top.map(x=>insCard(x,{net:true,R:x.R,resto:x.resto})).join('')}</div>`:'<div class="empty" style="padding:22px">Rien d’inquiétant dans ton réseau pour l’instant.</div>'}</section>`;
}
function homeInfosBlock(title){
  const vis=insVisible();const top=vis.filter(x=>x.tone!=='ok').slice(0,3);const c=insCounts(vis);const pend=memosOpen().length;
  return `<section class="panel"><div class="panel-h"><h2>${ic('bulb')} ${esc(title)}</h2><span class="row wrap" style="gap:6px">${c.bad?`<span class="pill bad"><span class="dot"></span>${plur(c.bad,'urgent')}</span>`:''}${c.warn?`<span class="pill warn">${c.warn} à surveiller</span>`:''}<button class="btn ghost sm" data-act="nav" data-v="infos">Tout voir ${ic('chevR','s')}</button></span></div>
   ${pend?`<div class="memo-strip">${ic('flag','s')} ${plur(pend,'message','messages')} de ${esc((NET.config&&NET.config.adminName)||'Léon')} à lire</div>`:''}
   ${top.length?`<div class="ins-list">${top.map(x=>insCard(x,{R:S})).join('')}</div>`:'<div class="empty" style="padding:22px">Rien d’inquiétant sur les 30 derniers jours.</div>'}</section>`;
}
