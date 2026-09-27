
/* ---------- explications (bouton i) ---------- */
Object.assign(INFO,{
 margeMat:{t:'Marge sur matière',d:'Ce qu’il te reste une fois payés les ingrédients de tout ce que tu as vendu. Calculée avec tes fiches recettes et les prix de ta mercuriale.',f:'CA HT − Σ (coût matière d’une portion × portions vendues)',r:'Le coût matière doit rester proche de ton objectif. S’il monte, regarde les produits avec la pastille rouge dans le tableau.'},
 pertes:{t:'Pertes',d:'Ce qui est parti à la poubelle ou a disparu : les pertes déclarées (casse, DLC dépassée, plat renvoyé…) et les écarts négatifs à l’inventaire (ce qui manque au comptage sans explication).',f:'Σ pertes déclarées + Σ écarts négatifs d’inventaire',r:'En restauration, au-delà de 2 % du CA, il y a presque toujours une commande trop grosse ou un produit mal stocké.'},
 msPeriode:{t:'Masse salariale sur la période',d:'Le coût des heures travaillées (coût horaire chargé). Léon prend les heures pointées ; pour un jour sans pointage, il prend le planning.',f:'Σ (heures × coût horaire chargé) ÷ CA HT',r:'En brasserie on vise 30 à 35 % patron compris.'},
 resultat:{t:'Résultat estimé',d:'Une estimation de ce que le restaurant gagne vraiment sur la période, avant impôts. C’est un ordre de grandeur pour piloter, pas ta compta.',f:'CA HT − coût matière − masse salariale − pertes − charges fixes (au prorata des jours)',r:'Renseigne tes charges fixes (loyer, énergie, assurances…) une fois : Léon les répartit tout seul sur chaque jour.'},
});

/* ---------- graphique en colonnes (HTML, survol + clavier) ---------- */
function niceMax(v){if(!(v>0))return 1;const e=Math.pow(10,Math.floor(Math.log10(v)));const f=v/e;const n=[1,1.2,1.5,2,2.5,3,4,5,6,8,10].find(x=>f<=x+1e-9);return n*e;}
const axisEur=v=>v>=10000?nf(v/1000,0)+' k€':v>=1000?nf(v/1000,1).replace(/,0$/,'')+' k€':nf(v,0)+' €';
function colChart(pts,o){
  const n=pts.length;if(!n)return '';
  const max=niceMax(Math.max(...pts.map(p=>Math.max(p.v||0,p.pv||0))));
  const hasPv=pts.some(p=>p.pv!=null&&p.pv>0);
  let mi=0;pts.forEach((p,i)=>{if(p.v>pts[mi].v)mi=i;});
  return `<div class="vz" data-vz>
   <div class="vz-leg"><span><i class="k-bar"></i>${esc(o.cur)}</span>${hasPv?`<span><i class="k-line"></i>${esc(o.prev)}</span>`:''}</div>
   <div class="vz-plot">
    <div class="vz-grid" aria-hidden="true">${[0,max/2,max].map(t=>`<span style="bottom:${t/max*100}%"><em>${axisEur(t)}</em></span>`).join('')}</div>
    <div class="vz-cols" style="--n:${n}">${pts.map((p,i)=>`<button type="button" class="vz-col${p.part?' part':''}" data-t1="${esc(p.t1)}" data-t2="${esc(p.t2||'')}" data-t3="${esc(p.t3||'')}" aria-label="${esc((p.t2||'')+' : '+p.t1+(p.t3?' · '+p.t3:''))}"><span class="vz-bar${p.v>0?'':' z'}" style="height:${p.v>0?Math.max(p.v/max*100,1.2):0}%">${i===mi&&p.v>0?`<b class="vz-val">${esc(o.fmt(p.v))}</b>`:''}</span>${p.pv!=null&&p.pv>0?`<span class="vz-prev" style="bottom:${p.pv/max*100}%"></span>`:''}</button>`).join('')}</div>
   </div>
   <div class="vz-x" style="--n:${n}" aria-hidden="true">${pts.map(p=>`<span>${esc(p.x||'')}</span>`).join('')}</div>
  </div>`;
}
function vzTip(el){
  const vz=el.closest('[data-vz]');if(!vz)return;
  let tip=vz.querySelector('.vz-tip');if(!tip){tip=document.createElement('div');tip.className='vz-tip';vz.appendChild(tip);}
  tip.textContent='';
  const b=document.createElement('b');b.textContent=el.dataset.t1||'';
  const s=document.createElement('small');s.textContent=el.dataset.t2||'';
  tip.append(b,s);
  if(el.dataset.t3){const p=document.createElement('span');p.className='pv';const i=document.createElement('i');p.append(i,document.createTextNode(el.dataset.t3));tip.append(p);}
  tip.style.display='block';
  const r=el.getBoundingClientRect(),v=vz.getBoundingClientRect();const bar=el.querySelector('.vz-bar');
  const bt=bar&&bar.offsetHeight?bar.getBoundingClientRect().top:r.bottom-6;
  const w=tip.offsetWidth,h=tip.offsetHeight;
  const x=Math.max(w/2,Math.min(v.width-w/2,r.left+r.width/2-v.left));
  tip.style.left=x+'px';tip.style.top=Math.max(h+2,bt-v.top-8)+'px';
}
function vzHide(el){const vz=el&&el.closest&&el.closest('[data-vz]');const t=vz&&vz.querySelector('.vz-tip');if(t)t.style.display='none';}
document.addEventListener('pointerover',e=>{const c=e.target.closest&&e.target.closest('.vz-col');if(c)vzTip(c);});
document.addEventListener('pointerout',e=>{const c=e.target.closest&&e.target.closest('.vz-col');if(c&&!(e.relatedTarget&&c.contains(e.relatedTarget)))vzHide(c);});
document.addEventListener('focusin',e=>{const c=e.target.closest&&e.target.closest('.vz-col');if(c)vzTip(c);});
document.addEventListener('focusout',e=>{const c=e.target.closest&&e.target.closest('.vz-col');if(c)vzHide(c);});

/* barre 100 % à deux segments (midi/soir, sur place/à emporter) */
function splitBar(title,a,b,la,lb){
  const t=a+b;if(!(t>0))return '';const pa=a/t;
  return `<div class="sb"><div class="sb-t">${esc(title)}</div><div class="sb-bar" role="img" aria-label="${esc(`${la} ${pc(pa,0)}, ${lb} ${pc(1-pa,0)}`)}">${a>0?`<i class="s1" style="flex:${a}"></i>`:''}${b>0?`<i class="s2" style="flex:${b}"></i>`:''}</div>
   <div class="sb-leg"><span><i class="k s1"></i>${esc(la)} <b>${pc(pa,0)}</b> <small>${eur(a,0)}</small></span><span><i class="k s2"></i>${esc(lb)} <b>${pc(1-pa,0)}</b> <small>${eur(b,0)}</small></span></div></div>`;
}

/* ---------- barre de période ---------- */
function statBar(P,B,note){
  const opts=[['jour','Aujourd’hui'],['7j','7 derniers jours'],['mois','Ce mois-ci'],['mprec','Mois dernier']];
  const cmp=B?' · '+P.cmp:(P.prev.length&&P.prev[0]<histMin()?' · pas encore d’historique pour comparer':'');
  return `<div class="st-bar"><span class="seg" role="group" aria-label="Période">${opts.map(([k,l])=>`<button data-act="st-p" data-p="${k}" aria-pressed="${UI.st.p===k}">${l}</button>`).join('')}</span>
   <label class="st-date ${UI.st.p==='date'?'on':''}">${ic('calendar','s')}<span>Un jour précis</span><input class="inp" type="date" data-ch="st-date" min="${histMin()}" max="${TODAY_ISO}" value="${UI.st.p==='date'&&UI.st.date?UI.st.date:''}" aria-label="Choisir un jour"></label></div>
   <p class="st-cap">${esc(P.label)}${esc(cmp)}${note?' '+note:''}</p>`;
}

/* ---------- vue Statistiques ---------- */
function statKpis(A,Ac,B,can){
  const svc=isSvcBiz();
  const T=[];
  T.push(`<div class="kpi"><div class="l">Chiffre d’affaires</div><div class="v">${eur(A.ht,0)}<small>HT</small></div><div class="s">${eur(A.ttc,0)} TTC ${B?dchip(Ac.ht,B.ht):''}</div></div>`);
  T.push(`<div class="kpi"><div class="l">${svc?'Clients':'Tickets'}</div><div class="v">${nf(A.tk)}</div><div class="s">${svc?'Panier':'Ticket'} moyen ${A.tk?eur(A.tm):'—'} TTC ${B?dchip(Ac.tm,B.tm):''}</div></div>`);
  if(can.costs)T.push(`<div class="kpi"><div class="l">Marge sur ${svc?'produits':'matière'} ${infoBtn('margeMat')}</div><div class="v">${eur(A.marge,0)}</div><div class="s">${svc?'Coût produits':'Coût matière'} ${A.ht?pc(A.fc):'—'} · objectif ${pc(S.target,0)}</div>${A.ht?`<div class="meter"><i class="${ratioTone(A.fc)}" style="width:${clamp(A.fc/0.5*100,0,100)}%"></i><b style="left:${S.target/0.5*100}%"></b></div>`:''}</div>`);
  T.push(`<div class="kpi"><div class="l">Pertes ${infoBtn('pertes')}</div><div class="v">${eur(A.loss,0)}</div><div class="s">${A.ht?pc(A.loss/A.ht)+' du CA · ':''}${eur(A.lossDecl,0)} déclarées${A.lossInv>0.5?' · '+eur(A.lossInv,0)+' d’écart d’inventaire':''} ${B?dchip(Ac.loss,B.loss,'down'):''}</div></div>`);
  if(can.salaries)T.push(`<div class="kpi"><div class="l">Masse salariale ${infoBtn('msPeriode')}</div><div class="v">${A.ht?pc(A.msr):eur(A.ms,0)}</div><div class="s">${eur(A.ms,0)}${A.msMin?' · '+dur(A.msMin)+' pointées':''}</div>${A.ht?`<div class="meter"><i class="${A.msr<=0.32?'':A.msr<=0.36?'warn':'bad'}" style="width:${clamp(A.msr/0.5*100,0,100)}%"></i><b style="left:${0.32/0.5*100}%"></b></div>`:''}</div>`);
  if(can.salaries&&can.costs){
    const fx=A.fixed>0;const tone=A.ht?(A.res>=0?'pos':'neg'):'';
    T.push(`<div class="kpi res"><div class="l">${fx?'Résultat estimé':'Reste avant charges fixes'} ${infoBtn('resultat')}</div><div class="v ${tone}">${A.ht?(A.res<0?'− ':'')+eur(Math.abs(A.res),0):'—'}</div><div class="s">${A.ht?(A.res>=0?'<span class="dl ok">✓ tu gagnes de l’argent</span> ':'<span class="dl bad">! tu perds de l’argent</span> '):''}${fx?`après ${eur(A.fixed,0)} de charges fixes`:`<button class="lnk" data-act="charges-open">Ajouter mes charges fixes</button>`}</div></div>`);
  }
  return `<div class="kpis st-kpis">${T.join('')}</div>`;
}
function statChart(P,A,B){
  if(P.single){
    const d=daySum(P.cur[0]);const pd=P.prev[0]>=histMin()&&daySum(P.prev[0]).ht>0?daySum(P.prev[0]):null;
    const hs=Object.keys(d.hours).map(Number).filter(h=>d.hours[h]>0);
    if(hs.length<3)return '';
    let h0=Math.min(...hs),h1=Math.max(...hs);
    if(pd)Object.keys(pd.hours).map(Number).forEach(h=>{if(pd.hours[h]>0){h0=Math.min(h0,h);h1=Math.max(h1,h);}});
    const pts=[];for(let h=h0;h<=h1;h++){const v=d.hours[h]||0,pv=pd?(pd.hours[h]||0):null;pts.push({x:h+'h',v,pv,t1:eur(v,0)+' HT',t2:`De ${h}h à ${h+1}h`,t3:pd?`${P.vs} : ${eur(pv,0)}`:''});}
    return panelBlock('Chiffre d’affaires heure par heure',`<span class="faint" style="font-size:12.5px">Meilleure heure : ${(()=>{let b=h0;for(let h=h0;h<=h1;h++)if((d.hours[h]||0)>(d.hours[b]||0))b=h;return b+'h–'+(b+1)+'h';})()}</span>`,`<div class="panel-b">${colChart(pts,{cur:'Ce jour-là',prev:P.vs,fmt:v=>eur(v,0)})}</div>`);
  }
  const many=P.cur.length>10;
  const pts=P.cur.map((iso,i)=>{
    const d=daySum(iso);const piso=B?P.prev[i]:null;const pv=piso?daySum(piso).ht:null;const dd=pdate(iso);
    const x=!many?JC[(dd.getDay()+6)%7]+' '+dd.getDate():(dd.getDate()===1||dd.getDate()%5===0?String(dd.getDate()):'');
    return {x,v:d.ht,pv,part:iso===TODAY_ISO,t1:eur(d.ht,0)+' HT'+(iso===TODAY_ISO?' · en cours':''),t2:cap(dayShort(iso))+(d.tk?' · '+nf(d.tk)+' '+(isSvcBiz()?'client':'ticket')+(d.tk>1?'s':''):''),t3:piso?`${cap(dayShort(piso))} : ${eur(pv,0)}`:''};
  });
  let best=null;P.cur.forEach(iso=>{const d=daySum(iso);if(!best||d.ht>best.ht)best={iso,ht:d.ht};});
  const right=A.open?`<span class="faint" style="font-size:12.5px">${A.open} jour${A.open>1?'s':''} d’ouverture · moyenne ${eur(A.ht/A.open,0)} / jour${best&&best.ht?' · record '+dayShort(best.iso):''}</span>`:'';
  const tbl=`<details class="vz-tbl"><summary>Voir le détail jour par jour</summary><div class="tbl-wrap"><table class="tbl mgrid"><thead><tr><th>Jour</th><th class="r">CA HT</th><th class="r">${isSvcBiz()?'Clients':'Tickets'}</th><th class="r">${isSvcBiz()?'Panier':'Ticket'} moyen TTC</th>${B?`<th class="r">${esc(P.vs)}</th>`:''}</tr></thead><tbody>${P.cur.slice().reverse().map((iso)=>{const d=daySum(iso);const i=P.cur.indexOf(iso);const pv=B&&P.prev[i]?daySum(P.prev[i]).ht:null;return `<tr><td>${cap(dayShort(iso))}${iso===TODAY_ISO?' <small class="faint">en cours</small>':''}</td><td class="r">${eur(d.ht,0)}</td><td class="r">${nf(d.tk)}</td><td class="r">${d.tk?eur(d.ttc/d.tk):'—'}</td>${B?`<td class="r">${pv!=null?eur(pv,0):'—'}</td>`:''}</tr>`;}).join('')}</tbody></table></div></details>`;
  return panelBlock('Chiffre d’affaires jour par jour',right,`<div class="panel-b">${colChart(pts,{cur:'Cette période',prev:P.vs,fmt:v=>eur(v,0)})}${tbl}</div>`);
}
function prodRows(A,Ac,B){
  const tot=A.ht||1;
  return Object.values(A.by).filter(o=>o.q>0).map(o=>{const pb=B&&B.by[o.rid];const pc_=Ac.by[o.rid];return {...o,marge:o.ht-o.cost,ratio:o.ht?o.cost/o.ht:0,part:o.ht/tot,qc:pc_?pc_.q:0,pq:pb?pb.q:0};});
}
function statProducts(P,A,Ac,B,can){
  const svc=isSvcBiz();const W=svc?'Prestations':'Produits';
  const rows=prodRows(A,Ac,B);
  if(!rows.length)return panelBlock(W,'',`<div class="empty" style="padding:24px"><h3>Aucune vente sur cette période</h3><p>Le classement des ${svc?'prestations':'produits'} apparaît dès les premiers tickets.</p></div>`);
  const minQ=Math.max(2,Math.ceil(A.items*0.01));
  const best=rows.slice().sort((a,b)=>b.q-a.q)[0];
  const rent=rows.slice().sort((a,b)=>b.marge-a.marge)[0];
  const taux=rows.filter(r=>r.q>=minQ).sort((a,b)=>a.ratio-b.ratio)[0];
  let watch=null;
  const badR=rows.filter(r=>r.q>=minQ&&ratioTone(r.ratio)==='bad').sort((a,b)=>b.ratio-a.ratio)[0];
  if(badR)watch={r:badR,why:`${svc?'Coût produits':'Coût matière'} ${pc(badR.ratio)} : il te rapporte peu pour son prix`};
  else if(B){const dr=rows.filter(r=>r.pq>=5).map(r=>({r,d:(r.qc-r.pq)/r.pq})).sort((a,b)=>a.d-b.d)[0];if(dr&&dr.d<=-0.25)watch={r:dr.r,why:`Ventes ${pcs(dr.d)} par rapport à la période d’avant`};}
  const H=(i,eb,name,sub,tone)=>`<div class="hl ${tone||''}"><div class="eyebrow">${ic(i,'s')} ${eb}</div><b>${esc(name)}</b><small>${sub}</small></div>`;
  const hl=`<div class="hl-grid">
    ${H('up',svc?'La plus demandée':'Le plus vendu',best.n,`${nf(best.q)} ${saleWord(best.q)} · ${pc(best.part,0)} du CA`)}
    ${can.costs?H('euro','Te rapporte le plus',rent.n,`${eur(rent.marge,0)} de marge sur la période`):''}
    ${can.costs&&taux?H('check','Meilleur taux de marge',taux.n,`${pc(1-taux.ratio,0)} de marge sur chaque vente`):''}
    ${can.costs?(watch?H('alert','À surveiller',watch.r.n,esc(watch.why),'warn'):H('check','À surveiller','Rien d’inquiétant','Pas de marge trop faible ni de chute de ventes')):''}
  </div>`;
  const SORTS=[['q','Les plus vendus'],['marge','Les plus rentables'],['taux','Meilleur taux de marge'],['ht','Chiffre d’affaires']].filter(s=>can.costs||s[0]==='q'||s[0]==='ht');
  const k=SORTS.some(s=>s[0]===UI.st.sort)?UI.st.sort:'q';
  const sorted=rows.slice().sort((a,b)=>k==='taux'?(a.ratio-b.ratio)||(b.q-a.q):k==='marge'?b.marge-a.marge:k==='ht'?b.ht-a.ht:(b.q-a.q)||(b.ht-a.ht));
  const lim=UI.st.all?sorted:sorted.slice(0,12);
  const mxPart=Math.max(...rows.map(r=>r.part))||1;
  const evo=r=>!B?'—':r.pq>0?(()=>{const d=(r.qc-r.pq)/r.pq;return Math.abs(d)<0.005?'<span class="dl eq">=</span>':`<span class="dl ${d>0?'ok':'bad'}">${d>0?'▲':'▼'} ${nf(Math.abs(d)*100,0)} %</span>`;})():r.qc>0?'<span class="dl ok">nouveau</span>':'—';
  const tbl=`<div class="tbl-wrap"><table class="tbl st-prod mgrid"><thead><tr><th>${svc?'Prestation':'Produit'}</th><th class="r">${svc?'Réalisées':'Vendus'}</th><th class="r">CA HT</th><th>Part du CA</th>${can.costs?`<th class="r">${svc?'Coût produits':'Coût matière'}</th><th class="r">Marge</th>`:''}<th class="r">Évolution</th></tr></thead><tbody>
   ${lim.map(r=>`<tr><td><b>${esc(r.n)}</b></td><td class="r">${nf(r.q)}</td><td class="r">${eur(r.ht,0)}</td><td><span class="pbar"><i style="width:${r.part/mxPart*100}%"></i></span> <span class="tnum">${pc(r.part,0)}</span></td>${can.costs?`<td class="r"><span class="pill ${ratioTone(r.ratio)}">${pc(r.ratio,0)}</span></td><td class="r">${eur(r.marge,0)}</td>`:''}<td class="r">${evo(r)}</td></tr>`).join('')}
  </tbody></table></div>${sorted.length>12?`<div class="more-row"><button class="btn ghost sm" data-act="st-all">${UI.st.all?'Réduire':'Voir les '+sorted.length+' '+(svc?'prestations':'produits')} ${ic(UI.st.all?'up':'down','s')}</button></div>`:''}`;
  return `<section class="panel st-prodp"><div class="panel-h"><h2>${W}</h2><span class="seg" role="group" aria-label="Trier">${SORTS.map(([s,l])=>`<button data-act="st-sort" data-s="${s}" aria-pressed="${k===s}">${l}</button>`).join('')}</span></div><div class="panel-b">${hl}${tbl}</div></section>`;
}
function statSplit(A){
  const [n0,n1]=svcNames();const parts=[];
  if(A.svc[0]+A.svc[1]>0)parts.push(splitBar('Par moment de la journée',A.svc[0],A.svc[1],n0,n1));
  if(!isSvcBiz()){
    if(A.mode.sp+A.mode.emp>0)parts.push(splitBar('Sur place ou à emporter',A.mode.sp,A.mode.emp,'Sur place','À emporter'));
    else if(A.ht)parts.push(`<p class="st-note">${ic('spark','s')}Sur place / à emporter : Léon le lit sur chaque ticket dès que la caisse est branchée.</p>`);
  }
  const cats=Object.keys(A.cats).map(c=>({c,v:A.cats[c]})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  if(cats.length){const mx=cats[0].v;parts.push(`<div class="sb-t">Par catégorie</div>`+cats.map(x=>`<div class="hb-row"><span class="hb-n">${esc(RTYPE[x.c]?RTYPE[x.c].pl:'Autres')}</span><span class="hb-track"><i style="width:${x.v/mx*100}%"></i></span><span class="hb-v">${eur(x.v,0)} <small>${pc(x.v/(A.ht||1),0)}</small></span></div>`).join(''));}
  return panelBlock('Répartition du chiffre d’affaires','',`<div class="panel-b">${parts.join('')||'<div class="empty" style="padding:22px">Pas de vente sur la période.</div>'}</div>`);
}
const MOTIFS={casse:'Casse',dlc:'DLC dépassée',erreur:'Erreur / plat renvoyé',offert:'Offert / repas équipe',vol:'Disparu / vol',autre:'Autre'};
function statLosses(P,A,can){
  const list=(S.pertes||[]).filter(p=>p.date>=P.cur[0]&&p.date<=P.cur[P.cur.length-1]);
  const by={};list.forEach(p=>{const o=by[p.n]||(by[p.n]={n:p.n,val:0,cnt:0,m:{}});o.val+=p.val||0;o.cnt++;o.m[p.motif]=(o.m[p.motif]||0)+1;});
  const top=Object.values(by).sort((a,b)=>b.val-a.val).slice(0,5);
  const mx=top.length?top[0].val:1;
  const body=`${top.length?`<div class="sb-t">Ce qui part le plus à la poubelle</div>${top.map(o=>`<div class="hb-row"><span class="hb-n">${esc(o.n)}<small>${Object.keys(o.m).map(k=>o.m[k]+' × '+(MOTIFS[k]||k).toLowerCase()).join(', ')}</small></span><span class="hb-track"><i class="loss" style="width:${o.val/mx*100}%"></i></span><span class="hb-v">${eur(o.val,0)}</span></div>`).join('')}`:`<p class="muted" style="font-size:13.5px">Aucune perte déclarée sur la période.</p>`}
   ${A.lossInv>0.5?`<p class="st-note">${ic('box','s')}<span><b>${eur(A.lossInv,0)}</b> d’écart d’inventaire : des produits manquent au comptage sans avoir été déclarés.</span></p>`:''}
   ${list.length?`<div class="sb-t" style="margin-top:14px">Dernières déclarations</div><div class="plist flat">${list.slice().sort((a,b)=>(b.date+b.at).localeCompare(a.date+a.at)).slice(0,5).map(p=>`<div class="prow"><span class="mono faint" style="font-size:12px">${esc(dayShort(p.date))}</span><div><b>${esc(p.n)} · ${nf(p.q,p.q%1?2:0)} ${esc(p.u==='portion'&&p.q>1?'portions':(p.u||''))}</b><small>${esc(MOTIFS[p.motif]||p.motif)} · ${esc(p.by||'')}${p.note?' · « '+esc(p.note)+' »':''}</small></div><span class="row" style="gap:6px"><b class="tnum">${eur(p.val)}</b>${can.board?`<button class="icon-btn" data-act="perte-del" data-id="${p.id}" aria-label="Supprimer cette perte">${ic('trash','s')}</button>`:''}</span></div>`).join('')}</div>`:''}`;
  return panelBlock('Pertes',can.board?`<button class="btn sm" data-act="perte-new">${ic('plus','s')} Déclarer une perte</button>`:'',`<div class="panel-b">${A.ht&&A.loss?`<p class="st-big"><b>${eur(A.loss)}</b> perdus · ${pc(A.loss/A.ht)} du CA</p>`:''}${body}</div>`);
}
function statTeam(P,A){
  if(!EMP.length)return '';
  const rows=EMP.map(e=>{let min=0,late=0,lateMin=0,miss=0;P.cur.forEach(iso=>{min+=workedMin(evsOn(e.id,iso),iso===TODAY_ISO);const L=empLates(e,iso);late+=L.length;lateMin+=sum(L);if(empMissed(e,iso))miss++;});return {e,min,late,lateMin,miss};}).filter(r=>r.min||r.late||r.miss).sort((a,b)=>b.late-a.late||b.min-a.min);
  if(!rows.length)return panelBlock('Équipe','',`<div class="empty" style="padding:22px">Pas encore de pointage sur cette période.</div>`);
  return panelBlock('Équipe',`<span class="faint" style="font-size:12.5px">${dur(A.msMin)} pointées · ${eur(A.ms,0)}${A.ht?' · '+pc(A.msr)+' du CA':''}</span>`,`<div class="tbl-wrap"><table class="tbl mgrid"><thead><tr><th>Salarié</th><th class="r">Heures pointées</th><th class="r">Retards</th><th class="r">Services sans pointage</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.e.prenom)} ${esc(r.e.nom||'')}</b> <small class="faint">${esc(r.e.titre||'')}</small></td><td class="r">${dur(r.min)}</td><td class="r">${r.late?`<span class="pill ${r.late>=3?'bad':'warn'}">${r.late} · ${durShort(r.lateMin)}</span>`:'<span class="faint">0</span>'}</td><td class="r">${r.miss?`<span class="pill warn">${r.miss}</span>`:'<span class="faint">0</span>'}</td></tr>`).join('')}</tbody></table></div>`);
}
function emptyMsg(P,prov){
  const ever=(S.ventes||[]).length>0||Object.keys(S.hist||{}).some(k=>(S.hist[k]||[]).length);
  if(P.single){const wd=(pdate(P.cur[0]).getDay()+6)%7;if(isClosed(wd))return `<b>Fermé ce jour-là</b><p>${esc(S.nom)} est fermé le ${JOURS[wd].toLowerCase()}. Choisis un autre jour.</p>`;}
  if(ever)return P.p==='jour'?`<b>Pas encore de vente aujourd’hui</b><p>Les tickets arrivent ici en direct pendant le service.</p>`:`<b>Aucune vente sur cette période</b><p>Rien n’a été encaissé sur ces dates.</p>`;
  return `<b>Pas encore de vente enregistrée</b><p>Dès que ${esc(prov)} est ${S.caisse&&S.caisse.status==='connected'?'relié':'branché'}, chaque ticket arrive ici tout seul : CA, produits, sur place ou à emporter. ${CAN().sim?'En attendant, le simulateur de caisse (Service en direct) permet de tester.':''}</p>`;
}
function viewStats(){
  const can=CAN();const P=statPeriod();const {A,Ac,B}=periodCmp(P);
  const empty=!A.ht&&!A.tk;
  const prov=S.caisse&&S.caisse.provider?S.caisse.provider:'ta caisse';
  return `<div class="ph"><div><h1>Statistiques</h1><p class="sub">Les chiffres de ${esc(S.nom)} : ce que tu as vendu, gagné et perdu, et ce qui marche le mieux.</p></div><div class="acts">${can.board?`<button class="btn" data-act="perte-new">${ic('trash','s')} Déclarer une perte</button>`:''}${can.settings?`<button class="btn" data-act="charges-open">${ic('euro','s')} Charges fixes</button>`:''}</div></div>
   ${statBar(P,B)}
   ${empty?`<div class="st-empty">${ic('chart')}<div>${emptyMsg(P,prov)}</div></div>`:''}
   ${statKpis(A,Ac,B,can)}
   <div class="stack">${statChart(P,A,B)}
   ${statProducts(P,A,Ac,B,can)}
   <div class="grid2e">${statSplit(A)}${statLosses(P,A,can)}</div>
   ${can.salaries?statTeam(P,A):''}</div>`;
}
