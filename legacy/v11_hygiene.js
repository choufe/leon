/* =========================================================
   V11 · HYGIÈNE
   - Ouverture / fermeture tâche par tâche : listes écrites par le
     patron, attribuées à celui qui ouvre ou qui ferme (planning)
   - Relevé hors norme → « Qu'est-ce que tu as fait ? »
   - Dossier pour un contrôle sanitaire, prêt à imprimer
   ========================================================= */
const TK_MOMENTS={ouverture:{l:'Ouverture',i:'sun'},service:{l:'Pendant le service',i:'flame'},fermeture:{l:'Fermeture',i:'moon'}};
const TK_ICONS=[['check','Coche'],['thermo','Température'],['flame','Cuisson, friteuse'],['power','Allumer, éteindre'],['broom','Nettoyer'],['droplet','Laver'],['spray','Désinfecter'],['trash','Poubelles'],['box','Stock, DLC'],['tag','Étiquettes'],['lock','Fermer à clé'],['euro','Caisse'],['glass','Bar, tireuse'],['sun','Lumières'],['users','Salle, tables'],['list','Mise en place'],['hand','Mains, tenue'],['snow','Froid']];
function defaultTasks(){
  const postes=new Set(EMP.map(e=>e.poste));const L=[];
  const mk=(id,n,moment,ps,due,items)=>({id,n,moment,postes:ps,due,items:items.map(([t,ic,kind])=>({t,ic,kind}))});
  if(isSvcBiz()){
    L.push(mk('tk_ouv','Ouverture du salon','ouverture',['coiffeur','manager'],'09:30',[['Allumer lumières et musique','sun'],['Serviettes propres en place','droplet'],['Postes de coupe désinfectés','spray'],['Caisse et terminal CB allumés','euro']]));
    L.push(mk('tk_fer','Fermeture du salon','fermeture',['coiffeur','manager'],'19:15',[['Balayer les cheveux, laver le sol','broom'],['Bacs à shampoing nettoyés','droplet'],['Outils désinfectés','spray'],['Serviettes en machine','droplet'],['Caisse fermée','euro'],['Lumières éteintes, porte fermée','lock']]));
    return L;
  }
  const cui=postes.has('cuisine')?['cuisine']:['manager'];const sal=['salle','manager'].filter(p=>postes.has(p));const bar=postes.has('bar')?['bar','salle','manager'].filter(p=>postes.has(p)):sal;
  L.push(mk('tk_ouv_cui','Ouverture cuisine','ouverture',cui,'10:30',[['Se laver les mains, tenue propre','hand'],['Relever les températures','thermo','temps'],['Vérifier les DLC du jour','box'],['Allumer friteuse et four','flame'],['Mise en place du midi','list']]));
  if(sal.length)L.push(mk('tk_ouv_sal','Ouverture salle','ouverture',sal,'11:45',[['Allumer lumières et musique','sun'],['Tables et chaises en place','users'],['Toilettes propres, papier','droplet'],['Caisse et terminal CB allumés','euro'],['Plats dispo à jour','list']]));
  L.push(mk('tk_fer_cui','Fermeture cuisine','fermeture',cui,'23:00',[['Filtrer ou vider l’huile de la friteuse','flame'],['Tout filmer et étiqueter','tag'],['Plans de travail désinfectés','spray'],['Sol lavé','broom'],['Gaz et four éteints','power'],['Chambres froides fermées','snow']]));
  if(postes.has('plonge'))L.push(mk('tk_fer_plo','Fermeture plonge','fermeture',['plonge'],'23:45',[['Lave-vaisselle vidé et nettoyé','droplet'],['Poubelles sorties','trash'],['Sol de la plonge lavé','broom']]));
  if(bar.length)L.push(mk('tk_fer_sal','Fermeture salle et bar','fermeture',bar,'00:30',[['Caisse fermée, ticket Z','euro'],['Tables nettoyées','broom'],['Tireuses rincées','glass'],['Lumières et musique éteintes','sun'],['Porte fermée, alarme','lock']]));
  return L;
}
const tasksOf=()=>(S.tasks&&S.tasks.length?S.tasks:defaultTasks());
function tkDue(L){return toMin(L.due||'23:59')+(toMin(L.due||'23:59')<360?1440:0);}
function tkAssign(L,iso){
  const {w,d}=wdOf(pdate(iso));if(isClosed(d))return [];
  const c=EMP.filter(e=>!e.hidden&&(L.postes||[]).includes(e.poste)).map(e=>({e,sh:empShifts(e.id,w,d)})).filter(x=>x.sh.length);
  if(!c.length)return [];
  if(L.moment==='ouverture')return [c.sort((a,b)=>Math.min(...a.sh.map(sMin))-Math.min(...b.sh.map(sMin)))[0].e];
  if(L.moment==='fermeture')return [c.sort((a,b)=>Math.max(...b.sh.map(eMin))-Math.max(...a.sh.map(eMin)))[0].e];
  return c.map(x=>x.e);
}
const tkDoneOf=(iso,id)=>((S.taskDone||{})[iso]||{})[id]||{items:{}};
function tkProgress(L,iso){const D=tkDoneOf(iso,L.id);const n=L.items.length;const k=L.items.filter((_,i)=>D.items[i]).length;const at=Math.max(0,...Object.values(D.items).map(x=>x.at||0));return {n,k,done:n>0&&k===n,at};}
function tkState(L,iso){
  const p=tkProgress(L,iso);if(p.done)return {k:'done',l:'Fait',tone:'ok'};
  if(iso<TODAY_ISO)return {k:'late',l:p.k?`Pas fini (${p.k}/${p.n})`:'Pas fait',tone:'bad'};
  const now=nowMin();const due=tkDue(L);
  if(now>due+15)return {k:'late',l:`En retard · ${p.k}/${p.n}`,tone:'bad'};
  if(p.k)return {k:'doing',l:`En cours · ${p.k}/${p.n}`,tone:'info'};
  return {k:'todo',l:`À faire avant ${L.due}`,tone:''};
}
function tkItemHTML(L,iso,i,it,mine){
  const D=tkDoneOf(iso,L.id);const d=D.items[i];
  if(it.kind==='temps'&&!d&&mine){
    const eqs=(S.hyg&&S.hyg.equip)||[];
    return `<div class="tk-i tk-temps"><span class="tk-ic">${ic('thermo')}</span><div class="tk-tx"><b>${esc(T(it.t))}</b><div class="tk-eqs">${eqs.map(eq=>{const t=hygDayTemp(eq.id);return `<label class="tk-eq"><span>${esc(eq.nom)}</span>${t?`<b class="tnum ${hygBad(eq,t.val)?'bad-t':''}">${nf(t.val,1)} °C</b>`:`<input class="tinp" type="number" step="0.1" inputmode="decimal" placeholder="°C" data-tkeq="${eq.id}" aria-label="${esc(eq.nom)}">`}</label>`;}).join('')}</div><button class="btn sm primary" data-act="tk-temps" data-l="${L.id}" data-i="${i}">${ic('check','s')} ${T('Enregistrer')}</button></div></div>`;
  }
  return `<button class="tk-i ${d?'on':''}" data-act="tk-tick" data-l="${L.id}" data-i="${i}" ${mine?'':'disabled'} aria-pressed="${!!d}"><span class="tk-ic">${ic(it.ic||'check')}</span><span class="tk-tx"><b>${esc(it.t)}</b>${d?`<small data-noi18n>${esc(d.by||'')} · ${tsHM(d.at)}</small>`:''}</span><span class="tk-box">${d?ic('check','s'):''}</span></button>`;
}
function tkListHTML(L,iso,mine,open){
  const p=tkProgress(L,iso);const st=tkState(L,iso);const who=tkAssign(L,iso);const M=TK_MOMENTS[L.moment]||TK_MOMENTS.ouverture;
  return `<section class="panel tkl ${st.k}" data-fold-key="tk:${L.id}${mine?':m':''}"><div class="panel-h"><h3>${ic(M.i)} <span data-noi18n>${esc(L.n)}</span></h3><span class="row" style="gap:6px"><span class="pill ${st.tone}">${esc(st.k==='todo'?T('avant')+' '+L.due:st.l)}</span></span></div>
    <div class="tk-meta"><div class="meter"><i style="width:${p.n?p.k/p.n*100:0}%"></i></div>${who.length?`<span class="tk-who">${who.slice(0,3).map(e=>avatar(e,'s')).join('')}<span data-noi18n>${esc(who.map(e=>e.prenom).join(', '))}</span></span>`:'<span class="faint">Personne de prévu</span>'}</div>
    <div class="tk-items">${L.items.map((it,i)=>tkItemHTML(L,iso,i,it,mine)).join('')}</div></section>`;
}
function tasksBlock(e){
  const iso=TODAY_ISO;const mine=tasksOf().filter(L=>tkAssign(L,iso).some(x=>x.id===e.id));
  if(!mine.length)return '';
  const all=mine.every(L=>tkProgress(L,iso).done);
  return `<div class="tk-home"><div class="zones-h"><h2 class="sec-t">${ic('check')} ${T('Mes tâches')}${all?` <span class="pill ok">${T('Tout est fait')}</span>`:''}</h2></div>${mine.map(L=>tkListHTML(L,iso,true)).join('')}</div>`;
}
function tasksBoard(){
  const iso=TODAY_ISO;const can=CAN();const L=tasksOf();
  const mineId=U.empId;
  const days=[6,5,4,3,2,1,0].map(k=>isoD(addDays(TODAY,-k)));
  const hist=`<section class="panel" data-fold-key="hygiene:tkhist"><div class="panel-h"><h3>Les 7 derniers jours</h3><span class="faint" style="font-size:12.5px">Pour un contrôle : le plan de nettoyage est suivi</span></div><div class="tbl-wrap"><table class="tbl tk-hist"><thead><tr><th>Liste</th>${days.map(d=>`<th class="c">${JC[(pdate(d).getDay()+6)%7]} ${pdate(d).getDate()}</th>`).join('')}</tr></thead><tbody>${L.map(x=>`<tr><td><b>${esc(x.n)}</b></td>${days.map(d=>{const {d:wd}=wdOf(pdate(d));if(isClosed(wd))return '<td class="c faint">·</td>';const p=tkProgress(x,d);const st=tkState(x,d);return `<td class="c"><span class="tk-dot ${p.done?'ok':d===iso&&st.k!=='late'?'':p.k?'warn':'bad'}" title="${p.k}/${p.n}">${p.done?ic('check','s'):p.k?p.k+'/'+p.n:d===iso?'':'✗'}</span></td>`;}).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  return `<div class="row wrap" style="justify-content:space-between;margin-bottom:12px"><p class="muted" style="font-size:13.5px;max-width:74ch">Chaque liste est donnée à celui qui ouvre ou qui ferme, d’après le planning. Il coche sur son téléphone ; tu vois ici ce qui n’est pas fait.</p>${can.board?`<button class="btn sm" data-act="tk-edit">${ic('edit','s')} Modifier les listes</button>`:''}</div>
   <div class="tk-board">${L.map(x=>tkListHTML(x,iso,can.board||tkAssign(x,iso).some(e=>e.id===mineId),false)).join('')}</div>${hist}`;
}
function tkMark(L,i,on){
  const iso=TODAY_ISO;S.taskDone={...(S.taskDone||{})};const day={...(S.taskDone[iso]||{})};const D={items:{...((day[L.id]||{}).items||{})}};
  if(on)D.items[i]={by:whoName(),at:Date.now()};else delete D.items[i];
  day[L.id]=D;S.taskDone[iso]=day;
}
Object.assign(ACT,{
  'tk-tick'(t){const L=tasksOf().find(x=>x.id===t.dataset.l);if(!L)return;const i=+t.dataset.i;const on=!tkDoneOf(TODAY_ISO,L.id).items[i];tkMark(L,i,on);save();renderView();if(on&&tkProgress(L,TODAY_ISO).done)toast(`${L.n} : ${T('Tout est fait')}`,'check');},
  'tk-temps'(t){
    const L=tasksOf().find(x=>x.id===t.dataset.l);if(!L)return;const box=t.closest('.tk-temps');const ins=[...box.querySelectorAll('[data-tkeq]')];
    const vals=ins.filter(x=>x.value!=='');if(!vals.length&&ins.length){toast('Renseigne au moins une température','alert');return;}
    const bad=[];vals.forEach(x=>{const eq=S.hyg.equip.find(e=>e.id===x.dataset.tkeq);if(!eq)return;const v=+x.value;const rec={id:uid('t'),eq:eq.id,date:TODAY_ISO,val:v,ts:nowMin(),who:me().prenom};S.hyg.temps.push(rec);if(hygBad(eq,v))bad.push(rec.id);});
    const left=(S.hyg.equip||[]).filter(eq=>!hygDayTemp(eq.id)).length;
    if(!left)tkMark(L,+t.dataset.i,true);
    save();renderView();
    if(bad.length)acModal(bad);else toast(left?`${left} appareil(s) à relever encore`:'Températures enregistrées','thermo');
  },
});
V11_ALERTS.push(()=>{
  if(!CAN().board)return [];const A=[];const now=nowMin();
  tasksOf().forEach(L=>{
    const st=tkState(L,TODAY_ISO);const who=tkAssign(L,TODAY_ISO);if(!who.length)return;
    if(st.k==='late')A.push({tone:'warn',ic:'check',t:`${esc(L.n)} pas finie`,s:`${st.l} · ${who.map(e=>esc(e.prenom)).join(', ')} · à faire avant ${L.due}`,acts:[{l:'Voir',act:'go-mod',v:'hygiene',t:'taches'}],key:'al:tk:'+TODAY_ISO+':'+L.id});
  });
  const y=isoD(addDays(TODAY,-1));const {d:yd}=wdOf(pdate(y));
  if(!isClosed(yd)&&now<720)tasksOf().filter(L=>L.moment==='fermeture').forEach(L=>{const p=tkProgress(L,y);if(!p.done&&tkAssign(L,y).length)A.push({tone:'info',ic:'moon',t:`Hier : ${esc(L.n)} pas finie (${p.k}/${p.n})`,s:'Vérifie en arrivant que tout est propre.',acts:[{l:'Voir',act:'go-mod',v:'hygiene',t:'taches'}],key:'al:tky:'+y+':'+L.id});});
  return A;
});

/* ---------- éditer les listes ---------- */
let TK=null;
function tkEditOpen(){TK=clone(tasksOf());tkEditRender();}
function tkEditRender(){
  const postes=POSTE_ORDER.filter(p=>EMP.some(e=>e.poste===p));
  openModal(`<div class="mh"><div><h3>Listes d’ouverture et de fermeture</h3><p>Écris-les comme tu les dirais à un nouveau. Chaque tâche a un picto : l’équipe comprend sans lire.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <div class="tke">${TK.map((L,li)=>`<div class="tke-l">
     <div class="tke-h"><input class="inp" data-tk="${li}" data-f="n" value="${esc(L.n)}" aria-label="Nom de la liste"><select class="inp" data-tk="${li}" data-f="moment" aria-label="Moment">${Object.keys(TK_MOMENTS).map(k=>`<option value="${k}" ${L.moment===k?'selected':''}>${TK_MOMENTS[k].l}</option>`).join('')}</select><label class="tke-due">avant <input class="inp" type="time" data-tk="${li}" data-f="due" value="${esc(L.due||'')}"></label><button class="icon-btn" data-act="tke-del" data-l="${li}" aria-label="Supprimer la liste">${ic('trash','s')}</button></div>
     <div class="days-pick tke-p">${postes.map(p=>`<label><input type="checkbox" data-tkp="${li}" value="${p}" ${(L.postes||[]).includes(p)?'checked':''}>${POSTES[p].l}</label>`).join('')}</div>
     <div class="tke-items">${L.items.map((it,ii)=>`<div class="tke-i"><span class="tke-ic">${ic(it.ic||'check')}</span><select class="inp" data-tk="${li}" data-ii="${ii}" data-f="ic" aria-label="Picto">${TK_ICONS.map(([k,l])=>`<option value="${k}" ${it.ic===k?'selected':''}>${l}</option>`).join('')}</select><input class="inp" data-tk="${li}" data-ii="${ii}" data-f="t" value="${esc(it.t)}" aria-label="Tâche"><button class="icon-btn" data-act="tke-idel" data-l="${li}" data-i="${ii}" aria-label="Retirer">${ic('x','s')}</button></div>`).join('')}</div>
     <button class="btn sm ghost" data-act="tke-iadd" data-l="${li}">${ic('plus','s')} Ajouter une tâche</button></div>`).join('')}</div>
   <button class="btn sm" data-act="tke-add" style="margin-top:10px">${ic('plus','s')} Nouvelle liste</button>
   <div class="mf"><button class="btn ghost" data-act="tke-reset">Revenir aux listes de départ</button><span class="sp"></span><button class="btn" data-act="modal-close">Annuler</button><button class="btn primary" data-act="tke-save">Enregistrer</button></div>`,'wide');
}
document.addEventListener('input',e=>{const t=e.target;if(!TK||!t.dataset||t.dataset.tk==null)return;const L=TK[+t.dataset.tk];if(!L)return;if(t.dataset.ii!=null){const it=L.items[+t.dataset.ii];if(it)it[t.dataset.f]=t.value;}else L[t.dataset.f]=t.value;});
document.addEventListener('change',e=>{const t=e.target;if(!TK||!t.dataset)return;
  if(t.dataset.tkp!=null){const L=TK[+t.dataset.tkp];const s=new Set(L.postes||[]);if(t.checked)s.add(t.value);else s.delete(t.value);L.postes=[...s];}
  if(t.dataset.tk!=null&&t.dataset.f==='ic'){const L=TK[+t.dataset.tk];L.items[+t.dataset.ii].ic=t.value;const sp=t.previousElementSibling;if(sp)sp.innerHTML=ic(t.value);}
  if(t.dataset.tk!=null&&t.dataset.f==='moment'){TK[+t.dataset.tk].moment=t.value;}
});
Object.assign(ACT,{
  'tk-edit'(){tkEditOpen();},
  'tke-add'(){TK.push({id:uid('tk'),n:'Nouvelle liste',moment:'fermeture',postes:[POSTE_ORDER.find(p=>EMP.some(e=>e.poste===p))||'salle'],due:'23:00',items:[{t:'',ic:'check'}]});tkEditRender();},
  'tke-del'(t){TK.splice(+t.dataset.l,1);tkEditRender();},
  'tke-iadd'(t){TK[+t.dataset.l].items.push({t:'',ic:'check'});tkEditRender();},
  'tke-idel'(t){TK[+t.dataset.l].items.splice(+t.dataset.i,1);tkEditRender();},
  'tke-reset'(){S.tasks=null;TK=null;save();closeModal();renderView();toast('Listes de départ remises','refresh');},
  'tke-save'(){TK.forEach(L=>{L.items=L.items.filter(it=>String(it.t||'').trim());if(!L.postes||!L.postes.length)L.postes=['salle'];});S.tasks=TK.filter(L=>L.items.length&&String(L.n||'').trim());TK=null;save();closeModal();renderView();toast('Listes enregistrées','check');},
});

/* ---------- action corrective sur un relevé hors norme ---------- */
const AC_OPTS=[['porte','Porte mal fermée : refermée'],['thermo','Thermostat réglé'],['deplace','Produits mis dans un autre frigo'],['jete','Produits jetés'],['tech','Technicien appelé'],['recontrole','Nouveau relevé dans 1 h'],['autre','Autre']];
function acModal(ids){
  const L=ids.map(id=>S.hyg.temps.find(t=>t.id===id)).filter(Boolean);if(!L.length)return;UI.ac={ids:L.map(t=>t.id),sel:{}};
  openModal(`<div class="mh"><div><h3>${ic('warn2')} ${T('Hors norme')} : ${T('Qu’est-ce que tu as fait ?')}</h3><p>En cas de contrôle, l’inspecteur regarde surtout ça : ce qui a été fait quand un frigo n’était pas à la bonne température.</p></div></div>
   ${L.map(t=>{const eq=S.hyg.equip.find(e=>e.id===t.eq)||{nom:'?',min:0,max:4};return `<div class="ac-b"><b>${esc(eq.nom)} · <span class="bad-t">${nf(t.val,1)} °C</span></b><small class="faint">doit rester entre ${eq.min} et ${eq.max} °C</small><div class="ac-opts">${AC_OPTS.map(([k,l])=>`<button class="chip" data-act="ac-pick" data-id="${t.id}" data-k="${k}" aria-pressed="false">${l}</button>`).join('')}</div><input class="inp" id="ac-n-${t.id}" placeholder="Un détail ? (facultatif)"></div>`;}).join('')}
   <div class="mf"><button class="btn" data-act="modal-close">Plus tard</button><button class="btn primary" data-act="ac-save">${T('Enregistrer')}</button></div>`);
}
Object.assign(ACT,{
  'ac-pick'(t){UI.ac.sel[t.dataset.id]=t.dataset.k;$$(`[data-act="ac-pick"][data-id="${t.dataset.id}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b===t)));},
  'ac-save'(){const A=UI.ac;if(!A)return;let n=0;A.ids.forEach(id=>{const k=A.sel[id];const note=(($('#ac-n-'+id)||{}).value||'').trim();if(!k&&!note)return;const t=S.hyg.temps.find(x=>x.id===id);if(t){t.action={k:k||'autre',note,by:me().prenom,at:Date.now()};n++;}});
    if(!n){toast('Choisis ce que tu as fait','alert');return;}S.hyg.temps=[...S.hyg.temps];UI.ac=null;save();closeModal();renderView();toast('Action corrective notée','check');},
  'hyg-ac-open'(t){acModal([t.dataset.id]);},
});
{const f=ACT['hyg-temp-save'];ACT['hyg-temp-save']=function(t,e){
  const before=new Set((S.hyg.temps||[]).map(x=>x.id));f(t,e);
  const bad=(S.hyg.temps||[]).filter(x=>!before.has(x.id)).filter(x=>{const eq=S.hyg.equip.find(q=>q.id===x.eq);return eq&&hygBad(eq,x.val);}).map(x=>x.id);
  if(bad.length)setTimeout(()=>acModal(bad),30);
};}
V11_ALERTS.push(()=>{
  if(!S.hyg)return [];const lim=isoD(addDays(TODAY,-2));
  return (S.hyg.temps||[]).filter(t=>t.date>=lim&&!t.action).filter(t=>{const eq=S.hyg.equip.find(q=>q.id===t.eq);return eq&&hygBad(eq,t.val);}).slice(-2).map(t=>{const eq=S.hyg.equip.find(q=>q.id===t.eq);return {tone:'bad',ic:'thermo',t:`${esc(eq.nom)} : ${nf(t.val,1)} °C sans action corrective`,s:`Relevé ${frDate(t.date)} à ${hhmm(t.ts)} par ${esc(t.who)}. Note ce qui a été fait : c’est ce que regarde l’inspecteur.`,acts:[{l:'Noter l’action',act:'hyg-ac-open',id:t.id,primary:true}],noDismiss:true,key:'al:ac:'+t.id};});
});
function hygHistorySection(){
  const rows=(S.hyg.temps||[]).slice().sort((a,b)=>(b.date+String(1000+b.ts)).localeCompare(a.date+String(1000+a.ts))).slice(0,40);
  const acL=k=>(AC_OPTS.find(x=>x[0]===k)||[,k])[1];
  return `<section class="panel" style="margin-top:18px"><div class="panel-h"><h2>Historique</h2><span class="faint" style="font-size:12.5px">Les derniers relevés, avec les actions correctives</span></div><div class="panel-b"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Heure</th><th>Appareil</th><th class="r">Valeur</th><th>Statut</th><th>Action corrective</th><th>Relevé par</th></tr></thead><tbody>${rows.map(t=>{const eq=(S.hyg.equip||[]).find(e=>e.id===t.eq);const bad=eq&&hygBad(eq,t.val);return `<tr><td>${frDate(t.date)}</td><td class="tnum">${hhmm(t.ts)}</td><td>${esc(eq?eq.nom:'—')}</td><td class="r tnum">${nf(t.val,1)} °C</td><td>${bad?`<span class="pill bad">${ic('alert','s')} Hors norme</span>`:`<span class="pill ok">${ic('check','s')} OK</span>`}</td><td>${bad?(t.action?`<span class="ac-done">${ic('check','s')} ${esc(acL(t.action.k))}${t.action.note?' · '+esc(t.action.note):''} <small class="faint">(${esc(t.action.by||'')})</small></span>`:`<button class="btn xs danger" data-act="hyg-ac-open" data-id="${t.id}">Noter l’action</button>`):'<span class="faint">—</span>'}</td><td class="faint">${esc(t.who)}</td></tr>`;}).join('')||`<tr><td colspan="7" class="faint">Aucun relevé encore.</td></tr>`}</tbody></table></div></div></section>`;
}

/* ---------- la vue Hygiène : tâches du jour en premier ---------- */
function viewHygiene(){
  if(!UI.hyg)UI.hyg={tab:'taches',entry:{},quick:{n:'',d:isoD(addDays(TODAY,3))}};
  if(!S.hyg)S.hyg={equip:defaultHygEquip(),temps:[],lots:[]};
  const can=CAN();
  const tabs=[['taches','Tâches du jour','check'],['temp','Températures','thermo'],['trace','Traçabilité & étiquettes','tag']];
  if(!tabs.some(x=>x[0]===UI.hyg.tab))UI.hyg.tab='taches';
  const late=tasksOf().filter(L=>tkState(L,TODAY_ISO).k==='late'&&tkAssign(L,TODAY_ISO).length).length;
  const head=`<div class="ph"><div><h1>${T('Hygiène')}</h1><p class="sub">Ouverture et fermeture, températures des frigos, traçabilité et étiquettes.</p></div>${can.board?`<div class="acts"><button class="btn" data-act="pms-open">${ic('shield','s')} Dossier contrôle sanitaire</button></div>`:''}</div>`;
  const tabsHTML=`<div class="tabs" role="tablist">${tabs.map(([k,l,i])=>`<button role="tab" aria-selected="${UI.hyg.tab===k}" data-act="hyg-tab" data-t="${k}">${ic(i,'s')}${l}${k==='taches'&&late?` <span class="nb bad">${late}</span>`:''}</button>`).join('')}</div>`;
  let body;
  if(UI.hyg.tab==='taches')body=tasksBoard();
  else if(UI.hyg.tab==='temp')body=`<section class="panel"><div class="panel-h"><h2>${T('Relevé du jour')}</h2>${can.settings?`<button class="btn ghost sm" data-act="hyg-eq-open">${ic('settings','s')} Appareils</button>`:''}</div><div class="panel-b">${hygTempBoard()}<div class="mf" style="justify-content:flex-start;margin-top:14px"><button class="btn primary" data-act="hyg-temp-save">${T('Enregistrer les relevés')}</button></div></div></section>${hygHistorySection()}`;
  else body=`${hygQuickCard()}${hygLotsSection()}`;
  return head+tabsHTML+body;
}
DEF_TAB.hygiene='taches';
V11_MOD.hygiene=null;delete V11_MOD.hygiene;
{const f=modInfo;modInfo=function(v){
  const x=f(v);if(v!=='hygiene'||!S)return x;
  try{const late=tasksOf().filter(L=>tkState(L,TODAY_ISO).k==='late'&&tkAssign(L,TODAY_ISO).length).length;if(!late)return x;return {...x,s:plur(late,'liste en retard','listes en retard')+(x.s?' · '+x.s:''),n:(x.n||0)+late,tone:'bad'};}catch(e){return x;}
};}

/* ---------- dossier pour un contrôle sanitaire ---------- */
UI.pms={m:3};
function pmsOpen(){
  openModal(`<div class="mh"><div><h3>${ic('shield')} Dossier pour un contrôle sanitaire</h3><p>Le jour où l’inspecteur arrive : tout ce que Léon a enregistré, rangé comme il le demande, prêt à imprimer ou à enregistrer en PDF.</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   <div class="field"><span class="lbl">Période</span><span class="seg">${[[1,'1 mois'],[3,'3 mois'],[6,'6 mois']].map(([m,l])=>`<button data-act="pms-m" data-m="${m}" aria-pressed="${UI.pms.m===m}">${l}</button>`).join('')}</span></div>
   <ul class="pms-list"><li>${ic('check','s')} Personnel formé à l’hygiène</li><li>${ic('check','s')} Relevés de température, anomalies et actions correctives</li><li>${ic('check','s')} Traçabilité : réceptions (température, DLC) et produits suivis</li><li>${ic('check','s')} Plan de nettoyage : ouvertures et fermetures cochées</li><li>${ic('check','s')} Produits retirés (DLC dépassée)</li><li>${ic('check','s')} Fournisseurs</li></ul>
   <div class="mf"><button class="btn" data-act="modal-close">Fermer</button><button class="btn primary" data-act="pms-print">${ic('printer','s')} Imprimer / PDF</button></div>`,'narrow');
}
function pmsHTML(){
  const m=UI.pms.m;const from=isoD(addDays(TODAY,-Math.round(m*30.4)));const days=isoRange(from,TODAY_ISO);
  const eqs=S.hyg.equip||[];const temps=(S.hyg.temps||[]).filter(t=>t.date>=from);
  const openDays=days.filter(d=>!isClosed((pdate(d).getDay()+6)%7));
  const trained=EMP.filter(e=>e.docs&&e.docs.hyg);
  const eqRows=eqs.map(eq=>{const L=temps.filter(t=>t.eq===eq.id);const days2=new Set(L.map(t=>t.date));const bad=L.filter(t=>hygBad(eq,t.val));return `<tr><td>${esc(eq.nom)}</td><td>${eq.min} à ${eq.max} °C</td><td class="r">${L.length}</td><td class="r">${openDays.filter(d=>!days2.has(d)).length}</td><td class="r">${bad.length}</td></tr>`;}).join('');
  const anoms=temps.filter(t=>{const eq=eqs.find(q=>q.id===t.eq);return eq&&hygBad(eq,t.val);}).sort((a,b)=>a.date.localeCompare(b.date));
  const acL=k=>(AC_OPTS.find(x=>x[0]===k)||[,k])[1];
  const recs=[];(S.orders||[]).filter(o=>o.received&&o.received>=from).forEach(o=>(o.lines||[]).forEach(l=>{if(l.temp||l.dlc){const i=ING(l.id)||{n:'?',u:''};recs.push({date:o.received,f:o.f,n:i.n,q:l.qr,u:i.u,temp:l.temp,dlc:l.dlc,rs:l.rs,by:o.recBy});}}));
  recs.sort((a,b)=>b.date.localeCompare(a.date));
  const lots=(S.hyg.lots||[]);
  const tl=tasksOf();
  const tkRows=tl.map(L=>{let n=0,ok=0;openDays.forEach(d=>{if(!tkAssign(L,d).length)return;n++;if(tkProgress(L,d).done)ok++;});return `<tr><td>${esc(L.n)}</td><td>${esc((TK_MOMENTS[L.moment]||{}).l||'')}</td><td>${L.items.map(it=>esc(it.t)).join(' · ')}</td><td class="r">${ok}/${n}</td></tr>`;}).join('');
  const dlcLoss=(S.pertes||[]).filter(p=>p.date>=from&&p.motif==='dlc');
  const sups=Object.keys(S.suppliers||{});
  return `<div class="pms"><div class="pms-h"><b>${esc(S.nom)}</b><span>${esc(S.type||'')}${S.ville?' · '+esc(S.ville):''}</span><span>Dossier hygiène · du ${frLongDate(from)} au ${frLongDate(TODAY_ISO)}</span><span>Responsable : ${esc((S.patron&&((S.patron.prenom||'')+' '+(S.patron.nom||'')).trim())||'—')}</span></div>
   <h2>1. Personnel formé à l’hygiène alimentaire</h2>${trained.length?`<table><thead><tr><th>Salarié</th><th>Poste</th><th>Formation faite le</th></tr></thead><tbody>${trained.map(e=>`<tr><td>${esc(e.prenom)} ${esc(e.nom||'')}</td><td>${esc(e.titre||POSTES[e.poste].l)}</td><td>${frLongDate(e.docs.hyg)}</td></tr>`).join('')}</tbody></table>`:'<p class="pms-warn">Aucune formation renseignée dans les fiches salariés.</p>'}
   <h2>2. Températures des enceintes froides</h2><table><thead><tr><th>Appareil</th><th>Plage</th><th class="r">Relevés</th><th class="r">Jours sans relevé</th><th class="r">Hors norme</th></tr></thead><tbody>${eqRows}</tbody></table>
   <h3>Anomalies et actions correctives</h3>${anoms.length?`<table><thead><tr><th>Date</th><th>Appareil</th><th class="r">Valeur</th><th>Action corrective</th><th>Par</th></tr></thead><tbody>${anoms.map(t=>{const eq=eqs.find(q=>q.id===t.eq);return `<tr><td>${frLongDate(t.date)} ${hhmm(t.ts)}</td><td>${esc(eq.nom)}</td><td class="r">${nf(t.val,1)} °C</td><td>${t.action?esc(acL(t.action.k))+(t.action.note?' · '+esc(t.action.note):''):'<span class="pms-warn">Non renseignée</span>'}</td><td>${esc((t.action&&t.action.by)||t.who)}</td></tr>`;}).join('')}</tbody></table>`:'<p>Aucune anomalie sur la période.</p>'}
   <h2>3. Traçabilité</h2><h3>Réceptions contrôlées</h3>${recs.length?`<table><thead><tr><th>Date</th><th>Fournisseur</th><th>Produit</th><th class="r">Quantité</th><th class="r">Temp.</th><th>DLC</th><th>Contrôle</th></tr></thead><tbody>${recs.slice(0,120).map(r=>`<tr><td>${frLongDate(r.date)}</td><td>${esc(r.f)}</td><td>${esc(r.n)}</td><td class="r">${r.q!=null?nf(r.q,r.q%1?2:0)+' '+esc(r.u||''):'—'}</td><td class="r">${r.temp?esc(r.temp)+' °C':'—'}</td><td>${r.dlc?frLongDate(r.dlc):'—'}</td><td>${esc(r.rs==='ok'?'Conforme':r.rs==='abime'?'Refusé (abîmé)':r.rs==='partiel'?'Partiel':r.rs==='prix'?'Écart de prix':r.rs||'—')}</td></tr>`).join('')}</tbody></table>`:'<p>Pas de réception enregistrée sur la période.</p>'}
   <h3>Produits suivis en ce moment</h3>${lots.length?`<table><thead><tr><th>Produit</th><th>Fournisseur</th><th>Reçu le</th><th>Statut</th><th>DLC</th></tr></thead><tbody>${lots.map(l=>`<tr><td>${esc(l.nom)}</td><td>${esc(l.fournisseur||'')}</td><td>${frLongDate(l.recep)}</td><td>${l.statut==='ouvert'?'Ouvert le '+frLongDate(l.dateOuverture):'Fermé'}</td><td>${frLongDate(lotEffDlc(l))}</td></tr>`).join('')}</tbody></table>`:'<p>Aucun produit suivi.</p>'}
   <h2>4. Plan de nettoyage et d’hygiène</h2><table><thead><tr><th>Liste</th><th>Moment</th><th>Tâches</th><th class="r">Jours où tout est coché</th></tr></thead><tbody>${tkRows}</tbody></table>
   <h2>5. Produits retirés (DLC dépassée)</h2>${dlcLoss.length?`<table><thead><tr><th>Date</th><th>Produit</th><th class="r">Quantité</th><th>Par</th></tr></thead><tbody>${dlcLoss.map(p=>`<tr><td>${frLongDate(p.date)}</td><td>${esc(p.n)}</td><td class="r">${nf(p.q,p.q%1?2:0)} ${esc(p.u||'')}</td><td>${esc(p.by||'')}</td></tr>`).join('')}</tbody></table>`:'<p>Aucun retrait sur la période.</p>'}
   <h2>6. Fournisseurs</h2><p>${sups.map(esc).join(' · ')||'—'}</p>
   <p class="pms-f">Document généré par Léon le ${frLongDate(TODAY_ISO)} à ${hhmm(nowMin())}. Les relevés sont horodatés et signés par la personne qui les a saisis.</p></div>`;
}
Object.assign(ACT,{
  'pms-open'(){pmsOpen();},
  'pms-m'(t){UI.pms.m=+t.dataset.m;$$('[data-act="pms-m"]').forEach(b=>b.setAttribute('aria-pressed',String(b===t)));},
  'pms-print'(){closeModal();printHTML('print-pms','printing-pms',pmsHTML());},
});
