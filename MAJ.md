# Journal des mises à jour de Léon

Numérotation : **12.00** = gros chapitre terminé, **12.01, 12.02…** = petites tâches dans ce chapitre.
Version actuelle = la dernière entrée en bas de la liste (la plus récente en haut).

---

## 11.07 — Page « Se connecter » refaite
- Même look que la vitrine. À gauche la porte principale « Patron ou directeur » (e-mail + mot de passe), à droite les autres accès : « Pas encore client ? Demander une démo » et « Juste voir à quoi ça ressemble » (démo).
- Œil pour afficher le mot de passe, erreurs en français (« E-mail ou mot de passe incorrect »…).
- **Mot de passe oublié** : lien reçu par mail → nouvelle page `/login/nouveau` pour en choisir un autre, puis entrée directe dans Léon.
- Déjà connecté : « Vous êtes connecté avec … · Entrer dans Léon · Changer de compte ».
- « Créer un compte » retiré (les comptes sont créés par Maurice).
- Écran « Ouverture de votre resto… » et message d'erreur de `/app` au même style.
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
