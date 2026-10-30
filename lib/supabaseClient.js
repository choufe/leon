"use client";
import { createBrowserClient } from "@supabase/ssr";

// Renvoie null quand les clés de la base ne sont pas là (ex. un lien
// d'aperçu Vercel sans variables d'environnement) : les pages affichent
// alors un message clair au lieu de planter.
let client;
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createBrowserClient(url, key);
  return client;
}
export const NO_DB_MSG = "Léon ne trouve pas sa base de données sur cette adresse. Réessayez depuis le site principal.";
