// node scripts/check/sonde2.cjs <dossier> "js1" "js2" ... : enchaîne des actions dans la démo, une capture après chaque
const { chromium } = require('playwright');const fs=require('fs');
(async()=>{const [out,...steps]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});
await ctx.route(/./,async r=>{const u=r.request().url();if(/leon\/demo\.html/.test(u)){let t=fs.readFileSync(__dirname+'/../../public/leon/demo.html','utf8');t=t.replace('\nboot();\n})();','\nwindow.__E=s=>eval(s);\nboot();\n})();');return r.fulfill({status:200,body:t,headers:{'content-type':'text/html; charset=utf-8'}});}r.abort();});
const pg=await ctx.newPage();pg.on('pageerror',e=>console.log('ERR',e.message));pg.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))console.log('CERR',m.text().slice(0,200))});
await pg.goto('http://localhost:3000/leon/demo.html?vue=resto');await pg.waitForTimeout(2500);
let i=0;for(const s of steps){const r=await pg.evaluate(s=>{try{const v=window.__E(s);return v===undefined?'':JSON.stringify(v)}catch(e){return 'X '+e.message}},s);if(r)console.log(i,r);await pg.waitForTimeout(700);await pg.screenshot({path:`${out}/${String(i++).padStart(2,'0')}.png`});}
await b.close();})();
