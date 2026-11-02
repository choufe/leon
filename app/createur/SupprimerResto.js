"use client";
import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabaseClient";
import CodePad from "../_ui/CodePad";

// Supprimer un resto en 2 temps : « Tu es sûr ? », puis le 2e code du créateur.
// Rien n'est effacé : le resto est mis de côté et peut être récupéré.
export default function SupprimerResto({ r, onClose, onFait }) {
  const [etape, setEtape] = useState(0);
  return (
    <div className="tn-back" role="dialog" aria-modal="true" aria-labelledby="sr-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tn">
        <div className="tn-h">
          <h2 id="sr-title">Supprimer {r.nom} ?</h2>
          <button type="button" className="tn-x" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div className="tn-b">
          {etape === 0 ? (
            <>
              <div className="sr-warn">
                <b>Ce qui va se passer</b>
                <ul>
                  <li>{r.patron_prenom || "Le patron"} et son équipe ne pourront plus entrer dans ce Léon.</li>
                  <li>Le resto disparaît de ta liste et passe dans « Supprimés ».</li>
                  <li><b>Rien n'est effacé</b> : planning, pointages, stocks, hygiène… tout est gardé. Tu peux le récupérer quand tu veux.</li>
                </ul>
              </div>
              <div className="sr-acts">
                <button type="button" className="v-btn v-btn-line" onClick={onClose}>Non, je garde</button>
                <button type="button" className="v-btn sr-danger" onClick={() => setEtape(1)}>Oui, supprimer</button>
              </div>
            </>
          ) : (
            <CodePad
              titre="Tape ton code pour confirmer"
              sousTitre={`Dernière vérification avant de supprimer ${r.nom}.`}
              onComplete={async (c) => {
                const { data, error } = await supabaseBrowser().rpc("createur_supprimer_resto", { o_id: r.id, pin: c });
                if (error) return { ok: false, message: "Pas de connexion. Réessaie." };
                if (data?.ok) { onFait(); return { ok: true }; }
                return { ok: false, attente: data?.attente || 0 };
              }}
              bas={<button type="button" className="v-link cp-link" onClick={onClose}>Annuler</button>}
            />
          )}
        </div>
      </div>
    </div>
  );
}
