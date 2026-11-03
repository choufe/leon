/* =========================================================
   V12 · TABLETTE RECENTRÉE : badger, hygiène, réceptions (12.26)
   Décidé avec Maurice le 3 nov. : la tablette sert surtout aux normes HACCP, au badge et aux réceptions.
   Les disponibilités des plats, c'est la caisse (L'Addition) qui les gère : on les retire de la tablette.
   Réception : photo de la facture / du bon de livraison, fournisseur, température des produits frais,
   conforme ou pas. Le patron retrouve tout dans Cuisine & stocks.
   ========================================================= */
{const D=DOCS.hygiene;DOCS.hygiene={p:D.p,out:R=>({...D.out(R),recs:(R.hyg&&R.hyg.recs)||[]}),in:(R,d)=>{D.in(R,d);R.hyg.recs=d.recs||[];}};}
const recsOf=()=>((S&&S.hyg&&S.hyg.recs)||[]);

if(typeof TABLETTE!=='undefined'&&TABLETTE){
  // 3 nov. : réception et inventaire = responsables seulement (managers, directeur, créateur)
  KIOSK_TILES.splice(0,KIOSK_TILES.length,
    {v:'hygiene',l:'Hygiène',i:'thermo'},
    {v:'reception',l:'Réception',i:'truck',resp:true},
    {v:'inventaire',l:'Inventaire',i:'list',resp:true},
    {v:'planning',l:'Mon planning',i:'calendar'});
  KIOSK_NAV_MAP.reception='hygiene';KIOSK_NAV_MAP.inventaire='hygiene';
  {const f=kioskTilesHTML;kioskTilesHTML=function(){
    if(effRole()!=='staff')return f.apply(this,arguments);
    const all=KIOSK_TILES.splice(0,KIOSK_TILES.length);KIOSK_TILES.push(...all.filter(t=>!t.resp));
    try{return f.apply(this,arguments);}finally{KIOSK_TILES.splice(0,KIOSK_TILES.length,...all);}
  };}
}
{const f=ACT['badge-goto'];ACT['badge-goto']=function(t){
  if(t.dataset.v==='reception'||t.dataset.v==='inventaire'){if(effRole()==='staff')return;U.badgeMsg=null;UI.kiosk={view:t.dataset.v};U.screen='kiosk';render();return;}
  return f.apply(this,arguments);
};}
{const f=kioskShellHTML;kioskShellHTML=function(){
  if(UI.kiosk&&UI.kiosk.view==='inventaire'){
    return `<div class="stage kiosk-stage"><div class="kiosk-shell">
    <header class="kiosk-top"><button class="btn demo-link sm" data-act="${UI.inv.zone?'inv-zone':'kiosk-home'}">${ic('chevL','s')} ${T('Retour')}</button><b class="kiosk-title">${UI.inv.zone&&INV_ZONES[UI.inv.zone]?esc(INV_ZONES[UI.inv.zone].l):T('Inventaire')}</b><span class="clock" data-clock>${hhmm(nowMin())}</span></header>
    <div class="kiosk-body kiosk-inv">${invHTML()}</div></div></div>`;
  }
  if(!UI.kiosk||UI.kiosk.view!=='reception')return f.apply(this,arguments);
  return `<div class="stage kiosk-stage"><div class="kiosk-shell">
    <header class="kiosk-top"><button class="btn demo-link sm" data-act="kiosk-home">${ic('chevL','s')} ${T('Accueil')}</button><b class="kiosk-title">${T('Réception')}</b><span class="clock" data-clock>${hhmm(nowMin())}</span></header>
    <div class="kiosk-body">${kioskReceptionHTML()}</div></div></div>`;
};}

function kioskReceptionHTML(){
  const today=recsOf().filter(r=>r.iso===TODAY_ISO).sort((a,b)=>b.at-a.at);
  const attendues=(S.orders||[]).filter(o=>o.status==='sent'||o.status==='envoyee'||o.status==='commande').map(o=>o.f).filter(Boolean);
  return `<div class="rcp-hero">
      <button class="rcp-shot" data-act="rcp-photo">${ic('camera')}<b>${T('Nouvelle livraison')}</b><span>${T('Prends la facture ou le bon de livraison en photo')}</span></button>
      ${attendues.length?`<p class="rcp-att">${ic('truck','s')} ${T('Attendu')} : ${esc([...new Set(attendues)].join(', '))}</p>`:''}
    </div>
    <h2 class="kiosk-h2">${ic('check','s')} ${T('Reçu aujourd’hui')}</h2>
    ${today.length?`<div class="rcp-list">${today.map(r=>`<div class="rcp-it ${r.ok?'':'ko'}">${r.photo?`<img src="${r.photo}" alt="">`:`<span class="rcp-noph">${ic('file')}</span>`}<div><b>${esc(r.f||T('Fournisseur'))}</b><small>${hhmm(r.m)} · ${esc(r.by||'')}${r.temp!==''&&r.temp!=null?` · ${nf(+r.temp,1)} °C`:''}</small>${r.ok?`<span class="pill ok">${T('Conforme')}</span>`:`<span class="pill bad">${T('Problème')}</span>`}${r.note?`<p>${esc(r.note)}</p>`:''}</div></div>`).join('')}</div>`
      :`<p class="faint">${T('Aucune livraison enregistrée aujourd’hui.')}</p>`}`;
}
Object.assign(ACT,{
  'rcp-photo'(){
    const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.setAttribute('capture','environment');inp.style.display='none';document.body.appendChild(inp);
    inp.onchange=async()=>{
      const fl=inp.files&&inp.files[0];inp.remove();if(!fl)return;
      let d;try{d=await imgToDataUrl(fl,900,false,0.6);}catch(e){toast(T('Impossible de lire cette photo'),'alert');return;}
      UI.rcpPhoto=d;
      const sups=(typeof supplierNames==='function'?supplierNames():[]).slice(0,12);
      openModal(`<div class="mh"><div><h3>${T('Nouvelle livraison')}</h3><p>${T('Vérifie au déchargement, puis enregistre.')}</p></div></div>
        <img src="${d}" class="rcp-prev" alt="">
        <div class="field"><label>${T('Fournisseur')}</label>
          ${sups.length?`<div class="rcp-sups">${sups.map(s=>`<button type="button" class="btn sm" data-act="rcp-sup" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>`:''}
          <input class="inp" id="rcp-f" placeholder="${T('Ex. Metro')}" style="margin-top:8px"></div>
        <div class="field" style="margin-top:10px"><label for="rcp-t">${T('Température des produits frais (°C)')}</label><input class="inp" id="rcp-t" inputmode="decimal" placeholder="${T('Ex. 3')}"></div>
        <div class="rcp-ok">
          <button type="button" class="btn rcp-yes on" data-act="rcp-etat" data-v="1">${ic('check','s')} ${T('Tout est conforme')}</button>
          <button type="button" class="btn rcp-no" data-act="rcp-etat" data-v="0">${ic('alert','s')} ${T('Il y a un problème')}</button>
        </div>
        <div class="field rcp-note" style="margin-top:10px;display:none"><label for="rcp-n">${T('Quel problème ?')}</label><input class="inp" id="rcp-n" placeholder="${T('Ex. 2 cartons manquants, poulet à 7 °C')}"></div>
        <div class="mf"><button class="btn" data-act="modal-close">${T('Annuler')}</button><button class="btn primary" data-act="rcp-save">${T('Enregistrer')}</button></div>`,'wide');
    };
    inp.click();
  },
  'rcp-sup'(t){const i=document.getElementById('rcp-f');if(i)i.value=t.dataset.v;document.querySelectorAll('[data-act="rcp-sup"]').forEach(b=>b.classList.toggle('on',b===t));},
  'rcp-etat'(t){document.querySelectorAll('[data-act="rcp-etat"]').forEach(b=>b.classList.toggle('on',b===t));const n=document.querySelector('.rcp-note');if(n)n.style.display=t.dataset.v==='0'?'':'none';},
  'rcp-save'(){
    const f=(document.getElementById('rcp-f')||{}).value||'';const tp=((document.getElementById('rcp-t')||{}).value||'').replace(',','.').trim();
    const ok=!!document.querySelector('[data-act="rcp-etat"][data-v="1"].on');const note=(document.getElementById('rcp-n')||{}).value||'';
    if(!f.trim()){toast(T('Indique le fournisseur'),'alert');return;}
    const t=tp===''?'':(isNaN(+tp)?'':+tp);
    const e=U.empId&&empById(U.empId);
    S.hyg.recs=[...recsOf(),{id:uid('rc'),at:Date.now(),iso:TODAY_ISO,m:nowMin(),f:f.trim(),photo:UI.rcpPhoto||null,temp:t,ok:ok&&!(t!==''&&t>4),note:note.trim()+(t!==''&&t>4?` (température ${t} °C)`:''),by:e?e.prenom:whoName()}].slice(-60);
    UI.rcpPhoto=null;save();closeModal();render();
    toast(ok&&!(t!==''&&t>4)?T('Livraison enregistrée'):T('Livraison enregistrée avec un problème : le responsable est prévenu'),ok?'check':'alert');
  },
});

/* Le patron retrouve les réceptions de la tablette dans Cuisine & stocks (7 derniers jours, avec la photo). */
{const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{
  if(UI.view==='stocks'&&!document.querySelector('.rcp-panel')){
    const L=recsOf().filter(r=>Date.now()-r.at<7*864e5).sort((a,b)=>b.at-a.at);if(!L.length)return o;
    const v=document.querySelector('.view');const ph=v&&v.querySelector('.ph');if(!ph)return o;
    ph.insertAdjacentHTML('afterend',`<section class="panel rcp-panel"><div class="panel-h"><h3>${ic('truck','s')} Réceptions faites sur la tablette</h3><span class="faint" style="font-size:12.5px">7 derniers jours</span></div>
      <div class="rcp-list pc">${L.map(r=>`<div class="rcp-it ${r.ok?'':'ko'}">${r.photo?`<a href="${r.photo}" target="_blank" rel="noopener"><img src="${r.photo}" alt="Facture"></a>`:`<span class="rcp-noph">${ic('file')}</span>`}<div><b>${esc(r.f)}</b><small>${shortDate(pdate(r.iso))} · ${hhmm(r.m)} · ${esc(r.by||'')}${r.temp!==''&&r.temp!=null?` · ${nf(+r.temp,1)} °C`:''}</small>${r.ok?'<span class="pill ok">Conforme</span>':'<span class="pill bad">Problème</span>'}${r.note?`<p>${esc(r.note)}</p>`:''}</div></div>`).join('')}</div></section>`);
  }}catch(e){}return o;};}

/* Sur la tablette, les actions qui rafraîchissent « la page » (inventaire…) redessinent l'écran du kiosque. */
{const f=renderView;renderView=function(){if(typeof U!=='undefined'&&U.screen==='kiosk'){render();return;}return f.apply(this,arguments);};}
