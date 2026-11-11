// Parcours planning (15.04) : menu, haut du planning, lundi rouvert, avis, refaire, retour de fin de semaine.
// La sonde : ouvre un écran, affiche le HTML d'un élément et en prend une capture de près.
// node scripts/check/sonde.cjs <pc|tel|tab> <resto|manager|salarie> <dossier> <vue> <sélecteur CSS> [texte de l'onglet]
// (dérivé du grand check 12.30) : ouvre Léon comme un utilisateur, passe sur chaque écran et prend une capture.
// Signale : erreurs JavaScript, textes « undefined / NaN », éléments qui dépassent à droite.
// node scripts/check/ecrans.cjs <pc|tel|tab> <resto|reseau|manager|salarie|patron> <dossier> [demo|app]
const { chromium, devices } = require('playwright'); const {setupFonts}=require('./polices.js');
const fs=require('fs');
const [dev, who, outdir, view, sel, tab, pageName='demo'] = process.argv.slice(2);
fs.mkdirSync(outdir,{recursive:true});
const VP={tab820:{viewport:{width:820,height:1180}},pc:{viewport:{width:1440,height:900}},tel:{...devices['iPhone 13']},tab:{...devices['iPad Mini']}};
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
  const snap=async n=>{await pg.waitForTimeout(500);await pg.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));await pg.screenshot({path:`${outdir}/${dev}_${n}.png`});};
  const clic=async sel=>{const ok=await pg.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.getClientRects().length);if(e){e.click();return true}return false},sel);if(!ok)console.log('PAS TROUVÉ',sel);await pg.waitForTimeout(700);return ok;};
  await pg.evaluate(()=>__T.go('planning'));await snap('01-planning');
  await clic('[data-act="app-go"][data-a="service"]');await snap('02-service');
  await clic('[data-act="app-go"][data-a="hygiene"]');await snap('03-hygiene');
  await pg.evaluate(()=>__T.go('planning'));await pg.waitForTimeout(600);
  // lundi rouvert dans le cahier des charges, on vide le lundi des 3 prochaines semaines
  await pg.evaluate(()=>{const S=__T.S;S.closed=(S.closed||[]).filter(d=>d!==0);if(S.planCdc){S.planCdc.ouv[0]={midi:true,soir:true};}__T.render();});
  await pg.evaluate(()=>__T.go('planning'));await pg.waitForTimeout(600);await snap('04-lundi-ouvert');
  console.log('puce',await pg.evaluate(()=>(document.querySelector('.chkp')||{}).textContent));
  await clic('[data-act="pl-goto-w"][data-w="1"]');await pg.waitForTimeout(500);
  const w=await pg.evaluate(()=>__T.UI.plan.w);console.log('semaine',w);
  await snap('05-semaine-prochaine');
  await clic('[data-act="pl-fill"]');await snap('06-avis');
  console.log('avis',await pg.evaluate(()=>[...document.querySelectorAll('#modal-root .rm-w b')].map(b=>b.textContent).join(' | ')));
  if(await clic('[data-act="v15-redo"]')){await snap('07-refait');
    console.log('proposition',await pg.evaluate(()=>(document.querySelector('#modal-root h3')||{}).textContent));
    console.log('jours proposés',await pg.evaluate(()=>{const c={};document.querySelectorAll('#modal-root .rm-c b').forEach(b=>{c[b.textContent]=(c[b.textContent]||0)+1});return JSON.stringify(c)}));
    await pg.evaluate(()=>{const m=document.querySelector('#modal-root .modal');if(m)m.scrollTop=m.scrollHeight;});await snap('07b-refait-bas');
    console.log('manque',await pg.evaluate(()=>(document.querySelector('#modal-root .fill-log')||{}).textContent||'rien'));
    await clic('#modal-root [data-act="pl-fill-go"]');await pg.waitForTimeout(800);await pg.evaluate(()=>document.querySelectorAll('#modal-root [data-act="modal-close"]').forEach(b=>b.click()));await snap('07c-semaine-refaite');
    await pg.evaluate(()=>{const e=document.querySelector('.pl-legend');if(e)e.scrollIntoView({block:'center'});});await snap('07d-legende');
    console.log('après annulation, shifts semaine',await pg.evaluate(w=>__T.S.shifts.filter(x=>x.w===w).length,w));
  }
  // retour de fin de semaine (semaine en cours)
  await pg.evaluate(()=>{__T.UI.plan.w=0;delete (__T.S.semAvis||{})[Object.keys(__T.S.semAvis||{}).sort().pop()];__T.go('planning');});await pg.waitForTimeout(700);
  await snap('08-retour');
  if(await pg.$('#ret-in')){await pg.fill('#ret-in','trop de monde mardi midi, ouverture trop tard samedi, pas assez en prépa, euh le truc');
    await clic('[data-act="ret-go"]');await snap('09-compris');
    console.log('compris',await pg.evaluate(()=>[...document.querySelectorAll('.v15-lu>div')].map(x=>x.textContent).join(' | ')));
    await clic('[data-act="ret-ok"]');
    console.log('cdc',JSON.stringify(await pg.evaluate(()=>({note:__T.S.planCdc.note,prepa:__T.S.planCdc.prepa}))));
  }else console.log('pas de question de retour');
  await b.close();
})();
