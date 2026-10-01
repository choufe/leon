import Link from "next/link";

export default function Home() {
  return (
    <div className="wrap">
      <div className="card">
        <img className="logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
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
          <a href="/leon/demo.html?tablette=1">📱 Tester le mode borne (tablette)</a>
          {" · "}
          <Link href="/inscription">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
