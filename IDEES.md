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
  - 💡 Bouton « remettre à zéro » avant chaque présentation.
  - 💡 Scénario guidé de 5 minutes (planning, alertes heures sup, hygiène…).
  - Plan : 11.03 page d'accueil à deux portes (✅ fait) · 11.04 démo propre (bandeau, remise à zéro) · 11.05 entrée officielle Irish Corner (compte + organisation, accord Maurice avant toute modif de la base).

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
