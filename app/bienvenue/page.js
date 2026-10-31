"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
import ChoisirCode from "../_ui/ChoisirCode";
import { marquerDeverrouille } from "../_ui/verrou";
import "../vitrine.css";
import "../comptes.css";

// Page ouverte depuis le mail d'invitation : mot de passe, puis code à 4 chiffres.
export default function Bienvenue() {
  const [etape, setEtape] = useState("verif"); // verif | expire | pass | code
  const [accueil, setAccueil] = useState({});
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) { setEtape("expire"); return; }
    let fini = false;
    (async () => {
      // Le lien du mail arrive avec les jetons dans l'adresse (#access_token=…).
      const h = new URLSearchParams(window.location.hash.slice(1));
      if (h.get("access_token") && h.get("refresh_token")) {
        await sb.auth.setSession({ access_token: h.get("access_token"), refresh_token: h.get("refresh_token") });
        window.history.replaceState(null, "", window.location.pathname);
      } else if (h.get("error_code")) {
        setEtape("expire");
        return;
      }
      const q = new URLSearchParams(window.location.search);
      if (q.get("code")) await sb.auth.exchangeCodeForSession(q.get("code")).catch(() => {});
      const { data } = await sb.auth.getSession();
      if (fini) return;
      if (!data.session) { setEtape("expire"); return; }
      const { data: a } = await sb.rpc("mon_accueil");
      setAccueil(a || {});
      const { data: aCode } = await sb.rpc("mon_code_existe");
      setEtape(aCode ? "fin" : "pass");
    })();
    return () => { fini = true; };
  }, []);

  useEffect(() => {
    if (etape !== "fin") return;
    (async () => {
      await supabaseBrowser().rpc("marquer_actif");
      marquerDeverrouille();
      router.replace("/app");
    })();
  }, [etape, router]);

  async function onPass(e) {
    e.preventDefault();
    setErr("");
    if (pass.length < 8) { setErr("Choisissez au moins 8 caractères."); return; }
    if (pass !== pass2) { setErr("Les deux mots de passe ne sont pas identiques."); return; }
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pass });
    setBusy(false);
    if (error) {
      setErr(/same|different/i.test(error.message || "") ? "Choisissez un autre mot de passe." : "L'enregistrement n'a pas marché. Réessayez.");
      return;
    }
    setEtape("code");
  }

  const prenom = accueil.prenom ? ` ${accueil.prenom}` : "";
  return (
    <div className="v v-form-page">
      <main className="cx-solo">
        <div className="cx-card">
          <img className="cx-logo" src="/brand/leon-logo-vert.png" alt="Léon" width={720} height={241} />
          {(etape === "pass" || etape === "code") && <div className="cx-steps" aria-hidden="true"><i className="on" /><i className={etape === "code" ? "on" : ""} /></div>}

          {etape === "verif" && <p className="v-hint" style={{ textAlign: "center" }}>Vérification du lien…</p>}
          {etape === "fin" && <p className="v-hint" style={{ textAlign: "center" }}>Ouverture de votre resto…</p>}

          {etape === "expire" && (
            <div className="v-already">
              <h1 style={{ fontSize: 26 }}>Ce lien ne marche plus</h1>
              <p>Il a expiré ou il a déjà servi. Si vous avez déjà choisi votre mot de passe, connectez-vous. Sinon, demandez à Maurice de vous renvoyer l'invitation.</p>
              <Link className="v-btn v-btn-brass" href="/login">Se connecter</Link>
            </div>
          )}

          {etape === "pass" && (
            <form className="v-login-form" onSubmit={onPass} style={{ display: "grid", gap: 16 }}>
              <div>
                <span className="v-eyebrow" style={{ color: "var(--v-brass)" }}>{accueil.resto || "Votre resto"}</span>
                <h1 style={{ fontSize: 28, marginTop: 6 }}>Bienvenue sur Léon{prenom}</h1>
                <p className="v-hint" style={{ marginTop: 8 }}>Choisissez votre mot de passe. Il vous servira à vous connecter depuis un nouvel appareil.</p>
              </div>
              <div className="v-field">
                <label htmlFor="bv-1">Mot de passe <small>(8 caractères minimum)</small></label>
                <input id="bv-1" type={show ? "text" : "password"} required autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
              </div>
              <div className="v-field">
                <label htmlFor="bv-2">Encore une fois</label>
                <input id="bv-2" type={show ? "text" : "password"} required autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} />
              </div>
              <label className="v-hint cx-check">
                <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Afficher le mot de passe
              </label>
              {err && <div className="v-err" role="alert">{err}</div>}
              <button className="v-btn v-btn-brass" type="submit" disabled={busy}>{busy ? "Un instant…" : "Continuer"}</button>
            </form>
          )}

          {etape === "code" && (
            <ChoisirCode
              titre="Votre code à 4 chiffres"
              sousTitre="C'est lui qui rouvre Léon sur votre téléphone ou votre ordinateur, sans retaper le mot de passe."
              enregistrer={async (c) => {
                const { data, error } = await supabaseBrowser().rpc("definir_mon_code", { pin: c });
                if (error || !data) return false;
                setEtape("fin");
                return true;
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
