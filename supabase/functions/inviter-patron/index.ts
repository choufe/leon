// Léon 11.08 — « Créer et inviter » : crée le resto et envoie l'invitation au patron.
// Seul le créateur (mot de passe + 2e code validé) peut l'appeler.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Adresses autorisées pour le lien du mail (site Léon et ses aperçus Vercel).
function origineSure(o: unknown): string | null {
  if (typeof o !== "string") return null;
  try {
    const u = new URL(o);
    if (u.protocol === "http:" && u.hostname === "localhost") return u.origin;
    if (u.protocol !== "https:") return null;
    if (/^leon[a-z0-9-]*\.vercel\.app$/.test(u.hostname)) return u.origin;
    const extra = (Deno.env.get("LEON_DOMAINES") || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (extra.includes(u.hostname)) return u.origin;
  } catch (_) { /* adresse invalide */ }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erreur: "Méthode non autorisée." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization") || "";

  // 1. Qui appelle ? Il faut être créateur avec le 2e code validé.
  const moi = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: ok, error: errC } = await moi.rpc("est_createur");
  if (errC || ok !== true) return json({ erreur: "Réservé au créateur. Retapez votre code." }, 403);

  // 2. Ce qu'on a reçu.
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch (_) { return json({ erreur: "Demande illisible." }, 400); }
  const nom = String(b.nom || "").trim().slice(0, 80);
  const ville = String(b.ville || "").trim().slice(0, 60);
  const kind = ["restaurant", "bar", "brasserie", "boite", "rapide", "autre"].includes(String(b.kind)) ? String(b.kind) : "restaurant";
  const prenom = String(b.prenom || "").trim().slice(0, 60);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 120);
  const origine = origineSure(b.origine);
  if (!nom) return json({ erreur: "Il manque le nom du resto." }, 400);
  if (!prenom) return json({ erreur: "Il manque le prénom du patron." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ erreur: "L'e-mail du patron n'a pas l'air bon." }, 400);

  const admin = createClient(url, service, { auth: { persistSession: false } });

  // 3. Invitation : Supabase crée le compte et envoie le mail « choisissez votre mot de passe ».
  const { data: inv, error: errI } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: origine ? `${origine}/bienvenue` : undefined,
    data: { prenom, resto: nom },
  });
  if (errI || !inv?.user) {
    const m = errI?.message || "";
    if (/already been registered|already exists/i.test(m)) return json({ erreur: "Cette adresse a déjà un compte Léon." }, 409);
    if (/rate limit/i.test(m)) return json({ erreur: "Trop de mails envoyés d'un coup. Réessayez dans une heure (limite du service d'envoi actuel)." }, 429);
    return json({ erreur: "Le mail d'invitation n'est pas parti. Réessayez dans un instant." }, 500);
  }

  // 4. Le resto, relié au patron, avec 15 jours d'aide pour le créateur.
  const now = new Date();
  const { data: org, error: errO } = await admin.from("orgs").insert({
    name: nom, ville: ville || null, kind, patron_prenom: prenom, patron_email: email,
    statut: "invite", owner_user_id: inv.user.id, invite_le: now.toISOString(),
    aide_jusqu: new Date(now.getTime() + 15 * 86400000).toISOString(),
  }).select("id, name").single();
  if (errO) {
    await admin.auth.admin.deleteUser(inv.user.id).catch(() => {});
    return json({ erreur: "Le resto n'a pas pu être créé. Ignorez le mail reçu par le patron et réessayez." }, 500);
  }
  return json({ ok: true, resto: org });
});
