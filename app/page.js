import Link from "next/link";

export default function Home() {
  return (
    <div className="wrap home">
      <img className="logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
      <p className="tagline">Ton resto, piloté.</p>
      <p className="sub">
        Planning, pointage, stocks, hygiène, chiffres. Tout au même endroit,
        sur tous les appareils du restaurant.
      </p>

      <Link href="/app" className="door door-main">
        <span className="door-ic" aria-hidden="true">🔑</span>
        <span className="door-t">
          <b>Entrer dans mon resto</b>
          <small>Connexion avec ton e-mail</small>
        </span>
      </Link>

      <a href="/leon/demo.html" className="door">
        <span className="door-ic" aria-hidden="true">👀</span>
        <span className="door-t">
          <b>Essayer la démo</b>
          <small>Sans compte, avec un resto fictif</small>
        </span>
      </a>

      <p className="foot">
        <a href="/leon/demo.html?tablette=1">Mode borne (tablette)</a>
      </p>
    </div>
  );
}
