/* =========================================================
   V12 · PAIE — les variables du mois, prêtes pour le comptable
   Convention HCR (IDCC 1979). Ce que Léon calcule (et explique en survolant chaque colonne) :
   - heures PAYÉES : celles retenues dans la badgeuse (sinon le planning pour les jours sans badge) ;
   - heures sup par semaine (lundi → dimanche, rattachées au mois où la semaine se termine) :
     de la 36e à la 39e heure +10 %, de la 40e à la 43e +20 %, à partir de la 44e +50 % ;
   - temps partiel : heures complémentaires +10 % jusqu'à 1/10 du contrat, +25 % au-delà (plafond 1/3) ;
   - heures de nuit : entre 22 h et 7 h ;
   - jours fériés travaillés (et le 1er mai à part : payé double) ;
   - absences en jours ; repas = avantage en nature (1 minimum garanti par repas : 4,35 € depuis le 1er juin 2026).
   Léon prépare les variables ; la fiche de paie, c'est le comptable ou son logiciel.
   ========================================================= */
const PA_MG=[['2026-06-01',4.35],['2026-01-01',4.25],['2025-01-01',4.22]];
function paMG(iso){for(const [d,v] of PA_MG)if(iso>=d)return v;return 4.22;}
const PA_TIPS={
  sal:'Le salarié. Une ligne par personne qui a travaillé ou été absente ce mois-ci.',
  ctr:'Heures prévues au contrat, ramenées au mois (contrat hebdo × 52 ÷ 12). Ex. 35 h → 151,67 h.',
  h:'Heures payées : celles retenues dans la badgeuse (le « payé »). Pour un jour sans badge, Léon prend le planning.',
  ec:'Différence entre les heures payées et le contrat du mois. En plus : heures sup ou complémentaires. En moins : absences ou semaines plus légères.',
  h10:'Heures sup majorées de 10 % : de la 36e à la 39e heure de chaque semaine (convention HCR).',
  h20:'Heures sup majorées de 20 % : de la 40e à la 43e heure de chaque semaine.',
  h50:'Heures sup majorées de 50 % : à partir de la 44e heure de la semaine.',
  c10:'Temps partiel : heures en plus du contrat, majorées de 10 % jusqu’à 1/10 du contrat de la semaine.',
  c25:'Temps partiel : heures en plus au-delà de 1/10 du contrat, majorées de 25 % (jamais plus d’1/3 du contrat).',
  nuit:'Heures travaillées entre 22 h et 7 h. En HCR, elles donnent droit à du repos compensateur ; une majoration en argent n’est pas obligatoire, ça dépend de ton accord.',
  fer:'Heures travaillées un jour férié. En HCR, après 1 an d’ancienneté, le férié travaillé est compensé (jour de repos ou paiement en plus).',
  mai:'Heures travaillées le 1er mai : payées double, c’est la loi.',
  abs:'Absences du mois en jours : CP = congés payés, M = maladie, AI = absence injustifiée, etc.',
  rep:'Repas pris pendant le service (1 par service couvert). En HCR, c’est un avantage en nature : 1 minimum garanti par repas (4,35 € depuis le 1er juin 2026).',
};
const paTh=(k,l,cls='')=>`<th class="${cls}" data-tip="${esc(PA_TIPS[k])}" tabindex="0">${l}</th>`;

function paieDataV12(mo){
  const first=monthOf(mo);const y=first.getFullYear(),m=first.getMonth();const n=new Date(y,m+1,0).getDate();
  const dates=[...Array(n)].map((_,i)=>new Date(y,m,i+1));
  const jour=(e,dt)=>{const iso=isoD(dt);const {w,d}=wdOf(dt);const sh=empShifts(e.id,w,d);
    if(dt<=TODAY&&evsOn(e.id,iso).length&&typeof pjLigne==='function'){const L=pjLigne(e,iso);
      return {m:L.paye,src:'pj',segs:(L.pieces||[]).map(q=>({s:hhmm(q.s),e:hhmm(q.e),p:q.p})),abs:!!L.abs,valid:!!pjJour(iso)};}
    return {m:sum(sh,durMin),src:dt<TODAY?'pl':'fut',segs:sh,abs:false,valid:false};};
  let nonValides=new Set();
  const rows=EMP.map(e=>{
    const R={e,min:0,night:0,fer:0,mai:0,meals:0,mealsEur:0,abs:{},h10:0,h20:0,h50:0,c10:0,c25:0,fut:false,pl:0};
    dates.forEach(dt=>{
      const {w,d}=wdOf(dt);const iso=isoD(dt);const ab=absOf(e.id,w,d);
      if(ab&&ab.type!=='repos'&&ab.type!=='indispo')R.abs[ab.type]=(R.abs[ab.type]||0)+1;
      const x=jour(e,dt);if(x.src==='fut'&&x.m)R.fut=true;if(x.src==='pl'&&x.m)R.pl++;
      if(x.abs)R.abs.absbadge=(R.abs.absbadge||0)+1;
      if(x.src==='pj'&&!x.valid&&dt<TODAY)nonValides.add(iso);
      R.min+=x.m;
      if(x.m){R.night+=sum(x.segs,nightMin);if(ferieOf(iso)){if(iso.slice(5)==='05-01')R.mai+=x.m;else R.fer+=x.m;}
        const ml=mealsOfDay(x.segs);R.meals+=ml;R.mealsEur+=ml*paMG(iso);}
    });
    const firstSun=addDays(first,6-((first.getDay()+6)%7));
    for(let k=0;k<6;k++){
      const su=addDays(firstSun,7*k);if(su.getMonth()!==m||su.getFullYear()!==y)break;
      let wm=0;for(let j=6;j>=0;j--)wm+=jour(e,addDays(su,-j)).m;
      if(e.contrat>=35){const b=hsBrackets(wm);R.h10+=b.h10;R.h20+=b.h20;R.h50+=b.h50;}
      else{const extra=Math.max(0,wm/60-e.contrat);const t1=e.contrat/10;R.c10+=Math.min(extra,t1);R.c25+=Math.max(0,extra-t1);}
    }
    R.ctr=e.contrat*52/12;
    return R;
  }).filter(R=>R.min||Object.keys(R.abs).length);
  return {first,rows,nonValides:[...nonValides].sort()};
}
const PA_ABS={cp:'CP',maladie:'M',absinj:'AI',formation:'F',recup:'Récup',evt:'Évén.',indispo:'Indispo',absbadge:'Absent'};
const paAbsTxt=R=>Object.keys(R.abs).map(k=>`${R.abs[k]} ${PA_ABS[k]||ABS_LETTER[k]||k}`).join(' · ');
const paH=v=>v?nf(v,2).replace(/,00$/,''):'—';
function paPhrase(R){
  const bits=[`${nf(R.min/60,2)} h payées (contrat ${nf(R.ctr,2)} h)`];
  const hs=[[R.h10,'+10 %'],[R.h20,'+20 %'],[R.h50,'+50 %']].filter(x=>x[0]>0.004).map(x=>`${nf(x[0],2)} h ${x[1]}`);
  if(hs.length)bits.push('heures sup : '+hs.join(', '));
  const hc=[[R.c10,'+10 %'],[R.c25,'+25 %']].filter(x=>x[0]>0.004).map(x=>`${nf(x[0],2)} h ${x[1]}`);
  if(hc.length)bits.push('heures complémentaires : '+hc.join(', '));
  if(R.night>0)bits.push(`${nf(R.night/60,2)} h de nuit`);
  if(R.fer>0)bits.push(`${nf(R.fer/60,2)} h un jour férié`);
  if(R.mai>0)bits.push(`${nf(R.mai/60,2)} h le 1er mai (payées double)`);
  const a=paAbsTxt(R);if(a)bits.push('absences : '+a);
  if(R.meals)bits.push(`${R.meals} repas (${nf(R.mealsEur,2)} € d’avantage en nature)`);
  return `${R.e.prenom} ${R.e.nom||''} : `+bits.join(' ; ')+'.';
}

function viewPaieV12(){
  if(!CAN().salaries)return `<div class="ph"><div><h1>Paie</h1></div></div><div class="panel"><div class="empty"><p>Réservé à la direction.</p></div></div>`;
  const mo=UI.paie.mo;const {first,rows,nonValides}=paieDataV12(mo);const mk=monthKey(first);const val=(S.paieVal||{})[mk];
  const cur=mo===0;const ml=MOIS[first.getMonth()]+' '+first.getFullYear();const ML=ml.charAt(0).toUpperCase()+ml.slice(1);
  const tot=k=>sum(rows,R=>R[k]);const anyTp=rows.some(R=>R.e.contrat<35);
  const td=(v,tip)=>`<td class="tnum"${tip?` data-tip="${esc(tip)}"`:''}>${v}</td>`;
  /* colonnes : celles toujours là, et celles qu'on n'affiche que si le mois en a besoin (le fichier comptable garde tout) */
  const has=k=>rows.some(R=>R[k]>0.004);
  const C=[
    {k:'sal',l:'Salarié',c:R=>`<td><div class="name-cell">${avatar(R.e,'s')}<div><b>${esc(R.e.prenom)} ${esc(R.e.nom||'')}</b><small class="faint">${R.e.contrat} h / semaine</small></div></div></td>`,f:()=>'<td>Total</td>'},
    {k:'ctr',l:'Contrat<small>h / mois</small>',c:R=>td(nf(R.ctr,2)),f:()=>td(nf(tot('ctr'),2))},
    {k:'h',l:'Heures payées',c:R=>`<td class="tnum pa-h" data-tip="${esc(R.pl?`Dont ${plur(R.pl,'jour')} sans badge : heures du planning.`:'Toutes les heures viennent de la badgeuse (payé).')}"><b>${nf(R.min/60,2)}</b></td>`,f:()=>`<td class="tnum"><b>${nf(tot('min')/60,2)}</b></td>`},
    {k:'ec',l:'Écart',c:R=>{const ec=R.min/60-R.ctr;return `<td class="tnum ${ec>0.5?'pa-up':ec<-0.5?'pa-down':''}">${ec>0?'+':''}${nf(ec,2)}</td>`;},f:()=>'<td></td>'},
    {k:'h10',l:'HS +10 %',c:R=>td(paH(R.h10),R.e.contrat>35&&R.h10?`Dont ${nf((R.e.contrat-35)*52/12,2)} h prévues au contrat de ${R.e.contrat} h (heures sup « structurelles »).`:''),f:()=>td(paH(tot('h10')))},
    {k:'h20',l:'HS +20 %',c:R=>td(paH(R.h20)),f:()=>td(paH(tot('h20'))),opt:'h20'},
    {k:'h50',l:'HS +50 %',c:R=>td(paH(R.h50)),f:()=>td(paH(tot('h50'))),opt:'h50'},
    {k:'c10',l:'Compl. +10 %',c:R=>td(R.e.contrat<35?paH(R.c10):''),f:()=>td(paH(tot('c10'))),opt:'c10'},
    {k:'c25',l:'Compl. +25 %',c:R=>td(R.e.contrat<35?paH(R.c25):''),f:()=>td(paH(tot('c25'))),opt:'c25'},
    {k:'nuit',l:'Nuit<small>22 h – 7 h</small>',c:R=>td(paH(R.night/60)),f:()=>td(paH(tot('night')/60))},
    {k:'fer',l:'Férié',c:R=>td(paH(R.fer/60)),f:()=>td(paH(tot('fer')/60)),opt:'fer'},
    {k:'mai',l:'1er mai',c:R=>td(paH(R.mai/60)),f:()=>td(paH(tot('mai')/60)),opt:'mai'},
    {k:'abs',l:'Absences<small>jours</small>',c:R=>`<td class="pa-abs">${paAbsTxt(R)||'—'}</td>`,f:()=>'<td></td>'},
    {k:'rep',l:'Repas',c:R=>td(R.meals||'—',R.meals?`${R.meals} repas × minimum garanti = ${nf(R.mealsEur,2)} € d’avantage en nature`:''),f:()=>td(tot('meals')||'—')},
  ].filter(c=>!c.opt||has(c.opt));
  const body=rows.map(R=>`<tr>${C.map(c=>c.c(R)).join('')}</tr>`).join('');
  const foot=`<tr>${C.map(c=>c.f()).join('')}</tr>`;
  const head=`<tr>${C.map(c=>paTh(c.k,c.l)).join('')}</tr>`;
  const alerte=nonValides.length?`<div class="pub-al warn">${ic('alert','s')}<div><b>${plur(nonValides.length,'journée de badgeuse pas encore validée','journées de badgeuse pas encore validées')}</b><p>${nonValides.slice(0,6).map(i=>shortDate(pdate(i))).join(', ')}${nonValides.length>6?'…':'.'} Valide-les avant d’envoyer au comptable.</p></div><div class="pub-acts"><button class="btn sm" data-act="pa-badgeuse" data-iso="${nonValides[0]}">Ouvrir la badgeuse</button></div></div>`:'';
  return `<div class="ph"><div><h1>Paie · ${esc(ML)}</h1><p class="sub">Les variables du mois pour ton comptable. Passe la souris sur une colonne pour savoir ce que c’est.</p></div>
    <div class="acts">${val?`<span class="pill ok"><span class="dot"></span>Validé par ${esc(val.by)}</span>`:`<button class="btn" data-act="paie-val" ${cur?'disabled title="Le mois n’est pas fini"':''}>${ic('check','s')} Valider le mois</button>`}<button class="btn primary" data-act="pa-csv">${ic('download','s')} Fichier pour le comptable</button></div></div>
    <div class="pl-bar"><div class="wk-nav"><button class="icon-btn" data-act="paie-m" data-dir="-1" aria-label="Mois précédent">${ic('chevL')}</button><span class="lbl2">${esc(ML)}</span><button class="icon-btn" data-act="paie-m" data-dir="1" aria-label="Mois suivant" ${mo>=0?'disabled':''}>${ic('chevR')}</button></div>${cur?'<span class="pill warn">Mois en cours : les jours à venir viennent du planning</span>':''}</div>
    ${alerte}
    <section class="panel pa-panel"><div class="tbl-wrap"><table class="tbl pa-t"><thead>${head}</thead><tbody>${body||`<tr><td colspan="${C.length}" class="faint">Personne n’a travaillé ce mois-ci.</td></tr>`}</tbody><tfoot>${foot}</tfoot></table></div></section>
    ${rows.length?`<section class="panel pa-recap"><div class="panel-h"><h3>En clair, pour le comptable</h3></div><ul>${rows.map(R=>`<li>${esc(paPhrase(R))}</li>`).join('')}</ul></section>`:''}
    <p class="faint" style="font-size:12.5px;margin-top:10px">Convention HCR (IDCC 1979). Heures en décimal : 7,50 = 7 h 30. Heures sup calculées par semaine, du lundi au dimanche, et rattachées au mois où la semaine se termine. Léon prépare les variables : la fiche de paie reste faite par ton comptable.</p>`;
}

async function paCsv(){
  const {first,rows,nonValides}=paieDataV12(UI.paie.mo);const ml=MOIS[first.getMonth()]+' '+first.getFullYear();const mk=monthKey(first);const val=(S.paieVal||{})[mk];
  const anyTp=rows.some(R=>R.e.contrat<35);const d=v=>nf(v,2).replace(/\s/g,'');
  const q=v=>{v=String(v);return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  const head=['Salarié','Contrat (h/semaine)','Contrat (h/mois)','Heures payées','Écart','HS +10 %','HS +20 %','HS +50 %',...(anyTp?['Heures compl. +10 %','Heures compl. +25 %']:[]),'Heures de nuit (22h-7h)','Heures jour férié','Heures 1er mai (x2)','Jours CP','Jours maladie','Jours absence injustifiée','Autres absences','Repas (avantage en nature)','Valeur repas (€)'];
  const body=rows.map(R=>{const autres=Object.keys(R.abs).filter(k=>!['cp','maladie','absinj'].includes(k)).map(k=>`${R.abs[k]} ${PA_ABS[k]||k}`).join(' · ');
    return [`${R.e.prenom} ${R.e.nom||''}`.trim(),String(R.e.contrat),d(R.ctr),d(R.min/60),d(R.min/60-R.ctr),d(R.h10),d(R.h20),d(R.h50),...(anyTp?[d(R.c10),d(R.c25)]:[]),d(R.night/60),d(R.fer/60),d(R.mai/60),String(R.abs.cp||0),String(R.abs.maladie||0),String(R.abs.absinj||0),autres,String(R.meals),d(R.mealsEur)];});
  const lignes=[
    [`Variables de paie — ${S.nom||'Restaurant'} — ${ml}`],
    [`Convention HCR (IDCC 1979). Heures en décimal (7,50 = 7 h 30). Heures sup par semaine (lundi-dimanche) : 36e-39e h +10 %, 40e-43e +20 %, 44e et + +50 %.`],
    [val?`Validé par ${val.by} le ${new Date(val.at).toLocaleDateString('fr-FR')}`:'Pas encore validé par la direction'+(nonValides.length?` (${nonValides.length} journées de badgeuse à valider)`:'')],
    [],head,...body,[],['En clair'],...rows.map(R=>[paPhrase(R)])];
  const txt='﻿'+lignes.map(r=>r.map(q).join(';')).join('\r\n');
  const r=await saveFile(`paie-${(S.nom||'resto').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${mk}.csv`,txt);
  toast(r==='saved'?'Fichier prêt : envoie-le à ton comptable':'Le fichier n’a pas pu être créé',r==='saved'?'check':'alert');
}
Object.assign(ACT,{
  'pa-csv'(){paCsv();},
  'pa-badgeuse'(t){const iso=t.dataset.iso;UI.pj=Math.round((pdate(iso)-TODAY)/864e5);go('pointage');},
});
viewPaie=viewPaieV12;
if(typeof VIEWS!=='undefined'&&VIEWS.paie)VIEWS.paie=viewPaie;
