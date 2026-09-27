/* =========================================================
   V11 · ESPACE SERVICE
   - Plats dispo : pensés pour le coup de feu (gros boutons, photos)
   - Allergènes en 2 secondes + tableau à imprimer
   - Cahier de liaison : passation entre services, « J'ai lu »,
     la casse devient une perte à valider
   ========================================================= */
UI.sv={cat:'all',st:'all'};
function dispoOf(r){const d=S.dispo[r.id]||{};const off=!!(d.off||d.n===0);const tracked=d.n!=null;const low=!off&&tracked&&d.n<=3;return {d,off,tracked,low};}
const catPl=t=>T(RTYPE[t]?RTYPE[t].pl:'Autres');
function recThumb(r,cls){
  const ph=photoOf('r_'+r.id);
  return ph?`<span class="rthumb ${cls||''}" style="background-image:url('${ph}')" role="img" aria-label="${esc(r.n)}"></span>`:`<span class="rthumb ph0 ${cls||''} t-${r.t}" aria-hidden="true">${ic(RTYPE[r.t]?RTYPE[r.t].ic:'plate')}</span>`;
}
function viewService(){
  const can=CAN();const svc=isSvcBiz();
  const recs=S.recipes.filter(r=>r.t!=='prep');
  const cats=rcats().filter(t=>recs.some(r=>r.t===t));
  const all=recs.map(r=>({r,...dispoOf(r)}));
  const nOff=all.filter(x=>x.off).length,nLow=all.filter(x=>x.low).length;
  const cat=cats.includes(UI.sv.cat)?UI.sv.cat:'all',st=UI.sv.st;
  const list=all.filter(x=>(cat==='all'||x.r.t===cat)&&(st==='all'||(st==='off'?x.off:st==='low'?x.low:!x.off)));
  const card=x=>{const {r,d,off,tracked,low}=x;
    return `<article class="pc2 ${off?'off':low?'low':''}">
      ${recThumb(r)}
      <div class="pc2-b">
        <div class="pc2-t"><b>${esc(r.n)}</b>${r.pv?`<small class="tnum">${eur(r.pv)}</small>`:''}</div>
        <div class="pc2-c"><button class="pc2-num ${tracked||off?'':'inf'}" data-act="dispo-set" data-id="${r.id}" title="Changer le nombre restant">${off?'0':tracked?d.n:'∞'}</button><span class="pc2-l ${off?'bad':low?'warn':''}">${off?T('Épuisé'):tracked?(low?T('Bientôt épuisé'):T('restants')):T('Pas de limite')}</span></div>
        <div class="pc2-a">
          <button class="btn pc2-m" data-act="dispo-minus" data-id="${r.id}" aria-label="${T('Un de moins')}" ${!tracked||off?'disabled':''}>−</button>
          <button class="btn pc2-m" data-act="dispo-plus" data-id="${r.id}" aria-label="${T('Un de plus')}" ${!tracked&&!off?'disabled':''}>+</button>
          <button class="btn pc2-off ${off?'on':''}" data-act="dispo-off" data-id="${r.id}">${off?ic('refresh','s')+' '+T('Remettre'):ic('x','s')+' '+T('Épuisé')}</button>
        </div>
        ${d.by?`<small class="pc2-by" data-noi18n>${esc(d.by)} · ${hhmm(d.at||0)}</small>`:''}
      </div></article>`;};
  const chips=`<div class="sv-bar">
    <div class="chips sv-st">${[['all',T('Tout'),all.length,''],['off',T('Épuisés'),nOff,'bad'],['low',T('Bientôt'),nLow,'warn'],['on',T('Dispo'),all.length-nOff,'ok']].map(([k,l,n,t])=>`<button class="chip ${t}" data-act="sv-st" data-k="${k}" aria-pressed="${st===k}">${l} <b>${n}</b></button>`).join('')}</div>
    ${cats.length>1?`<div class="seg sv-cat">${[['all',T('Tout')],...cats.map(t=>[t,catPl(t)])].map(([k,l])=>`<button data-act="sv-cat" data-k="${k}" aria-pressed="${cat===k}">${l}</button>`).join('')}</div>`:''}
  </div>`;
  const grid=list.length?`<div class="pc2-grid">${list.map(card).join('')}</div>`:`<div class="panel"><div class="empty"><h3>${recs.length?'Rien dans ce filtre':'Pas encore de carte'}</h3><p>${recs.length?'':'Crée tes produits dans Recettes pour les voir ici.'}</p></div></div>`;
  const caisse=can.ca?(S.caisse&&S.caisse.status==='connected'?`<span class="pill ok"><span class="dot"></span>Caisse ${esc(S.caisse.provider)}</span>`:`<span class="pill warn"><span class="dot"></span>Caisse pas branchée</span>`):'';
  const last=(S.ventes||[]).slice(-6).reverse();
  const feed=can.ca?`<section class="panel" data-fold-key="service:feed"><div class="panel-h"><h3><span class="live-dot"></span> Tickets de la caisse</h3><span class="faint" style="font-size:12.5px">${plur((S.ventes||[]).length,'ticket')} aujourd’hui</span></div>${last.length?`<div class="plist">${last.map(t=>`<div class="prow"><span class="mono faint" style="font-size:12px">${hhmm(t.at)}</span><div><b class="tnum">${eur(t.total)}</b><small>${t.lines.map(l=>l.q+' × '+esc(l.n)).join(', ')}</small></div></div>`).join('')}</div>`:`<div class="empty" style="padding:20px">Pas encore de ticket aujourd’hui.</div>`}</section>`:'';
  const sim=can.sim&&recs.length&&typeof posHTML==='function'?posHTML():'';
  const side=feed||sim?`<div class="stack sv-side">${sim}${feed}</div>`:'';
  return `<div class="ph"><div><h1>${svc?'Disponibilités':T('Plats dispo')}</h1><p class="sub">${T('Touche « Épuisé » quand il n’y en a plus : toute l’équipe le voit tout de suite.')}</p></div><div class="acts">${caisse}${can.board?`<button class="btn" data-act="mep">${ic('list','s')} Mise en place</button>`:''}</div></div>
   ${chips}<div class="${side?'sv-grid':''}"><div>${grid}</div>${side}</div>`;
}
Object.assign(ACT,{
  'sv-st'(t){UI.sv.st=t.dataset.k;renderView();},
  'sv-cat'(t){UI.sv.cat=t.dataset.k;renderView();},
});
V11_MOD.service=()=>{const recs=S.recipes.filter(r=>r.t!=='prep');const off=recs.filter(r=>dispoOf(r).off).length,low=recs.filter(r=>dispoOf(r).low).length;
  return {s:off||low?[off?plur(off,'épuisé'):'',low?low+' bientôt épuisé'+(low>1?'s':''):''].filter(Boolean).join(' · '):plur(recs.length-off,'plat dispo','plats dispo'),n:off,tone:'bad'};};

/* ---------- allergènes ---------- */
UI.alg={sel:[],q:''};
const ALG_KEYS=Object.keys(ALLERG);
function algChip(k,on){return `<button class="alg-b ${on?'on':''}" data-act="alg-t" data-k="${k}" aria-pressed="${on}">${ic('a_'+k)}<span>${esc(T(ALLERG[k]))}</span></button>`;}
function algRow(r,hit){
  const al=allergensOf(r);
  return `<div class="alg-r ${hit&&hit.length?'bad':'ok'}">${recThumb(r,'s')}<div class="alg-n"><b>${esc(r.n)}</b><small>${catPl(r.t)}</small></div><div class="alg-ics">${al.map(a=>`<span class="alg-i ${hit&&hit.includes(a)?'hit':''}" title="${esc(T(ALLERG[a]))}">${ic('a_'+a,'s')}</span>`).join('')||`<span class="faint" style="font-size:12px">—</span>`}</div></div>`;
}
function viewAllergenes(){
  const recs=S.recipes.filter(r=>r.t!=='prep').sort((a,b)=>rcats().indexOf(a.t)-rcats().indexOf(b.t)||a.n.localeCompare(b.n,'fr'));
  const sel=UI.alg.sel.filter(k=>ALLERG[k]);
  const can=CAN();
  let body;
  if(sel.length){
    const rows=recs.map(r=>({r,hit:allergensOf(r).filter(a=>sel.includes(a))}));
    const ok=rows.filter(x=>!x.hit.length),bad=rows.filter(x=>x.hit.length);
    body=`<div class="alg-res">
      <section class="panel alg-ok no-fold"><div class="panel-h"><h2>${ic('check')} ${T('Sans risque')} <b class="tnum">${ok.length}</b></h2></div><div class="alg-list">${ok.map(x=>algRow(x.r,x.hit)).join('')||'<div class="empty" style="padding:18px">—</div>'}</div></section>
      <section class="panel alg-bad no-fold"><div class="panel-h"><h2>${ic('x')} ${T('À éviter')} <b class="tnum">${bad.length}</b></h2></div><div class="alg-list">${bad.map(x=>algRow(x.r,x.hit)).join('')||'<div class="empty" style="padding:18px">—</div>'}</div></section>
    </div>`;
  }else{
    body=`<section class="panel no-fold"><div class="panel-h"><h2>${T('Tout')} · ${plur(recs.length,'produit')}</h2></div><div class="alg-list">${recs.map(r=>algRow(r,null)).join('')}</div></section>`;
  }
  return `<div class="ph"><div><h1>${T('Allergènes')}</h1><p class="sub">${T('Touche un ou plusieurs allergènes.')} ${T('En cas de doute, demande en cuisine.')}</p></div><div class="acts"><button class="btn" data-act="alg-print">${ic('printer','s')} Tableau à afficher</button></div></div>
   <section class="panel alg-sel no-fold"><div class="panel-h"><h2>${T('Le client est allergique à…')}</h2>${sel.length?`<button class="btn sm" data-act="alg-clear">${ic('x','s')} ${T('Effacer')}</button>`:''}</div><div class="alg-grid">${ALG_KEYS.map(k=>algChip(k,sel.includes(k))).join('')}</div></section>
   ${body}
   ${can.editRecipes?`<p class="faint" style="font-size:12.5px;margin-top:10px">Calculé depuis les ingrédients des fiches techniques : une fiche à jour = une info juste pour le client.</p>`:''}`;
}
function allergenPrint(){
  const recs=S.recipes.filter(r=>r.t!=='prep').sort((a,b)=>rcats().indexOf(a.t)-rcats().indexOf(b.t)||a.n.localeCompare(b.n,'fr'));
  const html=`<div class="pa"><div class="pa-h"><b>${esc(S.nom)}</b><span>Informations sur les allergènes · règlement (UE) n° 1169/2011</span><span>Mis à jour le ${frLongDate(TODAY_ISO)}</span></div>
   <table><thead><tr><th>Plat</th>${ALG_KEYS.map(k=>`<th><span>${esc(ALLERG[k])}</span></th>`).join('')}</tr></thead><tbody>
   ${rcats().map(t=>{const L=recs.filter(r=>r.t===t);if(!L.length)return '';return `<tr class="pa-g"><td colspan="${ALG_KEYS.length+1}">${esc(RTYPE[t]?RTYPE[t].pl:t)}</td></tr>`+L.map(r=>{const al=allergensOf(r);return `<tr><td>${esc(r.n)}</td>${ALG_KEYS.map(k=>`<td class="c">${al.includes(k)?'●':''}</td>`).join('')}</tr>`;}).join('');}).join('')}
   </tbody></table><p class="pa-f">● = présent dans la recette. Nos plats sont préparés dans une cuisine où tous ces allergènes sont manipulés : des traces sont possibles. Demandez à l’équipe en cas de doute.</p></div>`;
  printHTML('print-allerg','printing-allerg',html);
}
Object.assign(ACT,{
  'alg-t'(t){const k=t.dataset.k;const s=UI.alg.sel;UI.alg.sel=s.includes(k)?s.filter(x=>x!==k):[...s,k];renderView();},
  'alg-clear'(){UI.alg.sel=[];renderView();},
  'alg-print'(){allergenPrint();},
});
VIEWS.allergenes=viewAllergenes;
V11_MOD.allergenes=()=>({s:'Filtrer la carte en 2 secondes'});

/* ---------- cahier de liaison ---------- */
const LIA_CATS={
 rupture:{l:'Rupture',i:'box',tone:'warn'},
 casse:{l:'Casse / perte',i:'trash',tone:'bad'},
 client:{l:'Client',i:'users',tone:'info'},
 livraison:{l:'Livraison',i:'truck',tone:'info'},
 afaire:{l:'À faire',i:'check',tone:'brass'},
 info:{l:'Info',i:'note',tone:''},
};
UI.lia={cat:'info',f:'all',txt:'',loss:'',q:''};
function liaMine(x){return x.byId===whoKey();}
function liaRead(x){return liaMine(x)||!!(x.read&&x.read[whoKey()]);}
function liaUnread(){const lim=isoD(addDays(TODAY,-3));return (S.liaison||[]).filter(x=>x.date>=lim&&!liaRead(x));}
function liaPending(){return (S.liaison||[]).filter(x=>x.loss&&x.loss.st==='pending');}
function liaGroupLabel(date,svc){const n=Math.round((pdate(date)-TODAY)/864e5);const d=n===0?T('Aujourd’hui'):n===-1?T('Hier'):T(JOURS[(pdate(date).getDay()+6)%7])+' '+pdate(date).getDate();return d+' · '+(svc==='midi'?T('Midi'):T('Soir'));}
function liaEntry(x,compact){
  const c=LIA_CATS[x.cat]||LIA_CATS.info;const can=CAN();const read=liaRead(x);
  const readers=Object.keys(x.read||{}).filter(k=>k!==x.byId).map(k=>k==='patron'?(S.patron&&S.patron.prenom)||'Direction':k==='admin'?'Admin':empById(k).prenom);
  const loss=x.loss;
  const lossLine=loss?`<div class="lia-loss ${loss.st}">${ic('trash','s')}<span data-noi18n>${esc(loss.n)} · ${nf(loss.q,loss.q%1?2:0)} ${esc(loss.u==='portion'&&loss.q>1?'portions':loss.u||'')}${can.costs?' · '+eur(loss.val||0):''}</span>${loss.st==='pending'?(can.board?`<button class="btn xs primary" data-act="lia-loss-ok" data-id="${x.id}">Valider la perte</button><button class="btn xs ghost" data-act="lia-loss-no" data-id="${x.id}">Refuser</button>`:`<span class="pill warn">Perte à valider</span>`):`<span class="pill ${loss.st==='ok'?'ok':''}">${loss.st==='ok'?'Perte déclarée':'Refusée'}</span>`}</div>`:'';
  return `<article class="lia-e ${read?'':'unread'} ${x.done?'done':''} t-${c.tone}" data-tr>
    <span class="ico ${c.tone||'info'}">${ic(c.i,'s')}</span>
    <div class="lia-x">
      <div class="lia-m"><b>${T(c.l)}</b><span data-noi18n>${esc(x.by||'')} · ${tsHM(x.ts)}</span>${x.done?`<span class="pill ok">${ic('check','s')} ${T('Fait')}${x.done.by?' · <span data-noi18n>'+esc(x.done.by)+'</span>':''}</span>`:''}</div>
      <p class="lia-t" data-noi18n>${esc(x.txt)}</p>${lossLine}
      <div class="lia-a">${!read?`<button class="btn sm primary" data-act="lia-read" data-id="${x.id}">${ic('check','s')} ${T('J’ai lu')}</button>`:`<span class="faint lia-rd">${ic('check','s')} ${T('Lu')}${!compact&&readers.length?` <span data-noi18n>· ${esc(readers.slice(0,3).join(', '))}${readers.length>3?' +'+(readers.length-3):''}</span>`:''}</span>`}
        ${x.cat==='afaire'&&!x.done?`<button class="btn sm" data-act="lia-done" data-id="${x.id}">${ic('check','s')} ${T('Fait')}</button>`:''}
        ${trBtn(x.txt)}
        ${!compact&&(can.board||(liaMine(x)&&Date.now()-x.ts<3600e3))?`<button class="icon-btn" data-act="lia-del" data-id="${x.id}" aria-label="Supprimer">${ic('trash','s')}</button>`:''}</div>
    </div></article>`;
}
function liaLossOptions(sel){
  const recs=S.recipes.filter(r=>r.t!=='prep'&&r.pv),preps=S.recipes.filter(r=>r.t==='prep'),ings=S.ingredients.filter(i=>!i.noStock).slice().sort((a,b)=>a.n.localeCompare(b.n,'fr'));
  const o=(v,n)=>`<option value="${v}" ${sel===v?'selected':''}>${esc(n)}</option>`;
  return `<option value="">Rien à déclarer</option>${recs.length?`<optgroup label="Plats (en portions)">${recs.map(r=>o('r:'+r.id,r.n)).join('')}</optgroup>`:''}${preps.length?`<optgroup label="Préparations">${preps.map(r=>o('r:'+r.id,r.n)).join('')}</optgroup>`:''}${ings.length?`<optgroup label="Produits">${ings.map(i=>o('i:'+i.id,i.n)).join('')}</optgroup>`:''}`;
}
function liaComposer(){
  const L=UI.lia;const u=L.loss?perteUnit(L.loss):null;
  return `<section class="panel lia-new no-fold"><div class="panel-h"><h2>${ic('edit')} ${T('Écrire dans le cahier')}</h2></div><div class="panel-b">
    <div class="lia-cats">${Object.keys(LIA_CATS).map(k=>`<button class="lia-c t-${LIA_CATS[k].tone} ${L.cat===k?'on':''}" data-act="lia-cat" data-k="${k}" aria-pressed="${L.cat===k}">${ic(LIA_CATS[k].i,'s')}<span>${T(LIA_CATS[k].l)}</span></button>`).join('')}</div>
    <textarea class="inp" id="lia-txt" rows="2" data-in="lia-txt" placeholder="${T('Qu’est-ce qui se passe ?')}">${esc(L.txt)}</textarea>
    ${L.cat==='casse'||L.cat==='rupture'?`<div class="lia-lossf"><div class="field"><label for="lia-loss">Produit jeté ou cassé (facultatif)</label><select class="inp" id="lia-loss" data-ch="lia-loss">${liaLossOptions(L.loss)}</select></div>${L.loss?`<div class="field"><label for="lia-q">Quantité ${u?'('+esc(u.u)+')':''}</label><input class="inp" id="lia-q" type="number" min="0" step="0.1" inputmode="decimal" data-in="lia-q" value="${esc(L.q)}"></div>`:''}</div>${L.loss?'<p class="faint" style="font-size:12.5px;margin-top:6px">Ton responsable valide, puis la perte est déduite du stock.</p>':''}`:''}
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" data-act="lia-send">${ic('send','s')} ${T('Envoyer')}</button></div>
  </div></section>`;
}
function viewLiaison(){
  const can=CAN();const all=(S.liaison||[]).slice().sort((a,b)=>b.ts-a.ts);
  const un=liaUnread(),todo=all.filter(x=>x.cat==='afaire'&&!x.done),pend=liaPending();
  const F=UI.lia.f;
  const list=all.filter(x=>F==='all'?true:F==='unread'?!liaRead(x):F==='todo'?x.cat==='afaire'&&!x.done:F==='loss'?x.loss&&x.loss.st==='pending':true);
  const groups=[];list.forEach(x=>{const k=x.date+'|'+x.svc;let g=groups.find(g=>g.k===k);if(!g){g={k,date:x.date,svc:x.svc,items:[]};groups.push(g);}g.items.push(x);});
  const pins=(S.annonces||[]).map((a,i)=>({a,i})).reverse();
  const pinHTML=pins.length||can.board?`<section class="panel lia-pin" data-fold-key="liaison:pins"><div class="panel-h"><h2>${ic('flag')} ${T('Épinglé')}</h2>${can.board?`<button class="btn ghost sm" data-act="annonce-new">${ic('plus','s')} Épingler une info</button>`:''}</div>${pins.length?pins.map(({a,i})=>`<div class="note" data-tr><small data-noi18n>${esc(a.from)} · ${esc(a.at)}${can.board?` · <button class="btn xs ghost" data-act="annonce-del" data-i="${i}">retirer</button>`:''}</small><span data-noi18n>${esc(a.m)}</span>${trBtn(a.m)}</div>`).join(''):'<div class="empty" style="padding:16px">Rien d’épinglé.</div>'}</section>`:'';
  const fchips=`<div class="chips lia-f">${[['all',T('Tout'),all.length],['unread','Non lus',all.filter(x=>!liaRead(x)).length],['todo',T('À faire'),todo.length],...(can.board?[['loss','Pertes à valider',pend.length]]:[])].map(([k,l,n])=>`<button class="chip" data-act="lia-f" data-k="${k}" aria-pressed="${F===k}">${l} <b>${n}</b></button>`).join('')}${un.length?`<button class="btn sm lia-allread" data-act="lia-readall">${ic('check','s')} Tout marquer lu</button>`:''}</div>`;
  const body=groups.length?groups.map(g=>`<div class="lia-g"><h3 class="lia-gh">${liaGroupLabel(g.date,g.svc)}</h3>${g.items.map(x=>liaEntry(x,false)).join('')}</div>`).join(''):`<div class="panel"><div class="empty"><p>${T('Rien de nouveau.')}</p></div></div>`;
  return `<div class="ph"><div><h1>${T('Cahier de liaison')}</h1><p class="sub">${LANG!=='fr'?T('Ton responsable écrit en français : touche « Traduire » sous un message pour le lire dans ta langue.'):'Ce qui se passe entre deux services : ruptures, casse, clients, livraisons, choses à faire. Chacun coche « J’ai lu ».'}</p></div></div>
   ${pinHTML}${liaComposer()}${fchips}${body}`;
}
function liaSave(){S.liaison=(S.liaison||[]).slice(-220);save();}
Object.assign(ACT,{
  'lia-cat'(t){UI.lia.cat=t.dataset.k;const ta=$('#lia-txt');if(ta)UI.lia.txt=ta.value;renderView();setTimeout(()=>{const x=$('#lia-txt');if(x)x.focus();},20);},
  'lia-f'(t){UI.lia.f=t.dataset.k;renderView();},
  'lia-send'(){
    const ta=$('#lia-txt');const txt=((ta&&ta.value)||'').trim();const L=UI.lia;
    const key=(L.cat==='casse'||L.cat==='rupture')?L.loss:'';const q=+(($('#lia-q')||{}).value||L.q||0);
    if(!txt&&!key){toast('Écris quelques mots','alert');return;}
    const now=Date.now();const x={id:uid('lia'),ts:now,date:TODAY_ISO,svc:svcOfMin(nowMin()),by:whoName(),byId:whoKey(),cat:L.cat,txt:txt||'',read:{}};
    if(key){const u=perteUnit(key);if(!u){toast('Choisis le produit','alert');return;}if(!(q>0)){toast('Indique la quantité','alert');return;}x.loss={key,n:u.n,u:u.u,q,val:+(u.pu*q).toFixed(2),st:'pending'};if(!x.txt)x.txt=`${u.n} : ${nf(q,q%1?2:0)} ${u.u}`;}
    S.liaison=[...(S.liaison||[]),x];UI.lia={cat:'info',f:UI.lia.f,txt:'',loss:'',q:''};liaSave();renderView();toast('C’est dans le cahier','book');
  },
  'lia-read'(t){const x=(S.liaison||[]).find(y=>y.id===t.dataset.id);if(!x)return;x.read={...(x.read||{}),[whoKey()]:Date.now()};S.liaison=[...S.liaison];liaSave();renderView();},
  'lia-readall'(){const k=whoKey();(S.liaison||[]).forEach(x=>{if(!liaRead(x))x.read={...(x.read||{}),[k]:Date.now()};});S.liaison=[...S.liaison];liaSave();renderView();toast('Tout est lu','check');},
  'lia-done'(t){const x=(S.liaison||[]).find(y=>y.id===t.dataset.id);if(!x)return;x.done={by:whoName(),ts:Date.now()};x.read={...(x.read||{}),[whoKey()]:Date.now()};S.liaison=[...S.liaison];liaSave();renderView();toast('Noté : c’est fait','check');},
  'lia-del'(t){const id=t.dataset.id;S.liaison=(S.liaison||[]).filter(y=>y.id!==id);liaSave();renderView();},
  'lia-loss-ok'(t){
    const x=(S.liaison||[]).find(y=>y.id===t.dataset.id);if(!x||!x.loss)return;const L=x.loss;const u=perteUnit(L.key);if(!u){toast('Produit introuvable','alert');return;}
    const [k,id]=L.key.split(':');
    if(k==='i'){const i=ING(id);if(i&&!i.noStock){i.st=Math.max(0,+(i.st-L.q).toFixed(3));mvAdd(i.id,'out',L.q);}}else{const r=REC(id);if(r)consume(r,L.q,1);}
    const motif=x.cat==='rupture'?'autre':/dlc|périm|date/i.test(x.txt)?'dlc':/renvoy|client|erreur/i.test(x.txt)?'erreur':'casse';
    S.pertes=[...(S.pertes||[]),{id:uid('pl'),date:x.date,at:Math.round((x.ts-new Date(x.ts).setHours(0,0,0,0))/60000),by:x.by,k,ref:id,n:u.n,q:L.q,u:u.u,val:+(u.pu*L.q).toFixed(2),motif,note:'Cahier de liaison'}];
    x.loss={...L,st:'ok',val:+(u.pu*L.q).toFixed(2),by:whoName()};S.liaison=[...S.liaison];liaSave();renderView();toast(`Perte enregistrée · ${eur(u.pu*L.q)}`,'trash');
  },
  'lia-loss-no'(t){const x=(S.liaison||[]).find(y=>y.id===t.dataset.id);if(!x||!x.loss)return;x.loss={...x.loss,st:'no',by:whoName()};S.liaison=[...S.liaison];liaSave();renderView();},
});
IN['lia-txt']=t=>{UI.lia.txt=t.value;};
IN['lia-q']=t=>{UI.lia.q=t.value;};
CH['lia-loss']=t=>{UI.lia.loss=t.value;const ta=$('#lia-txt');if(ta)UI.lia.txt=ta.value;renderView();};
VIEWS.liaison=viewLiaison;
V11_MOD.liaison=()=>{const un=liaUnread().length;const pend=CAN().board?liaPending().length:0;const last=(S.liaison||[]).slice(-1)[0];
  const bits=[];if(un)bits.push(plur(un,'message non lu','messages non lus'));if(pend)bits.push(plur(pend,'perte à valider','pertes à valider'));
  return {s:bits.join(' · ')||(last?'Dernier : '+String(last.txt).slice(0,40):'Passation entre les services'),n:un+pend,tone:'info'};};
V11_ALERTS.push(()=>{
  if(!CAN().board)return [];const p=liaPending();if(!p.length)return [];
  return [{tone:'warn',ic:'trash',t:plur(p.length,'perte signalée dans le cahier','pertes signalées dans le cahier')+' à valider',s:p.slice(0,3).map(x=>`${esc(x.loss.n)} (${esc(x.by)})`).join(', '),acts:[{l:'Voir',act:'lia-go-loss'}],key:'al:liaLoss:'+p.map(x=>x.id).join(',').slice(0,80)}];
});
ACT['lia-go-loss']=()=>{UI.lia.f='loss';goMod('liaison');};

/* ---------- bloc « Cahier de liaison » sur l'accueil (remplace « Infos de l'équipe ») ---------- */
HOME_BLOCKS.annonces.t='Cahier de liaison';
function annoncesBlock(title){
  const can=CAN();const un=liaUnread().sort((a,b)=>b.ts-a.ts);const pin=(S.annonces||[]).slice(-1)[0];
  const recent=un.length?un.slice(0,3):(S.liaison||[]).slice().sort((a,b)=>b.ts-a.ts).slice(0,2);
  const t=title&&title!=='Infos de l’équipe'&&title!=='Infos de l\'équipe'?title:'Cahier de liaison';
  const body=`${pin?`<div class="note pin" data-tr><small data-noi18n>${ic('flag','s')} ${esc(pin.from)} · ${esc(pin.at)}</small><span data-noi18n>${esc(pin.m)}</span>${trBtn(pin.m)}</div>`:''}
    ${recent.length?`<div class="lia-home">${recent.map(x=>liaEntry(x,true)).join('')}</div>`:`${pin?'':`<div class="empty" style="padding:16px">${T('Rien de nouveau.')}</div>`}`}
    <div class="more-row"><button class="btn ghost sm" data-act="nav" data-v="liaison">${ic('book','s')} ${T('Ouvrir le cahier')}${un.length>3?' · '+(un.length-3)+' autres':''}</button>${can.board?`<button class="btn ghost sm" data-act="lia-quick">${ic('edit','s')} Écrire</button>`:''}</div>`;
  return `<section class="panel lia-blk" data-fold-key="${UI.view}:liaison"><div class="panel-h"><h2>${ic('book')} ${T(t)}</h2>${un.length?`<span class="pill info">${plur(un.length,'nouveau','nouveaux')}</span>`:''}</div>${body}</section>`;
}
ACT['lia-quick']=()=>{goMod('liaison');setTimeout(()=>{const x=$('#lia-txt');if(x)x.focus();},60);};
