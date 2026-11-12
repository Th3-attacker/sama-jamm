Sama Jàmm (« ma paix » en wolof) est une application spirituelle pour lire, écouter et prier. Elle doit ressembler à un beau livre ouvert : sobre, solennel, beaucoup d'air, l'or réservé aux détails précieux. Ce système est la version 0 de sa charte, construite de zéro à partir de trois couleurs : Vert Émeraude Sombre, Crème Ivoire et Or Calligraphie. Pour construire l'app, lire d'abord la section « Lire d'abord : construire l'app », qui renvoie vers l'architecture, les écrans, le budget, la page « Hors de l'app » et la publication. Deux documents l'accompagnent : la fiche technique de la maquette (https://claude.ai/artifact/QZ3Shi7417TUeoU1BfKwNt) et la conception du système (https://claude.ai/artifact/2aq4hMBhjbzoHvz6JVDcoH).

## Voix et contenu

- Écrire calme et respectueux : phrases courtes, verbes simples, aucun point d'exclamation, aucun emoji.
- Vouvoyer en français. En wolof, suivre l'orthographe validée par l'équipe de contenu.
- Majuscule seulement en début de phrase et pour les noms propres : « Horaires de prière », pas « Horaires De Prière ».
- Libellés de boutons : un verbe d'abord. « Écouter », « Reprendre la lecture », « Programmer l'appel ».
- Les textes sacrés ne sont jamais tronqués, abrégés ou mis en majuscules. Un verset trop long se lit en entier, on fait défiler.
- Les formules religieuses et les noms sacrés suivent la charte éditoriale validée par le référent religieux du projet.
- Exemples de ton : « La prochaine prière est Asr, dans 42 minutes. » · « Téléchargé : disponible sans connexion. » · « Pas de réseau. Vos textes restent lisibles. »
- Le wolof d'abord : chaque moment clé a sa formule wolof, suivie de sa traduction en italique. Signature : « Jàng, déglu, julli ci jàmm. » (Lire, écouter, prier dans la paix.)
- Formules par moment : accueil « Dalal ak jàmm. » · appel « Waxtu julli jot na. » · régularité « Ndank-ndank mooy jàpp golo ci ñaay. » · khatm collectif « Benn loxo du tàccu. » · partage « Nit nittay garabam. » · effort « Ku bëgg lem, ñemeel yamb. » · dhikr terminé « Sant Yàlla. » · Veille « Fanaanal ak jàmm. » · tout est à jour « Jàmm rekk. » Orthographe à faire valider par un locuteur avant publication.

## Couleurs

- Trois thèmes : `jour` (ivoire, mode clair du téléphone et usage en extérieur), `nuit` (vert profond, mode sombre du téléphone) et `veille` (lecture nocturne atténuée, proposée automatiquement entre Isha et Fajr). Respecter le choix du téléphone ; proposer un réglage manuel. Les calculs de luminance et d'éblouissement qui fondent ces choix sont dans la section Confort visuel.
- Poser chaque écran sur `fond`. Les cartes, le lecteur et la barre d'onglets vont sur `surface` ; les champs et zones en retrait sur `surface-creux`.
- Texte : `encre` pour le principal, `encre-2` pour les sous-titres et la translittération, `encre-3` pour les métadonnées. Jamais de noir pur ni de gris neutre.
- `emeraude` porte l'action : un seul bouton principal par écran, l'onglet actif, les liens, les icônes actives.
- Les grandes surfaces vertes (bouton principal, carte de la prochaine prière, compteur) prennent `emeraude-aplat` : identique à `emeraude` le jour, plus profond la nuit (#2f7d63) pour que le texte `sur-emeraude` y reste lisible (4,7:1). Jamais de texte `emeraude` sur cet aplat.
- Sur l'aplat la nuit, `sur-emeraude-2` (3,8:1) et `or-sur-emeraude` (3,2:1) se réservent aux textes de 18 px et plus ou au décor ; les petits textes restent en `sur-emeraude`.
- Un élément sélectionné (prochaine prière, puce active) prend `emeraude-doux` avec le texte en `sur-emeraude-doux` ou `encre`.
- `or` est un ornement : filets, étoile, anneau du compteur, point d'état. Le jour, ne jamais l'utiliser pour du texte ni pour une icône qui porte un sens (2,4:1 seulement sur `fond`). Pour du texte doré, prendre `or-texte`, sur `or-doux` quand il faut une pastille.
- Le bouton précieux (aplat `or`) porte du texte `sur-or`, jamais du blanc. Le réserver à une action rare et solennelle : terminer un khatm, offrir un don.
- Les états `erreur`, `succes`, `alerte`, `info` s'accompagnent toujours d'un mot ou d'une icône : la couleur seule ne suffit pas.
- `marque-emeraude`, `marque-or`, `marque-ivoire` et `marque-nuit` ne changent pas avec le thème : icône de l'app, écrans de démarrage clair et sombre, visuels des stores.

## Typographie

- Titres en `display`, `titre-1`, `titre-2` (Cormorant Garamond). Jamais sous 24 px : la police devient fragile.
- Interface en `titre-3`, `corps`, `libelle`, `legende` (Source Sans 3). Les grands nombres (compteur, compte à rebours) en `chiffre`, jamais en Cormorant dont les chiffres anciens se lisent mal en grand.
- Textes longs en `lecture` (Source Serif 4) : sens des invocations et des xassaïdes, sagesses, explications ; 60 à 70 caractères par ligne au plus.
- Le Coran s'affiche en arabe seul, sans traduction. La translittération n'apparaît que si l'utilisateur l'active (Réglages de lecture, désactivée par défaut), en `translitteration`, italique, couleur `encre-2`, sous le texte arabe.
- Coran en `coran` (Amiri Quran) ; tout autre texte arabe, xassaïdes et wolofal en `arabe` (Amiri).
- Toutes les tailles suivent le réglage de texte du téléphone (Dynamic Type sur iOS, échelle de police sur Android). Tester à 200 % : rien ne doit être coupé.
- Chiffres des horaires en `titre-3` avec chiffres tabulaires (`font-variant-numeric: tabular-nums`) pour qu'ils ne dansent pas.
- Les polices couvrent les lettres wolof à, é, ë, ñ, ŋ, ó et la translittération (ā, ī, ū, ḥ, ṣ, ʿ), sauf Amiri Quran, réservée à l'arabe.

## Texte arabe et sens de lecture

- Envelopper chaque texte arabe dans un bloc `lang="ar"` et `dir="rtl"`, aligné à droite, même dans une interface française.
- Interligne au double de la taille (`coran` 28/56, `arabe` 22/40) pour laisser respirer voyelles et signes de récitation.
- Ne jamais couper un mot arabe, ne jamais appliquer d'espacement de lettres, ne jamais passer un texte arabe en gras synthétique.
- Le numéro de verset est un médaillon : chiffre en `or-texte` dans une étoile `or`, placé à la fin du verset dans le sens de lecture.
- Une interface entièrement en arabe inverse la mise en page (onglets, flèches, curseurs) ; les icônes de lecture audio, elles, ne s'inversent pas.

## Espacement, formes et profondeur

- Grille de 4 : `espace-1` à `espace-16`. Marge latérale des écrans `espace-6` (24) en classe compacte, 32 puis 48 aux classes moyenne et étendue ; marge intérieure des cartes `espace-4` ; entre deux cartes `espace-6`. Voir la page « Espace et mise en page ».
- Rayons : `rayon-puce` pour les puces, `rayon-carte` pour cartes, boutons et champs, `rayon-feuille` pour le haut des feuilles, `rayon-pastille` pour ce qui est rond.
- Le jour, une carte = `surface` + filet `ligne` de 1 px + `ombre-1`. La nuit, pas d'ombre : la différence entre `fond` et `surface` suffit.
- Zones tactiles d'au moins `cible-ios` (44 pt) et `cible-android` (48 dp), même quand l'icône est plus petite.
- Pas de dégradés, pas de verre dépoli, pas de bordure colorée sur un seul côté d'une carte.

## Mouvement et retour

- Transitions de 200 à 300 ms, courbe douce (ease-out). Rien ne rebondit.
- Si le téléphone demande de réduire les animations, supprimer tout mouvement non essentiel.
- Retour haptique léger sur chaque grain du compteur de dhikr et sur l'objectif atteint ; rien d'autre ne vibre.

## Iconographie

- Icônes au trait, grille de 24, trait de 1,75, extrémités arrondies, en `encre-2` au repos et `emeraude` quand elles sont actives. Le jeu de référence est `SamaJamm.ICONES` (51 icônes de `bundle.js`) ; dans l'app, utiliser `lucide-react-native` (licence ISC) avec `strokeWidth={1.75}` pour les équivalents listés dans la section « Jetons en React Native », et les tracés de `bundle.js` pour `kaaba`.
- Le retour est toujours la flèche `arrow-left` (« ← »), jamais un chevron « < ».
- Une icône seule a toujours un libellé accessible. Dans la barre d'onglets, l'icône a toujours son mot sous elle.
- Pas d'emoji, pas d'icônes pleines multicolores, pas de représentation de personnes ni de lieux saints en icône.

## Logo

- La marque « Hizb ouvert » : l'étoile à huit branches tracée d'un trait (épaisseur 11,5 % du rayon), un livre ouvert plein en son cœur. Le logotype est Cormorant Garamond 600 vectorisé ; l'accent de « Jàmm » est un trait de calame en `marque-or`.
- Sur fond clair : `assets/Logos/logo-horizontal-clair.svg` ou `logo-vertical-clair.svg` (marque et texte émeraude). Sur fond sombre ou émeraude : `logo-horizontal-sombre.svg` (marque or, texte ivoire).
- Icône d'app : `icone-app.svg`, marque `marque-or` sur `marque-emeraude`, à 63 % de la toile.
- Sous 40 px, la marque au trait devient trop fine : utiliser `marque-petite-taille-emeraude.svg` (étoile pleine, livre évidé), comme pour la notification Android et le favicon.
- Zone de protection : la hauteur du livre tout autour. Ne jamais étirer, ombrer, recolorer, ni poser la marque or sur `marque-ivoire` (trop pâle en plein soleil).
- Tous les formats d'icônes iOS et Android, l'écran de démarrage et les visuels des stores sont livrés dans le pack « sama-jamm-identite ».

## Ornements

- Un seul motif : l'étoile à huit branches (deux carrés tournés de 45°), en `or`. Fichier : `assets/Ornements/etoile-8.svg`.
- Usages : médaillon du numéro de verset, séparateur entre deux sections (étoile entre deux filets `or`), tête d'écran d'accueil.
- Au plus un séparateur orné par écran visible. L'ornement accompagne, il ne décore pas pour décorer.

## Accessibilité

- Contraste : tout texte atteint 4,5:1 sur ses fonds dans les trois thèmes ; contours et icônes porteuses de sens 3:1. Les notes des couleurs nomment les fonds autorisés ; la section Confort visuel donne aussi le contraste perceptuel (APCA) et le contraste réel selon la lumière ambiante.
- Focus : anneau `anneau-focus` de 2 px plein, décalé de 2 px, visible sur toutes les surfaces.
- Lecteurs d'écran : le texte arabe porte `lang="ar"` pour être lu avec la bonne voix ; le compteur annonce sa valeur à chaque changement.
- L'audio a toujours un texte équivalent ou une description quand il existe.
