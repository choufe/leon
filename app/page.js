import Link from "next/link";

export default function Home() {
  return (
    <div className="wrap">
      <div className="card">
        <h1>Léon</h1>
        <p className="sub">
          Version en construction, connectée à une vraie base de données
          (Supabase). Les fonctionnalités visibles ici sont les premières
          briques de la vraie version — la démo complète reste sur les
          artifacts Claude en attendant que tout soit porté ici.
        </p>
        <Link href="/login">
          <button className="primary">Se connecter</button>
        </Link>
      </div>
    </div>
  );
}
