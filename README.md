# Léon

App qui pilote un ou plusieurs restaurants : planning, pointage, stocks,
commandes fournisseurs, hygiène, statistiques, infos importantes, service
en direct... Construite avec Maurice, restaurateur.

## État du projet (27 sept. 2026)

Le projet a deux parties, à deux stades différents :

### 1. `legacy/` — la version validée, aujourd'hui hébergée sur Claude (artifacts)

Tout ce qui a été construit et testé jusqu'ici (V2 à V11) : le planning façon
tableur avec les règles HCR, les stocks et commandes façon Inpulse, l'hygiène
et la traçabilité, les statistiques, les infos importantes détectées
automatiquement, les mini-applis (Équipe, Cuisine & stocks, Hygiène,
Chiffres), une langue par salarié, etc.

C'est un gros fichier HTML unique par version (démo et réseau), construit à
partir de modules JS (`v8_*.js`, `v9_*.js`, `v10_lisible.js`, `v11_*.js`) que
`build.py` empile par-dessus une base commune (`demo.html` / `reseau.html`).
Chaque module enveloppe les fonctions de la version précédente (garde une
copie `__v7`) plutôt que de les réécrire, pour empiler les versions sans tout
casser.

Cette version tourne aujourd'hui **dans le runtime Claude** (artifacts) : le
stockage des données (`save()`, `initStore()`, `syncCtx()`...) et certains
appels (téléchargement de fichier, "Demander à Léon") passent par les
capacités de Claude, pas par une vraie base de données. C'est pour ça qu'on
ne peut pas juste la déployer sur Vercel telle quelle et s'attendre à ce que
les données se sauvegardent : il n'y a rien derrière pour les recevoir.

Pour reconstruire un fichier à partir des modules :

```
cd legacy
python3 build.py
```

Artifacts Claude actuels (référence visuelle / fonctionnelle) :
- Démo (Petit Beffroi) : https://claude.ai/artifact/PaCPmhUKabpK2Sp5F4wJMC
- Version test (réseau multi-restos) : https://claude.ai/artifact/RM3VHbZkENuhXq58z6iGiW
- Page vitrine : https://claude.ai/artifact/Jkh8P2cxFNewM7AyaN9JyP

### 2. `app/`, `lib/`, `supabase/` — la version connectée (Next.js + Supabase)

L'app v11 complète tourne maintenant dans Next.js avec une vraie base de
données Supabase (Postgres, hébergée à Paris — RGPD) et une vraie
authentification :

- `/inscription`, `/login` : compte du créateur (Supabase Auth).
- `/app` : vérifie la connexion, puis affiche l'app v11
  (`public/leon/app.html`) en plein écran. Elle lui prête un stockage
  Supabase qui a la même interface que celui des artifacts Claude
  (`lib/leonStore.js`), si bien que la v11 tourne sans modification.
- `/leon/demo.html` : la démo Petit Beffroi, autonome (données dans le
  navigateur).

Chaque document de la v11 (`net/config`, `restos/<id>`,
`restos/<id>/data/planning`, `restos/<id>/pointages/<date>`…) est une
ligne de la table `leon_docs` (migration `0002_leon_docs.sql`), rangée
par organisation. Le RLS limite l'accès aux membres de l'organisation, et
Supabase Realtime transmet les changements aux autres appareils en direct.
Au premier passage, `my_org()` crée l'organisation du compte.

Les tables relationnelles de `0001_init_core_schema.sql` (`employees`,
`shifts`, `time_clock_events`…) ne servent pas encore : on y portera les
modules un par un quand il faudra des requêtes, des exports ou des accès
fins par salarié.

Après une modification dans `legacy/` :

```
npm run legacy   # reconstruit legacy/*_v11.html puis les copie dans public/leon/
```

#### Lancer en local

```
npm install
cp .env.example .env.local   # déjà pré-rempli avec l'URL et la clé publique du projet
npm run dev                  # http://localhost:3000
```

#### Déployer sur Vercel

Le projet GitHub est connecté à Vercel. Il faut juste renseigner les mêmes
variables d'environnement que dans `.env.example` dans Vercel → Project
Settings → Environment Variables (Production + Preview), puis chaque push
sur `main` redéploie automatiquement.

#### Premier compte / premier restaurant

1. `/inscription` : crée le compte du créateur.
2. `/app` : l'écran « Crée ton Léon » de la v11 crée le réseau et le premier
   restaurant. Il donne l'identifiant et le mot de passe qui connectent les
   appareils du restaurant, puis les codes de chacun.

## Prochaines étapes

- « Demander à Léon » : brancher l'assistant sur l'API Claude via une
  fonction serveur (dans les artifacts, il passait par le runtime Claude).
- Mots de passe et codes des appareils : ils sont aujourd'hui en clair dans
  `net/config`, lisible par tout le compte. À déplacer côté serveur (hachés).
- Porter les modules vers des tables dédiées au fil des besoins (pointage et
  paie d'abord).
- Brancher L'Addition (flux ventes/encaissements) via une fonction serveur
  qui écrit dans la base, une fois l'accès obtenu côté L'Addition.
