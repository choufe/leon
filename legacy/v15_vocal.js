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
const VOC_VIDE=new Set('je j ai a on le la les l de du des d un une mon ma mes ton ta pour s il te plait stp svp moi me m fais fait faire leon dis ok alors euh bon et avec sur au aux en y peux tu veux voudrais met mets mettre sort sors sortir donne donner nous vous c est ca cela the please se suis sont ete bien tout deja c'.split(' '));
function vocNorm(s){
  // on protège virgules et signes moins avant de tout simplifier
  let t=String(s||'').replace(/(\d)[.,](\d)/g,'$1p$2').replace(/(^|\s)[-−–](\d)/g,'$1moins $2');
  t=dlcNorm(t).replace(/(\d)p(\d)/g,'$1.$2');
  t=t.split(' ').map(w=>VOC_NB[w]!=null?String(VOC_NB[w]):w).join(' ');
  t=t.replace(/(^| )10 ([789])(?= |$)/g,'$11$2').replace(/(^| )20 (et )?1(?= |$)/g,'$121').replace(/(^| )20 ([2-9])(?= |$)/g,'$12$2').replace(/(^| )x ?(\d+)(?= |$)/g,'$1$2').replace(/(^| )(\d+) ?(x|fois)(?= |$)/g,'$1$2');
  t=t.replace(/(\d+) (virgule|point) (\d+)/g,'$1.$3').replace(/(^| )moins (\d)/g,'$1-$2').replace(/ (degre|degres|°c|°)( |$)/g,' degres$2');
  return t.replace(/\s+/g,' ').trim();
}
const vocWords=t=>t.split(' ').filter(w=>w&&!VOC_VIDE.has(w)&&!/^-?\d/.test(w));
// quelques mots que l'équipe emploie pour le même produit
const VOC_SYN=[['steak','boeuf','viande'],['creme','chantilly'],['jambon','jambonneau'],['fromage','cheddar','emmental'],['patate','pomme'],['oignon','oignons'],['frigo','refrigerateur','frigidaire'],['congel','congelateur','surgele'],['nettoyer','nettoye','nettoyage','laver','lave','propre','clean'],['sol','sols','serpilliere','serpillere','balai']];
const vocSame=(a,b)=>vocSame0(a,b)||VOC_SYN.some(g=>g.some(x=>vocSame0(x,a))&&g.some(x=>vocSame0(x,b)));
const vocSame0=(a,b)=>{if(a===b)return true;if(a.length>=4&&b.length>=4&&(a.startsWith(b)||b.startsWith(a)))return true;let k=0;while(k<a.length&&k<b.length&&a[k]===b[k])k++;return k>=5&&k>=Math.min(a.length,b.length)-2;};
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
  return extra===0?Math.max(base,0.55+0.1*base):base;
}
const vocBest=(list,words,nameOf,min=0.38)=>{let b=null,s=min;list.forEach(x=>{const v=vocScore(nameOf(x),words);if(v>s){s=v;b=x;}});return b;};
// le produit qui colle, sauf si on a dit des mots en plus qui n'y sont pas (« sauce tartare » ≠ « Rumsteck (tartare) »)
function vocPick(items,words){const p=vocBest(items,words,x=>x.n);if(p&&words.some(w=>!vocWords(dlcNorm(p.n)).some(x=>vocSame(w,x)))&&vocScore(p.n,words)<0.6)return null;return p;}
const vocCap=s=>s.charAt(0).toUpperCase()+s.slice(1);

function vocEtqItems(){const L=[];etqGroups(true).forEach(g=>g.items.forEach(p=>L.push(p)));return L;}

/* ---------- 15.13 : on anticipe toutes les façons de parler ---------- */
// mots que l'iPad entend souvent de travers → ce qu'on voulait dire
const VOC_FIX=[
  [/(^| )(et|e|l|les|des) tiquettes?( |$)/g,'$1etiquette$3'],
  [/(^| )(ethiquettes?|etiquetes?|ettiquettes?|equiquettes?|etiquet|tiquettes?|etiquettes)( |$)/g,'$1etiquette$3'],
  [/(^| )de etiquette/g,'$12 etiquette'],[/(^| )des etiquette/g,'$11 etiquette'],
  [/(^| )(steack|stek|steake|stake|stack|steaks)( |$)/g,'$1steak$3'],
  [/(steak|boeuf|viande) (achetes?|acheter|achat|hachees?|haches|hacher|a chez|ache)( |$)/g,'$1 hache$3'],
  [/(^| )de gres?( |$)/g,'$1degres$2'],[/(^| )degre( |$)/g,'$1degres$2'],
  [/(^| )(frigot|frigaud|frigos|refrigerateur|frigidaire|frigidaires|frigeau|frigaux)( |$)/g,'$1frigo$3'],
  [/(^| )(congelo|congelos|congelateurs|congel|congele)( |$)/g,'$1congelateur$3'],
  [/(^| )(troie|troies)( |$)/g,'$13$3'],[/(^| )quatres( |$)/g,'$14$2'],[/(^| )(sinq|cinque)( |$)/g,'$15$3'],[/(^| )dizaine( |$)/g,'$110$2'],
  [/(^| )(fritteuse|friteuze|frite use|frit euse)( |$)/g,'$1friteuse$3'],
  [/(^| )(enfaite|enfait|en faite|en fete)( |$)/g,'$1en fait$3'],
  [/(^| )(poubel|poubelles)( |$)/g,'$1poubelle$3'],
];
// hésitations et débuts de phrase qui ne veulent rien dire pour Léon
const VOC_BLA=/(^| )(euh+|heu+|hum+|hmm+|bah|ben|bon|alors|donc|du coup|voila|ok|okay|ouais|oui|bonjour|salut|coucou|merci|hey|eh|he|dis|leon|s il te plait|s il vous plait|s te plait|stp|svp|steuplait|tu peux|tu pourrais|pourrais tu|peux tu|vous pouvez|est ce que|je voudrais|j aimerais|je veux|il me faut|il me faudrait|il faudrait|il faut|faudrait|j ai besoin d|j ai besoin de|c est pour|vite fait|rapidement|stp leon)(?= |$)/g;
function vocClean(t){
  let x=' '+t+' ';
  VOC_FIX.forEach(([a,b])=>{x=x.replace(a,b);});
  for(let k=0;k<3;k++)x=x.replace(VOC_BLA,' ');
  return x.replace(/\s+/g,' ').trim();
}
// « 3 étiquettes steak haché… non 4 » : on garde la correction
const VOC_OOPS=/ (?:non en fait|non|non non|en fait|pardon|enfin|plutot|ou plutot|je veux dire|je voulais dire|ah non|oups|je me suis trompe|correction|attends) /;
// ce qu'on dit en fin de phrase quand on n'a pas fini (« moules marinières… non… »)
const VOC_PENDING=/( (non|attends|enfin|en fait|enfaite|enfait|pardon|plutot|euh+|heu+|et|ou|puis|avec|mais|alors|donc|du coup))+$/;
function vocParse(raw){
  const t0=vocNorm(raw).replace(VOC_PENDING,'').trim();if(!t0)return [];
  const parts=(' '+t0+' ').split(VOC_OOPS).map(x=>x.trim()).filter(Boolean);
  if(parts.length>1){
    let tail=vocClean(parts[parts.length-1]);for(let k=0;k<3;k++)tail=tail.replace(/^(non|pardon|enfin|plutot|attends|oups|en fait)( |$)/,'').trim();const head=parts.slice(0,-1).join(' ');
    const n=tail.match(/^(-?\d+(\.\d+)?)( degres)?$/);
    if(n){const h=/-?\d/.test(head)?head.replace(/-?\d+(\.\d+)?(?!.*-?\d)/,n[1]):n[1]+' '+head;return vocParse1(vocClean(h),raw);}
    const pt=vocParse1(tail,raw);if(pt.length)return pt;
    return vocParse1(vocClean(head),raw);
  }
  return vocParse1(vocClean(t0),raw);
}
function vocParse1(t,raw){
  const P=[];if(!t)return P;
  const has=rx=>rx.test(t);
  // pointage (le retour de pause avant la pause : « fin de pause » contient « pause »)
  if(!has(/(etiquette|degres)/)){
    const B=[
      ['back',/(fin de (la )?pause|retour de (la )?pause|je reprends|je reviens|je suis revenue?|je suis de retour|c est reparti|reprise du service|je recommence)/],
      ['pause',/(^| )(pause|je vais fumer|pause (cigarette|clope|cafe|dej|dejeuner|repas)|je fais une pause|je m arrete|je vais manger|on va manger|je mange|je vais dejeuner|l heure de (ma|la) pause)( |$)/],
      ['out',/(je pars|je m en vais|fin de (service|journee|poste)|je (termine|finis) (ma journee|mon service|ma soiree|ma journee de travail)|j ai (fini|termine) (ma journee|mon service)|c est fini pour moi|je rentre( chez moi)?|je debauche|je quitte|au revoir|bonne soiree|a demain|mon depart|(pointe|pointer|badge|badger) (mon |le )?depart|(^| )depart( |$))/],
      ['in',/(je suis la|j arrive|je viens d arriver|je suis arrivee?|debut de (service|journee|poste)|je commence|je prends (mon|le) (service|poste)|prise de (service|poste)|(pointe|pointer|badge|badger) (moi|mon arrivee|l arrivee)|mon arrivee|(^| )(arrivee|pointe|pointer|badge|badger)( |$))/],
    ];
    const b=B.find(([,rx])=>has(rx));
    if(b){P.push({k:'badge',t:b[0]});return P;}
  }
  // ouvrir un écran
  const go=t.match(/(ouvre|ouvrir|va|vas|aller|montre|affiche|voir|retour|retourne|on fait|faire|commence|commencer|lance|lancer)( (sur|dans|le|la|les|mon|ma|moi|l|des|d|au|a|vers|a l))* (planning|inventaire|reception|hygiene|accueil|taches|produits ouverts|etiquettes?|haccp)( |$)/);
  if(go){P.push({k:'go',v:go[4]==='etiquette'?'etiquettes':go[4]});return P;}
  // produit ouvert
  const op=t.match(/(j ouvre|j ai ouvert|on ouvre|on a ouvert|je viens d ouvrir|on vient d ouvrir|vient d ouvrir|j entame|j ai entame|on entame|on a entame|je viens d entamer|on vient d entamer|vient d entamer|ouverture d(e|u|es)?|nouveau produit ouvert|produit ouvert|ouvert)( (?:\d+|un|une|le|la|les|du|de|des|d|nouveau|nouvelle|nouvel|paquet|pot|bouteille|boite|sachet|bac|seau|bidon|brique|barquette|carton|tube|bocal|pack|poche)(?= |$))* ?(.*)$/);
  if(op&&!has(/etiquette/)&&!has(/(ouvre|ouvrir) (le|la|les|mon|ma)? ?(planning|inventaire|reception|hygiene|accueil|taches|haccp)/)){const rest=op[op.length-1]||'';const n=vocWords(rest).join(' ');P.push({k:'lot',n:n?vocRawName(raw,vocWords(rest)):''});return P;}
  // températures
  const eqs=(S.hyg&&S.hyg.equip)||[];
  if(has(/(temperature|degres|frigo|chambre froide|congel|vitrine|cellule|saladette|frais|froid)/)&&has(/-?\d/)){
    t.split(/ (?:et|puis|aussi) |, /).flatMap(x=>(x.match(/(frigo|congelateur|chambre froide|vitrine|cellule|saladette)/g)||[]).length>1?x.split(/ (?=(?:frigo|congelateur|chambre froide|vitrine|cellule|saladette) )/):[x]).forEach(seg=>{
      const nums=(seg.match(/-?\d+(\.\d+)?/g)||[]).map(Number);if(!nums.length)return;
      const words=vocWords(seg).filter(w=>!/^(temperature|degres|est|il|fait|releve|relever|note|noter|dans|a)$/.test(w));
      const em=seg.match(/(frigo|congelateur|chambre froide|vitrine|cellule|saladette|armoire|bar)( numero| n| no)? (-?\d+)/);const said=em?+em[3]:null;
      // un appareil n'est choisi tout seul que si son nom est entièrement reconnu (et son numéro, s'il en a un)
      let cands=eqs.map(e=>{const dg=(dlcNorm(e.nom).match(/\d+/)||[])[0];const s=vocScore(e.nom,words);const full=s>=0.85&&(!dg||(said!=null&&+dg===said&&nums.length>=2));return {e,s,dg,full};}).filter(x=>x.s>0).sort((a,b)=>(b.full-a.full)||(b.s-a.s));
      const fulls=cands.filter(x=>x.full);
      let eq=fulls.length===1?fulls[0].e:(eqs.length===1?eqs[0]:null);
      const dg=eq?((dlcNorm(eq.nom).match(/\d+/)||[])[0]):null;
      // la température = l'autre nombre (pas celui collé à « frigo »)
      const skip=said!=null&&nums.length>1?nums.indexOf(said):-1;const vals=nums.filter((n,i)=>i!==skip);
      const val=vals.length?vals[vals.length-1]:nums[nums.length-1];
      P.push({k:'temp',eq:eq?eq.id:null,val,choices:eq?null:(cands.length?cands.map(x=>x.e.id):eqs.map(e=>e.id))});
    });
    if(P.length)return P;
  }
  // une question n'est jamais une action ; pour la DLC d'un produit, Léon répond
  if(has(/^(c est quoi|c est combien|quelle?s?|combien|quand|est ce|pourquoi|comment|on garde|ca se garde|elle est de combien)( |$)/)||has(/ (combien de (temps|jours)|ca se garde|on le garde|on la garde)( |$)/)){
    if(has(/(dlc|garde|se conserve|jours|perime|peremption)/)){const words=vocWords(t).filter(w=>!/^(quoi|quel|quelle|quels|quelles|combien|quand|temps|jours|jour|garde|garder|conserve|dlc|perime|peremption|pourquoi|comment|est)$/.test(w));
      const p=words.length?vocPick(vocEtqItems(),words):null;
      if(p){P.push({k:'info',n:p.n,j:etqDays(p)});return P;}
      if(words.length){const g=dlcGuess(vocRawName(raw,words),'froid');P.push({k:'info',n:vocRawName(raw,words),j:g.j,why:g.why});return P;}}
    return P;
  }
  // étiquettes (mot « étiquette » / « imprime », ou « 3 steak haché » quand le produit est connu)
  const items=vocEtqItems();
  const wantEtq=has(/(etiquette|imprim)/)||has(/(^| )(une|\d+) dlc( |$)/);
  const segs=t.replace(/(etiquettes?|imprimer?|imprime moi|dlc)/g,' ').split(/ (?:et|puis|aussi|plus) |, /);
  const E=[];
  segs.flatMap(x=>x.split(/ (?=\d+( |$))/)).filter(x=>x&&!/^\s*$/.test(x)).forEach(seg=>{
    const m=seg.match(/(^| )(\d+)( |$)/);const q=m?Math.min(50,+m[2]):1;
    const words=vocWords(seg);if(!words.length){if(m&&E.length&&E[E.length-1].qDef){E[E.length-1].q=q;E[E.length-1].qDef=false;}return;}
    // si on a dit des mots en plus qui ne sont pas dans le nom (« sauce tartare » ≠ « Rumsteck (tartare) »), il faut une vraie ressemblance
    const p=vocPick(items,words);
    if(p)E.push({id:p.id,n:p.n,q,z:p.z,dlcJ:p.dlcJ,qDef:!m});
    else if(wantEtq)E.push({id:null,n:vocRawName(raw,words),q,isNew:true,qDef:!m});
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
  if(s.k==='info')return row('tag',`${esc(s.n)} : DLC ${s.j} jour${s.j>1?'s':''} après préparation`,s.why?`Pas encore dans tes produits · Léon : ${esc(s.why)}`:'Durée réglée pour ce produit (Hygiène › Étiquettes)');
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
    <p class="voc-live" id="voc-live">${T('Je t’écoute…')}</p><p class="faint voc-ex" style="text-align:center">Prends ton temps, tu peux te corriger (« non, 4 »). Appuie sur « J’ai fini » quand tu as terminé.</p><button class="btn block" data-act="voc-stop">${T('J’ai fini')}</button>${type}`;
  else if(state==='nomic')body=`<p class="voc-live">${T('Le micro n’est pas disponible ici : écris ta demande.')}</p>${VOC.blocked?`<p class="faint voc-ex">Le micro est bloqué pour ce site. Sur l’iPad : Réglages › Safari › Microphone › Autoriser (ou « Demander »). Sur ordinateur : clique sur le cadenas à gauche de l’adresse › Micro › Autoriser.</p>`:''}${type}<p class="faint voc-ex">${T('Par exemple :')} ${VOC_EX.join(' · ')}</p>`;
  else if(state==='none')body=`<p class="voc-heard">« ${esc(VOC.txt)} »</p><p class="voc-live"><b>${T('Je n’ai pas compris.')}</b></p><p class="faint voc-ex">${T('Par exemple :')} ${VOC_EX.join(' · ')}</p>
    <button class="btn primary big block" data-act="voc-again">${ic('spark','s')} ${T('Recommencer')}</button>${type}`;
  else if(state==='result'){const ok=vocPlanOk();
    body=`<p class="voc-heard">« ${esc(VOC.txt)} »</p><p class="voc-h">${T('Léon a compris :')}</p><div class="voc-plan">${VOC.plan.map(vocStepHTML).join('')}</div>
    <div class="voc-acts"><button class="btn big" data-act="voc-again">${T('Recommencer')}</button>${VOC.plan.every(x=>x.k==='info')?`<button class="btn primary big" data-act="voc-close">OK</button>`:`<button class="btn primary big" data-act="voc-go" ${ok?'':'disabled'}>${ic('check','s')} ${T('Valider')}</button>`}</div>`;}
  openModal(head+`<div class="voc">${body}</div>`,'narrow voc-modal');
}
function vocPlanOk(){return VOC.plan&&VOC.plan.length&&VOC.plan.every(s=>(s.k!=='temp'||s.eq)&&(s.k!=='badge'||vocBadgeOk(s.t)===true)&&(s.k!=='task'||!(tkDoneOf(TODAY_ISO,s.l).items||{})[s.i]));}
function vocStop(){try{VOC.rec&&VOC.rec.stop();}catch(e){}VOC.on=false;}
function vocListen(prefix=''){
  const SR=vocSR();if(!prefix){VOC.txt='';VOC.plan=null;}
  if(!SR){vocModal('nomic');return;}
  if(!prefix)vocModal('listen');
  let rec;try{rec=new SR();}catch(e){vocModal('nomic');return;}
  VOC.rec=rec;VOC.on=true;let fin=prefix,alts=[];let timer=null;
  // on laisse le temps de parler : 7 s pour commencer, puis 2,5 s de silence ; plus si la phrase n'est pas finie
  const arm=ms=>{clearTimeout(timer);timer=setTimeout(()=>{try{rec.stop();}catch(_){}},ms);};
  const wait=txt=>VOC_PENDING.test(' '+vocNorm(txt))||/(^| )(etiquettes?|frigo|congelateur|de|du|des|la|le|les|une?|a)$/.test(vocNorm(txt))?4500:2500;
  rec.lang='fr-FR';rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=4;
  rec.onresult=e=>{let s='';for(let i=0;i<e.results.length;i++){s+=e.results[i][0].transcript+' ';}s=((prefix?prefix+' ':'')+s).replace(/\s+/g,' ').trim();fin=s;
    try{const last=e.results[e.results.length-1];const pre=(prefix?prefix+' ':'')+[...e.results].slice(0,-1).map(r=>r[0].transcript).join(' ');alts=[...last].map(a=>(pre+' '+a.transcript).replace(/\s+/g,' ').trim());}catch(_){alts=[s];}
    const el=document.getElementById('voc-live');if(el)el.textContent=s;LAST_ACT=Date.now();arm(wait(s));};
  rec.onerror=e=>{VOC.on=false;clearTimeout(timer);if(e.error==='not-allowed'||e.error==='service-not-allowed'){VOC.blocked=true;vocModal('nomic');}else if(e.error==='audio-capture'){vocModal('nomic');}};
  rec.onend=()=>{VOC.on=false;clearTimeout(timer);if(!document.querySelector('.voc-modal')||!document.getElementById('voc-live'))return;
    // l'iPad a coupé alors qu'on n'avait pas fini (« … non ») : on réécoute la suite
    if(fin.trim()&&VOC_PENDING.test(' '+vocNorm(fin))&&!VOC.stopAsked&&(VOC.again=(VOC.again||0)+1)<=2){vocListen(fin.trim());return;}
    VOC.again=0;VOC.stopAsked=false;
    if(fin.trim()){const ok=alts.find(a=>a&&vocParse(a).length);vocUnderstand(ok||fin);}else vocModal('nomic');};
  arm(prefix?4500:7000);
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
  'voc-stop'(){VOC.stopAsked=true;vocStop();},
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
