/* =========================================================
   V11 · MISE EN ROUTE EN 30 MINUTES
   Importer l'équipe, la carte et les produits depuis Excel,
   Google Sheets, un fichier CSV, un texte copié… ou une photo du menu.
   ========================================================= */
const IMP_KINDS={
 equipe:{l:'L’équipe',i:'users',hint:'Une ligne par salarié : prénom, nom, poste, heures par semaine, téléphone…',fields:[['prenom','Prénom'],['nom','Nom'],['poste','Poste'],['contrat','Heures / semaine'],['taux','Coût horaire'],['tel','Téléphone'],['type','Type de contrat']]},
 carte:{l:'La carte',i:'plate',hint:'Une ligne par plat ou boisson : nom, prix, catégorie. Tu peux aussi coller le texte de ton menu tel quel.',fields:[['n','Nom'],['pv','Prix TTC'],['cat','Catégorie'],['tva','TVA']]},
 produits:{l:'Les produits',i:'box',hint:'Ta mercuriale : produit, unité, prix d’achat HT, fournisseur, catégorie.',fields:[['n','Produit'],['u','Unité'],['p','Prix HT'],['f','Fournisseur'],['c','Catégorie']]},
};
const IMP_SYN={
 prenom:['prénom','prenom','first name','firstname','prénom usuel'],nom:['nom','nom de famille','last name','lastname','surname'],poste:['poste','fonction','rôle','role','emploi','job','service'],contrat:['contrat','heures','h/sem','heures hebdo','hebdo','durée','duree','temps de travail'],taux:['taux','taux horaire','salaire horaire','coût horaire','cout horaire'],tel:['téléphone','telephone','tel','tél','portable','mobile'],type:['type de contrat','type','nature du contrat'],
 n:['nom','produit','article','plat','désignation','designation','libellé','libelle','name','item','ingrédient','ingredient'],pv:['prix','prix ttc','pv','tarif','price','prix de vente','prix carte'],cat:['catégorie','categorie','famille','rubrique','category','type'],tva:['tva','taux tva','taux de tva'],
 u:['unité','unite','u','conditionnement','unit'],p:['prix','prix ht','pu','prix unitaire','pu ht','tarif','prix achat','prix d’achat'],f:['fournisseur','supplier','frs','fourn'],c:['catégorie','categorie','famille','rayon'],
};
UI.imp={k:'equipe',txt:'',rows:null,head:false,map:{},replace:false,busy:false};
const normH=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’']/g,'’').trim();
function splitCsv(line,sep){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(q){if(ch==='"'&&line[i+1]==='"'){cur+='"';i++;}else if(ch==='"')q=false;else cur+=ch;}else if(ch==='"')q=true;else if(ch===sep){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out.map(x=>x.trim());}
function parseTable(txt){
  const lines=String(txt||'').replace(/\r/g,'').split('\n').filter(l=>l.trim());if(!lines.length)return null;
  const f=lines[0];const sep=(f.match(/\t/g)||[]).length?'\t':(f.match(/;/g)||[]).length>=(f.match(/,/g)||[]).length&&(f.match(/;/g)||[]).length?';':(f.match(/,/g)||[]).length?',':null;
  if(!sep)return null;
  return lines.map(l=>splitCsv(l,sep));
}
function guessMap(kind,rows){
  const F=IMP_KINDS[kind].fields.map(x=>x[0]);const h=rows[0].map(normH);const map={};let hits=0;
  F.forEach(k=>{const syn=(IMP_SYN[k]||[]).map(normH);const j=h.findIndex(x=>syn.includes(x)||syn.some(s=>s.length>3&&x.startsWith(s)));if(j>=0&&!Object.values(map).includes(j)){map[k]=j;hits++;}});
  if(hits){return {map,head:true};}
  const m2={};F.forEach((k,i)=>{if(i<rows[0].length)m2[k]=i;});
  if(kind==='carte'){const pj=rows[0].findIndex(x=>/^\d+([.,]\d{1,2})?\s*€?$/.test(String(x).trim()));if(pj>=0){m2.pv=pj;m2.n=pj===0?1:0;delete m2.cat;}}
  return {map:m2,head:false};
}
function numFr(v){const s=String(v==null?'':v).replace(/\s/g,'').replace('€','').replace(',','.');const n=parseFloat(s);return isNaN(n)?null:n;}
function posteOf(s){const t=normH(s);if(/cuisin|chef|commis|cook|second|pizzaiolo|patiss/.test(t))return 'cuisine';if(/plong/.test(t))return 'plonge';if(/\bbar|barman|barmaid|barista/.test(t))return 'bar';if(/manag|respons|directeur|gerant|adjoint/.test(t))return 'manager';if(/coiff/.test(t))return 'coiffeur';return 'salle';}
function catOf(s,name){
  const t=normH(s+' '+name);
  if(isSvcBiz()){if(/color|meche|balay|patine/.test(t))return 'coloration';if(/soin|brushing|lissage/.test(t))return 'soin';if(/forfait/.test(t))return 'forfait';return 'coupe';}
  if(/dessert|sucre|glace|gateau|tarte|creme brulee|mousse|tiramisu|fondant|crepe|gaufre/.test(t))return 'dessert';
  if(/boisson|vin|biere|pinte|demi|soft|cocktail|cafe|the |the$|infusion|eau|jus|sirop|soda|coca|drink|whisk|rhum|vodka|gin|pastis|champagne|cidre|limonade|spritz|mojito/.test(t))return 'boisson';
  if(/entree|starter|a partager|tapas|planche|soupe|veloute|croquette|bruschetta|nachos/.test(t))return 'entree';
  return rcats().includes('plat')?'plat':rcats()[0];
}
const ALCO=/biere|pinte|demi|vin|cocktail|whisk|rhum|vodka|gin|pastis|champagne|cidre|spritz|mojito|kir|ricard|aperol|stout|ipa|blonde|ambree/;
function unitOf(s){const t=normH(s);if(/^kg|kilo/.test(t))return 'kg';if(/^l$|^l |litre|^cl/.test(t))return 'L';if(/botte/.test(t))return 'botte';return 'pièce';}
function icatOf(s,name){const t=normH(s+' '+name);if(/boucher|viande|volaille|boeuf|porc|poulet|agneau|veau/.test(t))return 'viande';if(/poisson|maree|crevette|moule|saumon|cabillaud/.test(t))return 'poisson';if(/legume|fruit|primeur|salade|tomate|oignon|pomme de terre/.test(t))return 'legume';if(/cremer|fromage|lait|beurre|creme|oeuf/.test(t))return 'cremerie';if(/boisson|biere|vin|soda|jus|eau|sirop|fut/.test(t))return 'boisson';if(/pain|boulang|brioche/.test(t))return 'boulangerie';if(/entretien|hygiene|papier|sac|emballage|lessive|nettoy/.test(t))return 'conso';return 'epicerie';}
function parseMenuText(txt){
  const out=[];let cat='';
  String(txt||'').replace(/\r/g,'').split('\n').map(l=>l.trim()).filter(Boolean).forEach(l=>{
    const m=l.match(/^(.*?)[\s.·…_-]*?(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:€|eur|euros)?\s*$/i);
    if(m&&m[1].replace(/[\s.·…_-]+$/,'').length>=2){out.push({n:m[1].replace(/[\s.·…_-]+$/,'').replace(/^[-•*]\s*/,''),pv:numFr(m[2]),cat});}
    else if(l.length<42)cat=l;
  });
  return out;
}
function impRows(){
  const I=UI.imp;if(!I.rows)return [];
  const body=I.head?I.rows.slice(1):I.rows;const m=I.map;const g=(r,k)=>m[k]!=null&&m[k]>=0?String(r[m[k]]==null?'':r[m[k]]).trim():'';
  if(I.k==='equipe')return body.map(r=>{let pr=g(r,'prenom'),no=g(r,'nom');if(pr&&!no&&m.nom==null&&/\s/.test(pr)){const p=pr.split(/\s+/);pr=p.shift();no=p.join(' ');}return {prenom:pr,nom:no,poste:posteOf(g(r,'poste')),titre:g(r,'poste'),contrat:clamp(numFr(g(r,'contrat'))||35,1,48),taux:numFr(g(r,'taux')),tel:g(r,'tel'),type:/cdd/i.test(g(r,'type'))?'cdd':/extra/i.test(g(r,'type'))?'extra':/appren|altern/i.test(g(r,'type'))?'apprenti':'cdi'};}).filter(x=>x.prenom);
  if(I.k==='carte')return body.map(r=>{const n=g(r,'n');const t=catOf(g(r,'cat'),n);const tv=numFr(g(r,'tva'));return {n,pv:numFr(g(r,'pv')),t,tva:tv!=null?(tv<1?tv*100:tv):(t==='boisson'&&ALCO.test(normH(n))?20:10)};}).filter(x=>x.n&&x.pv!=null);
  return body.map(r=>{const n=g(r,'n');return {n,u:unitOf(g(r,'u')),p:numFr(g(r,'p')),f:g(r,'f')||'À renseigner',c:icatOf(g(r,'c'),n)};}).filter(x=>x.n&&x.p!=null);
}
function impParse(){
  const I=UI.imp;const t=I.txt;I.rows=null;I.map={};I.head=false;I.menu=null;
  const tab=parseTable(t);
  if(tab&&tab[0].length>1){const G=guessMap(I.k,tab);I.rows=tab;I.map=G.map;I.head=G.head;return;}
  if(I.k==='carte'){const items=parseMenuText(t);if(items.length){I.menu=items.map(x=>({...x,t:catOf(x.cat,x.n),tva:catOf(x.cat,x.n)==='boisson'&&ALCO.test(normH(x.n))?20:10}));}}
}
function impList(){const I=UI.imp;if(I.menu)return I.menu;return impRows();}
function impPreview(){
  const I=UI.imp;const L=impList();const K=IMP_KINDS[I.k];
  if(!I.txt.trim())return '';
  if(!L.length)return `<p class="pin-err" style="margin-top:10px">Léon ne reconnaît pas encore de lignes. Colle un tableau (une ligne par ${I.k==='equipe'?'salarié':I.k==='carte'?'plat':'produit'}) ou, pour la carte, le texte du menu avec les prix.</p>`;
  const mapUI=I.rows?`<div class="imp-map">${K.fields.map(([k,l])=>`<label class="field"><span class="lbl">${l}</span><select class="inp" data-ch="imp-map" data-k="${k}"><option value="-1">—</option>${I.rows[0].map((h,j)=>`<option value="${j}" ${I.map[k]===j?'selected':''}>${esc(I.head?h:'Colonne '+(j+1)+' ('+String(h).slice(0,14)+')')}</option>`).join('')}</select></label>`).join('')}<label class="keep imp-head"><input type="checkbox" data-ch="imp-head" ${I.head?'checked':''}> La 1re ligne contient les titres</label></div>`:'';
  const cols=I.k==='equipe'?[['prenom','Prénom'],['nom','Nom'],['poste','Poste'],['contrat','h/sem'],['tel','Téléphone']]:I.k==='carte'?[['n','Nom'],['t','Catégorie'],['pv','Prix TTC'],['tva','TVA']]:[['n','Produit'],['u','Unité'],['p','Prix HT'],['f','Fournisseur'],['c','Catégorie']];
  const fmt=(k,v)=>k==='poste'?POSTES[v].l:k==='t'?(RTYPE[v]?RTYPE[v].l:v):k==='pv'||k==='p'?eur(v):k==='tva'?v+' %':k==='c'?(ICAT[v]||v):esc(v==null?'':String(v));
  const exist=I.k==='equipe'?x=>EMP.some(e=>normH(e.prenom+' '+(e.nom||''))===normH(x.prenom+' '+x.nom)):I.k==='carte'?x=>S.recipes.some(r=>normH(r.n)===normH(x.n)):x=>S.ingredients.some(i=>normH(i.n)===normH(x.n));
  const nNew=L.filter(x=>!exist(x)).length;
  return `${mapUI}<div class="imp-sum"><span class="pill ok">${plur(nNew,'nouveau','nouveaux')}</span>${L.length-nNew?`<span class="pill">${plur(L.length-nNew,'déjà présent','déjà présents')} · ${I.k==='equipe'?'ignorés':'prix mis à jour'}</span>`:''}</div>
   <div class="tbl-wrap imp-prev"><table class="tbl"><thead><tr>${cols.map(([,l])=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${L.slice(0,40).map(x=>`<tr class="${exist(x)?'faint':''}">${cols.map(([k])=>`<td>${fmt(k,x[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${L.length>40?`<p class="faint" style="font-size:12.5px">+ ${L.length-40} autres lignes</p>`:''}
   ${I.k==='carte'&&S.recipes.some(r=>r.t!=='prep')?`<label class="keep" style="margin-top:8px"><input type="checkbox" data-ch="imp-repl" ${I.replace?'checked':''}> Retirer les produits du modèle de départ (garder seulement ma carte)</label>`:''}`;
}
function impRender(){
  const I=UI.imp;const K=IMP_KINDS[I.k];
  openModal(`<div class="mh"><div><h3>${ic('upload')} Importer ${K.l.toLowerCase()}</h3><p>${K.hint}</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <div class="seg imp-k">${Object.keys(IMP_KINDS).map(k=>`<button data-act="imp-k" data-k="${k}" aria-pressed="${I.k===k}">${ic(IMP_KINDS[k].i,'s')} ${IMP_KINDS[k].l}</button>`).join('')}</div>
   <div class="imp-src"><label class="btn sm">${ic('file','s')} Choisir un fichier (Excel, CSV)<input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" data-ch="imp-file" hidden></label>${I.k==='carte'?`<button class="btn sm" data-act="imp-photo" id="imp-photo" hidden>${ic('camera','s')} Photo du menu</button>`:''}<span class="faint" style="font-size:12.5px">ou colle directement ci-dessous</span></div>
   <textarea class="inp imp-ta" id="imp-ta" rows="6" data-in="imp-ta" placeholder="${I.k==='equipe'?'Prénom\tNom\tPoste\tHeures\nInès\tBenali\tServeuse\t35':I.k==='carte'?'Carbonade flamande ........ 18,50\nWelsh rarebit 17,90 €\nDESSERTS\nTarte au sucre 7,50':'Produit;Unité;Prix HT;Fournisseur\nJoue de bœuf;kg;14,50;Boucherie Vandamme'}">${esc(I.txt)}</textarea>
   <div id="imp-prev">${impPreview()}</div>
   <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="imp-go" ${impList().length?'':'disabled'}>${ic('check','s')} Importer</button></div>`,'wide');
  if(I.k==='carte'&&AI&&typeof AI.limits==='function'){AI.limits().then(c=>{const b=$('#imp-photo');if(b&&c&&c.images)b.hidden=false;}).catch(()=>{});}
}
function impRefresh(){const p=$('#imp-prev');if(p)p.innerHTML=impPreview();const b=$('[data-act="imp-go"]');if(b)b.disabled=!impList().length;}
function loadXLSX(){return new Promise((res,rej)=>{if(window.XLSX)return res(window.XLSX);const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=()=>res(window.XLSX);s.onerror=()=>rej(new Error('xlsx'));document.head.appendChild(s);});}
IN['imp-ta']=t=>{UI.imp.txt=t.value;impParse();impRefresh();};
CH['imp-map']=t=>{UI.imp.map[t.dataset.k]=+t.value;impRefresh();};
CH['imp-head']=t=>{UI.imp.head=t.checked;impRefresh();};
CH['imp-repl']=t=>{UI.imp.replace=t.checked;};
CH['imp-file']=async t=>{
  const f=t.files&&t.files[0];if(!f)return;
  try{
    let txt;
    if(/\.xlsx?$/i.test(f.name)){const X=await loadXLSX();const wb=X.read(await f.arrayBuffer(),{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];txt=X.utils.sheet_to_csv(ws,{FS:'\t'});}
    else txt=await f.text();
    UI.imp.txt=txt;impParse();impRender();
  }catch(e){toast('Impossible de lire ce fichier : enregistre-le en CSV ou colle le tableau','alert');}
};
Object.assign(ACT,{
  'imp-open'(t){UI.imp={k:t.dataset.k||'equipe',txt:'',rows:null,head:false,map:{},replace:false};impRender();},
  'imp-k'(t){UI.imp={...UI.imp,k:t.dataset.k};impParse();impRender();},
  async 'imp-photo'(){
    const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.setAttribute('capture','environment');inp.style.display='none';document.body.appendChild(inp);
    inp.onchange=async()=>{const f=inp.files&&inp.files[0];inp.remove();if(!f)return;const b=$('#imp-photo');if(b){b.disabled=true;b.innerHTML=ic('camera','s')+' Léon lit le menu…';}
      try{const list=await AI.json(`Voici la photo du menu d’un ${isSvcBiz()?'salon':'restaurant'}. Liste chaque produit avec son prix TTC en euros. Réponds uniquement avec un tableau JSON : [{"n":"nom du produit","pv":12.5,"cat":"entrée|plat|dessert|boisson"}]. N’invente rien : si un prix est illisible, ne mets pas la ligne.`,{images:[f],modelTier:'default'});
        const L=(Array.isArray(list)?list:[]).filter(x=>x&&x.n&&+x.pv>0);
        UI.imp.txt=L.map(x=>`${x.n} ${String(x.pv).replace('.',',')}`).join('\n');UI.imp.menu=L.map(x=>({n:String(x.n),pv:+x.pv,t:catOf(x.cat||'',x.n),tva:catOf(x.cat||'',x.n)==='boisson'&&ALCO.test(normH(x.n))?20:10}));UI.imp.rows=null;impRender();
        toast(L.length?`${L.length} produits lus sur la photo : vérifie les prix`:'Léon n’a rien pu lire sur cette photo','camera');}
      catch(e){toast('Lecture de la photo impossible ici : colle le texte du menu','alert');impRender();}};
    inp.click();
  },
  'imp-go'(){
    const I=UI.imp;const L=impList();if(!L.length)return;let nNew=0,nUpd=0;
    if(I.k==='equipe'){
      L.forEach(x=>{if(EMP.some(e=>normH(e.prenom+' '+(e.nom||''))===normH(x.prenom+' '+x.nom)))return;
        const e={id:uid('e'),prenom:x.prenom,nom:x.nom,poste:x.poste,titre:x.titre||POSTES[x.poste].l,acces:x.poste==='manager'?'manager':'staff',contrat:x.contrat,typeContrat:x.type,taux:x.taux!=null?x.taux:18,tel:x.tel,code:freeCode(3001),hidden:false,perso:{}};
        S.emp=[...S.emp,e];syncCtx();nNew++;});
    }else if(I.k==='carte'){
      if(I.replace){const keep=new Set(L.map(x=>normH(x.n)));S.recipes=S.recipes.filter(r=>r.t==='prep'||keep.has(normH(r.n)));}
      L.forEach(x=>{const r=S.recipes.find(y=>normH(y.n)===normH(x.n));if(r){r.pv=x.pv;nUpd++;return;}S.recipes=[...S.recipes,{id:uid('r'),n:x.n,t:x.t,por:1,tva:x.tva,pv:x.pv,comps:[],steps:[],time:0,sales:0,isNew:true,fromImport:true}];nNew++;});
      S.recipes=[...S.recipes];S.setup={...(S.setup||{}),imported:true};
    }else{
      L.forEach(x=>{const i=S.ingredients.find(y=>normH(y.n)===normH(x.n));if(i){i.p=x.p;if(x.f&&x.f!=='À renseigner')i.f=x.f;nUpd++;return;}S.ingredients=[...S.ingredients,{id:uid('i'),n:x.n,u:x.u,p:x.p,c:x.c,f:x.f,r:100,a:[],st:0,mn:0,par:0,dlc:null}];nNew++;
        if(x.f&&x.f!=='À renseigner'&&!(S.suppliers||{})[x.f])S.suppliers={...(S.suppliers||{}),[x.f]:{email:'',delai:1,jours:[],franco:0}};});
      S.ingredients=[...S.ingredients];
    }
    save();closeModal();renderView();
    toast(`${plur(nNew,'ajout','ajouts')}${nUpd?` · ${plur(nUpd,'mise à jour','mises à jour')}`:''}`,'upload');
    if(I.k==='carte'&&nNew)setTimeout(()=>toast('Les fiches importées n’ont pas encore d’ingrédients : complète-les dans Recettes','chef'),1600);
  },
});
/* étapes de mise en route : on commence par importer */
function setupSteps(){
  return [
    {k:'equipe',t:'Importer ou ajouter l’équipe',s:`${plur(EMP.length,'salarié')} · depuis un fichier Excel ou à la main`,done:EMP.length>0,act:'imp-open',v:'equipe'},
    {k:'carte',t:'Importer la carte et vérifier les prix',s:'Colle ton menu ou importe le fichier de ta caisse',done:!!(S.setup&&(S.setup.carte||S.setup.imported)),act:'imp-open',v:'carte'},
    {k:'produits',t:'Importer les produits et fournisseurs',s:'Ta mercuriale : prix d’achat, fournisseurs',done:S.ingredients.length>5,act:'imp-open',v:'produits'},
    {k:'inv',t:'Faire le premier inventaire',s:'Zone par zone, sur le téléphone',done:!!(S.setup&&S.setup.inv),act:'goto-inv'},
    {k:'planning',t:'Publier un premier planning',s:'L’équipe le voit dans son espace',done:Object.keys(S.published).some(k=>S.published[k]),act:'nav',v:'planning'},
    {k:'caisse',t:'Brancher la caisse',s:S.caisse&&S.caisse.provider?`${esc(S.caisse.provider)} · en attente de connexion`:'À faire par l’admin Léon',done:S.caisse&&S.caisse.status==='connected',act:'nav',v:'reglages'},
  ];
}
function setupCard(){
  const st=setupSteps();const n=st.filter(x=>x.done).length;if(n===st.length)return '';
  return `<section class="panel onb" data-fold-key="home:setup"><div class="panel-h"><h2>${ic('list')} Mise en route de ${esc(S.nom)}</h2><span class="faint" style="font-size:12.5px">${n}/${st.length} étapes · environ 30 minutes</span></div><div class="panel-b" style="padding-top:0"><div class="meter" style="margin:0 0 12px"><i style="width:${n/st.length*100}%"></i></div>
   <div class="checks" style="margin-top:0">${st.map(x=>`<div class="onb-row"><span class="${x.done?'ok':'faint'}">${ic(x.done?'check':'clock','s')}</span><span style="flex:1"><b style="${x.done?'text-decoration:line-through;color:var(--ink-3)':''}">${x.t}</b><br><small class="muted">${x.s}</small></span>${x.done?'':`<button class="btn sm ${x.act==='imp-open'?'primary':''}" data-act="${x.act}" ${x.v?`data-v="${x.v}" data-k="${x.v}"`:''}>${x.act==='imp-open'?ic('upload','s')+' Importer':'Y aller'}</button>`}</div>`).join('')}</div></div></section>`;
}
{const f=viewReglages;viewReglages=function(){
  const h=f();if(!CAN().settings)return h;
  const panel=`<section class="panel imp-p" style="margin-top:18px"><div class="panel-h"><h2>${ic('upload')} Importer depuis Excel ou un autre logiciel</h2></div><div class="panel-b"><p class="muted" style="font-size:13.5px;max-width:78ch">Pour démarrer vite : colle un tableau Excel, choisis un fichier CSV ou Excel, ou colle le texte de ton menu. Léon reconnaît les colonnes tout seul, tu vérifies avant d’importer.</p>
    <div class="row wrap" style="gap:8px;margin-top:10px">${Object.keys(IMP_KINDS).map(k=>`<button class="btn" data-act="imp-open" data-k="${k}">${ic(IMP_KINDS[k].i,'s')} ${IMP_KINDS[k].l}</button>`).join('')}</div></div></section>`;
  const i=h.indexOf('<section class="panel" style="margin-top:18px"><div class="panel-h"><h2>');
  return i>=0?h.slice(0,i)+panel+h.slice(i):h+panel;
};}
