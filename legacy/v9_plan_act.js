/* =========================================================
   V9 · PLANNING — interactions
   Clic = sélection, re-clic ou frappe = éditeur rapide, flèches,
   copier / coller, glisser-déposer, annuler, publier, Léon remplit.
   ========================================================= */
let DRAG9=null;
{const f=scheduleRender;scheduleRender=function(){if(QE||DRAG9){DIRTY=true;return;}f();};}
const canEditPlan=()=>S&&CAN().editPlanning&&effRole()!=='staff';
const noHover=()=>!!(window.matchMedia&&window.matchMedia('(hover: none)').matches);

/* ---------- lignes et colonnes visibles (pour les flèches) ---------- */
function gridOrder(){
  const rows=$$('#pg9 tbody tr').map(tr=>{const td=tr.querySelector('td[data-cell9]');return td?td.dataset.emp:null;}).filter(Boolean);
  const days=[0,1,2,3,4,5,6].filter(d=>!isClosed(d));
  return {rows,days};
}
function setSel(cells,o={}){UI.plan.sel={cells,shift:o.shift||null,anchor:o.anchor||cells[0]||null};selPaint();}
function selRange(a,b){
  const {rows,days}=gridOrder();const r0=rows.indexOf(a.emp),r1=rows.indexOf(b.emp),d0=days.indexOf(a.d),d1=days.indexOf(b.d);
  if(r0<0||r1<0||d0<0||d1<0)return [b];
  const out=[];for(let r=Math.min(r0,r1);r<=Math.max(r0,r1);r++)for(let d=Math.min(d0,d1);d<=Math.max(d0,d1);d++)out.push({emp:rows[r],d:days[d]});
  return out;
}
function moveSel(dr,dd,extend){
  const s=UI.plan.sel;const {rows,days}=gridOrder();if(!rows.length||!days.length)return;
  const cur=s&&s.cells&&s.cells.length?s.cells[s.cells.length-1]:{emp:rows[0],d:days[0]};
  let r=Math.max(0,rows.indexOf(cur.emp)),c=Math.max(0,days.indexOf(cur.d));
  r=clamp(r+dr,0,rows.length-1);c=clamp(c+dd,0,days.length-1);
  const nx={emp:rows[r],d:days[c]};
  if(extend&&s&&s.anchor){UI.plan.sel={cells:[...selRange(s.anchor,nx).filter(x=>!(x.emp===nx.emp&&x.d===nx.d)),nx],shift:null,anchor:s.anchor};selPaint();}
  else setSel([nx]);
}

/* ---------- appliquer une saisie ---------- */
function openApply(poste,w,d,P){
  S.openShifts=S.openShifts||[];
  if(P.kind==='clear'){S.openShifts=S.openShifts.filter(x=>!(x.w===w&&x.d===d&&x.poste===poste));return 1;}
  if(P.kind==='abs')return 0;
  const segs=P.kind==='type'?P.t.seg:P.kind==='shifts'?P.segs:P.kind==='paste'?P.items:[];
  if(!segs.length)return 0;
  if(!P.append)S.openShifts=S.openShifts.filter(x=>!(x.w===w&&x.d===d&&x.poste===poste));
  segs.forEach(g=>S.openShifts.push({id:uid('o'),w,d,s:g.s,e:g.e,p:g.p||(durMin(g)>360?20:0),poste}));
  return 1;
}
function applyTo(cells,w,P,label){
  if(!P||P.kind==='bad')return false;
  const done=planDo(label,()=>{cells.forEach(c=>{if(c.emp[0]==='@')openApply(c.emp.slice(1),w,c.d,P);else cellApply(c.emp,w,c.d,P,{append:!!P.append});});},{same:'Rien n’a changé'});
  return done;
}
function cellsLabel(cells,w){
  if(cells.length===1){const c=cells[0];return (c.emp[0]==='@'?'À pourvoir':empById(c.emp).prenom)+' · '+JC[c.d].toLowerCase()+' '+dateAt(w,c.d).getDate();}
  return plur(cells.length,'case');
}
function qeApply(P){
  if(!QE)return;
  if(!P){toast('Tape des heures, par exemple 11-15','alert');return;}
  if(P.kind==='bad'){toast(P.label,'alert');return;}
  const cells=QE.cells,w=QE.w;
  const txt=P.kind==='clear'?'vidé':P.kind==='abs'?ABS[P.type].toLowerCase():P.kind==='type'?P.t.l.toLowerCase()+' ('+P.t.seg.map(g=>g.s+'–'+g.e).join(' + ')+')':P.segs.map(g=>g.s+'–'+g.e).join(' + ');
  const auto=P.kind==='shifts'&&P.segs.some(g=>g.auto)?' · pause de 20 min ajoutée':'';
  QE=null;const r=$('#qe-root');if(r)r.innerHTML='';
  applyTo(cells,w,P,`${cellsLabel(cells,w)} : ${txt}${auto}`);
  const g=$('#pg9');if(g&&!isMob())try{g.focus({preventScroll:true});}catch(e){}
  return true;
}

/* ---------- presse-papiers du planning ---------- */
function copySel(cut){
  const s=UI.plan.sel;if(!s||!s.cells||!s.cells.length)return;const w=UI.plan.w;
  if(s.shift){const x=S.shifts.find(y=>y.id===s.shift)||(S.openShifts||[]).find(y=>y.id===s.shift);if(x){UI.plan.clip={items:[{dr:0,dd:0,c:{kind:'paste',items:[{s:x.s,e:x.e,p:x.p||0,poste:x.poste}]}}]};toast(cut?'Shift coupé':'Shift copié · Ctrl+V pour le coller','copy');if(cut)planDo('Shift coupé',()=>{S.shifts=S.shifts.filter(y=>y.id!==x.id);S.openShifts=(S.openShifts||[]).filter(y=>y.id!==x.id);},{quiet:true});}return;}
  const {rows,days}=gridOrder();
  const r0=Math.min(...s.cells.map(c=>rows.indexOf(c.emp))),d0=Math.min(...s.cells.map(c=>days.indexOf(c.d)));
  const items=s.cells.map(c=>({dr:rows.indexOf(c.emp)-r0,dd:days.indexOf(c.d)-d0,c:c.emp[0]==='@'?{kind:'paste',items:openAt(w,c.d,c.emp.slice(1)).map(x=>({s:x.s,e:x.e,p:x.p||0,poste:x.poste}))}:cellContent(c.emp,w,c.d)}));
  UI.plan.clip={items};
  toast(`${cut?'Coupé':'Copié'} : ${plur(items.length,'case')} · Ctrl+V pour coller`,'copy');
  if(cut)planDo(`${plur(items.length,'case coupée','cases coupées')}`,()=>{s.cells.forEach(c=>{if(c.emp[0]==='@')openApply(c.emp.slice(1),w,c.d,{kind:'clear'});else cellClear(c.emp,w,c.d);});},{quiet:true});
}
function pasteSel(){
  const clip=UI.plan.clip;const s=UI.plan.sel;if(!clip||!s||!s.cells||!s.cells.length){toast('Rien à coller : copie d’abord une case (Ctrl+C)','alert');return;}
  const w=UI.plan.w;const {rows,days}=gridOrder();
  let targets=[];
  if(clip.items.length===1){targets=s.cells.map(c=>({c,content:clip.items[0].c}));}
  else{const r0=Math.min(...s.cells.map(c=>rows.indexOf(c.emp))),d0=Math.min(...s.cells.map(c=>days.indexOf(c.d)));
    clip.items.forEach(it=>{const r=rows[r0+it.dr],d=days[d0+it.dd];if(r!=null&&d!=null)targets.push({c:{emp:r,d},content:it.c});});}
  planDo(`Collé sur ${plur(targets.length,'case')}`,()=>{targets.forEach(({c,content})=>{if(c.emp[0]==='@'){if(content.kind==='paste')openApply(c.emp.slice(1),w,c.d,content);else openApply(c.emp.slice(1),w,c.d,{kind:'clear'});}else cellApply(c.emp,w,c.d,content);});},{ic:'copy'});
}
function deleteSel(){
  const s=UI.plan.sel;if(!s)return;const w=UI.plan.w;
  if(s.shift){const x=S.shifts.find(y=>y.id===s.shift);const o=(S.openShifts||[]).find(y=>y.id===s.shift);
    planDo(x?`Shift de ${empById(x.emp).prenom} supprimé (${x.s}–${x.e})`:'Shift à pourvoir supprimé',()=>{S.shifts=S.shifts.filter(y=>y.id!==s.shift);S.openShifts=(S.openShifts||[]).filter(y=>y.id!==s.shift);},{ic:'trash'});UI.plan.sel.shift=null;return;}
  if(!s.cells||!s.cells.length)return;
  planDo(`${cellsLabel(s.cells,w)} : vidé`,()=>{s.cells.forEach(c=>{if(c.emp[0]==='@')openApply(c.emp.slice(1),w,c.d,{kind:'clear'});else cellClear(c.emp,w,c.d);});},{ic:'trash',same:'Ces cases sont déjà vides'});
}
function dupRight(){
  const s=UI.plan.sel;if(!s||!s.cells||s.cells.length!==1)return;const c=s.cells[0];const w=UI.plan.w;
  const {days}=gridOrder();const i=days.indexOf(c.d);if(i<0||i>=days.length-1)return;const nd=days[i+1];
  const content=c.emp[0]==='@'?{kind:'paste',items:openAt(w,c.d,c.emp.slice(1)).map(x=>({s:x.s,e:x.e,p:x.p||0,poste:x.poste}))}:cellContent(c.emp,w,c.d);
  if(content.kind==='clear'||(content.kind==='paste'&&!content.items.length)){moveSel(0,1);return;}
  UI.plan.sel={cells:[{emp:c.emp,d:nd}],shift:null,anchor:{emp:c.emp,d:nd}};
  planDo(`Recopié sur ${JOURS[nd].toLowerCase()}`,()=>{if(c.emp[0]==='@')openApply(c.emp.slice(1),w,nd,content);else cellApply(c.emp,w,nd,content);},{ic:'copy'});
}

/* ---------- souris : sélection et éditeur ---------- */
document.addEventListener('click',e=>{
  if(UI.view!=='planning'||!S)return;
  if(e.target.closest('#qe-root')||e.target.closest('[data-act]'))return;
  const g=e.target.closest('#pg9');if(!g)return;
  if(!canEditPlan())return;
  const chip=e.target.closest('.s9');const td=e.target.closest('td[data-cell9]');if(!td)return;
  const c={emp:td.dataset.emp,d:+td.dataset.d};
  if(QE){if(!chip&&!QE.x&&QE.cells.some(x=>x.emp===c.emp&&x.d===c.d))return;qeClose();}
  if(chip){
    const id=chip.dataset.sid||chip.dataset.oid;const s=UI.plan.sel;
    if(noHover()||(s&&s.shift===id)){setSel([c],{shift:id});qeOpen(chip.dataset.oid?{oid:id}:{sid:id});return;}
    setSel([c],{shift:id});return;
  }
  const s=UI.plan.sel;
  if(e.shiftKey&&s&&s.anchor){UI.plan.sel={cells:selRange(s.anchor,c),shift:null,anchor:s.anchor};selPaint();return;}
  if((e.metaKey||e.ctrlKey)&&s&&s.cells){const has=s.cells.some(x=>x.emp===c.emp&&x.d===c.d);UI.plan.sel={cells:has?s.cells.filter(x=>!(x.emp===c.emp&&x.d===c.d)):[...s.cells,c],shift:null,anchor:s.anchor||c};selPaint();return;}
  const single=s&&!s.shift&&s.cells&&s.cells.length===1&&s.cells[0].emp===c.emp&&s.cells[0].d===c.d;
  setSel([c]);
  if(single||noHover())qeOpen({cells:[c]});
});
document.addEventListener('dblclick',e=>{
  if(UI.view!=='planning'||!S||!canEditPlan())return;
  const td=e.target.closest&&e.target.closest('#pg9 td[data-cell9]');if(!td)return;
  const chip=e.target.closest('.s9');const c={emp:td.dataset.emp,d:+td.dataset.d};
  if(chip){const id=chip.dataset.sid||chip.dataset.oid;setSel([c],{shift:id});qeOpen(chip.dataset.oid?{oid:id}:{sid:id});return;}
  setSel([c]);qeOpen({cells:[c]});
});
document.addEventListener('click',e=>{
  if(UI.view!=='planning'||!S)return;
  const m=e.target.closest&&e.target.closest('td[data-mgo]');if(!m)return;
  const [w,d,emp]=m.dataset.mgo.split('|');
  UI.plan.w=clamp(+w,WK_MIN,WK_MAX);UI.plan.mode='semaine';UI.plan.sel={cells:[{emp,d:+d}],shift:null,anchor:{emp,d:+d}};
  renderView();requestAnimationFrame(selPaint);
});
/* un clic ailleurs ferme l'éditeur */
document.addEventListener('pointerdown',e=>{
  if(!QE)return;
  if(e.target.closest('#qe-root')||e.target.closest('#pg9 td[data-cell9]')||e.target.closest('[data-act^="pl-qe"]')||e.target.closest('.modal'))return;
  qeClose();
},true);

/* ---------- clavier ---------- */
document.addEventListener('keydown',e=>{
  if(U.screen!=='app'||!S||UI.view!=='planning')return;
  const t=e.target;const tag=(t.tagName||'').toLowerCase();
  /* dans l'éditeur rapide */
  if(QE&&t.closest&&t.closest('#qe-root')){
    if(e.key==='Escape'){e.preventDefault();qeClose();return;}
    if(t.id==='qe-in'){
      if(e.key==='Enter'){e.preventDefault();qeApply(parseCell(t.value,qePoste()));selPaint();return;}
      if(e.key==='Tab'){e.preventDefault();const P=parseCell(t.value,qePoste());if(t.value.trim()&&P&&P.kind!=='bad')qeApply(P);else qeClose();moveSel(0,e.shiftKey?-1:1);const s=UI.plan.sel;if(s&&s.cells.length)qeOpen({cells:s.cells});return;}
    }else if(e.key==='Enter'&&tag!=='select'&&tag!=='button'){e.preventDefault();ACT['qe-save']();return;}
    return;
  }
  if(MODAL||POP)return;
  if(tag==='input'||tag==='textarea'||tag==='select')return;
  const mod=e.metaKey||e.ctrlKey;
  if(mod&&(e.key==='z'||e.key==='Z')){if(!canEditPlan())return;e.preventDefault();if(e.shiftKey)planRedo();else planUndo();return;}
  if(mod&&(e.key==='y'||e.key==='Y')){if(!canEditPlan())return;e.preventDefault();planRedo();return;}
  if(e.altKey&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();ACT[e.key==='ArrowLeft'?'pl-prev':'pl-next']();return;}
  if(UI.plan.mode!=='semaine'||!$('#pg9')||!canEditPlan())return;
  if(e.key==='?'){e.preventDefault();ACT['pl-keys']();return;}
  const arrows={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
  if(arrows[e.key]&&!mod){e.preventDefault();moveSel(arrows[e.key][0],arrows[e.key][1],e.shiftKey);return;}
  if(e.key==='Tab'&&UI.plan.sel&&t.id==='pg9'){e.preventDefault();moveSel(0,e.shiftKey?-1:1);return;}
  const s=UI.plan.sel;if(!s||!s.cells||!s.cells.length)return;
  if(e.key==='Escape'){UI.plan.sel=null;selPaint();return;}
  if(mod&&(e.key==='c'||e.key==='C')){e.preventDefault();copySel(false);return;}
  if(mod&&(e.key==='x'||e.key==='X')){e.preventDefault();copySel(true);return;}
  if(mod&&(e.key==='v'||e.key==='V')){e.preventDefault();pasteSel();return;}
  if(mod&&(e.key==='d'||e.key==='D')){e.preventDefault();dupRight();return;}
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSel();return;}
  if(e.key==='Enter'||e.key==='F2'){e.preventDefault();if(s.shift){const oid=(S.openShifts||[]).some(x=>x.id===s.shift);qeOpen(oid?{oid:s.shift}:{sid:s.shift});}else qeOpen({cells:s.cells});return;}
  if(!mod&&!e.altKey&&e.key.length===1&&/[0-9a-zàâéèêîôûç+]/i.test(e.key)){e.preventDefault();qeOpen({cells:s.cells,val:e.key});return;}
});

/* ---------- saisie dans l'éditeur ---------- */
document.addEventListener('input',e=>{
  if(!QE)return;const t=e.target;
  if(t.id==='qe-in'){QE.val=t.value;const p=$('#qe-prev');if(p)p.innerHTML=qePrevHTML();return;}
  const f=t.dataset&&t.dataset.qeF;if(f&&QE.x){QE.x[f]=f==='p'?+t.value:t.value;const s=$('#qe-sum');if(s)s.innerHTML=qeSum();}
});
document.addEventListener('change',e=>{
  if(!QE)return;const t=e.target;
  const f=t.dataset&&t.dataset.qeF;if(f&&QE.x){QE.x[f]=f==='p'?+t.value:t.value;const s=$('#qe-sum');if(s)s.innerHTML=qeSum();}
  if(t.dataset&&t.dataset.qeDup!=null){const d=+t.dataset.qeDup;QE.dup=t.checked?[...new Set([...QE.dup,d])]:QE.dup.filter(x=>x!==d);}
});

/* ---------- glisser-déposer (Alt = copier) ---------- */
window.addEventListener('dragstart',e=>{
  const t=e.target.closest&&e.target.closest('[data-drag9]');if(!t)return;
  e.stopPropagation();
  const [k,id]=t.dataset.drag9.split(':');DRAG9={k,id};DRAG={id};qeClose();
  try{e.dataTransfer.effectAllowed='copyMove';e.dataTransfer.setData('text/plain',id);}catch(err){}
  t.classList.add('dragging');
},true);
window.addEventListener('dragover',e=>{
  if(!DRAG9)return;const c=e.target.closest&&e.target.closest('td[data-cell9]');
  e.stopPropagation();if(!c)return;e.preventDefault();
  try{e.dataTransfer.dropEffect=e.altKey?'copy':'move';}catch(err){}
  $$('#pg9 .drop-hi').forEach(x=>{if(x!==c)x.classList.remove('drop-hi');});c.classList.add('drop-hi');
},true);
window.addEventListener('drop',e=>{
  if(!DRAG9)return;e.stopPropagation();
  const c=e.target.closest&&e.target.closest('td[data-cell9]');const D=DRAG9;DRAG9=null;DRAG=null;
  if(!c){planRender();return;}
  e.preventDefault();
  const w=UI.plan.w;const to=c.dataset.emp,d=+c.dataset.d;const copy=e.altKey;
  if(D.k==='s'){
    const x=S.shifts.find(s=>s.id===D.id);if(!x){planRender();return;}
    if(to[0]==='@'){const po=to.slice(1);planDo(copy?'Shift copié en « à pourvoir »':`Shift de ${empById(x.emp).prenom} mis à pourvoir`,()=>{if(!copy)S.shifts=S.shifts.filter(s=>s.id!==x.id);(S.openShifts=S.openShifts||[]).push({id:uid('o'),w,d,s:x.s,e:x.e,p:x.p||0,poste:po});},{ic:'hand'});}
    else{const e2=empById(to);const np=x.emp!==to&&x.poste===empById(x.emp).poste&&!(e2.skills||[]).includes(x.poste)?e2.poste:x.poste;
      if(x.emp===to&&x.d===d&&!copy){planRender();return;}
      planDo(copy?`Shift copié chez ${e2.prenom}, ${JOURS[d].toLowerCase()}`:`Shift déplacé : ${e2.prenom}, ${JOURS[d].toLowerCase()}`,()=>{
        S.absences=S.absences.filter(a=>!(a.emp===to&&a.w===w&&a.d===d));
        if(copy)S.shifts.push({...x,id:uid('s'),emp:to,d,poste:np});else{const y=S.shifts.find(s=>s.id===x.id);Object.assign(y,{emp:to,d,poste:np});}
      },{ic:copy?'copy':'move'});}
  }else if(D.k==='o'){
    const x=(S.openShifts||[]).find(s=>s.id===D.id);if(!x){planRender();return;}
    if(to[0]==='@'){planDo('Shift à pourvoir déplacé',()=>{const y=S.openShifts.find(s=>s.id===x.id);Object.assign(y,{d,poste:to.slice(1)});});}
    else{const e2=empById(to);planDo(`Shift à pourvoir attribué à ${e2.prenom}`,()=>{S.openShifts=S.openShifts.filter(s=>s.id!==x.id);S.absences=S.absences.filter(a=>!(a.emp===to&&a.w===w&&a.d===d));S.shifts.push({id:uid('s'),emp:to,w,d,s:x.s,e:x.e,p:x.p||0,poste:x.poste});(S.swaps||[]).forEach(r=>{if(r.kind==='take'&&r.openId===x.id&&r.status==='pending')r.status=r.emp===to?'ok':'no';});},{ic:'hand'});}
  }
},true);
window.addEventListener('dragend',()=>{if(!DRAG9&&!DRAG)return;DRAG9=null;DRAG=null;$$('.drop-hi,.dragging').forEach(x=>x.classList.remove('drop-hi','dragging'));if(DIRTY)scheduleRender();},true);

/* ---------- mobile ↔ ordinateur : on redessine si on change de format ---------- */
{let wasMob=isMob(),rt=null;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{const m=isMob();if(m!==wasMob){wasMob=m;if(UI.view==='planning'&&U.screen==='app'&&!MODAL)renderView();}if(QE)qePlace();},150);});}
window.addEventListener('scroll',()=>{if(QE&&!QE.sheet)qePlace();},{passive:true});

/* ---------- petit menu déroulant ---------- */
function openMenu(anchor,items){
  closeMenu();
  const a0=anchor.getBoundingClientRect();if(a0.top<60||a0.bottom>window.innerHeight)anchor.scrollIntoView({block:'center'});
  const r=document.createElement('div');r.id='menu-root';
  r.innerHTML=`<div class="mnu" role="menu">${items.map(it=>it.sep?'<div class="mnu-sep"></div>':`<button role="menuitem" class="${it.danger?'danger':''}" data-act="${it.act}" ${it.dis?'disabled':''}>${ic(it.ic,'s')}<span>${it.l}${it.s?`<small>${it.s}</small>`:''}</span></button>`).join('')}</div>`;
  document.body.appendChild(r);
  const m=r.firstElementChild;const b=anchor.getBoundingClientRect();
  m.style.top=Math.min(b.bottom+6,window.innerHeight-m.offsetHeight-10)+'px';m.style.left=clamp(b.right-m.offsetWidth,10,window.innerWidth-m.offsetWidth-10)+'px';
  setTimeout(()=>{const f=m.querySelector('button:not([disabled])');if(f)f.focus();},10);
}
function closeMenu(){const r=$('#menu-root');if(r)r.remove();}
document.addEventListener('click',e=>{if($('#menu-root')&&!e.target.closest('.mnu')&&!e.target.closest('[data-act="pl-more"]'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#menu-root'))closeMenu();});

/* ---------- impression et texte WhatsApp ---------- */
function planText(w){
  const lines=[`Planning ${S.nom} · ${weekLabel(w)}`,''];
  [0,1,2,3,4,5,6].forEach(d=>{
    if(isClosed(d))return;const dt=dateAt(w,d);
    const rows=EMP.filter(e=>empShifts(e.id,w,d).length).map(e=>`• ${e.prenom} : ${empShifts(e.id,w,d).map(x=>x.s.replace(':','h')+'–'+x.e.replace(':','h')).join(' / ')}`);
    const op=(S.openShifts||[]).filter(x=>x.w===w&&x.d===d).map(x=>`• À pourvoir (${POSTES[x.poste].l}) : ${x.s.replace(':','h')}–${x.e.replace(':','h')}`);
    const note=(S.dayNotes||{})[isoD(dt)];
    lines.push(`*${JOURS[d].toUpperCase()} ${dt.getDate()} ${MC[dt.getMonth()]}*${note?' — '+note:''}`);
    lines.push(...(rows.length?rows:['• personne']),...op,'');
  });
  const abs=S.absences.filter(a=>a.w===w&&a.type!=='repos');
  if(abs.length){lines.push('*Absences*');abs.sort((a,b)=>a.d-b.d).forEach(a=>lines.push(`• ${empById(a.emp).prenom} : ${ABS[a.type]} (${JC[a.d].toLowerCase()})`));}
  return lines.join('\n').trim();
}
function printPlan(w){
  let el=$('#print-plan');if(!el){el=document.createElement('div');el.id='print-plan';document.body.appendChild(el);}
  const days=[0,1,2,3,4,5,6];
  const rows=POSTE_ORDER.map(po=>{const emps=visEmps().filter(e=>e.poste===po);if(!emps.length)return '';
    return `<tr class="pp-g"><td colspan="9">${POSTES[po].l}</td></tr>`+emps.map(e=>`<tr><td class="pp-n">${esc(e.prenom)} ${esc(e.nom)}</td>${days.map(d=>{if(isClosed(d))return '<td class="pp-c">Fermé</td>';const ab=absOf(e.id,w,d);const sh=empShifts(e.id,w,d);return `<td>${ab?`<i>${ABS[ab.type]}</i>`:sh.map(x=>x.s+'–'+x.e).join('<br>')}</td>`;}).join('')}<td class="pp-t">${dur(empWeekMin(e.id,w))}</td></tr>`).join('');}).join('');
  el.innerHTML=`<div class="pp"><div class="pp-h"><b>${esc(S.nom)}</b><span>Planning · ${esc(weekLabel(w))}</span><span>${S.published[String(w)]?'Publié':'Brouillon'} · imprimé le ${longDate(new Date())}</span></div>
   <table><thead><tr><th></th>${days.map(d=>{const dt=dateAt(w,d);const n=(S.dayNotes||{})[isoD(dt)];return `<th>${JOURS[d]} ${dt.getDate()}${n?`<small>${esc(n)}</small>`:''}</th>`;}).join('')}<th>Total</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  document.body.classList.add('printing-plan');
  const done=()=>{document.body.classList.remove('printing-plan');window.removeEventListener('afterprint',done);};
  window.addEventListener('afterprint',done);
  setTimeout(()=>{try{window.print();}catch(e){}setTimeout(done,1500);},60);
}

/* ---------- publier ---------- */
function publishFlow(w){
  const k=String(w);const pub=!!S.published[k];
  if(pub){
    const df=pubDiff(w);if(!df||!df.n){toast('Rien de nouveau à envoyer','check');return;}
    openModal(`<div class="mh"><div><h3>Prévenir l’équipe des changements</h3><p>${plur(df.emps.length,'personne concernée','personnes concernées')}. Chacun voit ce qui a changé dans son planning Léon.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
     <div class="alerts">${df.emps.map(id=>`<div class="al"><span class="av-w">${avatar(empById(id),'s')}</span><div><b>${esc(empById(id).prenom)}</b><p>${esc(diffText(id,df))}</p></div></div>`).join('')}</div>
     <div class="mf"><button class="btn" data-act="modal-close">Plus tard</button><button class="btn primary" data-act="pl-publish-go" data-w="${w}">${ic('send','s')} Prévenir ${df.emps.length>1?'les '+df.emps.length:esc(empById(df.emps[0]).prenom)}</button></div>`);
    return;
  }
  const A=planAlerts(w);const bad=A.filter(a=>a.tone==='bad');
  const emps=EMP.filter(e=>S.shifts.some(x=>x.emp===e.id&&x.w===w));
  const totH=sum(S.shifts.filter(x=>x.w===w),durMin);const totC=sum(S.shifts.filter(x=>x.w===w),x=>durMin(x)/60*(empById(x.emp).taux||0));const totCA=sum([0,1,2,3,4,5,6],d=>dayCA(d));
  openModal(`<div class="mh"><div><h3>Publier la semaine ${isoWeek(dateAt(w,0))}</h3><p>${plur(emps.length,'salarié')} · ${dur(totH)} planifiées${CAN().salaries&&totCA?` · ${pc(totC/totCA,0)} du CA prévu`:''}. L’équipe le verra tout de suite dans Léon.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   ${bad.length?`<div class="alerts pub-bad">${bad.slice(0,4).map(a=>`<div class="al"><span class="ico bad">${ic('alert','s')}</span><div><b>${esc(a.t)}</b><p>${esc(a.s)}</p></div></div>`).join('')}${bad.length>4?`<p class="faint" style="padding:6px 14px">Et ${bad.length-4} autres.</p>`:''}</div>`:`<div class="al ok-line"><span class="ico ok">${ic('check','s')}</span><div><b>Léon n’a rien trouvé de bloquant</b><p>Repos, pauses, durées maximales : c’est bon.</p></div></div>`}
   <div class="mf"><button class="btn" data-act="modal-close">Pas encore</button><button class="btn primary" data-act="pl-publish-go" data-w="${w}">${ic('send','s')} ${bad.length?'Publier quand même':'Publier'}</button></div>`);
}
function publishGo(w){
  const k=String(w);const was=!!S.published[k];const df=was?pubDiff(w):null;
  S.published[k]=true;
  if(was&&df){df.emps.forEach(id=>pushNews(id,w,`Ton planning de la semaine ${isoWeek(dateAt(w,0))} a changé · ${diffText(id,df)}`));}
  else EMP.forEach(e=>{const n=S.shifts.filter(x=>x.emp===e.id&&x.w===w);if(n.length)pushNews(e.id,w,`Planning de la semaine ${isoWeek(dateAt(w,0))} publié : ${plur(n.length,'service')}, ${dur(sum(n,durMin))}`);});
  snapWeek(w);save();closeModal();planRender();
  toast(was?`${plur(df?df.emps.length:0,'personne prévenue','personnes prévenues')}`:`Semaine ${isoWeek(dateAt(w,0))} publiée : l’équipe la voit dans Léon`,'send');
}

/* ---------- Léon remplit la semaine ---------- */
let FILL=null;
function fillFlow(w){
  const R=autoFill(w);FILL={w,R};
  if(!R.days.length){toast('Cette semaine est passée : Léon ne remplit que les jours à venir','alert');FILL=null;return;}
  if(!R.add.length){
    openModal(`<div class="mh"><div><h3>Léon remplit la semaine</h3><p>${R.log.length?'Léon ne peut rien ajouter sans casser une règle :':'La semaine couvre déjà les besoins des couverts prévus.'}</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    ${R.log.length?`<div class="alerts">${fillLogHTML(R.log)}</div>`:''}
    <div class="mf"><button class="btn" data-act="modal-close">OK</button>${R.log.some(l=>l.seg)?`<button class="btn primary" data-act="pl-fill-open">${ic('hand','s')} Créer ${plur(sum(R.log.filter(l=>l.seg),l=>l.miss),'shift à pourvoir','shifts à pourvoir')}</button>`:''}</div>`);return;
  }
  const by={};R.add.forEach(x=>{(by[x.emp]=by[x.emp]||[]).push(x);});
  const totCA=sum([0,1,2,3,4,5,6],d=>dayCA(d));const curC=sum(S.shifts.filter(x=>x.w===w),x=>durMin(x)/60*(empById(x.emp).taux||0));
  openModal(`<div class="mh"><div><h3>${ic('wand')} Léon propose ${plur(R.add.length,'shift')}</h3><p>${dur(R.min)} en plus${CAN().salaries&&totCA?` · masse salariale ${pc((curC+R.cost)/totCA,0)} du CA prévu`:''}. Les shifts déjà posés ne bougent pas.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <div class="fill-list">${Object.keys(by).map(id=>{const e=empById(id);const tot=empWeekMin(id,w)+sum(by[id],durMin);return `<div class="fill-r">${avatar(e,'s')}<div class="fill-n"><b>${esc(e.prenom)}</b><small>${dur(tot)} / ${e.contrat} h</small></div><div class="fill-s">${by[id].sort((a,b)=>a.d-b.d||sMin(a)-sMin(b)).map(x=>`<span class="ag-s" data-poste="${x.poste}">${JC[x.d]} ${x.s}–${x.e}</span>`).join('')}</div></div>`;}).join('')}</div>
   ${R.log.length?`<div class="alerts fill-log">${fillLogHTML(R.log)}</div>${R.log.some(l=>l.seg)?`<label class="fill-opt"><input type="checkbox" id="fill-open" ${fillOpenCount(R)<=6?'checked':''}> Proposer à l’équipe ${plur(sum(R.log.filter(l=>l.seg),l=>l.miss),'shift à pourvoir','shifts à pourvoir')} pour ce qui manque</label>`:''}`:''}
   <p class="faint" style="font-size:12.5px;margin-top:10px">${R.days.length<[0,1,2,3,4,5,6].filter(d=>!isClosed(d)).length?'Seulement les jours à venir. ':''}${S.tplWeek&&S.tplWeek.length?'Parti de ta semaine type, puis complété selon les couverts prévus. ':'Calculé à partir des couverts prévus (Réglages › Prévisions). '}Respecte contrats, absences, disponibilités, 2 jours de repos et 11 h entre deux journées. ${infoBtn('autoFill')}</p>
   <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="pl-fill-go">${ic('check','s')} Ajouter au brouillon</button></div>`,'wide');
}

function fillLogHTML(log){
  const L={salle:'en salle',cuisine:'en cuisine',bar:'au bar'};const by={};
  log.forEach(l=>{(by[l.k]=by[l.k]||[]).push(l);});
  return Object.keys(by).map(k=>{const xs=by[k].sort((a,b)=>a.d-b.d||(a.svc<b.svc?-1:1));return `<div class="al"><span class="ico warn">${ic('alert','s')}</span><div><b>Il manque encore du monde ${L[k]||k} · ${plur(xs.length,'service')}</b><p>${xs.map(x=>`${JOURS[x.d].toLowerCase()} ${x.svc}${x.miss>1?' (×'+x.miss+')':''}`).join(', ')}. Toute l’équipe est déjà à son contrat, absente ou pas dispo.</p></div></div>`;}).join('');
}
const fillOpenCount=R=>sum(R.log.filter(l=>l.seg),l=>l.miss);
function fillOpenAdd(w,R){S.openShifts=S.openShifts||[];R.log.filter(l=>l.seg).forEach(l=>{for(let i=0;i<l.miss;i++)S.openShifts.push({id:uid('o'),w,d:l.d,s:l.seg.s,e:l.seg.e,p:l.seg.p||0,poste:l.k});});}

/* ---------- types de shifts ---------- */
let TY=null;
function typesModal(){
  TY=clone(shiftTypes());
  typesRender();
}
function typesRender(){
  const postes=POSTE_ORDER.filter(p=>EMP.some(e=>e.poste===p));
  openModal(`<div class="mh"><div><h3>Types de shifts</h3><p>Les boutons qui remplissent une case en un clic. Un type peut avoir deux plages (coupure).</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <div class="ty-list">${postes.map(po=>`<div class="ty-g"><div class="eyebrow"><span class="sw-d" data-poste="${po}"></span>${POSTES[po].l}</div>${TY.map((t,i)=>t.poste!==po?'':`<div class="ty-r"><input class="inp" aria-label="Nom" data-ty="${i}" data-f="l" value="${esc(t.l)}"><span class="ty-seg">${t.seg.map((g,j)=>`<input class="inp tm" type="time" step="900" aria-label="Début" data-ty="${i}" data-g="${j}" data-f="s" value="${g.s}"><span>–</span><input class="inp tm" type="time" step="900" aria-label="Fin" data-ty="${i}" data-g="${j}" data-f="e" value="${g.e}">`).join('<span class="ty-plus">+</span>')}</span>${t.seg.length<2?`<button class="btn sm ghost" data-act="ty-seg" data-i="${i}" title="Ajouter une deuxième plage (coupure)">+ coupure</button>`:`<button class="btn sm ghost" data-act="ty-unseg" data-i="${i}">− coupure</button>`}<button class="icon-btn" data-act="ty-del" data-i="${i}" aria-label="Supprimer ${esc(t.l)}">${ic('trash','s')}</button></div>`).join('')}<button class="btn sm" data-act="ty-add" data-p="${po}">${ic('plus','s')} Ajouter un type</button></div>`).join('')}</div>
   <div class="mf"><button class="btn ghost" data-act="ty-reset">Revenir aux types par défaut</button><span class="sp"></span><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="ty-save">Enregistrer</button></div>`,'wide');
}
document.addEventListener('input',e=>{const t=e.target;if(!TY||t.dataset.ty==null)return;const T=TY[+t.dataset.ty];if(!T)return;if(t.dataset.g!=null)T.seg[+t.dataset.g][t.dataset.f]=t.value;else T[t.dataset.f]=t.value;});

/* ---------- actions ---------- */
Object.assign(ACT,{
 'pl-prev'(){qeClose();const P=UI.plan;if(P.mode==='mois'&&!(effRole()==='staff'&&!P.team))P.mo=(P.mo||0)-1;else{P.w=clamp(P.w-1,WK_MIN,WK_MAX);P.sel=null;}renderView();},
 'pl-next'(){qeClose();const P=UI.plan;if(P.mode==='mois'&&!(effRole()==='staff'&&!P.team))P.mo=(P.mo||0)+1;else{P.w=clamp(P.w+1,WK_MIN,WK_MAX);P.sel=null;}renderView();},
 'pl-today'(){qeClose();const P=UI.plan;if(P.mode==='mois')P.mo=0;else{P.w=0;P.sel=null;}renderView();},
 wk(t){qeClose();UI.plan.w=clamp(UI.plan.w+(+t.dataset.dir),WK_MIN,WK_MAX);UI.plan.sel=null;renderView();},
 'plan-mode'(t){qeClose();UI.plan.mode=t.dataset.m;if(t.dataset.m==='mois'){const m=dateAt(UI.plan.w,3);UI.plan.mo=(m.getFullYear()-TODAY.getFullYear())*12+m.getMonth()-TODAY.getMonth();}renderView();},
 'plan-day'(t){qeClose();UI.plan.day=+t.dataset.d;renderView();},
 'pl-team'(){UI.plan.team=!UI.plan.team;UI.plan.mode='semaine';renderView();window.scrollTo({top:0});},
 'pl-undo'(){planUndo();},
 'pl-redo'(){planRedo();},
 'pl-alerts'(){UI.plan.alertsOpen=!UI.plan.alertsOpen;planRender();},
 'pl-alert-go'(t){const emp=t.dataset.emp,d=+t.dataset.d;UI.plan.mode='semaine';UI.plan.filter='all';UI.plan.sel={cells:[{emp,d}],shift:null,anchor:{emp,d}};planRender();requestAnimationFrame(()=>{selPaint();const td=$(`#pg9 td[data-emp="${emp}"][data-d="${d}"]`);if(td){td.scrollIntoView({block:'center',behavior:'smooth'});td.classList.add('flash');setTimeout(()=>td.classList.remove('flash'),1400);}});},
 'pl-qe-cell'(t){const c={emp:t.dataset.emp,d:+t.dataset.d};UI.plan.sel={cells:[c],shift:null,anchor:c};qeOpen({cells:[c],sheet:isMob()});},
 'pl-qe-shift'(t){qeOpen({sid:t.dataset.sid,sheet:isMob()});},
 'qe-close'(){qeClose();},
 'qe-edit-sid'(t){const id=t.dataset.sid;const open=t.dataset.open==='1';const c=QE&&QE.cells[0];if(c)UI.plan.sel={cells:[c],shift:id,anchor:c};qeOpen(open?{oid:id}:{sid:id});},
 'qe-apply'(){const i=$('#qe-in');qeApply(parseCell(i?i.value:'',qePoste()));selPaint();},
 'qe-type'(t){
   const T=shiftTypes().find(x=>x.id===t.dataset.t);if(!T||!QE)return;
   if(QE.x){if(T.seg.length>1){toast('Ce type a deux plages : utilise-le sur une case vide','alert');return;}Object.assign(QE.x,{s:T.seg[0].s,e:T.seg[0].e,p:T.seg[0].p||0});if(QE.x.poste!==T.poste&&QE.open)QE.x.poste=T.poste;qeRender();return;}
   qeApply({kind:'type',t:T});selPaint();
 },
 'qe-abs'(t){if(!QE)return;qeApply({kind:'abs',type:t.dataset.k});selPaint();},
 'qe-clear'(){if(!QE)return;qeApply({kind:'clear'});selPaint();},
 'qe-save'(){
   if(!QE||!QE.x)return;const x=QE.x;
   if(!/^\d\d:\d\d$/.test(x.s)||!/^\d\d:\d\d$/.test(x.e)||x.s===x.e){toast('Vérifie les heures de début et de fin','alert');return;}
   const dup=QE.dup.slice();const who=QE.open?(($('#qe-who')||{}).value||''):'';const Q=QE;
   QE=null;$('#qe-root').innerHTML='';
   if(Q.open){
     if(who){const e=empById(who);planDo(`Shift à pourvoir attribué à ${e.prenom}`,()=>{S.openShifts=S.openShifts.filter(s=>s.id!==x.id);S.absences=S.absences.filter(a=>!(a.emp===who&&a.w===x.w&&a.d===x.d));S.shifts.push({id:uid('s'),emp:who,w:x.w,d:x.d,s:x.s,e:x.e,p:+x.p||0,poste:x.poste});(S.swaps||[]).forEach(r=>{if(r.kind==='take'&&r.openId===x.id&&r.status==='pending')r.status=r.emp===who?'ok':'no';});},{ic:'hand'});}
     else planDo('Shift à pourvoir modifié',()=>{const y=S.openShifts.find(s=>s.id===x.id);if(y)Object.assign(y,{s:x.s,e:x.e,p:+x.p||0,poste:x.poste});});
     return;
   }
   const e=empById(x.emp);
   planDo(`${e.prenom} · ${JC[x.d].toLowerCase()} : ${x.s}–${x.e}${dup.length?' (et '+plur(dup.length,'autre jour','autres jours')+')':''}`,()=>{
     const y=S.shifts.find(s=>s.id===Q.sid);if(y)Object.assign(y,{s:x.s,e:x.e,p:+x.p||0,poste:x.poste});
     dup.forEach(d=>{if(isClosed(d))return;S.absences=S.absences.filter(a=>!(a.emp===x.emp&&a.w===x.w&&a.d===d));S.shifts.push({id:uid('s'),emp:x.emp,w:x.w,d,s:x.s,e:x.e,p:+x.p||0,poste:x.poste});});
   });
 },
 'qe-del'(){
   if(!QE||!QE.x)return;const x=QE.x;const Q=QE;QE=null;$('#qe-root').innerHTML='';
   if(Q.open)planDo('Shift à pourvoir supprimé',()=>{S.openShifts=S.openShifts.filter(s=>s.id!==x.id);},{ic:'trash'});
   else planDo(`Shift de ${empById(x.emp).prenom} supprimé (${x.s}–${x.e})`,()=>{S.shifts=S.shifts.filter(s=>s.id!==Q.sid);},{ic:'trash'});
   if(UI.plan.sel)UI.plan.sel.shift=null;
 },
 'qe-toopen'(){
   if(!QE||!QE.x)return;const x=QE.x;const Q=QE;QE=null;$('#qe-root').innerHTML='';
   planDo(`Shift de ${empById(x.emp).prenom} mis à pourvoir`,()=>{S.shifts=S.shifts.filter(s=>s.id!==Q.sid);(S.openShifts=S.openShifts||[]).push({id:uid('o'),w:x.w,d:x.d,s:x.s,e:x.e,p:+x.p||0,poste:x.poste});},{ic:'hand'});
 },
 'pl-more'(t){
   const w=UI.plan.w;const hasTpl=!!(S.tplWeek&&S.tplWeek.length);
   openMenu(t,[
    {act:'pl-copyprev',ic:'copy',l:'Copier la semaine précédente'},
    {act:'pl-tpl-apply',ic:'layers',l:'Appliquer la semaine type',s:hasTpl?plur(S.tplWeek.length,'shift'):'Aucune pour l’instant',dis:!hasTpl},
    {act:'pl-tpl-save',ic:'check',l:'Enregistrer comme semaine type',s:'Léon s’en sert pour remplir les semaines'},
    {sep:1},
    {act:'pl-open-new',ic:'hand',l:'Créer un shift à pourvoir'},
    {act:'pl-types',ic:'settings',l:'Types de shifts'},
    {sep:1},
    {act:'pl-print',ic:'printer',l:'Imprimer / PDF',s:'Pour l’afficher en cuisine'},
    {act:'pl-wa',ic:'chat',l:'Copier pour WhatsApp'},
    {act:'pl-keys',ic:'keyb',l:'Raccourcis clavier'},
    {sep:1},
    {act:'pl-clear',ic:'trash',l:'Vider la semaine',danger:true,dis:!S.shifts.some(x=>x.w===w)&&!(S.openShifts||[]).some(x=>x.w===w)},
   ]);
 },
 'pl-publish'(){publishFlow(UI.plan.w);},
 'pl-publish-go'(t){publishGo(+t.dataset.w);},
 publish(){publishFlow(UI.plan.w);},
 'pl-fill'(){closeMenu();qeClose();fillFlow(UI.plan.w);},
 'pl-fill-go'(){if(!FILL)return;const {w,R}=FILL;const op=!!($('#fill-open')&&$('#fill-open').checked);FILL=null;closeModal();
   const n=op?fillOpenCount(R):0;
   planDo(`Léon a ajouté ${plur(R.add.length,'shift')}${n?` et ${plur(n,'shift à pourvoir','shifts à pourvoir')}`:''}`,()=>{R.add.forEach(x=>S.shifts.push({...x,w}));if(op)fillOpenAdd(w,R);},{ic:'wand'});},
 'pl-fill-open'(){if(!FILL)return;const {w,R}=FILL;FILL=null;closeModal();const n=fillOpenCount(R);planDo(`${plur(n,'shift à pourvoir créé','shifts à pourvoir créés')}`,()=>fillOpenAdd(w,R),{ic:'hand'});},
 'pl-copyprev'(){closeMenu();const w=UI.plan.w;const src=S.shifts.filter(x=>x.w===w-1);if(!src.length){toast('La semaine précédente est vide','alert');return;}
   const go=()=>planDo(`Semaine précédente copiée (${plur(src.length,'shift')})`,()=>{S.shifts=S.shifts.filter(x=>x.w!==w);src.forEach(x=>S.shifts.push({...x,id:uid('s'),w}));S.absences=S.absences.filter(a=>!(a.w===w&&a.type==='repos'));},{ic:'copy'});
   if(S.shifts.some(x=>x.w===w))confirmBox({title:'Remplacer cette semaine ?',text:'Les shifts actuels sont remplacés par ceux de la semaine précédente. Les absences restent. Tu peux annuler juste après.',ok:'Remplacer',onOk:go});else go();},
 'dup-week'(){ACT['pl-copyprev']();},
 'pl-tpl-save'(){closeMenu();const w=UI.plan.w;const n=S.shifts.filter(x=>x.w===w).length;if(!n){toast('La semaine est vide','alert');return;}
   confirmBox({title:'Enregistrer comme semaine type ?',text:`${plur(n,'shift')} de la ${esc(weekLabel(w).toLowerCase())}. Léon s’en servira pour remplir les prochaines semaines.${S.tplWeek&&S.tplWeek.length?' L’ancienne semaine type est remplacée.':''}`,ok:'Enregistrer',onOk:()=>{S.tplWeek=weekToTpl(w);save();planRender();toast('Semaine type enregistrée','check');}});},
 'pl-tpl-apply'(){closeMenu();const w=UI.plan.w;const T=S.tplWeek||[];if(!T.length)return;
   const go=()=>planDo('Semaine type appliquée',()=>{S.shifts=S.shifts.filter(x=>x.w!==w);T.forEach(t=>{const e=EMP.find(o=>o.id===t.emp);if(!e||isClosed(t.d)||absOf(t.emp,w,t.d))return;S.shifts.push({id:uid('s'),emp:t.emp,w,d:t.d,s:t.s,e:t.e,p:t.p||0,poste:t.poste||e.poste});});},{ic:'layers'});
   if(S.shifts.some(x=>x.w===w))confirmBox({title:'Appliquer la semaine type ?',text:'Les shifts de cette semaine sont remplacés. Les absences sont respectées. Tu peux annuler juste après.',ok:'Appliquer',onOk:go});else go();},
 'pl-clear'(){closeMenu();const w=UI.plan.w;confirmBox({title:'Vider la semaine ?',text:'Tous les shifts et shifts à pourvoir de la semaine sont retirés (les absences restent). Tu peux annuler juste après.',ok:'Vider',danger:true,onOk:()=>planDo('Semaine vidée',()=>{S.shifts=S.shifts.filter(x=>x.w!==w);S.openShifts=(S.openShifts||[]).filter(x=>x.w!==w);},{ic:'trash'})});},
 'pl-types'(){closeMenu();typesModal();},
 'ty-add'(t){TY.push({id:uid('st'),l:'Nouveau',poste:t.dataset.p,seg:[{s:'11:00',e:'15:00',p:0}]});typesRender();},
 'ty-del'(t){TY.splice(+t.dataset.i,1);typesRender();},
 'ty-seg'(t){const T=TY[+t.dataset.i];T.seg.push({s:'18:30',e:'23:00',p:0});typesRender();},
 'ty-unseg'(t){const T=TY[+t.dataset.i];T.seg=T.seg.slice(0,1);typesRender();},
 'ty-reset'(){S.shiftTypes=null;save();closeModal();TY=null;toast('Types par défaut rétablis');planRender();},
 'ty-save'(){const bad=TY.find(t=>!t.l.trim()||t.seg.some(g=>!/^\d\d:\d\d$/.test(g.s)||!/^\d\d:\d\d$/.test(g.e)||g.s===g.e));if(bad){toast('Vérifie le nom et les heures de « '+esc(bad.l||'?')+' »','alert');return;}
   TY.forEach(t=>t.seg.forEach(g=>{g.p=g.p||(durMin(g)>360?20:0);}));S.shiftTypes=TY;TY=null;save();closeModal();planRender();toast('Types de shifts enregistrés');},
 'pl-note'(t){const d=+t.dataset.d;const w=UI.plan.w;const iso=isoOf(w,d);const cur=(S.dayNotes||{})[iso]||'';
   openModal(`<div class="mh"><div><h3>Note du ${JOURS[d].toLowerCase()} ${dateAt(w,d).getDate()}</h3><p>Un match, un groupe, une livraison, un événement : toute l’équipe la voit dans le planning.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="field"><label for="dn-in">Note</label><input class="inp" id="dn-in" maxlength="80" value="${esc(cur)}" placeholder="Ex. Groupe de 20 à 20 h, match du LOSC…" autofocus></div>
    <div class="mf">${cur?`<button class="btn danger" data-act="pl-note-del" data-iso="${iso}">${ic('trash','s')} Retirer</button>`:''}<span class="sp"></span><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="pl-note-save" data-iso="${iso}">Enregistrer</button></div>`,'narrow');},
 'pl-note-save'(t){const v=($('#dn-in').value||'').trim();const iso=t.dataset.iso;closeModal();planDo(v?'Note enregistrée':'Note retirée',()=>{S.dayNotes=S.dayNotes||{};if(v)S.dayNotes[iso]=v;else delete S.dayNotes[iso];},{ic:'note'});},
 'pl-note-del'(t){const iso=t.dataset.iso;closeModal();planDo('Note retirée',()=>{delete S.dayNotes[iso];},{ic:'trash'});},
 'pl-open-new'(){closeMenu();const w=UI.plan.w;const postes=POSTE_ORDER.filter(p=>EMP.some(e=>e.poste===p));
   openModal(`<div class="mh"><div><h3>Créer un shift à pourvoir</h3><p>Personne dessus pour l’instant : l’équipe le voit et peut se proposer.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="form-grid" style="margin-top:0"><div class="field"><label for="on-p">Poste</label><select class="inp" id="on-p">${postes.map(p=>`<option value="${p}">${POSTES[p].l}</option>`).join('')}</select></div>
    <div class="field"><label for="on-d">Jour</label><select class="inp" id="on-d">${[0,1,2,3,4,5,6].filter(d=>!isClosed(d)).map(d=>`<option value="${d}">${JOURS[d]} ${dateAt(w,d).getDate()}</option>`).join('')}</select></div>
    <div class="field"><label for="on-s">Début</label><input class="inp" type="time" step="900" id="on-s" value="18:30"></div><div class="field"><label for="on-e">Fin</label><input class="inp" type="time" step="900" id="on-e" value="23:30"></div></div>
    <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="pl-open-save">Créer</button></div>`);},
 'pl-open-save'(){const po=$('#on-p').value,d=+$('#on-d').value,s=$('#on-s').value,e=$('#on-e').value;if(!/^\d\d:\d\d$/.test(s)||!/^\d\d:\d\d$/.test(e)||s===e){toast('Vérifie les heures','alert');return;}const w=UI.plan.w;closeModal();
   planDo(`Shift à pourvoir créé (${JC[d].toLowerCase()} ${s}–${e})`,()=>{(S.openShifts=S.openShifts||[]).push({id:uid('o'),w,d,s,e,p:durMin({s,e})>360?20:0,poste:po});},{ic:'hand'});},
 'pl-print'(){closeMenu();printPlan(UI.plan.w);},
 'pl-wa'(){closeMenu();const txt=planText(UI.plan.w);
   openModal(`<div class="mh"><div><h3>Planning à partager</h3><p>Colle-le dans le groupe WhatsApp de l’équipe.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div><textarea class="inp wa-t" id="wa-t" rows="14" readonly>${esc(txt)}</textarea><div class="mf"><button class="btn" data-act="modal-close">Fermer</button><button class="btn primary" data-act="pl-wa-copy">${ic('copy','s')} Copier</button></div>`,'wide');
   setTimeout(()=>{const t=$('#wa-t');if(t)t.select();},40);},
 'pl-wa-copy'(){const t=$('#wa-t');if(t){t.select();copyText(t.value);}},
 'pl-keys'(){closeMenu();const K=[['Clic sur une case','Sélectionner'],['Re-clic, Entrée ou double-clic','Ouvrir l’éditeur'],['Taper 11-15, 9h30-14h30, soir, cp…','Remplir la case sélectionnée'],['Deux plages : 11-15 18h30-23h','Une coupure'],['Tab dans l’éditeur','Valider et passer au jour suivant'],['Flèches · Maj + flèches','Se déplacer · sélectionner plusieurs cases'],['Maj + clic · Ctrl + clic','Sélectionner une zone · ajouter une case'],['Ctrl + C / X / V','Copier · couper · coller'],['Ctrl + D','Recopier la case sur le jour suivant'],['Suppr','Vider la sélection'],['Ctrl + Z · Ctrl + Maj + Z','Annuler · rétablir'],['Alt + ← / →','Semaine précédente / suivante'],['Glisser un shift · Alt + glisser','Déplacer · copier'],['Échap','Fermer · désélectionner']];
   openModal(`<div class="mh"><div><h3>Raccourcis du planning</h3><p>Sur Mac, Ctrl = ⌘ et Alt = ⌥.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div><div class="keys">${K.map(([a,b])=>`<div><kbd>${esc(a)}</kbd><span>${esc(b)}</span></div>`).join('')}</div><div class="mf"><button class="btn primary" data-act="modal-close">Compris</button></div>`,'wide');},
 'ag-add'(t){const d=+t.dataset.d;const w=UI.plan.w;const free=visEmps().filter(e=>!empShifts(e.id,w,d).length&&!absOf(e.id,w,d));
   openModal(`<div class="mh"><div><h3>${JOURS[d]} ${dateAt(w,d).getDate()} : qui ajouter ?</h3><p>${plur(free.length,'personne libre','personnes libres')} ce jour-là.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div><div class="pick-list">${free.map(e=>`<button class="pick-r" data-act="ag-pick" data-emp="${e.id}" data-d="${d}">${avatar(e,'s')}<span><b>${esc(e.prenom)} ${esc(e.nom)}</b><small>${esc(POSTES[e.poste].l)} · ${dur(empWeekMin(e.id,w))} / ${e.contrat} h${availOf(e.id,d)?' · pas dispo '+AVAIL_L[availOf(e.id,d)]:''}</small></span></button>`).join('')||'<p class="faint">Tout le monde travaille déjà ou est absent.</p>'}</div><div class="mf"><button class="btn" data-act="modal-close">Fermer</button></div>`,'sheet');},
 'ag-pick'(t){closeModal();ACT['pl-qe-cell'](t);},
 /* salarié */
 'my-swap'(t){const x=S.shifts.find(s=>s.id===t.dataset.sid);if(!x)return;const e=empById(x.emp);
   const mates=visEmps().filter(o=>o.id!==e.id&&!empShifts(o.id,x.w,x.d).some(y=>sMin(y)<eMin(x)&&eMin(y)>sMin(x))&&!absOf(o.id,x.w,x.d)).sort((a,b)=>(b.poste===x.poste)-(a.poste===x.poste));
   const dt=dateAt(x.w,x.d);
   openModal(`<div class="mh"><div><h3>Échanger ton shift</h3><p>${JOURS[x.d]} ${dt.getDate()} ${MC[dt.getMonth()]} · ${x.s}–${x.e}. Ton responsable valide.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="field"><label for="sw-to">Qui le reprend ?</label><select class="inp" id="sw-to"><option value="">Je le propose à toute l’équipe (à pourvoir)</option>${mates.map(o=>`<option value="${o.id}">${esc(o.prenom)} ${esc(o.nom)} · ${esc(POSTES[o.poste].l)}</option>`).join('')}</select></div>
    <div class="field" style="margin-top:10px"><label for="sw-note">Un mot (facultatif)</label><input class="inp" id="sw-note" placeholder="Ex. rendez-vous médical, on s’est arrangés avec Nathan"></div>
    <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="my-swap-go" data-sid="${x.id}">${ic('send','s')} Envoyer la demande</button></div>`);},
 'my-swap-go'(t){const x=S.shifts.find(s=>s.id===t.dataset.sid);if(!x)return;const to=$('#sw-to').value||null;
   (S.swaps=S.swaps||[]).push({id:uid('sw'),kind:to?'swap':'give',emp:U.empId,to,shiftId:x.id,snap:{w:x.w,d:x.d,s:x.s,e:x.e,poste:x.poste},note:($('#sw-note').value||'').trim(),status:'pending',at:Date.now()});
   save();closeModal();renderView();toast('Demande envoyée à ton responsable','send');},
 'my-take'(t){const x=(S.openShifts||[]).find(s=>s.id===t.dataset.oid);if(!x)return;
   (S.swaps=S.swaps||[]).push({id:uid('sw'),kind:'take',emp:U.empId,openId:x.id,snap:{w:x.w,d:x.d,s:x.s,e:x.e,poste:x.poste},status:'pending',at:Date.now()});
   save();renderView();toast('C’est noté : ton responsable va valider','hand');},
 'my-avail'(){const id=U.empId;const cur=(S.avail&&S.avail[id])||{days:{},note:''};
   const opt=[['','Dispo'],['midi','Pas le midi'],['soir','Pas le soir'],['jour','Pas du tout']];
   openModal(`<div class="mh"><div><h3>Mes disponibilités</h3><p>Les créneaux où tu ne peux pas travailler, chaque semaine. Léon en tient compte pour faire le planning.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
    <div class="av-list">${[0,1,2,3,4,5,6].map(d=>`<div class="av-r"><b>${JOURS[d]}</b><div class="seg">${opt.map(([v,l])=>`<button data-act="av-set" data-d="${d}" data-v="${v}" aria-pressed="${(cur.days[String(d)]||'')===v}">${l}</button>`).join('')}</div></div>`).join('')}</div>
    <div class="field" style="margin-top:12px"><label for="av-note">Pourquoi (facultatif)</label><input class="inp" id="av-note" value="${esc(cur.note||'')}" placeholder="Ex. cours le mardi soir, garde des enfants le mercredi"></div>
    <div class="mf"><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="av-save">Enregistrer</button></div>`,'wide');
   AV={days:{...cur.days}};},
 'av-set'(t){AV.days[t.dataset.d]=t.dataset.v;if(!t.dataset.v)delete AV.days[t.dataset.d];t.parentElement.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===t)));},
 'av-save'(){S.avail=S.avail||{};S.avail[U.empId]={days:AV.days,note:($('#av-note').value||'').trim(),at:Date.now()};save();closeModal();renderView();toast('Disponibilités enregistrées');},
});
let AV=null;
