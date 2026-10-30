# Journal des mises à jour de Léon

Numérotation : **12.00** = gros chapitre terminé, **12.01, 12.02…** = petites tâches dans ce chapitre.
Version actuelle = la dernière entrée en bas de la liste (la plus récente en haut).

---

## 11.05 — Objectif de masse salariale dans le planning
- Le patron fixe son **objectif de masse salariale** (% du CA HT, 30 % par défaut) depuis le planning.
- Au-dessus du planning (semaine et jour), un bandeau **Budget de la semaine** : masse salariale prévue vs objectif, heures planifiées vs heures que les ventes prévues peuvent payer, « X h de trop » ou « X h de marge », et les jours qui dépassent.
- Bouton **Détail** : jour par jour, ventes prévues, budget en heures, heures planifiées, écart, % ; « Voir » ouvre la vue Jour.
- Les couleurs du bas du planning suivent l'objectif (vert = dans l'objectif, orange = jusqu'à 4 points au-dessus, rouge au-delà).
- Accueil : l'ancienne alerte « un jour à 34 % » est remplacée par une alerte sur la semaine (en cours et suivante) dès qu'elle dépasse l'objectif de plus de 2 h. Marquable « C'est géré ».
- Un manager sans accès aux salaires voit le budget **en heures seulement** ; sans accès au CA, pas de ventes affichées.
- Fichier : `legacy/v11_masse.js` (+ style dans `v11.css`, seuils du bas de grille dans `v9_plan_view.js`).

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
