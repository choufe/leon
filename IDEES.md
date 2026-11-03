# Idées pour Léon

Tenu à jour par Claude à partir des échanges avec Maurice. Une idée = quelques lignes, avec son état.
États : 💡 à discuter · 📋 prévu · 🚧 en cours · ✅ fait · ❌ abandonné

## Décisions déjà prises
- Versionnage : 11.00 = point de départ ; petites tâches 11.01, 11.02… ; gros chapitre fini = 12.00.
- Claude push tout, tout le temps, sur sa branche de travail. Mise en ligne (`main`) à la validation de Maurice, MAJ par MAJ.
- Premier vrai restaurant : **Irish Corner** (pas encore créé dans la base). Ce sera la version officielle de Léon, avec les vraies données.

## Architecture : un site, trois vues (décidé)
- Un seul site / un seul code, avec une vue adaptée à chaque appareil. Pas d'applis séparées ni d'App Store pour l'instant.
- **Tablette (borne)** : très simple, gros boutons, icônes. Badge, mon planning, hygiène. Verrouillée en plein écran sur l'écran de badge.
- **Téléphone** : « Aujourd'hui », mon planning, mes alertes. Pensé pour une main.
- **PC** : tout (planning complet, commandes, stats, réglages, exports de paie).
- Installation tablette/téléphone en « appli » depuis le navigateur (ajout à l'écran d'accueil).
- Ce que chacun voit dépend aussi de son rôle (salarié, chef, directeur), pas seulement de l'appareil.
- À brancher dans la 11.05 : Léon reconnaît la personne et l'appareil, et affiche la bonne vue.

## Deux versions de Léon
- 📋 **Officielle** (Irish Corner) : vraies données, on n'y touche que par MAJ validées.
- 📋 **Test / démo** : resto fictif avec fausses données, pour simuler et montrer Léon à d'autres restaurateurs. Même code que l'officielle, données séparées.
  - ✅ Bouton « remettre à zéro » avant chaque présentation (11.04).
  - 💡 Scénario guidé de 5 minutes (planning, alertes heures sup, hygiène…).
  - Plan : 11.03 page d'accueil à deux portes (✅ fait) · 11.04 démo propre (pastille « mode démo » + remise à zéro, ✅ fait) · 11.05 entrée officielle Irish Corner (compte + organisation, accord Maurice avant toute modif de la base).

## Façon de travailler ensemble
- ✅ `MAJ.md` : journal des mises à jour + résumé simple à chaque MAJ.
- ✅ `IDEES.md` : ce fichier, la mémoire de Claude entre les sessions.
- 💡 Fiche courte avant chaque MAJ : ce que veut Maurice / comment on saura que c'est réussi.
- 💡 Lien de prévisualisation Vercel par branche, pour tester sur téléphone avant la mise en ligne.
- 💡 Captures d'écran de Claude après chaque changement visible.
- 💡 Journal de bugs terrain (tests chez le beau-père) trié par lots.
- 💡 Sauvegarde (export des données) avant chaque grosse MAJ.
- 💡 Résumé de MAJ « pour les restaurateurs » à partir de `MAJ.md`.
- 💡 Onglets « Idées » et « MAJ » directement dans l'app Léon (plus tard).

## Organisation en arbre (décidé le 30 oct.)
- **Le tronc d'abord** (vitrine, tunnel de vente qui ramène à Maurice, logo partout, démo, connexion, navigation, nom de domaine, mentions légales, sécurité), jusqu'à 90 %. Ensuite seulement les 4 branches, en commençant par la masse salariale.
- Maurice est très visuel : montrer le résultat (lien d'aperçu, captures) à chaque étape.
- 🚧 11.06 vitrine + tunnel « Demander une démo ». 💡 Ensuite : liste des demandes dans l'espace créateur + notification à Maurice.

## Comptes et connexion (décidé le 30 oct.)
- ✅ Personne ne crée de compte tout seul : Maurice crée le resto et le compte du patron (mail « choisissez votre mot de passe »). Le patron crée ses employés (prénom, poste, langue, accès) et Léon leur donne un code. Maurice est présent au lancement pour aider.
- ✅ Le code dit QUI on est, l'appareil décide OÙ on arrive : tablette du resto = la borne (se reverrouille) ; téléphone/PC perso = son espace (reste connecté), relié une fois par un lien perso. Le code ne marche jamais seul, sur un appareil non relié.
- ✅ **On ne pointe QUE sur la tablette du resto.** Jamais depuis un téléphone perso. (Pointer à la place d'un autre = faute grave pour Maurice.)
- ✅ Le patron garde un e-mail + mot de passe pour entrer depuis n'importe où.
- ✅ Léon s'installe depuis le lien (écran d'accueil), pas d'App Store pour l'instant. Affiche « Installer Léon » faite.
- ✅ Code à 4 chiffres pour tout le monde (on verra plus tard). Après 5 erreurs : « attends un peu », personne n'est prévenu.
- ✅ On pense en RÔLES, pas patron/employé : propriétaire, directeur, responsables, équipe (ex. boîte de nuit : le propriétaire ne touche jamais la tablette). Le patron/directeur décide qui a un accès par e-mail.
- ✅ Compte créateur (Maurice) : e-mail + mot de passe, puis un 2e code à 4 chiffres. (Code qui change sur téléphone proposé, pas retenu pour l'instant.)
- ✅ Propriétaire / directeur : e-mail + mot de passe la 1re fois, puis code à 4 chiffres pour rouvrir.
- ✅ Tablette = la borne : écran de repos (heure, qui travaille, plats épuisés, dernière info) ; équipe : badger, son planning, plat épuisé, allergènes, cahier, relevés/tâches, étiquette DLC ; responsable : + retards/absents, réception livraison, casse/perte, CA du jour ; directeur : + corriger un pointage (lui seul) et CA du jour vs prévu. Ça s'arrête là.
- ✅ Jamais sur la tablette : salaires, coûts/marges, stats du mois, modifier le planning, ajouter un salarié, réglages.

## Comptes et appareils (31 oct.)
- ✅ Tablette du resto = la borne (badger, service), même quand le patron l'utilise. Le patron GÈRE sur PC (planning, carte, réglages, salariés) et SUIT sur téléphone (« Aujourd'hui », congés, chiffres).
- ✅ Créateur sur PC : liste des restos à gauche + « Ajouter un restaurant » (tunnel 3 étapes). Aucune création depuis une tablette.
- ✅ Léon doit être ultra autonome : le patron crée son Léon tout seul. Maurice aide 1-2 semaines max (accès d'aide 15 jours). Chaque blocage d'un patron = un écran à corriger dans Léon.
- ✅ Le patron choisit lui-même son code à la 1re connexion. 5 erreurs → 30 s d'attente qui double.
- 💡 Démarrage d'un resto : resto, équipe, carte, produits/fournisseurs, tablette + imprimante (étiquette test), HACCP de base. Les restos ne partent pas toujours de zéro (bouton « Tester mon imprimante »).
- 💡 Matériel : Maurice achète le kit (tablette + Brother QL-820NWBc ~185 € HT) avec l'argent du resto ; le matériel est au resto. Location plus tard, en option.

## Façon de travailler (2 nov.)
- « Finir » une page = ~90 %, le reste viendra plus tard.
- À chaque message de Maurice sur Léon, Claude avance AUSSI en parallèle sur une autre page ou fonction (prendre des initiatives).
- ✅ 11.09 vitrine finie + demandes de démo côté créateur. 💡 Ensuite : notification à Maurice (mail/SMS) à chaque nouvelle demande.

## Un seul chemin (décidé le 2 nov.)
- Maurice veut un parcours LINÉAIRE : site Léon → Se connecter → son compte. Jamais retomber sur une ancienne version en un clic.
- Inventaire fait : le problème vient surtout de l'ancienne app v11 (dans `/app`) qui a encore ses propres écrans de compte : « Crée ton Léon » (setup, si `net/config` vide), identifiant + mot de passe du resto (login), écran de verrou de l'appareil. Ça fait une 2e porte après la connexion.
- 💡 12.00 « Un seul chemin » : dans `/app`, Léon saute ces vieux écrans (le compte Supabase + code à 4 chiffres = la seule porte) ; le resto est créé à partir du nom donné à l'invitation ; retirer « Mon compte créateur » de la v11 ; `/dashboard` supprimé ; `/inscription` fermée (11.10) ; la tablette reliée plus tard par lien perso.
- ✅ 12.03 Feuille de jour (prévu / badgé / payé + validation du directeur + verrou paie). Vue par poste : Maurice la trouve peu utile, pas prioritaire. 💡 Ensuite : écart contrat vs planifié dans le planning, modèles de semaine, export paie pour le comptable.
- ✅ 12.04 (3 nov.) Maurice : « on pointe UNIQUEMENT sur la tablette, comme ça s'il oublie il ne peut jamais tricher ». Badgeuse façon Skello (jours à gauche, prévu/badgé/payé, payé = ce que le patron retient pour la paie). Planning compact 1 ligne, menu repliable, ⚠ cliquable sur les cases, employés voient toute l'équipe sans contrats ni heures.
- 💡 Suite : relier la tablette (lien perso) pour que la borne ne s'ouvre QUE sur elle ; demande d'échange de shift visible par l'équipe ; modèles de semaine ; export paie.
