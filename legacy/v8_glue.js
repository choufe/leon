
/* =========================================================
   V8 · branchement dans l'app
   ========================================================= */
VIEWS.stats=viewStats;VIEWS.infos=viewInfos;VIEWS['infos-net']=viewInfosNet;VIEWS['stats-net']=viewStatsNet;
{const vh=VIEWS.hub;VIEWS.hub=()=>{const h=vh();const blk=`<div style="margin-bottom:18px">${hubInfosBlock()}</div>`;const i=h.indexOf('<div style="margin-bottom:18px">');return i>=0?h.slice(0,i)+blk+h.slice(i):h+blk;};}
{const vs=VIEWS.stocks;VIEWS.stocks=()=>{const h=vs();return CAN().board?h.replace('<div class="acts"><button class="btn" data-act="stock-add">',`<div class="acts"><button class="btn" data-act="perte-new">${ic('trash','s')} Déclarer une perte</button><button class="btn" data-act="stock-add">`):h;};}

/* accueil du directeur : bloc « Infos importantes » à côté de « Léon a repéré » */
HOME_BLOCKS.infos={t:'Infos importantes · 30 jours'};
{const L=DEFAULT_LAYOUT.patron;const i=L.indexOf('raccourcis');L.splice(i>=0?i+1:2,0,'infos');}
function blockHTML(b){
  if(b.k==='infos'){const r=effRole();if(!(r==='admin'||r==='patron')||!modOn('infos'))return '';return homeInfosBlock(b.t||HOME_BLOCKS.infos.t);}
  return blockHTML__v7(b);
}

/* rendu, navigation, fil d'Ariane, barre mobile */
function renderView(){
  v8Reset();
  if(!S&&HUB_VIEWS.includes(UI.view)&&U.role==='admin'){
    closeInfo();MI=null;const v=$('#view');if(!v)return;
    v.innerHTML=VIEWS[UI.view]();navTrack();navChrome();return;
  }
  renderView__v7();
}
function go(view){
  if(HUB_VIEWS.includes(view)){
    if(U.role!=='admin')return;
    navGuard(()=>{if(S){S=null;U.rid=null;U.viewAs=null;U.empId=null;}UI.view=view;render();window.scrollTo({top:0});});
    return;
  }
  go__v7(view);
}
function navCrumbs(){
  const C=navCrumbs__v7();
  if(!S&&HUB_VIEWS.includes(UI.view))C.push({l:navLabel(UI.view)});
  return C;
}
function tabbarHTML(){
  if(!S){
    if(U.role!=='admin')return '';
    const nb=netInsights().filter(x=>x.tone==='bad').length;
    return [['hub','store','Restos'],['infos-net','bulb','Infos'],['stats-net','chart','Stats']].map(([v,i,l])=>`<button data-act="nav" data-v="${v}" ${UI.view===v?'aria-current="page"':''}>${ic(i)}<span>${l}</span>${v==='infos-net'&&nb?`<span class="nb bad">${nb}</span>`:''}</button>`).join('');
  }
  const all=navItems();const top=all.some(n=>n.v==='infos');
  const PRI=top?['accueil','infos','stats','planning','service','pointage','recettes','stocks','hygiene','equipe','reglages']:['accueil','service','planning','pointage','recettes','stocks','hygiene','equipe','reglages'];
  const items=all.slice().sort((a,b)=>PRI.indexOf(a.v)-PRI.indexOf(b.v));
  const pick=items.slice(0,4);const rest=items.slice(4);
  const cur=UI.view==='assembleur'?'recettes':UI.view;
  const restAlert=rest.some(n=>modInfo(n.v).n);
  return pick.map(n=>`<button data-act="nav" data-v="${n.v}" ${cur===n.v?'aria-current="page"':''}>${ic(n.i)}<span>${esc(navShort(n.v))}</span>${n.v==='accueil'?'':nbHTML(modInfo(n.v))}</button>`).join('')
    +(rest.length?`<button data-act="nav-menu" ${pick.some(n=>n.v===cur)?'':'aria-current="page"'} aria-label="Tous les modules">${ic('list')}<span>Plus</span>${restAlert?'<span class="nb dot"></span>':''}</button>`:'');
}
function modInfo(v){
  if(v==='stats'||v==='infos'){if(!MI)MI={};if(!MI[v]){try{MI[v]=modInfoV8(v);}catch(e){MI[v]={s:''};}}return MI[v];}
  return modInfo__v7(v);
}
function modInfoV8(v){
  if(v==='infos'){
    const c=insCounts(insVisible());const pend=memosOpen().length;
    const bits=[];if(pend)bits.push(plur(pend,'message à lire','messages à lire'));if(c.bad)bits.push(plur(c.bad,'urgent'));if(c.warn)bits.push(c.warn+' à surveiller');
    return {s:bits.join(' · ')||'Rien d’inquiétant sur 30 jours',n:c.bad+pend,tone:'bad'};
  }
  const T=TODAY;const A=agg(isoRange(isoD(new Date(T.getFullYear(),T.getMonth(),1)),TODAY_ISO));
  return {s:A.ht?`Ce mois : ${eur(A.ht,0)} HT${CAN().costs?' · coût matière '+pc(A.fc,0):''}`:'CA, marge, pertes, produits stars'};
}

/* « Demander à Léon » connaît aussi les chiffres du mois et les infos importantes */
function extraContext(L){
  extraContext__v7(L);
  const r=effRole();if(!(r==='admin'||r==='patron'))return;
  try{
    const T=TODAY;const A=agg(isoRange(isoD(new Date(T.getFullYear(),T.getMonth(),1)),TODAY_ISO));
    L.push(`Mois en cours (du 1er à aujourd’hui) : CA ${eur(A.ht,0)} HT, ${A.tk} tickets, ticket moyen ${eur(A.tm)} TTC, coût matière ${pc(A.fc)}, pertes ${eur(A.loss,0)}, masse salariale ${pc(A.msr)}.`);
    const top=Object.values(A.by).sort((a,b)=>b.q-a.q).slice(0,3).map(o=>o.n+' ('+o.q+')').join(', ');if(top)L.push('Les plus vendus ce mois : '+top+'.');
    const I=insVisible().filter(x=>x.tone!=='ok').slice(0,6);if(I.length)L.push('Infos importantes repérées par Léon (30 jours) : '+I.map(x=>x.t).join(' ; ')+'.');
  }catch(e){}
}

/* hygiène : jeter un produit périmé = déclarer la perte en un geste */
function hygLotRow(lot){
  const h=hygLotRow__v7(lot);const eff=lotEffDlc(lot);
  if(!(eff&&eff<=TODAY_ISO)||!CAN().board)return h;
  return h.replace('<button class="btn xs" data-act="hyg-lot-print"',`<button class="btn xs danger" data-act="hyg-lot-waste" data-id="${lot.id}">${ic('trash','s')} Jeter</button><button class="btn xs" data-act="hyg-lot-print"`);
}

/* simulateur de caisse : sur place ou à emporter */
function posHTML(){
  const h=posHTML__v7();if(isSvcBiz())return h;
  const m=UI.sim.mode||'sp';
  const tg=`<div class="seg pos-mode" role="group" aria-label="Type de vente"><button data-act="pos-mode" data-m="sp" aria-pressed="${m==='sp'}">Sur place</button><button data-act="pos-mode" data-m="emp" aria-pressed="${m==='emp'}">À emporter</button></div>`;
  const k='<div class="row" style="gap:8px;margin-top:4px"><button class="btn brass block" data-act="pos-pay"';
  return h.includes(k)?h.replace(k,tg+k):h;
}
{const f=ACT['pos-pay'];if(f)ACT['pos-pay']=function(t,e){const n=S?(S.ventes||[]).length:0;f(t,e);if(S&&(S.ventes||[]).length>n){S.ventes[S.ventes.length-1].mode=UI.sim.mode||'sp';S.ventes=[...S.ventes];save();}};}

/* ---------- pertes ---------- */
function perteUnit(key){
  const [k,id]=String(key||'').split(':');
  if(k==='i'){const i=ING(id);return i?{u:i.u,pu:i.p||0,n:i.n}:null;}
  if(k==='r'){const r=REC(id);if(!r)return null;if(r.t==='prep')return {u:r.yu||'kg',pu:recipeTotal(r)/(r.yq||1),n:r.n};return {u:'portion',pu:metrics(r).cost,n:r.n};}
  return null;
}
function openPerte(o){
  const recs=S.recipes.filter(r=>r.t!=='prep'&&r.pv),preps=S.recipes.filter(r=>r.t==='prep'),ings=S.ingredients.filter(i=>!i.noStock).slice().sort((a,b)=>a.n.localeCompare(b.n,'fr'));
  let sel='',q='';
  if(o&&o.lot){const ln=lotName(o.lot.nom);const i=S.ingredients.find(x=>lotName(x.n)===ln)||S.ingredients.find(x=>lotName(x.n).startsWith(ln)||ln.startsWith(lotName(x.n).split(' ')[0]));if(i)sel='i:'+i.id;q=o.lot.qty!=null?o.lot.qty:'';}
  UI.pl={lot:o&&o.lot?o.lot.id:null};
  const opt=(v,n)=>`<option value="${v}" ${sel===v?'selected':''}>${esc(n)}</option>`;
  openModal(`<div class="mh"><div><h3>Déclarer une perte</h3><p>${o&&o.lot?`${esc(o.lot.nom)} · DLC ${frDate(lotEffDlc(o.lot))}. `:''}Le stock est mis à jour et la perte compte dans les statistiques.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <div class="form-grid" style="margin-top:0">
    <div class="field full"><label for="pl-item">Produit</label><select class="inp" id="pl-item" data-ch="pl-item"><option value="">Choisir…</option>
     ${recs.length?`<optgroup label="${isSvcBiz()?'Prestations':'Plats et boissons (en portions)'}">${recs.map(r=>opt('r:'+r.id,r.n)).join('')}</optgroup>`:''}
     ${preps.length?`<optgroup label="Préparations maison">${preps.map(r=>opt('r:'+r.id,r.n)).join('')}</optgroup>`:''}
     ${ings.length?`<optgroup label="${isSvcBiz()?'Produits':'Ingrédients et produits'}">${ings.map(i=>opt('i:'+i.id,i.n)).join('')}</optgroup>`:''}
    </select></div>
    <div class="field"><label for="pl-q">Quantité <span id="pl-u" class="faint"></span></label><input class="inp" id="pl-q" type="number" min="0" step="0.01" inputmode="decimal" data-in="pl-q" value="${q}"></div>
    <div class="field"><label for="pl-m">Motif</label><select class="inp" id="pl-m">${Object.keys(MOTIFS).map(k=>`<option value="${k}" ${k===(o&&o.lot?'dlc':'casse')?'selected':''}>${MOTIFS[k]}</option>`).join('')}</select></div>
    <div class="field full"><label for="pl-n">Note (facultatif)</label><input class="inp" id="pl-n" placeholder="Ex. fût percé, frigo resté ouvert, table qui a renvoyé…"></div>
   </div>
   <p class="pl-est" id="pl-est" aria-live="polite"></p>
   <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="pl-save">${ic('trash','s')} Enregistrer la perte</button></div>`);
  plEst();
}
function plEst(){
  const sel=$('#pl-item');if(!sel)return;const u=perteUnit(sel.value);const q=+(($('#pl-q')||{}).value)||0;
  const ue=$('#pl-u');if(ue)ue.textContent=u?'('+u.u+')':'';
  const e=$('#pl-est');if(e)e.innerHTML=u&&q>0?`Valeur de la perte : <b>${eur(u.pu*q)}</b>`:u?`${eur(u.pu)} par ${esc(u.u)}`:'';
}
function chTotal(){const t=['loyer','energie','assur','autres'].reduce((s,k)=>s+(+(($('#ch-'+k)||{}).value)||0),0);const e=$('#ch-tot');if(e)e.innerHTML=`Total : <b>${eur(t,0)}</b> par mois, soit environ ${eur(t/30.4,0)} par jour.`;}
CH['pl-item']=()=>plEst();
IN['pl-q']=()=>plEst();
IN['ch-in']=()=>chTotal();
CH['st-date']=t=>{if(!t.value)return;let v=t.value;if(v<histMin())v=histMin();if(v>TODAY_ISO)v=TODAY_ISO;UI.st.date=v;UI.st.p='date';renderView();};
function enterGo(rid,v){NAVH.hold=true;try{enterResto(rid,false);}finally{NAVH.hold=false;}goMod(v);}

Object.assign(ACT,{
 'st-p'(t){UI.st.p=t.dataset.p;renderView();},
 'st-sort'(t){UI.st.sort=t.dataset.s;renderView();},
 'st-all'(){UI.st.all=!UI.st.all;renderView();},
 'st-go'(t){UI.st.p=t.dataset.p||'mois';goMod('stats');},
 'ins-cat'(t){UI.ins.cat=t.dataset.c;renderView();},
 'ins-rid'(t){UI.ins.rid=t.dataset.r;UI.ins.cat='all';renderView();},
 'ins-seen'(t){const s={...(S.seen||{}),[t.dataset.id]:TODAY_ISO};Object.keys(s).forEach(k=>{if(s[k]<isoD(addDays(TODAY,-30)))delete s[k];});S.seen=s;save();renderView();toast('Noté : ce point est masqué pendant 7 jours','check');},
 'ins-seen-toggle'(){UI.ins.seen=!UI.ins.seen;renderView();},
 'ins-open'(t){UI.ins.cat='all';enterGo(t.dataset.r,'infos');},
 'net-stats-open'(t){enterGo(t.dataset.r,'stats');},
 'ins-flag'(t){
   const R=NET.restos[t.dataset.r];if(!R)return;const x=withCtx(R,()=>{v8Reset();return insightsFor().find(i=>i.id===t.dataset.id);});if(!x)return;
   UI.flag={rid:R.id,id:x.id,t:x.t};const who=R.patron&&R.patron.prenom?R.patron.prenom:'Le directeur';
   openModal(`<div class="mh"><div><h3>Signaler au directeur</h3><p>${esc(R.nom)} · ${esc(who)} le verra en haut de ses Infos importantes et sur son accueil. Tu sauras quand il l’a lu.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="field"><label for="fl-m">Ton message</label><textarea class="inp" id="fl-m" rows="4">Tu peux regarder et me dire ce que tu mets en place ?</textarea></div>
    <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="memo-save">${ic('send','s')} Envoyer</button></div>`,'narrow');
 },
 'memo-save'(){
   const F=UI.flag;const R=F&&NET.restos[F.rid];if(!R)return;const m=(($('#fl-m')||{}).value||'').trim();if(!m){toast('Écris un petit mot','alert');return;}
   R.memos=[...(R.memos||[]).filter(x=>x.at>=isoD(addDays(TODAY,-60))),{id:uid('mm'),at:TODAY_ISO,m,t:F.t,ins:F.id,by:me().prenom,done:null}];
   saveResto(R);UI.flag=null;closeModal();renderView();toast(`Envoyé à ${esc(R.nom)}`,'send');
 },
 'memo-ok'(t){const m=(S.memos||[]).find(x=>x.id===t.dataset.id);if(!m)return;S.memos=S.memos.map(x=>x.id===m.id?{...x,done:{by:me().prenom,at:TODAY_ISO}}:x);save();renderView();toast('C’est noté','check');},
 'perte-new'(){openPerte({});},
 'hyg-lot-waste'(t){const lot=(S.hyg&&S.hyg.lots||[]).find(l=>l.id===t.dataset.id);if(lot)openPerte({lot});},
 'pl-save'(){
   const key=($('#pl-item')||{}).value;const u=perteUnit(key);const q=+(($('#pl-q')||{}).value);
   if(!u){toast('Choisis le produit','alert');return;}if(!(q>0)){toast('Indique la quantité','alert');return;}
   const [k,id]=key.split(':');const motif=$('#pl-m').value;const note=($('#pl-n').value||'').trim();
   if(k==='i'){const i=ING(id);if(i&&!i.noStock){i.st=Math.max(0,+(i.st-q).toFixed(3));mvAdd(i.id,'out',q);}}else{const r=REC(id);if(r)consume(r,q,1);}
   const keep=isoD(addDays(TODAY,-(HIST_DAYS+40)));
   S.pertes=[...(S.pertes||[]).filter(p=>p.date>=keep),{id:uid('pl'),date:TODAY_ISO,at:nowMin(),by:me().prenom,k,ref:id,n:u.n,q,u:u.u,val:+(u.pu*q).toFixed(2),motif,note}];
   if(UI.pl&&UI.pl.lot&&S.hyg)S.hyg.lots=S.hyg.lots.filter(l=>l.id!==UI.pl.lot);
   UI.pl=null;save();closeModal();renderView();toast(`Perte enregistrée · ${eur(u.pu*q)}`,'trash');
 },
 'perte-del'(t){
   const p=(S.pertes||[]).find(x=>x.id===t.dataset.id);if(!p)return;
   confirmBox({title:'Supprimer cette perte ?',text:`${esc(p.n)} · ${nf(p.q,p.q%1?2:0)} ${esc(p.u||'')} · ${eur(p.val)}. La quantité est remise dans le stock théorique.`,ok:'Supprimer',danger:true,onOk:()=>{
     if(p.k==='i'){const i=ING(p.ref);if(i&&!i.noStock){i.st=+(i.st+p.q).toFixed(3);if(S.mv&&S.mv[i.id])S.mv[i.id].out=Math.max(0,+((S.mv[i.id].out||0)-p.q).toFixed(3));}}else{const r=REC(p.ref);if(r)consume(r,p.q,-1);}
     S.pertes=S.pertes.filter(x=>x.id!==p.id);save();renderView();}});
 },
 'charges-open'(){
   const c=S.charges||{};
   openModal(`<div class="mh"><div><h3>Charges fixes du mois</h3><p>Ce que ${esc(S.nom)} paie chaque mois quoi qu’il arrive. Léon les répartit sur chaque jour pour estimer ton résultat. Les salaires sont déjà comptés à part.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="form-grid" style="margin-top:0">${[['loyer','Loyer et charges locatives'],['energie','Énergie et eau'],['assur','Assurances, abonnements, logiciels'],['autres','Autres frais fixes : comptable, crédit, entretien, banque…']].map(([k,l])=>`<div class="field"><label for="ch-${k}">${l} (€ / mois)</label><input class="inp" id="ch-${k}" type="number" min="0" step="10" inputmode="decimal" data-in="ch-in" value="${c[k]||''}"></div>`).join('')}</div>
    <p class="pl-est" id="ch-tot"></p>
    <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="ch-save">Enregistrer</button></div>`);
   chTotal();
 },
 'ch-save'(){const o={};['loyer','energie','assur','autres'].forEach(k=>o[k]=Math.max(0,+(($('#ch-'+k)||{}).value)||0));S.charges=o;save();closeModal();renderView();toast('Charges fixes enregistrées','euro');},
 'pos-mode'(t){UI.sim.mode=t.dataset.m;renderView();},
});
