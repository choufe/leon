/* =========================================================
   V14 · LA MARCHANDISE, FAÇON INPULSE (EN PLUS SIMPLE)
   Décidé avec Maurice le 9 nov. après l'analyse d'Inpulse (son compte Burgouzz) :
   « les commandes c'est très bien, l'inventaire aussi », mais on s'y perd.
   On reprend le meilleur, sans le reste :
   1. Les colis : chaque produit peut se commander « au fût de 30 L », « au carton de 6 »…
   2. Commander : une carte par fournisseur (prochaine livraison, ce que Léon conseille),
      puis UN écran de commande : jour de livraison en un clic, minimum de commande,
      tout le catalogue du fournisseur avec le conseil de Léon, et le stock prévu soir par soir.
   3. Vérifier avant d'envoyer : un récap clair (jour, produits, total, ruptures oubliées).
   4. L'avoir : le mail de demande d'avoir est prêt après une réception avec écarts.
   5. Tablette : la réception d'une commande se fait produit par produit, avec de gros boutons.
   6. Inventaire : on compte aussi en colis (« +1 fût »).
   7. Où part ta marchandise : pertes déclarées + écarts d'inventaire, par famille, sur 30 jours.
   ========================================================= */

/* ---------- 1. les colis ---------- */
const COLIS_NOMS=['carton','sac','fût','filet','caisse','plateau','bidon','paquet','pack','barquette','sachet','boîte','seau','bouteille','colis'];
const colisOf=i=>i&&+i.pack>1?{q:+i.pack,l:i.packL||'colis'}:null;
const v14Pl=(n,w)=>n>1&&!/[sxz]$/.test(w)?w+'s':w;
function colisLabel(i){const c=colisOf(i);return c?`${c.l} de ${qtyFmt(c.q,i.u)}`:'';}
function v14Q(q,u){ // quantité arrondie et lisible (plus de « 22,38 pc »)
  if(u==='pièce'||u==='botte'){const n=Math.round(q*10)/10;return qtyFmt(n%1?+n.toFixed(1):n,u);}
  if(u==='kg'||u==='L'){if(q>=10)return qtyFmt(Math.round(q),u);if(q>=1)return qtyFmt(Math.round(q*10)/10,u);return qtyFmt(q,u);}
  return qtyFmt(q,u);
}
function colisFmt(q,i){const c=colisOf(i);if(!c||!(q>0))return v14Q(q,i.u);const n=q/c.q;if(Math.abs(n-Math.round(n))<1e-6)return `${nf(Math.round(n))} ${v14Pl(Math.round(n),c.l)} · ${v14Q(q,i.u)}`;return v14Q(q,i.u);}
function colisShort(q,i){const c=colisOf(i);if(!c)return v14Q(q,i.u);const n=q/c.q;if(Math.abs(n-Math.round(n))<1e-6)return `${nf(Math.round(n))} ${v14Pl(Math.round(n),c.l)}`;return v14Q(q,i.u);}
const v14Step=i=>{const c=colisOf(i);return c?c.q:invStep(i);};
// Démo : des conditionnements réalistes (sans toucher aux vrais restos)
const V14_DEMO_PACKS={fut_blonde:[30,'fût'],pdt:[10,'sac'],oignon:[5,'sac'],moules:[5,'filet'],huile_friture:[10,'bidon'],farine:[25,'sac'],oeuf:[30,'plateau'],pain_burger:[24,'carton'],creme:[6,'carton'],lait:[6,'pack'],tomate:[5,'caisse'],biere_brune:[6,'carton'],biere_blonde:[6,'carton'],papier_wc:[24,'paquet'],sacs_poubelle:[3,'paquet'],essuie_mains:[6,'paquet'],sucre:[5,'paquet'],cassonade:[5,'paquet'],huile_colza:[5,'bidon']};
function v14DemoPacks(){
  if(typeof DEMO==='undefined'||!DEMO||!S||!S.ingredients||S._v14p)return;
  S.ingredients.forEach(i=>{const p=V14_DEMO_PACKS[i.id];if(p&&!(i.pack>1)){i.pack=p[0];i.packL=p[1];}});
  S._v14p=true;
}

/* ---------- 2. livraisons, conseil de Léon, stock prévu ---------- */
function delivDays(f,n){ // prochains jours où ce fournisseur peut livrer (délai respecté)
  const s=supInfo(f);const delai=s.delai!=null?+s.delai:1;const J=(s.jours||[]).map(Number);const out=[];
  let d=addDays(TODAY,Math.max(0,delai));
  for(let k=0;k<40&&out.length<(n||6);k++){const wd=(d.getDay()+6)%7;if(!J.length||J.includes(wd))out.push(new Date(d));d=addDays(d,1);}
  return out;
}
function coverEnd(f,D){ // la livraison d'après : la commande doit tenir jusque-là
  const J=(supInfo(f).jours||[]).map(Number);let d=addDays(D,1);
  for(let k=0;k<14;k++){const wd=(d.getDay()+6)%7;if(!J.length||J.includes(wd))return d;d=addDays(d,1);}
  return addDays(D,1);
}
const v14Open=o=>o&&(o.status==='envoyee'||o.status==='brouillon');
function arrivals(id,iso,exclId){return sum(S.orders.filter(o=>v14Open(o)&&o.id!==exclId&&o.livraison===iso),o=>sum(o.lines.filter(l=>l.id===id),l=>+l.q||0));}
function recoQty(i,f,D,exclId){
  if(!i||i.noStock)return 0;
  const E=coverEnd(f,D);let need=0;
  for(let d=new Date(TODAY);d<E;d=addDays(d,1))need+=useOn(d,i.id);
  let pend=0;S.orders.filter(o=>v14Open(o)&&o.id!==exclId&&o.livraison&&o.livraison<isoD(E)).forEach(o=>o.lines.forEach(l=>{if(l.id===i.id)pend+=+l.q||0;}));
  const safety=Math.max(i.mn||0,need*0.1);
  let q=need+safety-(i.st+pend);
  if(q<=0.001&&i.st<(i.mn||0)&&!pend)q=(i.par||i.mn*2)-i.st;
  if(q<=0.001)return 0;
  const st=v14Step(i);return +(Math.ceil(q/st-1e-9)*st).toFixed(3);
}
function projection(i,o,qThis){ // stock le soir, jour par jour, jusqu'à la livraison suivante
  const D=pdate(o.livraison||TODAY_ISO);const E=coverEnd(o.f,D);const out=[];let v=+i.st||0;
  for(let d=new Date(TODAY);d<E;d=addDays(d,1)){const iso=isoD(d);const arr=arrivals(i.id,iso,o.id)+(iso===o.livraison?(+qThis||0):0);v=v+arr-useOn(d,i.id);out.push({d:new Date(d),iso,v,arr});}
  return out;
}
function v14Rupture(i,o,q){const P=projection(i,o,q);const r=P.find(x=>x.v<=0.0001);return r||null;}
const v14Cat=i=>ICAT[i.c]||'Autres';
const supProducts=f=>S.ingredients.filter(i=>!i.noStock&&i.f===f).sort((a,b)=>v14Cat(a).localeCompare(v14Cat(b),'fr')||a.n.localeCompare(b.n,'fr'));
const v14DayLong=d=>{const n=Math.round((d-TODAY)/864e5);const j=JC[(d.getDay()+6)%7].toLowerCase()+'. '+d.getDate()+' '+MC[d.getMonth()];return n===0?'aujourd’hui, '+j:n===1?'demain, '+j:j;};
const v14Day=d=>{const n=Math.round((d-TODAY)/864e5);return n===0?'aujourd’hui':n===1?'demain':JC[(d.getDay()+6)%7].toLowerCase()+'.';};

/* ---------- 3. onglet « Commander » : une carte par fournisseur ---------- */
function supPlan(f){
  const days=delivDays(f,1);const D=days[0]||addDays(TODAY,1);const prods=supProducts(f);
  const lines=prods.map(i=>({i,q:recoQty(i,f,D,null)})).filter(l=>l.q>0);
  const draft=S.orders.find(o=>o.f===f&&o.status==='brouillon');const sent=S.orders.filter(o=>o.f===f&&o.status==='envoyee');
  const low=prods.filter(i=>{const s=stockStatus(i);return s&&s.k!=='ok';}).length;
  const s=supInfo(f);const delai=s.delai!=null?+s.delai:1;const orderBy=addDays(D,-Math.max(0,delai));
  return {f,D,E:coverEnd(f,D),lines,tot:sum(lines,l=>l.q*l.i.p),draft,sent,low,n:prods.length,orderBy};
}
ordersHTML=function(){
  const sups=supplierNames().filter(f=>supProducts(f).length).map(supPlan);
  sups.sort((a,b)=>(b.draft?1:0)-(a.draft?1:0)||(b.lines.length?1:0)-(a.lines.length?1:0)||a.D-b.D||a.f.localeCompare(b.f,'fr'));
  const can=CAN();const nReco=sups.filter(p=>p.lines.length).length;
  const card=p=>{const s=supInfo(p.f);const fr=+s.franco||0;
    const etat=p.draft?`<span class="pill info"><span class="dot"></span>Brouillon en cours · ${eur(orderTotal(p.draft),0)}</span>`:p.lines.length?`<span class="pill brass">${ic('spark','s')} Léon conseille ${plur(p.lines.length,'produit')}</span>`:`<span class="pill ok"><span class="dot"></span>Rien à commander</span>`;
    return `<button class="v14-sup ${p.lines.length||p.draft?'on':''}" data-act="v14-cmd" data-f="${esc(p.f)}">
      <span class="v14-sup-h"><span class="v14-sup-ic">${ic('truck')}</span><span><b>${esc(p.f)}</b><small>${plur(p.n,'produit')}${p.sent.length?` · ${plur(p.sent.length,'livraison attendue','livraisons attendues')}`:''}</small></span></span>
      <span class="v14-sup-l"><span class="faint">Prochaine livraison</span><b>${v14DayLong(p.D)}</b></span>
      <span class="v14-sup-l"><span class="faint">Pour cette livraison, commande</span><b>${p.orderBy<=TODAY?'aujourd’hui':'avant '+frDate(isoD(p.orderBy))}</b></span>
      ${p.lines.length&&!p.draft?`<span class="v14-sup-l"><span class="faint">Montant estimé</span><b>≈ ${eur(p.tot,0)} HT</b></span>`:''}
      <span class="v14-sup-f">${etat}${p.low?` <span class="pill warn">${p.low} sous le seuil</span>`:''}${fr?` <small class="faint">minimum ${eur(fr,0)}</small>`:''}</span>
      <span class="v14-sup-go">${p.draft?'Reprendre':'Commander'} ${ic('chevR','s')}</span></button>`;};
  return `<div class="v14-intro"><p class="muted">${nReco?`Léon a regardé tes ventes, ton stock et ce qui est déjà commandé : <b>${plur(nReco,'fournisseur')}</b> à commander.`:'Ton stock tient jusqu’aux prochaines livraisons. Tu peux quand même passer une commande.'} Choisis un fournisseur, Léon prépare la commande, tu vérifies et tu envoies. ${infoBtn('cmdSmart')}</p></div>
   <div class="v14-sups">${sups.map(card).join('')||`<div class="panel"><div class="empty"><h3>Pas encore de fournisseur</h3><p>Ajoute tes produits avec leur fournisseur : Léon pourra préparer tes commandes.</p></div></div>`}</div>
   ${can.stocks?`<p class="faint" style="font-size:12.5px;margin-top:12px">Jours de livraison, délai et minimum de commande : onglet <button class="linkish" data-act="stock-tab" data-t="fourn">Fournisseurs</button>.</p>`:''}`;
};
Object.assign(INFO,{cmdSmart:{t:'Le conseil de Léon',d:'Pour chaque produit, Léon calcule ce qui va partir d’ici la livraison suivante (les ventes des 4 derniers mêmes jours de la semaine, passées dans tes fiches techniques), ajoute une petite marge, enlève ce que tu as en stock et ce qui est déjà commandé.',f:'Conseil = conso prévue + marge de sécurité − stock − déjà commandé, arrondi au colis',r:'Plus tes fiches et tes inventaires sont justes, plus le conseil est juste. La marge de sécurité, c’est ton seuil mini.'},
  stockPrevu:{t:'Stock prévu le soir',d:'Ce qu’il devrait te rester chaque soir après la fermeture : le stock d’aujourd’hui, plus ce qui arrive (cette commande et celles déjà passées), moins ce que Léon prévoit de vendre.',r:'Une barre rouge = rupture avant la prochaine livraison. Ajoute un colis.'}});

Object.assign(ACT,{
  'v14-cmd'(t){const f=t.dataset.f;let o=S.orders.find(x=>x.f===f&&x.status==='brouillon');
    if(!o){const p=supPlan(f);o=newOrder(f,p.lines.map(l=>({id:l.i.id,q:l.q})));o.livraison=isoD(p.D);o.v14=true;save();}
    UI.stock.order=o.id;UI.stock.recv=null;UI.v14={open:{}};renderView();window.scrollTo({top:0});},
});

/* ---------- 4. l'écran de la commande (brouillon) ---------- */
UI.v14=UI.v14||{open:{}};
function v14Draft(o){
  const sup=supInfo(o.f);const fr=+sup.franco||0;const tot=orderTotal(o);const D=pdate(o.livraison||TODAY_ISO);const E=coverEnd(o.f,D);
  const days=delivDays(o.f,6);if(o.livraison&&!days.some(d=>isoD(d)===o.livraison))days.unshift(D);days.sort((a,b)=>a-b);
  const other=iso=>S.orders.some(x=>x.id!==o.id&&x.f===o.f&&x.status==='envoyee'&&x.livraison===iso);
  const prods=supProducts(o.f);const extra=o.lines.map(l=>ING(l.id)).filter(i=>i&&i.f!==o.f);
  const qOf=id=>{const l=o.lines.find(x=>x.id===id);return l?+l.q:0;};
  const nColis=sum(o.lines,l=>{const i=ING(l.id);const c=colisOf(i);return c?l.q/c.q:0;});
  const row=i=>{const q=qOf(i.id);const reco=recoQty(i,o.f,D,o.id);const c=colisOf(i);const st=stockStatus(i);const open=UI.v14.open[i.id];const rup=v14Rupture(i,o,q);
    const shown=c?+(q/c.q).toFixed(2):q;
    return `<div class="v14-l ${q>0?'on':''} ${open?'open':''}">
      <button class="v14-n" data-act="v14-open" data-id="${i.id}" aria-expanded="${!!open}"><b>${esc(i.n)}</b><small>${c?esc(colisLabel(i)):esc(unitShort(i.u))} · <span class="v14-chg" data-act="v14-colis" data-id="${i.id}" role="button" tabindex="0">${c?'changer':'colis ?'}</span>${st&&st.k!=='ok'?` · <span class="tx-warn">${st.l.toLowerCase()}</span>`:''}${rup&&rup.d<E?` · <span class="tx-bad">rupture ${v14Day(rup.d)}</span>`:''}</small></button>
      <span class="v14-c v14-st"><small>En stock</small>${v14Q(i.st,i.u)}</span>
      <span class="v14-c v14-rc">${reco>0?`<button class="v14-reco ${Math.abs(reco-q)<1e-6?'ok':''}" data-act="v14-reco" data-id="${i.id}" data-q="${reco}" title="Mettre le conseil de Léon">${ic('spark','s')} ${esc(colisShort(reco,i))}</button>`:'<span class="faint">—</span>'}</span>
      <span class="v14-c v14-q"><span class="v14-step"><button data-act="v14-step" data-id="${i.id}" data-d="-1" aria-label="Moins" ${q>0?'':'disabled'}>−</button><input type="number" inputmode="decimal" min="0" step="${c?1:invStep(i)}" value="${q>0?shown:''}" placeholder="0" data-ch="v14-q" data-id="${i.id}" aria-label="Quantité de ${esc(i.n)}"><button data-act="v14-step" data-id="${i.id}" data-d="1" aria-label="Plus">+</button></span><small>${c?esc(v14Pl(2,c.l).replace(/s$/,'(s)')):esc(unitShort(i.u))}</small></span>
      <span class="v14-c v14-m">${q>0?eur(q*linePu(o.lines.find(x=>x.id===i.id)||{pu:i.p})):'<span class="faint">—</span>'}</span>
      ${open?`<div class="v14-proj">${projHTML(i,o,q)}</div>`:''}</div>`;};
  const cats=[...new Set(prods.map(v14Cat))];
  const body=cats.map(c=>`<div class="v14-cat">${esc(c)}</div>${prods.filter(i=>v14Cat(i)===c).map(row).join('')}`).join('')+(extra.length?`<div class="v14-cat">Autres fournisseurs</div>${extra.map(row).join('')}`:'');
  const addable=S.ingredients.filter(i=>!i.noStock&&i.f!==o.f&&!o.lines.some(l=>l.id===i.id)).sort((a,b)=>a.n.localeCompare(b.n,'fr'));
  const recoN=prods.filter(i=>recoQty(i,o.f,D,o.id)>0).length;
  return `<button class="back" data-act="ord-back">${ic('chevL','s')} Commandes</button>
  <div class="ph"><div><div class="eyebrow">Commande · brouillon</div><h1>${esc(o.f)}</h1><p class="sub">Préparée ${frDate(o.created)} par ${esc(o.by||'')}${sup.email?' · '+esc(sup.email):''}</p></div>
   <div class="acts"><button class="btn danger" data-act="ord-del" data-id="${o.id}">${ic('trash','s')} Supprimer</button><button class="btn primary" data-act="ord-send" data-id="${o.id}" ${o.lines.length?'':'disabled'}>${ic('send','s')} Vérifier et envoyer</button></div></div>
  <section class="panel v14-liv"><div class="panel-b">
    <div class="v14-liv-h"><b>${ic('truck','s')} Jour de livraison</b><span class="faint">Livre ${(sup.jours||[]).length?(sup.jours||[]).map(d=>JC[d].toLowerCase()).join(', '):'tous les jours'} · commande ${sup.delai!=null?(+sup.delai?+sup.delai+' j avant':'le jour même'):'la veille'}</span></div>
    <div class="v14-days">${days.map(d=>{const iso=isoD(d);return `<button class="v14-day ${iso===o.livraison?'on':''}" data-act="v14-day" data-id="${o.id}" data-d="${iso}"><small>${v14Day(d)}</small><b>${JC[(d.getDay()+6)%7]} ${d.getDate()}</b>${other(iso)?'<em>déjà 1 commande</em>':''}</button>`;}).join('')}
      <label class="v14-day v14-other"><small>autre date</small><input type="date" min="${TODAY_ISO}" value="${o.livraison||''}" data-ch="od-liv" data-id="${o.id}" aria-label="Autre date de livraison"></label></div>
    <p class="v14-cover">${ic('clock','s')} Cette commande doit tenir jusqu’à la livraison suivante : <b>${longDate(E).toLowerCase()}</b>.</p>
    ${fr?`<div class="v14-franco ${tot>=fr?'ok':''}"><div class="meter"><i style="width:${Math.min(100,tot/fr*100)}%"></i></div><span>${tot>=fr?`${ic('check','s')} Minimum de commande atteint (${eur(fr,0)})`:`Il manque <b>${eur(fr-tot)}</b> pour le minimum de commande (${eur(fr,0)})`}</span></div>`:''}
    <div class="field v14-note"><label for="od-note">Note pour le fournisseur (facultatif)</label><input class="inp" id="od-note" data-ch="od-note" data-id="${o.id}" value="${esc(o.note||'')}" placeholder="Ex. livrer avant 10 h, porte de derrière"></div>
  </div></section>
  <div class="v14-bar"><span class="muted">${recoN?`${ic('spark','s')} Léon conseille ${plur(recoN,'produit')} pour tenir jusqu’au ${E.getDate()} ${MC[E.getMonth()]}`:'Léon ne voit rien à commander : ton stock tient.'} Touche un produit pour voir son stock prévu.</span>${recoN?`<button class="btn sm" data-act="v14-reco-all" data-id="${o.id}">${ic('spark','s')} Remettre les conseils de Léon</button>`:''}</div>
  <section class="panel v14-tbl"><div class="v14-l v14-head"><span>Produit</span><span class="v14-c v14-st">En stock</span><span class="v14-c v14-rc">Conseil ${infoBtn('cmdSmart')}</span><span class="v14-c v14-q">Commande</span><span class="v14-c v14-m">Montant</span></div>${body||'<div class="empty">Aucun produit chez ce fournisseur.</div>'}
   <div class="v14-add"><select class="inp" id="od-add" aria-label="Ajouter un produit d’un autre fournisseur"><option value="">Ajouter un produit d’un autre fournisseur…</option>${addable.map(i=>`<option value="${i.id}">${esc(i.n)} · ${esc(i.f||'')}</option>`).join('')}</select><button class="btn sm" data-act="od-add" data-id="${o.id}">${ic('plus','s')} Ajouter</button></div></section>
  <div class="v14-foot"><span><b>${plur(o.lines.length,'produit')}</b>${nColis?` · ${nf(Math.round(nColis))} colis`:''} · <b>${eur(tot)} HT</b></span><button class="btn primary" data-act="ord-send" data-id="${o.id}" ${o.lines.length?'':'disabled'}>${ic('send','s')} Vérifier et envoyer</button></div>`;
}
function projHTML(i,o,q){
  const P=projection(i,o,q);const mx=Math.max(...P.map(x=>x.v),i.mn||0,0.001);
  const E=coverEnd(o.f,pdate(o.livraison||TODAY_ISO));const R=P.find(x=>x.v<=0.0001);const before=R&&o.livraison&&R.iso<o.livraison;
  return `<div class="v14-proj-h"><b>Stock prévu le soir ${infoBtn('stockPrevu')}</b><span class="faint">seuil ${v14Q(i.mn||0,i.u)} · livraison suivante ${v14DayLong(E)}</span></div>
  <div class="v14-bars">${P.map(x=>{const h=Math.max(3,Math.min(100,x.v/mx*100));const cls=x.v<=0.0001?'bad':x.v<(i.mn||0)?'warn':'ok';return `<div class="v14-b ${cls}"><span class="v14-bv">${x.v<=0.0001?'0':v14Q(x.v,i.u)}</span><i style="height:${x.v<=0.0001?3:h}%"></i>${x.arr>0?`<em title="Livraison">${ic('truck','s')}</em>`:''}<small>${x.iso===TODAY_ISO?'auj.':JC[(x.d.getDay()+6)%7].toLowerCase()+' '+x.d.getDate()}</small></div>`;}).join('')}</div>
  ${R?`<p class="tx-bad" style="font-size:13px;margin:6px 0 0">${before?`Rupture prévue ${v14Day(R.d)}, avant cette livraison : prévois un dépannage ou une livraison plus tôt.`:`Rupture prévue ${v14Day(R.d)} : ajoute ${colisOf(i)?'un '+esc(colisOf(i).l):'un peu'}.`}</p>`:''}`;
}
{const f=orderDetailHTML;orderDetailHTML=function(o){if(o&&o.status==='brouillon')return v14Draft(o);return v14AfterRecv(o,f.apply(this,arguments));};}
function v14SetQ(o,id,q){
  q=Math.max(0,+q||0);const i=ING(id);if(!i)return;const k=o.lines.findIndex(l=>l.id===id);
  if(q<=0){if(k>=0)o.lines.splice(k,1);}
  else if(k>=0)o.lines[k]={...o.lines[k],q:+q.toFixed(3)};
  else o.lines.push({id,q:+q.toFixed(3),pu:i.p||0});
  o.lines=[...o.lines];save();
}
const v14Cur=()=>S.orders.find(x=>x.id===UI.stock.order);
function v14Keep(fn){const y=window.scrollY;fn();renderView();window.scrollTo({top:y});}
Object.assign(ACT,{
  'v14-open'(t){const id=t.dataset.id;v14Keep(()=>{UI.v14.open={...UI.v14.open,[id]:!UI.v14.open[id]};});},
  'v14-step'(t){const o=v14Cur();const i=ING(t.dataset.id);if(!o||!i)return;const l=o.lines.find(x=>x.id===i.id);const st=v14Step(i);const n=(l?+l.q:0)/st;const d=+t.dataset.d;const nx=d>0?Math.floor(n+1e-9)+1:Math.ceil(n-1e-9)-1;v14Keep(()=>v14SetQ(o,i.id,Math.max(0,nx)*st));},
  'v14-reco'(t){const o=v14Cur();if(!o)return;v14Keep(()=>v14SetQ(o,t.dataset.id,+t.dataset.q));},
  'v14-reco-all'(t){const o=S.orders.find(x=>x.id===t.dataset.id);if(!o)return;const D=pdate(o.livraison||TODAY_ISO);
    v14Keep(()=>{supProducts(o.f).forEach(i=>v14SetQ(o,i.id,recoQty(i,o.f,D,o.id)));});toast('Conseils de Léon remis','spark');},
  'v14-day'(t){const o=S.orders.find(x=>x.id===t.dataset.id);if(!o)return;v14Keep(()=>{o.livraison=t.dataset.d;save();});},
});
CH['v14-q']=t=>{const o=v14Cur();const i=ING(t.dataset.id);if(!o||!i)return;const c=colisOf(i);const v=parseFloat(String(t.value).replace(',','.'))||0;v14Keep(()=>v14SetQ(o,i.id,c?v*c.q:v));};
{const f=CH['od-liv'];CH['od-liv']=function(t){f&&f.apply(this,arguments);if(t.value){const y=window.scrollY;renderView();window.scrollTo({top:y});}};}

Object.assign(ACT,{
  'v14-colis'(t,e){if(e&&e.stopPropagation)e.stopPropagation();const i=ING(t.dataset.id);if(!i)return;const c=colisOf(i);
    openModal(`<div class="mh"><div><h3>Comment ${esc(i.n)} est vendu ?</h3><p>Léon arrondit la commande au colis et tu peux compter l’inventaire en colis.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
     <div class="form-grid" style="margin-top:0"><div class="field"><label for="v14-pl">Le fournisseur vend par</label><select class="inp" id="v14-pl"><option value="">À l’unité (${esc(unitShort(i.u))})</option>${COLIS_NOMS.map(n=>`<option value="${n}" ${c&&c.l===n?'selected':''}>${n}</option>`).join('')}</select></div>
     <div class="field"><label for="v14-pq">Combien de ${esc(unitShort(i.u))} dedans ?</label><input class="inp" id="v14-pq" type="number" inputmode="decimal" min="0" step="any" value="${c?c.q:''}" placeholder="Ex. 6"></div></div>
     <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="v14-colis-ok" data-id="${i.id}">${ic('check','s')} Enregistrer</button></div>`);},
  'v14-colis-ok'(t){const i=ING(t.dataset.id);if(!i)return;const l=($('#v14-pl')||{}).value||'';const q=parseFloat(String(($('#v14-pq')||{}).value||'').replace(',','.'))||0;
    if(l&&!(q>1)){toast('Indique combien il y en a dans un '+l,'alert');return;}
    S.ingredients=S.ingredients.map(x=>x.id===i.id?(l?{...x,pack:q,packL:l}:{...x,pack:0,packL:''}):x);
    if(l)S.orders.filter(o=>o.status==='brouillon').forEach(o=>o.lines.forEach(x=>{if(x.id===i.id&&x.q>0)x.q=+(Math.ceil(x.q/q-1e-9)*q).toFixed(3);}));save();closeModal();const y=window.scrollY;renderView();window.scrollTo({top:y});toast(l?`${esc(i.n)} : ${l} de ${qtyFmt(q,i.u)}`:`${esc(i.n)} : à l’unité`,'box');},
});

/* ---------- 5. vérifier avant d'envoyer ---------- */
orderMail=function(o){
  const lines=o.lines.map(l=>{const i=ING(l.id)||{n:'?',u:'pièce'};const c=colisOf(i);const n=c?l.q/c.q:0;
    return c&&Math.abs(n-Math.round(n))<1e-6?`- ${nf(Math.round(n))} ${v14Pl(Math.round(n),c.l)} de ${qtyFmt(c.q,i.u)}  ${i.n}`:`- ${qtyFmt(l.q,i.u)}  ${i.n}`;}).join('\n');
  return `Objet : Commande ${S.nom} · livraison ${o.livraison?longDate(pdate(o.livraison)).toLowerCase():'dès que possible'}\n\nBonjour,\n\nMerci de nous livrer ${o.livraison?'le '+longDate(pdate(o.livraison)).toLowerCase():'dès que possible'} :\n\n${lines}\n\n${o.note?o.note+'\n\n':''}Livraison : ${S.nom}${S.ville?', '+S.ville:''}.\nMerci de nous confirmer la commande.\n\n${me().prenom} · ${S.nom}`;
};
ACT['ord-send']=function(t){
  const o=S.orders.find(x=>x.id===t.dataset.id);if(!o)return;const sup=supInfo(o.f);const tot=orderTotal(o);const fr=+sup.franco||0;
  const D=pdate(o.livraison||TODAY_ISO);
  const oublis=supProducts(o.f).filter(i=>!o.lines.some(l=>l.id===i.id)).map(i=>({i,r:v14Rupture(i,o,0)})).filter(x=>x.r&&x.r.iso>=(o.livraison||TODAY_ISO)).slice(0,4);
  const warn=[];
  if(!sup.email)warn.push(`Pas d’adresse e-mail pour ${esc(o.f)} : copie le mail et envoie-le toi-même, ou ajoute l’adresse dans Fournisseurs.`);
  if(fr&&tot<fr)warn.push(`${eur(tot)} HT : sous le minimum de commande de ${eur(fr,0)}. Le fournisseur peut refuser ou facturer la livraison.`);
  if(oublis.length)warn.push(`Rupture prévue sans commande : ${oublis.map(x=>`<b>${esc(x.i.n)}</b> (${v14Day(x.r.d)})`).join(', ')}.`);
  openModal(`<div class="mh"><div><h3>Vérifier avant d’envoyer</h3><p>${sup.email?`À : <b>${esc(sup.email)}</b>`:esc(o.f)}</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <div class="v14-recap"><div><small>Fournisseur</small><b>${esc(o.f)}</b></div><div><small>Livraison</small><b>${o.livraison?longDate(D):'dès que possible'}</b></div><div><small>Total</small><b>${eur(tot)} HT</b></div></div>
   ${warn.length?`<div class="v14-warn">${warn.map(w=>`<p>${ic('alert','s')} ${w}</p>`).join('')}</div>`:''}
   <div class="v14-recap-l">${o.lines.map(l=>{const i=ING(l.id)||{n:'?',u:'pièce'};return `<div><span>${esc(i.n)}</span><b>${esc(colisFmt(l.q,i))}</b><span class="tnum">${eur(l.q*linePu(l))}</span></div>`;}).join('')}</div>
   ${o.note?`<p class="muted" style="font-size:13px;margin-top:8px">Note : ${esc(o.note)}</p>`:''}
   <details class="v14-mail"><summary>Voir le mail envoyé au fournisseur</summary><textarea class="inp mono" id="om-txt" rows="11" readonly style="font-size:12.5px">${esc(orderMail(o))}</textarea></details>
   <p class="faint" style="font-size:12.5px;margin-top:8px">Version test : Léon ne part pas encore tout seul. Copie le mail et envoie-le depuis ta messagerie, puis confirme ici.</p>
   <div class="mf"><button class="btn" data-act="modal-close">Modifier</button><button class="btn" data-act="v14-copy">${ic('copy','s')} Copier le mail</button><span class="sp"></span><button class="btn primary" data-act="ord-sent" data-id="${o.id}">${ic('send','s')} C’est envoyé</button></div>`,'wide');
};
ACT['v14-copy']=function(){const o=S.orders.find(x=>x.id===UI.stock.order);const tx=$('#om-txt');copyText(tx?tx.value:o?orderMail(o):'');toast('Mail copié','copy');};

/* ---------- 6. l'avoir, prêt à envoyer ---------- */
function avoirMail(o){
  const L=[];o.lines.forEach(l=>{const i=ING(l.id)||{n:'?',u:'pièce'};const pu=linePu(l);const qr=+l.qr||0;
    if(l.rs==='abime')L.push(`- ${i.n} : ${qtyFmt(l.q,i.u)} refusé (abîmé) → ${eur(l.q*pu)}`);
    else if(qr<l.q-1e-6)L.push(`- ${i.n} : commandé ${qtyFmt(l.q,i.u)}, reçu ${qtyFmt(qr,i.u)} → manque ${qtyFmt(l.q-qr,i.u)}, ${eur((l.q-qr)*pu)}`);
    const pr=l.pr!=null?+l.pr:pu;if(qr>0&&pr>pu+0.004)L.push(`- ${i.n} : facturé ${eur(pr)} au lieu de ${eur(pu)} /${unitShort(i.u)} → ${eur((pr-pu)*qr)}`);});
  return `Objet : Demande d’avoir · livraison du ${o.received?frLongDate(o.received):''} · ${S.nom}\n\nBonjour,\n\nÀ la réception de votre livraison du ${o.received?longDate(pdate(o.received)).toLowerCase():''}, nous avons constaté :\n\n${L.join('\n')}\n\nTotal de l’avoir demandé : ${eur(o.avoir||0)} HT.\nMerci de nous faire parvenir l’avoir correspondant.\n\n${me().prenom} · ${S.nom}`;
}
function v14AfterRecv(o,html){
  if(!o||!(o.avoir>0.004))return html;
  if(o.avoirStatus==='a_demander')html=html.replace('<div class="acts">',`<div class="acts"><button class="btn brass" data-act="v14-avoir" data-id="${o.id}">${ic('send','s')} Demander l’avoir (${eur(o.avoir)})</button>`);
  if(o.avoirStatus==='demande')html=html.replace('<div class="acts">',`<div class="acts"><span class="pill info">Avoir demandé ${frDate(o.avoirAsked)}</span><button class="btn" data-act="v14-avoir" data-id="${o.id}">${ic('copy','s')} Revoir le mail</button><button class="btn primary" data-act="ord-avoir" data-id="${o.id}">${ic('check','s')} Avoir reçu</button>`);
  return html;
}
Object.assign(ACT,{
  'v14-avoir'(t){const o=S.orders.find(x=>x.id===t.dataset.id);if(!o)return;const sup=supInfo(o.f);
    openModal(`<div class="mh"><div><h3>Demander l’avoir à ${esc(o.f)}</h3><p>${sup.email?'À : <b>'+esc(sup.email)+'</b> · ':''}${eur(o.avoir)} HT pour les produits manquants, refusés ou facturés trop cher.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
     <textarea class="inp mono" id="av-txt" rows="13" readonly style="font-size:12.5px">${esc(avoirMail(o))}</textarea>
     <p class="faint" style="font-size:12.5px;margin-top:8px">Copie le mail et envoie-le depuis ta messagerie, avec la photo du bon de livraison si tu l’as.</p>
     <div class="mf"><button class="btn" data-act="v14-avcopy">${ic('copy','s')} Copier le mail</button><span class="sp"></span>${o.avoirStatus==='a_demander'?`<button class="btn primary" data-act="v14-avsent" data-id="${o.id}">${ic('send','s')} C’est demandé</button>`:`<button class="btn primary" data-act="modal-close">Fermer</button>`}</div>`,'wide');},
  'v14-avcopy'(){const tx=$('#av-txt');if(tx)copyText(tx.value);toast('Mail copié','copy');},
  'v14-avsent'(t){const o=S.orders.find(x=>x.id===t.dataset.id);if(!o)return;o.avoirStatus='demande';o.avoirAsked=TODAY_ISO;save();closeModal();renderView();toast(`Avoir demandé à ${esc(o.f)} : Léon te le rappellera s’il n’arrive pas`,'send');},
});
// un avoir demandé depuis plus de 10 jours : on le rappelle
V11_ALERTS.push(()=>{if(!CAN().stocks)return [];const lim=isoD(addDays(TODAY,-10));
  return S.orders.filter(o=>o.avoirStatus==='demande'&&o.avoirAsked&&o.avoirAsked<=lim).slice(0,2).map(o=>({tone:'brass',ic:'euro',t:`Avoir de ${esc(o.f)} toujours pas reçu (${eur(o.avoir)})`,s:`Demandé ${frDate(o.avoirAsked)}. Une relance ?`,acts:[{l:'Voir',act:'ord-open',id:o.id,primary:true}],key:'al:av:'+o.id}));});

/* ---------- 7. inventaire : compter aussi en colis ---------- */
{const f=invZoneHTML;invZoneHTML=function(z){let h=f.apply(this,arguments);
  invItems(z).forEach(i=>{const c=colisOf(i);if(!c)return;
    h=h.replace(`data-id="${i.id}" data-d="${i.pack}">+${i.pack}</button>`,`data-id="${i.id}" data-d="${c.q}">+1 ${esc(c.l)}</button>`);
    const v=((invZ(z).counts||{})[i.id]||{}).q;
    if(v>0){const n=Math.floor(v/c.q+1e-9);const r=+(v-n*c.q).toFixed(3);const t=n?`= ${n} ${v14Pl(n,c.l)}${r>0?' + '+qtyFmt(r,i.u):''}`:'';
      if(t)h=h.replace(`<span class="inv-n"><b>${esc(i.n)}</b><small>`,`<span class="inv-n"><b>${esc(i.n)}</b><small><span class="v14-colis-eq">${esc(t)}</span> · `);}
  });
  return h;};}

/* ---------- 8. où part ta marchandise (30 jours) ---------- */
function fuites(days){
  const from=isoD(addDays(TODAY,-(days||30)));const by={};const add=(k,f,v)=>{const x=by[k]||(by[k]={k,decl:0,inv:0});x[f]+=v;};
  (S.invHist||[]).filter(h=>h.date>=from).forEach(h=>h.lines.forEach(l=>{const i=ING(l.id);add(i?v14Cat(i):'Autres','inv',+l.val||0);}));
  (S.pertes||[]).filter(p=>p.date>=from).forEach(p=>{const i=p.k==='i'||p.k==='ing'?ING(p.ref):null;add(i?v14Cat(i):'Plats et préparations','decl',+p.val||0);});
  const L=Object.values(by).map(x=>({...x,unk:Math.max(0,-x.inv),tot:x.decl+Math.max(0,-x.inv)})).filter(x=>x.tot>0.5).sort((a,b)=>b.unk-a.unk||b.tot-a.tot);
  return {L,decl:sum(L,x=>x.decl),unk:sum(L,x=>x.unk),n:(S.invHist||[]).filter(h=>h.date>=from).length};
}
const V14_ADVICE={'Viandes':'Pèse 5 portions au hasard pendant le service et vérifie le poids à la réception.','Marée':'Contrôle le poids à la réception et la rotation des DLC.','Boissons':'Regarde les offerts et la pression : mousse, verres pas rincés, fût fini trop tôt.','Primeurs':'Vérifie l’épluchage (rendement des fiches) et les produits abîmés jetés sans être déclarés.','Crèmerie':'Vérifie les portions de fromage et les DLC dépassées non déclarées.','Épicerie':'Vérifie la réserve : produits sortis sans être notés, casse.','Boulangerie':'Vérifie le pain jeté en fin de service sans être déclaré.','Consommables':'Vérifie la réserve et les quantités utilisées.'};
function fuitesHTML(){
  if(!CAN().costs)return '';const F=fuites(30);if(!F.L.length)return '';
  const mx=Math.max(...F.L.map(x=>x.tot));const top=F.L[0];
  return `<section class="panel v14-fuite" data-fold-key="stocks:fuites"><div class="panel-h"><h3>${ic('trendUp')} Où part ta marchandise</h3><span class="faint" style="font-size:12.5px">30 derniers jours · ${plur(F.n,'inventaire')} ${infoBtn('fuites')}</span></div><div class="panel-b">
   <p class="v14-fuite-t"><b class="tx-bad">${eur(F.decl+F.unk,0)}</b> de marchandise perdue : <b>${eur(F.decl,0)}</b> déclarés (casse, DLC…) et <b class="tx-bad">${eur(F.unk,0)}</b> que personne ne s’explique.</p>
   <div class="v14-fl">${F.L.slice(0,6).map((x,k)=>`<div class="v14-fr ${k===0&&x.unk>0?'v14-ftop':''}"><span class="v14-fn">${esc(x.k)}</span><span class="v14-fb"><i class="d" style="width:${x.decl/mx*100}%"></i><i class="u" style="width:${x.unk/mx*100}%"></i></span><span class="tnum v14-fv">${eur(x.tot,0)}</span></div>`).join('')}</div>
   <div class="v14-leg"><span><i class="d"></i>Déclaré</span><span><i class="u"></i>Pas expliqué (écart d’inventaire)</span></div>
   ${top&&top.unk>0?`<p class="v14-fuite-a">${ic('alert','s')} <b>${esc(top.k)}</b> : ${eur(top.unk,0)} pas expliqués. ${esc(V14_ADVICE[top.k]||'Recompte cette famille et vérifie les fiches techniques.')}</p>`:''}
  </div></section>`;
}
Object.assign(INFO,{fuites:{t:'Où part ta marchandise',d:'Deux sortes de pertes. Celles qu’on déclare (casse, DLC dépassée, plat renvoyé) et celles qu’on découvre à l’inventaire : ce qui manque par rapport au stock théorique, que personne n’a noté.',f:'Pas expliqué = stock théorique − stock compté, au prix d’achat',r:'Le chiffre à faire baisser, c’est le « pas expliqué » : portions trop généreuses, erreurs de réception, oublis de déclaration, vol.'}});
function v14AfterBlock(h,start){const i=h.indexOf(start);if(i<0)return -1;let d=0,k=i;const re=/<div\b|<\/div>/g;re.lastIndex=i;let m;while((m=re.exec(h))){d+=m[0]==='</div>'?-1:1;if(d===0)return m.index+6;}return -1;}
{const f=stockHTML;stockHTML=function(){const h=f.apply(this,arguments);const p=fuitesHTML();if(!p)return h;const k=v14AfterBlock(h,'<div class="kpis">');return k<0?p+h:h.slice(0,k)+p+h.slice(k);};}

/* ---------- 9. tablette : réception produit par produit ---------- */
UI.v14k=UI.v14k||null;
function v14KInit(o){
  if(!UI.rc||UI.rc.id!==o.id)UI.rc={id:o.id,upd:false,lines:o.lines.map(l=>({qr:l.q,pr:linePu(l),rs:null,checked:false,temp:'',dlc:''}))};
  if(!UI.v14k||UI.v14k.id!==o.id)UI.v14k={id:o.id,temp:'',photo:null,edit:null};
}
function v14KState(l,c){if(!c.checked)return '';if(c.rs==='abime')return 'bad';const qr=+c.qr||0;if(qr<=0)return 'bad';if(qr<l.q-1e-6)return 'warn';return 'ok';}
function kioskRcHTML(o){
  v14KInit(o);const R=UI.rc;const K=UI.v14k;const n=R.lines.filter(c=>c.checked).length;const N=o.lines.length;
  const fresh=o.lines.some(l=>{const i=ING(l.id);return i&&['viande','poisson','cremerie'].includes(i.c);});
  const card=(l,k)=>{const i=ING(l.id)||{n:'?',u:'pièce'};const c=R.lines[k];const st=v14KState(l,c);const ed=K.edit===k;const cc=colisOf(i);
    const lbl=!c.checked?'':c.rs==='abime'?T('Refusé, abîmé'):(+c.qr||0)<=0?T('Manquant'):(+c.qr<l.q-1e-6)?`${T('Reçu')} ${esc(colisShort(+c.qr,i))}`:T('Reçu');
    return `<div class="v14k ${st}"><div class="v14k-h"><b>${esc(i.n)}</b><small>${T('Commandé')} : ${esc(colisFmt(l.q,i))}</small>${lbl?`<span class="v14k-st">${lbl}</span>`:''}</div>
      ${ed?`<div class="v14k-ed"><span>${T('Combien reçu ?')}</span><span class="v14k-stp"><button data-act="v14k-q" data-k="${k}" data-d="-1">−</button><b>${esc(colisShort(+c.qr||0,i))}</b><button data-act="v14k-q" data-k="${k}" data-d="1">+</button></span><button class="btn primary" data-act="v14k-edok" data-k="${k}">${ic('check','s')} ${T('OK')}</button></div>`
      :`<div class="v14k-b"><button class="v14k-ok ${st==='ok'?'on':''}" data-act="v14k-ok" data-k="${k}">${ic('check')} ${T('Reçu')}</button><button class="${st==='warn'?'on':''}" data-act="v14k-ed" data-k="${k}">${T('Pas tout')}</button><button class="${c.checked&&c.rs!=='abime'&&(+c.qr||0)<=0?'on':''}" data-act="v14k-miss" data-k="${k}">${T('Manquant')}</button><button class="${c.rs==='abime'?'on':''}" data-act="v14k-bad" data-k="${k}">${T('Abîmé')}</button></div>`}</div>`;};
  return `<div class="v14k-top"><div><h2 class="kiosk-h2">${esc(o.f)}</h2><p class="faint">${T('Touche chaque produit en le déchargeant.')}</p></div><span class="pill ${n===N?'ok':'warn'}">${n}/${N}</span></div>
   <div class="v14k-tools"><button class="btn ${K.photo?'primary':''}" data-act="v14k-photo">${ic('camera','s')} ${K.photo?T('Photo prise'):T('Photo du bon de livraison')}</button>
     ${fresh?`<label class="v14k-temp">${ic('thermo','s')} ${T('Température des produits frais (°C)')}<input class="inp" inputmode="decimal" value="${esc(K.temp)}" data-in="v14k-temp" placeholder="${T('Ex. 3')}"></label>`:''}</div>
   <div class="v14k-list">${o.lines.map(card).join('')}</div>
   <div class="v14k-foot">${n<N?`<button class="btn" data-act="v14k-rest">${ic('check','s')} ${T('Tout le reste est reçu')}</button>`:''}<button class="btn brass big" data-act="v14k-done" ${n===N?'':'disabled'}>${ic('check')} ${T('Valider la réception')}</button></div>`;
}
const v14KO=()=>UI.v14k&&S.orders.find(x=>x.id===UI.v14k.id);
Object.assign(ACT,{
  'v14k-open'(t){const o=S.orders.find(x=>x.id===t.dataset.id);if(!o)return;UI.rc=null;UI.v14k=null;v14KInit(o);UI.kiosk={...(UI.kiosk||{}),view:'reception',rc:o.id};render();window.scrollTo({top:0});},
  'v14k-back'(){UI.kiosk={...(UI.kiosk||{}),view:'reception',rc:null};UI.v14k=null;UI.rc=null;render();window.scrollTo({top:0});},
  'v14k-ok'(t){const o=v14KO();if(!o)return;const k=+t.dataset.k;Object.assign(UI.rc.lines[k],{qr:o.lines[k].q,rs:null,checked:true});UI.v14k.edit=null;render();},
  'v14k-miss'(t){const k=+t.dataset.k;Object.assign(UI.rc.lines[k],{qr:0,rs:null,checked:true});UI.v14k.edit=null;render();},
  'v14k-bad'(t){const k=+t.dataset.k;Object.assign(UI.rc.lines[k],{qr:0,rs:'abime',checked:true});UI.v14k.edit=null;render();},
  'v14k-ed'(t){const o=v14KO();if(!o)return;const k=+t.dataset.k;const c=UI.rc.lines[k];if(!c.checked||c.rs==='abime')Object.assign(c,{qr:o.lines[k].q,rs:null});UI.v14k.edit=k;render();},
  'v14k-q'(t){const o=v14KO();if(!o)return;const k=+t.dataset.k;const l=o.lines[k];const i=ING(l.id);const c=UI.rc.lines[k];const cc=colisOf(i);const st=cc&&l.q/cc.q>=2-1e-6?cc.q:invStep(i||{});c.qr=Math.max(0,+((+c.qr||0)+(+t.dataset.d)*st).toFixed(3));render();},
  'v14k-edok'(t){const k=+t.dataset.k;UI.rc.lines[k].checked=true;UI.v14k.edit=null;render();},
  'v14k-rest'(){const o=v14KO();if(!o)return;UI.rc.lines.forEach((c,k)=>{if(!c.checked)Object.assign(c,{qr:o.lines[k].q,rs:null,checked:true});});UI.v14k.edit=null;render();},
  'v14k-photo'(){
    const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.setAttribute('capture','environment');inp.style.display='none';document.body.appendChild(inp);
    inp.onchange=async()=>{const fl=inp.files&&inp.files[0];inp.remove();if(!fl)return;try{UI.v14k.photo=await imgToDataUrl(fl,900,false,0.6);}catch(e){toast(T('Impossible de lire cette photo'),'alert');return;}render();};
    inp.click();},
  'v14k-done'(){
    const o=v14KO();if(!o||!UI.rc.lines.every(c=>c.checked))return;const K=UI.v14k;
    const tp=String(K.temp||'').replace(',','.').trim();const temp=tp===''||isNaN(+tp)?'':+tp;
    const fresh=i=>i&&['viande','poisson','cremerie'].includes(i.c);
    UI.rc.lines.forEach((c,k)=>{if(fresh(ING(o.lines[k].id)))c.temp=temp;});
    ACT['rc-validate']();
    document.querySelectorAll('.toast').forEach(x=>x.remove());
    const pb=o.lines.filter(l=>l.rs&&l.rs!=='ok'&&l.rs!=='prix');const hot=temp!==''&&temp>4;
    const e=U.empId&&empById(U.empId);
    if(S.hyg)S.hyg.recs=[...recsOf(),{id:uid('rc'),at:Date.now(),iso:TODAY_ISO,m:nowMin(),f:o.f,photo:K.photo||null,temp,ok:!pb.length&&!hot,note:[pb.length?pb.map(l=>(ING(l.id)||{}).n+' : '+recPill(l).replace(/<[^>]+>/g,'').toLowerCase()).join(', '):'',hot?`température ${temp} °C`:''].filter(Boolean).join(' · '),by:e?e.prenom:whoName(),order:o.id}].slice(-60);
    UI.v14k=null;UI.kiosk={...(UI.kiosk||{}),view:'reception',rc:null};save();render();window.scrollTo({top:0});
    toast(pb.length||hot?T('Réception validée : le responsable est prévenu des écarts'):T('Réception validée, stock mis à jour'),pb.length||hot?'alert':'check');
  },
});
IN['v14k-temp']=t=>{if(UI.v14k)UI.v14k.temp=t.value;};
{const f=kioskReceptionHTML;kioskReceptionHTML=function(){
  const o=UI.kiosk&&UI.kiosk.rc&&S.orders.find(x=>x.id===UI.kiosk.rc&&x.status==='envoyee');
  if(o)return kioskRcHTML(o);
  const att=(S.orders||[]).filter(x=>x.status==='envoyee').sort((a,b)=>(a.livraison||'').localeCompare(b.livraison||''));
  let h=f.apply(this,arguments);
  h=h.replace(/<p class="rcp-att">[\s\S]*?<\/p>/,'');
  if(!att.length)return h;
  const cards=`<h2 class="kiosk-h2">${ic('truck','s')} ${T('Livraisons attendues')}</h2><div class="v14k-att">${att.map(x=>`<button class="v14k-a ${orderToday(x)||orderLate(x)?'now':''}" data-act="v14k-open" data-id="${x.id}"><span><b>${esc(x.f)}</b><small>${plur(x.lines.length,T('produit'),T('produits'))} · ${orderLate(x)?T('en retard'):orderToday(x)?T('aujourd’hui'):esc(frDate(x.livraison))}</small></span><span class="v14k-go">${T('Contrôler')} ${ic('chevR','s')}</span></button>`).join('')}</div><p class="faint v14k-or">${T('Une livraison sans commande ? Prends le bon en photo :')}</p>`;
  return cards+h;
};}
{const f=kioskShellHTML;kioskShellHTML=function(){
  if(UI.kiosk&&UI.kiosk.view==='reception'&&UI.kiosk.rc){const o=S.orders.find(x=>x.id===UI.kiosk.rc);
    if(o&&o.status==='envoyee')return `<div class="stage kiosk-stage"><div class="kiosk-shell"><header class="kiosk-top"><button class="btn demo-link sm" data-act="v14k-back">${ic('chevL','s')} ${T('Retour')}</button><b class="kiosk-title">${T('Réception')} · ${esc(o.f)}</b><span class="clock" data-clock>${hhmm(nowMin())}</span></header><div class="kiosk-body">${kioskRcHTML(o)}</div></div></div>`;
    UI.kiosk.rc=null;}
  return f.apply(this,arguments);
};}

/* ---------- 10. démo + traductions ---------- */
{const f=render;render=function(){try{v14DemoPacks();}catch(e){}return f.apply(this,arguments);};}
[
 ['Livraisons attendues','Expected deliveries','எதிர்பார்க்கப்படும் விநியோகங்கள்','التسليمات المنتظرة','Entregas previstas','Entregas previstas'],
 ['Contrôler','Check','சரிபார்','تحقق','Verificar','Revisar'],
 ['produit','item','பொருள்','منتج','produto','producto'],
 ['produits','items','பொருட்கள்','منتجات','produtos','productos'],
 ['en retard','late','தாமதம்','متأخر','atrasada','con retraso'],
 ['aujourd’hui','today','இன்று','اليوم','hoje','hoy'],
 ['Une livraison sans commande ? Prends le bon en photo :','A delivery without an order? Take a photo of the slip:','ஆர்டர் இல்லாத விநியோகமா? சீட்டை புகைப்படம் எடு:','تسليم بدون طلب؟ صوّر الوصل:','Entrega sem encomenda? Tira foto à guia:','¿Entrega sin pedido? Haz una foto del albarán:'],
 ['Touche chaque produit en le déchargeant.','Tap each item as you unload it.','இறக்கும்போது ஒவ்வொரு பொருளையும் தொடு.','المس كل منتج أثناء التفريغ.','Toca em cada produto ao descarregar.','Toca cada producto al descargarlo.'],
 ['Commandé','Ordered','ஆர்டர் செய்தது','المطلوب','Encomendado','Pedido'],
 ['Reçu','Received','பெறப்பட்டது','تم الاستلام','Recebido','Recibido'],
 ['Pas tout','Not all','முழுதும் இல்லை','ليس الكل','Não tudo','No todo'],
 ['Manquant','Missing','காணவில்லை','ناقص','Em falta','Falta'],
 ['Abîmé','Damaged','சேதமடைந்தது','تالف','Danificado','Dañado'],
 ['Refusé, abîmé','Refused, damaged','நிராகரிக்கப்பட்டது, சேதம்','مرفوض، تالف','Recusado, danificado','Rechazado, dañado'],
 ['Combien reçu ?','How many received?','எத்தனை பெறப்பட்டது?','كم استلمت؟','Quanto recebeste?','¿Cuánto recibiste?'],
 ['OK','OK','சரி','حسنًا','OK','OK'],
 ['Photo du bon de livraison','Photo of the delivery slip','விநியோகச் சீட்டின் புகைப்படம்','صورة وصل التسليم','Foto da guia de remessa','Foto del albarán'],
 ['Photo prise','Photo taken','புகைப்படம் எடுக்கப்பட்டது','تم التقاط الصورة','Foto tirada','Foto hecha'],
 ['Tout le reste est reçu','Everything else received','மீதி அனைத்தும் பெறப்பட்டது','تم استلام الباقي','O resto foi recebido','Lo demás está recibido'],
 ['Valider la réception','Confirm delivery','விநியோகத்தை உறுதிசெய்','تأكيد الاستلام','Validar a receção','Validar la recepción'],
 ['Réception validée, stock mis à jour','Delivery confirmed, stock updated','விநியோகம் உறுதி, இருப்பு புதுப்பிக்கப்பட்டது','تم تأكيد الاستلام وتحديث المخزون','Receção validada, stock atualizado','Recepción validada, stock actualizado'],
 ['Réception validée : le responsable est prévenu des écarts','Delivery confirmed: the manager is told about the gaps','விநியோகம் உறுதி: வேறுபாடுகள் பொறுப்பாளருக்குத் தெரிவிக்கப்பட்டன','تم تأكيد الاستلام: تم إبلاغ المسؤول بالفروقات','Receção validada: o responsável foi avisado das diferenças','Recepción validada: el responsable está avisado de las diferencias'],
].forEach(r=>{LANGS.forEach(([k],n)=>{if(n&&r[n]){I18N[k][r[0]]=r[n];const alt=r[0].replace(/’/g,"'");if(alt!==r[0])I18N[k][alt]=r[n];}});});
