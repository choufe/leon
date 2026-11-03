/* =========================================================
   V12 · ERGONOMIE (inspirée de Skello, gardée simple)
   1. Pointer uniquement sur la tablette du resto (la borne). Plus de pointage depuis son profil.
   2. Menu de gauche repliable : replié tout seul sur Planning et Pointage pour avoir la place de travailler.
   3. Planning compact : une ligne de hauteur par salarié, 2 shifts = 2 petites cases empilées.
   4. Un petit ⚠ sur la case quand une règle n'est pas respectée : on clique, Léon dit ce qui bloque.
   5. Les employés voient le planning de toute l'équipe (sans contrats, heures ni coûts).
   ========================================================= */

/* ---------- 1. Pointer = la tablette, rien d'autre ---------- */
function v12PasIci(){
  openModal(`<div class="confirm"><div class="big-check warn">${ic('tablet','l')}</div><h3>${T('On pointe sur la tablette du resto')}</h3>
    <p class="muted" style="margin-top:8px">${T('Pour arriver, partir ou prendre ta pause, tape ton code sur la tablette à l’entrée. C’est le seul endroit où on peut pointer : personne ne peut pointer à la place d’un autre.')}</p>
    <div class="mf" style="justify-content:center"><button class="btn primary" data-act="modal-close">${T('Compris')}</button></div></div>`);
}
ACT['self-point']=function(){v12PasIci();};
// Un oubli ? Le manager ne « pointe » plus à la place de quelqu'un : il corrige le PAYÉ dans la badgeuse.
ACT['point-for']=ACT['pf-open']=ACT['pf-go']=function(){closeModal();UI.point.tab='feuille';UI.pj=0;go('pointage');toast('Les oublis se corrigent dans la badgeuse : colonne « Payé »','edit');};
{const f=myPointCard;myPointCard=function(emp){
  let h=f.apply(this,arguments);
  return h.replace(/<div class="pacts">[\s\S]*?<\/div>\s*<\/section>\s*$/,`<div class="pacts pacts-tab"><span class="pt-tab">${ic('tablet','l')}</span><b>${T('Pointage sur la tablette du resto')}</b><p class="faint" style="font-size:12.5px">${T('Tape ton code sur la tablette à l’entrée pour arriver, partir ou prendre ta pause.')}</p></div></section>`);
};}

/* ---------- 2. Menu de gauche repliable ---------- */
const V12_LARGES=['planning','pointage'];
function v12Mini(){
  const large=V12_LARGES.includes(UI.view);
  let v=null;try{v=localStorage.getItem('leon:menu:'+(large?'large':'normal'));}catch(e){}
  return v?v==='mini':large; // par défaut : replié sur Planning / Pointage, ouvert ailleurs
}
function v12Menu(){
  const sh=document.querySelector('.shell');const side=document.getElementById('side');if(!sh||!side)return;
  const mini=v12Mini();sh.classList.toggle('mini',mini);
  if(!side.querySelector('.side-tg')){
    const b=document.createElement('button');b.className='side-tg';b.setAttribute('data-act','side-tg');
    side.insertBefore(b,side.firstChild.nextSibling);
  }
  const b=side.querySelector('.side-tg');b.innerHTML=ic(mini?'chevR':'chevL','s')+`<span class="nl">${mini?'':'Réduire le menu'}</span>`;
  b.title=mini?'Ouvrir le menu':'Réduire le menu';b.setAttribute('aria-label',b.title);b.setAttribute('aria-expanded',String(!mini));
  side.querySelectorAll('.nav button').forEach(x=>{const l=x.querySelector('.nl');if(l&&!x.title)x.title=l.textContent;});
}
ACT['side-tg']=function(){
  const large=V12_LARGES.includes(UI.view);const mini=!v12Mini();
  try{localStorage.setItem('leon:menu:'+(large?'large':'normal'),mini?'mini':'open');}catch(e){}
  v12Menu();
};

/* ---------- 4. Les ⚠ sur les cases du planning ---------- */
let V12_AL={cell:{},emp:{}};
function v12Alertes(){
  const g=document.getElementById('pg9');if(!g||!S)return;
  const staff=effRole()==='staff';
  g.classList.toggle('pg-staff',staff);
  if(staff||!CAN().editPlanning)return;
  let A=[];try{A=planAlerts(UI.plan.w)||[];}catch(e){return;}
  V12_AL={cell:{},emp:{}};
  A.filter(a=>a.emp&&a.tone!=='info').forEach(a=>{
    if(a.d!=null){(V12_AL.cell[a.emp+'|'+a.d]=V12_AL.cell[a.emp+'|'+a.d]||[]).push(a);}
    else (V12_AL.emp[a.emp]=V12_AL.emp[a.emp]||[]).push(a);
  });
  const mk=(L,e,d)=>{const bad=L.some(a=>a.tone==='bad');const b=document.createElement('button');b.className='pl-w '+(bad?'bad':'warn');b.setAttribute('data-act','pl-w');b.dataset.e=e;if(d!=null)b.dataset.d=d;b.title=L.map(a=>a.t).join(' · ');b.setAttribute('aria-label','Voir ce qui bloque : '+b.title);b.innerHTML=ic('alert','s');
    ['mousedown','pointerdown','dblclick'].forEach(k=>b.addEventListener(k,ev=>ev.stopPropagation()));return b;};
  Object.entries(V12_AL.cell).forEach(([k,L])=>{const [e,d]=k.split('|');const td=g.querySelector(`td[data-emp="${CSS.escape(e)}"][data-d="${d}"]`);if(td&&!td.querySelector('.pl-w'))td.appendChild(mk(L,e,+d));});
  Object.entries(V12_AL.emp).forEach(([e,L])=>{const td=g.querySelector(`td[data-emp="${CSS.escape(e)}"]`);const ec=td&&td.parentElement.querySelector('td.ec .erow');if(ec&&!ec.querySelector('.pl-w'))ec.appendChild(mk(L,e,null));});
}
ACT['pl-w']=function(t){
  const e=empById(t.dataset.e);const d=t.dataset.d;
  const L=d!=null&&d!==''?(V12_AL.cell[t.dataset.e+'|'+d]||[]):(V12_AL.emp[t.dataset.e]||[]);
  openModal(`<div class="mh"><div><h3>${esc(e.prenom)}${d!=null&&d!==''?' · '+JOURS[+d]:' · sur la semaine'}</h3><p>Ce que Léon a repéré sur ${d!=null&&d!==''?'cette case':'sa semaine'}.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="alerts">${L.map(a=>`<div class="al"><span class="ico ${a.tone}">${ic('alert','s')}</span><div><b>${esc(a.t)}</b>${a.s?`<p>${esc(a.s)}</p>`:''}</div></div>`).join('')}</div>
    <p class="faint" style="font-size:12.5px;margin-top:12px">${L.some(a=>a.tone==='bad')?'En rouge : contraire aux règles HCR, à corriger avant de publier.':'En orange : à vérifier, ce n’est pas interdit.'}</p>
    <div class="mf"><button class="btn primary" data-act="modal-close">OK</button></div>`);
};

/* ---------- 5. Les employés voient toute l'équipe ---------- */
{const f=viewPlanning;viewPlanning=function(){
  if(S&&effRole()==='staff'&&UI.plan._v12team==null){UI.plan._v12team=1;UI.plan.team=true;}
  return f.apply(this,arguments);
};}
if(typeof VIEWS!=='undefined'&&VIEWS.planning)VIEWS.planning=viewPlanning;

/* ---------- après chaque affichage ---------- */
function v12Apres(){try{v12Menu();}catch(e){}try{if(UI.view==='planning')v12Alertes();}catch(e){}}
{const f=renderView;renderView=function(){const r=f.apply(this,arguments);v12Apres();return r;};}
{const f=render;render=function(){const r=f.apply(this,arguments);v12Apres();return r;};}
