# Journal des mises à jour de Léon

Numérotation : **14.00** = gros chapitre terminé, **14.01, 14.02…** = petites tâches dans ce chapitre.
Version actuelle = la dernière entrée en bas de la liste (la plus récente en haut).

---

## 14.01 à 14.04 — Le tronc vers 60 %
- **14.01 Démarrer Léon** : la mise en route suit tout le démarrage d'un resto en 10 étapes (le resto, l'équipe, la carte, les produits, les fournisseurs, le premier inventaire, l'hygiène, la tablette, l'imprimante, le premier planning ; la caisse « plus tard », c'est Maurice). Une seule **« Prochaine étape »** bien visible, le reste replié. Guides pas à pas pour installer la tablette et imprimer une étiquette test, avec « C'est fait ». La tablette se coche toute seule quand elle tourne dans le resto.
- **14.02 Accueil rangé selon les 4 points** : « Tes 4 points » (Masse salariale → Équipe, Marchandise → Cuisine & stocks, Paperasse → Hygiène, Le resto dans la poche → Chiffres et Service), dans cet ordre.
- **14.03 Vitrine et RGPD** : aperçu soigné quand on partage le lien (image Léon, titre, description), Google ne lit que la vitrine (pas l'app ni les espaces privés), la marchandise décrite comme dans la 14.00. Nouvelle page **/info-salaries** : la note d'information des salariés pour la badgeuse, à compléter et faire signer (modèle, à faire valider). Rappel dans Salariés & accès et lien depuis Confidentialité.
- **14.04 Visite guidée de la démo** : « Commencer la visite » sur l'accueil de la démo, 9 étapes en 5 minutes (journée, planning, badgeuse, commandes, où part la marchandise, fiches, hygiène, chiffres, tablette), avec Avant / Suivant.
- **Sécurité, vérifiée dans la base** (lecture seule) : chaque patron ne voit que les données de son resto, un visiteur non connecté ne voit rien. **Un trou trouvé** : un salarié connecté peut, en passant par la base, lire tous les documents de son resto (dont la paie). À corriger par une migration, avec l'accord de Maurice.
- **Reste** : nom de domaine, e-mail pro, être prévenu des demandes, lien perso de la tablette, CGV.

## 14.00 — La marchandise, façon Inpulse (en plus simple)
Après l'analyse d'Inpulse sur le compte Burgouzz (9 nov., voir `claude/inpulse-analyse.md` dans le projet) : on reprend le meilleur (commandes, réception, inventaire, chiffres), sans ce qui perd l'utilisateur.
- **Commander** : une carte par fournisseur (prochaine livraison, « pour cette livraison, commande aujourd'hui », ce que Léon conseille, montant estimé, minimum). Un clic → Léon prépare la commande.
- **L'écran de la commande** : jour de livraison en un clic (seulement les jours où le fournisseur livre, « déjà 1 commande » signalé), « doit tenir jusqu'à la livraison suivante », **barre du minimum de commande** (« il manque 18 € »), tout le catalogue du fournisseur rangé par famille avec **le conseil de Léon** (un clic pour le prendre), gros boutons − / +, et **le stock prévu chaque soir** quand on touche un produit (barres vertes / orange / rouges, avec le camion le jour de la livraison).
- **Les colis** : un produit peut se commander « au fût de 30 L », « au sac de 10 kg »… (lien « colis ? » / « changer » sous le produit). Le conseil est arrondi au colis, la commande compte en colis, le mail aussi (« 3 fûts de 30 L »).
- **Vérifier avant d'envoyer** : récap (fournisseur, jour, total, produits en colis), alertes (pas d'e-mail, sous le minimum, **rupture prévue sur un produit oublié**), le mail repliable, « C'est envoyé ».
- **L'avoir** : après une réception avec écarts, bouton **« Demander l'avoir (24,50 €) »** → mail prêt (manquants, abîmés, prix facturés trop cher), « C'est demandé », puis « Avoir reçu ». Rappel sur l'accueil si l'avoir n'est pas arrivé au bout de 10 jours.
- **Tablette, réception produit par produit** : « Livraisons attendues » → on touche la commande → une carte par produit avec 4 gros boutons (Reçu · Pas tout · Manquant · Abîmé), « Combien reçu ? » en colis, photo du bon de livraison, température des produits frais, « Tout le reste est reçu », « Valider la réception ». Le stock monte, l'avoir est calculé, le responsable voit les écarts. Pas d'euros sur la tablette. Traduit dans les 6 langues (à faire relire).
- **Inventaire en colis** : bouton « +1 fût » / « +1 carton », et sous le produit « = 2 fûts + 4 L ».
- **Où part ta marchandise** (onglet Stock) : sur 30 jours, pertes déclarées + ce que personne ne s'explique (écarts d'inventaire), par famille ; la plus grosse en rouge avec un conseil (« Boissons : 29 € pas expliqués. Regarde les offerts et la pression… »).
- **Démo** : conditionnements réalistes (fûts, sacs, plateaux, cartons…).
- **Reste** : l'envoi automatique du mail (aujourd'hui on copie le mail), les colis dans « Ajouter un produit », le panneau « Où part ta marchandise » dans Chiffres.

## 13.02 — Léon planning : le cahier des charges et les consignes
- **Cahier des charges** (nouveau bouton dans le planning, à côté de « L’avis de Léon ») : jours et services ouverts (midi / soir), horaires de chaque service, créneaux de prépa (ex. cuisine 9 h 30 – 11 h, jours au choix), nombre de personnes min / max par service (salle, cuisine, bar), et des règles en mots simples (« le dimanche midi, 3 personnes suffisent »). Léon montre en direct ce qu’il a compris (✓) ou pas (✗). Rempli une fois, servi à chaque planning.
- **Consignes de la semaine** : « Léon remplit » ouvre d’abord une zone de texte (« mercredi soir événement, un peu plus de monde », « samedi soir +1 au bar », « lundi midi fermé »…), avec des exemples en un clic et le résumé du cahier des charges.
- **Léon applique** : effectifs min / max, consignes, services fermés, prépa (il fait commencer plus tôt un shift qu’il propose) ; il retire les shifts « pour compléter un contrat » qui dépasseraient un maximum. « Ce que Léon a pris en compte » liste chaque changement (« Dimanche midi : 1 en cuisine au lieu de 2 ») et les consignes pas comprises.
- **Heures baissées exprès** : « 29h30✦ / 35h » (planifié / contrat, avant c’était « 29h30 / ✦29h30 »). Au survol de l’étoile : pourquoi (heures sup déjà faites ce mois-ci, combien en moins).
- **L’avis de Léon** vérifie aussi la prépa et qu’il y a quelqu’un en salle à l’ouverture et à la fermeture de chaque service.
- **Démo Petit Beffroi** : 20 % de couverts en moins (ticket moyen 24 € midi / 38 € soir, CA à peu près le même) pour coller à une équipe de 10 ; cahier des charges d’exemple rempli. Masse salariale ~30 %, beaucoup moins de trous.
- **Reste** : l’avis de Léon dans les autres onglets (chiffres, hygiène…) noté dans `IDEES.md`.

## 13.01 — La démo, réservée à Maurice, et un tunnel « un resto ou plusieurs »
- **Plus de démo publique** : le site ne propose plus que « Demander une démo » (fini « Essayer Léon en ligne », « Essayer », le lien « Tablette (démo) » et la porte « Juste voir à quoi ça ressemble » de la page de connexion). Les adresses de la démo et de la tablette de démo renvoient vers « Demander une démo » si on n'est pas connecté en créateur.
- **Demander une démo** : d'abord une question, « Un restaurant » ou « Plusieurs établissements ». Chacun voit la proposition qui va avec (ce que Léon fait pour lui, le prix), puis laisse son numéro. Le nombre d'établissements n'est demandé qu'aux groupes.
- **Espace créateur → « Démos à montrer »** : « Patron de plusieurs restos » (Bruno et ses établissements), « Patron d'un resto » (Le Petit Beffroi), « Tablette du resto ». Un clic et on est dedans : plus d'écran « Lancer la démo » ni d'identifiant / mot de passe.
- **Bruno** : la vue d'ensemble s'adresse à lui (« Salut Bruno », « Patron », plus « Admin Léon » ni « Maurice ») ; son groupe = Le Petit Beffroi + Le Trèfle (le salon de coiffure n'apparaît plus).
- **Patron d'un resto** : arrive direct dans Le Petit Beffroi, avec « Voir comme » (directeur, manager, salarié) pour montrer chaque écran. Le cadenas ramène à l'espace créateur.

 — Le grand check : tout Léon repassé, écran par écran (ex-12.30)
Tour complet (site, démo, appli PC, téléphone, tablette ; directeur, manager, salarié, créateur, nouveau patron) : 174 écrans vérifiés, 0 erreur restante.
- **Téléphone et tablette** : chaque écran s'ouvre enfin **en haut**. Avant, on arrivait au milieu de la page (après le code, en changeant d'onglet…).
- **Tablette, températures** : « Relever les températures » se cochait **sans rien taper**. Maintenant une case par frigo / congélateur, et Léon demande quoi faire si c'est hors norme (comme sur le PC). Pour un congélateur, « 18 » = −18 °C. La tuile s'appelle **« Tâches et températures »**.
- **Tablette** : le bouton « Pointer mon départ » était presque invisible (corrigé) ; plus de « Bonjour » au-dessus de « Salut Inès » ; plus d'euros sur la tablette (historique des inventaires caché).
- **Tablette en tamoul, arabe, anglais, portugais, espagnol** : toute l'hygiène, la réception, l'inventaire et les listes de tâches étaient restés en français. 100 phrases traduites (à faire relire, surtout le tamoul).
- **Statistiques** : « tu perds de l'argent » s'affichait à tort en début de mois. Les charges fixes sont réparties sur les **jours d'ouverture**, et aujourd'hui ne compte qu'au prorata de ce qui est déjà vendu.
- **Badgeuse** : « Départ pas badgé » → bouton direct **« Payer jusqu'à 00:00 (fin prévue) »** sur la ligne rouge (avant : payé coupé au début de la pause, solution cachée dans « … »). « mn » → « min ». Le compteur du menu parle de la journée d'hier (plus des anciennes « heures à valider »).
- **Mêmes chiffres partout** : couverts du planning = ceux de l'accueil (groupe, match du LOSC compris) ; « 8 problèmes au planning » devient « 4 cette semaine, 4 la semaine prochaine ».
- **Mots** : « Pointage » → « Badgeuse » partout ; « Staff » → « Salarié » ; « Équipe & accès » → « Salariés & accès » ; « Ouvert le hier » → « Ouvert hier » ; « Qui voit quoi » à jour (le salarié voit le planning de l'équipe, badge sur la tablette).
- **Téléphone** : bandeaux d'alerte lisibles (plus écrasés en colonne), tableaux en cartes sans « COÛT PORTION I ».
- **Vrai site** : plus de lien « Mes restaurants » qui ne menait nulle part ; « Voir comme » caché tant qu'il n'y a pas d'équipe (et sur téléphone, seulement sur l'accueil) ; un nouveau resto est de type « Restaurant » (plus « Vide ») ; Réglages → « La tablette du resto » explique la vraie installation (adresse /tablette, mot de passe direction).
- **Démo** : la pastille « Mode démo » ne cache plus le logo ni le haut des pages (le ↻ en bas remet à zéro) ; l'écran des codes n'a plus les photos (comme la vraie tablette) ; texte d'accueil corrigé (les essais restent sur l'appareil) ; charges fixes du Petit Beffroi réalistes.
- **Site vitrine** : « photo + code » → « chacun tape son code » ; lien du bas « Tablette (démo) » ; plus de « ? » seul à la ligne dans les questions.
- **Outil** : `npm run check` refait ce grand check tout seul (captures de tous les écrans + liste des problèmes).
- **Reste à décider** : l'entrée de la démo en ligne (voir `IDEES.md`). Plus tard (décidé le 4 nov.) : refaire le film et les clips du site, SIRET et e-mail des mentions légales.

## 12.29 — Tablette : réception et inventaire pour les responsables
- **Réception** et **Inventaire** : seulement pour les **managers, le directeur et le créateur** (il faut un peu de responsabilité). Un salarié voit Hygiène et Mon planning.
- **Inventaire sur la tablette** : zone par zone (chambre froide, réserve sèche, bar…), gros boutons − / +, quantité modifiable, « Retour » qui remonte à la liste des zones ; à la fin, on valide et le stock est mis à jour (même inventaire que sur le PC). Disponible depuis l'écran du manager et depuis l'écran Direction.

## 12.28 — Tablette = tablette, pour tout le monde
- Le **directeur** et le **créateur** (code + mot de passe) restent eux aussi sur la tablette : écran **« Direction »** avec Aujourd'hui (couverts midi / soir, qui travaille, absents), Hygiène et Réception (avec le nombre de livraisons reçues). « Retour » ramène à l'écran du code. Plus aucun chemin vers l'appli PC ou téléphone depuis la tablette, quel que soit le code.
- **Mode sombre** : la tablette reste toujours en clair (comme le site) ; fini les blocs noirs dans Entretien et ailleurs.
- Rappel : la tablette de démo est **faite pour une tablette**. Sur téléphone, c'est pour tester (la mise en page passe en colonne).

## 12.27 — Tablette : la composition du site Léon + correctif manager
- **Correctif** : un manager (ex. Camille) qui tape son code sur la tablette restait sur l'appli téléphone. Maintenant il arrive sur son écran de tablette (pointer, pause, accès rapide), comme les autres.
- **Composition reprise de la page de connexion du site** : fond vert Léon, barre du haut (logo, nom du resto, heure), **une carte blanche au centre** pour l'action (icône, petit titre doré en capitales, grand titre, pavé ou bouton doré), et à côté des **« portes » vertes** (icône dorée, titre, sous-titre, flèche) pour Hygiène, Réception, Mon planning, ou pour « Au travail » et la note du jour. Plus de carrelage, de grain ni de cadre. Identique en clair et en sombre.
- Écrans Hygiène / Réception / Mon planning : en-tête vert du site, contenu sur fond clair, cartes blanches avec filet de couleur à gauche (comme les cartes du site).

## 12.26 — Tablette : une ambiance Léon + Réception avec photo de facture
- **Direction artistique « comptoir de brasserie lilloise »** : bandeau vert bouteille avec carrelage métro en filigrane et filet laiton, fond papier crème avec un léger grain, carte d'action cadrée comme un menu (double filet laiton), touches du pavé façon jetons, bouton « Pointer » en laiton poli, en-têtes du kiosque carrelés verts avec le logo crème. Plus de lueur. Même ambiance en clair et en sombre.
- **Tablette recentrée** (HACCP, badge, réceptions) : les accès rapides du salarié deviennent **Hygiène · Réception · Mon planning**. Les disponibilités des plats sortent de la tablette (la caisse s'en charge).
- **Réception** : « Nouvelle livraison » → photo de la facture ou du bon de livraison, fournisseur en un clic, température des produits frais, « Tout est conforme » ou « Il y a un problème » (+ quoi). Au-dessus de 4 °C, c'est noté en problème tout seul. Liste « Reçu aujourd'hui » avec la photo.
- Le patron retrouve les réceptions des 7 derniers jours (avec la photo) en haut de **Cuisine & stocks**.

## 12.25 — Tablette : plus fin, centré, et lisible en mode sombre
- Bandeau vert plus petit (36 % de la largeur sur tablette, bandeau compact en haut sur téléphone), logo Léon en haut à gauche, **tout le reste centré** (nom du resto, heure, prénom, statut) : c'est symétrique.
- **Mode sombre** refait : fond, cartes, touches du pavé, textes, en-tête et logo (crème en sombre) ont chacun leur couleur sombre ; plus de texte clair sur fond clair.

## 12.24 — Refonte de la tablette
- **Vraie appli, sans navigateur** : la tablette de démo a sa propre page (/leon/tablette.html) installable ; ouverte depuis l'icône de l'écran d'accueil, plus de barre d'adresse ni de « retour » du navigateur.
- **Écran du code / du salarié / « c'est pointé »** : deux panneaux aux couleurs de Léon. Panneau vert avec le logo Léon, le nom du resto, une grande heure, qui est au travail et la note du jour ; carte blanche sur fond crème avec le pavé (touches crème, points en laiton) ou « Pointer mon arrivée » en laiton et les accès rapides. Sur téléphone et tablette en portrait : bandeau vert en haut, carte en dessous.
- **Écrans du kiosque** : logo Léon dans l'en-tête, filet laiton, fond crème. « Retour » remonte d'un cran (Étiquetage → Hygiène → écran du salarié) et le titre suit la page.
- **Entretien** : les listes côte à côte sur tablette, pleine largeur sur téléphone.
- **Étiquetage** : la case date (« À consommer avant le ») s'affiche proprement sur iPhone.

## 12.23 — Téléphone et tablette : confort
- **Plus de zoom involontaire** : double tap sur un bouton (ex. + / − des disponibilités) ne zoome plus ; les champs font 16 px (l'iPhone zoomait dessus).
- **Plus de glissement vers la droite** : la page ne déborde plus ; sur iPhone/iPad le cadre de l'appli ne s'élargit plus à son contenu.
- **Tablette** : les écrans Disponibilités, Hygiène, Mon planning prennent tout l'écran (plus de bandes vertes), en-tête fixe avec « Retour » bien visible ; Hygiène = 3 grandes tuiles (3 côte à côte sur tablette) ; écran du salarié : gros bouton « Pointer », accès rapide en 3 tuiles ; pavé de code plus grand sur tablette.
- **Badgeuse sur téléphone** (manager) : une carte par personne (Prévu / Badgé / Payé + pause, Absent), plus de tableau à balader.
- La tablette de démo s'ouvre maintenant sans cadre (plus fluide) et s'installe directement (« Sur l'écran d'accueil »).

## 12.22 — Tablette : correctif
- Démo tablette : « Mon planning », « Hygiène » et « Disponibilités » ramenaient à l'écran du code. Corrigé : ils s'ouvrent bien.
- Sur ces écrans, le bouton du haut s'appelle « Retour » (il était presque invisible) et ramène à l'écran du salarié.

## 12.21 — Tablette : juste le code
- L'écran de la tablette n'affiche plus les photos de l'équipe : **juste le pavé de code** (+ qui est au travail et la note du jour).
- Code d'un salarié → son écran (pointer, accès rapide) avec un seul bouton **« Retour »** vers le code (plus d'« Ouvrir mon espace » ni d'« Annuler »). Retour automatique au code après un moment sans rien faire (déjà là).
- Code du **directeur** ou du **créateur** → **mot de passe demandé** en plus (celui de la tablette : Réglages → Connexion des appareils ; le créateur peut aussi mettre le sien).
- Démo : les codes et mots de passe de test sont dans « Codes de test », replié en bas.

## 12.20 — Tablette de démo (Le Petit Beffroi)
- Espace créateur, colonne de gauche : bloc **« Démo · Le Petit Beffroi »** avec « Ouvrir la démo » et **« Tablette de démo »**.
- La tablette de démo (/tablette-demo) s'installe avec sa propre icône et se comporte comme chez un vrai client : écran « Tablette du restaurant », photos de l'équipe du jour, pavé de code, **sans bandeau démo**. Les codes de test sont repliés tout en bas (« Codes de test »).
- Même menu limité que la vraie tablette pour le directeur ou un manager.

## 12.19 — Trois appareils : PC, téléphone, tablette
- **Appli « Léon Tablette »** : l'adresse /tablette s'installe avec sa propre icône (Safari → Partager → « Sur l'écran d'accueil »). Elle reste **toujours sur l'écran des codes** : chacun tape le sien pour badger ; le patron ou un manager entre avec son code et a seulement : Aujourd'hui, planning (lecture), hygiène, cahier, plats dispo, allergènes, fiches, stocks (réceptions, inventaire). Pas de paie, de réglages, de badgeuse à corriger ni de modif du planning. Aucun chemin vers la version PC / téléphone.
- Espace créateur : bouton **« Mode tablette »** à côté de chaque resto (pour tes tests).
- **Appli « Léon »** (téléphone) : /app, comme avant.
- Badgeuse : le **manager** peut maintenant corriger et valider (avant : patron / directeur seulement).
- Inscription des salariés : plus de mail de confirmation (réglage Supabase coupé le 3 nov., accord de Maurice). Le lien d'invitation suffit.

## 12.18 — Les salariés ont leur compte + Léon en appli sur le téléphone
- « Salariés & accès » : bouton **Inviter** à côté de chaque salarié → un lien perso à envoyer par **WhatsApp ou SMS** (ou copier). Le lien marche une fois, 14 jours. Quand le salarié a rejoint : « Sur son téléphone ».
- Page **/rejoindre** : « Salut Inès ! » → il crée son compte (e-mail + mot de passe) et arrive direct dans le Léon de son resto, avec sa vue à lui. Même Léon sur téléphone et PC. Pas de code à 4 chiffres pour lui (le code, c'est la tablette).
- Planning d’équipe (téléphone) : sa ligne est en couleur pour se repérer.
- Sur son compte, le salarié voit : son planning et l’équipe, ses congés et échanges, le cahier, plats dispo, allergènes, fiches. Pas l'hygiène ni la badgeuse (c'est la tablette).
- Migration `0009_salaries.sql` appliquée le 3 nov. (go de Maurice).
- Léon s’installe sur le téléphone : Safari → Partager → « Sur l’écran d’accueil » (plein écran, icône Léon).

## 12.17 — « Aujourd'hui » en haut de l'accueil + ménage
- En ouvrant Léon (tablette ou PC), le patron / directeur / manager qui fait le planning voit d'abord **Aujourd'hui** : couverts du midi et du soir avec qui travaille (pastilles), qui est absent, et **ce qu'il y a à faire** en boutons qui mènent direct au bon endroit : badgeuse d'hier à valider, demandes à valider, planning de la semaine prochaine à publier, problèmes au planning (Léon a une solution). Rien à faire → « Rien à faire de ton côté. Bon service. »
- Raccourcir les heures : celui qui **ferme son poste** reste jusqu'au bout (sauf si un collègue prend le relais) ; Léon raccourcit plutôt ailleurs.
- Ménage : le bouton « Supprimer le restaurant » est retiré des Réglages (la suppression se fait depuis l'espace créateur, avec le code demandé deux fois).

## 12.16 — Une solution à chaque problème, même petit
- **Un peu trop d'heures** (Yanis +1 h, Nathan +1 h…) : Léon raccourcit **15 min par 15 min, un peu partout**, là où ça ne gêne pas le service : hors coup de feu (11:30–14:00, 19:00–21:30) ou quand un collègue du même poste prend le relais. 1 h max par shift. Ça marche aussi pour un poste seul (le bar).
- Heures complémentaires « dans la limite » : Léon ramène quand même au contrat.
- **Aujourd'hui** : Léon propose une solution tant que le shift n'a pas commencé (avant : rien sur la journée en cours). Ex. Sofia pas dispo ce midi → le shift passe à pourvoir, l'équipe est prévenue.
- Pas dispo : Léon cherche d'abord quelqu'un sans heures sup ; si ça ferait exploser les heures de quelqu'un, le shift passe à pourvoir.
- Les alertes des jours déjà passés ne s'affichent plus sur le planning (on ne refait pas hier).
- **Badgeuse** : plus d'onglets « Prévus / Absences planifiées ». Juste les gens prévus ce jour-là.

## 12.15 — Léon apprend ton resto
- Fini la règle figée « 1 serveur pour 50 couverts » : Léon regarde les **semaines publiées** (jusqu'à 10) et apprend combien de couverts par personne tu mets, poste par poste, midi et soir, et le minimum que tu mets toujours (ex. jamais moins de 2 en cuisine). C'est une moyenne qui bouge doucement, pas une règle : ça suit les couverts prévus et les événements.
- Une question facultative, en 1 clic, sur le planning de la semaine en cours : « La semaine dernière, c'était bien planifié ? » → Bien / Il manquait du monde / Trop de monde. Léon s'en sert pour ajuster.
- Dans l'avis de Léon, une ligne : « Appris sur tes 9 dernières semaines : 1 serveur pour ~35 couverts, jamais moins de 2… ».
- Quand tes habitudes demandent plus que le minimum légal/raisonnable, c'est une simple info (« D'habitude tu mets 3 personnes ») : pas d'alerte, pas de shift à pourvoir inventé.
- Les shifts à pourvoir comptent dans la couverture (le besoin est posé, l'équipe est prévenue). Le récap dit quand l'équipe ne suffit pas (« pense à un extra »).

## 12.14 — Léon fait un planning propre du premier coup
- Quand Léon remplit une semaine, il **repasse derrière lui tout de suite** : il applique ses solutions une par une (le plus grave d'abord) jusqu'à ce qu'il n'y ait plus rien qu'il sache régler. Fenêtre « Ton planning est prêt » : « Léon a réglé 13 points tout seul. Il reste 1 point à trancher », détail repliable, bouton pour tout annuler.
- Heures manquantes (ex. Camille 10:00–15:00) : Léon allonge d'abord les shifts **comme le reste de l'équipe sur ce service** (commencer à 9:30 comme la cuisine, finir à 15:30…), au quart d'heure ; s'il manque encore 3 h ou plus, il ajoute un jour là où il y a le plus de couverts.
- Un peu trop d'heures : finir plus tôt (ou commencer plus tard) là où un collègue du même poste reste, le service reste couvert. Beaucoup trop : il donne un shift à quelqu'un.
- Les heures volontairement baissées par Léon (lissage du mois) ne sont plus signalées comme « il manque des heures ».
- « L'avis de Léon » : bouton **« Léon règle les N points »** + « Voir le détail ». Panneau des alertes : **« Tout régler »**.

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
