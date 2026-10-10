/* =========================================================
   V11 · DÉMO : pastille « Mode démo » + remise à zéro
   Visible seulement quand l'app tourne seule dans le navigateur (la démo),
   jamais dans l'app connectée à Supabase.
   ========================================================= */
(function(){
  if(window.claude&&typeof window.claude.use==='function')return;
  const KEYS=['leon2:','leon.device'];
  function reset(){
    if(!confirm(T('Effacer tes essais et repartir de la démo d’origine ?')))return;
    try{
      for(let i=localStorage.length-1;i>=0;i--){
        const k=localStorage.key(i);
        if(k&&KEYS.some(p=>k.startsWith(p)))localStorage.removeItem(k);
      }
    }catch(e){}
    location.reload();
  }
  function mount(){
    if(document.getElementById('demo-pill'))return;
    const css=document.createElement('style');
    css.textContent='#demo-pill{position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:99999;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 20px);padding:6px 8px 6px 12px;border-radius:999px;background:#18352B;color:#E6EEE9;font:600 12.5px/1.2 var(--f-ui,system-ui,sans-serif);box-shadow:0 6px 20px rgba(0,0,0,.35);opacity:.94}#demo-pill b{white-space:nowrap;color:#E9C47A;letter-spacing:.04em;text-transform:uppercase;font-size:11.5px}#demo-pill span{opacity:.8;font-weight:500}#demo-pill button{border:0;border-radius:999px;padding:6px 12px;background:#E9C47A;color:#18352B;font:700 12.5px var(--f-ui,system-ui,sans-serif);cursor:pointer;white-space:nowrap}@media (max-width:640px){#demo-pill span{display:none}}';
    document.head.appendChild(css);
    const p=document.createElement('div');
    p.id='demo-pill';p.setAttribute('role','status');
    p.innerHTML='<b>'+T('Mode démo')+'</b><span>'+T('Données fictives : rien ne sort de cet appareil.')+'</span><button type="button">'+T('Remettre à zéro')+'</button>';
    p.querySelector('button').addEventListener('click',reset);
    document.body.appendChild(p);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
