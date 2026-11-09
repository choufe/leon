"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, NO_DB_MSG } from "../../lib/supabaseClient";
import { createLeonDb } from "../../lib/leonStore";
import Link from "next/link";
import CodePad from "../_ui/CodePad";
import { estDeverrouille, marquerDeverrouille, oublierDeverrouillage } from "../_ui/verrou";
import "../vitrine.css";
import "../comptes.css";

// L'app Léon v11 (public/leon/app.html) dans un cadre plein écran. Avant de
// l'afficher, on vérifie la connexion et on lui prête le stockage Supabase de
// l'organisation du compte (window.__leonClaude, lu par le cadre au démarrage).
export default function LeonApp() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [verrou, setVerrou] = useState(null); // null | { prenom, email } : code à taper
  const [aide, setAide] = useState(false); // le créateur est dans le Léon d'un patron
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    if (!supabase) { setErr(NO_DB_MSG); return; }
    let db = null;
    let cancelled = false;
    (async () => {
      // /tablette = la tablette du resto : elle reste sur l'écran des codes, sans retour vers le PC ou le téléphone.
      const tablette = window.location.pathname.startsWith("/tablette");
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace(tablette ? "/login?tablette=1" : "/login");
        return;
      }
      // Le créateur qui entre chez un patron pour l'aider : /app?resto=<id>.
      let resto = new URLSearchParams(window.location.search).get("resto");
      if (tablette) {
        try {
          if (resto) localStorage.setItem("leon:tablette:resto", resto);
          else resto = localStorage.getItem("leon:tablette:resto");
        } catch (_) {}
      }
      let orgId = null;
      if (resto) {
        const { data: peut } = await supabase.rpc("createur_peut_aider", { o_id: resto });
        if (cancelled) return;
        if (!peut) {
          if (tablette) { try { localStorage.removeItem("leon:tablette:resto"); } catch (_) {} }
          else { router.replace("/createur"); return; }
        } else {
        orgId = resto;
        setAide(!tablette);
        const { data: liste } = await supabase.rpc("createur_restos");
        const o = (liste || []).find((x) => x.id === resto);
        window.__leonCompte = { prenom: (o && !o.test && o.patron_prenom) || "Maurice", resto: o && o.nom, ville: o && o.ville };
        }
      }
      if (!orgId && !tablette) {
        // 14.06 : un compte « tablette » n'ouvre jamais l'appli du patron.
        const { data: estTab, error: eTab } = await supabase.rpc("suis_tablette");
        if (cancelled) return;
        if (!eTab && estTab) { router.replace("/tablette"); return; }
      }
      if (!orgId) {
        // Le créateur n'a rien à faire ici sans resto choisi : direction son espace (2e code, liste des restos).
        // /app?moi=1 = il entre volontairement dans son propre resto depuis /createur.
        if (!new URLSearchParams(window.location.search).get("moi") && !tablette) {
          const { data: createur } = await supabase.rpc("devenir_createur");
          if (cancelled) return;
          if (createur) { router.replace("/createur"); return; }
        }
        // Code à 4 chiffres pour rouvrir l'appli (comptes qui en ont un).
        const { data: aCode } = await supabase.rpc("mon_code_existe");
        if (cancelled) return;
        if (aCode && !estDeverrouille() && !tablette) {
          const { data: a } = await supabase.rpc("mon_accueil");
          if (cancelled) return;
          await new Promise((resolve) => setVerrou({ prenom: a && a.prenom, email: data.user.email, resolve }));
          if (cancelled) return;
          setVerrou(null);
        }
        const r = await supabase.rpc("my_org");
        if (cancelled) return;
        if (r.error || !r.data) {
          setErr(r.error?.message || "Organisation introuvable");
          return;
        }
        orgId = r.data;
        // Ce que l'app a besoin de savoir pour entrer directement (sans ses vieux écrans de compte).
        const { data: acc } = await supabase.rpc("mon_accueil");
        if (cancelled) return;
        if (acc && acc.ferme) { setErr("Ce Léon est fermé. Pour le rouvrir, appelez Maurice au 06 45 86 90 03."); return; }
        const mail = data.user.email || "";
        const prenom = (acc && acc.prenom) || mail.split("@")[0].split(/[._-]/)[0];
        window.__leonCompte = {
          prenom: prenom ? prenom.charAt(0).toUpperCase() + prenom.slice(1) : "",
          resto: acc && acc.resto && !acc.resto.includes("@") ? acc.resto : "Mon restaurant",
        };
        // Salarié invité par son patron : il entre dans le Léon de son resto, avec sa vue à lui.
        const { data: sal } = await supabase.rpc("mon_salarie");
        if (cancelled) return;
        if (sal && sal.emp_id && tablette) { setErr("TABLETTE_SALARIE"); return; }
        if (sal && sal.emp_id) {
          window.__leonCompte = { salarie: true, empId: sal.emp_id, resto: sal.resto || "", prenom: "" };
        }
      }
      if (tablette) window.__leonCompte = { ...(window.__leonCompte || {}), tablette: true };
      db = createLeonDb(supabase, orgId, { salarie: !!(window.__leonCompte && window.__leonCompte.salarie) });
      window.__leonClaude = {
        use: async (name) => (name === "db" ? db : null),
      };
      // Le patron invite un salarié : Léon fait un lien à envoyer par SMS / WhatsApp.
      window.__leonInviter = async (empId, prenom) => {
        const { data, error } = await supabase.rpc("inviter_salarie", { e_id: empId, e_prenom: prenom || "" });
        if (error || !data) throw new Error((error && error.message) || "invitation impossible");
        return `${window.location.origin}/rejoindre?c=${data}`;
      };
      // 14.08 : Léon répond aux questions avec Claude (fonction serveur leon-ia).
      window.__leonIA = async (messages) => {
        const { data, error } = await supabase.functions.invoke("leon-ia", { body: { messages } });
        if (error) throw error;
        return data;
      };
      // 14.06 : relier la tablette du resto par un lien perso (30 min, une seule fois).
      window.__leonLienTablette = async () => {
        const { data, error } = await supabase.rpc("creer_lien_tablette", { o_id: orgId });
        if (error || !data) throw new Error((error && error.message) || "lien impossible");
        return `${window.location.origin}/tablette/relier?c=${data}`;
      };
      window.__leonTablettes = async () => {
        const { data, error } = await supabase.rpc("mes_tablettes", { o_id: orgId });
        if (error) throw error;
        return data || [];
      };
      window.__leonDelierTablette = async (u) => {
        const { error } = await supabase.rpc("delier_tablette", { u });
        if (error) throw error;
        return true;
      };
      window.__leonConnectes = async () => {
        const { data, error } = await supabase.rpc("mes_salaries_connectes");
        if (error) throw error; // base pas encore prête : le bouton « Inviter » reste caché
        return (data || []).map((x) => x.emp_id);
      };
      setReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { oublierDeverrouillage(); router.replace("/login"); }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      db?.close();
      delete window.__leonClaude;
      delete window.__leonInviter;
      delete window.__leonConnectes;
      delete window.__leonLienTablette;
      delete window.__leonIA;
      delete window.__leonTablettes;
      delete window.__leonDelierTablette;
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
  if (verrou) {
    return (
      <div className="v v-form-page">
        <main className="cx-solo">
          <div className="cx-card">
            <img className="cx-logo" src="/brand/leon-logo-vert.png" alt="Léon" width={720} height={241} />
            <CodePad
              titre={verrou.prenom ? `Bonjour ${verrou.prenom}` : "Bonjour"}
              sousTitre="Tapez votre code pour ouvrir Léon."
              onComplete={async (c) => {
                const { data, error } = await supabaseBrowser().rpc("verifier_mon_code", { pin: c });
                if (error) return { ok: false, message: "Pas de connexion. Réessayez." };
                if (data?.ok) { marquerDeverrouille(); verrou.resolve(); return { ok: true }; }
                return { ok: false, attente: data?.attente || 0 };
              }}
              bas={
                <button type="button" className="v-link cp-link" onClick={async () => { oublierDeverrouillage(); await supabaseBrowser().auth.signOut(); router.replace("/login"); }}>
                  Code oublié ? Se reconnecter avec le mot de passe
                </button>
              }
            />
          </div>
        </main>
      </div>
    );
  }
  if (err) {
    return shell(
      <section className="v-door-main">
        <h1>On n'arrive pas à ouvrir votre resto</h1>
        <p className="v-hint">{err === "TABLETTE_SALARIE" ? "La tablette du resto se connecte avec le compte du patron, pas celui d'un salarié." : err === NO_DB_MSG ? err : "Votre compte est bien connecté, mais il n'est relié à aucun restaurant pour l'instant. Si ça continue, appelez Maurice."}</p>
        <Link className="v-btn v-btn-line" href="/login">Retour à la connexion</Link>
      </section>
    );
  }
  if (!ready) {
    return shell(<p style={{ textAlign: "center", color: "var(--v-side-mute)" }}>Ouverture de votre resto…</p>);
  }
  return (
    <>
      <iframe src="/leon/app.html" title="Léon" className="leon-frame" allow="clipboard-write" />
      {aide && (
        <a href="/createur" className="aide-pill">Mode aide · Revenir à mes restos</a>
      )}
    </>
  );
}
