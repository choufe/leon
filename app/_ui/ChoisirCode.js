"use client";
import { useState } from "react";
import CodePad from "./CodePad";

// Choisir un code : on le tape, puis on le retape pour confirmer.
// enregistrer(code) renvoie une promesse : true si c'est enregistré.
const TROP_SIMPLES = ["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "4321", "0123"];

export default function ChoisirCode({ titre, sousTitre, enregistrer }) {
  const [premier, setPremier] = useState(null);
  const [tour, setTour] = useState(0); // force un pavé neuf à chaque étape
  const [info, setInfo] = useState("");

  if (premier === null) {
    return (
      <CodePad
        key={"a" + tour}
        titre={titre}
        sousTitre={info || sousTitre}
        onComplete={async (c) => {
          if (TROP_SIMPLES.includes(c)) return { ok: false, message: "Trop facile à deviner. Choisissez-en un autre." };
          setInfo("");
          setPremier(c);
          return { ok: true };
        }}
      />
    );
  }
  return (
    <CodePad
      key={"b" + tour}
      titre="Encore une fois"
      sousTitre="Retapez le même code pour confirmer."
      onComplete={async (c) => {
        if (c !== premier) {
          setInfo("Les deux codes étaient différents. On recommence : choisissez votre code.");
          setPremier(null);
          setTour((t) => t + 1);
          return { ok: false };
        }
        const ok = await enregistrer(c);
        return ok ? { ok: true } : { ok: false, message: "L'enregistrement n'a pas marché. Réessayez." };
      }}
      bas={<button type="button" className="v-link cp-link" onClick={() => { setPremier(null); setTour((t) => t + 1); }}>Recommencer</button>}
    />
  );
}
