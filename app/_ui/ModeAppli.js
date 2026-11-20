"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// 15.03 · Dans l'appli de l'écran d'accueil, on ne tombe jamais sur le site vitrine.
// Si l'appli se retrouve sur une page du site (accueil, demande de démo…), elle repart
// direct dans Léon (qui renvoie vers la connexion si besoin). Rien ne change dans un navigateur normal.
const SITE = ["/", "/demande", "/mentions-legales", "/confidentialite"];

export function enAppli() {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.navigator.standalone === true
    );
  } catch (_) {
    return false;
  }
}

export default function ModeAppli() {
  const chemin = usePathname();
  useEffect(() => {
    if (!enAppli()) return;
    document.documentElement.classList.add("en-appli");
    if (SITE.includes(chemin)) {
      // Un lien de mail qui atterrit sur l'accueil (code, jeton) est géré par RetourMail : on n'y touche pas.
      const q = window.location.search + window.location.hash;
      if (/code=|access_token|type=/.test(q)) return;
      window.location.replace("/app");
    }
  }, [chemin]);
  return null;
}
