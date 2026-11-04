// Le grand check (12.30) : parcours de la tablette (salarié, manager, direction).
// node scripts/check/tablette.cjs <tabL|tabP|tel> <dossier>
const { chromium, devices } = require('playwright'); const {setupFonts}=require('./polices.js'); const fs=require('fs');
const [dev,out]=process.argv.slice(2); fs.mkdirSync(out,{recursive:true});
const VP={tabL:{viewport:{width:1180,height:820},hasTouch:true,isMobile:true},tabP:{viewport:{width:820,height:1180},hasTouch:true,isMobile:true},tel:{...devices['iPhone 13']}};
const acts = async pg => (await pg.evaluate(() => [...document.querySelectorAll('[data-act]')].filter(e=>e.getClientRects().length).map(e=>e.dataset.act+' '+JSON.stringify(Object.fromEntries(Object.entries(e.dataset).filter(([k])=>k!=='act')))+' :'+(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,25)))).filter((x,i,a)=>a.indexOf(x)===i).join(' | ');
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({...VP[dev],deviceScaleFactor:1}); await setupFonts(ctx);
  const HOOK="window.__T={get U(){return U},get UI(){return UI}};\n";await ctx.route(/\/leon\/tablette\.html/,async r=>{const nom=r.request().url().match(/leon\/(demo|tablette)\.html/)[1];let t=require('fs').readFileSync(__dirname+'/../../public/leon/'+nom+'.html','utf8');t=t.replace('\nboot();\n})();','\n'+HOOK+'boot();\n})();');r.fulfill({status:200,body:t,headers:{'content-type':'text/html; charset=utf-8'}});});const pg=await ctx.newPage(); let errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  pg.on('dialog',d=>{errs.push('DIALOG '+d.message());d.dismiss();});
  let n=0; const shot=async(name)=>{await pg.waitForTimeout(600);await pg.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));const f=`${out}/${dev}_${String(n++).padStart(2,'0')}_${name}.png`;await pg.screenshot({path:f,fullPage:true});const sw=await pg.evaluate(()=>[document.documentElement.scrollWidth,innerWidth,document.body.scrollHeight,document.scrollingElement.scrollTop]);console.log(f,sw.join('/'),errs.join(';'));errs=[];};
  const code=async c=>{for(const k of c){await pg.evaluate(k=>{const e=[...document.querySelectorAll(`[data-act="pin-key"][data-k="${k}"]`)].find(x=>x.getClientRects().length);e&&e.click();},k);await pg.waitForTimeout(120);} await pg.waitForTimeout(900);};
  const click=async(sel,i=0)=>{const ok=await pg.evaluate(([s,i])=>{const e=[...document.querySelectorAll(s)].filter(x=>x.getClientRects().length)[i];if(e){e.click();return true}return false},[sel,i]);if(!ok)console.log('NOT FOUND',sel);await pg.waitForTimeout(800);return ok;};
  const back=async()=>{for(const a of ['kiosk-hyg-home','inv-back','rc-back','kiosk-home']){const ok=await pg.evaluate(a=>{const e=[...document.querySelectorAll('.kiosk-top [data-act="'+a+'"], [data-act="'+a+'"]')].find(x=>x.getClientRects().length);if(e){e.click();return true}return false},a);if(ok){await pg.waitForTimeout(700);return a;}}return null;};
  const count=async sel=>pg.evaluate(s=>[...document.querySelectorAll(s)].filter(x=>x.getClientRects().length).length,sel);
  await pg.goto('http://localhost:3000/leon/tablette.html',{waitUntil:'networkidle'}); await pg.waitForTimeout(1200);
  // salarié : hygiène sous-écrans
  await code('3005'); await shot('lucas'); 
  await click('[data-act="badge-goto"][data-v="hygiene"]');
  const nh=await count('[data-act="kiosk-hyg-go"]');
  for(let i=0;i<nh;i++){ await click('[data-act="kiosk-hyg-go"]',i); await shot('hyg'+i); console.log('ACTS',await acts(pg)); await back(); }
  await back(); await shot('apres-retour');
  await click('[data-act="badge-go"]'); await shot('pointe'); console.log('ACTS',await acts(pg));
  await pg.waitForTimeout(500);
  await click('[data-act="lock"]'); await shot('code2');
  // manager
  await code('2222'); await shot('manager'); console.log('ACTS',await acts(pg));
  const nt=await count('[data-act="badge-goto"]');
  for(let i=0;i<nt;i++){ await click('[data-act="badge-goto"]',i); await shot('mgr-tile'+i); console.log('ACTS',await acts(pg)); 
     if(await count('[data-act="inv-zone"]')){ await click('[data-act="inv-zone"]',0); await shot('mgr-inv-zone'); console.log('ACTS',await acts(pg)); await back(); }
     if(await count('[data-act="rc-new"],[data-act="tab-rc-new"]')){ }
     let k=0; while(k++<3 && !(await count('[data-act="badge-goto"]'))) await back(); }
  await click('[data-act="lock"]');
  // direction
  await code('1111'); await shot('dir-pass');
  await pg.fill('#tab-pass','beffroi26'); await click('[data-act="tab-pass-ok"]'); await shot('direction'); console.log('ACTS',await acts(pg));
  const nd=await count('[data-act="badge-goto"]');
  for(let i=0;i<nd;i++){ await click('[data-act="badge-goto"]',i); await shot('dir-tile'+i); console.log('ACTS',await acts(pg)); let k=0; while(k++<3 && !(await count('[data-act="badge-goto"]'))) await back(); }
  await b.close();
})();
