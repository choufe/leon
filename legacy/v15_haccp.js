/* =========================================================
   15.10 · CLASSEUR HACCP (27 nov. 2026, demandé par Maurice)
   « Un bouton presque caché, version direction, marqué HACCP, avec tout dedans :
     tous les papiers pour être aux normes. Pour mes clients c'est top de tout
     sortir d'un coup face à un contrôle d'hygiène. »
   - Tablette : petit bouton « HACCP » en bas de l'écran Hygiène, seulement pour
     les responsables (managers, directeur, créateur). PC : bouton en haut d'Hygiène.
   - Des rubriques avec une pastille (vert à jour / orange à compléter / rouge manquant) :
     ce que Léon remplit tout seul (températures, nettoyage, traçabilité, étiquettes,
     allergènes, fournisseurs) + les papiers qu'on dépose une fois (PMS, déclaration
     DDPP, formations, plan de la cuisine, nuisibles…) en photo ou en PDF.
   - « Mode contrôle » : écran propre, en lecture seule, jour par jour, à montrer au contrôleur.
   - « Tout sortir en PDF » : le dossier complet (1, 3 ou 6 mois) + les documents déposés.
   - Produits ouverts : on ne les efface plus, on les archive. Photo gardée 1 mois,
     ligne écrite (produit, date, heure, qui, DLC) gardée 6 mois. Listes de nettoyage : 6 mois.
   ========================================================= */
const HC_PHOTO_J=31,HC_LIGNE_J=183;

[['Classeur HACCP','HACCP folder','HACCP கோப்பு','ملف HACCP','Dossier HACCP','Carpeta HACCP'],
 ['Mode contrôle','Inspection mode','ஆய்வு முறை','وضع التفتيش','Modo inspeção','Modo inspección'],
 ['Quitter le mode contrôle','Leave inspection mode','ஆய்வு முறையிலிருந்து வெளியேறு','الخروج من وضع التفتيش','Sair do modo inspeção','Salir del modo inspección'],
 ['Tout sortir en PDF','Export everything as PDF','அனைத்தையும் PDF ஆக','تصدير الكل PDF','Exportar tudo em PDF','Exportar todo en PDF'],
 ['à jour','up to date','புதுப்பிக்கப்பட்டது','محدّث','em dia','al día'],
 ['à compléter','to complete','நிரப்ப வேண்டும்','يجب إكماله','a completar','por completar'],
 ['Ajouter un document','Add a document','ஆவணம் சேர்','إضافة مستند','Adicionar um documento','Añadir un documento'],
 ['Tous les papiers pour un contrôle d’hygiène, au même endroit.','All the papers for a hygiene inspection, in one place.','சுகாதார ஆய்வுக்கான அனைத்து ஆவணங்களும் ஒரே இடத்தில்.','كل الأوراق لتفتيش النظافة في مكان واحد.','Todos os papéis para uma inspeção de higiene, no mesmo sítio.','Todos los papeles para una inspección de higiene, en un solo lugar.'],
].forEach(r=>LANGS.forEach(([k],i)=>{if(i&&I18N[k])I18N[k][r[0]]=r[i];}));

/* ---------- données : on garde plus longtemps, on archive ---------- */
{const D=DOCS.hygiene;DOCS.hygiene={p:D.p,
  out:R=>{const lim=isoD(addDays(TODAY,-HC_LIGNE_J));const h=R.hyg||{};
    return {...D.out(R),etqLog:(h.etqLog||[]).filter(x=>x.date>=lim).slice(0,600),etqMaison:R.etqMaison||[],
      lotsFinis:(h.lotsFinis||[]).filter(x=>(x.dateOuverture||x.finiLe||'')>=lim),docs:h.docs||[]};},
  in:(R,d)=>{D.in(R,d);R.hyg.etqLog=d.etqLog||[];R.hyg.lotsFinis=d.lotsFinis||[];R.hyg.docs=d.docs||[];R.etqMaison=d.etqMaison||[];}};}
// les listes d'ouverture / fermeture cochées : 6 mois au lieu de 3
{const D=DOCS.ops;DOCS.ops={p:D.p,
  out:R=>{const o=D.out(R);const lim=isoD(addDays(TODAY,-HC_LIGNE_J));const td={};Object.keys(R.taskDone||{}).filter(k=>k>=lim).forEach(k=>td[k]=R.taskDone[k]);return {...o,taskDone:td};},
  in:D.in};}
// les préparations maison des étiquettes sont rangées avec l'hygiène
etqHome=function(){if(!S.etqMaison)S.etqMaison=[];return S.etqMaison;};
const hcHyg=()=>{if(!S.hyg)S.hyg={equip:defaultHygEquip(),temps:[],lots:[]};['lotsFinis','docs','etqLog','recs'].forEach(k=>{if(!Array.isArray(S.hyg[k]))S.hyg[k]=[];});return S.hyg;};

// produit ouvert : on note qui et à quelle heure ; « retirer » = archiver, plus effacer
{const f=ACT['kiosk-lot-save'];ACT['kiosk-lot-save']=function(){
  const before=new Set((S.hyg.lots||[]).map(l=>l.id));f.apply(this,arguments);
  const lot=(S.hyg.lots||[]).find(l=>!before.has(l.id));if(lot){lot.ouvertM=nowMin();lot.ouvertPar=me().prenom||'';save();}
};}
function hcArchiveLot(id){
  const h=hcHyg();const lot=(h.lots||[]).find(l=>l.id===id);if(!lot)return;
  h.lots=h.lots.filter(l=>l.id!==id);
  h.lotsFinis=[{...lot,statut:'fini',finiLe:TODAY_ISO,finiPar:me().prenom||''},...h.lotsFinis];
}
ACT['kiosk-lot-del']=function(t){hcArchiveLot(t.dataset.id);save();render();};
ACT['hyg-lot-del']=function(t){confirmBox({title:'Retirer ce produit du suivi ?',text:'Il part dans l’historique du classeur HACCP (gardé 6 mois).',ok:'Retirer',onOk:()=>{hcArchiveLot(t.dataset.id);save();render();}});};
// ménage : photo des produits ouverts effacée après 1 mois (une fois par session, côté direction)
let HC_PURGE=false;
function hcPurge(){
  if(HC_PURGE||!S||effRole()==='staff')return;HC_PURGE=true;
  try{const lim=isoD(addDays(TODAY,-HC_PHOTO_J));
    [...(S.hyg.lots||[]),...(S.hyg.lotsFinis||[])].forEach(l=>{if((l.dateOuverture||l.recep||'9')<lim&&photoOf('lot_'+l.id))photoSet('lot_'+l.id,null);});}catch(e){}
}

/* ---------- documents déposés (photo ou PDF) ---------- */
const HC_CATS={
  pms:{t:'Plan de maîtrise sanitaire (PMS)',s:'Ton PMS et ton plan HACCP : le classeur papier en photo, ou le PDF.',need:'bad'},
  decl:{t:'Déclaration d’activité',s:'Le récépissé de déclaration à la DDPP (Cerfa 13984).',need:'warn'},
  form:{t:'Formation hygiène',s:'Les attestations de formation (au moins une personne formée).'},
  plan:{t:'Plan de la cuisine',s:'Le plan des locaux pour la marche en avant.',need:'warn'},
  nuis:{t:'Nuisibles',s:'Le contrat de dératisation et les fiches de passage signées.',need:'bad'},
  eau:{t:'Analyses',s:'Analyses d’eau, autocontrôles du labo… si tu en as.',opt:true},
  autre:{t:'Autres documents',s:'Tout ce qui peut servir : certificats, fiches techniques fournisseurs…',opt:true},
};
const HC_D={};let HC_SUB=null;
function hcDocsLoad(){
  if(HC_SUB||!S)return;const id=S.id;
  HC_SUB=subColl(`restos/${id}/haccp`,list=>{list.forEach(x=>{if(x&&x.id&&x.d)HC_D[x.id]=x.d;});if(UI.hc&&UI.hc.open)scheduleRender();});
}
// déposer / retirer un document : tablette du resto, patron, directeur, créateur (pas le téléphone d'un manager)
const hcCanEdit=()=>U.screen==='kiosk'||U.role==='admin'||U.role==='patron'||!!(CAN().settings);
const hcDocs=cat=>hcHyg().docs.filter(d=>!cat||d.cat===cat).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
function hcPick(cat){
  const inp=document.createElement('input');inp.type='file';inp.accept='image/*,application/pdf';inp.style.display='none';document.body.appendChild(inp);
  inp.onchange=async()=>{
    const f=inp.files&&inp.files[0];inp.remove();if(!f)return;
    let d,type;
    try{
      if(f.type==='application/pdf'){
        if(f.size>3e6){toast('PDF trop lourd (3 Mo max). Prends plutôt les pages en photo.','alert');return;}
        d=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f);});type='pdf';
      }else{d=await imgToDataUrl(f,1600,false,0.75);type='img';}
    }catch(e){toast('Impossible de lire ce fichier','alert');return;}
    const id=uid('hd');const fn=(f.name||'').replace(/\.[a-z0-9]+$/i,'');const nom=(type==='pdf'&&fn&&!/^(image|img|photo|scan|doc|document)[ _-]?\d*$/i.test(fn))?fn:HC_CATS[cat].t+' du '+frLongDate(TODAY_ISO);
    HC_D[id]=d;
    hcHyg().docs=[{id,cat,n:nom.slice(0,80),type,date:TODAY_ISO,by:me().prenom||whoName()||''},...hcHyg().docs];
    if(STORE.mode!=='demo')storeSet(`restos/${S.id}/haccp/${id}`,{id,d,type,at:Date.now()}).catch(e=>onStoreErr(e));
    save();render();toast('Document ajouté au classeur','check');
  };
  inp.click();
}
function hcView(id){
  const doc=hcHyg().docs.find(x=>x.id===id);const d=HC_D[id];
  if(!doc)return;if(!d){toast('Document en cours de chargement…','alert');hcDocsLoad();return;}
  if(doc.type==='pdf'){try{const b=atob(d.split(',')[1]);const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);window.open(URL.createObjectURL(new Blob([a],{type:'application/pdf'})),'_blank');}catch(e){toast('Impossible d’ouvrir ce PDF','alert');}return;}
  openModal(`<div class="mh"><div><h3>${esc(doc.n)}</h3><p>${esc(HC_CATS[doc.cat]?HC_CATS[doc.cat].t:'')} · ${frLongDate(doc.date)}${doc.by?' · '+esc(doc.by):''}</p></div><button class="icon-btn" data-act="modal-close" aria-label="${T('Fermer')}">${ic('x')}</button></div><img src="${d}" alt="" class="hc-big">`,'wide');
}

/* ---------- les rubriques et leur pastille ---------- */
const hcDaysBack=n=>{const L=[];for(let i=1;i<=n;i++){const d=addDays(TODAY,-i);if(!isClosed((d.getDay()+6)%7))L.push(isoD(d));}return L;};
function hcRubriques(){
  const h=hcHyg();const R=[];const lim30=isoD(addDays(TODAY,-30));
  const doc=(k)=>{const c=HC_CATS[k];const L=hcDocs(k);
    let st=L.length?'ok':c.opt?'info':(c.need||'warn'),line=L.length?`${plur(L.length,'document')} · le dernier du ${frLongDate(L[0].date)}`:c.opt?'Facultatif':'À déposer';
    if(k==='nuis'&&L.length){const m=Math.floor((TODAY-pdate(L[0].date))/(30.4*864e5));if(m>=6){st='warn';line=`Dernier passage déposé il y a ${m} mois`;}}
    if(k==='form'){const tr=EMP.filter(e=>!e.hidden&&e.docs&&e.docs.hyg);if(tr.length){st='ok';line=`${plur(tr.length,'personne formée','personnes formées')} (fiches salariés)${L.length?' · '+plur(L.length,'attestation'):''}`;}else if(!L.length){st='bad';line='Personne n’est noté formé à l’hygiène';}}
    return {k,kind:'doc',t:c.t,s:c.s,st,line,ic:k==='nuis'?'alert':k==='form'?'users':'file'};};
  // papiers de base
  R.push(doc('pms'),doc('decl'),doc('form'),doc('plan'),doc('nuis'));
  // températures
  const eqs=h.equip||[];const temps=h.temps||[];const d7=hcDaysBack(7);
  const miss=d7.filter(d=>!temps.some(t=>t.date===d)).length;const n30=temps.filter(t=>t.date>=lim30).length;
  R.push({k:'temp',kind:'auto',ic:'thermo',t:'Températures des frigos',s:`${plur(eqs.length,'appareil')} suivis, relevés horodatés et signés.`,
    st:!n30?'bad':miss?'warn':'ok',line:!n30?'Aucun relevé depuis 30 jours':miss?`${plur(miss,'jour')} sans relevé sur 7 jours`:'Relevé tous les jours cette semaine'});
  const anoms=temps.filter(t=>t.date>=lim30&&!t.action&&(()=>{const eq=eqs.find(q=>q.id===t.eq);return eq&&hygBad(eq,t.val);})());
  R.push({k:'corr',kind:'auto',ic:'check',t:'Actions correctives',s:'Ce qui a été fait quand un relevé n’était pas bon.',st:anoms.length?'warn':'ok',line:anoms.length?`${plur(anoms.length,'relevé hors norme','relevés hors norme')} sans action notée`:'Chaque anomalie a son action'});
  // nettoyage
  let n=0,ok=0;const tl=tasksOf();d7.forEach(d=>tl.forEach(L=>{if(!tkAssign(L,d).length)return;n++;if(tkProgress(L,d).done)ok++;}));
  R.push({k:'net',kind:'auto',ic:'broom',t:'Plan de nettoyage',s:`${plur(tl.length,'liste')} d’ouverture et de fermeture, cochées tâche par tâche.`,
    st:!n?'warn':ok/n>=0.9?'ok':'warn',line:n?`${Math.round(ok/n*100)} % des listes faites sur 7 jours`:'Aucune liste prévue cette semaine'});
  // traçabilité
  const recs=(h.recs||[]).filter(r=>r.iso>=lim30).length+(S.orders||[]).filter(o=>o.received&&o.received>=lim30).length;
  const ouv=[...(h.lots||[]),...h.lotsFinis].filter(l=>(l.dateOuverture||'')>=lim30).length;
  const etq=h.etqLog.filter(x=>x.date>=lim30).reduce((s,x)=>s+(x.q||0),0);
  R.push({k:'trace',kind:'auto',ic:'truck',t:'Traçabilité',s:'Réceptions, produits ouverts (photo), étiquettes DLC imprimées.',
    st:recs+ouv+etq?'ok':'warn',line:recs+ouv+etq?`30 jours : ${plur(recs,'réception')} · ${plur(ouv,'produit ouvert','produits ouverts')} · ${plur(etq,'étiquette')}`:'Rien d’enregistré depuis 30 jours'});
  // allergènes, fournisseurs
  const plats=(S.recipes||[]).length;
  R.push({k:'alg',kind:'auto',ic:'shield',t:'Allergènes',s:'Le tableau des 14 allergènes de la carte, à afficher ou à montrer au client.',st:plats?'ok':'warn',line:plats?`Tableau prêt (${plur(plats,'plat')})`:'Ajoute tes plats pour le tableau'});
  const sups=Object.keys(S.suppliers||{}).length;
  R.push({k:'four',kind:'auto',ic:'truck',t:'Fournisseurs',s:'La liste de tes fournisseurs, pour remonter un produit.',st:sups?'ok':'warn',line:sups?plur(sups,'fournisseur'):'Aucun fournisseur enregistré'});
  R.push(doc('eau'),doc('autre'));
  return R;
}
const HC_ST={ok:{l:'à jour',c:'ok'},warn:{l:'à compléter',c:'warn'},bad:{l:'manquant',c:'bad'},info:{l:'facultatif',c:''}};

/* ---------- l'écran du classeur ---------- */
UI.hc={open:false,ctrl:false,day:null};
function hcBodyHTML(where){
  hcDocsLoad();hcPurge();
  if(UI.hc.ctrl)return hcCtrlHTML(where);
  const R=hcRubriques();const nb=R.filter(r=>r.st==='bad'||r.st==='warn').length;
  const card=r=>`<button class="hc-r ${r.st}" data-act="hc-rub" data-k="${r.k}"><span class="hc-dot ${HC_ST[r.st].c}" aria-hidden="true"></span>
    <span class="hc-r-b"><b>${esc(r.t)}</b><small>${esc(r.line)}</small></span><span class="pill ${HC_ST[r.st].c}">${esc(T(HC_ST[r.st].l))}</span>${ic('chevR','s')}</button>`;
  return `<div class="hc-head"><div><h2 class="hc-h">${ic('shield')} ${T('Classeur HACCP')}</h2><p class="sub">${T('Tous les papiers pour un contrôle d’hygiène, au même endroit.')}</p></div>
    <div class="hc-acts"><button class="btn primary big" data-act="hc-ctrl">${ic('eye','s')} ${T('Mode contrôle')}</button><button class="btn big" data-act="hc-pdf">${ic('printer','s')} ${T('Tout sortir en PDF')}</button></div></div>
   <div class="hc-sum ${nb?'warn':'ok'}">${nb?`${ic('alert','s')} <b>${plur(nb,'rubrique')} à compléter</b> avant le prochain contrôle.`:`${ic('check','s')} <b>Tout est à jour.</b> Tu es prêt pour un contrôle.`}</div>
   <h3 class="hc-g">Les papiers à avoir</h3><div class="hc-list">${R.filter(r=>r.kind==='doc'&&!HC_CATS[r.k].opt).map(card).join('')}</div>
   <h3 class="hc-g">Ce que Léon remplit tout seul</h3><div class="hc-list">${R.filter(r=>r.kind==='auto').map(card).join('')}</div>
   <h3 class="hc-g">En plus</h3><div class="hc-list">${R.filter(r=>r.kind==='doc'&&HC_CATS[r.k].opt).map(card).join('')}</div>`;
}
function hcRubModal(k){
  const r=hcRubriques().find(x=>x.k===k);if(!r)return;
  let body='';
  if(r.kind==='doc'){
    const L=hcDocs(k);
    body=`${L.length?`<div class="hc-docs">${L.map(d=>`<div class="hc-doc"><button class="hc-doc-ph" data-act="hc-view" data-id="${d.id}">${d.type==='pdf'?`<span class="hc-pdf">PDF</span>`:HC_D[d.id]?`<img src="${HC_D[d.id]}" alt="">`:ic('file')}</button>
      <div class="hc-doc-b"><b>${esc(d.n)}</b><small>${frLongDate(d.date)}${d.by?' · '+esc(d.by):''}</small></div>
      <button class="btn sm" data-act="hc-view" data-id="${d.id}">${ic('eye','s')} Voir</button>${hcCanEdit()?`<button class="icon-btn" data-act="hc-del" data-id="${d.id}" aria-label="Retirer">${ic('trash','s')}</button>`:''}</div>`).join('')}</div>`:`<p class="faint" style="margin:4px 0 14px">Rien de déposé pour l’instant.</p>`}
     ${hcCanEdit()?`<button class="btn primary big block" data-act="hc-add" data-k="${k}">${ic('camera','s')} ${T('Ajouter un document')}</button>
     <p class="faint" style="font-size:12.5px;margin-top:8px">Une photo (même plusieurs pages, une par une) ou un PDF de 3 Mo maximum.</p>`:`<p class="faint" style="font-size:12.5px">Le patron ou le directeur ajoute les documents (sur la tablette du resto ou sur son ordinateur).</p>`}`;
    if(k==='form'){const tr=EMP.filter(e=>!e.hidden&&e.docs&&e.docs.hyg);body=`${tr.length?`<p style="margin:0 0 12px"><b>Formés à l’hygiène :</b> ${tr.map(e=>`${esc(e.prenom)} (${frLongDate(e.docs.hyg)})`).join(', ')}</p>`:''}`+body;}
  }else{
    const go={temp:'temp',corr:'temp',net:'taches',trace:'trace'}[k];
    const extra=k==='alg'?`<button class="btn primary big block" data-act="hc-alg">${ic('printer','s')} Imprimer le tableau des allergènes</button>`
      :`<p class="faint" style="margin:0 0 12px">Léon le remplit tout seul au fil des jours. Pour voir un jour précis, ouvre le mode contrôle.</p><button class="btn primary big block" data-act="hc-ctrl">${ic('eye','s')} ${T('Mode contrôle')}</button>`;
    body=extra+(go&&U.screen!=='kiosk'?`<button class="btn ghost block" style="margin-top:8px" data-act="hc-goto" data-t="${go}">Voir le détail dans Hygiène</button>`:'');
  }
  openModal(`<div class="mh"><div><h3><span class="hc-dot ${HC_ST[r.st].c}"></span> ${esc(r.t)}</h3><p>${esc(r.s)}</p></div><button class="icon-btn" data-act="modal-close" aria-label="${T('Fermer')}">${ic('x')}</button></div>
    <p class="hc-line ${r.st}"><b>${esc(r.line)}</b></p>${body}`,'narrow');
}

/* ---------- mode contrôle : un jour, tout ce qui s'est passé ---------- */
function hcCtrlHTML(where){
  const day=UI.hc.day||TODAY_ISO;const h=hcHyg();const eqs=h.equip||[];
  const sec=(t,i,inner,n)=>`<section class="hc-sec"><h3>${ic(i,'s')} ${t}${n!=null?` <span class="faint">${n}</span>`:''}</h3>${inner}</section>`;
  const none=s=>`<p class="faint">${s}</p>`;
  const temps=(h.temps||[]).filter(t=>t.date===day).sort((a,b)=>(a.ts||0)-(b.ts||0));
  const acL=k=>(AC_OPTS.find(x=>x[0]===k)||[,k])[1];
  const tT=temps.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Heure</th><th>Appareil</th><th class="r">Température</th><th>Action</th><th>Par</th></tr></thead><tbody>${temps.map(t=>{const eq=eqs.find(q=>q.id===t.eq)||{nom:'?'};const bad=eq.min!=null&&hygBad(eq,t.val);return `<tr><td class="tnum">${t.ts!=null?hhmm(t.ts):'—'}</td><td>${esc(eq.nom)}</td><td class="r tnum ${bad?'hc-bad':''}"><b>${nf(t.val,1)} °C</b></td><td>${t.action?esc(acL(t.action.k))+(t.action.note?' · '+esc(t.action.note):''):bad?'<span class="hc-bad">Non renseignée</span>':'—'}</td><td>${esc((t.action&&t.action.by)||t.who||'')}</td></tr>`;}).join('')}</tbody></table></div>`:none('Aucun relevé ce jour-là.');
  const lots=[...(h.lots||[]),...h.lotsFinis].filter(l=>l.dateOuverture===day);
  const tL=lots.length?`<div class="hc-lots">${lots.map(l=>{const ph=photoOf('lot_'+l.id);return `<div class="hc-lot">${ph?`<img src="${ph}" alt="" data-act="hc-ph" data-k="lot_${l.id}">`:`<span class="hc-noph">${ic('camera')}</span>`}<div><b>${esc(l.nom)}</b><small>${l.ouvertM!=null?'Ouvert à '+hhmm(l.ouvertM):'Ouvert ce jour'}${l.ouvertPar?' · '+esc(l.ouvertPar):''}</small><small>DLC ${frLongDate(lotEffDlc(l))}${l.statut==='fini'?` · terminé le ${frLongDate(l.finiLe)}`:''}</small></div></div>`;}).join('')}</div>`:none('Aucun produit ouvert enregistré ce jour-là.');
  const etq=h.etqLog.filter(x=>x.date===day);
  const tE=etq.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Heure</th><th>Produit</th><th class="r">Nombre</th><th>DLC</th><th>Par</th></tr></thead><tbody>${etq.map(x=>`<tr><td class="tnum">${hhmm(x.m)}</td><td><b>${esc(x.n)}</b></td><td class="r tnum">${x.q}</td><td>${frLongDate(x.dlc)} · ${hhmm(x.dlcM)}</td><td>${esc(x.who||'')}</td></tr>`).join('')}</tbody></table></div>`:none('Aucune étiquette imprimée ce jour-là.');
  const recs=(h.recs||[]).filter(r=>r.iso===day);
  const ords=(S.orders||[]).filter(o=>o.received===day);
  const tR=recs.length||ords.length?`${recs.length?`<div class="hc-lots">${recs.map(r=>`<div class="hc-lot">${r.photo?`<img src="${r.photo}" alt="" data-act="hc-img" data-i="${esc(r.id)}">`:`<span class="hc-noph">${ic('file')}</span>`}<div><b>${esc(r.f||'Livraison')}</b><small>${r.m!=null?hhmm(r.m):''}${r.temp!==''&&r.temp!=null?` · ${esc(r.temp)} °C`:''} · ${r.ok?'Conforme':'<span class="hc-bad">Problème</span>'}</small>${r.note?`<small>${esc(r.note)}</small>`:''}<small>${esc(r.by||'')}</small></div></div>`).join('')}</div>`:''}
    ${ords.map(o=>`<p style="margin:8px 0 0"><b>${esc(o.f)}</b> · ${(o.lines||[]).map(l=>{const i=ING(l.id)||{n:'?'};return esc(i.n)+(l.temp?` (${esc(l.temp)} °C)`:'')+(l.dlc?` DLC ${frDate(l.dlc)}`:'');}).join(' · ')}</p>`).join('')}`:none('Aucune réception ce jour-là.');
  const tl=tasksOf().filter(L=>tkAssign(L,day).length||tkProgress(L,day).k);
  const hcAt=a=>{if(!a)return '';if(a>1e9){const x=new Date(a);return pad(x.getHours())+':'+pad(x.getMinutes());}return hhmm(a);};
  const tN=tl.length?tl.map(L=>{const D=tkDoneOf(day,L.id);const p=tkProgress(L,day);return `<div class="hc-tk"><div class="hc-tk-h"><b>${esc(L.n)}</b><span class="pill ${p.done?'ok':(day<TODAY_ISO||tkState(L,day).k==='late')?(p.k?'warn':'bad'):''}">${p.k}/${p.n}</span></div><ul>${L.items.map((it,i)=>{const d=D.items[i];const late=day<TODAY_ISO||tkState(L,day).k==='late';return `<li class="${d?'on':late?'':'todo'}">${ic(d?'check':late?'x':'clock','s')} ${esc(it.t)}${d?` <small>${hcAt(d.at)}${d.by?' · '+esc(d.by):''}</small>`:''}</li>`;}).join('')}</ul></div>`;}).join(''):none('Aucune liste ce jour-là.');
  const pertes=(S.pertes||[]).filter(p=>p.date===day&&p.motif==='dlc');
  const tP=pertes.length?`<ul class="hc-ul">${pertes.map(p=>`<li><b>${esc(p.n)}</b> · ${nf(p.q,p.q%1?2:0)} ${esc(p.u||'')}${p.by?' · '+esc(p.by):''}</li>`).join('')}</ul>`:none('Aucun produit jeté pour DLC ce jour-là.');
  const docs=hcDocs();
  const tD=docs.length?`<div class="hc-docs">${docs.map(d=>`<button class="hc-doc hc-doc-btn" data-act="hc-view" data-id="${d.id}"><span class="hc-doc-ph">${d.type==='pdf'?'<span class="hc-pdf">PDF</span>':HC_D[d.id]?`<img src="${HC_D[d.id]}" alt="">`:ic('file')}</span><span class="hc-doc-b"><b>${esc(HC_CATS[d.cat]?HC_CATS[d.cat].t:'')}</b><small>${esc(d.n)} · ${frLongDate(d.date)}</small></span></button>`).join('')}</div>`:none('Aucun document déposé.');
  const isToday=day===TODAY_ISO;
  return `<div class="hc-ctrl-top"><div><span class="pill info">${ic('eye','s')} ${T('Mode contrôle')}</span><h2 class="hc-h">${esc(S.nom||'')}</h2><p class="sub">Hygiène et traçabilité, jour par jour. Tout est horodaté et signé par la personne qui l’a saisi.</p></div>
    <button class="btn" data-act="hc-ctrl-off">${ic('x','s')} ${T('Quitter le mode contrôle')}</button></div>
   <div class="hc-daybar"><button class="btn big" data-act="hc-day" data-d="-1" aria-label="Jour précédent">${ic('chevL','s')}</button>
    <label class="hc-day"><b>${isToday?'Aujourd’hui':JC[(pdate(day).getDay()+6)%7]+'.'} ${frLongDate(day)}</b><input type="date" value="${day}" max="${TODAY_ISO}" min="${isoD(addDays(TODAY,-HC_LIGNE_J))}" data-ch="hc-day" aria-label="Choisir le jour"></label>
    <button class="btn big" data-act="hc-day" data-d="1" ${isToday?'disabled':''} aria-label="Jour suivant">${ic('chevR','s')}</button></div>
   ${sec('Températures','thermo',tT,temps.length)}
   ${sec('Produits ouverts','camera',tL,lots.length)}
   ${sec('Étiquettes DLC imprimées','tag',tE,etq.reduce((s,x)=>s+x.q,0))}
   ${sec('Réceptions','truck',tR,recs.length+ords.length)}
   ${sec('Nettoyage','broom',tN)}
   ${sec('Produits retirés (DLC dépassée)','trash',tP,pertes.length)}
   ${sec('Documents du classeur','file',tD,docs.length)}
   <p class="faint" style="font-size:12.5px;margin-top:14px">Photos des produits ouverts gardées 1 mois, lignes écrites 6 mois.</p>`;
}

/* ---------- le PDF : le dossier existant + étiquettes + produits ouverts archivés + documents ---------- */
function hcPdfOpen(){
  openModal(`<div class="mh"><div><h3>${ic('printer')} ${T('Tout sortir en PDF')}</h3><p>Le dossier complet, rangé comme le contrôleur le demande, avec les documents déposés à la fin. Sur l’iPad : Imprimer, puis « Enregistrer dans Fichiers » pour avoir le PDF.</p></div><button class="icon-btn" data-act="modal-close" aria-label="${T('Fermer')}">${ic('x')}</button></div>
   <div class="field"><span class="lbl">Période</span><span class="seg">${[[1,'1 mois'],[3,'3 mois'],[6,'6 mois']].map(([m,l])=>`<button data-act="pms-m" data-m="${m}" aria-pressed="${UI.pms.m===m}">${l}</button>`).join('')}</span></div>
   <div class="mf"><button class="btn" data-act="modal-close">${T('Fermer')}</button><button class="btn primary" data-act="hc-pdf-go">${ic('printer','s')} Imprimer / PDF</button></div>`,'narrow');
}
function hcPdfHTML(){
  const h=hcHyg();const from=isoD(addDays(TODAY,-Math.round(UI.pms.m*30.4)));
  const keep=h.lots;h.lots=[...keep,...h.lotsFinis.filter(l=>(l.dateOuverture||'')>=from)];
  let base;try{base=pmsHTML().replace('Produits suivis en ce moment','Produits suivis et produits ouverts');}finally{h.lots=keep;}
  const etq=h.etqLog.filter(x=>x.date>=from);
  const docs=hcDocs();
  const extra=`<h2>7. Étiquettes DLC imprimées</h2>${etq.length?`<table><thead><tr><th>Date</th><th>Produit</th><th class="r">Nombre</th><th>DLC</th><th>Par</th></tr></thead><tbody>${etq.slice(0,300).map(x=>`<tr><td>${frLongDate(x.date)} ${hhmm(x.m)}</td><td>${esc(x.n)}</td><td class="r">${x.q}</td><td>${frLongDate(x.dlc)} ${hhmm(x.dlcM)}</td><td>${esc(x.who||'')}</td></tr>`).join('')}</tbody></table>`:'<p>Aucune étiquette imprimée sur la période.</p>'}
   <h2>8. Documents du classeur HACCP</h2>${docs.length?`<table><thead><tr><th>Rubrique</th><th>Document</th><th>Déposé le</th><th>Par</th></tr></thead><tbody>${docs.map(d=>`<tr><td>${esc(HC_CATS[d.cat]?HC_CATS[d.cat].t:'')}</td><td>${esc(d.n)}${d.type==='pdf'?' (PDF, à ouvrir dans Léon)':''}</td><td>${frLongDate(d.date)}</td><td>${esc(d.by||'')}</td></tr>`).join('')}</tbody></table>`:'<p class="pms-warn">Aucun document déposé (PMS, déclaration, nuisibles…).</p>'}
`;
  const annex=docs.filter(d=>d.type==='img'&&HC_D[d.id]).map(d=>`<div class="hc-annex"><h3>${esc(d.n)}</h3><img src="${HC_D[d.id]}" alt=""></div>`).join('');
  const i=base.lastIndexOf('<p class="pms-f">');const j=base.lastIndexOf('</div>');
  if(i<0||j<i)return base+extra+annex;
  return base.slice(0,i)+extra+base.slice(i,j)+annex+base.slice(j);
}

/* ---------- branchements : tablette ---------- */
{const f=kioskHygieneHomeHTML;kioskHygieneHomeHTML=function(){
  const o=f.apply(this,arguments).replace('Une étiquette en un clic, par catégorie de produit',T('Touche les produits, imprime d’un coup'));
  if(effRole()==='staff')return o;
  return o+`<div class="hc-door-wrap"><button class="hc-door" data-act="kiosk-hyg-go" data-v="haccp">${ic('shield','s')} HACCP</button></div>`;
};}
{const f=kioskHygieneHTML;kioskHygieneHTML=function(){
  if(UI.kiosk&&UI.kiosk.hyg==='haccp'){
    if(effRole()==='staff'){UI.kiosk.hyg=null;return f.apply(this,arguments);}
    UI.hc.open=true;return (UI.hc.ctrl?'':kioskBackHTML('kiosk-hyg-home','Hygiène'))+`<div class="hc">${hcBodyHTML('tab')}</div>`;
  }
  UI.hc.open=false;UI.hc.ctrl=false;return f.apply(this,arguments);
};}
// en mode contrôle, la tablette ne se verrouille pas au bout de 3 minutes (jusqu'à 20 min)
setInterval(()=>{try{if(U.screen==='kiosk'&&UI.hc.ctrl&&UI.hc.since&&Date.now()-UI.hc.since<20*60e3)LAST_ACT=Date.now();}catch(e){}},20e3);

/* ---------- branchements : PC / téléphone ---------- */
{const f=viewHygiene;viewHygiene=function(){
  if(UI.hc.open&&effRole()!=='staff'){
    return `<div class="ph"><div><button class="btn ghost sm" data-act="hc-close">${ic('chevL','s')} ${T('Hygiène')}</button></div></div><div class="hc">${hcBodyHTML('pc')}</div>`;
  }
  let o=f.apply(this,arguments);
  const btn=`<button class="btn primary" data-act="hc-open">${ic('shield','s')} ${T('Classeur HACCP')}</button>`;
  if(o.includes('data-act="pms-open"'))o=o.replace(/<button class="btn" data-act="pms-open">[\s\S]*?<\/button>/,btn);
  else if(effRole()!=='staff')o=o.replace(/(<div class="ph"><div>[\s\S]*?<\/div>)/,`$1<div class="acts">${btn}</div>`);
  return o;
};}

Object.assign(ACT,{
  'hc-open'(){UI.hc.open=true;UI.hc.ctrl=false;render();window.scrollTo(0,0);},
  'hc-close'(){UI.hc.open=false;UI.hc.ctrl=false;render();},
  'hc-rub'(t){hcRubModal(t.dataset.k);},
  'hc-add'(t){closeModal();hcPick(t.dataset.k);},
  'hc-view'(t){hcView(t.dataset.id);},
  'hc-del'(t){const id=t.dataset.id;const d=hcHyg().docs.find(x=>x.id===id);if(!d)return;
    confirmBox({title:'Retirer ce document du classeur ?',text:`« ${d.n} » ne sera plus dans le classeur HACCP.`,ok:'Retirer',danger:true,onOk:()=>{
      hcHyg().docs=hcHyg().docs.filter(x=>x.id!==id);delete HC_D[id];if(STORE.mode!=='demo')storeDel(`restos/${S.id}/haccp/${id}`).catch(e=>onStoreErr(e));save();render();}});},
  'hc-ctrl'(){closeModal();UI.hc.ctrl=true;UI.hc.since=Date.now();UI.hc.day=TODAY_ISO;render();window.scrollTo(0,0);const b=document.querySelector('.kiosk-body');if(b)b.scrollTop=0;},
  'hc-ctrl-off'(){UI.hc.ctrl=false;render();},
  'hc-day'(t){const d=addDays(pdate(UI.hc.day||TODAY_ISO),+t.dataset.d);const iso=isoD(d);if(iso>TODAY_ISO)return;UI.hc.day=iso;UI.hc.since=Date.now();render();},
  'hc-ph'(t){const ph=photoOf(t.dataset.k);if(ph)openModal(`<div class="mh"><div><h3>${T('Produit ouvert')}</h3></div><button class="icon-btn" data-act="modal-close" aria-label="${T('Fermer')}">${ic('x')}</button></div><img src="${ph}" alt="" class="hc-big">`,'wide');},
  'hc-img'(t){const r=hcHyg().recs.find(x=>x.id===t.dataset.i);if(r&&r.photo)openModal(`<div class="mh"><div><h3>${esc(r.f||'Livraison')}</h3></div><button class="icon-btn" data-act="modal-close" aria-label="${T('Fermer')}">${ic('x')}</button></div><img src="${r.photo}" alt="" class="hc-big">`,'wide');},
  'hc-pdf'(){hcPdfOpen();},
  'hc-pdf-go'(){closeModal();hcDocsLoad();printHTML('print-pms','printing-pms',hcPdfHTML());},
  'hc-alg'(){closeModal();allergenPrint();},
  'hc-goto'(t){closeModal();UI.hc.open=false;UI.hyg.tab=t.dataset.t;render();},
});
CH['hc-day']=t=>{const v=t.value;if(!v||v>TODAY_ISO)return;UI.hc.day=v;UI.hc.since=Date.now();render();};
