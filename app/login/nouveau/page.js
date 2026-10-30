"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabaseClient";
import "../../vitrine.css";

// Page ouverte depuis le lien « mot de passe oublié » reçu par mail.
export default function NouveauMotDePasse() {
  const [ok, setOk] = useState(null); // null = on vérifie, true = lien valide, false = lien expiré
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setOk(true);
    });
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setOk((v) => (v === true ? true : !!data.session));
    }, 1500);
    return () => { clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (pass.length < 8) { setErr("Choisissez au moins 8 caractères."); return; }
    if (pass !== pass2) { setErr("Les deux mots de passe ne sont pas identiques."); return; }
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pass });
    setBusy(false);
    if (error) { setErr("Le changement n'a pas marché. Redemandez un lien depuis la page de connexion."); return; }
    router.push("/app");
  }

  return (
    <div className="v v-form-page">
      <header className="v-top">
        <div className="v-wrap">
          <Link href="/" aria-label="Retour à l'accueil de Léon">
            <img className="v-logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
          </Link>
        </div>
      </header>
      <main className="v-wrap v-login-grid one">
        <section className="v-door-main">
          <div>
            <span className="v-eyebrow" style={{ color: "var(--v-brass)" }}>Mot de passe oublié</span>
            <h1>Choisir un nouveau mot de passe</h1>
          </div>
          {ok === null && <p className="v-hint">Vérification du lien…</p>}
          {ok === false && (
            <div className="v-already">
              <p>Ce lien a expiré ou a déjà servi. Redemandez-en un depuis la page de connexion.</p>
              <Link className="v-btn v-btn-brass" href="/login">Retour à la connexion</Link>
            </div>
          )}
          {ok === true && (
            <form className="v-login-form" onSubmit={onSubmit}>
              <div className="v-field">
                <label htmlFor="np-1">Nouveau mot de passe <small>(8 caractères minimum)</small></label>
                <input id="np-1" type="password" required autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
              </div>
              <div className="v-field">
                <label htmlFor="np-2">Encore une fois</label>
                <input id="np-2" type="password" required autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} />
              </div>
              {err && <div className="v-err" role="alert">{err}</div>}
              <button className="v-btn v-btn-brass" type="submit" disabled={busy}>{busy ? "Un instant…" : "Enregistrer et entrer dans Léon"}</button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
