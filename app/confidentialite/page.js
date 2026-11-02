import PageLegale, { ACompleter } from "../_ui/PageLegale";

export const metadata = { title: "Confidentialité · Léon" };

export default function Confidentialite() {
  return (
    <PageLegale titre="Vos données et Léon" maj="2 novembre 2026">
      <section>
        <h2>En bref</h2>
        <ul>
          <li>Vos données sont hébergées en France, à Paris.</li>
          <li>Elles ne sont ni revendues, ni partagées, ni utilisées pour de la publicité.</li>
          <li>Pas de biométrie : la badgeuse fonctionne avec un code à 4 chiffres.</li>
          <li>Vous pouvez demander à tout moment à voir, corriger ou supprimer vos données.</li>
        </ul>
      </section>
      <section>
        <h2>Quand vous demandez une démo</h2>
        <p>Nous gardons votre prénom, votre téléphone, le nom et la ville de votre restaurant, et votre e-mail si vous le donnez. Ils servent uniquement à vous rappeler au sujet de Léon. Sans suite de votre part, ils sont supprimés au bout de 3 ans.</p>
      </section>
      <section>
        <h2>Quand votre restaurant utilise Léon</h2>
        <p>Le restaurant reste responsable des données de son équipe. Léon les traite pour son compte, uniquement pour faire fonctionner l'outil :</p>
        <ul>
          <li>l'équipe : prénom, poste, langue, planning, heures de pointage ;</li>
          <li>le restaurant : produits, fournisseurs, stocks, relevés d'hygiène, chiffres ;</li>
          <li>les comptes : e-mail et mot de passe des responsables. Les codes à 4 chiffres sont chiffrés, personne ne peut les lire, même pas nous.</li>
        </ul>
        <p>Si le restaurant arrête Léon, ses données lui sont rendues sur demande puis supprimées.</p>
      </section>
      <section>
        <h2>Qui y a accès</h2>
        <p>Chaque restaurant ne voit que ses propres données. Le créateur de Léon peut y entrer pendant les deux semaines d'accompagnement au démarrage, pour aider à l'installation, puis plus du tout sans l'accord du restaurant.</p>
        <p>Nos prestataires techniques : Supabase (base de données, Paris) et Vercel (hébergement du site).</p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>Léon n'utilise que ce qui est nécessaire pour rester connecté. Aucun cookie de publicité ni de mesure d'audience.</p>
      </section>
      <section>
        <h2>Vos droits</h2>
        <p>Pour voir, corriger, récupérer ou supprimer vos données, écrivez à <ACompleter>e-mail pro</ACompleter>. Réponse sous un mois au plus. En cas de désaccord, vous pouvez saisir la CNIL (cnil.fr).</p>
      </section>
    </PageLegale>
  );
}
