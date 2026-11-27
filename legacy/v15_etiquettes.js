/* =========================================================
   15.09 · ÉTIQUETTES DLC (décidé avec Maurice les 23, 26 et 27 nov. 2026)
   Imprimante de l'Irish : Brother QL-820NWBc en Wi-Fi, rouleau DK-44205
   (continu amovible 62 mm), impression AirPrint depuis l'iPad.
   - Tablette : on touche un ou plusieurs produits (juste le nom), on règle
     le nombre sur la même carte, on valide en bas : TOUTES les étiquettes
     partent dans UNE seule fenêtre d'impression (une page = une étiquette).
   - Étiquette 62 × 29 mm : produit, préparé le (date + heure), DLC calculée
     avec la durée réglée par produit, qui l'a imprimée.
   - PC (Hygiène › Traçabilité & étiquettes) : le patron choisit les produits
     qui sont sur la tablette et leur durée, ajoute ses préparations maison,
     et voit l'historique des étiquettes imprimées (traçabilité).
   ========================================================= */
const ETQ_DEF_J=3;            // durée par défaut si rien n'est réglé
const ETQ_W=62,ETQ_H=29;      // taille de l'étiquette, en mm
const ETQ_ZONES_ON=['froid','congel']; // produits proposés d'office sur la tablette

{const add={
  'Touche un produit, règle le nombre, puis imprime.':['Tap a product, set the number, then print.','ஒரு பொருளைத் தொடவும், எண்ணிக்கையை அமைத்து, அச்சிடவும்.','المس منتجًا، اختر العدد، ثم اطبع.','Toca num produto, escolhe a quantidade e imprime.','Toca un producto, elige la cantidad y luego imprime.'],
  'Préparations maison':['Homemade','வீட்டுத் தயாரிப்புகள்','تحضيرات منزلية','Preparações caseiras','Preparaciones caseras'],
  'Imprimer':['Print','அச்சிடு','طباعة','Imprimir','Imprimir'],
  'étiquette':['label','லேபிள்','ملصق','etiqueta','etiqueta'],
  'étiquettes':['labels','லேபிள்கள்','ملصقات','etiquetas','etiquetas'],
  'Vider':['Clear','அழி','إفراغ','Limpar','Vaciar'],
  'Choisis un ou plusieurs produits':['Choose one or more products','ஒன்று அல்லது பல பொருட்களைத் தேர்வு செய்யவும்','اختر منتجًا أو أكثر','Escolhe um ou mais produtos','Elige uno o varios productos'],
  'Pas encore de produits à étiqueter.':['No products to label yet.','லேபிள் செய்ய இன்னும் பொருட்கள் இல்லை.','لا توجد منتجات للتوسيم بعد.','Ainda não há produtos para etiquetar.','Todavía no hay productos para etiquetar.'],
  'Durée (jours)':['Shelf life (days)','காலம் (நாட்கள்)','المدة (أيام)','Duração (dias)','Duración (días)'],
  'Ajouter':['Add','சேர்','إضافة','Adicionar','Añadir'],
  'Étiquettes envoyées':['Labels sent','லேபிள்கள் அனுப்பப்பட்டன','تم إرسال الملصقات','Etiquetas enviadas','Etiquetas enviadas'],
  'Moins':['Less','குறைவு','أقل','Menos','Menos'],
  'Plus':['More','அதிகம்','أكثر','Mais','Más'],
};
 try{Object.keys(add).forEach(fr=>{['en','ta','ar','pt','es'].forEach((k,i)=>{if(I18N[k]&&add[fr][i])I18N[k][fr]=add[fr][i];});});}catch(e){}}

/* ---------- données ---------- */
function etqHome(){if(!S.etqMaison)S.etqMaison=[];return S.etqMaison;}
function etqLog(){if(!S.hyg)S.hyg={equip:defaultHygEquip(),temps:[],lots:[]};if(!S.hyg.etqLog)S.hyg.etqLog=[];return S.hyg.etqLog;}
function etqOn(i){return i.etq!=null?!!i.etq:ETQ_ZONES_ON.includes(zoneOf(i));}
function etqDays(p){const j=+p.dlcJ;return j>0?j:ETQ_DEF_J;}
// tous les produits étiquetables : préparations maison d'abord, puis le stock rangé par zone
function etqGroups(onlyOn){
  const G=[];
  const home=etqHome().slice().sort((a,b)=>a.n.localeCompare(b.n,'fr'));
  if(home.length)G.push({k:'maison',l:'Préparations maison',i:'flame',items:home.map(x=>({...x,src:'m'}))});
  Object.keys(INV_ZONES).forEach(z=>{
    const items=S.ingredients.filter(i=>zoneOf(i)===z&&(!onlyOn||etqOn(i))).sort((a,b)=>a.n.localeCompare(b.n,'fr')).map(i=>({id:i.id,n:i.n,dlcJ:i.dlcJ,src:'i',on:etqOn(i)}));
    if(items.length)G.push({k:z,l:INV_ZONES[z].l,i:INV_ZONES[z].i,items});
  });
  return G;
}
function etqFind(id){const h=etqHome().find(x=>x.id===id);if(h)return {...h,src:'m'};const i=ING(id);return i?{id:i.id,n:i.n,dlcJ:i.dlcJ,src:'i'}:null;}

/* ---------- l'étiquette ---------- */
const etqD2=d=>pad(d.getDate())+'/'+pad(d.getMonth()+1);
const ETQ_JC=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
function etqMake(p,who){
  const m=nowMin();const prep=new Date(TODAY);prep.setMinutes(m);
  const dlc=new Date(prep);dlc.setDate(dlc.getDate()+etqDays(p));
  return {n:p.n,prep,dlc,who:who||me().prenom||''};
}
function etqLabelHTML(L){
  const n=String(L.n||'');const sz=n.length>34?'xs':n.length>22?'s':'';
  const hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
  return `<div class="etq-l"><div class="etq-n ${sz}">${esc(n)}</div>
   <div class="etq-p">Préparé le ${etqD2(L.prep)} à ${hm(L.prep)}</div>
   <div class="etq-d">DLC ${ETQ_JC[L.dlc.getDay()]} ${etqD2(L.dlc)} · ${hm(L.dlc)}</div>
   <div class="etq-f"><span>Par ${esc(L.who)}</span><span>${esc(S.nom||'')}</span></div></div>`;
}
// une seule fenêtre d'impression pour toutes les étiquettes
function etqPrint(labels){
  if(!labels.length)return false;
  let box=document.getElementById('print-label');if(!box){box=document.createElement('div');box.id='print-label';document.body.appendChild(box);}
  box.innerHTML=labels.map(etqLabelHTML).join('');
  // à la toute fin du document : passe après les autres @page (A4 du planning, marges du dossier)
  let st=document.getElementById('etq-page');if(!st){st=document.createElement('style');st.id='etq-page';}document.body.appendChild(st);
  st.textContent=`@page{size:${ETQ_W}mm ${ETQ_H}mm;margin:0}`;
  document.body.classList.add('printing-etq');
  const done=()=>{document.body.classList.remove('printing-etq');st.textContent='';window.removeEventListener('afterprint',done);};
  window.addEventListener('afterprint',done);
  setTimeout(()=>{try{window.print();}catch(e){toast('Impression indisponible ici','alert');}setTimeout(done,2500);},60);
  return true;
}
function etqRecord(labels){
  const log=etqLog();const c={};
  labels.forEach(L=>{const k=L.n;c[k]=c[k]||{n:L.n,q:0,dlc:isoD(L.dlc),dlcM:L.dlc.getHours()*60+L.dlc.getMinutes()};c[k].q++;});
  const m=nowMin();
  Object.values(c).forEach(x=>log.unshift({id:uid('etq'),date:TODAY_ISO,m,n:x.n,q:x.q,dlc:x.dlc,dlcM:x.dlcM,who:labels[0].who}));
  if(log.length>600)log.length=600;
}

// les anciennes impressions (lot ouvert, étiquette rapide, test) passent au même format
printLabel=function({nom,dlc,sub}){
  const L=etqMake({n:nom},null);
  if(dlc){const d=pdate(dlc);d.setHours(L.prep.getHours(),L.prep.getMinutes(),0,0);L.dlc=d;}
  if(sub)L.n=nom+' · '+sub;
  etqPrint([L]);
};

/* ---------- tablette ---------- */
UI.etq={sel:{}};
function etqTotal(){return Object.values(UI.etq.sel).reduce((s,q)=>s+q,0);}
function etqCardHTML(p){
  const q=UI.etq.sel[p.id]||0;
  return `<div class="etq-c${q?' on':''}" data-etq="${p.id}">
   <button class="etq-c-n" data-act="etq-tap" data-id="${p.id}">${esc(p.n)}</button>
   <div class="etq-c-q"><button data-act="etq-step" data-id="${p.id}" data-d="-1" aria-label="${T('Moins')}">−</button><b>${q}</b><button data-act="etq-step" data-id="${p.id}" data-d="1" aria-label="${T('Plus')}">+</button></div></div>`;
}
function etqBarHTML(){
  const n=etqTotal();const np=Object.keys(UI.etq.sel).length;
  return `<div class="etq-bar${n?' on':''}" id="etq-bar">
   <span class="etq-bar-t">${n?`${plur(np,'produit')} · <b>${n} ${T(n>1?'étiquettes':'étiquette')}</b>`:T('Choisis un ou plusieurs produits')}</span>
   ${n?`<button class="btn ghost" data-act="etq-clear">${T('Vider')}</button>`:''}
   <button class="btn primary big" data-act="etq-print" ${n?'':'disabled'}>${ic('print','s')} ${T('Imprimer')}${n?` ${n}`:''}</button></div>`;
}
function etqPaint(id){
  if(id){const c=document.querySelector(`.etq-c[data-etq="${id}"]`);const p=etqFind(id);if(c&&p)c.outerHTML=etqCardHTML(p);}
  const b=document.getElementById('etq-bar');if(b)b.outerHTML=etqBarHTML();
}
kioskEtiquetageHTML=function(){
  const G=etqGroups(true);
  // on oublie ce qui n'existe plus
  Object.keys(UI.etq.sel).forEach(id=>{if(!etqFind(id))delete UI.etq.sel[id];});
  return kioskBackHTML('kiosk-hyg-home','Hygiène')+`<h2 class="kiosk-h2">${ic('tag','s')} ${T('Étiquetage')}</h2>
   <p class="sub" style="margin:0 0 14px">${T('Touche un produit, règle le nombre, puis imprime.')}</p>
   ${G.length?G.map(g=>`<h3 class="etq-g">${ic(g.i,'s')} ${esc(T(g.l))}</h3><div class="etq-grid">${g.items.map(etqCardHTML).join('')}</div>`).join(''):`<p class="faint">${T('Pas encore de produits à étiqueter.')}</p>`}
   <details class="etq-other"><summary>${ic('edit','s')} ${T('Autre produit')}</summary>
    <div class="field"><label for="kq-n">${T('Produit')}</label><input class="inp" id="kq-n" placeholder="${T('Ex. sauce maison')}"></div>
    <div class="field" style="margin-top:8px"><label for="kq-j">${T('Durée (jours)')}</label><input class="inp" id="kq-j" type="number" inputmode="numeric" min="1" max="365" value="${ETQ_DEF_J}"></div>
    <button class="btn big block" data-act="etq-other-print" style="margin-top:12px">${ic('print','s')} ${T('Imprimer l’étiquette')}</button></details>
   <div class="etq-pad"></div>${etqBarHTML()}`;
};
Object.assign(ACT,{
  'etq-tap'(t){const id=t.dataset.id;UI.etq.sel[id]=(UI.etq.sel[id]||0)+1;etqPaint(id);},
  'etq-step'(t){const id=t.dataset.id;const q=Math.min(99,Math.max(0,(UI.etq.sel[id]||0)+(+t.dataset.d)));if(q)UI.etq.sel[id]=q;else delete UI.etq.sel[id];etqPaint(id);},
  'etq-clear'(){UI.etq.sel={};render();},
  'etq-print'(){
    const labels=[];
    Object.entries(UI.etq.sel).forEach(([id,q])=>{const p=etqFind(id);if(!p)return;const L=etqMake(p);for(let k=0;k<q;k++)labels.push(L);});
    if(!labels.length)return;
    etqRecord(labels);save();
    etqPrint(labels);
    UI.etq.sel={};
    setTimeout(()=>{render();toast(`${T('Étiquettes envoyées')} · ${labels.length}`,'tag');},120);
  },
  'etq-other-print'(){
    const n=(($('#kq-n')||{}).value||'').trim();if(!n){toast(T('Indique un nom de produit'),'alert');return;}
    const j=Math.min(365,Math.max(1,parseInt(($('#kq-j')||{}).value,10)||ETQ_DEF_J));
    const L=etqMake({n,dlcJ:j});etqRecord([L]);save();etqPrint([L]);
  },
  // ancien bouton produit (au cas où un écran l'affiche encore) : la durée du produit, plus 3 jours fixes
  'kiosk-tag-print'(t){const p=etqFind(t.dataset.id);if(!p)return;const L=etqMake(p);etqRecord([L]);save();etqPrint([L]);},
});

/* ---------- PC : réglages et historique (Hygiène › Traçabilité & étiquettes) ---------- */
UI.etqSet={open:null};
function etqSettingsHTML(){
  const can=CAN();const edit=!!(can.settings||can.board);
  const G=etqGroups(false);
  const nOn=G.reduce((s,g)=>s+g.items.filter(x=>x.src==='m'||x.on).length,0);
  const rows=g=>g.items.map(p=>`<tr><td><b>${esc(p.n)}</b></td>
    <td class="r"><input class="tinp" type="number" inputmode="numeric" min="1" max="365" value="${p.dlcJ>0?p.dlcJ:''}" placeholder="${ETQ_DEF_J}" data-ch="etq-j" data-id="${p.id}" style="width:70px" aria-label="Durée en jours pour ${esc(p.n)}" ${edit?'':'disabled'}> <small class="faint">j</small></td>
    <td class="r">${p.src==='m'?`<button class="btn ghost sm" data-act="etq-home-del" data-id="${p.id}" ${edit?'':'disabled'}>${ic('trash','s')} Retirer</button>`:`<label class="etq-sw"><input type="checkbox" data-ch="etq-on" data-id="${p.id}" ${p.on?'checked':''} ${edit?'':'disabled'}> Sur la tablette</label>`}</td></tr>`).join('');
  const groups=G.map(g=>{const op=UI.etqSet.open===g.k||(g.k==='maison'&&UI.etqSet.open==null);
    const on=g.items.filter(x=>x.src==='m'||x.on).length;
    return `<details class="etq-set-g" ${op?'open':''} data-tg="${g.k}"><summary>${ic(g.i,'s')} <b>${esc(g.l)}</b> <span class="faint">${on} sur ${g.items.length} sur la tablette</span></summary>
     <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Produit</th><th class="r">DLC après préparation</th><th class="r"></th></tr></thead><tbody>${rows(g)}</tbody></table></div></details>`;}).join('');
  const log=etqLog().slice(0,12);
  return `<section class="panel"><div class="panel-h"><h2>${ic('tag','s')} Étiquettes DLC de la tablette</h2><span class="faint" style="font-size:12.5px">${plur(nOn,'produit')} sur la tablette · étiquette ${ETQ_W} × ${ETQ_H} mm</span></div><div class="panel-b">
   <p class="muted" style="font-size:13px;margin:-4px 0 12px">Sur la tablette, l’équipe touche le produit, choisit le nombre et imprime. Ici tu règles la durée de chaque produit (vide = ${ETQ_DEF_J} jours) et ce qui apparaît.</p>
   ${edit?`<div class="etq-add"><div class="field"><label for="etq-hn">Préparation maison</label><input class="inp" id="etq-hn" placeholder="Ex. sauce burger, oignons confits"></div>
    <div class="field"><label for="etq-hj">Durée (jours)</label><input class="inp" id="etq-hj" type="number" inputmode="numeric" min="1" max="365" value="${ETQ_DEF_J}"></div>
    <div class="field"><button class="btn primary" data-act="etq-home-add">${ic('plus','s')} Ajouter</button></div></div>`:''}
   ${groups||'<p class="faint">Aucun produit pour l’instant.</p>'}
   <div class="mf" style="justify-content:flex-start;margin-top:12px"><button class="btn ghost" data-act="etq-test">${ic('print','s')} Imprimer une étiquette test</button></div>
  </div></section>
  <section class="panel" style="margin-top:18px"><div class="panel-h"><h2>Étiquettes imprimées</h2><span class="faint" style="font-size:12.5px">Pour la traçabilité</span></div><div class="panel-b">
   ${log.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Heure</th><th>Produit</th><th class="r">Nombre</th><th>DLC</th><th>Par</th></tr></thead><tbody>${log.map(x=>`<tr><td>${frDate(x.date)}</td><td class="tnum">${hhmm(x.m)}</td><td><b>${esc(x.n)}</b></td><td class="r tnum">${x.q}</td><td>${frDate(x.dlc)} · ${hhmm(x.dlcM)}</td><td>${esc(x.who||'')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="faint">Rien d’imprimé pour l’instant.</p>'}
  </div></section>`;
}
{const f=viewHygiene;viewHygiene=function(){
  const h=f.apply(this,arguments);
  if(!UI.hyg||UI.hyg.tab!=='trace')return h;
  try{return h+`<div style="margin-top:18px">${etqSettingsHTML()}</div>`;}catch(e){return h;}
};}
CH['etq-j']=t=>{const v=parseInt(t.value,10);const j=v>0?Math.min(365,v):null;const h=etqHome().find(x=>x.id===t.dataset.id);
  if(h)h.dlcJ=j||ETQ_DEF_J;else{const i=ING(t.dataset.id);if(!i)return;S.ingredients=S.ingredients.map(x=>x.id===i.id?{...x,dlcJ:j}:x);}
  save();toast(`${esc(t.getAttribute('aria-label').replace('Durée en jours pour ',''))} : DLC ${j||ETQ_DEF_J} j`,'tag');};
CH['etq-on']=t=>{const id=t.dataset.id;S.ingredients=S.ingredients.map(x=>x.id===id?{...x,etq:!!t.checked}:x);save();
  const g=t.closest('[data-tg]');UI.etqSet.open=g?g.dataset.tg:null;render();};
Object.assign(ACT,{
  'etq-home-add'(){const n=(($('#etq-hn')||{}).value||'').trim();if(!n){toast('Indique le nom de la préparation','alert');return;}
    const j=Math.min(365,Math.max(1,parseInt(($('#etq-hj')||{}).value,10)||ETQ_DEF_J));
    if(etqHome().some(x=>normH(x.n)===normH(n))){toast('Déjà dans la liste','alert');return;}
    S.etqMaison=[...etqHome(),{id:uid('em'),n,dlcJ:j}];UI.etqSet.open='maison';save();render();toast(`${esc(n)} ajouté`,'tag');},
  'etq-home-del'(t){S.etqMaison=etqHome().filter(x=>x.id!==t.dataset.id);UI.etqSet.open='maison';save();render();},
  'etq-test'(){etqPrint([etqMake({n:'Étiquette test',dlcJ:ETQ_DEF_J})]);},
});
