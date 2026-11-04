import Link from "next/link";
import "./vitrine.css";
import RetourMail from "./_ui/RetourMail";

export const metadata = {
  title: "Léon · la gestion de restaurant qui vous prévient avant vous",
  description:
    "Planning, pointage, stocks, hygiène et chiffres au même endroit. Léon garde un œil sur votre restaurant, même quand vous n'y êtes pas.",
};

const ICONS = {
  masse: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></svg>
  ),
  march: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></svg>
  ),
  pap: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 14.6V5a2 2 0 1 0-4 0v9.6a4 4 0 1 0 4 0z" /><path d="M12 9v7" /></svg>
  ),
  poche: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M10.5 18.5h3" /><path d="m9.5 10 2 2 3.5-4" /></svg>
  ),
};

const POINTS = [
  {
    k: "masse", c: "var(--v-masse)", t: "Masse salariale maîtrisée",
    p: "Le bon nombre de personnes au bon moment, sans dépasser votre budget.",
    l: [
      "Un planning qui respecte les règles HCR et votre objectif de masse salariale",
      "Une badgeuse sur la tablette du resto : chacun tape son code, c'est pointé",
      "Les heures du mois prêtes pour votre comptable",
    ],
  },
  {
    k: "march", c: "var(--v-march)", t: "La marchandise ne fuit plus",
    p: "Vous savez ce que coûte chaque plat et où part votre marchandise.",
    l: [
      "Fiches techniques avec coût matière et marge au centime",
      "Commandes conseillées et réception vérifiée produit par produit",
      "Inventaire et pertes, avec l'écart en euros",
    ],
  },
  {
    k: "pap", c: "var(--v-pap)", t: "La paperasse au minimum",
    p: "L'hygiène et la traçabilité, sans classeur ni papier perdu.",
    l: [
      "Relevés de températures guidés et archivés",
      "Étiquettes DLC imprimées en un clic",
      "Un dossier prêt le jour du contrôle sanitaire",
    ],
  },
  {
    k: "poche", c: "var(--v-poche)", t: "Le resto dans la poche",
    p: "Un coup d'œil sur le téléphone, et vous savez si tout va bien.",
    l: [
      "Un écran « Aujourd'hui » : tout va bien, ou le seul point à régler",
      "Les problèmes qui reviennent, repérés et triés par urgence",
      "Tous vos établissements au même endroit",
    ],
  },
];

const FAQ = [
  {
    q: "Est-ce qu'il faut acheter du matériel ?",
    r: "Une tablette pour la borne du resto et une petite imprimante d'étiquettes. Si vous en avez déjà, on vérifie ensemble qu'elles marchent avec Léon. Sinon, je les achète pour vous au prix coûtant : le matériel est à vous, pas de location.",
  },
  {
    q: "Mon équipe ne lit pas bien le français, ça marche quand même ?",
    r: "Oui. Chaque salarié choisit sa langue (français, anglais, arabe, portugais, espagnol, tamoul) et l'écran de la borne parle surtout en icônes : badger, voir son planning, imprimer une étiquette.",
  },
  {
    q: "Mes salariés peuvent pointer depuis leur téléphone ?",
    r: "Non, et c'est voulu. On pointe uniquement sur la tablette du resto, avec son code perso à 4 chiffres. Personne ne peut badger depuis chez lui ou à la place d'un collègue.",
  },
  {
    q: "Léon remplace ma caisse ?",
    r: "Non. Votre caisse continue de prendre les commandes. Léon s'occupe de tout le reste : l'équipe, la marchandise, l'hygiène et le suivi. On regarde ensemble si votre caisse peut lui envoyer vos ventes pour suivre le chiffre en direct.",
  },
  {
    q: "Combien de temps pour démarrer ?",
    r: "Léon vous guide écran par écran : le resto, l'équipe, la carte, les produits, la tablette et l'imprimante. Et je vous accompagne personnellement pendant les deux premières semaines.",
  },
  {
    q: "J'ai plusieurs établissements.",
    r: "Chaque établissement a son Léon complet, et vous les voyez tous au même endroit depuis votre téléphone ou votre ordinateur.",
  },
  {
    q: "Où sont mes données ?",
    r: "Hébergées en France, à Paris. Elles sont à vous et ne sont ni revendues ni partagées. Pas de biométrie pour la badgeuse.",
  },
];

const CLIPS = [
  { f: "clip-equipe", c: "#6E9EDB", t: "Équipe", d: "Le planning qui se remplit, la borne qui repère les retards, chacun dans sa langue." },
  { f: "clip-hygiene", c: "#2DB5A1", t: "Hygiène", d: "Les frigos surveillés et les étiquettes DLC imprimées en un clic." },
  { f: "clip-chiffres", c: "#E0AE4E", t: "Chiffres", d: "Les marges au centime, et les problèmes repérés avant qu'ils coûtent cher." },
];

export default function Vitrine() {
  return (
    <div className="v">
      <RetourMail />
      <header className="v-top">
        <div className="v-wrap">
          <Link href="/" aria-label="Léon, accueil">
            <img className="v-logo" src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} />
          </Link>
          <nav className="v-nav" aria-label="Sections">
            <a href="#promesses">Ce que fait Léon</a>
            <a href="#comment">Comment ça marche</a>
            <a href="#histoire">Qui suis-je</a>
            <a href="#offre">L'offre</a>
            <a href="#questions">Questions</a>
          </nav>
          <div className="v-top-acts">
            <Link className="v-login" href="/login">Se connecter</Link>
            <Link className="v-btn v-btn-brass v-btn-sm v-top-cta" href="/demande">Demander une démo</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="v-hero">
          <div className="v-wrap">
            <div className="v-hero-txt">
              <span className="v-eyebrow" style={{ color: "var(--v-pop)" }}>Pour les restaurateurs</span>
              <h1>Léon garde un œil sur votre restaurant, même quand vous n'y êtes pas.</h1>
              <p className="v-lead">
                Planning, pointage, stocks, hygiène et chiffres au même endroit. Léon vous prévient avant que ça devienne un vrai problème.
              </p>
              <div className="v-ctas">
                <Link className="v-btn v-btn-brass" href="/demande">Demander une démo</Link>
                <a className="v-btn v-btn-ghost" href="tel:+33645869003">Appeler Maurice</a>
              </div>
              <p className="v-note"><i aria-hidden="true" />En test dans un restaurant à Lille</p>
            </div>
            <figure className="v-film">
              <div className="v-film-frame">
                <video controls playsInline preload="metadata" poster="/media/film.jpg" aria-label="Le film de Léon, une minute">
                  <source src="/media/film.mp4" type="video/mp4" />
                </video>
              </div>
              <figcaption><b>Le film</b> · 1 minute</figcaption>
            </figure>
          </div>
        </section>

        <section className="v-sec" id="promesses">
          <div className="v-wrap">
            <div className="v-head">
              <span className="v-eyebrow" style={{ color: "var(--v-brass)" }}>Ce que fait Léon</span>
              <h2>Quatre choses qui changent la vie d'un patron</h2>
              <p>Peu d'outils, mais chacun pensé pour le terrain. L'équipe badge et suit son planning dans sa langue, vous pilotez le reste.</p>
            </div>
            <div className="v-points">
              {POINTS.map((x) => (
                <article key={x.k} className="v-point" style={{ "--c": x.c }}>
                  <div className="v-point-h">
                    <span className="v-chip">{ICONS[x.k]}</span>
                    <h3>{x.t}</h3>
                  </div>
                  <p className="v-promise">{x.p}</p>
                  <ul>{x.l.map((y) => <li key={y}>{y}</li>)}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="v-sec v-clips-sec">
          <div className="v-wrap">
            <div className="v-head">
              <span className="v-eyebrow" style={{ color: "var(--v-pop)" }}>En 15 secondes</span>
              <h2>Trois moments du quotidien</h2>
              <p>À regarder sur votre téléphone, entre deux services.</p>
            </div>
            <div className="v-clips">
              {CLIPS.map((x) => (
                <figure key={x.f} className="v-clip" style={{ "--c": x.c }}>
                  <div className="v-clip-frame">
                    <video autoPlay muted loop playsInline preload="metadata" poster={`/media/${x.f}.jpg`} aria-label={`Clip ${x.t}`}>
                      <source src={`/media/${x.f}.mp4`} type="video/mp4" />
                    </video>
                  </div>
                  <figcaption><b><i />{x.t}</b><span>{x.d}</span></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="v-sec" id="comment">
          <div className="v-wrap">
            <div className="v-head">
              <span className="v-eyebrow" style={{ color: "var(--v-brass)" }}>Comment ça marche</span>
              <h2>De la première discussion à Léon qui tourne</h2>
            </div>
            <div className="v-steps">
              <div className="v-step">
                <span className="v-n">1</span>
                <h3>On en parle</h3>
                <p>Vous laissez vos coordonnées, je vous rappelle. On regarde ensemble votre resto et ce qui vous prend le plus de temps.</p>
                <small>20 minutes · par téléphone ou sur place</small>
              </div>
              <div className="v-step">
                <span className="v-n">2</span>
                <h3>On installe Léon</h3>
                <p>Léon vous guide écran par écran : l'équipe, la carte, les produits. La tablette du resto devient la borne, l'imprimante sort vos étiquettes DLC.</p>
                <small>Mise en route offerte</small>
              </div>
              <div className="v-step">
                <span className="v-n">3</span>
                <h3>Léon tourne, je reste là</h3>
                <p>Léon vous prévient de ce qui compte. Une question, un réglage à faire : vous m'appelez directement, pas un centre d'appel.</p>
                <small>Deux semaines à vos côtés</small>
              </div>
            </div>
          </div>
        </section>

        <section className="v-story" id="histoire">
          <div className="v-wrap">
            <span className="v-eyebrow">Qui suis-je</span>
            <h2>Léon, c'est d'abord une histoire de terrain</h2>
            <div className="v-txt">
              <p>Moi c'est Maurice. J'ai grandi dans la restauration : ma famille tient une friterie près de Lille depuis plus de 26 ans. J'y ai fait mes premiers services très jeune, avant d'en devenir manager, puis de prendre la direction d'un restaurant au cœur de Lille.</p>
              <p>Sur le terrain, j'ai vu revenir sans arrêt les mêmes galères : des plannings faits à la main qui changent tout le temps, des pertes qu'on découvre trop tard, des relevés d'hygiène sur papier qu'on ne retrouve jamais quand il en faudrait, et jamais assez de temps pour savoir ce qu'il se passe dans son propre restaurant.</p>
              <p>Léon, c'est cette expérience mise au service des autres restaurateurs. Un outil construit à partir de ce que j'ai vécu en cuisine, en salle, et en gérant une équipe au quotidien.</p>
            </div>
            <div className="v-sig">
              <span className="v-m">M.</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>Maurice</div>
                <div style={{ fontSize: 13, color: "var(--v-ink-3)" }}>Créateur de Léon, directeur de restaurant</div>
              </div>
            </div>
          </div>
        </section>

        <section className="v-sec" id="offre">
          <div className="v-wrap">
            <div className="v-head">
              <span className="v-eyebrow" style={{ color: "var(--v-brass)" }}>L'offre</span>
              <h2>Un seul abonnement, tout compris</h2>
              <p>Pas de modules à additionner : chaque établissement a tout Léon.</p>
            </div>
            <div className="v-offer">
              <div className="v-offer-card">
                <div className="v-price">
                  <h3>Léon, par établissement</h3>
                  <div className="v-price-row">
                    <s>450 €</s>
                    <b>400 €</b>
                    <span>HT / mois</span>
                  </div>
                  <p className="v-price-tag">Offre fondateur : 400 € pendant toute l'année de lancement</p>
                </div>
                <ul>
                  <li>Planning et badgeuse</li>
                  <li>Heures pour le comptable</li>
                  <li>Fiches techniques et coûts</li>
                  <li>Commandes et réception</li>
                  <li>Inventaire et pertes</li>
                  <li>Hygiène et étiquettes DLC</li>
                  <li>Écran « Aujourd'hui » et alertes</li>
                  <li>Six langues pour l'équipe</li>
                  <li>Accompagnement avec moi</li>
                  <li>Données hébergées en France</li>
                </ul>
                <Link className="v-btn v-btn-brass" href="/demande" style={{ alignSelf: "start" }}>Demander une démo</Link>
              </div>
              <div className="v-offer-side">
                <div className="v-perk"><b>Mise en route offerte</b><span>Léon vous guide, et je suis là les deux premières semaines.</span></div>
                <div className="v-perk"><b>2 mois offerts</b><span>si vous réglez l'année en une fois.</span></div>
                <div className="v-perk"><b>1 mois offert</b><span>pour chaque restaurateur que vous nous recommandez et qui rejoint Léon.</span></div>
                <div className="v-perk"><b>Le matériel est à vous</b><span>Tablette et imprimante d'étiquettes achetées pour vous au prix coûtant, sans location.</span></div>
                <p className="v-cmp">Pour comparer : un outil de planning, un de stocks et un d'hygiène séparés coûtent souvent entre 190 et 350 € par mois, sans se parler entre eux.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="v-sec v-faq-sec" id="questions">
          <div className="v-wrap">
            <div className="v-head">
              <span className="v-eyebrow" style={{ color: "var(--v-brass)" }}>Questions</span>
              <h2>Ce qu'on me demande souvent</h2>
            </div>
            <div className="v-faq">
              {FAQ.map((x) => (
                <details key={x.q} className="v-q">
                  <summary>{x.q}<i aria-hidden="true" /></summary>
                  <p>{x.r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="v-final">
          <div className="v-wrap">
            <div>
              <h2>Voyons si Léon colle à votre resto</h2>
              <p>Laissez votre numéro, je vous rappelle pour en parler 20 minutes. Sans engagement.</p>
            </div>
            <div className="v-ctas">
              <Link className="v-btn v-btn-brass" href="/demande">Demander une démo</Link>
              <a className="v-btn v-btn-ghost" href="tel:+33645869003">Ou appelez-moi : 06 45 86 90 03</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="v-foot">
        <div className="v-wrap">
          <img src="/brand/leon-logo-creme.png" alt="Léon" width={720} height={241} style={{ height: 19, width: "auto", opacity: 0.82 }} />
          <nav aria-label="Pied de page">
            <a href="#promesses">Ce que fait Léon</a>
            <a href="#offre">L'offre</a>
            <Link href="/demande">Demander une démo</Link>
            <Link href="/login">Se connecter</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </nav>
          <span>© 2026 Léon · Lille</span>
        </div>
      </footer>

      <div className="v-sticky" aria-hidden="false">
        <a className="v-btn v-btn-ghost v-btn-sm" href="tel:+33645869003">Appeler</a>
        <Link className="v-btn v-btn-brass v-btn-sm" href="/demande">Demander une démo</Link>
      </div>
    </div>
  );
}
