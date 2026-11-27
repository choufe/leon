/* =========================================================
   15.12 · « DIS LÉON » À LA VOIX SUR LA TABLETTE (27 nov. 2026, version gratuite)
   Demandé par Maurice : « parler à Léon depuis la tablette pour sortir une étiquette,
   prendre la température… chaque tâche de la tablette peut être faite avec Léon en vocal ;
   une fois connecté à son compte perso, un bouton qui permet de parler à Léon. »
   Choix validés : on appuie pour parler (pas d'écoute permanente) ; Léon répond par une
   note écrite qui résume ce qu'il a compris, et on valide d'un ✓ ; 100 % gratuit :
   la voix est reconnue par l'iPad, la phrase est comprise par Léon avec les listes du
   resto (produits, frigos, tâches). Pas d'IA payante pour l'instant.
   Ce que Léon sait faire : étiquettes (même un produit nouveau), températures, cocher une
   tâche, produit ouvert (ouvre l'appareil photo), pointer (arrivée, pause, retour, départ),
   ouvrir un écran. Tout est signé au nom de la personne connectée.
   ========================================================= */
[['Dis Léon','Hey Léon','லியோன்','قل يا ليون','Diz Léon','Dime Léon'],
 ['Je t’écoute…','I’m listening…','கேட்கிறேன்…','أنا أستمع…','Estou a ouvir…','Te escucho…'],
 ['J’ai fini','Done','முடிந்தது','انتهيت','Terminei','He terminado'],
 ['Ou écris-le ici','Or type it here','அல்லது இங்கே எழுதவும்','أو اكتبه هنا','Ou escreve aqui','O escríbelo aquí'],
 ['Léon a compris :','Léon understood:','லியோன் புரிந்துகொண்டது:','فهم ليون:','O Léon percebeu:','Léon ha entendido:'],
 ['Valider','Confirm','உறுதிசெய்','تأكيد','Validar','Validar'],
 ['Recommencer','Try again','மீண்டும்','إعادة','Recomeçar','Volver a empezar'],
 ['Je n’ai pas compris.','I didn’t understand.','எனக்குப் புரியவில்லை.','لم أفهم.','Não percebi.','No he entendido.'],
 ['Par exemple :','For example:','உதாரணமாக:','مثلاً:','Por exemplo:','Por ejemplo:'],
 ['Le micro n’est pas disponible ici : écris ta demande.','The microphone isn’t available here: type your request.','மைக் இங்கே இல்லை: உங்கள் கோரிக்கையை எழுதவும்.','الميكروفون غير متاح هنا: اكتب طلبك.','O microfone não está disponível aqui: escreve o pedido.','El micrófono no está disponible aquí: escribe tu petición.'],
 ['C’est fait','Done','முடிந்தது','تم','Feito','Hecho'],
].forEach(r=>LANGS.forEach(([k],i)=>{if(i&&I18N[k])I18N[k][r[0]]=r[i];}));

/* ---------- comprendre une phrase ---------- */
const VOC_NB={zero:0,un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,neuf:9,dix:10,onze:11,douze:12,treize:13,quatorze:14,quinze:15,seize:16,vingt:20,trente:30};
const VOC_VIDE=new Set('je j ai a on le la les l de du des d un une mon ma mes ton ta pour s il te plait stp svp moi me m fais fait faire leon dis ok alors euh bon et avec sur au aux en y peux tu veux voudrais met mets mettre sort sors sortir donne donner nous vous c est ca cela the please'.split(' '));
function vocNorm(s){
  // on protège virgules et signes moins avant de tout simplifier
  let t=String(s||'').replace(/(\d)[.,](\d)/g,'$1p$2').replace(/(^|\s)[-−–](\d)/g,'$1moins $2');
  t=dlcNorm(t).replace(/(\d)p(\d)/g,'$1.$2');
  t=t.split(' ').map(w=>VOC_NB[w]!=null?String(VOC_NB[w]):w).join(' ');
  t=t.replace(/(\d+) (virgule|point) (\d+)/g,'$1.$3').replace(/(^| )moins (\d)/g,'$1-$2').replace(/ (degre|degres|°c|°)( |$)/g,' degres$2');
  return t.replace(/\s+/g,' ').trim();
}
const vocWords=t=>t.split(' ').filter(w=>w&&!VOC_VIDE.has(w)&&!/^-?\d/.test(w));
// quelques mots que l'équipe emploie pour le même produit
const VOC_SYN=[['steak','boeuf','viande'],['creme','chantilly'],['jambon','jambonneau'],['fromage','cheddar','emmental'],['patate','pomme'],['oignon','oignons'],['frigo','refrigerateur','frigidaire'],['congel','congelateur','surgele']];
const vocSame=(a,b)=>a===b||(a.length>=4&&b.length>=4&&(a.startsWith(b)||b.startsWith(a)))||VOC_SYN.some(g=>g.some(x=>vocSame0(x,a))&&g.some(x=>vocSame0(x,b)));
const vocSame0=(a,b)=>a===b||(a.length>=4&&b.length>=4&&(a.startsWith(b)||b.startsWith(a)));
// le nom tel qu'il a été dit (accents compris) pour un produit nouveau
function vocRawName(raw,words){const toks=String(raw).split(/[\s,]+/).filter(Boolean);const nt=toks.map(x=>dlcNorm(x));
  const idx=words.map(w=>nt.findIndex(x=>x===w||x.split(' ').includes(w))).filter(i=>i>=0);if(!idx.length)return vocCap(words.join(' '));
  const a=Math.min(...idx),b=Math.max(...idx);return vocCap(toks.slice(a,b+1).join(' ').replace(/[.!?]+$/,''));}
// score d'un nom (produit, frigo, tâche) face aux mots entendus : part des mots du nom retrouvés
function vocScore(name,words){
  const nw=vocWords(dlcNorm(name)).filter(w=>w.length>1&&!/^(mg|mat|grasse|aop|igp|bio|kg|g|l|cl|ml)$/.test(w));
  if(!nw.length||!words.length)return 0;
  const hit=nw.filter(w=>words.some(x=>vocSame(x,w))).length;
  if(!hit)return 0;
  const extra=words.filter(x=>!nw.some(w=>vocSame(x,w))).length;
  // tout ce qui a été dit fait partie du nom (« jambon » → « Jambon blanc supérieur ») : bon signe
  const base=hit/nw.length-Math.min(0.3,extra*0.05);
  return extra===0?Math.max(base,0.6):base;
}
const vocBest=(list,words,nameOf,min=0.38)=>{let b=null,s=min;list.forEach(x=>{const v=vocScore(nameOf(x),words);if(v>s){s=v;b=x;}});return b;};
const vocCap=s=>s.charAt(0).toUpperCase()+s.slice(1);

function vocEtqItems(){const L=[];etqGroups(true).forEach(g=>g.items.forEach(p=>L.push(p)));return L;}
function vocParse(raw){
  const t=vocNorm(raw);const P=[];if(!t)return P;
  const has=rx=>rx.test(t);
  // pointage
  if(has(/(^| )(pointe|pointer|badge|badger|j arrive|je commence|prise de poste|prends mon service|je pars|je m en vais|fin de service|je termine ma|debauche|pause|je reprends|retour de pause|fin de pause)( |$)/)){
    const k=has(/(fin de pause|retour de pause|je reprends|reprendre)/)?'back':has(/pause/)?'pause':has(/(je pars|m en vais|fin de service|je termine|debauche|depart|sortie)/)?'out':'in';
    P.push({k:'badge',t:k});return P;
  }
  // ouvrir un écran
  const go=t.match(/(ouvre|ouvrir|va|aller|montre|affiche|voir)( (sur|dans|le|la|les|mon|ma))* (planning|inventaire|reception|hygiene|accueil|taches|produits ouverts|etiquettes|haccp)( |$)/);
  if(go){P.push({k:'go',v:go[4]});return P;}
  // produit ouvert
  const op=t.match(/(j ouvre|j ai ouvert|on ouvre|on a ouvert|ouverture d(e|u|es)?|produit ouvert|nouveau produit ouvert)( (un|une|le|la|les|du|de|des|d))* (.+)$/);
  if(op&&!has(/etiquette/)){const n=vocWords(op[5]).join(' ');P.push({k:'lot',n:n?vocCap(n):''});return P;}
  // températures
  const eqs=(S.hyg&&S.hyg.equip)||[];
  if(has(/(temperature|degres|frigo|chambre froide|congel|vitrine|cellule|saladette|frais|froid)/)&&has(/-?\d/)){
    t.split(/ (?:et|puis|aussi) |, /).forEach(seg=>{
      const nums=(seg.match(/-?\d+(\.\d+)?/g)||[]).map(Number);if(!nums.length)return;
      const words=vocWords(seg).filter(w=>!/^(temperature|degres|est|il|fait|releve|relever|note|noter)$/.test(w));
      // un appareil n'est choisi tout seul que si son nom est entièrement reconnu (et son numéro, s'il en a un)
      let cands=eqs.map(e=>{const dg=(dlcNorm(e.nom).match(/\d+/)||[])[0];const s=vocScore(e.nom,words);const full=s>=0.85&&(!dg||(nums.length>=2&&nums.includes(+dg)));return {e,s,dg,full};}).filter(x=>x.s>0).sort((a,b)=>(b.full-a.full)||(b.s-a.s));
      const fulls=cands.filter(x=>x.full);
      let eq=fulls.length===1?fulls[0].e:(eqs.length===1?eqs[0]:null);
      const dg=eq?((dlcNorm(eq.nom).match(/\d+/)||[])[0]):null;
      const vals=nums.filter((n,i)=>!(dg!=null&&n===+dg&&i===nums.indexOf(+dg)&&nums.length>1));
      const val=vals.length?vals[vals.length-1]:nums[nums.length-1];
      P.push({k:'temp',eq:eq?eq.id:null,val,choices:eq?null:(cands.length?cands.map(x=>x.e.id):eqs.map(e=>e.id))});
    });
    if(P.length)return P;
  }
  // étiquettes (mot « étiquette » / « imprime », ou « 3 steak haché » quand le produit est connu)
  const items=vocEtqItems();
  const wantEtq=has(/(etiquette|imprim|dlc)/);
  const segs=t.replace(/(etiquettes?|imprimer?|imprime moi|dlc)/g,' ').split(/ (?:et|puis|aussi|plus) |, /);
  const E=[];
  segs.forEach(seg=>{
    const m=seg.match(/(^| )(\d+)( |$)/);const q=m?Math.min(50,+m[2]):1;
    const words=vocWords(seg);if(!words.length)return;
    const p=vocBest(items,words,x=>x.n);
    if(p)E.push({id:p.id,n:p.n,q,z:p.z,dlcJ:p.dlcJ});
    else if(wantEtq)E.push({id:null,n:vocRawName(raw,words),q,isNew:true});
  });
  if(E.length&&(wantEtq||E.every(x=>!x.isNew))){P.push({k:'etq',items:E});return P;}
  // tâches (« j'ai nettoyé la friteuse », « c'est fait, sortir les poubelles »)
  const lists=tasksOf();const mine=lists.filter(L=>tkAssign(L,TODAY_ISO).length);const pool=(mine.length?mine:lists);
  const words=vocWords(t).filter(w=>!/^(fini|termine|ok|bien|deja|tout)$/.test(w));
  let best=null,bs=0.4;
  pool.forEach(L=>L.items.forEach((it,i)=>{const s=vocScore(it.t,words);if(s>bs){bs=s;best={L,i};}}));
  if(best){P.push({k:'task',l:best.L.id,i:best.i});return P;}
  return P;
}

/* ---------- la note écrite ---------- */
function vocStepHTML(s,idx){
  const row=(i,txt,sub,warn)=>`<div class="voc-step${warn?' warn':''}"><span class="voc-si">${ic(i,'s')}</span><div><b>${txt}</b>${sub?`<small>${sub}</small>`:''}</div></div>`;
  if(s.k==='etq')return s.items.map(x=>{const j=x.isNew?dlcGuess(x.n,'froid').j:etqDays(x);const d=addDays(TODAY,j);
    return row('tag',`${x.q} ${T(x.q>1?'étiquettes':'étiquette')} · ${esc(x.n)}`,`DLC ${j} j (${JC[(d.getDay()+6)%7].toLowerCase()}. ${pad(d.getDate())}/${pad(d.getMonth()+1)})${x.isNew?' · nouveau produit, durée choisie par Léon':''}`);}).join('');
  if(s.k==='temp'){
    const eq=S.hyg.equip.find(e=>e.id===s.eq);
    if(!eq)return row('thermo',`${nf(s.val,1)} °C · quel appareil ?`,'',true)+`<div class="voc-chips">${(s.choices||[]).map(id=>{const e=S.hyg.equip.find(q=>q.id===id);return e?`<button class="btn sm" data-act="voc-eq" data-s="${idx}" data-id="${id}">${esc(e.nom)}</button>`:'';}).join('')}</div>`;
    const bad=hygBad(eq,s.val);
    return row('thermo',`${esc(eq.nom)} : ${nf(s.val,1)} °C`,bad?'Hors norme : Léon te demandera ce que tu as fait':'Dans la norme',bad);
  }
  if(s.k==='task'){const L=tasksOf().find(x=>x.id===s.l);const it=L&&L.items[s.i];if(!it)return '';const done=tkDoneOf(TODAY_ISO,L.id).items[s.i];
    return row('check',esc(it.t),done?'Déjà cochée':`${esc(L.n)} · cochée à ton nom`,!!done);}
  if(s.k==='lot')return row('camera',`Produit ouvert${s.n?' : '+esc(s.n):''}`,'Léon ouvre l’appareil photo pour la date');
  if(s.k==='badge'){const L={in:'Pointer ton arrivée',pause:'Commencer ta pause',back:'Reprendre après la pause',out:'Pointer ton départ'}[s.t];const ok=vocBadgeOk(s.t);
    return row('clock',`${L} · ${hhmm(nowMin())}`,ok===true?'':ok,ok!==true);}
  if(s.k==='go')return row('move',`Ouvrir : ${esc(s.v)}`,'');
  return '';
}
function vocBadgeOk(t){
  const ev=ensureEv(U.empId);const last=ev[ev.length-1];const st=!last||last.t==='out'?'off':last.t==='pause'?'pause':'on';
  if(t==='in'&&st!=='off')return st==='pause'?'Tu es en pause : dis « je reprends »':'Ton arrivée est déjà pointée';
  if(t==='pause'&&st!=='on')return st==='off'?'Pointe d’abord ton arrivée':'Tu es déjà en pause';
  if(t==='back'&&st!=='pause')return 'Tu n’es pas en pause';
  if(t==='out'&&st==='off')return 'Tu n’as pas pointé ton arrivée';
  return true;
}
const VOC_EX=['« 3 étiquettes steak haché »','« Chambre froide à 3 degrés »','« J’ai nettoyé la friteuse »','« J’ouvre une crème »','« Je prends ma pause »'];

/* ---------- l'écran ---------- */
const VOC={rec:null,on:false,txt:'',plan:null,lot:null};
const vocSR=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
function vocModal(state){
  const head=`<div class="mh"><div><h3>${ic('spark')} ${T('Dis Léon')}</h3></div><button class="icon-btn" data-act="voc-close" aria-label="${T('Fermer')}">${ic('x')}</button></div>`;
  const type=`<div class="voc-type"><input class="inp" id="voc-in" placeholder="${T('Ou écris-le ici')}" value="${state==='result'||state==='none'?esc(VOC.txt):''}" enterkeyhint="go"><button class="btn" data-act="voc-send" aria-label="OK">OK</button></div>`;
  let body='';
  if(state==='listen')body=`<button class="voc-mic on" data-act="voc-stop" aria-label="${T('J’ai fini')}">${ic('spark')}</button>
    <p class="voc-live" id="voc-live">${T('Je t’écoute…')}</p><button class="btn block" data-act="voc-stop">${T('J’ai fini')}</button>${type}`;
  else if(state==='nomic')body=`<p class="voc-live">${T('Le micro n’est pas disponible ici : écris ta demande.')}</p>${type}<p class="faint voc-ex">${T('Par exemple :')} ${VOC_EX.join(' · ')}</p>`;
  else if(state==='none')body=`<p class="voc-heard">« ${esc(VOC.txt)} »</p><p class="voc-live"><b>${T('Je n’ai pas compris.')}</b></p><p class="faint voc-ex">${T('Par exemple :')} ${VOC_EX.join(' · ')}</p>
    <button class="btn primary big block" data-act="voc-again">${ic('spark','s')} ${T('Recommencer')}</button>${type}`;
  else if(state==='result'){const ok=vocPlanOk();
    body=`<p class="voc-heard">« ${esc(VOC.txt)} »</p><p class="voc-h">${T('Léon a compris :')}</p><div class="voc-plan">${VOC.plan.map(vocStepHTML).join('')}</div>
    <div class="voc-acts"><button class="btn big" data-act="voc-again">${T('Recommencer')}</button><button class="btn primary big" data-act="voc-go" ${ok?'':'disabled'}>${ic('check','s')} ${T('Valider')}</button></div>`;}
  openModal(head+`<div class="voc">${body}</div>`,'narrow voc-modal');
}
function vocPlanOk(){return VOC.plan&&VOC.plan.length&&VOC.plan.every(s=>(s.k!=='temp'||s.eq)&&(s.k!=='badge'||vocBadgeOk(s.t)===true)&&(s.k!=='task'||!(tkDoneOf(TODAY_ISO,s.l).items||{})[s.i]));}
function vocStop(){try{VOC.rec&&VOC.rec.stop();}catch(e){}VOC.on=false;}
function vocListen(){
  const SR=vocSR();VOC.txt='';VOC.plan=null;
  if(!SR){vocModal('nomic');return;}
  vocModal('listen');
  let rec;try{rec=new SR();}catch(e){vocModal('nomic');return;}
  VOC.rec=rec;VOC.on=true;let fin='';
  rec.lang='fr-FR';rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
  rec.onresult=e=>{let s='';for(let i=0;i<e.results.length;i++){s+=e.results[i][0].transcript;}fin=s;const el=document.getElementById('voc-live');if(el)el.textContent=s;LAST_ACT=Date.now();};
  rec.onerror=e=>{VOC.on=false;if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){vocModal('nomic');}};
  rec.onend=()=>{VOC.on=false;if(!document.querySelector('.voc-modal'))return;if(fin.trim())vocUnderstand(fin);else if(document.getElementById('voc-live'))vocModal('nomic');};
  try{rec.start();}catch(e){vocModal('nomic');}
}
function vocUnderstand(txt){VOC.txt=txt.trim();VOC.plan=vocParse(VOC.txt);LAST_ACT=Date.now();vocModal(VOC.plan.length?'result':'none');}

/* ---------- faire ---------- */
function vocRun(){
  const plan=VOC.plan||[];const who=me().prenom||'';const notes=[];let labels=[],bad=[],lot=null;
  plan.forEach(s=>{
    if(s.k==='etq')s.items.forEach(x=>{let p=x;
      if(x.isNew){const ex=etqHome().find(h=>normH(h.n)===normH(x.n));if(ex)p={...ex,z:'froid'};else{const nn={id:uid('em'),n:x.n,dlcJ:null};S.etqMaison=[...etqHome(),nn];p={...nn,z:'froid'};}}
      const L=etqMake(p);for(let k=0;k<x.q;k++)labels.push(L);notes.push(`${x.q} × ${x.n}`);});
    if(s.k==='temp'){const eq=S.hyg.equip.find(e=>e.id===s.eq);if(!eq)return;const rec={id:uid('t'),eq:eq.id,date:TODAY_ISO,val:s.val,ts:nowMin(),who};S.hyg.temps=[...S.hyg.temps,rec];if(hygBad(eq,s.val))bad.push(rec.id);notes.push(`${eq.nom} ${nf(s.val,1)} °C`);}
    if(s.k==='task'){const L=tasksOf().find(x=>x.id===s.l);if(L){tkMark(L,s.i,true);notes.push(L.items[s.i].t);}}
    if(s.k==='lot')lot=s;
  });
  const badge=plan.find(s=>s.k==='badge');const go=plan.find(s=>s.k==='go');
  if(labels.length)etqRecord(labels);
  save();closeModal();
  if(badge){borneDo(U.empId,badge.t);return;}
  if(go){vocGo(go.v);return;}
  render();
  if(labels.length)etqPrint(labels);
  if(bad.length)setTimeout(()=>acModal(bad),labels.length?600:50);
  else if(lot){VOC.lot=lot.n||'';ACT['kiosk-lot-new']();vocFillLot();}
  if(notes.length)toast(`${T('C’est fait')} · ${esc(notes.join(' · '))}`,'check');
}
function vocFillLot(){let n=0;const iv=setInterval(()=>{const el=document.getElementById('kl-n');if(el&&!el.value&&VOC.lot){el.value=VOC.lot;VOC.lot=null;clearInterval(iv);}if(++n>240)clearInterval(iv);},250);}
function vocGo(v){
  const map={planning:['badge-goto','planning'],inventaire:['badge-goto','inventaire'],reception:['badge-goto','reception'],hygiene:['badge-goto','hygiene']};
  const H={taches:'taches','produits ouverts':'ouverts',etiquettes:'etiquetage',haccp:'haccp'};
  if(H[v]){UI.kiosk={...(UI.kiosk||{}),view:'hygiene',hyg:H[v]};U.screen='kiosk';render();return;}
  if(v==='accueil'){ACT['kiosk-home']();return;}
  const m=map[v];if(m&&ACT[m[0]])ACT[m[0]]({dataset:{v:m[1]}});
}
Object.assign(ACT,{
  'voc-open'(){LAST_ACT=Date.now();vocListen();},
  'voc-stop'(){vocStop();},
  'voc-again'(){vocStop();vocListen();},
  'voc-close'(){vocStop();closeModal();},
  'voc-send'(){const v=(($('#voc-in')||{}).value||'').trim();if(!v)return;vocStop();vocUnderstand(v);},
  'voc-eq'(t){const s=VOC.plan&&VOC.plan[+t.dataset.s];if(!s)return;s.eq=t.dataset.id;s.choices=null;vocModal('result');},
  'voc-go'(){if(!vocPlanOk())return;vocRun();},
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='voc-in'){e.preventDefault();ACT['voc-send']();}},true);

/* ---------- le bouton, sur la tablette, une fois la personne connectée ---------- */
function vocShow(){try{return !!(U&&U.empId&&(U.screen==='kiosk'||(U.screen==='badge'&&!U.badgeMsg))&&S);}catch(e){return false;}}
{const f=render;render=function(){const o=f.apply(this,arguments);
  try{let b=document.getElementById('voc-fab');
    if(vocShow()){if(!b){b=document.createElement('button');b.id='voc-fab';b.className='voc-fab';b.setAttribute('data-act','voc-open');document.body.appendChild(b);}
      b.innerHTML=`${ic('spark')}<span>${T('Dis Léon')}</span>`;}
    else if(b)b.remove();
  }catch(e){}return o;};}
