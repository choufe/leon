/* =========================================================
   V12.30 · LE GRAND CHECK (4 nov.)
   Tour complet de Léon, écran par écran, avec l'œil d'un patron pressé.
   Les corrections qui touchent au cœur sont regroupées ici (module par-dessus).
   ========================================================= */

/* ---------- 1. Téléphone / tablette : chaque nouvel écran s'ouvre en haut ----------
   Avant : sur téléphone, la page gardait la position du défilement d'un écran à l'autre
   (on arrivait au milieu de l'accueil après le code, au milieu des Infos, etc.). */
function v30Haut(){try{window.scrollTo(0,0);if(document.scrollingElement)document.scrollingElement.scrollTop=0;document.body.scrollTop=0;}catch(e){}}
let V30_ECRAN=null;
function v30Cle(){
  const t=document.querySelector('.kiosk-title,.ph h1,.tb-h1');
  return [U.screen,U.screen==='app'?UI.view:'',t?t.textContent.trim():''].join('|');
}

/* ---------- 2. Petits marqueurs sur la page (pour le CSS) ---------- */
function v30Marques(){
  const h=document.documentElement;
  h.classList.toggle('v30-intro',!!document.querySelector('[data-act="demo-start"]'));
  h.classList.toggle('v30-compte',!!(typeof V12_COMPTE!=='undefined'&&V12_COMPTE));
  const r=document.querySelector('[data-act="demo-reset"]');
  if(r&&!r.getAttribute('title')){r.setAttribute('title','Remettre la démo à zéro');r.setAttribute('aria-label','Remettre la démo à zéro');}
}

{const f=render;render=function(){
  const o=f.apply(this,arguments);
  try{
    v30Marques();
    // Tablette : « Bonjour » au-dessus de « Salut Inès », c'était deux fois bonjour.
    if(typeof TABLETTE!=='undefined'&&TABLETTE&&U.screen==='badge'){
      document.querySelectorAll('.tb-head .tb-eb').forEach(e=>{if(e.textContent.trim()===T('Bonjour'))e.remove();});
    }
    // Tablette : l'écran des tâches s'appelle comme sa tuile.
    if(U.screen==='kiosk'&&UI.kiosk&&UI.kiosk.hyg==='taches'){const t=document.querySelector('.kiosk-top .kiosk-title');if(t)t.textContent=T('Tâches et températures');}
    const k=v30Cle();
    if(V30_ECRAN!==null&&k!==V30_ECRAN)v30Haut();
    V30_ECRAN=k;
  }catch(e){}
  return o;
};}
{const f=renderView;renderView=function(){
  const o=f.apply(this,arguments);
  try{
    v30Marques();
    if(UI.view==='equipe'){const h=document.querySelector('.view .ph h1');if(h&&h.textContent.trim()==='Équipe & accès')h.textContent='Salariés & accès';}
    if(UI.view==='pointage')v30BoutonsFin();
    const k=v30Cle();if(V30_ECRAN!==null&&k!==V30_ECRAN)v30Haut();V30_ECRAN=k;
  }catch(e){}
  return o;
};}

/* ---------- 3. Rôles : « Staff » devient « Salarié » ---------- */
try{if(ROLES.staff==='Staff')ROLES.staff='Salarié';}catch(e){}
// « Pointage » s'appelle « Badgeuse » partout (menu du téléphone, cartes de l'accueil, réglages)
try{NAV_SHORT.pointage='Badgeuse';}catch(e){}
try{const m=MODULES.find(x=>x[0]==='pointage');if(m)m[1]='Badgeuse';}catch(e){}

/* ---------- 4. Statistiques : les charges fixes réparties sur les jours d'ouverture ----------
   Avant : le 4 du mois, Léon comptait 4 jours de loyer (fermeture du lundi comprise) contre
   2 jours et demi de ventes, et affichait « tu perds de l'argent ». Maintenant : les charges
   du mois sont réparties sur les jours où le resto ouvre, et la journée en cours ne compte
   qu'au prorata de ce qui est déjà vendu (rien de vendu à 10 h = rien de compté). */
function v30JoursOuverts(date){
  return memo('v30jo:'+date.getFullYear()+'-'+date.getMonth(),()=>{
    const y=date.getFullYear(),m=date.getMonth(),n=dimOf(date);let k=0;
    for(let j=1;j<=n;j++){if(!isClosed(wdOf(new Date(y,m,j)).d))k++;}
    return k||n;
  });
}
{const f=agg;agg=function(dates){
  const A=f.apply(this,arguments);
  try{
    const fx=chargesTotal();
    if(fx&&dates&&dates.length){
      let tot=0;
      dates.forEach(iso=>{
        const d=pdate(iso);if(isClosed(wdOf(d).d))return;
        let part=1;
        if(iso===TODAY_ISO){const prevu=dayCA(TIDX);const fait=daySum(iso).ht;part=prevu>0?Math.min(1,fait/prevu):(fait>0?1:0);}
        tot+=fx/v30JoursOuverts(d)*part;
      });
      A.fixed=tot;A.res=A.ht-A.cost-A.ms-A.loss-A.fixed;
    }
  }catch(e){}
  return A;
};}
try{if(INFO.resultat){INFO.resultat={...INFO.resultat,f:'CA HT − coût matière − masse salariale − pertes − charges fixes (réparties sur tes jours d’ouverture ; aujourd’hui, au prorata de ce qui est déjà vendu)',r:'Renseigne tes charges fixes (loyer, énergie, assurances…) une fois : Léon les répartit tout seul sur tes jours d’ouverture.'};}}catch(e){}

/* ---------- 5. Badgeuse : « Départ pas badgé » se règle en un clic ----------
   Avant : le payé s'arrêtait au début de la pause (Yanis 17:30–20:45, 2h55) et la solution
   était cachée dans le menu « … ». Maintenant un bouton sur la ligne rouge : payer jusqu'à la fin prévue. */
function v30BoutonsFin(){
  if(!pjPeutModifier())return;
  document.querySelectorAll('.pj-t tr.pj-bad.pj-first, .pjm-c.pj-bad').forEach(row=>{
    const box=row.querySelector('.pj-flags');if(!box||box.querySelector('.pj-fin'))return;
    if(![...box.children].some(i=>/Départ pas badgé/.test(i.textContent)))return;
    const src=row.querySelector('.pj-dots')||row.querySelector('.pj-pay-r');if(!src)return;
    const e=src.dataset.e,iso=src.dataset.iso;const emp=empById(e);if(!emp||!iso)return;
    const x=pjLigne(emp,iso);const last=x.sh[x.sh.length-1];if(!last)return;
    box.insertAdjacentHTML('beforeend',`<button class="btn xs pj-fin" data-act="pj-fin" data-e="${esc(e)}" data-iso="${iso}">${ic('check','s')} Payer jusqu’à ${esc(last.e)} (fin prévue)</button>`);
  });
}
ACT['pj-fin']=function(t){
  const x=pjX(t);if(pjLocked(x.iso))return;const last=x.sh[x.sh.length-1];if(!last)return;
  let pcs=(x.pieces||[]).map(pjFmt);
  if(pcs.length)pcs[pcs.length-1].e=last.e;
  else{const inn=(x.ev||[]).find(z=>z.t==='in');
    pcs=x.sh.map((s,i)=>({s:i===0&&inn&&inn.m>sMin(s)+PJ_TOL_IN?hhmm(inn.m):s.s,e:s.e,p:s.p||0}));}
  pjSetPaye(x.e.id,x.iso,pcs);renderView();toast(`${x.e.prenom} : payé jusqu’à ${last.e}`,'check');
};

/* ---------- 6. Compteurs du menu : les mêmes chiffres que sur les écrans ---------- */
{const f=modInfo;modInfo=function(v){
  const x=f.apply(this,arguments);
  try{
    // « S46 à publier · semaine prochaine à publier » : on ne le dit qu'une fois
    if(v==='planning'&&x&&x.s&&/S\d+ à publier/.test(x.s))return {...x,s:x.s.replace(' · semaine prochaine à publier','')};
    // Badgeuse : plus d'« heures à valider » (ancien système) ; on parle de la journée d'hier
    if(v==='pointage'&&x&&S&&effRole()!=='staff'&&EMP.length&&typeof pjEtatJour==='function'){
      const k=liveStats();const h=pjEtatJour(isoD(addDays(TODAY,-1)));
      const bits=[`${k.present}/${k.planned} au travail`];let n=k.late||0;
      if(k.late)bits.push(plur(k.late,'retard'));
      if(h.n&&!h.ok&&pjCanValider()){bits.push(h.bad?`hier : ${plur(h.bad,'ligne à régler','lignes à régler')}`:'hier à valider');n+=h.bad||1;}
      return {s:bits.join(' · '),n,tone:'bad'};
    }
  }catch(e){}
  return x;
};}

/* ---------- 7. « Aujourd'hui » : les problèmes du planning, semaine par semaine ----------
   Avant : « 8 problèmes au planning » en haut, « 4 bloquants » dans le planning. */
{const f=tjHTML;tjHTML=function(){
  let h=f.apply(this,arguments);
  try{
    const b0=(planAlerts(0)||[]).filter(a=>a.tone==='bad').length,b1=(planAlerts(1)||[]).filter(a=>a.tone==='bad').length;
    const t=[b0?plur(b0,'problème')+' cette semaine':'',b1?plur(b1,'problème')+' la semaine prochaine':''].filter(Boolean).join(', ');
    if(t)h=h.replace(/\d+ problèmes? au planning \(Léon a une solution\)/,'Planning : '+t);
  }catch(e){}
  return h;
};}

/* ---------- 8. Couverts : le planning affiche les mêmes que l'accueil ----------
   Avant : l'accueil comptait le groupe de 18 du soir (110), le planning non (92). */
{const f=weekGrid9;weekGrid9=withW(function(w){
  let h=f.apply(this,arguments);
  try{
    const i=h.indexOf('</thead>');if(i<0)return h;
    let d=0;
    const head=h.slice(0,i).replace(/(<div class="dh"><b>[^<]*<\/b><small>)([^<]*)(<\/small>)/g,(m,a,s,z)=>{const dd=d++;if(!/couverts$/.test(s))return m;const c=rmCouverts(w,dd).c;return a+`${c[0]}${c[1]?' · '+c[1]:''} couverts`+z;});
    h=head+h.slice(i);
  }catch(e){}
  return h;
});}
{const f=dayView9;dayView9=withW(function(w,d){
  let h=f.apply(this,arguments);
  try{const c=rmCouverts(w,d).c;h=h.replace(/(<div class="l">Couverts prévus<\/div><div class="v">)\d+(<\/div><div class="s">)\d+ midi · \d+ soir/,`$1${c[0]+c[1]}$2${c[0]} midi · ${c[1]} soir`);}catch(e){}
  return h;
});}

{const f=agendaView;agendaView=withW(function(w){
  let h=f.apply(this,arguments);
  try{let d=0;h=h.replace(/(<section class="ag-d[^"]*"><header><b>[^<]*<\/b><small>)(Fermé|\d+ couverts)/g,(m,a,s)=>{const dd=d++;if(s==='Fermé')return m;const c=rmCouverts(w,dd).c;return a+(c[0]+c[1])+' couverts';});}catch(e){}
  return h;
});}

/* ---------- 9. Hygiène : « Ouvert le hier » → « Ouvert hier » ---------- */
{const f=hygLotRow;hygLotRow=function(){return String(f.apply(this,arguments)).replace(/Ouvert le (hier|aujourd’hui|demain)/g,'Ouvert $1');};}

/* ---------- 10. Écran des codes : juste le pavé (décision du 3 nov.), aussi dans la démo ---------- */
{const f=lockHTML;lockHTML=function(){
  const h=f.apply(this,arguments);
  try{return String(h).replace(/<div class="bfaces">[\s\S]*?<div class="bf-or">[^<]*<\/div><\/div>/,`<h1>${T('Tape ton code')}</h1><p class="sub">Pour pointer ou ouvrir ton espace.</p>`);}catch(e){return h;}
};}

/* ---------- 11. Réglages : la tablette du resto expliquée comme elle marche aujourd'hui ---------- */
{const f=devicesSection;devicesSection=function(){
  let h=f.apply(this,arguments);
  try{
    const compte=typeof V12_COMPTE!=='undefined'&&V12_COMPTE;
    const txt=compte
      ?`Sur la tablette du resto, ouvre <b>${esc(location.origin)}/tablette</b>, connecte-toi une fois avec ton e-mail, puis « Partager → Sur l’écran d’accueil » : l’appli « Léon Tablette » apparaît. Elle reste sur l’écran des codes : chacun tape le sien pour badger. Pour l’accès direction (hygiène, réception, inventaire), le directeur tape son code puis ce mot de passe.`
      :`La tablette du resto reste sur l’écran des codes : chacun tape le sien pour badger. Pour l’accès direction (hygiène, réception, inventaire), le directeur tape son code puis ce mot de passe.`;
    h=h.replace(/Connexion des appareils/,'La tablette du resto').replace(/Sur la tablette ou le téléphone du restaurant[^<]*/,txt);
    if(compte){
      h=h.replace(/<div class="field"><span class="lbl">Identifiant<\/span><span class="mono"[^>]*>[^<]*<\/span><\/div>/,'');
      h=h.replace(/<span class="lbl">Mot de passe<\/span>/,'<span class="lbl">Mot de passe direction</span>');
      h=h.replace(/<p class="faint" style="font-size:12.5px;margin-top:12px">Cet appareil[\s\S]*?<\/p>/,'');
    }
  }catch(e){}
  return h;
};}

/* ---------- 12. Tablette : relever les températures pour de vrai ----------
   Avant : sur la tablette, « Relever les températures » se cochait sans rien taper. Plus de chiffre
   = rien dans le dossier sanitaire et pas d'alerte si un frigo décroche. Maintenant : une case par
   appareil, comme sur l'ordinateur. Pour un congélateur, « 18 » est compris comme −18 °C. */
function v30Temp(eq,raw){let v=parseFloat(String(raw).replace(',','.'));if(isNaN(v))return null;if(eq&&eq.max<0&&v>0)v=-v;return v;}
{const f=kioskTaskItemHTML;kioskTaskItemHTML=function(L,iso,i,it){
  try{
    const done=!!tkDoneOf(iso,L.id).items[i];
    if(it&&it.kind==='temps'&&!done){
      const eqs=(S.hyg&&S.hyg.equip)||[];
      return `<div class="kiosk-temps tk-temps"><div class="kt-h">${ic('thermo','s')} <b>${esc(T(it.t))}</b></div>
        <div class="kt-eqs">${eqs.map(eq=>{const t=hygDayTemp(eq.id);return `<label class="kt-eq"><span><b>${esc(eq.nom)}</b><small>${eq.min} à ${eq.max} °C</small></span>${t?`<b class="kt-v ${hygBad(eq,t.val)?'bad-t':''}">${nf(t.val,1)} °C</b>`:`<input class="inp kt-in" type="text" inputmode="decimal" placeholder="°C" data-tkeq="${eq.id}" aria-label="${esc(eq.nom)}">`}</label>`;}).join('')}</div>
        <button class="btn primary big block" data-act="kiosk-tk-temps" data-l="${L.id}" data-i="${i}">${ic('check','s')} ${T('Enregistrer')}</button></div>`;
    }
  }catch(e){}
  return f.apply(this,arguments);
};}
ACT['kiosk-tk-temps']=function(t){
  const L=tasksOf().find(x=>x.id===t.dataset.l);if(!L)return;const box=t.closest('.tk-temps');if(!box)return;
  const ins=[...box.querySelectorAll('[data-tkeq]')].filter(x=>x.value.trim()!=='');
  if(!ins.length){toast(T('Tape au moins une température'),'alert');return;}
  const bad=[];let faux=false;
  ins.forEach(x=>{const eq=S.hyg.equip.find(e=>e.id===x.dataset.tkeq);if(!eq)return;const v=v30Temp(eq,x.value);if(v==null){faux=true;return;}
    const rec={id:uid('t'),eq:eq.id,date:TODAY_ISO,val:v,ts:nowMin(),who:me().prenom};S.hyg.temps.push(rec);if(hygBad(eq,v))bad.push(rec.id);});
  if(faux)toast(T('Un chiffre n’est pas compris : écris par exemple 3,5'),'alert');
  const reste=(S.hyg.equip||[]).filter(eq=>!hygDayTemp(eq.id)).length;
  if(!reste)tkMark(L,+t.dataset.i,true);
  save();render();
  if(bad.length)acModal(bad);else toast(reste?T('Enregistré. Il reste des appareils à relever.'):T('Températures enregistrées'),'thermo');
};
// Sur l'ordinateur aussi : « 18 » dans la case d'un congélateur = −18 °C
{const f=ACT['tk-temps'];if(f)ACT['tk-temps']=function(t){try{const box=t.closest('.tk-temps');if(box)box.querySelectorAll('[data-tkeq]').forEach(x=>{const eq=S.hyg.equip.find(e=>e.id===x.dataset.tkeq);const v=v30Temp(eq,x.value);if(v!=null)x.value=String(v);});}catch(e){}return f.apply(this,arguments);};}
// Après l'action corrective (frigo hors norme), la tablette se met à jour elle aussi
{const f=ACT['ac-save'];if(f)ACT['ac-save']=function(){const o=f.apply(this,arguments);try{if(U.screen==='kiosk')render();}catch(e){}return o;};}

// La tuile dit ce qu'il y a dedans : les tâches ET les températures
{const f=kioskChoiceHTML;kioskChoiceHTML=function(c){
  if(c&&c.t==='Entretien du restaurant')c={...c,t:'Tâches et températures'};
  return f.call(this,c);
};}
{const f=kioskTachesHTML;kioskTachesHTML=function(){return String(f.apply(this,arguments)).replace(esc(T('Entretien du restaurant')),esc(T('Tâches et températures')));};}
// Pas de montants en euros sur la tablette (décision du 31 oct.) : on cache l'historique des inventaires chiffré
{const f=render;render=function(){const o=f.apply(this,arguments);try{if(typeof TABLETTE!=='undefined'&&TABLETTE&&U.screen==='kiosk')document.querySelectorAll('.kiosk-body h3.sec-t').forEach(h=>{if(/Derniers inventaires/.test(h.textContent)){const p=h.nextElementSibling;h.remove();if(p&&p.matches('section.panel'))p.remove();}});}catch(e){}return o;};}

/* ---------- 13. Téléphone : les tableaux en cartes ont des libellés propres ----------
   Avant : « COÛT PORTION I », « RATIO MATIÈRE I » (le bouton « i » collé au titre), « ABSENCESJOURS ». */
{const f=mcardify;mcardify=function(){
  f.apply(this,arguments);
  try{
    document.querySelectorAll('.tbl-wrap table.tbl.mcards').forEach(tbl=>{
      if(tbl.__v30)return;tbl.__v30=true;
      const heads=[...tbl.querySelectorAll('thead th')].map(th=>{const c=th.cloneNode(true);c.querySelectorAll('button,[data-act="info"]').forEach(b=>b.remove());return [...c.childNodes].map(n=>n.textContent.trim()).filter(Boolean).join(' ');});
      tbl.querySelectorAll('tbody tr,tfoot tr').forEach(tr=>{if(tr.classList.contains('grp'))return;[...tr.querySelectorAll('td')].forEach((td,i)=>{if(i&&heads[i])td.setAttribute('data-label',heads[i]);});});
    });
  }catch(e){}
};}

/* ---------- 14. Vrai site : un nouveau resto n'est plus de type « Vide » ---------- */
if(typeof createResto==='function'){const f=createResto;createResto=function(o){if(o&&o.type==='Vide')o={...o,type:'Restaurant'};return f.apply(this,[o,...[].slice.call(arguments,1)]);};}
{const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{
  if(UI.view==='reglages'){const i=document.getElementById('rg-type');if(i&&i.value==='Vide'){i.value='';i.placeholder='Restaurant, brasserie, bar…';}}
  // « Voir comme » : inutile tant qu'il n'y a pas d'équipe ; sur téléphone, seulement sur l'accueil (sauf aperçu en cours)
  const h=document.documentElement;h.classList.toggle('v30-noemp',!!(S&&!EMP.length));h.classList.toggle('v30-apercu',!!U.viewAs);h.setAttribute('data-v30v',UI.view||'');
}catch(e){}return o;};}
