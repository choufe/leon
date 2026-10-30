"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser, NO_DB_MSG } from "../../lib/supabaseClient";
import "../vitrine.css";

const CRENEAUX = [
  ["matin", "Le matin"],
  ["aprem", "L'après-midi"],
  ["soir", "Après le service"],
];
const TAILLES = [
  ["1", "1 resto"],
  ["2-3", "2 à 3"],
  ["4+", "4 et plus"],
];

export default function Demande() {
  const [f, setF] = useState({ prenom: "", resto: "", ville: "", telephone: "", email: "", message: "", site: "" });
  const [creneau, setCreneau] = useState("aprem");
  const [taille, setTaille] = useState("1");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (f.site) { setDone(true); return; } // robot
    const tel = f.telephone.replace(/[^\d+]/g, "");
    if (tel.length < 9) { setErr("Ce numéro de téléphone semble incomplet. Vérifiez-le pour que je puisse vous rappeler."); return; }
    setBusy(true);
    try {
      const supabase = supabaseBrowser();
      if (!supabase) throw new Error("no db");
      const { error } = await supabase.from("demandes").insert({
        prenom: f.prenom.trim(),
        resto: f.resto.trim(),
        ville: f.ville.trim() || null,
        telephone: f.telephone.trim(),
        email: f.email.trim() || null,
        nb_restos: taille,
        creneau,
        message: f.message.trim() || null,
        source: typeof window !== "undefined" ? window.location.pathname : null,
      });
      if (error) throw error;
      setDone(true);
    } catch (x) {
      setErr("La demande n'est pas partie, c'est de notre côté. Réessayez dans une minute.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="v v-form-page">
      <header className="v-top">
        <div className="v-wrap">
          <Link href="/" aria-label="Retour à l'accueil de Léon">
            <img className="v-logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
          </Link>
          <div className="v-top-acts">
            <Link className="v-login" href="/">← Retour</Link>
          </div>
        </div>
      </header>

      <main className="v-wrap v-form-grid">
        <div className="v-form-side">
          <span className="v-eyebrow" style={{ color: "var(--v-pop)" }}>Demander une démo</span>
          <h1>On en parle 20 minutes, et vous voyez si Léon vous va.</h1>
          <p>Pas de commercial ni de centre d'appel : c'est moi, Maurice, qui vous rappelle.</p>
          <ol className="v-expect">
            <li><span>1</span><div>Je vous rappelle au créneau choisi<small>En général sous 24 h</small></div></li>
            <li><span>2</span><div>On regarde votre resto ensemble<small>Votre équipe, vos galères du moment</small></div></li>
            <li><span>3</span><div>Je vous montre Léon avec vos chiffres<small>Sur place à Lille, ou en visio</small></div></li>
          </ol>
        </div>

        {done ? (
          <div className="v-done" role="status">
            <span className="v-ok" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
            </span>
            <h2>C'est noté{f.prenom ? `, ${f.prenom.trim()}` : ""} !</h2>
            <p>Je vous rappelle {creneau === "matin" ? "un matin" : creneau === "soir" ? "après le service" : "dans l'après-midi"}, en général sous 24 h. En attendant, vous pouvez essayer Léon avec un restaurant fictif.</p>
            <div className="v-ctas">
              <a className="v-btn v-btn-brass" href="/leon/demo.html">Essayer Léon en ligne</a>
              <Link className="v-btn" href="/" style={{ border: "1.5px solid var(--v-line-2)" }}>Retour à l'accueil</Link>
            </div>
          </div>
        ) : (
          <form className="v-form" onSubmit={onSubmit} noValidate={false}>
            <h2>Vos coordonnées</h2>
            <div className="v-row">
              <div className="v-field">
                <label htmlFor="d-prenom">Prénom</label>
                <input id="d-prenom" required autoComplete="given-name" value={f.prenom} onChange={set("prenom")} />
              </div>
              <div className="v-field">
                <label htmlFor="d-tel">Téléphone</label>
                <input id="d-tel" required type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" value={f.telephone} onChange={set("telephone")} />
              </div>
            </div>
            <div className="v-row">
              <div className="v-field">
                <label htmlFor="d-resto">Nom du restaurant</label>
                <input id="d-resto" required autoComplete="organization" value={f.resto} onChange={set("resto")} />
              </div>
              <div className="v-field">
                <label htmlFor="d-ville">Ville <small>(facultatif)</small></label>
                <input id="d-ville" autoComplete="address-level2" value={f.ville} onChange={set("ville")} />
              </div>
            </div>
            <div className="v-field">
              <label htmlFor="d-email">E-mail <small>(facultatif)</small></label>
              <input id="d-email" type="email" autoComplete="email" value={f.email} onChange={set("email")} />
            </div>
            <div className="v-field">
              <label id="d-taille-l">Combien d'établissements ?</label>
              <div className="v-seg" role="group" aria-labelledby="d-taille-l">
                {TAILLES.map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={taille === k} onClick={() => setTaille(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="v-field">
              <label id="d-cren-l">Quand je vous rappelle ?</label>
              <div className="v-seg" role="group" aria-labelledby="d-cren-l">
                {CRENEAUX.map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={creneau === k} onClick={() => setCreneau(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="v-field">
              <label htmlFor="d-msg">Ce qui vous prend le plus de temps aujourd'hui <small>(facultatif)</small></label>
              <textarea id="d-msg" value={f.message} onChange={set("message")} placeholder="Les plannings, les inventaires, l'hygiène…" />
            </div>
            <div className="v-hp" aria-hidden="true">
              <label htmlFor="d-site">Site</label>
              <input id="d-site" tabIndex={-1} autoComplete="off" value={f.site} onChange={set("site")} />
            </div>
            {err && <div className="v-err" role="alert">{err}</div>}
            <button className="v-btn v-btn-brass" type="submit" disabled={busy}>{busy ? "Envoi…" : "Être rappelé"}</button>
            <p className="v-legal">Vos coordonnées servent uniquement à vous rappeler au sujet de Léon. Elles ne sont ni revendues ni partagées.</p>
          </form>
        )}
      </main>
    </div>
  );
}
