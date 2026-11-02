"use client";
import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabaseClient";

export const KINDS = [
  { id: "restaurant", label: "Restaurant" },
  { id: "brasserie", label: "Brasserie / pub" },
  { id: "bar", label: "Bar" },
  { id: "rapide", label: "Restauration rapide" },
  { id: "boite", label: "Boîte de nuit" },
  { id: "autre", label: "Autre" },
];
const ETAPES = ["Le resto", "Le patron", "Récap"];

// Tunnel en 3 étapes : le resto, le patron, le récap → « Créer et inviter ».
export default function AjouterResto({ onClose, onCree, onCodeExpire, depart }) {
  const [etape, setEtape] = useState(0);
  const [f, setF] = useState({ nom: "", ville: "", kind: "restaurant", prenom: "", email: "", ...(depart || {}) });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [fini, setFini] = useState(null);
  const [test, setTest] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function suivant(e) {
    e.preventDefault();
    setErr("");
    if (etape === 0 && !f.nom.trim()) { setErr("Donnez un nom au resto."); return; }
    if (etape === 0 && test) { creerTest(); return; }
    if (etape === 1) {
      if (!f.prenom.trim()) { setErr("Il manque le prénom du patron."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) { setErr("L'e-mail n'a pas l'air bon. C'est là que partira l'invitation."); return; }
    }
    if (etape < 2) { setEtape(etape + 1); return; }
    creer();
  }

  // Resto de test : pas de patron, pas de mail, c'est le créateur qui y entre.
  async function creerTest() {
    setBusy(true);
    setErr("");
    const { data, error } = await supabaseBrowser().rpc("createur_creer_test", { nom: f.nom, ville: f.ville, kind: f.kind });
    setBusy(false);
    if (error) {
      if (/réservé au créateur/.test(error.message || "")) { onCodeExpire(); return; }
      setErr("Le resto de test n'a pas pu être créé. Réessayez.");
      return;
    }
    setFini({ id: data, name: f.nom.trim(), test: true });
    onCree(data);
  }

  async function creer() {
    setBusy(true);
    setErr("");
    const sb = supabaseBrowser();
    const { data, error } = await sb.functions.invoke("inviter-patron", {
      body: { ...f, origine: window.location.origin },
    });
    setBusy(false);
    if (error) {
      let msg = "La création n'a pas marché. Réessayez dans un instant.";
      try { const j = await error.context.json(); if (j && j.erreur) msg = j.erreur; } catch (_) {}
      if (error.context && error.context.status === 403) { onCodeExpire(); return; }
      setErr(msg);
      return;
    }
    setFini(data.resto);
    onCree(data.resto.id);
  }

  return (
    <div className="tn-back" role="dialog" aria-modal="true" aria-labelledby="tn-title" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <form className="tn" onSubmit={suivant}>
        <div className="tn-h">
          <h2 id="tn-title">Nouveau restaurant</h2>
          <button type="button" className="tn-x" onClick={onClose} aria-label="Fermer" disabled={busy}>×</button>
        </div>

        {fini ? (
          <div className="tn-b">
            <div className="tn-ok">
              <span className="tn-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
              <h2>{fini.name} est créé</h2>
              {fini.test ? (
                <p className="v-hint">C'est un resto de test : pas de patron, pas de mail. Entrez-y depuis sa fiche avec « Entrer dans ce resto ».</p>
              ) : (<>
              <p className="v-hint">L'invitation est partie à <b>{f.email.trim()}</b>. {f.prenom.trim()} va choisir son mot de passe et son code, puis Léon le guide pour tout installer.</p>
              <p className="v-hint">Pas reçu ? Qu'il regarde dans ses spams.</p>
              </>)}
            </div>
          </div>
        ) : (
          <div className="tn-b">
            <div className="tn-steps" aria-label={`Étape ${etape + 1} sur 3`}>
              {ETAPES.map((t, i) => (
                <span key={t} style={{ display: "contents" }}>
                  {i > 0 && <hr />}
                  <span className={i < etape ? "done" : i === etape ? "cur" : ""}><em>{i < etape ? "✓" : i + 1}</em>{t}</span>
                </span>
              ))}
            </div>

            {etape === 0 && (
              <>
                <div className="v-field"><label htmlFor="tn-nom">Nom du resto</label><input id="tn-nom" value={f.nom} onChange={set("nom")} placeholder="L'Irish Corner" autoFocus /></div>
                <div className="v-field"><label htmlFor="tn-ville">Ville <small>(facultatif)</small></label><input id="tn-ville" value={f.ville} onChange={set("ville")} placeholder="Lille" /></div>
                <div className="v-field">
                  <label>Type d'établissement</label>
                  <div className="tn-kinds">
                    {KINDS.map((k) => (
                      <button key={k.id} type="button" aria-pressed={f.kind === k.id} onClick={() => setF({ ...f, kind: k.id })}>{k.label}</button>
                    ))}
                  </div>
                </div>
                <label className="cx-check tn-test">
                  <input type="checkbox" checked={test} onChange={(e) => setTest(e.target.checked)} />
                  <span><b>Resto de test</b><small>Pour essayer Léon en vrai : pas de patron, pas de mail. Vous y entrez vous-même.</small></span>
                </label>
              </>
            )}

            {etape === 1 && (
              <>
                <div className="v-field"><label htmlFor="tn-prenom">Prénom du patron</label><input id="tn-prenom" value={f.prenom} onChange={set("prenom")} placeholder="Hugo" autoFocus /></div>
                <div className="v-field"><label htmlFor="tn-email">Son e-mail <small>(l'invitation part ici)</small></label><input id="tn-email" type="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={f.email} onChange={set("email")} placeholder="hugo@monresto.fr" /></div>
              </>
            )}

            {etape === 2 && (
              <>
                <div className="tn-recap">
                  <div><span>Resto</span><b>{f.nom.trim()}</b></div>
                  <div><span>Type</span><b>{KINDS.find((k) => k.id === f.kind).label}</b></div>
                  {f.ville.trim() && <div><span>Ville</span><b>{f.ville.trim()}</b></div>}
                  <div><span>Patron</span><b>{f.prenom.trim()}</b></div>
                  <div><span>E-mail</span><b>{f.email.trim()}</b></div>
                </div>
                <p className="v-hint">Léon envoie tout de suite un mail au patron pour qu'il choisisse son mot de passe. Vous gardez un accès d'aide de 15 jours sur ce resto.</p>
              </>
            )}

            {err && <div className="v-err" role="alert">{err}</div>}
          </div>
        )}

        <div className="tn-f">
          {fini ? (
            <>
              <span />
              <button type="button" className="v-btn v-btn-brass" onClick={onClose}>Terminé</button>
            </>
          ) : (
            <>
              <button type="button" className="v-btn v-btn-line" onClick={() => (etape === 0 ? onClose() : setEtape(etape - 1))} disabled={busy}>{etape === 0 ? "Annuler" : "Retour"}</button>
              <button type="submit" className="v-btn v-btn-brass" disabled={busy}>{busy ? "Création…" : etape === 2 ? "Créer et inviter" : etape === 0 && test ? "Créer le resto de test" : "Suivant"}</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
