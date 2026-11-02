"use client";
import { useEffect } from "react";

// Si un lien de mail Supabase (confirmation, invitation, mot de passe) atterrit sur l'accueil,
// on renvoie vers la bonne page au lieu de laisser la personne sur la vitrine sans rien comprendre.
export default function RetourMail() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const type = h.get("type") || q.get("type");
    if (type === "invite") { window.location.replace("/bienvenue" + window.location.search + window.location.hash); return; }
    if (type === "recovery") { window.location.replace("/login/nouveau" + window.location.search + window.location.hash); return; }
    if (q.get("code") || h.get("access_token") || type === "signup" || h.get("error_description")) {
      window.location.replace("/login?confirme=1" + (q.get("code") ? "&code=" + encodeURIComponent(q.get("code")) : "") + window.location.hash);
    }
  }, []);
  return null;
}
