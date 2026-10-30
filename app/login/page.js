"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
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

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => setCurrent(data.user || null)).catch(() => {});
  }, []);

  async function onLogin(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { setErr(frError(error)); return; }
    router.push("/app");
  }

  async function onForgot(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login/nouveau`,
    });
    setBusy(false);
    if (error) { setErr(frError(error)); return; }
    setMode("sent");
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut();
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
              <span className="v-eyebrow" style={{ color: "var(--v-brass)" }}>Patron ou directeur</span>
              <h1 id="lg-title">Se connecter</h1>
            </div>
          </div>

          {current && mode === "login" ? (
            <div className="v-already">
              <p>Vous êtes déjà connecté avec <b>{current.email}</b>.</p>
              <div className="v-ctas">
                <Link className="v-btn v-btn-brass" href="/app">Entrer dans Léon</Link>
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
              <p className="v-hint">Votre équipe n'a pas besoin de compte : chacun badge avec son code sur l'appareil du resto. Pour la tablette du resto, connectez-vous une fois ici : elle reste ensuite sur l'écran de badge.</p>
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
