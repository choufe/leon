import PageLegale, { ACompleter } from "../_ui/PageLegale";

// 14.03 · Note d'information des salariés (badgeuse et planning), à remettre ou afficher avant la mise en route.
// Modèle à faire valider (Maurice n'est pas juriste) : le restaurant reste responsable des données de son équipe.
export const metadata = { title: "Information des salariés · Léon" };

export default function InfoSalaries() {
  return (
    <PageLegale titre="Note d'information des salariés : badgeuse et planning" maj="9 novembre 2026">
      <section>
        <p>Ce modèle est à remettre à chaque salarié (ou à afficher en salle de pause) <b>avant</b> de commencer à badger avec Léon. Le restaurant complète les parties en couleur, l'imprime et en garde une copie signée. Si l'entreprise a un CSE, il doit être informé et consulté avant la mise en route.</p>
      </section>
      <section>
        <h2>Qui est responsable</h2>
        <p>Votre employeur, <ACompleter>nom et adresse du restaurant</ACompleter>, utilise l'outil Léon pour organiser le planning et compter les heures de travail. Léon est un prestataire : il traite les données pour le compte du restaurant, uniquement pour faire fonctionner l'outil.</p>
      </section>
      <section>
        <h2>Pourquoi</h2>
        <ul>
          <li>Faire le planning de l'équipe et vous le montrer.</li>
          <li>Compter vos heures de travail réelles (arrivée, pause, départ), les heures supplémentaires et préparer la paie.</li>
          <li>Respecter les règles du temps de travail (repos, durées maximales).</li>
        </ul>
        <p>Les heures badgées ne servent pas à autre chose : ni à surveiller vos déplacements, ni à vous noter.</p>
      </section>
      <section>
        <h2>Ce qui est enregistré</h2>
        <ul>
          <li>Votre prénom, votre nom, votre poste, votre langue, vos heures de contrat.</li>
          <li>Vos heures d'arrivée, de pause et de départ, badgées sur la tablette du restaurant avec votre code personnel à 4 chiffres.</li>
          <li>Votre planning, vos congés et vos demandes d'échange.</li>
        </ul>
        <p><b>Pas de biométrie</b> (ni empreinte, ni photo, ni visage), <b>pas de géolocalisation</b>. On badge uniquement sur la tablette du restaurant. Votre code est chiffré : personne ne peut le lire, pas même Léon. Ne le donnez à personne : badger à la place d'un collègue est interdit.</p>
      </section>
      <section>
        <h2>Pourquoi c'est autorisé</h2>
        <p>Le décompte du temps de travail est une obligation de l'employeur (Code du travail) et sert à l'exécution de votre contrat (paie, heures supplémentaires).</p>
      </section>
      <section>
        <h2>Qui voit vos données</h2>
        <ul>
          <li>La direction et les responsables habilités du restaurant : <ACompleter>noms ou fonctions</ACompleter>.</li>
          <li>Le cabinet comptable ou le service de paie, pour les heures du mois : <ACompleter>nom du cabinet</ACompleter>.</li>
          <li>Vos collègues voient le planning de l'équipe, mais pas vos heures badgées ni votre contrat.</li>
        </ul>
        <p>Les données sont hébergées en France (Paris) et ne sont ni vendues ni partagées.</p>
      </section>
      <section>
        <h2>Combien de temps</h2>
        <p>Les heures de travail sont gardées 5 ans (durée recommandée par la CNIL pour le suivi du temps de travail), puis supprimées. Le reste (planning, poste, langue) est gardé pendant votre contrat, puis supprimé ou archivé selon les obligations de l'employeur.</p>
      </section>
      <section>
        <h2>Vos droits</h2>
        <p>Vous pouvez voir vos données, demander à les corriger, et pour certaines vous opposer à leur utilisation pour un motif légitime. Adressez-vous à <ACompleter>nom ou fonction du responsable</ACompleter>. Si vous n'obtenez pas de réponse, vous pouvez saisir la CNIL (cnil.fr).</p>
      </section>
      <section>
        <h2>À signer</h2>
        <p>Je soussigné(e) <ACompleter>prénom et nom</ACompleter> reconnais avoir reçu cette note d'information.</p>
        <p>Fait à <ACompleter>ville</ACompleter>, le <ACompleter>date</ACompleter>. Signature :</p>
      </section>
    </PageLegale>
  );
}
