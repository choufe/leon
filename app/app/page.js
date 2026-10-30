"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, NO_DB_MSG } from "../../lib/supabaseClient";
import { createLeonDb } from "../../lib/leonStore";
import Link from "next/link";
import "../vitrine.css";

// L'app Léon v11 (public/leon/app.html) dans un cadre plein écran. Avant de
// l'afficher, on vérifie la connexion et on lui prête le stockage Supabase de
// l'organisation du compte (window.__leonClaude, lu par le cadre au démarrage).
export default function LeonApp() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    if (!supabase) { setErr(NO_DB_MSG); return; }
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
      window.__leonClaude = {
        use: async (name) => (name === "db" ? db : null),
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

  const shell = (body) => (
    <div className="v v-form-page">
      <main className="v-wrap v-login-grid one" style={{ paddingTop: 72 }}>
        <img src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} style={{ width: 170, height: "auto", justifySelf: "center" }} />
        {body}
      </main>
    </div>
  );
  if (err) {
    return shell(
      <section className="v-door-main">
        <h1>On n'arrive pas à ouvrir votre resto</h1>
        <p className="v-hint">{err === NO_DB_MSG ? err : "Votre compte est bien connecté, mais il n'est relié à aucun restaurant pour l'instant. Si ça continue, appelez Maurice."}</p>
        <Link className="v-btn v-btn-line" href="/login">Retour à la connexion</Link>
      </section>
    );
  }
  if (!ready) {
    return shell(<p style={{ textAlign: "center", color: "var(--v-side-mute)" }}>Ouverture de votre resto…</p>);
  }
  return <iframe src="/leon/app.html" title="Léon" className="leon-frame" allow="clipboard-write" />;
}
