# Journal des mises à jour de Léon

Numérotation : **12.00** = gros chapitre terminé, **12.01, 12.02…** = petites tâches dans ce chapitre.
Version actuelle = la dernière entrée en bas de la liste (la plus récente en haut).

---

## 11.09 — Page d'accueil finie (~90 %) + demandes de démo dans l'espace créateur
- **Vitrine** : l'offre affiche les vrais prix (450 € barré, **400 € HT/mois offre fondateur** pendant l'année de lancement), mise en route offerte, 2 mois offerts si l'année est payée d'un coup, 1 mois offert par resto recommandé, matériel acheté au prix coûtant et qui reste au resto.
- **« Ce qu'on me demande souvent »** : 7 questions (matériel, langues, pointage uniquement sur la tablette, caisse, démarrage, plusieurs établissements, données).
- « Comment ça marche » mis à jour (Léon guide l'installation, 2 semaines d'accompagnement).
- **Barre « Demander une démo » collée en bas** sur téléphone.
- **Pages légales** `/mentions-legales` et `/confidentialite` (liens en pied de page et sous le formulaire). Trous surlignés à remplir : société, SIRET, adresse, e-mail et téléphone pro.
- Correctif : les textes des boutons sur fond vert (« Se connecter », « Essayer », « Demander une démo ») sortaient en foncé, illisibles. Corrigé sur toutes les pages.
- **Espace créateur → « Demandes de démo »** : pastille « X à rappeler », bouton Appeler, notes, suivi (À rappeler, Rappelée, Démo faite, Gagnée, Perdue) et « Créer son Léon » qui ouvre le tunnel avec le resto et le patron déjà remplis.
- Base : migration `0005_demandes_createur.sql` (lecture réservée au créateur). **À appliquer avec 0003, après validation de Maurice.**

## 11.08 — Comptes : espace créateur, « Ajouter un restaurant », invitation du patron, codes à 4 chiffres
- **Espace créateur `/createur`** (Maurice, sur PC) : mot de passe puis **2e code à 4 chiffres** (choisi la 1re fois, redemandé toutes les 12 h). À gauche la liste de tous les restos (badge « Invité » tant que le patron n'a pas ouvert son compte), à droite la fiche du resto (patron, statut, accès d'aide) et « Entrer dans ce resto ».
- **Tunnel « Ajouter un restaurant »** en 3 étapes : le resto (nom, ville, type), le patron (prénom, e-mail), le récap → **Créer et inviter**. Le mail d'invitation part tout seul (fonction serveur `inviter-patron`).
- **Première connexion du patron `/bienvenue`** (depuis le mail) : il choisit son mot de passe, puis son code à 4 chiffres, et il entre dans son Léon. Son resto passe de « Invité » à « Actif ».
- **Rouvrir Léon avec son code** : sur un appareil déjà connecté, « Bonjour Nadia, tapez votre code ». L'appareil reste ouvert 12 h. « Code oublié ? » → reconnexion avec le mot de passe.
- **5 mauvais codes** → attente de 30 s, qui double si ça continue, personne n'est prévenu. Codes stockés hachés côté serveur, jamais en clair.
- **Accès d'aide** : le créateur peut entrer dans le Léon d'un patron pendant 15 jours après l'invitation (pastille « Mode aide · Revenir à mes restos »).
- Après connexion, le créateur arrive sur `/createur`, les autres sur `/app`. `/inscription` ne sert plus qu'à créer le tout premier compte (celui du créateur).
- Base : migration `0004_comptes.sql` + fonction `inviter-patron`. **À appliquer après validation de Maurice.**
- Pas encore fait : lien perso des employés sur leur téléphone (prochaine MAJ), parcours « Démarrer Léon », bandeau « Maurice t'aide » côté patron, mail d'invitation aux couleurs de Léon (il faut un nom de domaine + un service d'envoi ; en attendant c'est le mail par défaut, limité à quelques envois par heure).

## 11.07 — Page « Se connecter » refaite
- Même look que la vitrine. À gauche la porte principale « Patron ou directeur » (e-mail + mot de passe), à droite les autres accès : « Pas encore client ? Demander une démo » et « Juste voir à quoi ça ressemble » (démo).
- Œil pour afficher le mot de passe, erreurs en français (« E-mail ou mot de passe incorrect »…).
- **Mot de passe oublié** : lien reçu par mail → nouvelle page `/login/nouveau` pour en choisir un autre, puis entrée directe dans Léon.
- Déjà connecté : « Vous êtes connecté avec … · Entrer dans Léon · Changer de compte ».
- « Créer un compte » retiré (les comptes sont créés par Maurice).
- Écran « Ouverture de votre resto… » et message d'erreur de `/app` au même style.
- Correctif : plus d'écran « Application error » quand la base de données n'est pas joignable (ex. lien d'aperçu) : un message clair à la place. Les 5 pages testées.
- Reste : une seule connexion au lieu de deux (aujourd'hui l'app redemande l'identifiant du resto après l'e-mail). Lié au chantier sécurité.

## 11.06 — Le tronc : vitrine, tunnel « Demander une démo », icône
- **Nouvelle page d'accueil = vitrine de Léon** (vouvoiement) : film en haut, les 4 promesses (masse salariale, marchandise, paperasse, le resto dans la poche), 3 clips, « Comment ça marche » en 3 étapes, l'histoire de Maurice, l'offre tout compris (tarif présenté pendant la démo), appel final. « Se connecter » en haut à droite.
- **Tunnel de vente** : tous les boutons mènent à `/demande` → formulaire court (prénom, téléphone, resto, ville, e-mail, nombre d'établissements, créneau de rappel, message) → écran « C'est noté ».
- Les demandes vont dans la table `demandes` (migration `0003_demandes.sql`, **pas encore appliquée** : à valider par Maurice). Tout le monde peut envoyer, personne ne peut lire depuis le site.
- **Icône d'appli** (l'œil du logo) pour l'onglet et l'écran d'accueil du téléphone.
- Film et clips copiés dans `public/media/`.

## 11.04 — Démo : pastille « Mode démo » + remise à zéro
- Dans la démo uniquement : une pastille en haut de l'écran « MODE DÉMO · Données fictives : rien ne sort de cet appareil » avec un bouton **Remettre à zéro** (efface les essais faits sur cet appareil, puis recharge la démo d'origine).
- Absente de l'app officielle connectée à Supabase.
- Traduite dans les 6 langues (tamoul à faire relire).

## 11.03 — Nouvelle page d'accueil : deux portes
- Accueil simplifié : logo, une phrase, deux gros boutons « Entrer dans mon resto » (→ connexion puis app officielle) et « Essayer la démo » (sans compte).
- « Mode borne » passe en petit lien en bas ; « Créer un compte » est masqué pour l'instant (la page `/inscription` existe toujours).

## 11.02 — IDEES.md : la mémoire des idées
- Création de `IDEES.md` (décisions, idées, deux versions officielle/démo, façon de travailler).
- Claude le relit à chaque session et le met à jour. Aucun changement dans l'app.

## 11.01 — Mise en place du suivi des MAJ
- Création de ce journal et des règles de versionnage (voir `CLAUDE.md`).
- Aucun changement dans l'app elle-même.

## 11.00 — Point de départ
- Léon V11 : planning, pointage/badgeuse, mode borne, hygiène, stocks, stats, infos, service en direct, 6 langues.
- Hébergé via Next.js + Supabase, déployé sur Vercel.
