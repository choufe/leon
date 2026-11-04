// Le grand check (12.30) : ouvre Léon comme un utilisateur, passe sur chaque écran et prend une capture.
// Signale : erreurs JavaScript, textes « undefined / NaN », éléments qui dépassent à droite.
// node scripts/check/ecrans.cjs <pc|tel|tab> <resto|reseau|manager|salarie|patron> <dossier> [demo|app]
const { chromium, devices } = require('playwright'); const {setupFonts}=require('./polices.js');
const fs=require('fs');
const [dev, who, outdir, pageName='demo'] = process.argv.slice(2);
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
  await shot('home');
  if(pageName==='tablette'){ await b.close(); fs.writeFileSync(`${outdir}/${dev}_${who}.json`,JSON.stringify(log,null,1)); return; }
  const items=await pg.evaluate(()=>__T.navItems().map(n=>n.v));
  console.log('views',items.join(','));
  for(const v of items){
    if(v==='accueil') continue;
    await pg.evaluate(v=>{__T.closeModal&&__T.closeModal();__T.go(v);},v); await pg.waitForTimeout(700);
    await pg.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
    await shot(v);
    const tabs=await pg.evaluate(TABS=>[...document.querySelectorAll(TABS.map(t=>`[data-act="${t}"]`).join(','))].filter(e=>e.getClientRects().length&&!e.classList.contains('on')&&!e.classList.contains('active')&&e.getAttribute('aria-selected')!=='true').map(e=>{const d={...e.dataset};return {sel:'[data-act="'+d.act+'"]'+Object.entries(d).filter(([k])=>k!=='act').map(([k,x])=>`[data-${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}="${x}"]`).join(''),t:(e.textContent||'').trim().slice(0,20)};}),TABS);
    const seen=new Set();
    for(const t of tabs){ if(seen.has(t.sel)) continue; seen.add(t.sel);
      try{ await pg.evaluate(()=>__T.go(__T.UI.view)); }catch(e){}
      const ok=await pg.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.getClientRects().length);if(e){e.click();return true;}return false;},t.sel);
      if(!ok) continue;
      await pg.waitForTimeout(600);
      await shot(v+'-'+t.t.replace(/[^a-zA-Z0-9À-ÿ]+/g,'_').slice(0,18));
    }
  }
  fs.writeFileSync(`${outdir}/${dev}_${who}.json`,JSON.stringify(log,null,1));
  await b.close();
})();
