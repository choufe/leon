/* =========================================================
   V12 · COMPTES DES SALARIÉS (version en ligne)
   Dans « Salariés & accès », le patron clique « Inviter » : Léon fait un lien perso à envoyer
   par WhatsApp ou SMS. Le salarié crée son compte et arrive dans le Léon de son resto
   (même Léon sur téléphone et PC). Pas de code à 4 chiffres pour lui : le code, c'est la tablette.
   ========================================================= */
const V12_INV=(()=>{try{return window.parent!==window&&window.parent.__leonInviter||null;}catch(e){return null;}})();
const V12_CONN=(()=>{try{return window.parent!==window&&window.parent.__leonConnectes||null;}catch(e){return null;}})();
let CONNECTES=null;
let INV_PRET=false;
function chargerConnectes(){if(!V12_CONN||CONNECTES)return;CONNECTES=[];V12_CONN().then(l=>{CONNECTES=l||[];INV_PRET=true;if(UI.view==='equipe')renderView();}).catch(()=>{});}

{const f=viewEquipe2;viewEquipe2=function(){
  let h=f.apply(this,arguments);
  if(!V12_INV||!CAN().settings)return h;
  chargerConnectes();if(!INV_PRET)return h; // tant que la base n'a pas les invitations, pas de bouton
  EMP.forEach(e=>{
    const k=`<button class="btn sm" data-act="emp-edit" data-id="${e.id}">`;
    const on=(CONNECTES||[]).includes(e.id);
    const b=on?`<span class="pill ok" title="${esc(e.prenom)} a son compte Léon">${ic('check','s')} Sur son téléphone</span>`
      :`<button class="btn sm brass" data-act="emp-inviter" data-id="${e.id}">${ic('send','s')} Inviter</button>`;
    h=h.replace(k,b+k);
  });
  return h;
};VIEWS.equipe=()=>viewEquipe2();}

ACT['emp-inviter']=async function(t){
  const e=empById(t.dataset.id);if(!e||!V12_INV)return;
  t.disabled=true;let url;
  try{url=await V12_INV(e.id,e.prenom);}catch(err){t.disabled=false;toast('Le lien n’a pas pu être créé. Réessaie.','alert');return;}
  t.disabled=false;
  const msg=`Salut ${e.prenom} ! Voici ton lien pour Léon : ton planning, l’équipe, tes demandes de congés et d’échanges. Crée ton compte ici : ${url}`;
  const tel=String(e.tel||'').replace(/[^\d+]/g,'');const telI=tel.startsWith('0')?'33'+tel.slice(1):tel.replace(/^\+/,'');
  openModal(`<div class="mh"><div><h3>Inviter ${esc(e.prenom)}</h3><p>Envoie-lui ce lien : il crée son compte (e-mail + mot de passe) et voit son planning sur son téléphone. Le lien marche une fois, pendant 14 jours.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="inv-lien"><input class="inp" id="inv-url" readonly value="${esc(url)}"><button class="btn" data-act="inv-copier">${ic('copy','s')} Copier</button></div>
    <div class="inv-envoi">
      <a class="btn brass" target="_blank" rel="noopener" href="https://wa.me/${telI||''}?text=${encodeURIComponent(msg)}">WhatsApp</a>
      <a class="btn" href="sms:${tel}${/iPhone|iPad|Mac/.test(navigator.userAgent)?'&':'?'}body=${encodeURIComponent(msg)}">SMS</a>
    </div>
    <p class="faint" style="font-size:12.5px;margin-top:10px">Pour badger, rien ne change : c’est sur la tablette du resto, avec son code.</p>
    <div class="mf"><button class="btn primary" data-act="modal-close">OK</button></div>`);
};
ACT['inv-copier']=function(){const i=document.getElementById('inv-url');if(!i)return;i.select();
  (navigator.clipboard?navigator.clipboard.writeText(i.value):Promise.reject()).then(()=>toast('Lien copié','check')).catch(()=>{try{document.execCommand('copy');toast('Lien copié','check');}catch(_){}});};

/* Sur son téléphone, le salarié consulte : planning, congés, cahier, plats dispo, allergènes, fiches.
   L'hygiène (relevés, étiquettes), ça se fait sur la tablette du resto. */
if(V12_COMPTE&&V12_COMPTE.salarie){const f=navItems;navItems=function(){return (f.apply(this,arguments)||[]).filter(n=>n.v!=='hygiene'&&n.v!=='pointage');};}

/* ---------- planning d'équipe (vue salarié) : sa ligne en couleur pour se repérer ---------- */
function avecQui(){
  if(UI.view!=='planning'||!U.empId)return;const moi=empById(U.empId);if(!moi)return;
  const w=UI.plan.w;
  document.querySelectorAll('.ag .ag-d').forEach((sec,d)=>{
    if(sec.querySelector('.ag-avec'))return;
    sec.querySelectorAll('.ag-r').forEach(r=>{const b=r.querySelector('.ag-n b');if(b&&b.textContent.trim()===moi.prenom)r.classList.add('ag-moi');});
  });
}
{const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{if(['staff','manager'].includes(effRole()))avecQui();}catch(e){}return o;};}
