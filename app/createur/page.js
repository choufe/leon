"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser, NO_DB_MSG } from "../../lib/supabaseClient";
import CodePad from "../_ui/CodePad";
import ChoisirCode from "../_ui/ChoisirCode";
import AjouterResto, { KINDS } from "./AjouterResto";
import Demandes, { useDemandes } from "./Demandes";
import SupprimerResto from "./SupprimerResto";
import Entreprise from "./Entreprise";
import "../vitrine.css";
import "../comptes.css";

// Espace créateur (Maurice) : mot de passe, puis 2e code, puis la liste des restos.
export default function Createur() {
  const [etat, setEtat] = useState("chargement"); // chargement | refuse | aucun | a_verifier | ok | erreur
  const [email, setEmail] = useState("");
  const router = useRouter();

  const verifierEtat = useCallback(async () => {
    const sb = supabaseBrowser();
    if (!sb) { setEtat("erreur"); return; }
    const { data } = await sb.auth.getUser();
    if (!data.user) { router.replace("/login?suite=/createur"); return; }
    setEmail(data.user.email || "");
    const { data: estCreateur, error } = await sb.rpc("devenir_createur");
    if (error) { setEtat("erreur"); return; }
    if (!estCreateur) { setEtat("refuse"); return; }
    const { data: e } = await sb.rpc("createur_etat");
    setEtat(e || "a_verifier");
  }, [router]);

  useEffect(() => { verifierEtat(); }, [verifierEtat]);

  async function deconnexion() {
    const sb = supabaseBrowser();
    if (sb) await sb.auth.signOut();
    router.replace("/login");
  }

  const solo = (body) => (
    <div className="v v-form-page">
      <main className="cx-solo">
        <div className="cx-card">
          <img className="cx-logo" src="/brand/leon-logo-vert.png" alt="Léon" width={720} height={241} />
          {body}
        </div>
      </main>
    </div>
  );

  if (etat === "chargement") return solo(<p className="v-hint" style={{ textAlign: "center" }}>Ouverture de votre espace…</p>);
  if (etat === "erreur") return solo(<><p className="v-hint">{NO_DB_MSG}</p><Link className="v-btn v-btn-line" href="/login">Retour à la connexion</Link></>);
  if (etat === "refuse") return solo(
    <div className="v-already">
      <p>Cet espace est réservé au créateur de Léon.</p>
      <div className="v-ctas"><Link className="v-btn v-btn-brass" href="/app">Entrer dans mon resto</Link><button type="button" className="v-btn v-btn-line" onClick={deconnexion}>Changer de compte</button></div>
    </div>
  );
  if (etat === "aucun") return solo(
    <ChoisirCode
      titre="Choisissez votre 2e code"
      sousTitre="4 chiffres. Il sera demandé après votre mot de passe, pour protéger tous les restos."
      enregistrer={async (c) => {
        const { data, error } = await supabaseBrowser().rpc("createur_definir_code", { pin: c });
        if (error || !data) return false;
        setEtat("ok");
        return true;
      }}
    />
  );
  if (etat === "a_verifier") return solo(
    <CodePad
      titre="Votre 2e code"
      sousTitre={email ? `Connecté avec ${email}` : null}
      onComplete={async (c) => {
        const { data, error } = await supabaseBrowser().rpc("createur_verifier_code", { pin: c });
        if (error) return { ok: false, message: "Pas de connexion. Réessayez." };
        if (data?.ok) { setEtat("ok"); return { ok: true }; }
        return { ok: false, attente: data?.attente || 0 };
      }}
      bas={<button type="button" className="v-link cp-link" onClick={deconnexion}>Ce n'est pas moi</button>}
    />
  );
  return <Espace email={email} onDeconnexion={deconnexion} onCodeExpire={() => setEtat("a_verifier")} />;
}

function dateFr(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function Espace({ email, onDeconnexion, onCodeExpire }) {
  const [restos, setRestos] = useState(null);
  const [sel, setSel] = useState(null);
  const [tunnel, setTunnel] = useState(false);
  const [vue, setVue] = useState("entreprise"); // entreprise | demandes | restos
  const dem = useDemandes(onCodeExpire);
  const [suppr, setSuppr] = useState(false);
  const [info, setInfo] = useState("");
  const actifs = (restos || []).filter((x) => !x.supprime_le);
  const supprimes = (restos || []).filter((x) => x.supprime_le);
  async function recuperer(id) {
    const { error } = await supabaseBrowser().rpc("createur_recuperer_resto", { o_id: id });
    if (error) { setErr("Le resto n'a pas pu être récupéré. Réessaie."); return; }
    setInfo("Resto récupéré : son équipe peut de nouveau y entrer.");
    charger(id);
  }
  const [err, setErr] = useState("");

  const charger = useCallback(async (choisir) => {
    const { data, error } = await supabaseBrowser().rpc("createur_restos");
    if (error) {
      if (/réservé au créateur/.test(error.message || "")) { onCodeExpire(); return; }
      setErr("La liste des restos n'a pas pu être chargée. Rechargez la page.");
      return;
    }
    setRestos(data || []);
    setSel((cur) => choisir || cur || ((data || []).find((x) => !x.supprime_le) || {}).id || null);
  }, [onCodeExpire]);

  useEffect(() => { charger(); }, [charger]);

  const r = restos && restos.find((x) => x.id === sel);
  const aideActive = r && r.aide_jusqu && new Date(r.aide_jusqu) > new Date();
  const kindLabel = (k) => (KINDS.find((x) => x.id === k) || { label: "Restaurant" }).label;

  return (
    <div className="v">
      <div className="cr">
        <header className="cr-top">
          <img src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
          <span className="cr-role">Créateur</span>
          <span className="cr-me"><span>{email}</span><button type="button" onClick={onDeconnexion}>Se déconnecter</button></span>
        </header>
        <div className="cr-body">
          <aside className="cr-side" aria-label="Mes restaurants">
            <button type="button" className={"cr-item cr-dem cr-ent" + (vue === "entreprise" ? " on" : "")} onClick={() => setVue("entreprise")}>
              <b>Mon entreprise</b>
              <small>Clients, paiements, cahier de compte</small>
            </button>
            <button type="button" className={"cr-item cr-dem" + (vue === "demandes" ? " on" : "")} onClick={() => setVue("demandes")}>
              <b>Demandes de démo{dem.aRappeler > 0 && <span className="cr-badge hot">{dem.aRappeler} à rappeler</span>}</b>
              <small>Les prospects venus du site</small>
            </button>
            <h2>Mes restaurants · {restos ? actifs.length : "…"}</h2>
            {actifs.map((x) => (
              <button key={x.id} type="button" className={"cr-item" + (vue === "restos" && x.id === sel ? " on" : "")} onClick={() => { setSel(x.id); setVue("restos"); }}>
                <b>{x.nom}{x.test ? <span className="cr-badge test">Test</span> : x.statut === "invite" ? <span className="cr-badge">Invité</span> : x.a_moi ? <span className="cr-badge ok">Mon resto</span> : null}</b>
                <small>{[x.ville, x.patron_prenom].filter(Boolean).join(" · ") || kindLabel(x.kind)}</small>
              </button>
            ))}
            {supprimes.length > 0 && (
              <details className="cr-suppr">
                <summary>Supprimés · {supprimes.length}</summary>
                {supprimes.map((x) => (
                  <button key={x.id} type="button" className={"cr-item" + (vue === "restos" && x.id === sel ? " on" : "")} onClick={() => { setSel(x.id); setVue("restos"); }}>
                    <b>{x.nom}</b><small>Supprimé le {dateFr(x.supprime_le)}</small>
                  </button>
                ))}
              </details>
            )}
            <div className="cr-demo">
              <span className="cr-demo-h">Démo · Le Petit Beffroi</span>
              <a className="cr-item" href="/leon/demo.html"><b>Ouvrir la démo</b><small>Version PC / téléphone</small></a>
              <a className="cr-item" href="/leon/demo.html?tablette=1"><b>Tablette de démo</b><small>Comme chez un vrai client : écran des codes</small></a>
            </div>
            <button type="button" className="cr-add" onClick={() => setTunnel(true)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              Ajouter un restaurant
            </button>
          </aside>
          <main className="cr-main">
            {vue === "entreprise" && <Entreprise onCodeExpire={onCodeExpire} />}
            {vue === "demandes" && <Demandes d={dem} onCreerResto={(depart) => setTunnel(depart)} />}
            {vue === "restos" && err && <div className="v-err" role="alert">{err}</div>}
            {vue === "restos" && info && <div className="v-ok-msg" role="status">{info}</div>}
            {vue === "restos" && restos && actifs.length === 0 && !(r && r.supprime_le) && (
              <div className="cr-empty">
                <h2>Lancez votre premier resto</h2>
                <p>Vous créez le resto et vous invitez le patron. Il reçoit un mail, choisit son mot de passe et son code, puis Léon le guide pour tout installer.</p>
                <button type="button" className="v-btn v-btn-brass" onClick={() => setTunnel(true)}>Ajouter un restaurant</button>
              </div>
            )}
            {vue === "restos" && r && (
              <>
                <div>
                  <h1>{r.nom}</h1>
                  <p className="cr-sub">{kindLabel(r.kind)}{r.ville ? ` · ${r.ville}` : ""} · créé le {dateFr(r.created_at)}</p>
                </div>
                <div className="cr-grid">
                  <div className="cr-tile"><span>Patron</span><b>{r.patron_prenom || "—"}</b><span>{r.patron_email || ""}</span></div>
                  <div className="cr-tile"><span>Statut</span><b>{r.statut === "invite" ? "Invité" : "Actif"}</b><span>{r.statut === "invite" ? `Mail envoyé le ${dateFr(r.invite_le)}` : "Le patron a ouvert son compte"}</span></div>
                  <div className="cr-tile"><span>Votre accès d'aide</span><b>{r.a_moi ? "Votre resto" : aideActive ? `Jusqu'au ${dateFr(r.aide_jusqu)}` : "Terminé"}</b><span>{r.a_moi ? "Toujours accessible" : aideActive ? "Pour aider au démarrage" : "Le patron gère seul"}</span></div>
                </div>
                <div className="cr-acts">
                  {!r.supprime_le && (r.test || aideActive) && <><a className="v-btn v-btn-brass" href={`/app?resto=${r.id}`}>Entrer dans ce resto</a><a className="v-btn v-btn-line" href={`/tablette?resto=${r.id}`} title="Ouvre l'écran de la tablette du resto (badger, hygiène, planning)">Mode tablette</a></>}
                </div>
                {!r.a_moi && aideActive && !r.supprime_le && <p className="v-hint">En entrant, vous voyez le Léon du patron comme lui, pour l'aider à s'installer. L'accès s'arrête tout seul après 15 jours.</p>}
                {r.supprime_le ? (
                  <div className="cr-zone">
                    <p><b>Supprimé le {dateFr(r.supprime_le)}.</b> Personne ne peut y entrer, mais toutes ses données sont gardées.</p>
                    <button type="button" className="v-btn v-btn-brass" onClick={() => recuperer(r.id)}>Récupérer ce restaurant</button>
                  </div>
                ) : (
                  <div className="cr-zone">
                    <button type="button" className="cr-del" onClick={() => setSuppr(true)}>Supprimer ce restaurant</button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      {suppr && r && <SupprimerResto r={r} onClose={() => setSuppr(false)} onFait={() => { setSuppr(false); setInfo(`${r.nom} est supprimé. Tu le retrouves dans « Supprimés » si besoin.`); setSel(null); charger(); }} />}
      {tunnel && <AjouterResto depart={typeof tunnel === "object" ? tunnel : null} onClose={() => setTunnel(false)} onCree={(id) => { charger(id); setVue("restos"); }} onCodeExpire={onCodeExpire} />}
    </div>
  );
}
