"use client";
import { useEffect, useState } from "react";
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
  const [ferme, setFerme] = useState(false);

  // Dès que le créateur a choisi son 2e code, cette page ne sert plus.
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    sb.rpc("createur_existe").then(({ data }) => { if (data === true) setFerme(true); });
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const supabase = supabaseBrowser();
    if (!supabase) { setBusy(false); setErr("Base de données introuvable sur cette adresse."); return; }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login?confirme=1` },
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    // Sans confirmation par e-mail, la session est ouverte tout de suite.
    if (data.session) router.push("/createur");
    else setSent(true);
  }

  return (
    <div className="wrap">
      <img className="logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
      <div className="card">
        <h1>Compte créateur</h1>
        <p className="sub">
          Page réservée au tout premier compte : celui du créateur de Léon.
          Les patrons, eux, reçoivent une invitation par mail.
        </p>
        {ferme ? (
          <p className="sub">
            Les comptes Léon sont créés sur invitation. Vous êtes restaurateur ?{" "}
            <Link href="/demande">Demandez une démo</Link>, je vous rappelle.
          </p>
        ) : sent ? (
          <p className="ok">
            C’est presque fini : clique sur le lien reçu à {email} pour
            confirmer ton adresse. Tu reviendras ici pour te connecter, puis
            Léon te fera choisir ton code à 4 chiffres.
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
