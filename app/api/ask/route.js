// "Demander à Léon" : appelle l'API Claude côté serveur (la clé reste secrète).
// Réservé aux comptes connectés (jeton Supabase dans l'en-tête Authorization).
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
const MAX_TURNS = 12;
const MAX_CHARS = 60000;

// Petite limite par compte (en mémoire) : 30 questions par 10 minutes.
const hits = new Map();
function tooMany(uid) {
  const now = Date.now();
  const list = (hits.get(uid) || []).filter((t) => now - t < 600000);
  list.push(now);
  hits.set(uid, list);
  return list.length > 30;
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function POST(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ code: "not_granted", error: "Assistant non configuré" }, 503);

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ code: "not_granted", error: "Connexion requise" }, 401);
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: u, error: uerr } = await supabase.auth.getUser(token);
  if (uerr || !u?.user) return json({ code: "not_granted", error: "Connexion requise" }, 401);
  if (tooMany(u.user.id)) return json({ code: "rate_limited", error: "Trop de questions" }, 429);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ code: "invalid", error: "Requête invalide" }, 400);
  }
  const turns = (Array.isArray(body?.turns) ? body.turns : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content)
    .slice(-MAX_TURNS);
  if (!turns.length || turns[0].role !== "user") return json({ code: "invalid", error: "Requête invalide" }, 400);
  if (turns.reduce((n, m) => n + m.content.length, 0) > MAX_CHARS) return json({ code: "invalid", error: "Requête trop longue" }, 413);

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1200, messages: turns }),
  });
  if (r.status === 429) return json({ code: "rate_limited", error: "Trop sollicité" }, 429);
  if (!r.ok) return json({ code: "unavailable", error: "Assistant indisponible" }, 502);
  const out = await r.json();
  const text = (out.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return json({ text });
}
