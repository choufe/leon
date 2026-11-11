// La sonde : ouvre un écran, affiche le HTML d'un élément et en prend une capture de près.
// node scripts/check/sonde.cjs <pc|tel|tab> <resto|manager|salarie> <dossier> <vue> <sélecteur CSS> [texte de l'onglet]
// (dérivé du grand check 12.30) : ouvre Léon comme un utilisateur, passe sur chaque écran et prend une capture.
// Signale : erreurs JavaScript, textes « undefined / NaN », éléments qui dépassent à droite.
// node scripts/check/ecrans.cjs <pc|tel|tab> <resto|reseau|manager|salarie|patron> <dossier> [demo|app]
const { chromium, devices } = require('playwright'); const {setupFonts}=require('./polices.js');
const fs=require('fs');
const [dev, who, outdir, view, sel, tab, pageName='demo'] = process.argv.slice(2);
fs.mkdirSync(outdir,{recursive:true});
const VP={pc:{viewport:{width:1440,height:900}},tel:{...devices['iPhone 13']},tab:{...devices['iPad Mini']}};
const HOOK="window.__T={get U(){return U},get UI(){return UI},get S(){return S},go:v=>go(v),goMod:(v,t)=>goMod(v,t),navItems:()=>navItems(),render:()=>render(),ACT:ACT,closeModal:()=>closeModal()};\n";
const TABS=['stock-tab','rec-tab','hyg-tab','point-tab','cg-tab','pz-tab','plan-mode','paie-m'];
const log=[];
async function check(pg){
  return await pg.evaluate(()=>{
    const W=window.innerWidth;const bad=[];
    const txt=document.body.innerText;
    const words=(txt.match(/\b(undefined|NaN|null|Invalid Date|\[object Object\])\b/g)||[]);
    // éléments qui dépassent à droite (hors conteneurs scrollables)
    const over=[];
    document.querySelectorAll('body *').forEach(e=>{
      const r=e.getBoundingClientRect(); if(!r.width||!r.height) return;
      if(r.right>W+2){
        let p=e.parentElement, scroll=false;
        while(p&&p!==document.body){const s=getComputedStyle(p);if(/(auto|scroll|hidden)/.test(s.overflowX)){const pr=p.getBoundingClientRect(); if(pr.right<=W+2){scroll=true;break;}} p=p.parentElement;}
        if(!scroll) over.push((e.className&&e.className.baseVal===undefined?e.className:e.tagName)+':'+Math.round(r.right));
      }
    });
    return {sw:document.documentElement.scrollWidth,W,words:[...new Set(words)],over:[...new Set(over)].slice(0,6)};
  });
}
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({...VP[dev], deviceScaleFactor:1}); await setupFonts(ctx);
  const MOCK=fs.readFileSync(__dirname+'/faux-stockage.js','utf8');
  await ctx.route(/\/leon\/app\.html/, async r=>{const res=await r.fetch();let t=await res.text();t=t.replace(/<script>\(function\(\)\{var p=null;[^<]*<\/script>/,'<script>'+MOCK+'</script>').split('window.parent!==window&&window.parent.').join('window.');t=t.replace('\nboot();\n})();','\n'+HOOK+'boot();\n})();');r.fulfill({response:res,body:t,headers:{...res.headers(),'content-type':'text/html'}});});
  await ctx.route(/\/leon\/(demo|tablette)\.html/, async r=>{const nom=r.request().url().match(/leon\/(demo|tablette)\.html/)[1];let t=require('fs').readFileSync(__dirname+'/../../public/leon/'+nom+'.html','utf8');t=t.replace('\nboot();\n})();','\n'+HOOK+'boot();\n})();');r.fulfill({status:200,body:t,headers:{'content-type':'text/html; charset=utf-8'}});});
  const pg=await ctx.newPage(); let errs=[];
  pg.on('console',m=>{if(m.type()==='error'&&!/net::ERR_FAILED/.test(m.text()))errs.push(m.text().slice(0,200));}); // ERR_FAILED = appels externes coupés exprès
  pg.on('pageerror',e=>errs.push('PAGEERR '+e.message.slice(0,200)));
  pg.on('dialog',d=>{errs.push('DIALOG '+d.message());d.dismiss();});
  let n=0;
  const shot=async(name)=>{
    await pg.waitForTimeout(500);
    const c=await check(pg);
    const f=`${outdir}/${dev}_${who}_${String(n++).padStart(2,'0')}_${name}.png`;
    await pg.screenshot({path:f,fullPage:true});
    log.push({f,errs,...c}); if(errs.length||c.words.length||c.over.length||c.sw>c.W) console.log(f,JSON.stringify({errs,...c}));
    errs=[];
  };
  if(pageName==='app'){ await pg.goto('http://localhost:3000/leon/app.html?fresh=1&mode='+who,{waitUntil:'networkidle'}); }
  else if(pageName==='tablette'){ await pg.goto('http://localhost:3000/leon/tablette.html',{waitUntil:'networkidle'}); }
  else{
    // démo : ?vue=reseau (Bruno, plusieurs restos) ou ?vue=resto (un resto) ; manager / salarie = « Voir comme »
    await pg.goto('http://localhost:3000/leon/demo.html?vue='+(who==='reseau'?'reseau':'resto'),{waitUntil:'networkidle'});
    await pg.waitForTimeout(1500);
    const r={manager:'manager',salarie:'staff',directeur:'patron'}[who];
    if(r){ await pg.evaluate(r=>{const e=document.querySelector(`[data-act="view-as"][data-r="${r}"]`);if(e)e.click();},r); }
  }
  if(pageName==='tablette'){ await pg.evaluate(c=>{ const e=document.querySelector(`[data-act="demo-code"][data-code="${c}"]`); e&&e.click(); }, who); }
  await pg.waitForTimeout(1500);
  // fermer les toasts
  await pg.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
  if(view&&view!=='accueil'){ await pg.evaluate(v=>{__T.closeModal&&__T.closeModal();__T.go(v);},view); await pg.waitForTimeout(700); }
  if(tab){ await pg.evaluate(t=>{const e=[...document.querySelectorAll('[data-act]')].find(x=>x.getClientRects().length&&x.textContent.trim().startsWith(t));e&&e.click();},tab); await pg.waitForTimeout(600); }
  if(process.env.CLIC){ await pg.evaluate(c=>{const e=[...document.querySelectorAll(c)].find(x=>x.getClientRects().length);e&&e.click();},process.env.CLIC); await pg.waitForTimeout(400); }
  if(process.env.PLEIN){ await pg.screenshot({path:`${outdir}/sonde_${dev}_${view}_plein.png`,fullPage:true}); }
  await pg.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
  const els=await pg.$$(sel||'body'); console.log('trouvés :',els.length);
  for(let i=0;i<Math.min(els.length,3);i++){
    console.log((await els[i].evaluate(e=>e.outerHTML)).slice(0,900));
    try{ await els[i].scrollIntoViewIfNeeded(); await els[i].screenshot({path:`${outdir}/sonde_${dev}_${view}_${i}.png`}); }catch(e){ console.log('capture impossible',e.message.slice(0,80)); }
  }
  await pg.screenshot({path:`${outdir}/sonde_${dev}_${view}_ecran.png`});
  await b.close();
})();
