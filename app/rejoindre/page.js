"use client";
// 12.18 — Un salarié ouvre le lien envoyé par son patron, crée son compte et arrive dans le Léon de son resto.
// Pas de code à 4 chiffres pour lui : le code, c'est pour la tablette du resto.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser, NO_DB_MSG } from "../../lib/supabaseClient";
import { marquerDeverrouille } from "../_ui/verrou";
import "../vitrine.css";

const CLE = "leon:rejoindre";

function frError(e) {
  const m = (e && e.message) || "";
  if (/already registered|already been registered|user already exists/i.test(m)) return "Cette adresse a déjà un compte Léon : connectez-vous plutôt (lien en bas).";
  if (/invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect.";
  if (/password/i.test(m)) return "Mot de passe trop court : 8 caractères minimum.";
  if (/rate limit|too many/i.test(m)) return "Trop d'essais d'affilée. Attendez une minute puis réessayez.";
  if (/network|fetch/i.test(m)) return "Pas de connexion internet. Réessayez.";
  return "Ça n'a pas marché. Réessayez dans un instant.";
}

export default function Rejoindre() {
  const [code, setCode] = useState("");
  const [infos, setInfos] = useState(null); // {prenom, resto, valide}
  const [mode, setMode] = useState("creer"); // creer | connecter | mail
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    const c = (new URLSearchParams(window.location.search).get("c") || "").trim().toLowerCase();
    setCode(c);
    if (!c) { setInfos({ valide: false }); return; }
    try { localStorage.setItem(CLE, c); } catch (_) {}
    const sb = supabaseBrowser();
    if (!sb) { setErr(NO_DB_MSG); return; }
    sb.rpc("invitation_infos", { c }).then(({ data }) => setInfos(data || { valide: false }));
  }, []);

  async function entrer(sb) {
    const { data: ok, error } = await sb.rpc("rejoindre", { c: code });
    if (error) { setErr(error.message.includes("patron") ? "Ce compte est déjà celui d'un patron : utilisez une autre adresse." : frError(error)); return; }
    try { localStorage.removeItem(CLE); } catch (_) {}
    if (!ok) { setErr("Ce lien a déjà servi ou a expiré. Demandez un nouveau lien à votre responsable."); return; }
    marquerDeverrouille();
    router.replace("/app");
  }

  async function onSubmit(e) {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb) { setErr(NO_DB_MSG); return; }
    setBusy(true); setErr("");
    if (mode === "creer") {
      const { data, error } = await sb.auth.signUp({
        email: email.trim(), password,
        options: { emailRedirectTo: `${window.location.origin}/login?confirme=1` },
      });
      if (error) { setBusy(false); setErr(frError(error)); return; }
      if (!data.session) { setBusy(false); setMode("mail"); return; } // confirmation par mail demandée
      await entrer(sb);
    } else {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setBusy(false); setErr(frError(error)); return; }
      await entrer(sb);
    }
    setBusy(false);
  }

  const prenom = infos && infos.prenom;
  return (
    <div className="v v-form-page">
      <header className="v-top">
        <div className="v-wrap">
          <Link href="/" aria-label="Léon">
            <img className="v-logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
          </Link>
        </div>
      </header>
      <main className="v-wrap v-login-grid one">
        <section className="v-door-main" aria-labelledby="rj-title">
          <div className="v-door-h">
            <div>
              <span className="v-eyebrow" style={{ color: "var(--v-brass)" }}>{infos && infos.resto ? infos.resto : "Ton resto"}</span>
              <h1 id="rj-title">{prenom ? `Salut ${prenom} !` : "Rejoindre ton équipe"}</h1>
            </div>
          </div>
          {!infos ? (
            <p className="v-hint">Un instant…</p>
          ) : !infos.valide ? (
            <div className="v-already" role="status">
              <p><b>Ce lien ne marche plus.</b> Il a déjà servi ou il a expiré. Demandez un nouveau lien à votre responsable.</p>
              <Link className="v-btn v-btn-line" href="/login">J'ai déjà un compte</Link>
            </div>
          ) : mode === "mail" ? (
            <div className="v-already" role="status">
              <p><b>Presque fini.</b> Ouvrez le mail reçu à {email.trim()} et cliquez sur le lien. Vous arriverez directement dans le Léon de {infos.resto}.</p>
            </div>
          ) : (
            <form className="v-login-form" onSubmit={onSubmit}>
              <p className="v-hint">
                {mode === "creer"
                  ? `Crée ton compte pour voir ton planning, l'équipe et faire tes demandes (congés, échanges), sur ton téléphone ou ton ordi.`
                  : "Connecte-toi avec ton compte Léon pour le rattacher à ce resto."}
              </p>
              <div className="v-field">
                <label htmlFor="rj-email">E-mail</label>
                <input id="rj-email" type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="v-field">
                <label htmlFor="rj-pass">{mode === "creer" ? "Choisis un mot de passe (8 caractères minimum)" : "Mot de passe"}</label>
                <input id="rj-pass" type="password" required minLength={mode === "creer" ? 8 : undefined} autoComplete={mode === "creer" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {err && <div className="v-err" role="alert">{err}</div>}
              <button className="v-btn v-btn-brass" type="submit" disabled={busy}>
                {busy ? "Un instant…" : mode === "creer" ? "Créer mon compte" : "Me connecter"}
              </button>
              <button type="button" className="v-link" style={{ justifySelf: "center" }} onClick={() => { setMode(mode === "creer" ? "connecter" : "creer"); setErr(""); }}>
                {mode === "creer" ? "J'ai déjà un compte Léon" : "Créer un compte"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
