// Léon 14.06 — « Relier une tablette » : la tablette ouvre le lien perso fait par le patron.
// Le lien (30 minutes, une seule fois) crée un compte « tablette » rattaché à ce resto seulement,
// et renvoie de quoi s'y connecter. Pas besoin d'être connecté : le code du lien suffit.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const hasard = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erreur: "Méthode non autorisée." }, 405);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch (_) { return json({ erreur: "Demande illisible." }, 400); }
  const code = String(b.code || "").trim();
  const nom = String(b.nom || "Tablette du resto").trim().slice(0, 60);
  if (!/^[0-9a-f]{36}$/.test(code)) return json({ erreur: "Ce lien n'est pas bon. Demande un nouveau lien au patron." }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // 1. Le lien : encore valable et jamais utilisé ? On le « consomme » tout de suite.
  const { data: lien } = await admin.from("leon_tablette_liens").update({ utilise_le: new Date().toISOString() })
    .eq("code", code).is("utilise_le", null).gt("expire", new Date().toISOString())
    .select("org_id, cree_par").maybeSingle();
  if (!lien) return json({ erreur: "Ce lien a expiré ou a déjà servi. Demande un nouveau lien au patron (Réglages → La tablette du resto)." }, 410);

  const { data: org } = await admin.from("orgs").select("id, name, supprime_le").eq("id", lien.org_id).maybeSingle();
  if (!org || org.supprime_le) return json({ erreur: "Ce resto n'est plus actif." }, 410);

  // 2. Le compte de la tablette (adresse technique, jamais utilisée pour des mails).
  // LEON_DOMAINE_TABLETTES : à régler sur un nom de domaine qui appartient à Léon dès qu'il est choisi (AUDIT S11).
  const email = `tablette-${hasard(6)}@${Deno.env.get("LEON_DOMAINE_TABLETTES") || "tablettes.leon-app.fr"}`;
  const password = hasard(24);
  const { data: u, error: errU } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { tablette: true, resto: org.name } });
  if (errU || !u?.user) return json({ erreur: "La tablette n'a pas pu être reliée. Réessaie avec un nouveau lien." }, 500);

  const { error: errT } = await admin.from("leon_tablettes").insert({ user_id: u.user.id, org_id: org.id, nom, cree_par: lien.cree_par });
  if (errT) {
    await admin.auth.admin.deleteUser(u.user.id).catch(() => {});
    return json({ erreur: "La tablette n'a pas pu être reliée. Réessaie avec un nouveau lien." }, 500);
  }
  return json({ ok: true, email, password, resto: org.name });
});
