/* =========================================================
   V14.08–14.09 · L'AVIS DE LÉON PARTOUT + LA NOTE RGPD SUR LA TABLETTE
   Décidé avec Maurice le 9 nov. :
   - « Un peu partout, le bouton L'avis de Léon » : sur chaque page (commandes, marges, chiffres,
     personnel, hygiène, accueil), Léon donne son avis tout de suite, avec les euros en jeu et
     le bouton pour agir, puis on peut lui poser n'importe quelle question.
     Bienveillant, logique, et d'abord pour faire gagner de l'argent.
   - L'IA (Claude) répond aux questions libres dès que la clé est branchée côté serveur
     (fonction `leon-ia`). Sans clé, Léon répond avec ses réponses préparées.
   - RGPD : avant son premier badge, chaque salarié lit la note sur la tablette et touche
     « J'ai lu et compris » ; le patron voit qui l'a lue dans Salariés & accès.
   ========================================================= */

/* ---------- 1. l'IA branchée par le site (fonction serveur leon-ia) ---------- */
const V14_IA=(()=>{try{return window.parent!==window&&window.parent.__leonIA||null;}catch(e){return null;}})();
if(V14_IA&&!AI){
  AI=async function(turns,opts){
    let r;try{r=await V14_IA(turns);}catch(e){const er=new Error('ia');er.code='not_granted';throw er;}
    if(!r||r.erreur){const er=new Error('ia');er.code=r&&r.code==='rate_limited'?'rate_limited':'not_granted';throw er;}
    if(opts&&opts.onText)try{opts.onText({text:r.text});}catch(e){}
    return {text:r.text};
  };
  AI_READY=true;
}
// Léon sait sur quelle page on est, et ce qu'il en pense déjà
{const f=leonRules;leonRules=function(){
  let extra='';try{const P=V14_PAGES[v14Page()];if(P){const L=v14AvisList(v14Page()).slice(0,5);extra=`\n\nLe patron est sur la page « ${P.l} ». Ce que tu as repéré sur cette page : ${L.map(x=>x.t.replace(/<[^>]+>/g,'')+(x.e?` (${x.e})`:'')).join(' ; ')||'rien de particulier'}.`;}}catch(e){}
  return f.apply(this,arguments)+extra+`\n\nTa priorité : faire gagner de l'argent au restaurant (marge, pertes, masse salariale, commandes justes), avec des actions concrètes et chiffrées. Si une donnée manque, dis-le simplement et propose comment l'obtenir.`;
};}

/* ---------- 2. l'avis, page par page ---------- */
const V14_PAGES={
  accueil:{l:'Accueil',q:['Résume-moi la journée','Qu’est-ce qui me coûte le plus cher en ce moment ?','Qu’est-ce que je peux améliorer cette semaine ?']},
  stocks:{l:'Stocks & commandes',q:['Que dois-je commander aujourd’hui ?','Où je perds de la marchandise ?','Mon stock est-il trop gros ?']},
  recettes:{l:'Fiches & marges',q:['Quel plat me rapporte le plus ?','Quel prix pour le burger ?','Comment baisser mon coût matière ?']},
  stats:{l:'Chiffres',q:['Comment va le mois ?','Pourquoi mon coût matière monte ?','Où je peux gagner 500 € ce mois-ci ?']},
  equipe:{l:'Équipe',q:['Ma masse salariale est-elle bonne ?','Qui fait trop d’heures ?','Comment réduire les heures sup ?']},
  pointage:{l:'Badgeuse',q:['Qui est en retard ?','Les heures de la semaine sont-elles bonnes ?','Combien me coûtent les heures sup ?']},
  conges:{l:'Congés',q:['Qui est en congé la semaine prochaine ?','Est-ce que je peux accepter ce congé ?']},
  hygiene:{l:'Hygiène',q:['Suis-je prêt pour un contrôle sanitaire ?','Qu’est-ce qui manque aujourd’hui ?']},
};
const v14Page=()=>UI.view==='stocks'?'stocks':UI.view;
const v14E=n=>eur(n,0);
const v14Try=(fn)=>{try{return fn()||[];}catch(e){return [];}};
function avisStocks(){
  const A=[];
  v14Try(()=>supplierNames().filter(f=>supProducts(f).length).map(supPlan).filter(p=>p.lines.length&&p.orderBy<=TODAY&&!p.draft).slice(0,3).forEach(p=>A.push({tone:'warn',ic:'truck',t:`Commande à passer aujourd’hui chez ${esc(p.f)}`,s:`Pour être livré ${v14Day(p.D)} : Léon conseille ${plur(p.lines.length,'produit')}, environ ${v14E(p.tot)} HT.`,act:'v14-cmd',d:{f:p.f},b:'Préparer'})));
  v14Try(()=>{const W=useByWeekday();const day=id=>sum(W,w=>w[id]||0)/7;
    const R=S.ingredients.filter(i=>stockStatus(i)&&!isConso(i)).map(i=>{const u=day(i.id);const D=nextDelivery(i.f,TODAY);const dd=Math.max(1,Math.round((D-TODAY)/864e5));return {i,u,c:u>0?i.st/u:99,dd,D};})
      .filter(x=>x.u>0&&x.c<x.dd&&!S.orders.some(o=>v14Open(o)&&o.lines.some(l=>l.id===x.i.id))).sort((a,b)=>a.c-b.c);
    const jr=x=>x.c<1?'moins d’un jour':'environ '+Math.floor(x.c)+' jour'+(x.c>=2?'s':'');
    if(R.length===1){const x=R[0];A.push({tone:'bad',ic:'alert',t:`${esc(x.i.n)} : il t’en reste pour ${jr(x)}`,s:`Prochaine livraison possible ${v14Day(x.D)}. Commande-le, ou prévois un dépannage.`,act:'v14-go',d:{v:'stocks',t:'cmd'},b:'Commander'});}
    else if(R.length>1)A.push({tone:'bad',ic:'alert',t:`${R.length} produits vont manquer avant la prochaine livraison`,s:`${R.slice(0,5).map(x=>`${esc(x.i.n)} (${jr(x)})`).join(', ')}. Commande-les aujourd’hui, ou prévois un dépannage.`,act:'v14-go',d:{v:'stocks',t:'cmd'},b:'Commander'});});
  v14Try(()=>{const used=new Set();useByWeekday().forEach(w=>Object.keys(w).forEach(k=>{if(w[k]>0)used.add(k);}));
    const dorm=S.ingredients.filter(i=>stockStatus(i)&&!isConso(i)&&!used.has(i.id)&&i.st*i.p>15);const v=sum(dorm,i=>i.st*i.p);
    if(v>40)A.push({tone:'info',ic:'box',t:`${v14E(v)} de stock qui ne bouge pas`,s:`${dorm.slice(0,4).map(i=>esc(i.n)).join(', ')}${dorm.length>4?'…':''} : aucune vente ne les utilise depuis 4 semaines. Moins commander = plus de trésorerie.`,e:v14E(v)});});
  v14Try(()=>{const av=S.orders.filter(o=>o.avoirStatus==='a_demander');const v=sum(av,o=>o.avoir||0);if(v>0.5)A.push({tone:'brass',ic:'euro',t:`${eur(v)} d’avoirs à demander`,s:`${av.map(o=>esc(o.f)).join(', ')} : manquants ou prix trop chers à la réception. Le mail est prêt.`,act:'ord-open',d:{id:av[0].id},b:'Demander',e:eur(v)});});
  v14Try(()=>{const F=fuites(30);const top=F.L[0];if(top&&top.unk>20)A.push({tone:'bad',ic:'trendUp',t:`${esc(top.k)} : ${v14E(top.unk)} partis sans explication en 30 jours`,s:esc(V14_ADVICE[top.k]||'Recompte cette famille et vérifie les fiches techniques.'),act:'v14-go',d:{v:'stocks',t:'stock'},b:'Voir',e:v14E(top.unk)+'/mois'});});
  return A;
}
function avisMarge(){
  const A=[];const T=S.target||0.28;
  v14Try(()=>{const L=S.recipes.filter(r=>r.t!=='prep'&&r.pv).map(r=>{const m=metrics(r);const q=sold30(r.id);return {r,m,q,perte:Math.max(0,(m.cost-T*m.pvht))*q};});
    L.filter(x=>x.m.ratio>T+0.02&&x.perte>10).sort((a,b)=>b.perte-a.perte).slice(0,3).forEach(x=>{const sp=suggestPrice(x.m.cost,T,x.m.tva);
      A.push({tone:'warn',ic:'euro',t:`${esc(x.r.n)} : coût matière ${pc(x.m.ratio,0)} (objectif ${pc(T,0)})`,s:sp>x.r.pv*1.1?`${nf(x.q)} vendus en 30 jours. Passer d’un coup à ${eur(sp)} serait trop brutal pour tes clients : monte de 1 € (à ${eur(x.r.pv+1)}) et revois le grammage du produit le plus cher. Objectif : environ ${v14E(x.perte)} récupérés par mois.`:`${nf(x.q)} vendus en 30 jours. À ${eur(sp)} au lieu de ${eur(x.r.pv)}, ou avec un grammage un peu revu, tu récupères environ ${v14E(x.perte)} par mois.`,act:'rec-open',d:{id:x.r.id},b:'Voir la fiche',e:'+'+v14E(x.perte)+'/mois'});});
    const st=L.filter(x=>x.q>0).sort((a,b)=>b.m.marge*b.q-a.m.marge*a.q)[0];
    if(st)A.push({tone:'ok',ic:'spark',t:`Ta star : ${esc(st.r.n)}`,s:`${v14E(st.m.marge*st.q)} de marge en 30 jours (${eur(st.m.marge)} par plat). Mets-le en avant : ardoise, suggestion en salle.`});
    const dog=L.filter(x=>x.q>0&&x.q<Math.max(8,(sum(L,y=>y.q)/L.length)*0.25)&&x.m.ratio>T).sort((a,b)=>a.q-b.q)[0];
    if(dog)A.push({tone:'info',ic:'trash',t:`${esc(dog.r.n)} se vend peu et rapporte peu`,s:`${nf(dog.q)} vendus en 30 jours, coût matière ${pc(dog.m.ratio,0)}. À retirer de la carte ? Moins de produits = moins de pertes.`});});
  v14Try(()=>pxLatest().slice(0,1).forEach(x=>{const imp=priceImpact(x);const v=sum(imp,y=>y.loss);if(v>5)A.push({tone:'warn',ic:'trendUp',t:`${esc(x.n)} : +${nf((x.nu-x.old)/x.old*100,0)} % chez ${esc(x.f)}`,s:`Environ ${v14E(v)} de marge en moins par mois sur ${plur(imp.length,'plat')}.`,act:'px-open',d:{id:x.id},b:'Voir',e:'-'+v14E(v)+'/mois'});}));
  return A;
}
function avisChiffres(){
  const A=[];
  v14Try(()=>{const M=agg(isoRange(isoD(new Date(TODAY.getFullYear(),TODAY.getMonth(),1)),TODAY_ISO));if(!M.ht)return;const T=S.target||0.28;
    if(M.fc>T+0.01)A.push({tone:'warn',ic:'euro',t:`Coût matière du mois : ${pc(M.fc,1)} (objectif ${pc(T,0)})`,s:`Revenir à l’objectif = environ ${v14E((M.fc-T)*M.ht)} de plus depuis le 1er. Regarde les plats en orange dans les fiches.`,act:'v14-go',d:{v:'recettes'},b:'Les fiches',e:'+'+v14E((M.fc-T)*M.ht)});
    else A.push({tone:'ok',ic:'check',t:`Coût matière du mois : ${pc(M.fc,1)}`,s:'Dans l’objectif. Continue à contrôler les livraisons et les grammages.'});
    if(M.msr>0.36)A.push({tone:'warn',ic:'users',t:`Masse salariale : ${pc(M.msr,0)} du CA`,s:`Au-dessus des 30-35 % d’une brasserie saine : chaque point de trop coûte environ ${v14E(M.ht*0.01)} sur le mois. Regarde les heures hors coup de feu.`,act:'v14-go',d:{v:'planning'},b:'Le planning'});
    if(M.ht&&M.loss/M.ht>0.02)A.push({tone:'bad',ic:'trash',t:`Pertes : ${v14E(M.loss)} ce mois (${pc(M.loss/M.ht,1)} du CA)`,s:'Au-delà de 2 %, il y a un problème : DLC, portions ou réception.',act:'v14-go',d:{v:'stocks',t:'stock'},b:'Où ça part'});
    if(M.res<0)A.push({tone:'bad',ic:'alert',t:`Résultat estimé négatif ce mois (${v14E(M.res)})`,s:'Les charges fixes ne sont pas couvertes. Les 3 leviers : coût matière, masse salariale, ticket moyen.'});
    else A.push({tone:'info',ic:'trendUp',t:`Ticket moyen : ${eur(M.tm)}`,s:`+1 € de ticket moyen sur ${nf(M.tk)} tickets = ${v14E(M.tk)} de CA en plus ce mois. Dessert ou café proposé à chaque table.`});
  });
  return A;
}
function avisEquipe(){
  const A=[];
  v14Try(()=>{const k=liveStats();if(k.late)A.push({tone:'bad',ic:'clock',t:`${plur(k.late,'retard')} aujourd’hui`,s:'Un retard répété se règle tôt, en tête à tête, sans attendre.',act:'v14-go',d:{v:'pointage',t:'jour'},b:'Badgeuse'});});
  v14Try(()=>{const R=(S.requests||[]).filter(r=>r.status==='pending');if(R.length)A.push({tone:'info',ic:'calendar',t:`${plur(R.length,'demande')} en attente`,s:'Répondre vite, c’est une équipe qui reste.',act:'v14-go',d:{v:'conges'},b:'Répondre'});});
  v14Try(()=>{const M=agg(daysBack(1,28));if(M.ht&&M.msr)A.push({tone:M.msr>0.36?'warn':'ok',ic:'users',t:`Masse salariale sur 4 semaines : ${pc(M.msr,0)} du CA`,s:M.msr>0.36?`Objectif 30-35 %. Revenir à 35 % = environ ${v14E((M.msr-0.35)*M.ht)} sur 4 semaines. L’avis de Léon dans le planning montre où raccourcir.`:'Bien tenue. Garde un œil sur les heures sup en fin de mois.',act:'v14-go',d:{v:'planning'},b:'Le planning'});});
  v14Try(()=>{const n=EMP.filter(e=>!e.hidden&&!e.rgpdLu).length;if(n)A.push({tone:'info',ic:'alert',t:`${plur(n,'salarié n’a','salariés n’ont')} pas encore lu la note RGPD`,s:'Elle s’affiche toute seule à leur prochain badge sur la tablette.'});});
  return A;
}
function avisHygiene(){
  const A=[];
  v14Try(()=>{const eq=(S.hyg.equip||[]);const done=new Set((S.hyg.temps||[]).filter(t=>t.date===TODAY_ISO).map(t=>t.eq));const m=eq.filter(e=>!done.has(e.id));if(m.length)A.push({tone:'warn',ic:'thermo',t:`${plur(m.length,'relevé')} de température à faire aujourd’hui`,s:`${m.slice(0,4).map(e=>esc(e.n||e.nom||'Frigo')).join(', ')}. Un relevé manquant, c’est un point en moins au contrôle.`,act:'v14-go',d:{v:'hygiene'},b:'Relever'});});
  v14Try(()=>{const L=(S.hyg.lots||[]).filter(l=>l.statut!=='jete'&&l.statut!=='fini'&&lotEffDlc(l)&&lotEffDlc(l)<=TODAY_ISO);if(L.length)A.push({tone:'bad',ic:'trash',t:`${plur(L.length,'produit')} à DLC aujourd’hui ou dépassée`,s:`${L.slice(0,3).map(l=>esc(l.nom)).join(', ')}. À utiliser en priorité (plat du jour) ou à déclarer en perte.`,act:'v14-go',d:{v:'hygiene'},b:'Voir'});});
  if(!A.length)A.push({tone:'ok',ic:'check',t:'Rien à signaler côté hygiène',s:'Relevés faits, pas de DLC dépassée. Tu es prêt pour un contrôle.'});
  return A;
}
function v14AvisList(p){
  const can=CAN();
  if(p==='stocks')return can.stocks?avisStocks():[];
  if(p==='recettes')return can.costs?avisMarge():[];
  if(p==='stats')return can.costs||can.ca?avisChiffres():[];
  if(p==='equipe'||p==='pointage'||p==='conges')return avisEquipe();
  if(p==='hygiene')return avisHygiene();
  if(p==='accueil'){const all=[...(can.stocks?avisStocks():[]),...(can.costs?avisMarge():[]),...(can.costs||can.ca?avisChiffres():[]),...avisEquipe(),...avisHygiene()];
    const rank={bad:0,warn:1,brass:1,info:2,ok:3};return all.sort((a,b)=>(rank[a.tone]??2)-(rank[b.tone]??2)).slice(0,5);}
  return [];
}
function v14AvisModal(p){
  const P=V14_PAGES[p]||V14_PAGES.accueil;const L=v14AvisList(p);
  const enjeu=L.filter(x=>x.e&&x.e.startsWith('+'));
  openModal(`<div class="mh"><div><h3>${ic('spark')} L’avis de Léon · ${esc(P.l)}</h3><p>${L.length?`Voilà ce que je vois${enjeu.length?' (et ce que tu peux récupérer)':''} :`:'Rien ne me saute aux yeux ici. Pose-moi ta question.'}</p></div><button class="icon-btn" data-act="modal-close" aria-label="Fermer">${ic('x')}</button></div>
   ${L.length?`<div class="alerts v14-avis">${L.map((x,k)=>`<div class="al t-${x.tone}"><span class="ico ${x.tone}">${ic(x.ic||'spark','s')}</span><div class="al-x"><b>${x.t}</b><p>${x.s}</p></div><div class="acts">${x.e?`<span class="v14-enjeu ${x.e.startsWith('-')?'neg':''}">${esc(x.e)}</span>`:''}${x.act?`<button class="btn sm" data-act="v14-avis-go" data-k="${k}" data-p="${p}">${esc(x.b||'Voir')}</button>`:''}</div></div>`).join('')}</div>`:''}
   <div class="v14-ask"><b>Une question ? Demande à Léon</b><div class="v14-ask-q">${P.q.map(q=>`<button class="chip" data-act="v14-ask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
   <form class="v14-ask-f" id="v14-ask-f"><input class="inp" name="q" placeholder="Ex. Est-ce que je peux embaucher un serveur de plus ?" autocomplete="off"><button class="btn brass" type="submit">${ic('send','s')}</button></form></div>`,'wide');
}
Object.assign(ACT,{
  'v14-avis'(t){v14AvisModal(t.dataset.p||v14Page());},
  'v14-avis-go'(t){const x=v14AvisList(t.dataset.p)[+t.dataset.k];if(!x||!x.act)return;closeModal();const f=ACT[x.act];if(f)f({dataset:{...x.d}});},
  'v14-ask'(t){const q=String(t.dataset.q||'').trim();if(!q)return;closeModal();UI.chatOpen=true;renderChat();setTimeout(()=>askLeon(q),60);},
});
// le bouton sur chaque page (le planning garde le sien)
{const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{
  const p=v14Page();if(!V14_PAGES[p]||typeof U==='undefined'||U.screen!=='app'||effRole()==='staff'||document.querySelector('.view .v14-avis-btn'))return o;
  if(p==='stocks'&&(UI.stock.order||UI.stock.recv))return o;
  const ph=document.querySelector('.view .ph');if(!ph)return o;let acts=ph.querySelector(':scope > .acts');
  if(!acts){acts=document.createElement('div');acts.className='acts';ph.appendChild(acts);}
  acts.insertAdjacentHTML('afterbegin',`<button class="btn brass v14-avis-btn" data-act="v14-avis" data-p="${p}">${ic('spark','s')} L’avis de Léon</button>`);
}catch(e){}return o;};}

/* ---------- 3. la note RGPD, lue sur la tablette avant le premier badge ---------- */
const V14_RGPD_ON=()=>typeof TABLETTE!=='undefined'&&TABLETTE;
{const f=badgeHTML;badgeHTML=function(){
  const e=U.empId&&empById(U.empId);
  if(!V14_RGPD_ON()||!e||e.rgpdLu||U.badgeMsg||!(S.emp||[]).some(x=>x.id===e.id))return f.apply(this,arguments);
  return `<div class="stage v14-rgpd-st"><div class="v14-rgpd-t">
    <h1 style="margin-top:4px">${T('Avant ton premier badge')}</h1>
    <p class="sub">${T('Ce que Léon garde quand tu badges, et pourquoi.')}</p>
    <ul class="v14-rgpd-l">
      <li>${ic('clock','s')} <span>${T('Tes heures d’arrivée, de pause et de départ, pour ta paie et tes heures sup.')}</span></li>
      <li>${ic('lock','s')} <span>${T('Pas de photo, pas d’empreinte, pas de géolocalisation. Juste ton code, à ne donner à personne.')}</span></li>
      <li>${ic('eye','s')} <span>${T('Seuls la direction et le comptable voient tes heures. Gardées 5 ans, en France.')}</span></li>
      <li>${ic('users','s')} <span>${T('Tu peux demander à voir ou corriger tes données à ton responsable.')}</span></li>
    </ul>
    <button class="btn launch big block" data-act="v14-rgpd-ok">${ic('check')} ${T('J’ai lu et compris')}</button>
    <button class="btn demo-link" data-act="lock" style="margin-top:10px">${T('Retour')}</button>
  </div></div>`;
};}
ACT['v14-rgpd-ok']=function(){const id=U.empId;if(!id)return;S.emp=S.emp.map(o=>o.id===id?{...o,rgpdLu:TODAY_ISO}:o);syncCtx();save();render();};
// le patron voit qui a lu la note
{const f=renderView;renderView=function(){const o=f.apply(this,arguments);try{
  if(UI.view!=='equipe'||!CAN().settings)return o;
  document.querySelectorAll('.view [data-act="emp-edit"][data-id]').forEach(b=>{const card=b.closest('.emp-card, .card, section, tr, .row');if(!card||card.querySelector('.v14-rg'))return;const e=empById(b.dataset.id);if(!e||!e.id)return;
    card.insertAdjacentHTML('beforeend',`<div class="v14-rg ${e.rgpdLu?'ok':''}">${ic(e.rgpdLu?'check':'clock','s')} Note RGPD : ${e.rgpdLu?'lue le '+frDate(e.rgpdLu):'pas encore lue (au prochain badge)'}</div>`);});
}catch(e){}return o;};}

[
 ['Avant ton premier badge','Before your first clock-in','உன் முதல் வருகைப் பதிவுக்கு முன்','قبل أول تسجيل حضور لك','Antes do teu primeiro registo','Antes de tu primer fichaje'],
 ['Ce que Léon garde quand tu badges, et pourquoi.','What Léon keeps when you clock in, and why.','நீ பதிவு செய்யும்போது லியோன் எதைச் சேமிக்கிறது, ஏன்.','ما يحفظه ليون عند تسجيلك، ولماذا.','O que o Léon guarda quando registas, e porquê.','Lo que Léon guarda cuando fichas, y por qué.'],
 ['Tes heures d’arrivée, de pause et de départ, pour ta paie et tes heures sup.','Your arrival, break and leaving times, for your pay and overtime.','உன் வருகை, இடைவேளை, புறப்பாடு நேரங்கள் — சம்பளம் மற்றும் கூடுதல் நேரத்துக்காக.','أوقات وصولك واستراحتك ومغادرتك، من أجل راتبك وساعاتك الإضافية.','As tuas horas de entrada, pausa e saída, para o salário e horas extra.','Tus horas de llegada, pausa y salida, para tu nómina y horas extra.'],
 ['Pas de photo, pas d’empreinte, pas de géolocalisation. Juste ton code, à ne donner à personne.','No photo, no fingerprint, no location. Just your code — never share it.','புகைப்படம், கைரேகை, இருப்பிடம் இல்லை. உன் குறியீடு மட்டும் — யாருக்கும் சொல்லாதே.','لا صورة ولا بصمة ولا تحديد موقع. فقط رمزك، لا تعطه لأحد.','Sem foto, sem impressão digital, sem localização. Só o teu código, não o dês a ninguém.','Sin foto, sin huella, sin geolocalización. Solo tu código, no se lo des a nadie.'],
 ['Seuls la direction et le comptable voient tes heures. Gardées 5 ans, en France.','Only management and the accountant see your hours. Kept 5 years, in France.','நிர்வாகமும் கணக்காளரும் மட்டுமே உன் நேரங்களைப் பார்ப்பார்கள். பிரான்சில் 5 ஆண்டுகள் வைக்கப்படும்.','فقط الإدارة والمحاسب يرون ساعاتك. تُحفظ 5 سنوات في فرنسا.','Só a direção e o contabilista veem as tuas horas. Guardadas 5 anos, em França.','Solo la dirección y el contable ven tus horas. Se guardan 5 años, en Francia.'],
 ['Tu peux demander à voir ou corriger tes données à ton responsable.','You can ask your manager to see or correct your data.','உன் தரவைப் பார்க்க அல்லது திருத்த உன் பொறுப்பாளரிடம் கேட்கலாம்.','يمكنك أن تطلب من مسؤولك رؤية بياناتك أو تصحيحها.','Podes pedir ao teu responsável para ver ou corrigir os teus dados.','Puedes pedir a tu responsable ver o corregir tus datos.'],
 ['J’ai lu et compris','I have read and understood','படித்து புரிந்துகொண்டேன்','قرأت وفهمت','Li e compreendi','He leído y entendido'],
].forEach(r=>{LANGS.forEach(([k],n)=>{if(n&&r[n]){I18N[k][r[0]]=r[n];const alt=r[0].replace(/’/g,"'");if(alt!==r[0])I18N[k][alt]=r[n];}});});
document.addEventListener('submit',e=>{if(e.target&&e.target.id==='v14-ask-f'){e.preventDefault();const i=e.target.querySelector('input');ACT['v14-ask']({dataset:{q:i?i.value:''}});}});
// réponse préparée : plus de « ouvre la page dans Claude » (ça n'existe plus sur le vrai site)
{const f=localAnswer;localAnswer=function(q){const r=f.apply(this,arguments);return String(r).replace(/Je fonctionne ici en mode démo sans connexion à l’IA : (.*?)\. Ouvre la page dans Claude pour me poser n’importe quelle question\./,'Pour l’instant je réponds avec mes réponses préparées : $1. Touche « L’avis de Léon » en haut de chaque page : je te dis ce que je vois, avec les euros en jeu.');};}
