import Link from "next/link";

export default function Home() {
  return (
    <div className="wrap">
      <div className="card">
        <h1>Léon</h1>
        <p className="sub">
          L’app qui pilote tes restaurants : planning, pointage, recettes,
          stocks, hygiène, chiffres. Tes données sont enregistrées en France
          et partagées en direct entre tous les appareils du restaurant.
        </p>
        <Link href="/app">
          <button className="primary">Ouvrir Léon</button>
        </Link>
        <p className="links">
          <a href="/leon/demo.html">Voir la démo (Petit Beffroi)</a>
          {" · "}
          <Link href="/inscription">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
