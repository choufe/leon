"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser, NO_DB_MSG } from "../../lib/supabaseClient";
import { marquerDeverrouille, oublierDeverrouillage } from "../_ui/verrou";
import "../vitrine.css";

// Messages de Supabase traduits en phrases simples.
function frError(e) {
  const m = (e && e.message) || "";
  if (/invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect. Vérifiez les deux, ou réinitialisez le mot de passe.";
  if (/email not confirmed/i.test(m)) return "Cette adresse n'est pas encore confirmée. Ouvrez le mail de confirmation reçu à l'inscription.";
  if (/rate limit|too many/i.test(m)) return "Trop d'essais d'affilée. Attendez une minute puis réessayez.";
  if (/network|fetch/i.test(m)) return "Pas de connexion internet. Vérifiez le wifi du resto puis réessayez.";
  return "La connexion n'a pas marché. Réessayez dans un instant.";
}

export default function Login() {
  const [mode, setMode] = useState("login"); // login | forgot | sent
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [current, setCurrent] = useState(null);
  const router = useRouter();
  const [confirme, setConfirme] = useState(false);

  // Après connexion : le créateur va dans son espace (où il choisit son 2e code), les autres dans leur resto.
  async function allerChezMoi(sb) {
    // Un salarié qui a ouvert son lien d'invitation puis confirmé son mail : on le rattache à son resto.
    let invit = null;
    try { invit = localStorage.getItem("leon:rejoindre"); } catch (_) {}
    if (invit) {
      const { data: ok } = await sb.rpc("rejoindre", { c: invit });
      try { localStorage.removeItem("leon:rejoindre"); } catch (_) {}
      if (ok) { router.push("/app"); return; }
    }
    const { data: salarie } = await sb.rpc("mon_salarie");
    if (salarie) { router.push("/app"); return; }
    const { data: createur } = await sb.rpc("devenir_createur");
    router.push(createur ? "/createur" : "/app");
  }

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("confirme")) setConfirme(true);
    (async () => {
      // Lien du mail de confirmation ouvert sur le même appareil : on connecte directement.
      const code = q.get("code");
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (!error) { marquerDeverrouille(); await allerChezMoi(sb); return; }
      }
      const { data } = await sb.auth.getUser();
      setCurrent(data.user || null);
    })().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogin(e) {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb) { setErr(NO_DB_MSG); return; }
    setBusy(true);
    setErr("");
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { setErr(frError(error)); return; }
    // Le mot de passe vient d'être tapé : pas besoin du code juste après.
    marquerDeverrouille();
    await allerChezMoi(sb);
  }

  async function onForgot(e) {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb) { setErr(NO_DB_MSG); return; }
    setBusy(true);
    setErr("");
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login/nouveau`,
    });
    setBusy(false);
    if (error) { setErr(frError(error)); return; }
    setMode("sent");
  }

  async function signOut() {
    const sb = supabaseBrowser();
    if (sb) await sb.auth.signOut();
    oublierDeverrouillage();
    setCurrent(null);
  }

  return (
    <div className="v v-form-page">
      <header className="v-top">
        <div className="v-wrap">
          <Link href="/" aria-label="Retour à l'accueil de Léon">
            <img className="v-logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
          </Link>
          <div className="v-top-acts">
            <Link className="v-login" href="/">← Accueil</Link>
          </div>
        </div>
      </header>

      <main className="v-wrap v-login-grid">
        <section className="v-door-main" aria-labelledby="lg-title">
          <div className="v-door-h">
            <span className="v-door-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M3.5 9 5 4h14l1.5 5" /><path d="M3.5 9a2.8 2.8 0 0 0 5.7 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.7 0" /><path d="M5 11.5V20h14v-8.5M10 20v-5h4v5" /></svg>
            </span>
            <div>
              <span className="v-eyebrow" style={{ color: "var(--v-brass)" }}>Patron, directeur ou salarié</span>
              <h1 id="lg-title">Se connecter</h1>
            </div>
          </div>
          {confirme && !current && (
            <div className="v-ok-msg" role="status">✓ Adresse confirmée. Connectez-vous : Léon vous fera ensuite choisir votre code à 4 chiffres.</div>
          )}

          {current && mode === "login" ? (
            <div className="v-already">
              <p>Vous êtes déjà connecté avec <b>{current.email}</b>.</p>
              <div className="v-ctas">
                <button type="button" className="v-btn v-btn-brass" onClick={() => allerChezMoi(supabaseBrowser())}>Entrer dans Léon</button>
                <button type="button" className="v-btn v-btn-line" onClick={signOut}>Changer de compte</button>
              </div>
            </div>
          ) : mode === "sent" ? (
            <div className="v-already" role="status">
              <p><b>C'est envoyé.</b> Si un compte existe pour {email.trim()}, un lien pour choisir un nouveau mot de passe arrive dans quelques minutes. Pensez aux spams.</p>
              <button type="button" className="v-btn v-btn-line" onClick={() => { setMode("login"); setErr(""); }}>Retour à la connexion</button>
            </div>
          ) : (
            <form className="v-login-form" onSubmit={mode === "login" ? onLogin : onForgot}>
              {mode === "forgot" && <p className="v-hint">Entrez votre e-mail : vous recevez un lien pour choisir un nouveau mot de passe.</p>}
              <div className="v-field">
                <label htmlFor="lg-email">E-mail</label>
                <input id="lg-email" type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              </div>
              {mode === "login" && (
                <div className="v-field">
                  <div className="v-label-row">
                    <label htmlFor="lg-pass">Mot de passe</label>
                    <button type="button" className="v-link" onClick={() => { setMode("forgot"); setErr(""); }}>Mot de passe oublié ?</button>
                  </div>
                  <div className="v-pass">
                    <input id="lg-pass" type={show ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" className="v-eye" onClick={() => setShow(!show)} aria-label={show ? "Cacher le mot de passe" : "Afficher le mot de passe"} aria-pressed={show}>
                      {show ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 8.5 4 9.5 6a12.6 12.6 0 0 1-2.6 3.4M6.4 7.6A12.4 12.4 0 0 0 2.5 12c1 2 4.5 6 9.5 6a9 9 0 0 0 4.2-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {err && <div className="v-err" role="alert">{err}</div>}
              <button className="v-btn v-btn-brass" type="submit" disabled={busy}>
                {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Recevoir le lien"}
              </button>
              {mode === "forgot" && <button type="button" className="v-link" style={{ justifySelf: "center" }} onClick={() => { setMode("login"); setErr(""); }}>Retour à la connexion</button>}
              <p className="v-hint">Salariés : votre responsable vous envoie un lien pour créer votre compte. Pour badger, c'est sur la tablette du resto, avec votre code.</p>
            </form>
          )}
        </section>

        <aside className="v-side-doors" aria-label="Autres accès">
          <Link className="v-door" href="/demande">
            <span className="v-door-ic small" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 4h14v12H9l-4 4z" /><path d="M9 9h6M9 12h4" /></svg>
            </span>
            <span className="v-door-t"><b>Pas encore client ?</b><small>Demander une démo, je vous rappelle</small></span>
            <span className="v-door-go" aria-hidden="true">→</span>
          </Link>
          <a className="v-door" href="/leon/demo.html">
            <span className="v-door-ic small" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6z" /><circle cx="12" cy="12" r="3" /></svg>
            </span>
            <span className="v-door-t"><b>Juste voir à quoi ça ressemble</b><small>Essayer Léon avec un resto fictif</small></span>
            <span className="v-door-go" aria-hidden="true">→</span>
          </a>
        </aside>
      </main>
    </div>
  );
}
