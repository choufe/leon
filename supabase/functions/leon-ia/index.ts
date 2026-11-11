// Léon 14.08 — « Demander à Léon » / « L'avis de Léon » : la question part ici, Léon répond avec Claude.
// Il faut être connecté à un resto actif (patron, direction, tablette ou salarié) : vérifié par leon_ia_ticket (migration 0012).
// La clé de l'API Claude est un secret du projet Supabase : ANTHROPIC_API_KEY (à mettre par Maurice).
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erreur: "Méthode non autorisée." }, 405);
  const cle = Deno.env.get("ANTHROPIC_API_KEY");
  if (!cle) return json({ erreur: "L'assistant n'est pas encore branché.", code: "pas_configure" }, 200);

  // 1. Qui demande ? Un compte connecté, rattaché à un resto.
  const moi = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
  const { data: u } = await moi.auth.getUser();
  if (!u?.user) return json({ erreur: "Connecte-toi pour parler à Léon.", code: "non_connecte" }, 401);

  // 1 bis. Le compte doit appartenir à un resto actif, et rester sous la limite du jour
  // (60 questions par compte, 400 par resto) : la clé de l'API est payante.
  let corps: Record<string, unknown> = {};
  try { corps = await req.json(); } catch (_) { return json({ erreur: "Demande illisible." }, 400); }
  const org = typeof corps.org === "string" && /^[0-9a-f-]{36}$/.test(corps.org) ? corps.org : null;
  const { data: ticket, error: errT } = await moi.rpc("leon_ia_ticket", { o_id: org });
  if (errT || !ticket?.ok) {
    if (ticket?.raison === "limite") return json({ erreur: "On a beaucoup discuté aujourd'hui. Je reprends les questions libres demain.", code: "limite" }, 200);
    return json({ erreur: "Ce compte n'est relié à aucun restaurant.", code: "pas_de_resto" }, 403);
  }

  // 2. La conversation (le 1er message contient les données du resto, préparées par l'appli).
  const b = corps;
  const brut = Array.isArray(b.messages) ? b.messages : [];
  const messages = brut.slice(-10).map((m: any) => ({
    role: m && m.role === "assistant" ? "assistant" : "user",
    content: String((m && m.content) || "").slice(0, 24000),
  })).filter((m) => m.content);
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length) return json({ erreur: "Pas de question." }, 400);

  // 3. Claude répond.
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": cle, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("LEON_MODELE") || "claude-sonnet-5-5",
      max_tokens: 700,
      system: "Tu es Léon, l'assistant d'un outil de gestion de restaurant français. Tu parles comme un directeur de restaurant expérimenté et bienveillant : direct, concret, logique, en tutoyant. Ton but : faire gagner de l'argent et du temps au restaurant (marge, pertes, masse salariale, commandes justes), sans jamais mettre l'équipe ou les clients en difficulté. Appuie-toi sur les données fournies ; si une donnée manque, dis-le et propose comment l'obtenir. Respecte le droit du travail (HCR) et les règles d'hygiène. Réponds en français, court, avec des chiffres quand c'est possible.",
      messages,
    }),
  });
  if (!r.ok) {
    const code = r.status === 429 ? "rate_limited" : "erreur_ia";
    return json({ erreur: r.status === 429 ? "Je suis très sollicité, réessaie dans un moment." : "Je n'arrive pas à répondre pour l'instant.", code }, 200);
  }
  const d = await r.json();
  const text = (d.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n").trim();
  return json({ ok: true, text: text || "Je n'ai pas de réponse claire. Reformule ta question ?" });
});
