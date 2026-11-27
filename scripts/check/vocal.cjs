// 15.13 · Test de compréhension de « Dis Léon » : node scripts/check/vocal.cjs (doit afficher 126/126 OK)
const fs=require('fs');const src=fs.readFileSync(require('path').join(__dirname,'../../legacy/')+'v15_dlc_cerveau.js','utf8');
const v=fs.readFileSync(require('path').join(__dirname,'../../legacy/')+'v15_vocal.js','utf8');const a=v.indexOf('const VOC_NB');const b=v.indexOf('/* ---------- la note');
global.S={hyg:{equip:['Frigo 1','Frigo 2','Frigo 3','Congélateur 1','Congélateur 2'].map((n,i)=>({id:'e'+(i+1),nom:n}))}};
const prods=['Beurre doux','Bœuf haché 15 % MG','Bouquet garni','Cheddar affiné','Crème liquide 35 %','Crevettes grises décortiquées','Échalotes','Jambon blanc supérieur','Joue de bœuf','Lait entier','Maroilles AOP','Mesclun','Moules de bouchot','Œufs plein air','Persil plat','Rumsteck (tartare)','Tomates grappe'];
global.etqGroups=()=>[{items:prods.map((n,i)=>({id:'p'+i,n}))}];
const tasks=['Se laver les mains, tenue propre','Relever les températures','Vérifier les DLC du jour','Allumer friteuse et four','Mise en place du midi','Nettoyer la friteuse','Sortir les poubelles','Nettoyer le plan de travail','Vider et nettoyer la trancheuse','Laver le sol de la cuisine'];
global.tasksOf=()=>[{id:'L',n:'Cuisine',items:tasks.map(t=>({t}))}];global.tkAssign=()=>[1];global.TODAY_ISO='2026-11-27';
const LANGS=[],I18N={};eval(src+'\n'+v.slice(a,b));
const sum=P=>P.map(s=>s.k==='etq'?'etq:'+s.items.map(x=>x.q+'×'+x.n+(x.isNew?'*':'')).join('+'):s.k==='temp'?'temp:'+(s.eq?S.hyg.equip.find(e=>e.id===s.eq).nom:'?')+'='+s.val:s.k==='task'?'task:'+tasks[s.i]:s.k==='lot'?'lot:'+s.n:s.k==='badge'?'badge:'+s.t:s.k==='go'?'go:'+s.v:s.k).join(' | ')||'∅';
const C=JSON.parse(fs.readFileSync(process.argv[2]||require('path').join(__dirname,'vocal-phrases.json'),'utf8'));let ok=0;const bad=[];
for(const [q,exp] of C){const got=sum(vocParse(q));if(got===exp)ok++;else bad.push([q,exp,got]);}
console.log(`${ok}/${C.length} OK`);bad.forEach(([q,e,g])=>console.log('✗',q,'\n   attendu',e,'\n   obtenu ',g));

if(bad.length)process.exit(1);
