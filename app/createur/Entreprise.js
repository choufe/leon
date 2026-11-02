"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabaseClient";

// « Mon entreprise » : le suivi de Maurice. Qui a quelle formule, qui a payé, qui doit,
// les demandes de démo, et le cahier de compte (entrées / sorties) prêt pour le comptable.

export const FORMULES = {
  fondateur: { label: "Fondateur", prix: 400, c: "#93630F" },
  normal: { label: "Normal", prix: 450, c: "#2F6FB3" },
  offert: { label: "Offert", prix: 0, c: "#6E7C75" },
};
const OBJECTIF_RESTOS = 5;
const OBJECTIF_MENSUEL = 2000; // 5 restos × 400 €
const CATS_SORTIE = ["Matériel", "Logiciels", "Nom de domaine", "Pub", "Déplacements", "Autre"];
const CATS_ENTREE = ["Abonnement", "Kit matériel", "Autre"];

const eur = (n) => (Math.round((n || 0) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";
const jour = (d) => (d ? new Date(d + (String(d).length === 10 ? "T12:00:00" : "")).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");
const iso = (d) => d.toISOString().slice(0, 10);

function tarifDe(o) {
  if (o.tarif != null) return Number(o.tarif);
  return o.formule ? FORMULES[o.formule].prix : 0;
}

// Combien le resto devait avoir payé à aujourd'hui, et sa prochaine échéance.
export function situation(o, entrees, today = new Date()) {
  const t = tarifDe(o);
  const paye = entrees.filter((c) => c.org_id === o.id).reduce((s, c) => s + Number(c.montant), 0);
  if (!o.formule || !o.abo_debut || o.formule === "offert" || t === 0) return { t, du: 0, paye, reste: 0, prochaine: null, mensuel: 0 };
  const d = new Date(o.abo_debut + "T12:00:00");
  const mois = (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth()) + (today.getDate() >= d.getDate() ? 1 : 0);
  let du = 0, prochaine;
  if (o.paiement === "annuel") {
    const ans = today >= d ? Math.floor((mois - 1) / 12) + 1 : 0;
    du = Math.max(0, ans * 10 * t - (o.mois_offerts || 0) * t);
    prochaine = new Date(d); prochaine.setFullYear(d.getFullYear() + ans);
  } else {
    const n = today >= d ? mois : 0;
    du = Math.max(0, (n - (o.mois_offerts || 0)) * t);
    prochaine = new Date(d); prochaine.setMonth(d.getMonth() + n);
  }
  const mensuel = o.paiement === "annuel" ? (t * 10) / 12 : t;
  return { t, du, paye, reste: Math.round((du - paye) * 100) / 100, prochaine, mensuel };
}

export default function Entreprise({ onCodeExpire }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(null); // {type:'formule', o} | {type:'ligne', sens, o?}
  const [annee, setAnnee] = useState(new Date().getFullYear());

  const charger = useCallback(async () => {
    const { data: d, error } = await supabaseBrowser().rpc("createur_entreprise");
    if (error) {
      if (/réservé au créateur/.test(error.message || "")) { onCodeExpire(); return; }
      setErr("Le suivi n'a pas pu être chargé (mise à jour 0008 de la base à appliquer ?).");
      setData({ restos: [], compta: [], demandes: {} });
      return;
    }
    setErr("");
    setData(d);
  }, [onCodeExpire]);
  useEffect(() => { charger(); }, [charger]);

  const calc = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const clients = data.restos.filter((o) => !o.test && !o.supprime_le && !o.a_moi);
    const entrees = data.compta.filter((c) => c.sens === "entree");
    const lignes = clients.map((o) => ({ o, s: situation(o, entrees, now) }));
    const payants = lignes.filter((l) => l.o.formule && l.o.formule !== "offert");
    const mrr = payants.reduce((s, l) => s + l.s.mensuel, 0);
    const ym = iso(now).slice(0, 7);
    const deLAnnee = data.compta.filter((c) => String(c.date).startsWith(String(annee)));
    const entreAn = deLAnnee.filter((c) => c.sens === "entree").reduce((s, c) => s + Number(c.montant), 0);
    const sortAn = deLAnnee.filter((c) => c.sens === "sortie").reduce((s, c) => s + Number(c.montant), 0);
    const entreMois = data.compta.filter((c) => c.sens === "entree" && String(c.date).startsWith(ym)).reduce((s, c) => s + Number(c.montant), 0);
    const aEncaisser = lignes.reduce((s, l) => s + Math.max(0, l.s.reste), 0);
    const d = data.demandes || {};
    const tot = Object.values(d).reduce((s, n) => s + Number(n), 0);
    const annees = [...new Set([now.getFullYear(), ...data.compta.map((c) => Number(String(c.date).slice(0, 4)))])].sort((a, b) => b - a);
    return { lignes, payants, mrr, entreAn, sortAn, entreMois, aEncaisser, d, tot, deLAnnee, annees };
  }, [data, annee]);

  if (!data || !calc) return <p className="v-hint">Chargement de ton suivi…</p>;

  function exporter() {
    const rows = [["Date", "Sens", "Libellé", "Catégorie", "Resto", "Moyen", "Montant"]];
    const nom = (id) => (data.restos.find((o) => o.id === id) || {}).nom || "";
    calc.deLAnnee.slice().reverse().forEach((c) => rows.push([c.date, c.sens === "entree" ? "Entrée" : "Sortie", c.libelle, c.categorie || "", nom(c.org_id), c.moyen || "", String(c.sens === "entree" ? c.montant : -c.montant).replace(".", ",")]));
    const csv = "﻿" + rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `leon-compta-${annee}.csv`;
    a.click();
  }

  async function supprimerLigne(c) {
    if (!window.confirm(`Supprimer « ${c.libelle} » (${eur(c.montant)}) du cahier ?`)) return;
    await supabaseBrowser().rpc("createur_compta_supprimer", { c_id: c.id });
    charger();
  }

  const pct = Math.min(100, Math.round((calc.mrr / OBJECTIF_MENSUEL) * 100));
  const etapes = [["Demandes", calc.tot], ["Rappelées", (calc.d.rappelee || 0) + (calc.d.demo || 0) + (calc.d.gagnee || 0)], ["Démos faites", (calc.d.demo || 0) + (calc.d.gagnee || 0)], ["Gagnées", calc.d.gagnee || 0]];

  return (
    <>
      <div className="en-top">
        <div>
          <h1>Mon entreprise</h1>
          <p className="cr-sub">Où tu en es, qui paie, ce qui rentre et ce qui sort.</p>
        </div>
        <div className="en-acts">
          <button type="button" className="v-btn v-btn-brass v-btn-sm" onClick={() => setModal({ type: "ligne", sens: "entree" })}>+ Encaissement</button>
          <button type="button" className="v-btn v-btn-line v-btn-sm" onClick={() => setModal({ type: "ligne", sens: "sortie" })}>+ Dépense</button>
        </div>
      </div>
      {err && <div className="v-err" role="alert">{err}</div>}

      <section className="en-obj">
        <div className="en-obj-h">
          <span>Objectif : {OBJECTIF_RESTOS} restos à 400 €, pour vivre de Léon</span>
          <b>{calc.payants.length} / {OBJECTIF_RESTOS} restos</b>
        </div>
        <div className="en-bar" role="img" aria-label={`${pct} % de l'objectif`}><i style={{ width: pct + "%" }} /></div>
        <p>{eur(calc.mrr)} par mois sur {eur(OBJECTIF_MENSUEL)} visés · {pct} %</p>
      </section>

      <div className="en-kpis">
        <div className="en-kpi"><span>Revenu par mois</span><b>{eur(calc.mrr)}</b><small>{calc.payants.length} client{calc.payants.length > 1 ? "s" : ""} payant{calc.payants.length > 1 ? "s" : ""}</small></div>
        <div className="en-kpi"><span>Encaissé ce mois</span><b>{eur(calc.entreMois)}</b><small>{new Date().toLocaleDateString("fr-FR", { month: "long" })}</small></div>
        <div className={"en-kpi" + (calc.aEncaisser > 0 ? " warn" : "")}><span>À encaisser</span><b>{eur(calc.aEncaisser)}</b><small>{calc.aEncaisser > 0 ? "des clients te doivent" : "tout le monde est à jour"}</small></div>
        <div className="en-kpi"><span>Résultat {annee}</span><b>{eur(calc.entreAn - calc.sortAn)}</b><small>{eur(calc.entreAn)} entrés − {eur(calc.sortAn)} sortis</small></div>
      </div>

      <section className="en-sec">
        <h2>Mes clients</h2>
        {calc.lignes.length === 0 ? (
          <p className="v-hint">Pas encore de client. Les restos invités apparaissent ici (les restos de test et les tiens ne comptent pas).</p>
        ) : (
          <div className="en-tbl-wrap">
            <table className="en-tbl">
              <thead><tr><th>Resto</th><th>Formule</th><th>Depuis</th><th>Prochaine échéance</th><th>Payé</th><th>Situation</th><th /></tr></thead>
              <tbody>
                {calc.lignes.map(({ o, s }) => (
                  <tr key={o.id}>
                    <td><b>{o.nom}</b><small>{[o.patron, o.ville].filter(Boolean).join(" · ")}</small></td>
                    <td>{o.formule ? <span className="en-f" style={{ "--c": FORMULES[o.formule].c }}>{FORMULES[o.formule].label} · {eur(s.t)}{o.paiement === "annuel" ? " · annuel" : ""}</span> : <button type="button" className="en-link" onClick={() => setModal({ type: "formule", o })}>Choisir la formule</button>}</td>
                    <td>{o.abo_debut ? jour(o.abo_debut) : "—"}</td>
                    <td>{s.prochaine ? jour(iso(s.prochaine)) : "—"}</td>
                    <td>{eur(s.paye)}</td>
                    <td>{!o.formule ? <span className="en-st">À régler</span> : o.formule === "offert" ? <span className="en-st">Offert</span> : s.reste > 0 ? <span className="en-st bad">Doit {eur(s.reste)}</span> : <span className="en-st ok">À jour</span>}</td>
                    <td className="en-row-acts">
                      {o.formule && o.formule !== "offert" && <button type="button" className="v-btn v-btn-brass v-btn-sm" onClick={() => setModal({ type: "ligne", sens: "entree", o, montant: o.paiement === "annuel" ? s.t * 10 : s.t })}>Encaissé</button>}
                      <button type="button" className="en-link" onClick={() => setModal({ type: "formule", o })}>Formule</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="en-sec">
        <h2>Demandes de démo</h2>
        <div className="en-funnel">
          {etapes.map(([l, n], i) => (
            <div key={l} className="en-step" style={{ "--w": calc.tot ? Math.max(8, (n / calc.tot) * 100) + "%" : "8%" }}>
              <span>{l}</span><b>{n}</b>{i > 0 && calc.tot > 0 && <small>{Math.round((n / calc.tot) * 100)} %</small>}
            </div>
          ))}
        </div>
        {(calc.d.nouvelle || 0) > 0 && <p className="v-hint"><b>{calc.d.nouvelle}</b> demande{calc.d.nouvelle > 1 ? "s" : ""} à rappeler : va dans « Demandes de démo ».</p>}
      </section>

      <section className="en-sec">
        <div className="en-cahier-h">
          <h2>Le cahier de compte</h2>
          <div className="en-acts">
            {calc.annees.length > 1 && (
              <select value={annee} onChange={(e) => setAnnee(Number(e.target.value))} aria-label="Année">
                {calc.annees.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
            <button type="button" className="v-btn v-btn-line v-btn-sm" onClick={exporter} disabled={calc.deLAnnee.length === 0}>Fichier pour le comptable</button>
          </div>
        </div>
        {calc.deLAnnee.length === 0 ? (
          <p className="v-hint">Rien en {annee} pour l'instant. Note chaque encaissement et chaque dépense (matériel, logiciels, nom de domaine…) : en fin d'année, tu donnes le fichier à ton comptable.</p>
        ) : (
          <div className="en-tbl-wrap">
            <table className="en-tbl en-cahier">
              <thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th className="num">Montant</th><th /></tr></thead>
              <tbody>
                {calc.deLAnnee.map((c) => (
                  <tr key={c.id}>
                    <td>{jour(c.date)}</td>
                    <td><b>{c.libelle}</b>{(c.org_id || c.moyen) && <small>{[(data.restos.find((o) => o.id === c.org_id) || {}).nom, c.moyen].filter(Boolean).join(" · ")}</small>}</td>
                    <td>{c.categorie || "—"}</td>
                    <td className={"num " + (c.sens === "entree" ? "in" : "out")}>{c.sens === "entree" ? "+" : "−"} {eur(c.montant)}</td>
                    <td><button type="button" className="en-x" aria-label="Supprimer cette ligne" onClick={() => supprimerLigne(c)}>×</button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={3}>Total {annee}</td><td className="num">{eur(calc.entreAn - calc.sortAn)}</td><td /></tr></tfoot>
            </table>
          </div>
        )}
      </section>

      {modal && modal.type === "formule" && <ModalFormule o={modal.o} onClose={() => setModal(null)} onOk={() => { setModal(null); charger(); }} />}
      {modal && modal.type === "ligne" && <ModalLigne m={modal} restos={calc.lignes.map((l) => l.o)} onClose={() => setModal(null)} onOk={() => { setModal(null); charger(); }} />}
    </>
  );
}

function ModalFormule({ o, onClose, onOk }) {
  const [f, setF] = useState(o.formule || "fondateur");
  const [p, setP] = useState(o.paiement || "mensuel");
  const [debut, setDebut] = useState(o.abo_debut || iso(new Date()));
  const [offerts, setOfferts] = useState(o.mois_offerts || 0);
  const [tarif, setTarif] = useState(o.tarif != null ? String(o.tarif) : "");
  const [busy, setBusy] = useState(false);
  const prix = tarif !== "" ? Number(tarif) : FORMULES[f].prix;

  async function ok(e) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabaseBrowser().rpc("createur_abonnement", { o_id: o.id, f, p, debut, offerts: Number(offerts) || 0, t: tarif === "" ? null : Number(tarif) });
    setBusy(false);
    if (!error) onOk();
  }
  return (
    <div className="tn-back" role="dialog" aria-modal="true" aria-labelledby="mf-t" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="tn" onSubmit={ok}>
        <div className="tn-h"><h2 id="mf-t">Formule de {o.nom}</h2><button type="button" className="tn-x" onClick={onClose} aria-label="Fermer">×</button></div>
        <div className="tn-b">
          <div className="v-field"><label>Formule</label>
            <div className="tn-kinds">{Object.entries(FORMULES).map(([k, x]) => <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)}>{x.label}{x.prix ? ` · ${x.prix} €` : ""}</button>)}</div>
          </div>
          {f !== "offert" && (<>
            <div className="v-field"><label>Paiement</label>
              <div className="tn-kinds">
                <button type="button" aria-pressed={p === "mensuel"} onClick={() => setP("mensuel")}>Chaque mois</button>
                <button type="button" aria-pressed={p === "annuel"} onClick={() => setP("annuel")}>À l'année (2 mois offerts)</button>
              </div>
            </div>
            <div className="v-row">
              <div className="v-field"><label htmlFor="mf-d">Début de l'abonnement</label><input id="mf-d" type="date" value={debut} onChange={(e) => setDebut(e.target.value)} required /></div>
              <div className="v-field"><label htmlFor="mf-o">Mois offerts <small>(parrainage…)</small></label><input id="mf-o" type="number" min="0" max="120" value={offerts} onChange={(e) => setOfferts(e.target.value)} /></div>
            </div>
            <div className="v-field"><label htmlFor="mf-t2">Prix par mois <small>(vide = prix de la formule)</small></label><input id="mf-t2" type="number" min="0" step="0.01" placeholder={String(FORMULES[f].prix)} value={tarif} onChange={(e) => setTarif(e.target.value)} /></div>
            <p className="v-hint">{p === "annuel" ? `${eur(prix * 10)} par an (10 mois payés sur 12).` : `${eur(prix)} par mois.`}{Number(offerts) > 0 ? ` ${offerts} mois offert${offerts > 1 ? "s" : ""} déduit${offerts > 1 ? "s" : ""}.` : ""}</p>
          </>)}
        </div>
        <div className="tn-f"><button type="button" className="v-btn v-btn-line" onClick={onClose}>Annuler</button><button type="submit" className="v-btn v-btn-brass" disabled={busy}>{busy ? "…" : "Enregistrer"}</button></div>
      </form>
    </div>
  );
}

function ModalLigne({ m, restos, onClose, onOk }) {
  const entree = m.sens === "entree";
  const moisFr = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const [l, setL] = useState({
    date: iso(new Date()),
    montant: m.montant ? String(m.montant) : "",
    libelle: m.o ? `Abonnement ${m.o.nom} · ${moisFr}` : "",
    categorie: entree ? "Abonnement" : "Matériel",
    org_id: m.o ? m.o.id : "",
    moyen: entree ? "Virement" : "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setL({ ...l, [k]: e.target.value });

  async function ok(e) {
    e.preventDefault();
    const montant = Number(String(l.montant).replace(",", "."));
    if (!(montant > 0)) { setErr("Mets un montant."); return; }
    if (!l.libelle.trim()) { setErr("Mets un libellé (ce que c'est)."); return; }
    setBusy(true);
    const { error } = await supabaseBrowser().rpc("createur_compta_ajouter", { s: m.sens, d: l.date, m: montant, l: l.libelle, cat: l.categorie, o_id: l.org_id || null, moy: l.moyen });
    setBusy(false);
    if (error) { setErr("Pas enregistré. Réessaie."); return; }
    onOk();
  }
  return (
    <div className="tn-back" role="dialog" aria-modal="true" aria-labelledby="ml-t" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="tn" onSubmit={ok}>
        <div className="tn-h"><h2 id="ml-t">{entree ? "Nouvel encaissement" : "Nouvelle dépense"}</h2><button type="button" className="tn-x" onClick={onClose} aria-label="Fermer">×</button></div>
        <div className="tn-b">
          <div className="v-row">
            <div className="v-field"><label htmlFor="ml-m">Montant (€)</label><input id="ml-m" inputMode="decimal" value={l.montant} onChange={set("montant")} placeholder="400" autoFocus /></div>
            <div className="v-field"><label htmlFor="ml-d">Date</label><input id="ml-d" type="date" value={l.date} onChange={set("date")} /></div>
          </div>
          <div className="v-field"><label htmlFor="ml-l">Libellé</label><input id="ml-l" value={l.libelle} onChange={set("libelle")} placeholder={entree ? "Abonnement Irish Corner · novembre" : "Tablette Samsung pour l'Irish Corner"} /></div>
          <div className="v-field"><label>Catégorie</label>
            <div className="tn-kinds">{(entree ? CATS_ENTREE : CATS_SORTIE).map((c) => <button key={c} type="button" aria-pressed={l.categorie === c} onClick={() => setL({ ...l, categorie: c })}>{c}</button>)}</div>
          </div>
          <div className="v-row">
            <div className="v-field"><label htmlFor="ml-o">Resto concerné <small>(facultatif)</small></label>
              <select id="ml-o" value={l.org_id} onChange={set("org_id")}><option value="">—</option>{restos.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}</select>
            </div>
            <div className="v-field"><label htmlFor="ml-y">Moyen <small>(facultatif)</small></label><input id="ml-y" value={l.moyen} onChange={set("moyen")} placeholder={entree ? "Virement, CB, espèces…" : "CB pro"} /></div>
          </div>
          {err && <div className="v-err" role="alert">{err}</div>}
        </div>
        <div className="tn-f"><button type="button" className="v-btn v-btn-line" onClick={onClose}>Annuler</button><button type="submit" className="v-btn v-btn-brass" disabled={busy}>{busy ? "…" : "Enregistrer"}</button></div>
      </form>
    </div>
  );
}
