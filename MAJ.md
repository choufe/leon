# Journal des mises à jour de Léon

Numérotation : **12.00** = gros chapitre terminé, **12.01, 12.02…** = petites tâches dans ce chapitre.
Version actuelle = la dernière entrée en bas de la liste (la plus récente en haut).

---

## 12.13 — Léon propose une solution à chaque problème
- Dans « Léon a vérifié ce planning » et dans le ⚠ des cases : sous chaque problème, **une** solution calculée par Léon, avec un bouton **Faire** (annulable).
- Ce qu'il sait faire :
  - **11 h de repos** : il partage la coupure, finir un peu plus tôt la veille ET commencer un peu plus tard le lendemain, au quart d'heure (« Yanis finit à 00:30 jeudi et commence à 11:30 vendredi : 11 h pile, chaque journée ne bouge que de 30 min ») ;
  - trop d'heures sur la journée ou amplitude > 13 h : finir plus tôt (ou commencer plus tard) ;
  - heures sup, complémentaires, 48 h : donner un shift à quelqu'un, seulement si le total d'heures en plus baisse ;
  - sous le contrat : récupérer un shift de quelqu'un qui fait des heures en plus ;
  - 2 jours de repos : libérer le jour le plus simple à redonner ;
  - pas dispo, absent mais planifié : donner le shift à quelqu'un de dispo (sinon à pourvoir) ;
  - pause manquante : ajouter 20 min ; shifts qui se chevauchent : les remettre bout à bout ;
  - il manque du monde à un service : ajouter la bonne personne au bon horaire, sinon créer un shift à pourvoir.
- Léon ne touche jamais au passé ni à aujourd'hui (trop tard pour prévenir), et signale quand une solution donne des heures en plus.

## 12.12 — Shift à pourvoir : toute l'équipe est prévenue
- Dès qu'un shift à pourvoir est dans une semaine publiée, chaque salarié reçoit une notif dans « Ce qui a changé » : « Shift à pourvoir vendredi 13 nov. · 18:30–23:30 (salle) : propose-toi si ça te va ».
- Ne la reçoivent pas : ceux qui bossent déjà sur ce créneau, ou qui sont absents ce jour-là. Quelqu'un qui est du matin peut se proposer pour le soir : c'est son choix, le patron valide.
- Semaine pas encore publiée : la notif part au moment de la publication. Une seule notif par shift.
- Au survol du shift à pourvoir sur le planning : « Notif envoyée à N personnes ».

## 12.11 — Voir ce que change une demande
- Dans Congés & absences, chaque demande a un bouton **« Voir ce que ça change »** (ou « Voir » pour un échange) : ça ouvre le planning de la bonne semaine avec la demande dessinée dessus. Le shift qui part est barré en rouge, celui qui arrive est en pointillés verts.
- Le bandeau d'aperçu en haut permet de **Refuser / Accepter** sans repasser par la liste, et signale les problèmes (ex. « Inès travaille déjà sur ce créneau »).
- Congé sur un planning déjà fait : **« Léon trouve une solution »**. Pour chaque shift, Léon cherche un remplaçant sans toucher au reste du planning : bon poste, pas absent, 11 h de repos, 11 h max par jour, 48 h max, 2 jours de repos, et de préférence quelqu'un à qui il manque des heures. Si personne ne colle, le shift passe « à pourvoir ». Un clic pour accepter, et c'est annulable.
- Planning pas encore fait sur ces dates : la carte affiche « Planning pas encore fait : rien ne bouge ».

## 12.10 — L'avis de Léon + Paie pour le comptable
- Planning : le bouton « Léon remplit » devient **« L'avis de Léon »**. Léon regarde la semaine et dit ce qui lui saute aux yeux : règles pas respectées, service où il manque du monde (selon les couverts prévus), service peut-être trop chargé, qui dépasse son contrat (heures sup ou complémentaires), masse salariale vs CA prévu, événements notés. Ensuite, si besoin, « Léon propose de quoi compléter ». Semaine vide → « Léon remplit la semaine ».
- Le **✦** s'explique tout de suite au survol, avec une phrase perso : « Lucas a déjà fait 1h37 d'heures sup ce mois-ci. Léon lui met 33h30 au lieu de 35h cette semaine, pour lisser sur le mois. »
- **Paie** refaite pour le comptable (convention HCR, IDCC 1979) :
  - les heures viennent du **payé de la badgeuse** (planning si pas de badge) ;
  - survol de chaque colonne = ce que c'est et pourquoi ;
  - heures sup +10/+20/+50 par semaine, **heures complémentaires +10 %/+25 %** pour les temps partiels, nuit 22 h–7 h (c'est bien la règle HCR), fériés, **1er mai à part** (payé double), absences en jours, repas = avantage en nature (4,35 € par repas depuis juin 2026) ;
  - les colonnes vides du mois sont cachées ; « Retards » et « Dimanche » enlevés (rien à payer en HCR) ;
  - alerte si des journées de badgeuse ne sont pas validées ;
  - bloc **« En clair, pour le comptable »** : une phrase par salarié ;
  - **« Fichier pour le comptable »** : CSV avec en-tête (resto, mois, règles, validé par), toutes les colonnes et les phrases.

## 12.09 — Alerte de publication
- Dans le planning (patron, directeur, managers qui font le planning) : si **la semaine prochaine n'est pas publiée à moins de 7 jours**, un bandeau le dit (orange, rouge à 3 jours) avec le bon bouton : « Voir la semaine prochaine », puis « Publier » (ou « Léon remplit » si elle est vide). Rappel aussi sur l'entrée Planning du menu. Disparaît dès que c'est publié.

## 12.08 — Léon assume ses choix
- Ce que Léon a rempli reste marqué d'un petit **✦** (coin de la case) ; en survolant : « proposé par Léon : match du LOSC… ».
- Quand Léon vise volontairement moins que le contrat (heures sup du mois à lisser), c'est affiché à côté du nom : « 36h30 / **✦33h30** » (survol = la raison).
- Si on modifie le planning et que ça dépasse ce que Léon avait visé, un message **sans bloquer** : « Lucas : Léon avait mis 33h30 au lieu de 35h exprès (déjà +1h37 d'heures sup ce mois-ci). Ça fait maintenant 36h30. » avec **Annuler** ou **Garder**.
- Les cibles de Léon sont enregistrées avec le planning (elles restent après rechargement).

## 12.07 — « Léon remplit », version maline
- Repart de l'existant (couverts prévus, dispos, contrats, règles HCR, semaine type) et ajoute :
  - **Les événements** notés dans la note du jour : match (LOSC, PSG, foot, rugby…) → +30 % le soir, un barman en plus et **fin repoussée de 30 min** ; concert / spectacle → +25 % le soir ; braderie, marché de Noël, fêtes… → +35 % toute la journée ; groupe / anniversaire / privatisation → on ajoute le nombre de personnes au bon service (midi ou soir, deviné dans la note).
  - **Le lissage des heures sup sur le mois** : quelqu'un qui a déjà fait des heures en plus ce mois-ci (payé de la badgeuse, sinon planifié) est visé plus bas cette semaine (jusqu'à −20 % de son contrat) et passe après les autres pour les renforts.
  - **2 jours de repos** minimum, 11 h entre deux journées, 11h30 max par jour.
- Nouvel écran avant d'accepter : « Ce que Léon a pris en compte » (événements, lissage, règles), les shifts proposés par salarié (avant → après / contrat, « finit tard »), le coût (masse salariale / CA prévu), ce qui manque encore (+ shifts à pourvoir). Survoler un shift dit pourquoi Léon l'a proposé. Rien n'est ajouté sans « Ajouter au brouillon », et tout s'annule en un clic.
- Module `legacy/v12_remplit.js`. Aucune mise à jour de la base.

## 12.06 — Retouches : pleine largeur, repos obligatoires, badgeuse plus simple
- **Toute la largeur de l'écran** est utilisée, menu ouvert ou replié (plus de vide à droite).
- **Onglet marque-page** du menu en doré : visible en mode sombre comme en clair.
- **Badgeuse** : plus de couleur ni de mention « corrigé ». On valide la journée → tout passe au vert. Si on change une heure ensuite, la journée repasse « À valider » : on revalide pour être sûr.
- **Planning : jours de repos** affichés (« Repos ») sur les cases vides, et règle durcie : **2 jours de repos obligatoires** par semaine (le dimanche + un autre), sinon ⚠ rouge à côté du nom.
- Cases des journées en coupure un peu plus grandes.

## 12.05 — Badgeuse sur le modèle Skello, menu en marque-page, Pointage simplifié
- **Pointage = la Badgeuse, et rien d'autre** : plus d'onglets « En direct », « Heures à valider », « Borne de pointage », « Relevé d'heures ». Le staff n'a plus d'entrée Badgeuse dans son menu (il pointe sur la tablette).
- **Badgeuse redessinée** (alignée, comme Skello) : jours à gauche avec ✓, filtres « Prévus » / « Absences planifiées », bandeau « Journée validée » ou « En attente de validation », et pour chaque service une ligne : prévu (début vert, fin violet), pause, **badgé** (texte simple ; rouge = retard / départ manquant, bleu = parti après), **payé** (début, fin, pause), Abs., total, menu ⋯ (Il était là, heures sup, fin prévue, revenir au calcul de Léon).
- **Payé au quart d'heure** : on clique une heure → liste au quart d'heure autour de la valeur, un clic suffit. On peut toujours taper l'heure à la main (1500, 15h, 15:00).
- Seuls le patron et le directeur modifient le payé et valident ; les managers voient sans modifier.
- **Menu en marque-page** : un onglet qui dépasse du menu pour le replier/déplier. Replié, le menu disparaît complètement et la page prend toute la largeur (planning et badgeuse s'agrandissent). Replié par défaut sur Planning et Badgeuse.
- **Plus de bouton « Retour »** en haut.

## 12.04 — Façon Skello : badgeuse, planning compact, menu repliable, pointage seulement sur la tablette
- **On ne pointe que sur la tablette du resto** : plus de bouton « pointer » dans le profil de l'employé (message « Pointage sur la tablette du resto »). Le manager ne pointe plus « à la place de » : il corrige le PAYÉ dans la badgeuse.
- **Badgeuse** (1er onglet de Pointage) : les jours de la semaine à gauche (✓ validée, rouge = à régler), et pour chaque salarié : prévu, pause, **badgé** (vert à l'heure, rouge retard ou départ manquant, bleu parti après) et **payé modifiable directement** (début – fin · pause, on peut taper 1500, 15h ou 15:00). Le badgé ne bouge jamais. Case « Abs. ». Bouton « Calcul Léon » pour annuler une correction. Valider la journée = directeur, verrouillé pour la paie.
- **Menu de gauche repliable** : replié tout seul sur Planning et Pointage (icônes seulement), bouton pour l'ouvrir/fermer, Léon retient le choix.
- **Planning compact** : une ligne par salarié (nom + heures/contrat sur une ligne), 2 shifts = 2 petites cases empilées, couleurs plus douces avec un trait du poste.
- **⚠ sur la case** quand une règle n'est pas respectée (rouge = interdit HCR, orange = à vérifier) : on clique, Léon explique. Les alertes de la semaine (heures sup, repos hebdo…) sont à côté du nom.
- **Les employés voient le planning de toute l'équipe** par défaut (et les shifts à pourvoir), sans heures, contrats ni coûts. « Mon planning » reste à un clic.
- Modules `legacy/v12_feuille.js` (réécrit), `legacy/v12_ergo.js`, `legacy/v12.css`. Aucune mise à jour de la base.
- Reste : relier la vraie tablette du resto (aujourd'hui la « Borne de pointage » s'ouvre aussi depuis le téléphone d'un manager).

## 12.03 — Pointage : la « Feuille de jour » (prévu / badgé / payé)
- Nouvel onglet en premier dans Pointage (directeur et managers) : la journée d'hier, salarié par salarié, avec **prévu**, **badgé** (chaque badge), **payé** (calculé par Léon), total et ce qui est à regarder.
- Règles de paie : en avance ou jusqu'à 5 min de retard = payé à l'heure prévue ; plus tard = payé à l'arrivée ; parti jusqu'à 15 min après = fin prévue ; au-delà = le directeur choisit « Garder les heures sup » ou « Ramener à la fin prévue » ; pause badgée sinon pause prévue. Les journées en coupure (midi + soir) sont calculées service par service.
- En haut : prévu, payé (+/- par rapport au prévu), retards, coût de la journée (si on voit les salaires).
- Lignes rouges (départ pas badgé, pas de badge du tout) : à régler avant de valider (« Il était là », « Corriger »).
- **Valider la journée** : réservé au directeur / patron. Ensuite c'est verrouillé pour la paie (plus de correction possible, sauf « Rouvrir » par le directeur). Les managers voient « En attente du directeur ».
- Le relevé d'heures pour la paie compte désormais les **heures payées**, plus les badges bruts.
- On peut revenir jusqu'à 14 jours en arrière. Module `legacy/v12_feuille.js` + `legacy/v12.css`, rien de réécrit. Aucune mise à jour de la base.

## 12.02 — « Mon entreprise » : le suivi de Maurice
- Nouvel onglet en haut de l'espace créateur (c'est là qu'on arrive) : **objectif 5 restos à 400 €** avec barre de progression, revenu par mois, encaissé ce mois, **à encaisser** (qui te doit), résultat de l'année.
- **Mes clients** : formule (Fondateur 400 €, Normal 450 €, Offert ; mensuel ou à l'année avec 2 mois offerts ; mois offerts pour le parrainage ; prix sur mesure possible), date de début, prochaine échéance, payé, situation (À jour / Doit X €), bouton « Encaissé ». Les restos de test et ceux de Maurice ne comptent pas.
- **Demandes de démo** en entonnoir : demandes → rappelées → démos → gagnées, avec les %.
- **Le cahier de compte** : chaque entrée (abonnements, kits) et sortie (matériel, logiciels, nom de domaine, pub…), total de l'année, et **« Fichier pour le comptable »** (tableur CSV).
- Base : migration `0008_entreprise.sql` appliquée le 2 nov. (formule sur chaque resto + table `leon_compta`, lecture réservée au créateur). Mis en ligne le 2 nov.

## 12.01 — Espace créateur : supprimer un resto en sécurité
- Sur la fiche d'un resto : « Supprimer ce restaurant » → « Tu es sûr ? » (ce qui va se passer) → **retaper son 2e code**. Impossible de supprimer par erreur d'un clic.
- « Supprimer » = mettre de côté : plus personne n'y entre (le patron voit « Ce Léon est fermé, appelez Maurice »), mais **toutes les données sont gardées**. Le resto passe dans « Supprimés » en bas de la liste, avec un bouton « Récupérer ».
- Mauvais code : mêmes règles que d'habitude (5 erreurs → attente).
- **Resto de test** : dans « Ajouter un restaurant », case « Resto de test » → créé tout de suite, sans patron ni mail, badge violet « Test ». Maurice y entre depuis sa fiche (« Entrer dans ce resto »).
- Base : migration `0007_supprimer_resto.sql` appliquée le 2 nov. Mis en ligne le 2 nov.

## 12.00 — Un seul chemin (1re partie)
- Dans le vrai site, la connexion Léon (e-mail + mot de passe, puis code à 4 chiffres) est la **seule porte**. L'ancienne app ne montre plus jamais ses vieux écrans : « Crée ton Léon », identifiant + mot de passe du resto, verrou de l'appareil.
- Premier passage d'un patron : son resto est créé tout seul avec le nom donné à l'invitation, vide, avec la « Mise en route » (équipe, carte, produits, inventaire, planning, caisse).
- Chaque compte = un resto : plus de « Mes restaurants », plus de vue réseau, plus de « Admin Léon » (→ « Patron »), plus de « Tu y es en créateur ». La liste des restos, c'est l'espace créateur `/createur`.
- Page `/dashboard` supprimée. La démo n'est pas touchée.
- Module `legacy/v12_chemin.js` (ajouté par-dessus, rien de réécrit).
- Reste : la tablette du resto (mode borne) reliée par un lien perso ; « Réglages » à trier (zone admin, identifiants de l'ancienne version).

## 11.10 — Tunnel du compte créateur réparé + inscription qui se ferme
- Bug trouvé le 2 nov. par Maurice : après le lien du mail de confirmation, il n'était pas connecté et n'arrivait jamais à l'écran « Choisissez votre 2e code ». Et même en se connectant, `/login` l'envoyait vers `/app` (il n'était pas encore inscrit comme créateur).
- Le lien du mail mène maintenant à `/login?confirme=1` : bandeau vert « Adresse confirmée, connectez-vous », puis Léon emmène directement au choix du code. Sur le même appareil, la connexion se fait toute seule.
- Après connexion, le tout premier compte devient créateur et part sur `/createur` (choix du 2e code). Bouton « Entrer dans Léon » (déjà connecté) : même aiguillage.
- Un lien de mail qui tomberait sur l'accueil (confirmation, invitation, mot de passe oublié) est renvoyé vers la bonne page.
- `/app` : le créateur qui y arrive sans resto choisi est renvoyé vers son espace (fini le vieil écran « Crée ton Léon » vu par Maurice le 2 nov.). Pour entrer dans son propre resto depuis `/createur` : `/app?moi=1`.
- `/inscription` se ferme dès que le créateur a choisi son code (« comptes sur invitation, demandez une démo »). Migration `0006_inscription_fermee.sql` appliquée le 2 nov.

## 11.09 — Page d'accueil finie (~90 %) + demandes de démo dans l'espace créateur
- **Vitrine** : l'offre affiche les vrais prix (450 € barré, **400 € HT/mois offre fondateur** pendant l'année de lancement), mise en route offerte, 2 mois offerts si l'année est payée d'un coup, 1 mois offert par resto recommandé, matériel acheté au prix coûtant et qui reste au resto.
- **« Ce qu'on me demande souvent »** : 7 questions (matériel, langues, pointage uniquement sur la tablette, caisse, démarrage, plusieurs établissements, données).
- « Comment ça marche » mis à jour (Léon guide l'installation, 2 semaines d'accompagnement).
- **Barre « Demander une démo » collée en bas** sur téléphone.
- **Pages légales** `/mentions-legales` et `/confidentialite` (liens en pied de page et sous le formulaire). Trous surlignés à remplir : société, SIRET, adresse, e-mail et téléphone pro.
- Correctif : les textes des boutons sur fond vert (« Se connecter », « Essayer », « Demander une démo ») sortaient en foncé, illisibles. Corrigé sur toutes les pages.
- **Espace créateur → « Demandes de démo »** : pastille « X à rappeler », bouton Appeler, notes, suivi (À rappeler, Rappelée, Démo faite, Gagnée, Perdue) et « Créer son Léon » qui ouvre le tunnel avec le resto et le patron déjà remplis.
- Ton numéro (06 45 86 90 03) : dans les mentions légales, la confidentialité, l'appel final de la vitrine (« Ou appelez-moi ») et l'écran « C'est noté ». Restent à remplir : SIRET (entreprise pas encore créée) et e-mail pro.
- Base : migrations 0003, 0004 (corrigée : chiffrement via le schéma `extensions`) et 0005 appliquées le 2 nov., fonction `inviter-patron` déployée. **Mis en ligne le 2 nov. (11.05 à 11.09) avec l'accord de Maurice.**

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
