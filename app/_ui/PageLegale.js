import Link from "next/link";
import "../vitrine.css";

// Habillage commun des pages légales : en-tête vert, texte clair, retour à l'accueil.
export default function PageLegale({ titre, maj, children }) {
  return (
    <div className="v">
      <header className="v-top">
        <div className="v-wrap">
          <Link href="/" aria-label="Léon, accueil">
            <img className="v-logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
          </Link>
          <div className="v-top-acts">
            <Link className="v-login" href="/login">Se connecter</Link>
            <Link className="v-btn v-btn-brass v-btn-sm v-top-cta" href="/demande">Demander une démo</Link>
          </div>
        </div>
      </header>
      <main className="v-legal-page">
        <div className="v-wrap">
          <div style={{ display: "grid", gap: 8 }}>
            <Link className="v-back" href="/">← Retour à l'accueil</Link>
            <h1>{titre}</h1>
            <p className="v-hint">Dernière mise à jour : {maj}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

// Un trou à remplir par Maurice : bien visible tant que ce n'est pas fait.
export function ACompleter({ children }) {
  return <span className="v-todo">{children}</span>;
}
