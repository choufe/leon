"use client";
import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";

// 15.03 · La connexion ne saute plus au bout d'une semaine.
// La session Supabase est rangée dans des cookies (le serveur en a besoin pour les pages
// réservées au créateur). Mais sur iPhone / iPad, Safari efface au bout de 7 jours les cookies
// écrits par la page. Résultat avant : après une semaine sans ouvrir Léon, on était déconnecté
// et on retombait sur le site. Maintenant on garde aussi une copie de la session dans l'appareil
// (localStorage, que l'appli de l'écran d'accueil garde) et on remet les cookies si Safari les a effacés.
const COPIE = "leon:session";
const estSession = (nom) => /^sb-.*-auth-token/.test(nom);

function lireCopie() {
  try { return JSON.parse(localStorage.getItem(COPIE) || "{}") || {}; } catch (_) { return {}; }
}
function ecrireCopie(c) {
  try {
    if (Object.keys(c).length) localStorage.setItem(COPIE, JSON.stringify(c));
    else localStorage.removeItem(COPIE);
  } catch (_) {}
}
const OPTIONS = { path: "/", sameSite: "lax", maxAge: 400 * 24 * 60 * 60 };

const cookies = {
  getAll() {
    const tous = parse(document.cookie || "");
    const liste = Object.keys(tous).map((name) => ({ name, value: tous[name] }));
    if (liste.some((c) => estSession(c.name))) return liste;
    // Plus de cookie de session : Safari l'a peut-être effacé. On reprend la copie.
    const copie = lireCopie();
    Object.keys(copie).forEach((name) => {
      document.cookie = serialize(name, copie[name], OPTIONS);
      liste.push({ name, value: copie[name] });
    });
    return liste;
  },
  setAll(liste) {
    const copie = lireCopie();
    liste.forEach(({ name, value, options }) => {
      document.cookie = serialize(name, value, options || OPTIONS);
      if (!estSession(name)) return;
      const efface = !value || (options && (options.maxAge === 0 || (options.expires && new Date(options.expires) <= new Date())));
      if (efface) delete copie[name];
      else copie[name] = value;
    });
    ecrireCopie(copie);
  },
};

// Renvoie null quand les clés de la base ne sont pas là (ex. un lien
// d'aperçu Vercel sans variables d'environnement) : les pages affichent
// alors un message clair au lieu de planter.
let client;
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createBrowserClient(url, key, { cookies, cookieOptions: OPTIONS });
  return client;
}
export const NO_DB_MSG = "Léon ne trouve pas sa base de données sur cette adresse. Réessayez depuis le site principal.";
