"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { createLeonDb } from "../../lib/leonStore";

// L'app Léon v11 (public/leon/app.html) dans un cadre plein écran. Avant de
// l'afficher, on vérifie la connexion et on lui prête le stockage Supabase de
// l'organisation du compte (window.__leonClaude, lu par le cadre au démarrage).
export default function LeonApp() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    let db = null;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      const { data: orgId, error } = await supabase.rpc("my_org");
      if (cancelled) return;
      if (error || !orgId) {
        setErr(error?.message || "Organisation introuvable");
        return;
      }
      db = createLeonDb(supabase, orgId);
      // "Demander à Léon" : passe par /api/ask (clé Claude côté serveur).
      const ask = async (turns, opts = {}) => {
        const { data: sess } = await supabase.auth.getSession();
        const r = await fetch("/api/ask", {
          method: "POST",
          signal: opts.signal,
          headers: { "content-type": "application/json", authorization: `Bearer ${sess.session?.access_token || ""}` },
          body: JSON.stringify({ turns }),
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) {
          const e = new Error(out.error || "Erreur");
          e.code = out.code || "unavailable";
          throw e;
        }
        if (opts.onText) opts.onText({ text: out.text });
        return { text: out.text };
      };
      window.__leonClaude = {
        use: async (name) => (name === "db" ? db : name === "sample" ? ask : null),
      };
      setReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      db?.close();
      delete window.__leonClaude;
    };
  }, [router]);

  if (err) {
    return (
      <div className="wrap">
        <img className="logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
        <div className="card">
          <p className="err">{err}</p>
        </div>
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="wrap">
        <img className="logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
        <p className="sub">Chargement…</p>
      </div>
    );
  }
  return <iframe src="/leon/app.html" title="Léon" className="leon-frame" allow="clipboard-write" />;
}
