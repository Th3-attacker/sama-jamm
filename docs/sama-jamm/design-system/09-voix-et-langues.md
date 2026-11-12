# Voix et langues

L'interface parle français, wolof ou arabe ; le wolof d'abord dans les moments clés, avec sa traduction en italique. Le ton est calme, respectueux, sans point d'exclamation ni emoji. Toute formule wolof est relue par un locuteur et l'équipe de contenu avant publication.

## Formules par moment

| Moment | Écran | Wolof | Français (en italique dessous) |
| --- | --- | --- | --- |
| Signature | Stores, À propos, démarrage | Jàng, déglu, julli ci jàmm. | Lire, écouter, prier dans la paix. |
| Accueillir | Bienvenue · langue | Dalal ak jàmm. | Bienvenue, installez-vous en paix. |
| Saluer | Accueil | Jàmm nga am ? | Êtes-vous en paix ? |
| Ponctualité | Notification, Bienvenue · rappels | Waxtu julli jot na. | L'heure de la prière est arrivée. |
| Régularité | Accueil, sagesse du jour | Ndank-ndank mooy jàpp golo ci ñaay. | Un peu chaque jour vaut mieux qu'un grand effort d'un seul jour. |
| Entraide | Khatm collectif | Benn loxo du tàccu. | Une seule main ne peut pas applaudir. |
| Bienveillance | Partage d'un verset | Nit nittay garabam. | L'homme est le remède de l'homme. |
| Effort | Longue sourate, fin d'un juz | Ku bëgg lem, ñemeel yamb. | Qui veut le miel affronte les abeilles. |
| Gratitude | Objectif de dhikr atteint | Sant Yàlla. | Rendez grâce à Dieu. |
| Repos | Passage en Veille | Fanaanal ak jàmm. | Passez la nuit en paix. |
| Sérénité | États vides, tout est à jour | Jàmm rekk. | La paix, seulement. |

- « Wax ju rafet » (sagesse du jour) : une formule par jour, tirée d'une liste validée de 60 proverbes au moins, la même pour tous les utilisateurs le même jour.
- Une formule wolof n'apparaît jamais seule : la traduction suit, en `translitteration` (italique, `encre-2`).

## Écrire l'interface

- Vouvoyer en français. Phrases courtes, verbe d'abord sur les boutons : « Reprendre la lecture », « Ajouter une dépense », « Choisir une ville ».
- Majuscule en début de phrase et aux noms propres seulement.
- Dire ce qui marche encore avant ce qui manque : « Pas de réseau. Vos textes restent lisibles. »
- Erreur = ce qui s'est passé + quoi faire : « Position refusée. Choisissez votre ville pour calculer les horaires. »
- Jamais de culpabilité : pas de « Vous avez manqué », « Votre série est perdue », « Attention ! ».
- Noms des prières : usage courant (Fajr, Dhuhr, Asr, Maghrib, Isha), nom wolof en légende (Fajar, Tisbaar, Tàkkusaan, Timis, Gée), nom arabe à droite.
- Formules d'eulogie et noms sacrés selon la charte éditoriale du référent religieux ; ne pas les abréger.

## i18n

- `i18next` + `react-i18next` ; fichiers `src/i18n/fr.json`, `wo.json`, `ar.json`. Le français est la langue de repli.
- Clés par écran puis par élément, en anglais technique court : `priere.prochaine`, `budget.depenseDuJour`, `commun.retour`.
- Pluriels avec les règles d'i18next (`_one`, `_other` ; l'arabe a aussi `_zero`, `_two`, `_few`, `_many`).
- Interpolation, jamais de concaténation : `"{{priere}} dans {{minutes}} min"`.
- Les contenus religieux (versets, translittérations, chants, sens des invocations) viennent de `contenu.db`, pas des fichiers i18n.

## Wolof

- Orthographe officielle (alphabet latin du wolof) : à, é, ë, ó, ñ, ŋ, x, q ; voyelles longues doublées (« jàmm », « dëkk »). Les polices du système couvrent tous ces caractères.
- Recherche tolérante : « e » trouve « ë », « n » trouve « ñ ».
- Wolofal (wolof en écriture arabe), pour certains xassaïdes : bloc `lang="wo-Arab"`, sens RTL, police `arabe`.

## Arabe

- Tout texte arabe est un bloc séparé, aligné à droite, sens RTL, dans toutes les langues d'interface.
- Interface en arabe : `I18nManager.forceRTL(true)` puis redémarrage de l'app (annoncé à l'utilisateur avant). Flèches, curseurs, onglets et marges s'inversent ; les icônes de lecture audio et les horloges ne s'inversent pas.
- Polices de l'interface arabe : Noto Sans Arabic pour l'interface, Amiri gras pour les titres (jetons `ui-ar` et `display-ar`). Interligne plus haut qu'en français, légendes à 13 au lieu de 12.
- Les composants du système suivent le sens tout seuls (marges et alignements logiques) ; seules les icônes `arrow-left` et `chevron-right` se retournent. Ne jamais retourner `play`, `skip-back`, `skip-forward`, les horloges ni les chiffres. L'arc du jour se retourne (Fajr à droite).
- Les formules wolof (titres, signature) restent en wolof et en Cormorant dans un bloc isolé (`<bdi>` sur le web, `writingDirection: 'ltr'` en React Native) ; leur traduction est en arabe.
- Écrans de référence sur la toile : `ArAccueil`, `ArBibliotheque`, `ArReglages`.
- Chiffres : arabes occidentaux (0-9) par défaut, chiffres arabes orientaux (٠-٩) en option dans l'interface arabe ; les numéros de versets suivent ce réglage.

## Nombres et dates

- Heures : 24 h, « 16:35 », chiffres tabulaires.
- Montants : voir Budget du foyer (`formatMontant`).
- Dates : « Jeudi 29 octobre » en français, équivalent wolof (« Alxames 29 oktoobar ») à valider, date hégirienne en légende sur Accueil et Prière.
- Durées : « dans 42 min », « dans 1 h 05 ».
