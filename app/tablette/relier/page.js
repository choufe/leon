"use client";
// 14.06 — La tablette ouvre le lien perso fait par le patron : elle reçoit son propre compte,
// rattaché à ce resto seulement, puis file sur l'écran des codes.
import { useEffect, useState } from "react";
import { supabaseBrowser, NO_DB_MSG } from "../../../lib/supabaseClient";
import "../../vitrine.css";
import "../../comptes.css";

export default function RelierTablette() {
  const [etat, setEtat] = useState({ t: "Je relie la tablette…", ok: null });
  useEffect(() => {
    const supabase = supabaseBrowser();
    if (!supabase) { setEtat({ t: NO_DB_MSG, ok: false }); return; }
    (async () => {
      const code = new URLSearchParams(window.location.search).get("c") || "";
      const { data, error } = await supabase.functions.invoke("relier-tablette", { body: { code } });
      if (error || !data || !data.ok) {
        let m = "Ce lien a expiré ou a déjà servi. Demande un nouveau lien au patron.";
        try { const j = await error?.context?.json(); if (j && j.erreur) m = j.erreur; } catch (_) {}
        if (data && data.erreur) m = data.erreur;
        setEtat({ t: m, ok: false });
        return;
      }
      await supabase.auth.signOut().catch(() => {});
      const { error: e2 } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (e2) { setEtat({ t: "La tablette n'a pas pu se connecter. Réessaie avec un nouveau lien.", ok: false }); return; }
      try { localStorage.removeItem("leon:tablette:resto"); localStorage.setItem("leon:tablette:reliee", "1"); } catch (_) {}
      setEtat({ t: `C'est fait : cette tablette est celle de ${data.resto}.`, ok: true });
      setTimeout(() => window.location.replace("/tablette"), 1500);
    })();
  }, []);
  return (
    <div className="v v-form-page">
      <main className="v-wrap v-login-grid one" style={{ paddingTop: 72 }}>
        <img src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} style={{ width: 170, height: "auto", justifySelf: "center" }} />
        <div className="v-login-form" style={{ textAlign: "center", display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 26 }}>Tablette du resto</h1>
          <p style={{ margin: 0 }}>{etat.t}</p>
          {etat.ok === true && <p className="v-hint">Pense à l'ajouter sur l'écran d'accueil : Partager → « Sur l'écran d'accueil ».</p>}
        </div>
      </main>
    </div>
  );
}
