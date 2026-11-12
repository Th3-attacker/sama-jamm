# Sama Jàmm · conception du système

Nov 11, 2026 · @ELhadj Malick

Comment l'app est construite de bout en bout : ce qui tourne sur le téléphone, ce qui vit sur le serveur, comment les données circulent, et pourquoi. À lire avec le design system Sama Jàmm (charte, jetons, composants, écrans) et la fiche technique de la maquette (React Native d'abord, puis Expo).

## Vue d'ensemble

Sama Jàmm est d'abord une app qui marche seule. Le Coran, les xassaïdes, les invocations, les horaires, la qibla, le dhikr et le budget fonctionnent sans réseau et sans compte. Le serveur n'existe que pour ce qui se partage : le khatm à plusieurs, la copie des favoris et des réglages sur un autre téléphone, l'audio à télécharger et les mises à jour du contenu.

&#91;embedded content: architecture · le téléphone et le serveur\]

Une seule base de code React Native avec Expo (SDK 58, TypeScript strict) pour iPhone, iPad et Android. Le serveur est Supabase : authentification, Postgres avec règles d'accès par ligne, stockage, temps réel. L'audio est servi par un CDN.

## Principes de conception

Sept règles décident de tout le reste. Quand un choix technique hésite, on revient ici.

1. **Hors ligne d'abord.** Tout ce qui se lit, se prie ou se compte marche sans réseau. Le réseau est un bonus, jamais une condition.
2. **Le budget ne quitte jamais le téléphone.** Base chiffrée, aucune copie sur le serveur, aucune ligne de budget dans les journaux de plantage. La seule sortie est un export que l'utilisateur déclenche lui-même.
3. **React Native d'abord, puis Expo, puis la communauté.** Un composant ou une API de base avant un paquet Expo ; un paquet Expo avant un paquet tiers. Chaque dépendance ajoutée est justifiée dans la fiche technique.
4. **Une seule source pour l'apparence.** Les couleurs, tailles et espaces viennent de `tokens.json` du design system, transformé en thème TypeScript. Aucune valeur en dur dans un écran.
5. **Le texte sacré reste intact.** Le Coran s'affiche en arabe seul, jamais tronqué ; la translittération n'apparaît que si l'utilisateur l'active. Le contenu est en lecture seule et vérifié par empreinte à chaque mise à jour.
6. **Aucune pression.** Pas de publicité, pas de traceur, pas de série à perdre, pas de classement, pas de notification qui culpabilise.
7. **Le serveur reste simple et remplaçable.** La logique métier (horaires, budget, zakat, recherche) vit sur le téléphone. Le serveur stocke ce qui se partage et vérifie qui a le droit d'y toucher, rien de plus.

## L'app : couches, modules, état

Quatre couches, chacune ne parle qu'à celle du dessous.

| Couche | Dossier | Rôle | Ne fait jamais |
| --- | --- | --- | --- |
| Écrans | `app/` | Une route Expo Router par planche de la maquette ; assemble les composants et appelle les hooks des modules | Lire une base ou appeler le serveur directement |
| Composants | `src/ui/` | Un fichier par composant du design system, stylé par le thème | Contenir une règle métier |
| Modules | `src/features/<module>/` | La logique : calculs, règles, planification ; expose des hooks (`useHoraires`, `useEnveloppes`…) | Connaître l'apparence |
| Données | `src/data/` | Accès aux trois bases SQLite et au serveur, migrations | Prendre une décision métier |

### Les modules

| Module | Contient | Dépend de |
| --- | --- | --- |
| `priere` | Horaires (`adhan`), qibla, dhikr, planification des rappels | `expo-location`, `expo-notifications` |
| `lecture` | Bibliothèque, lecteur, recherche, favoris, progression | `contenu.db`, `utilisateur.db` |
| `audio` | Lecture, file d'attente par verset, minuterie, téléchargements | `expo-audio`, `expo-file-system` |
| `budget` | Carnet, cycle, enveloppes, opérations, épargne, dettes, zakat, devises | `budget.db` |
| `khatm` | Créer, inviter, prendre un juz, suivre l'avancée | Serveur (temps réel) |
| `compte` | Connexion, synchronisation des favoris et réglages, suppression | Serveur |
| `horsapp` | Pont vers le système : contenu des widgets, activité en direct, compte à rebours Android | `expo-widgets`, module natif |

### L'état

- **Local à un écran** : `useState` et `useReducer` de React. C'est le cas le plus courant.
- **Partagé et durable** (réglages, thème, langue) : un contexte React, chargé depuis `utilisateur.db` au démarrage et réécrit à chaque changement.
- **Partagé et rapide** (lecture audio en cours, position du verset) : un petit magasin `zustand`, car il change plusieurs fois par seconde et ne doit pas redessiner toute l'app.
- **Distant** (khatm, compte) : `@tanstack/react-query` avec cache, pour afficher la dernière version connue hors ligne.

Les données locales se lisent de façon synchrone ou presque (SQLite sur le téléphone) : pas d'écran de chargement pour elles, sauf au-delà de 300 ms.

## Données sur le téléphone

Trois bases SQLite (`expo-sqlite`), séparées parce qu'elles n'ont ni le même propriétaire, ni le même cycle de vie, ni le même niveau de secret. Le schéma complet de chaque table est dans le design system (pages Lecture et audio, Budget du foyer, Dettes entre proches).

| Base | Contenu | Qui écrit | Chiffrée | Mise à jour |
| --- | --- | --- | --- | --- |
| `contenu.db` | Coran (texte arabe uthmani, translittération, juz, hizb, page, sajda), xassaïdes, invocations et leur sens, sources et licences, index de recherche, minutage des récitations | Personne : lecture seule | Non | Remplacée en entier par une version vérifiée |
| `utilisateur.db` | Réglages, favoris, progression de lecture, compteur de dhikr, jours de lecture, téléchargements, file des rappels planifiés | L'app | Non : rien de sensible | Migrations SQL |
| `budget.db` | Carnets, devises, comptes, cycles, enveloppes, plafonds, opérations, objectifs, dettes et remboursements, biens de la zakat | L'app | Oui : SQLCipher, clé de 256 bits dans `expo-secure-store` | Migrations SQL |

### Règles communes

- **Identifiants** : UUID v7 (triables dans le temps), générés sur le téléphone.
- **Dates** : ISO 8601 en heure locale pour ce que l'utilisateur voit (opérations, échéances) ; UTC pour ce qui part au serveur.
- **Argent** : entiers dans la plus petite unité de la devise du carnet. Aucune colonne `REAL`, aucun calcul en virgule flottante.
- **Migrations** : un numéro par base (`PRAGMA user_version`), des fichiers SQL numérotés dans `src/data/migrations/<base>/`, joués au démarrage dans une transaction. Une migration ratée annule tout et l'app s'ouvre sur l'écran Erreur, sans rien perdre.
- **Chiffrement vérifié** : au premier lancement, `PRAGMA cipher_version` doit répondre. Sinon SQLCipher n'est pas dans le build, la clé serait ignorée sans erreur et la base resterait en clair : l'app refuse alors d'ouvrir le budget.
- **Recherche** : index FTS5 dans `contenu.db`, construit à la fabrication de la base (pas sur le téléphone), sur le texte arabe normalisé (sans voyelles, alifs unifiés) et la translittération sans signes.

### Fichiers

- Audio téléchargé : dossier documents de l'app, `audio/<recitateur>/<sourate>/<verset>.mp3`, listé dans `utilisateur.db`.
- Polices et sons d'appel : embarqués dans l'app.
- Images de partage : créées dans le cache, effacées après le partage.

## Le serveur

Supabase, dans une région européenne (la plus proche de Dakar et Nouakchott). Il n'est utile qu'à ceux qui créent un compte ; sans compte, l'app ne l'appelle que pour la configuration publique et les téléchargements.

### Authentification

Connexion avec Apple, avec Google, ou par lien reçu par e-mail. Pas de mot de passe. Le compte sert à trois choses seulement : lire à plusieurs (khatm), retrouver ses favoris et ses réglages sur un autre téléphone.

### Tables (Postgres)

| Table | Colonnes principales | Qui peut lire | Qui peut écrire |
| --- | --- | --- | --- |
| `profils` | `id` (= utilisateur), `prenom`, `langue`, `cree_le` | Soi ; les membres d'un même khatm voient le prénom | Soi |
| `khatms` | `id`, `nom`, `intention`, `echeance`, `createur_id`, `code_invitation`, `rejoindre_par_lien`, `etat`, `cree_le` | Les membres | Le créateur |
| `khatm_membres` | `khatm_id`, `profil_id`, `role`, `rejoint_le` | Les membres | Par la fonction `rejoindre_khatm` seulement |
| `khatm_parts` | `khatm_id`, `juz` (1 à 30), `etat` (`libre`, `en_cours`, `lu`), `profil_id`, `maj_le` | Les membres | Par les fonctions `prendre_juz`, `rendre_juz`, `terminer_juz` |
| `favoris_sync` | `profil_id`, `cle` (verset, chant, invocation), `ajoute_le`, `supprime` | Soi | Soi |
| `reglages_sync` | `profil_id`, `donnees` (JSON), `maj_le` | Soi | Soi |
| `config_app` | versions minimales iOS et Android, version, adresse et empreinte SHA-256 de `contenu.db` | Tout le monde | L'équipe |

Chaque table a ses règles d'accès par ligne (RLS) activées. Aucune table ne contient de position, de montant ni de ligne de budget.

### Fonctions

- `prendre_juz(khatm, juz)` : passe la part de `libre` à `en_cours` pour l'appelant en une seule instruction (`UPDATE … WHERE etat = 'libre'`). Si deux personnes touchent le même juz à la même seconde, une seule l'obtient ; l'autre voit « Ce juz vient d'être pris ».
- `rendre_juz` et `terminer_juz` : rendent la part libre ou la marquent lue.
- `rejoindre_khatm(code)` : vérifie le code et l'état du khatm, ajoute le membre.
- `supprimer_compte` : efface le profil, les favoris et réglages copiés, libère les parts en cours, puis l'utilisateur. Appelée depuis l'app (Plus › Compte) et depuis une page web déclarée aux stores.

### Temps réel

Le canal temps réel de Supabase sur `khatm_parts`, filtré par khatm : la grille des 30 juz se met à jour chez tous les membres quand l'un d'eux prend ou termine une part.

### Stockage et audio

- **Contenu** : un espace public contient chaque version de `contenu.db` et un petit manifeste (version, taille, SHA-256). Lecture publique, écriture par l'équipe seulement.
- **Audio** : fichiers MP3 derrière un CDN, un dossier par récitateur, un fichier par sourate et un par verset (pour la lecture verset par verset et l'écran verrouillé). Le choix du CDN est une décision ouverte.

## Flux clés

### Horaires et rappels

1. La position est lue une fois (ou la ville choisie). Elle reste sur le téléphone.
2. `adhan` calcule les cinq horaires du jour avec la méthode et les ajustements réglés.
3. Le module `priere` remplit une fenêtre de notifications locales. iPhone n'en garde que 64 par app : avec 5 appels par jour, 12 jours ; avec les rappels avant chaque prière, 6 jours. Quatre places restent pour le khatm, la zakat et les dettes.
4. La fenêtre est refaite à chaque ouverture, au retour au premier plan, après un changement de réglage ou de position (plus de 25 km), et par une tâche de fond quotidienne qui n'est pas garantie.
5. Chaque notification a un identifiant stable (`priere-2026-10-29-asr`) : on annule puis on replanifie sans doublon.
6. Les mêmes horaires alimentent les widgets et l'activité en direct (section suivante).

### Lecture et audio

1. Le lecteur lit `contenu.db` : l'arabe toujours, la translittération si le réglage est actif.
2. Écouter une sourate crée une file d'attente d'un fichier par verset (`AudioPlaylist` d'`expo-audio`) : local s'il est téléchargé, sinon en flux.
3. La position dans le son indique le verset en cours, qui s'illumine dans le lecteur et s'affiche sur l'écran verrouillé ; précédent et suivant y changent de verset.
4. La progression est enregistrée au verset près quand le défilement s'arrête ou que la piste change : c'est elle que montrent « Reprendre » et le widget.

### Khatm à plusieurs

1. Le créateur, connecté, crée le khatm : 30 parts libres et un code d'invitation.
2. Il partage un lien (`Share` de React Native) par WhatsApp ou SMS. Le lien ouvre l'app sur l'invitation, ou le store si elle n'est pas installée.
3. L'invité se connecte, `rejoindre_khatm` l'ajoute, il choisit un juz : `prendre_juz` le réserve sans conflit possible.
4. La grille se met à jour en temps réel chez tous. Hors ligne, chacun voit la dernière version connue avec sa date.
5. Le rappel « deux jours avant la fin » est une notification locale planifiée sur le téléphone de chaque membre qui a une part en cours, annulée dès qu'il la termine. Aucun envoi depuis le serveur.

### Mise à jour du contenu

1. Au démarrage, en Wi-Fi ou avec un réseau, l'app lit `config_app` : version de `contenu.db` disponible et son empreinte.
2. Si elle est plus récente, elle la télécharge à côté de l'ancienne, vérifie l'empreinte SHA-256, puis remplace l'ancienne au prochain démarrage.
3. Une empreinte fausse : le fichier est jeté, l'ancienne base reste. Le texte sacré n'est jamais modifié en place.

### Budget

1. Au premier usage, une clé aléatoire de 256 bits est créée et rangée dans `expo-secure-store` (trousseau iOS, Keystore Android).
2. `budget.db` s'ouvre avec cette clé. Si le verrou est actif, il faut d'abord l'empreinte, le visage ou le code du téléphone ; il retombe après 5 minutes en arrière-plan.
3. Chaque saisie est une transaction SQLite : l'opération et ses effets (plafond, reste, dette soldée) sont écrits ensemble ou pas du tout.
4. Sauvegarde : export que l'utilisateur déclenche, en CSV lisible après confirmation, ou en fichier chiffré par un mot de passe qu'il choisit. Il le range où il veut. Le serveur n'en voit rien.
5. Perdre le téléphone sans export, c'est perdre le budget : l'app le dit clairement au premier usage et propose l'export une fois par mois.

### Compte et synchronisation

1. Sans compte, rien ne part. Avec un compte, les favoris et réglages cochés sont copiés.
2. Fusion : pour les favoris, l'union des deux téléphones (une suppression est une ligne marquée `supprime`) ; pour les réglages, le plus récent l'emporte (`maj_le`).
3. La copie part à chaque changement si le réseau est là, sinon elle attend dans une file locale et repart au retour du réseau.

## Hors de l'app

Ce qui vit en dehors de l'app tourne dans le système du téléphone, pas dans le JavaScript. L'app prépare les données à l'avance et les confie au système ; elle ne peut pas compter sur le fait d'être ouverte au bon moment. Le détail par élément est dans la fiche technique et dans la page « Hors de l'app » du design system.

| Élément | Qui l'affiche | Données fournies par l'app | Quand l'app les rafraîchit |
| --- | --- | --- | --- |
| Notifications de prière et rappels | Le système, à l'heure dite | Fenêtre de 6 à 12 jours de notifications locales | Ouverture, retour au premier plan, changement de réglage, tâche de fond |
| Lecture sur l'écran verrouillé | Le système, pendant l'écoute | Titre, récitateur, pochette, verset en cours | À chaque verset |
| Widgets iPhone | Le système, d'après une frise d'entrées | Plusieurs jours d'horaires, une entrée par minute dans l'heure avant chaque prière ; la reprise de lecture | À chaque calcul d'horaires et à chaque reprise enregistrée |
| Widgets Android | Le système, d'après le dernier état | L'heure de la prochaine prière (pas de compte à rebours) ; la reprise | À chaque prière passée et à chaque reprise |
| Activité en direct, Dynamic Island | Le système, après démarrage par l'app | Prière, heure, début de la période | Démarrée quand l'app est ouverte dans les 30 minutes avant la prière (première version) |
| Compte à rebours Android | Une notification continue | Heure de la prière (minuteur natif) | Alarme exacte 30 minutes avant, postée par un module natif |

### Partage des données avec les widgets

Les widgets iPhone ne lisent pas les bases de l'app : l'app leur passe un petit état (horaires, reprise) par le groupe d'apps (App Group) que configure `expo-widgets`. Seules les données non sensibles y vont : jamais de budget.

### Tâche de fond

`expo-background-task`, une fois par jour au mieux : recalculer les horaires, replanifier la fenêtre de notifications, rafraîchir les widgets. iOS et Android décident du moment et peuvent la sauter ; c'est un filet, pas le mécanisme principal.

## Sécurité et vie privée

| Donnée | Où elle vit | Protection | Part-elle ? |
| --- | --- | --- | --- |
| Position | Mémoire et `utilisateur.db` (coordonnées arrondies) | Aucune donnée envoyée | Jamais |
| Budget, dettes, noms des proches | `budget.db` | SQLCipher, clé dans le trousseau, verrou biométrique en option, aperçu masqué dans le sélecteur d'apps | Jamais, sauf export déclenché par l'utilisateur |
| Favoris, réglages | `utilisateur.db` | — | Seulement avec un compte, si l'utilisateur coche la synchronisation |
| Prénom, e-mail | Serveur | RLS, HTTPS | Oui, pour le compte |
| Parts de khatm | Serveur | RLS : membres du khatm seulement | Oui, c'est leur rôle |
| Plantages | Service de suivi | Sans données personnelles, sans montant, sans texte saisi | Oui, anonymes |

- **Pas de publicité, pas de traceur, pas d'identifiant publicitaire.** Les déclarations de confidentialité des stores disent exactement cela.
- **Clés du serveur** : l'app ne contient que la clé publique de Supabase ; tout accès passe par les règles RLS. Les clés de service ne quittent pas le serveur.
- **Liens d'invitation** : un code aléatoire, non devinable ; le créateur peut couper « Rejoindre par le lien ».
- **Suppression du compte** : dans l'app et sur une page web, sans passer par un e-mail à l'équipe. Ce qui est sur le téléphone reste sur le téléphone.
- **Contenu** : empreinte SHA-256 vérifiée avant chaque remplacement de `contenu.db` ; le texte du Coran n'est jamais modifié après import (licence Tanzil : copie à l'identique).
- **Captures d'écran** : bloquées sur le budget seulement si l'utilisateur le demande (option).

## Hors ligne, erreurs et reprise

| Situation | Ce que voit l'utilisateur | Ce que fait l'app |
| --- | --- | --- |
| Pas de réseau | Tout marche, sauf l'audio non téléchargé et le khatm, marqués « Hors ligne » | `expo-network` écoute le retour du réseau ; les envois attendent dans une file locale |
| Téléchargement coupé | « Reprend si le réseau coupe », avec la progression | `DownloadTask` d'`expo-file-system` mis en pause, état sauvegardé, reprise au retour du réseau ou à la prochaine ouverture |
| « Seulement en Wi-Fi » et données mobiles | Le téléchargement attend, avec la raison | Aucun octet sur les données mobiles |
| Juz pris par un autre au même moment | « Ce juz vient d'être pris », grille à jour | `prendre_juz` refuse ; la grille se recharge |
| Mise à jour du contenu corrompue | Rien | Fichier jeté, ancienne base conservée, nouvel essai plus tard |
| Migration de base ratée | Écran Erreur avec un code à donner au support | Transaction annulée, aucune donnée perdue, plantage signalé |
| Clé du budget introuvable (téléphone restauré sans trousseau) | Explication et proposition d'importer un export | Ne crée jamais une nouvelle base par-dessus l'ancienne |
| Version trop ancienne | Écran Mise à jour obligatoire | Comparaison avec `config_app` ; le budget et les favoris restent intacts |
| Plantage | Redémarrage normal | Dernier écran et lecture en cours retrouvés ; rapport envoyé sans données personnelles |

Règle de rédaction : chaque message d'erreur dit ce qui a bloqué, ce qui marche encore, et quoi faire. La formule wolof « Dafa jàpp » ouvre l'écran Erreur.

## Performance

Les téléphones de référence sont les Android d'entrée de gamme très répandus au Sénégal et en Mauritanie (Tecno, Infinix, Samsung série A, 3 Go de mémoire). Si l'app est fluide sur eux, elle l'est partout. Les objectifs ci-dessous sont des propositions à valider sur ces appareils.

| Mesure | Objectif proposé | Comment le tenir |
| --- | --- | --- |
| Ouverture à froid jusqu'à l'Accueil | Moins de 2,5 s | Polices et thème chargés pendant l'écran de démarrage ; aucune requête réseau avant l'affichage |
| Défilement des 114 sourates et des versets | Sans saccade | `FlatList` avec `getItemLayout` et lignes mémorisées ; `FlashList` seulement si une mesure le justifie |
| Ouvrir une sourate | Moins de 300 ms | Versets lus par page depuis SQLite, pas toute la sourate d'un coup |
| Recherche | Résultats en moins de 200 ms | Index FTS5 construit à l'avance |
| Taille de l'app à l'installation | La plus petite possible, sans audio | Audio téléchargé à la demande ; polices limitées aux graisses utilisées |
| Batterie | Aucune consommation au repos | Pas de position en continu ; la boussole tourne seulement sur l'écran Qibla ; minuteries arrêtées en arrière-plan |
| Données mobiles | Rien sans action de l'utilisateur | Téléchargements en Wi-Fi par défaut ; mise à jour du contenu seulement si elle existe |

## Suivi des plantages et mesures

- **Plantages** : `@sentry/react-native` avec `sendDefaultPii: false`. Avant l'envoi, un filtre retire tout montant, tout nom de proche, tout texte saisi et toute coordonnée. Les événements portent la version, l'appareil, l'écran et le code d'erreur affiché à l'utilisateur.
- **Mesures d'usage** : aucune en première version. Les statistiques anonymes des stores suffisent (installations, plantages, versions).
- **Serveur** : journaux et alertes de Supabase sur les fonctions et les erreurs RLS ; aucune donnée personnelle dans les journaux applicatifs.
- **Codes d'erreur** : un préfixe par module (`AUD`, `PRI`, `BUD`, `KHA`, `CPT`, `CON`) et un numéro, affichés sur l'écran Erreur pour que le support retrouve le cas sans rien demander d'autre.

## Builds, versions et mises à jour

| Profil EAS | Usage | Canal de mise à jour |
| --- | --- | --- |
| `development` | Build de développement, nécessaire dès le début (SQLCipher, audio en arrière-plan, widgets, notifications : rien de cela ne marche dans Expo Go) | `development` |
| `preview` | Testeurs : TestFlight interne, test fermé Google Play | `preview` |
| `production` | App Store et Google Play | `production` |

- **Trois choses à versionner séparément** : l'app (numéro des stores), le JavaScript (EAS Update, `runtimeVersion` par empreinte du natif) et le contenu (`contenu.db`, sa propre version).
- **EAS Update** ne transporte que du JavaScript et des images. Un nouveau paquet natif, un widget, le module Kotlin ou un changement d'icône imposent un nouveau build et une revue des stores.
- **Version minimale** : `config_app` donne la version minimale par plateforme ; en dessous, l'écran Mise à jour obligatoire. À n'utiliser que pour une erreur grave (par exemple un calcul d'horaires faux).
- **Google Play** : un test fermé de 14 jours avec des testeurs est exigé pour un nouveau compte développeur avant la publication. À prévoir dans le calendrier.
- **Secrets** : variables d'environnement EAS ; seule la clé publique de Supabase est dans l'app.
- **Intégration continue** : à chaque branche, vérification des types, tests et génération du thème depuis `tokens.json` (le build échoue si le thème généré diffère du fichier commis).

## Tests

| Niveau | Quoi | Outil |
| --- | --- | --- |
| Calculs | Horaires (plusieurs villes, méthodes, changement d'heure), qibla, montants en entiers, cycle de paie (le 31, février), zakat (sous et au-dessus du nisab), dettes (remboursement partiel, remise, dépassement interdit), normalisation de la recherche arabe | Jest |
| Données | Migrations de chaque base, de la première version à la dernière ; chiffrement effectif de `budget.db` (`PRAGMA cipher_version`) | Jest + base SQLite de test |
| Composants | États de chaque composant du design system, trois thèmes, interface arabe | React Native Testing Library |
| Parcours | Bienvenue, ajouter une dépense, écouter une sourate écran verrouillé, prendre un juz | Maestro, sur appareils réels |
| Serveur | Règles RLS (un non-membre ne lit rien), `prendre_juz` en concurrence, suppression du compte | Tests SQL sur une branche Supabase |
| Hors de l'app | Notification à l'heure après 6 h téléphone verrouillé, sans et avec alarme exacte ; widgets en clair, sombre et teinté ; activité en direct | À la main, sur un iPhone et deux Android d'entrée de gamme |

Avant chaque version : la page Recette du design system, puis un passage complet à 200 % de taille de texte et en interface arabe.

## Décisions ouvertes

| Question | Options | Ce que je propose |
| --- | --- | --- |
| Démarrage de l'activité en direct sur iPhone | Quand l'app est ouverte dans les 30 minutes ; ou par notification push depuis un serveur qui connaît la ville | L'ouverture de l'app, pour garder la position sur le téléphone |
| Hébergement de l'audio | Stockage Supabase ; ou un CDN dédié | À trancher selon le coût du trafic et les autorisations des récitateurs |
| Mode page fidèle au Mushaf | Une police par page (QCF) ; ou des images de pages | À trancher avec le référent : licence et poids des fichiers |
| Horaires de chaque verset et de chaque vers | Reprendre un minutage existant pour le Coran ; le créer pour les xassaïdes | Indispensable pour le verset et le vers en lumière |
| Compte à rebours Android en Live Update | Optionnel et désactivé par défaut ; ou absent | Optionnel : le cas est à la limite des règles de Google |
| Sauvegarde du budget | Export manuel seul ; ou sauvegarde chiffrée de bout en bout sur le serveur | Export manuel en v1, conforme au principe « le budget ne quitte jamais le téléphone » |
| Boutons Répéter et Minuterie sur la carte de lecture Android | Les retirer ; ou un module natif Media3 | Décidé le 12 novembre : retirés de la carte, gardés dans l'app |

La première et la dernière reprennent des questions laissées dans la fiche technique : la réponse donnée là-bas vaut ici.

## Documents liés

- [Design system Sama Jàmm](https://claude.ai/artifact/LJLpjDTngAACJWdPw5kFSd) : charte, jetons, composants, inventaire des écrans, schémas des tables.
- [Fiche technique de la maquette](https://claude.ai/artifact/QZ3Shi7417TUeoU1BfKwNt) : pour chaque écran, React Native d'abord, puis Expo.
- [Maquette](https://claude.ai/artifact/XQ8t15MHjz5E4V9mFLcgkP) : toutes les planches, cliquables, et la page Hors de l'app.
- [Expo · SQLite (SQLCipher)](https://docs.expo.dev/versions/latest/sdk/sqlite/), [Expo · Widgets](https://docs.expo.dev/versions/latest/sdk/widgets/), [Expo · BackgroundTask](https://docs.expo.dev/versions/latest/sdk/background-task/), [Apple : limite de 64 notifications](https://developer.apple.com/forums/thread/811171).
