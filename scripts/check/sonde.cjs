// node scripts/check/sonde.cjs "<expression JS>" : ouvre la démo (un resto) et affiche le résultat
const { chromium } = require('playwright');const fs=require('fs');
const HOOK="window.__E=s=>eval(s);\n";
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});
await ctx.route(/./,async r=>{const u=r.request().url();if(/leon\/demo\.html/.test(u)){let t=fs.readFileSync(__dirname+'/../../public/leon/demo.html','utf8');t=t.replace('\nboot();\n})();','\n'+HOOK+'boot();\n})();');return r.fulfill({status:200,body:t,headers:{'content-type':'text/html; charset=utf-8'}});}r.abort();});
const pg=await ctx.newPage();pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.goto('http://localhost:3000/leon/demo.html?vue=resto');await pg.waitForTimeout(2500);
console.log(await pg.evaluate(s=>{try{return JSON.stringify(window.__E(s),null,0)}catch(e){return 'X '+e.stack}},process.argv[2]));
if(process.argv[3]){await pg.evaluate(s=>window.__E(s),process.argv[3]);await pg.waitForTimeout(800);await pg.screenshot({path:process.argv[4]||'/tmp/claude-0/s/shot.png'});}
await b.close();})();
