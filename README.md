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

### 2. `app/`, `lib/`, `supabase/` — le début de la vraie version connectée

Une app Next.js déployée sur Vercel, avec une vraie base de données
Supabase (Postgres, hébergée à Paris — RGPD) et une vraie authentification.
C'est le tout début : pour l'instant, seulement une page de connexion
(Supabase Auth par e-mail/mot de passe) et une liste des restaurants du
compte connecté. Le reste (planning, stocks, hygiène, stats...) reste à
porter depuis `legacy/`, module par module.

Base de données : projet Supabase **leon** (organisation *choufe's Org*),
région Paris (`eu-west-3`). Schéma de départ dans
`supabase/migrations/0001_init_core_schema.sql` :

- `orgs` — le compte du créateur (toi, Maurice)
- `restaurants` — un restaurant, rattaché à un `org`
- `memberships` — qui (compte Supabase Auth) a quel rôle sur quel restaurant
  (admin / patron / manager)
- `employees` — les salariés (pas de compte Supabase Auth : ils badgent au
  code PIN sur l'appareil du resto — l'authentification par PIN reste à
  construire, probablement via une fonction serveur dédiée)
- `shift_types`, `shifts`, `absences`, `time_clock_events` — le cœur du
  planning et du pointage

Toutes les tables ont le RLS (Row Level Security) activé : un compte ne
voit et ne modifie que les restaurants où il a un `membership`.

#### Lancer en local

```
npm install
cp .env.example .env.local   # déjà pré-rempli avec l'URL et la clé publique du projet
npm run dev
```

#### Déployer sur Vercel

Le projet GitHub est connecté à Vercel. Il faut juste renseigner les mêmes
variables d'environnement que dans `.env.example` dans Vercel → Project
Settings → Environment Variables (Production + Preview), puis chaque push
sur `main` redéploie automatiquement.

#### Premier compte / premier restaurant

Il n'y a pas encore d'écran d'inscription. Pour créer ton compte et ton
premier restaurant :

1. Crée un compte via Supabase Auth (écran `/login` ne fait que la
   connexion pour l'instant — l'inscription est à ajouter, ou on peut créer
   le compte à la main dans le dashboard Supabase → Authentication → Users).
2. Une fois le compte créé, insérer manuellement (SQL) une ligne dans `orgs`
   avec `owner_user_id` = ton user id, une ligne dans `restaurants`, et une
   ligne dans `memberships` (role = `admin`) pour relier ton compte à ce
   restaurant.

Cette étape sera automatisée dans un prochain lot (écran d'inscription +
création du premier restaurant).

## Prochaines étapes

- Écran d'inscription + création du premier restaurant (au lieu de le faire
  à la main en SQL).
- Porter le planning (`v9_plan_*.js`) vers de vraies requêtes Supabase sur
  `shifts` / `absences` / `time_clock_events`.
- Authentification des salariés par code PIN sur l'appareil partagé du
  restaurant (fonction serveur dédiée, pas de compte Supabase Auth par
  salarié).
- Porter stocks, recettes, hygiène, statistiques (modules `v8_*`, `v11_*`)
  au même rythme.
- Brancher L'Addition (flux ventes/encaissements) via une fonction serveur
  qui écrit dans la base, une fois l'accès obtenu côté L'Addition.
