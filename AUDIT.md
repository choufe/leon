# Audit de Léon — 11 novembre 2026

Fait sur `main` (commit `322ff16`) et sur la base Supabase « leon », **sans rien modifier**.
Méthode : lecture du code (`app/`, `lib/`, `legacy/`, fonctions serveur, 11 migrations), lecture des règles
de la base en direct, le grand check (`npm run check`, 239 captures, 0 erreur d'affichage), et des essais
ciblés dans la démo (heures sup, DLC, coût matière, pointage après minuit, texte piégé dans le cahier).

État de la base au moment de l'audit : 2 comptes, 3 restos (2 supprimés, 1 de test), aucun vrai client.
Donc : **rien n'a fuité**, mais plusieurs portes étaient ouvertes pour le jour où il y aura des clients.

Chaque point : **Où** · **Pourquoi c'est un problème** · **Correction** · **Risque de la correction**.
Statut : ✅ corrigé dans cette branche · 🟡 préparé, à appliquer à la fusion · 📋 reste à faire · 🙋 à valider par Maurice.

---

## 1. Bloquant / sécurité

### S1 — N'importe qui peut s'ouvrir un Léon gratuit ✅🟡
- **Où** : fonction `my_org()` (migrations 0002 → 0011) + inscription Supabase ouverte (nécessaire pour `/rejoindre`).
- **Pourquoi** : la page `/inscription` est fermée à l'écran, mais pas la base. Quelqu'un qui crée un compte « à la main » (sans passer par le site) et appelle `my_org()` reçoit une organisation toute neuve, donc un Léon complet sans invitation ni paiement. C'est aussi ce qui a créé le resto fantôme « maurice-tomasina@live.fr ».
- **Correction** : `my_org()` ne crée plus jamais rien : pas de resto → pas d'entrée (message « pas relié à un restaurant »). Migration `0012`.
- **Risque** : faible. Les seuls chemins légitimes (invitation patron, resto de test, salarié, tablette) créent déjà le resto ou le lien avant.

### S2 — L'assistant « L'avis de Léon » pouvait servir de robinet gratuit ✅🟡
- **Où** : `supabase/functions/leon-ia/index.ts`.
- **Pourquoi** : il suffit d'être connecté (voir S1 : n'importe qui peut l'être) pour envoyer des questions à Claude avec **ta** clé payante, sans limite. La fonction ne vérifie pas que le compte appartient à un resto.
- **Correction** : la fonction vérifie que le compte est rattaché à un resto actif, et compte les questions (60 par jour et par compte, 400 par jour et par resto ; au-delà : « réessaie demain »). Table `leon_ia_usage`, migration `0012`.
- **Risque** : faible. La clé n'est pas encore posée, donc rien ne change en ligne tant que tu ne l'ajoutes pas. À redéployer à la fusion.

### S3 — Un resto « supprimé » restait ouvert par la base ✅🟡
- **Où** : `est_direction()`, `est_salarie_de()`, `is_org_member()` (migrations 0009-0011).
- **Pourquoi** : la 0007 bloquait bien l'accès à un resto supprimé, mais les migrations suivantes ont réécrit ces fonctions en oubliant la condition. Résultat : l'écran dit « Ce Léon est fermé », mais le patron, ses salariés et sa tablette peuvent encore lire et modifier toutes les données par la base.
- **Correction** : la condition « pas supprimé » est remise dans les trois fonctions. Rien n'est effacé, le créateur peut toujours récupérer le resto. Migration `0012`.
- **Risque** : nul pour les restos actifs.

### S4 — On pouvait badger ailleurs que sur la tablette ✅ 🙋
- **Où** : `app/app/page.js` (la page `/tablette` est la même que `/app`).
- **Pourquoi** : n'importe quel appareil connecté avec le compte du patron pouvait ouvrir `/tablette` et afficher l'écran des codes. Un téléphone perso devenait donc une badgeuse. Ça contredit « on ne pointe QUE sur la tablette du resto ».
- **Correction** : `/tablette` ne s'ouvre plus que sur une tablette reliée par le lien perso (Réglages → La tablette du resto), ou pour toi en « Mode tablette » depuis l'espace créateur. Le patron qui l'ouvre ailleurs voit comment relier sa tablette.
- **Risque** : un patron qui avait connecté sa tablette avec son e-mail devra la relier par le lien (30 secondes). Aucun resto réel n'est dans ce cas aujourd'hui. **À valider** (voir la liste en bas).

### S5 — Un salarié pouvait toucher à la validation des heures par la base ✅🟡
- **Où** : règles `leon_docs: salarié écrit` (migration 0010).
- **Pourquoi** : un salarié écrit dans le document « équipe » pour ses demandes de congés. Mais ce même document contient aussi les heures validées et la validation de paie (`validated`, `paieVal`) ; pareil pour « ops » (historique des prix). En passant par la base, il pouvait donc les modifier.
- **Correction** : un garde-fou dans la base remet d'office ces rubriques à leur valeur d'avant quand c'est un salarié qui écrit. Migration `0012`.
- **Risque** : faible. L'appli salarié n'écrit jamais dans ces rubriques.

### S6 — Droits trop larges sur les tables ✅🟡
- **Où** : droits par défaut de Supabase (toutes les tables : lecture / écriture / vidage accordés aux visiteurs et aux comptes).
- **Pourquoi** : aujourd'hui les règles d'accès (RLS) bloquent bien, mais c'est la seule barrière. Une règle oubliée demain = table ouverte. Le « vidage » de table (TRUNCATE) n'est même pas couvert par les règles.
- **Correction** : on retire tout aux visiteurs (sauf envoyer une demande de démo) et on ne laisse aux comptes que le strict nécessaire. Les tables de comptes (codes, créateur, compta, invitations, tablettes) ne sont plus accessibles que par les fonctions prévues. Migration `0012`.
- **Risque** : faible ; testé sur une copie locale de la base avec les 5 types de compte.

### S7 — Next.js avec des failles connues ✅
- **Où** : `package.json` (`next 14.2.15`).
- **Pourquoi** : cette version a plusieurs failles publiées, dont une qui permet de contourner le garde placé devant les démos.
- **Correction** : passage à `14.2.35` (même génération, juste les correctifs). Ajout d'en-têtes de sécurité (le site ne peut plus être affiché dans le cadre d'un autre site, etc.).
- **Risque** : faible ; `npm run build` et le grand check repassés.

### S8 — Les codes et mots de passe du resto sont en clair et vérifiés dans le navigateur 📋
- **Où** : documents `net/config` et `restos/<id>` (`adminCode`, `adminPass`, `codes`, `login.pass`, `emp[].code`), vérifiés par `routeCode()` dans l'appli.
- **Pourquoi** : la tablette reçoit **tous** les codes (directeur compris) et le mot de passe « direction » pour pouvoir les comparer elle-même. Quelqu'un de débrouillard avec la tablette en main peut les lire. Les salariés sur leur téléphone, eux, ne les reçoivent pas (copie « publique », bien faite).
- **Correction proposée** : vérifier les codes côté serveur (codes hachés, comme le tien et celui du patron) et n'envoyer à la tablette que le strict nécessaire. C'est un vrai chantier (toute la borne repose dessus) : je ne l'ai pas fait dans cette branche pour ne pas casser la badgeuse.
- **Risque si on ne fait rien** : acceptable pour le resto du beau-père, à faire avant d'ouvrir à des inconnus.

### S9 — Le code à 4 chiffres du patron est un verrou d'écran, pas une vraie 2e barrière 📋
- **Où** : `app/_ui/verrou.js` (un simple marqueur dans le navigateur).
- **Pourquoi** : ton 2e code à toi est vérifié par la base (solide). Celui du patron ne protège que l'écran : avec la session ouverte, la base répond sans le code. C'est suffisant contre un curieux qui prend le téléphone, pas contre un technicien.
- **Correction proposée** : même mécanisme que pour le créateur (la base refuse tant que le code n'est pas validé).
- **Risque** : à faire en même temps que S8.

### S10 — Demandes de démo : pas de frein contre un robot ✅🟡
- **Où** : table `demandes` (tout visiteur peut en envoyer).
- **Pourquoi** : un robot peut en envoyer 10 000 et noyer tes vraies demandes.
- **Correction** : au-delà de 40 demandes par heure, la base refuse (un vrai restaurateur n'est jamais gêné). Migration `0012`.
- **Risque** : nul.

### S11 — Adresse des comptes « tablette » sur un nom de domaine qui n'est pas à toi 🙋
- **Où** : `supabase/functions/relier-tablette/index.ts` (`tablette-xxx@tablettes.leon-app.fr`).
- **Pourquoi** : `leon-app.fr` appartient à quelqu'un d'autre. Risque très faible (il faudrait deviner l'adresse), mais ce n'est pas propre.
- **Correction** : à remplacer par ton nom de domaine dès qu'il est choisi. J'ai mis l'adresse dans un seul réglage (`LEON_DOMAINE_TABLETTES`) pour que ce soit une ligne à changer.

### Vérifié, rien à signaler
- Un patron ne voit que son resto ; un visiteur non connecté ne voit rien (testé avec les règles réelles).
- Aucune clé secrète dans le code ni dans le site (seules les clés publiques y sont, c'est normal).
- Texte piégé (script) glissé dans le cahier, les demandes, les dispos : rien ne s'exécute, sur aucun écran.
- Ton espace créateur : 2e code vérifié par la base, 5 erreurs → attente qui double. Suppression d'un resto : code redemandé, données gardées. Conforme.
- Protection « mot de passe déjà piraté » de Supabase : désactivée. **À cocher par toi** dans Supabase → Authentication → Passwords (je n'y ai pas accès).

---

## 2. Bugs (ce qui plante ou donne un faux résultat)

### B1 — Le départ badgé après minuit est perdu ✅
- **Où** : `borneDo()` (`legacy/v11_equipe.js`), `nextActions()`.
- **Pourquoi** : quelqu'un arrive à 18 h et badge son départ à 0 h 45. Léon range ce départ sur le **lendemain**, tout seul, sans arrivée. La journée de la veille reste « Départ pas badgé », 0 h payée, et à 0 h 45 la tablette propose « Pointer mon arrivée » au lieu de « mon départ ». Pour un pub, un bar ou une boîte, c'est tous les soirs. (Reproduit dans la démo.)
- **Correction** : tant qu'un service commencé la veille n'est pas terminé (jusqu'à 7 h du matin), les pointages vont sur la journée de la veille. Module `v15_correctifs.js`.
- **Risque** : faible ; ne s'applique que s'il y a une arrivée sans départ la veille.

### B2 — Aucune attente après plusieurs mauvais codes sur la tablette ✅
- **Où** : `pinCheck()` (écran des codes de l'appli).
- **Pourquoi** : tu as décidé « après plusieurs erreurs, Léon fait juste patienter ». C'est fait pour ton code et celui du patron, pas pour la tablette : on peut essayer les 10 000 codes à la suite.
- **Correction** : 5 erreurs → 30 s d'attente, qui double si ça continue, sans prévenir personne. Module `v15_correctifs.js`.
- **Risque** : nul.

### B3 — Un responsable pouvait corriger un pointage ✅ 🙋
- **Où** : `pjPeutModifier()` (`legacy/v12_feuille.js`).
- **Pourquoi** : la règle est « seul le directeur corrige un pointage ». Le code laissait aussi les responsables modifier le « payé ».
- **Correction** : seuls le patron et le directeur modifient ; le responsable voit la badgeuse sans pouvoir la changer.
- **Risque** : ta note du 3 nov. disait « manager : corriger et valider ». J'ai appliqué la règle la plus récente (ton brief). **À valider.**

### B4 — Le compte d'un responsable sur son téléphone est à moitié vide 📋 🙋
- **Où** : règles de la base (migration 0010) + `v12_chemin.js`.
- **Pourquoi** : un responsable invité a un compte « salarié ». L'appli lui affiche ses écrans de responsable (stocks, réceptions, badgeuse…), mais la base ne lui donne que les droits d'un salarié : ces écrans arrivent vides et ses saisies ne s'enregistrent pas.
- **Correction proposée** : donner aux responsables les droits de lecture / écriture sur stocks, hygiène, commandes (pas la paie, pas les codes). Demande une décision sur ce qu'un responsable a le droit de faire depuis son téléphone.

### B5 — Le directeur (qui n'est pas le patron) ne peut corriger un pointage nulle part 🙋
- **Où** : `legacy/v12_tablette.js` (écran « Direction » de la tablette).
- **Pourquoi** : le directeur n'a qu'un code, donc que la tablette. Or sur la tablette, la correction des pointages a été retirée (12.28). Il lui faudrait le compte du patron.
- **Correction proposée** : une porte « Badgeuse » sur l'écran Direction de la tablette. C'est un choix de fonctionnement : je ne l'ai pas fait.

### B6 — Sur la tablette, le directeur doit taper un mot de passe en plus du code 🙋
- **Où** : `legacy/v12_tablette.js` (12.21).
- **Pourquoi** : ton brief dit « directeur : code à 4 chiffres ». La tablette demande code + mot de passe (stocké en clair, voir S8).
- **Correction** : non touché, c'était une décision du 3 nov. À trancher.

### B7 — Code oublié : le patron ne peut jamais en choisir un nouveau 📋
- **Où** : `definir_mon_code()` (migration 0004 : « une seule fois »).
- **Pourquoi** : « Code oublié ? » le renvoie vers le mot de passe, mais il garde à vie un code qu'il ne connaît plus et retape son mot de passe toutes les 12 h.
- **Correction proposée** : après une reconnexion par mot de passe, proposer de choisir un nouveau code.

### B8 — Étiquette rapide : la DLC proposée est toujours « aujourd'hui + 3 jours » 📋
- **Où** : `kiosk-tag-print`, étiquetage rapide de la tablette.
- **Pourquoi** : la règle est « le plus proche entre la DLC d'origine et ouverture + 3 jours ». L'étiquette rapide ne connaît pas la DLC d'origine. Pour un produit qui périme demain, elle imprime J+3. (Le suivi des produits ouverts, lui, applique bien la règle.)
- **Correction proposée** : demander la DLC d'origine sur l'étiquette rapide, ou passer par « Produits ouverts ».

### Vérifié, juste
- Heures sup : +10 % de la 36e à la 39e, +20 % de la 40e à la 43e, +50 % au-delà (testé de 35 à 50 h). Temps partiel : heures complémentaires +10 % puis +25 %.
- DLC après ouverture : le plus proche entre DLC d'origine et ouverture + 3 jours (testé).
- Coût matière : coût portion / prix HT, prix conseillé arrondi à 0,50 € au-dessus (testé sur la carbonade : 4,79 € → 28,5 %).
- Le grand check : 239 écrans, aucune erreur, aucun « undefined », rien qui dépasse.

---

## 3. Parcours confus, pages mortes, vieilles versions

| | Où | Problème | Correction |
|---|---|---|---|
| P1 ✅ | `/inscription` | Vieille page (ancien style), encore accessible par son adresse, alors que ton compte existe. | Supprimée, l'adresse renvoie vers `/login`. |
| P2 ✅ | `/tablette-demo` | Page qui ne fait que renvoyer ailleurs. | Remplacée par un renvoi propre. |
| P3 ✅ | `legacy/landing.html` | Ancienne vitrine, plus utilisée nulle part. | Supprimée. |
| P4 ✅ | `legacy/reseau_v11.html`, `demo_v11.html` | Fichiers fabriqués automatiquement, enregistrés en double (3 Mo à chaque mise à jour). | Sortis du dépôt, refaits par `npm run legacy`. |
| P5 ✅ | `README.md`, `CLAUDE.md` | Parlent de `/dashboard` (n'existe plus) et d'une sécurité « reportée ». | Mis à jour. |
| P6 ✅ | `scripts/check/sonde*.cjs` | Brouillons de test. | Supprimés. |
| P7 📋 | Tables `restaurants`, `employees`, `shifts`, `time_clock_events`… | 7 tables créées au tout début, jamais utilisées (tout vit dans `leon_docs`). | Laissées (tu as dit : ne rien supprimer). À retirer ou à utiliser le jour où on sort de `leon_docs`. |
| P8 📋 | Vieux écrans de l'appli (« Crée ton Léon », identifiant du resto) | Toujours dans le code, sautés par `v12_chemin.js`. Inaccessibles sur le vrai site, visibles seulement dans la démo. | Laissés : les retirer = réécrire le cœur. |
| P9 🙋 | Film et 3 clips de la vitrine | Montrent l'ancienne tablette, et vont jurer avec le nouveau style. | À retourner après validation du style. |

---

## 4. Performance, doublons, nettoyage

| | Où | Problème | Correction |
|---|---|---|---|
| N1 ✅ | Polices | Chargées chez Google à chaque ouverture : plus lent, ne marche pas si le wifi du resto rame, et envoie l'adresse des visiteurs à Google (mauvais point RGPD). | Polices rangées dans le site. Plus aucun appel à Google. |
| N2 ✅ | `public/leon/*.html` | 1,5 Mo par page, jamais mis en cache proprement. | Règle de cache : toujours la dernière version, sans tout retélécharger. |
| N3 📋 | `legacy/` | 40 modules empilés (chaque version « enveloppe » la précédente) : 1 Mo de code, la même fonction définie jusqu'à 6 fois. Ça marche, mais chaque changement coûte de plus en plus cher. | Pas touché (règle du projet : on ajoute par-dessus). À réécrire outil par outil quand un outil est « fini ». |
| N4 📋 | `public/media/film.mp4` | 5,4 Mo chargés sur la page d'accueil. | À recompresser quand le film sera refait (P9). |
| N5 📋 | `leon_docs` | Tout un pan du resto dans un seul document (planning entier, stock entier) : deux personnes qui enregistrent en même temps → le dernier écrase l'autre. | Limite connue de l'architecture ; à traiter avec N3. |

---

## 5. Ergonomie (téléphone et tablette)

| | Où | Constat | Correction |
|---|---|---|---|
| E1 ✅ | Partout | Look « site fait par une IA » : cartes arrondies + ombres, pastilles partout, 5 couleurs pastel. | Étape 3 : nouvelle identité (voir le résumé de la PR). |
| E2 ✅ | Tablette, pavé de code | Touches de 64 px, un peu justes avec les mains mouillées. | Touches de 84 px, chiffres plus gros. |
| E3 ✅ | Boutons d'action sur téléphone | Plusieurs sous les 44 px de haut (« C'est géré », filtres). | Hauteur minimale 44 px sur téléphone et tablette. |
| E4 ✅ | Alertes | 4 façons différentes d'afficher une alerte selon l'écran. | Une seule : le « bon » (ticket avec bord de couleur). |
| E5 ✅ | Chiffres | Tailles et polices variables d'un écran à l'autre. | Tous les chiffres en police « ticket de caisse », alignés. |
| E6 📋 | Démo | La barre « DÉMO » cache parfois un bouton en bas d'écran. | À déplacer (démo seulement). |
| E7 📋 | Traductions | Tamoul, arabe : jamais relus par quelqu'un qui parle la langue. | Déjà noté dans `IDEES.md`. |

---

## À valider par Maurice

1. **S4** — `/tablette` ne marche plus que sur une tablette reliée par le lien. OK pour toi ?
2. **B3** — Un responsable ne peut plus modifier le « payé » de la badgeuse (seulement le directeur / patron). OK, ou tu veux revenir à ta note du 3 nov. ?
3. **B5 / B6** — Le directeur sur la tablette : (a) doit-il pouvoir y corriger un pointage ? (b) code seul, ou code + mot de passe comme aujourd'hui ?
4. **B4** — Qu'est-ce qu'un responsable a le droit de faire depuis **son téléphone** (stocks, réceptions, hygiène) ?
5. **S11** — Le nom de domaine définitif (pour les adresses techniques des tablettes et les e-mails).
6. **Migration `0012` + fonction `leon-ia`** : prêtes et testées sur une copie, **pas appliquées** sur la vraie base (règle du projet : ton accord d'abord). À appliquer au moment de la fusion.
7. **P9** — Refaire le film et les clips avec le nouveau style.
8. **Supabase** : cocher la protection « mots de passe piratés » (2 clics, toi seul y as accès).
