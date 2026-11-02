import PageLegale, { ACompleter } from "../_ui/PageLegale";

export const metadata = { title: "Mentions légales · Léon" };

export default function Mentions() {
  return (
    <PageLegale titre="Mentions légales" maj="2 novembre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>Léon est édité par <ACompleter>nom de la société ou de l'entreprise individuelle</ACompleter>, <ACompleter>forme juridique</ACompleter>, immatriculée sous le numéro SIRET <ACompleter>SIRET</ACompleter>.</p>
        <p>Adresse : <ACompleter>adresse</ACompleter>, Lille.</p>
        <p>Directeur de la publication : Maurice, créateur de Léon.</p>
        <p>Contact : <ACompleter>e-mail pro</ACompleter> · <ACompleter>téléphone pro</ACompleter></p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
        <p>Les données des restaurants (équipes, pointages, stocks, hygiène) sont stockées par Supabase dans un centre de données situé à Paris (France).</p>
      </section>
      <section>
        <h2>Propriété</h2>
        <p>Le nom Léon, le logo, les textes, les images et les vidéos de ce site appartiennent à leur auteur. Toute reproduction sans accord écrit est interdite.</p>
      </section>
      <section>
        <h2>Données personnelles</h2>
        <p>Tout est expliqué sur la page <a className="v-back" href="/confidentialite">Confidentialité</a>.</p>
      </section>
    </PageLegale>
  );
}
