"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function Inscription() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    // Sans confirmation par e-mail, la session est ouverte tout de suite.
    if (data.session) router.push("/app");
    else setSent(true);
  }

  return (
    <div className="wrap">
      <img className="logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
      <div className="card">
        <h1>Créer un compte</h1>
        <p className="sub">
          Ton compte de créateur. Tu ajouteras ensuite tes restaurants, ton
          équipe et leurs codes directement dans Léon.
        </p>
        {sent ? (
          <p className="ok">
            C’est presque fini : clique sur le lien reçu à {email} pour
            confirmer ton adresse.
          </p>
        ) : (
          <form onSubmit={onSubmit}>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="password">Mot de passe (8 caractères minimum)</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="primary" type="submit" disabled={busy}>
              {busy ? "Création…" : "Créer mon compte"}
            </button>
            {err && <p className="err">{err}</p>}
          </form>
        )}
        <p className="links">
          Déjà un compte ? <Link href="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
