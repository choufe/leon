"use client";
import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabaseClient";

export const STATUTS = [
  { id: "nouvelle", label: "À rappeler", c: "#93630F" },
  { id: "rappelee", label: "Rappelée", c: "#2F6FB3" },
  { id: "demo", label: "Démo faite", c: "#7B4FB8" },
  { id: "gagnee", label: "Gagnée", c: "#23734A" },
  { id: "perdue", label: "Perdue", c: "#6E7C75" },
];
const CRENEAUX = { matin: "le matin", aprem: "l'après-midi", soir: "le soir" };

function quand(d) {
  const t = new Date(d), j = Math.floor((Date.now() - t) / 86400000);
  if (j <= 0) return "aujourd'hui à " + t.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (j === 1) return "hier";
  if (j < 7) return `il y a ${j} jours`;
  return "le " + t.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// Hook partagé : la liste + le nombre « à rappeler » pour la pastille du menu.
export function useDemandes(onCodeExpire) {
  const [liste, setListe] = useState(null);
  const [indispo, setIndispo] = useState(false);
  const charger = useCallback(async () => {
    const { data, error } = await supabaseBrowser().rpc("createur_demandes");
    if (error) {
      if (/réservé au créateur/.test(error.message || "")) { onCodeExpire(); return; }
      setIndispo(true); setListe([]); return;
    }
    setIndispo(false); setListe(data || []);
  }, [onCodeExpire]);
  useEffect(() => { charger(); }, [charger]);
  return { liste, indispo, charger, aRappeler: (liste || []).filter((d) => d.statut === "nouvelle").length };
}

export default function Demandes({ d, onCreerResto }) {
  const { liste, indispo, charger } = d;
  const [filtre, setFiltre] = useState("ouvertes");
  if (liste === null) return <p className="v-hint">Chargement des demandes…</p>;

  const ouvertes = liste.filter((x) => !["gagnee", "perdue"].includes(x.statut));
  const vues = filtre === "ouvertes" ? ouvertes : filtre === "toutes" ? liste : liste.filter((x) => x.statut === filtre);

  return (
    <>
      <div>
        <h1>Demandes de démo</h1>
        <p className="cr-sub">Elles arrivent du site. Rappelez dans la journée : c'est là que ça se joue.</p>
      </div>
      {indispo && <div className="v-err" role="alert">Les demandes ne sont pas encore branchées sur la base (mise à jour 0005 à appliquer).</div>}
      <div className="dm-filtres" role="group" aria-label="Filtrer">
        {[["ouvertes", `En cours · ${ouvertes.length}`], ["gagnee", "Gagnées"], ["perdue", "Perdues"], ["toutes", "Toutes"]].map(([id, l]) => (
          <button key={id} type="button" aria-pressed={filtre === id} onClick={() => setFiltre(id)}>{l}</button>
        ))}
      </div>
      {vues.length === 0 && !indispo && (
        <div className="cr-empty"><h2>Rien ici pour l'instant</h2><p>Dès qu'un restaurateur remplit « Demander une démo » sur le site, sa demande apparaît ici.</p></div>
      )}
      <div className="dm-liste">
        {vues.map((x) => <Carte key={x.id} x={x} onMaj={charger} onCreerResto={onCreerResto} />)}
      </div>
    </>
  );
}

function Carte({ x, onMaj, onCreerResto }) {
  const [note, setNote] = useState(x.note || "");
  const [busy, setBusy] = useState(false);
  const st = STATUTS.find((s) => s.id === x.statut) || STATUTS[0];
  const tel = (x.telephone || "").replace(/[^\d+]/g, "");

  async function maj(statut, n = note) {
    setBusy(true);
    await supabaseBrowser().rpc("createur_demande_suivi", { d_id: x.id, nouveau_statut: statut, nouvelle_note: n });
    setBusy(false);
    onMaj();
  }

  return (
    <article className="dm-carte" style={{ "--c": st.c }}>
      <div className="dm-h">
        <div>
          <b>{x.prenom} · {x.resto}</b>
          <small>{[x.ville, x.nb_restos ? `${x.nb_restos} établissement${x.nb_restos === "1" ? "" : "s"}` : null, quand(x.created_at)].filter(Boolean).join(" · ")}</small>
        </div>
        <span className="dm-st">{st.label}</span>
      </div>
      <div className="dm-contact">
        <a className="v-btn v-btn-brass v-btn-sm" href={`tel:${tel}`}>Appeler {x.telephone}</a>
        {x.email && <a className="v-btn v-btn-line v-btn-sm" href={`mailto:${x.email}`}>{x.email}</a>}
        {x.creneau && <span className="dm-cren">Préfère être rappelé {CRENEAUX[x.creneau]}</span>}
      </div>
      {x.message && <p className="dm-msg">« {x.message} »</p>}
      <label className="dm-note">
        <span>Mes notes</span>
        <textarea rows={2} value={note} placeholder="Ce qu'il m'a dit, sa caisse, quand le rappeler…" onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (x.note || "") && maj(x.statut)} />
      </label>
      <div className="dm-acts" role="group" aria-label="Où en est cette demande">
        {STATUTS.map((s) => (
          <button key={s.id} type="button" disabled={busy} aria-pressed={x.statut === s.id} style={{ "--c": s.c }} onClick={() => maj(s.id)}>{s.label}</button>
        ))}
        {x.statut === "gagnee" && (
          <button type="button" className="dm-go" onClick={() => onCreerResto({ nom: x.resto, ville: x.ville || "", prenom: x.prenom, email: x.email || "" })}>Créer son Léon →</button>
        )}
      </div>
    </article>
  );
}
