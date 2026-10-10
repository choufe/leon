# Léon — consignes pour Claude Code

## Le projet en deux phrases
Léon est une app qui pilote un ou plusieurs restaurants : planning, pointage, stocks et commandes fournisseurs, hygiène et traçabilité, statistiques, infos importantes, service en direct. Elle est construite avec Maurice (restaurateur, directeur de site à Lille), qui n'est pas développeur : explique simplement, en français, sur un ton décontracté, et va à l'essentiel.

Premier usage réel prévu : en privé, dans le restaurant de son beau-père. Pas d'ouverture à d'autres restos avant la sécurisation (voir « Reporté »).

## Structure du repo
- `legacy/` : la version validée (V2 à V11), construite en gros fichiers HTML à partir de modules JS empilés (`v8_*`, `v9_*`, `v10_lisible.js`, `v11_*`). Chaque module enveloppe les fonctions de la version précédente (copie `__v7`, etc.) au lieu de les réécrire. **Ne pas réécrire le cœur : on ajoute un module par-dessus.**
- `public/leon/app.html` et `demo.html` : générés depuis `legacy/`. Ne pas les modifier à la main.
- `app/` : Next.js (App Router) — `/inscription`, `/login`, `/app` (affiche l'app v11 en plein écran), `/dashboard`.
- `lib/leonStore.js` : stockage Supabase qui imite l'interface de stockage des artifacts Claude (`window.claude`), pour que la v11 tourne sans modification.
- `supabase/migrations/` : `0001_init_core_schema.sql` (tables relationnelles, pas encore utilisées), `0002_leon_docs.sql` (table `leon_docs`, une ligne par document, rangée par organisation, RLS par membre).
- `scripts/publish-legacy.mjs` : copie les builds `legacy/` dans `public/leon/`.

## Commandes
- `npm install`, puis `npm run dev` (http://localhost:3000). Variables dans `.env.local` (voir `.env.example`).
- Après toute modification dans `legacy/` : `npm run legacy` (reconstruit puis copie dans `public/leon/`). Toujours relancer avant de committer.
- `npm run build` pour vérifier que ça compile avant un push.
- Déploiement : le repo est connecté à Vercel, chaque push sur `main` redéploie. Variables d'environnement à renseigner aussi dans Vercel.

## Mises à jour (MAJ) et push
- Maurice parle en **mises à jour**. Numérotation : `11.00` = point de départ (ex-V11) ; petites tâches = `11.01`, `11.02`… ; quand un gros chapitre est terminé, on passe à `12.00`.
- **Je push tout, tout le temps** (autorisation de Maurice) sur la branche de travail de la session, après vérification (`npm run build` si le code a changé). Pas besoin de redemander.
- Une MAJ terminée = entrée dans `MAJ.md` (la plus récente en haut) + **résumé en langage simple** pour Maurice (ce qui change, comment tester, ce qui reste).
- Passage en ligne (fusion dans `main` → redéploiement Vercel) : à la validation de Maurice, MAJ par MAJ. Migrations Supabase et suppressions de données : toujours confirmer avant.

- **Mémoire entre sessions** : au début d'une session, lire `IDEES.md` et `MAJ.md`. Quand Maurice donne une idée ou prend une décision, la noter en quelques lignes dans `IDEES.md` (pas la conversation entière) et la pousser.

## Règles de travail
- Petits changements, testables. Vérifier que ça marche (lancer l'app, `npm run build`) avant de dire que c'est fini.
- Toujours confirmer avec Maurice avant : de pousser sur `main`, de modifier la base Supabase (migrations), ou de supprimer des données.
- Les migrations Supabase vont dans `supabase/migrations/` avec un numéro suivant (`0003_...`). Ne jamais modifier une migration déjà appliquée.
- Ne jamais committer de secret (`.env.local`, clés de service). Seules les variables `NEXT_PUBLIC_*` sont publiques.
- Projet Supabase : « leon », région Paris (eu-west-3) pour le RGPD. La badgeuse traite des données de salariés : hébergement en Europe, pas de biométrie.
- Interface en français ; chaque salarié peut choisir sa langue (français, anglais, tamoul, arabe, portugais, espagnol). Toute nouvelle phrase d'interface doit passer par le système de traduction (`legacy/v11_i18n.js`). Pour l'équipe qui lit peu le français : privilégier icônes et mots simples.
- Principe d'interface : accueil simple, un espace = une couleur légère, tout ce qui est secondaire est replié, chaque alerte peut être marquée « C'est géré ».

## Règles métier à respecter (restauration, HCR)
- Heures sup : +10 % de 36 à 39 h, +20 % de 40 à 43 h, +50 % au-delà. 48 h max par semaine, 11 h de repos entre deux jours, 2 jours de repos par semaine, 11 h max par jour (11 h 30 hors cuisine), pause au-delà de 6 h.
- Stock théorique = dernier compté + réceptions − ventes (calculées via les fiches techniques / ratio matière).
- DLC après ouverture : le plus proche entre la DLC d'origine et (ouverture + 3 jours).
- Léon ne prend pas de commandes clients : la caisse (L'Addition pour le resto test) s'en charge. Léon sert à badger, suivre, piloter.

## Reporté volontairement (ne pas traiter sans accord de Maurice)
- **Sécurité** (à faire avant d'ouvrir à un autre restaurant) : mots de passe et codes des appareils aujourd'hui en clair dans `net/config` → à hacher côté serveur ; revoir l'exécution publique des fonctions `my_org`, `is_org_member`, `is_member_of` ; activer la protection contre les mots de passe déjà piratés dans Supabase Auth.
- **Caisse L'Addition** : un seul flux à brancher (ventes/encaissements par article), via une fonction serveur qui écrit dans la base. En attente de l'accès côté L'Addition. « Un de mes arcs finaux ».
- Rôle « patron de groupe », CRM des clients Léon, facturation aux restaurateurs.

## Prochains chantiers (ordre proposé, à valider avec Maurice)
1. « Demander à Léon » version agent : fonction serveur qui appelle l'API Claude avec les données du resto (dans les artifacts, cela passait par le runtime Claude, qui n'existe plus ici). Idéalement avec des actions à valider (préparer une commande, proposer le planning).
2. Tester planning, pointage, import en 30 minutes et hygiène en conditions réelles chez le beau-père, et corriger.
3. Fichier CSV de paie dans la version hébergée.
4. Porter les modules pointage et paie vers des tables dédiées quand il faudra des requêtes ou des exports.
5. Relecture des traductions (surtout le tamoul) par des personnes qui parlent la langue.
