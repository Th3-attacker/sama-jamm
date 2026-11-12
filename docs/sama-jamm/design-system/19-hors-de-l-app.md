# Hors de l'app

Ce que l'utilisateur voit de Sama Jàmm quand l'app est fermée : notifications, lecture sur l'écran verrouillé, widgets, activité en direct et compte à rebours. Planches : page « Hors de l'app » du canevas (`HorsNotifIOS`, `HorsNotifAndroid`, `HorsCanauxAndroid`, `HorsLectureIOS`, `HorsLectureAndroid`, `HorsWidgetsIOS`, `HorsWidgetsThemes`, `HorsVerrouIOS`, `HorsIleIOS`, `HorsWidgetsAndroid`, `HorsCompteAndroid`). Ce que chaque élément demande à React Native puis à Expo est dans la fiche technique (https://claude.ai/artifact/QZ3Shi7417TUeoU1BfKwNt) ; le fonctionnement d'ensemble dans « Conception du système » (https://claude.ai/artifact/2aq4hMBhjbzoHvz6JVDcoH).

## Règles communes

- Le système dessine ces surfaces : la police est celle du téléphone (SF Pro, Roboto). Nos couleurs s'appliquent seulement aux fonds et accents que le système laisse choisir.
- Mêmes mots que dans l'app. Le wolof d'abord pour l'appel : « Waxtu julli jot na », puis la prière et l'heure.
- Jamais de reproche, de série ni de compte de prières manquées. Une prière passée ne déclenche rien.
- Rien sur le budget hors de l'app : ni montant dans une notification, ni widget de budget. Le rappel d'une dette dit seulement « Une échéance de dette approche. », sauf si l'utilisateur a demandé les détails.
- Le texte sacré n'apparaît pas tronqué : un widget ou une notification affiche le nom de la sourate et le numéro du verset, pas un extrait coupé.

## Notifications

| Moment | Titre | Texte | Actions |
| --- | --- | --- | --- |
| Heure de la prière | Waxtu julli jot na · Asr | 16:35 · Nouakchott | Android : « Arrêter l'appel », « Couper pour Asr » |
| Rappel avant | Asr dans 10 minutes | Pour se préparer sans se presser. | — |
| Khatm | Khatm de la famille | Il reste votre juz 12, à terminer avant vendredi 6 novembre. | — |
| Téléchargement (Android) | Yā-Sīn · Mishary Al-Afasy | 38 Mo sur 120 Mo · reprend si le réseau coupe | Barre de progression |

- Icône de notification Android : `assets/Icônes/notification-icon.png` (silhouette blanche), couleur d'accent `marque-emeraude`.
- iPhone : l'appel est un extrait de moins de 30 secondes (`aiff`, `wav` ou `caf`) ; au-delà, iOS joue le son par défaut. Niveau « sensible au facteur temps » pour l'appel, avec la capacité Time Sensitive Notifications.
- Android : l'appel complet est le son du canal « Prières ». Un canal par son, car le son d'un canal ne change plus après sa création.

## Catégories Android

| Canal | Importance | Son | Rôle |
| --- | --- | --- | --- |
| Prières | Haute | Appel choisi | Heure de chaque prière |
| Rappels avant la prière | Normale | Son discret | 5 à 30 minutes avant |
| Khatm | Normale | Par défaut | La veille et deux jours avant la fin |
| Lecture en cours | Basse | Silencieux | Commandes de la récitation |
| Téléchargements | Basse | Silencieux | Progression |

## Lecture sur l'écran verrouillé

- Titre : « Al-Kahf · verset 10 » ; sous-titre : récitateur. Pochette : nom arabe de la sourate en `or-sur-emeraude` (Amiri gras) sur `marque-emeraude`, carré, une image par sourate.
- Boutons : verset précédent, pause, verset suivant. La sourate est jouée comme une liste d'un fichier par verset, si bien que « précédent » et « suivant » changent de verset.
- Android : la carte de lecture prend la couleur de la pochette. Pas de bouton « Répéter le verset » ni « Minuterie » sur la carte (décision du 12 novembre) : `expo-audio` ne les propose pas, ils restent dans l'app.

## Widgets

| Widget | Tailles | Contenu | Fond clair | Fond sombre |
| --- | --- | --- | --- | --- |
| Prochaine prière | iPhone : petit (158 × 158 pt) ; Android : 4 × 2 avec les cinq horaires | Nom de la prière, heure, « dans 42 min » (iPhone seulement), nom arabe en filigrane `or-sur-emeraude` à 18 % | `marque-emeraude`, texte `marque-ivoire`, compte à rebours `or-sur-emeraude` | `surface` nuit, texte `encre` nuit, compte à rebours `or` nuit |
| Les cinq prières | iPhone : moyen (338 × 158 pt) | Date, ville, date hégirienne, ligne du jour, cinq horaires ; la prochaine sur une pastille `or-doux` ; les passées à 55 % | `surface` jour | `surface` nuit, pastille `ligne` nuit |
| Reprendre | Petit, iPhone et Android (2 × 2) | « Reprendre », nom arabe, sourate, « Verset 10 sur 110 », barre de progression, bouton Écouter | `fond` jour, barre `emeraude` | `surface` nuit, barre `emeraude` nuit |
| Écran verrouillé (iPhone) | Rond, rectangulaire, en ligne | Anneau des minutes restantes et « Asr » ; « Asr · 16:35 / dans 42 min / Maghrib 19:10 » ; « Asr 16:35 » à côté de la date | Rendu monochrome du système | idem |

- Coins, marges et typographie : ceux du système. Marge intérieure de 16 pt, textes en 12 / 14 / 18 / 30 pt.
- Rendu teinté d'iOS 18 et plus : le système impose une seule teinte ; vérifier que le nom arabe et la barre restent lisibles.
- Android n'a pas de frise d'entrées dans `expo-widgets` : le widget Android affiche « Asr 16:35 » et non « dans 42 min ».
- Le bouton Écouter de « Reprendre » ouvre l'app sur la lecture (lien `samajamm://lire/coran/18?verset=10`).

## Activité en direct et Dynamic Island (iPhone)

- Part 30 minutes avant la prière, se termine à l'heure de la prière.
- Écran verrouillé : icône de l'app, « Asr à 16:35 », ville, temps restant en `or-sur-emeraude`, barre de Dhuhr à Asr en `sur-emeraude-2`, fond émeraude très sombre.
- Réduite : croissant sur pastille `marque-emeraude` à gauche, temps restant en `or-sur-emeraude` à droite. Minimale : anneau qui se vide. Ouverte : nom, heure, ville, temps restant, barre, boutons « Qibla » et « Masquer ».

## Compte à rebours Android

- Notification continue « Asr à 16:35 », minuteur du système qui compte à rebours, barre de Dhuhr à Asr, actions « Qibla » et « Masquer pour aujourd'hui ».
- Android 16 et plus : pastille en haut de l'écran, « 42 min » sur fond `marque-emeraude`.
- Facultatif et désactivé par défaut (Prière › Appel et rappels) : les règles de Google pour ces notifications laissent ce cas à la limite.
