/* =========================================================
   V15 · CORRECTIFS DE L'AUDIT (11 nov. 2026, voir AUDIT.md)
   B1 · le service qui finit après minuit · B2 · l'attente après 5 mauvais codes
   ========================================================= */

/* ---------- B1 · Le service qui finit après minuit ----------
   Avant : arrivée 18 h, départ badgé à 0 h 45 → le départ partait sur le LENDEMAIN, tout seul.
   La veille restait « Départ pas badgé » (0 h payée) et la tablette proposait « Pointer mon arrivée ».
   Maintenant : tant qu'un service commencé la veille est encore ouvert (jusqu'à 6 h du matin, 12 h max
   après l'arrivée), la pause, le retour et le départ vont sur la journée de la veille (heure + 24 h,
   comme le fait déjà la correction à la main dans la badgeuse). */
const V15_NUIT_FIN=6*60,V15_NUIT_MAX=12*60;
function v15Veille(empId){
  const now=nowMin();if(now>=V15_NUIT_FIN)return null;
  if(evsOn(empId,TODAY_ISO).length)return null;
  const iso=isoD(addDays(TODAY,-1));const ev=evsOn(empId,iso);if(!ev.length)return null;
  const last=ev[ev.length-1];if(last.t==='out')return null;
  const deb=[...ev].reverse().find(x=>x.t==='in');if(!deb)return null;
  if(1440-(deb.m%1440)+now>V15_NUIT_MAX)return null;
  return {iso,ev,last,deb};
}
{const f=nextActions;nextActions=function(emp){
  const v=v15Veille(emp);if(!v)return f.apply(this,arguments);
  return v.last.t==='pause'?['back']:['pause','out'];
};}
{const f=presence;presence=function(emp){
  const v=v15Veille(emp);if(!v)return f.apply(this,arguments);
  if(v.last.t==='pause')return {k:'pause',tone:'info',l:'En pause',d:'depuis '+hhmm(v.last.m%1440)};
  return {k:'present',tone:'ok',l:'Présent',d:'depuis '+hhmm(v.deb.m%1440)};
};}
{const f=borneDo;borneDo=function(empId,type){
  const v=type!=='in'?v15Veille(empId):null;if(!v)return f.apply(this,arguments);
  const m=nowMin();const ev=ensureEv(empId,v.iso);ev.push({t:type,m:m+1440});ev.sort((a,b)=>a.m-b.m);save();
  const e=empById(empId)||{prenom:''};
  U.badgeMsg={v11:1,type,m,tone:'ok',
    t:type==='out'?T('À demain')+' '+e.prenom:type==='pause'?T('Bonne pause'):T('Bon retour'),
    s:type==='out'?`${dur(workedMin(ev,false))} ${T('travaillées aujourd’hui')}`:''};
  LAST_ACT=Date.now();U.screen='badge';BORNE.who=null;BORNE.act=null;render();
};}

/* ---------- B2 · Trop de mauvais codes : Léon fait juste patienter ----------
   Règle de Maurice (30 oct.) : après 5 erreurs, 30 s d'attente, qui double si ça continue ; personne n'est prévenu.
   C'était fait pour le code du créateur et du patron, pas pour l'écran des codes de l'appli / de la tablette. */
const V15_ESSAIS='leon:codes:essais';
function v15Essais(){try{return JSON.parse(localStorage.getItem(V15_ESSAIS)||'{}')||{};}catch(e){return {};}}
function v15EssaisSet(s){try{if(s)localStorage.setItem(V15_ESSAIS,JSON.stringify(s));else localStorage.removeItem(V15_ESSAIS);}catch(e){}}
function v15Attente(){const s=v15Essais();return s.j&&s.j>Date.now()?Math.ceil((s.j-Date.now())/1000):0;}
const v15AttenteMsg=w=>`${T('Trop d’essais. Attends')} ${w} s.`;
let V15_RATE=false;
{const f=pinFail;pinFail=function(){V15_RATE=true;return f.apply(this,arguments);};}
{const f=pinCheck;pinCheck=function(){
  if(PIN.ctx!=='lock')return f.apply(this,arguments);
  const w=v15Attente();
  if(w>0){PIN.buf='';pinUI(v15AttenteMsg(w));return;}
  V15_RATE=false;
  const r=f.apply(this,arguments);
  if(!NET.config)return r; // données pas encore arrivées : ce n'est pas un mauvais code
  if(V15_RATE){
    const s=v15Essais();s.n=(s.n||0)+1;
    if(s.n>=5){s.j=Date.now()+30000*Math.pow(2,Math.min(s.n-5,7));v15EssaisSet(s);pinUI(v15AttenteMsg(v15Attente()));}
    else v15EssaisSet(s);
  }else v15EssaisSet(null);
  return r;
};}
// pendant l'attente, le compte à rebours se met à jour tout seul
setInterval(()=>{try{if(PIN.ctx!=='lock'||U.screen!=='lock')return;const e=document.getElementById('pin-err');if(!e)return;
  const w=v15Attente();if(w>0)e.textContent=v15AttenteMsg(w);else if(/^\S.*\d+ s\.$/.test(e.textContent)&&v15Essais().j)e.textContent='';}catch(_){}},1000);

[
 ['Trop d’essais. Attends','Too many tries. Wait','அதிக முயற்சிகள். காத்திரு','محاولات كثيرة. انتظر','Demasiadas tentativas. Espera','Demasiados intentos. Espera'],
].forEach(r=>{LANGS.forEach(([k],n)=>{if(n&&r[n]){I18N[k][r[0]]=r[n];const alt=r[0].replace(/’/g,"'");if(alt!==r[0])I18N[k][alt]=r[n];}});});

/* 15.01 — audit visuel. Accueil d'un resto neuf : « Midi 30 couverts personne » se lisait mal. */
{const f=tjHTML;tjHTML=function(){return f.apply(this,arguments).replace(/<span class="faint">personne<\/span>/g,'<span class="faint">personne au planning</span>');};}
