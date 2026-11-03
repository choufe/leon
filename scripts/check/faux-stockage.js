// Faux stockage en mémoire pour ouvrir /leon/app.html comme le vrai site (patron, tablette ou salarié) sans Supabase.
(function(){
  const q=new URLSearchParams(location.search);if(q.get('fresh')==='1'&&!sessionStorage.getItem('h-fresh')){localStorage.removeItem('harness-db');sessionStorage.setItem('h-fresh','1');}
  const KEY='harness-db';
  let store={};try{store=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}};
  const docL=new Map(),colL=new Map();
  const parentOf=p=>p.replace(/\/[^/]+$/,'');
  const fire=(path)=>{(docL.get(path)||new Set()).forEach(f=>setTimeout(f,10));(colL.get(parentOf(path))||new Set()).forEach(f=>setTimeout(f,10));};
  const listen=(m,k,f)=>{if(!m.has(k))m.set(k,new Set());m.get(k).add(f);return()=>m.get(k).delete(f);};
  const db={
    doc(path){return{
      async set(data){store[path]=JSON.parse(JSON.stringify(data));persist();fire(path);},
      async delete(){delete store[path];persist();fire(path);},
      onSnapshot(cb){const r=()=>{const d=store[path];cb({exists:d!==undefined,data:()=>d===undefined?undefined:JSON.parse(JSON.stringify(d)),metadata:{hasPendingWrites:false}});};const s=listen(docL,path,r);setTimeout(r,5);return s;}
    };},
    collection(path){const query=(F)=>({where(f,op,v){return query([...F,[f,v]]);},onSnapshot(cb){const r=()=>{const docs=Object.keys(store).filter(p=>parentOf(p)===path).map(p=>store[p]).filter(d=>F.every(([f,v])=>String(d&&d[f])>=String(v)));cb({docs:docs.map(d=>({data:()=>JSON.parse(JSON.stringify(d)),metadata:{hasPendingWrites:false}}))});};const s=listen(colL,path,r);setTimeout(r,5);return s;}});return query([]);}
  };
  window.__leonClaude={use:async n=>n==='db'?db:null};window.claude=window.__leonClaude;
  const mode=q.get('mode')||'patron';
  window.__leonCompte=mode==='tablette'?{prenom:'Maurice',resto:'Irish Corner',tablette:true}:mode==='salarie'?{salarie:true,empId:q.get('emp'),resto:'Irish Corner',prenom:''}:{prenom:'Maurice',resto:'Irish Corner'};
  window.__leonInviter=async(id,p)=>location.origin+'/rejoindre?c=TEST';
  window.__leonConnectes=async()=>[];
  
})();