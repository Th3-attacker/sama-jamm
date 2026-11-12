# Espace et mise en page

Ce que le code ne peut pas deviner : comment s'empile le bas de l'écran, quelles icônes d'onglet fournir, comment la place libre se partage selon la largeur, quelles marges et quelles hauteurs. Planches sur le canevas, page « Écrans de l'app » : `EspaceBas`, `EspaceIcones`, `EspaceLargeurs`, `EspaceDensite`, `EspaceCas`. Les jetons sont dans `tokens.json`, section `mise-en-page`.

Contraintes qui ne se discutent pas : aucun texte sacré tronqué, abrégé ou couvert par un élément fixe ; zones tactiles de 44 pt (iOS) et 48 dp (Android) ; lisible à 200 % et en arabe (RTL) ; aucune valeur de couleur ou d'espace écrite en dur.

## Classes de largeur

On lit la largeur de la fenêtre (`useWindowDimensions`), jamais le modèle.

| Classe | Largeur | Jeton de début | Navigation |
| --- | --- | --- | --- |
| Compacte | moins de 600 | – | barre en bas |
| Moyenne | 600 à 839 | `largeur-moyenne` | iPad : barre en haut, avec bouton pour la convertir en barre latérale ; Android : rail à gauche |
| Étendue | 840 et plus | `largeur-etendue` | idem |

Mises en page des cinq écrans racines (planche `EspaceLargeurs`) :

| Écran | Compacte | Moyenne | Étendue |
| --- | --- | --- | --- |
| Accueil | une colonne : héros, grille 2×2, écoute, Wax | héros pleine largeur, quatre cartes sur une ligne | deux colonnes : héros, écoute, Wax à gauche ; cartes et Khatm à droite |
| Lire | liste ; mini-lecteur au-dessus de la barre | liste centrée, 680 au plus | volet liste de 360 + lecteur ; texte sacré dans une colonne de 760 |
| Prière | héros, cinq prières, deux cartes | même ordre, centré | gauche : héros, Qibla, Dhikr ; droite : prières et semaine |
| Budget | résumé, enveloppes en liste | enveloppes sur deux colonnes | gauche : résumé, objectif ; droite : enveloppes et opérations |
| Plus | tuiles 2×3, puis liste | tuiles 3×2, liste centrée | tuiles à gauche, liste à droite |

- **Colonne de lecture** : le texte du Coran et sa translittération ne dépassent jamais `colonne-lecture` (760), centrés dans leur volet.
- **Paysage téléphone** : iPhone, barre en bas, deux colonnes seulement à 840 et plus. Android : rail à gauche dès 600 dp de large, **sauf** si la hauteur est sous 480 dp (téléphone en paysage) : la barre du bas reste alors, c'est la règle de Google. Deux colonnes dès 840 dp.
- **Pliant, multifenêtre** : la classe se relit à chaque changement de largeur, sans perdre la position de lecture.

## Le bas de l'écran

De bas en haut : barre d'onglets, mini-lecteur, compteur fixe ou pilule d'outils, contenu. Écart de `ecart-couches` (8) entre deux couches. Le code **mesure** la barre d'onglets (sonde) ; les valeurs de la colonne « Barre » sont des cibles de conception pour vérifier la mesure.

| Couche | Hauteur | Jeton |
| --- | --- | --- |
| Barre d'onglets (zone) | mesurée ; cible 70 à 128 selon l'appareil | – |
| Mini-lecteur | 56 ; 40 quand le compteur est visible | `mini-lecteur`, `mini-lecteur-mince` |
| Compteur fixe (Dhikr, Invocations) | 72 | `compteur-fixe` |
| Pilule d'outils (lecteur de verset) | 48, à 16 au-dessus de la couche du dessous | `pilule-outils` |
| Marge basse du contenu | pile visible + 16 | `marge-contenu-bas` |

| Appareil | Écran | Haut | Bas système | Barre | Pile retenue (barre + mini 40 + compteur) | Texte libre |
| --- | --- | --- | --- | --- | --- | --- |
| iPhone SE | 375×667 | 20 | 0 | 70 | 198 | 377 |
| iPhone 17 | 393×852 | 59 | 34 | 83 | 211 | 510 |
| iPhone Pro Max | 440×956 | 62 | 34 | 83 | 211 | 611 |
| Android 360×640 | 360×640 | 24 | 48 | 128 | 208 (mini masqué) | 336 |
| Android 412×915 | 412×915 | 24 | 24 | 104 | 232 | 587 |

Texte libre = hauteur − haut − barre du haut (56) − pile retenue − 16.

Règles :

1. **Mini-lecteur et compteur ensemble** : le mini-lecteur passe à 40 (bouton lecture et titre) ; le compteur garde 72.
2. **Plafond** : si la pile dépasse `plafond-pile` (35 % de la hauteur), le mini-lecteur se masque et l'audio reste commandé par l'icône casque de la barre du haut. Cas : Android 360×640 à trois boutons, paysage, texte à 200 %.
3. **Pilule et compteur** ne se montrent jamais ensemble : la pilule n'existe que dans le lecteur de verset, le compteur que dans Dhikr et Invocations.
4. **Défilement** : les listes passent sous la barre ; le dernier élément s'arrête à la marge basse. Aucun verset n'est couvert.
5. **Sur iOS 26** le mini-lecteur est `NativeTabs.BottomAccessory` ; ailleurs, un bandeau posé au-dessus de la barre.

## Icônes d'onglet

**Décision : symboles système sur chaque plateforme.** SF Symbols sur iOS, Material Symbols sur Android. Le guide Apple recommande les SF Symbols (ils s'adaptent à la barre compacte, régulière et iPad) et préfère les symboles pleins ; Google attend une barre Material. Nos cinq icônes en images (`assets/Onglets`) restent le repli, et servent si un symbole manque (l'horloge de prière).

| Onglet | SF Symbol (iOS) | Material Symbol (Android) |
| --- | --- | --- |
| Accueil | `house.fill` | `home` |
| Lire | `book.fill` | `menu_book` |
| Prière | `clock.fill` | `schedule` |
| Budget | `creditcard.fill` | `account_balance_wallet` |
| Plus | `square.grid.2x2.fill` | `apps` |

Les noms sont à confirmer dans l'app SF Symbols et sur le site des Material Symbols.

- **iOS** : symbole plein dans tous les états ; la teinte (`encre-3` au repos, `emeraude` actif) dit l'état. Libellé de 10 pt, graisse 500 (600 actif).
- **Android** : contour au repos, plein sur la pastille de 64×32 `emeraude-doux` quand actif ; libellé de 12 sp.
- **Pas de badge** sur les onglets. Le guide Apple réserve le badge (ovale rouge, texte blanc) aux informations critiques ; un khatm en cours ne l'est pas : il se montre sur Accueil et dans Lire. Aucun onglet n'est jamais désactivé ni masqué, même vide : l'écran explique pourquoi il est vide.
- Le système plafonne l'agrandissement des libellés : le sens tient par le symbole et par le mot.
- Repli : `renderingMode="template"` sur iOS, mêmes PNG sur Android.

## Marges, hauteurs, défilement

| Valeur | Compacte | Moyenne | Étendue | Jeton |
| --- | --- | --- | --- | --- |
| Marge latérale | 24 | 32 | 48 | `marge-compacte`, `marge-moyenne`, `marge-etendue` |
| Entre deux blocs | 24 | 24 | 32 | `espace-6`, `espace-8` |
| Avant un titre de section | 32 | 32 | 48 | `espace-8`, `espace-12` |
| Marge intérieure d'une carte | 16 | 16 | 20 | `espace-4`, `espace-5` |
| Entre deux cartes d'une grille | 12 | 16 | 16 | `espace-3`, `espace-4` |

La marge latérale de 24 remplace le 20 de l'ancienne règle : c'est celle de toutes les planches. `espace-5` reste la marge intérieure des grandes cartes.

- Zone tactile : `cible-ios` 44, `cible-android` 48 ; écart de 8 entre deux cibles.
- Ligne de liste : `ligne-liste` 56 au moins, grandit avec le texte. Barre du haut : `barre-haut` 56. Bouton plein : 48.
- **Fixe** : barre du haut, compteur, mini-lecteur, barre d'onglets, pilule. **Défile** : tout le contenu. **Se réduit ou se masque** : grand titre (devient titre réduit), barre d'onglets réduite sur iOS au défilement (jamais masquée), pilule d'outils après 3 s sans toucher.

## Cas limites

- **Texte à 200 %** : les cartes grandissent en hauteur, la grille 2×2 passe en une colonne, rien n'est tronqué.
- **Arabe (RTL)** : onglets dans l'ordre inverse, flèche de retour retournée, boutons de lecture non retournés, chiffres occidentaux par défaut. Ordre des onglets natifs en RTL : à tester sur appareil.
- **Veille, page du mushaf** : la barre d'onglets se réduit au défilement vers le bas (comportement de réduction d'Apple : bouton de l'onglet courant, mini-lecteur à côté) et revient en remontant ou en touchant l'onglet. Elle n'est jamais masquée : seule une feuille modale la couvre. Sur Android, elle reste.
- **Clavier ouvert** (Budget : ajout, remboursement) : la feuille s'arrête au-dessus du clavier, le contenu défile, « Enregistrer » reste collé au clavier.

## Valeur de design → comment le code la lit

Les noms de constantes et de hooks sont des propositions ; la colonne de gauche est la règle.

| Valeur de design | Lue par le code |
| --- | --- |
| Classe de largeur (600, 840, 1200, 1600) | hook `useWidthClass()` → `compact`, `medium` ou `expanded`, bâti sur `useWindowDimensions` et les jetons `largeur-moyenne`, `largeur-etendue` |
| Colonne de lecture 760 | constante `layout.readingColumn` (jeton `colonne-lecture`) ; le conteneur du texte sacré applique `maxWidth` |
| Volet liste 360 | `layout.listPane` (jeton `panneau-liste`), seulement en classe étendue |
| Marges latérales | hook `useScreenMargin()` → `marge-compacte`, `marge-moyenne` ou `marge-etendue` selon la classe |
| Marges de sécurité (haut, bas, côtés) | `useSafeAreaInsets()` ; jamais de nombre écrit |
| Hauteur de la barre d'onglets | sonde de mesure (iOS) ; sur Android, bas système + 80, lus à l'exécution |
| Mini-lecteur 56 / 40 | `layout.miniPlayer`, `layout.miniPlayerSlim` ; le mini-lecteur mesure lui-même sa hauteur |
| Compteur 72, pilule 48 | `layout.counter`, `layout.toolPill` |
| Marge basse du contenu | hook `useBottomStack()` → `{ tabBar, miniPlayer, counter, pill, total, contentPaddingBottom }` ; `contentPaddingBottom` = total + `marge-contenu-bas` |
| Plafond de 35 % | `useBottomStack()` compare le total à `plafond-pile` × hauteur de la fenêtre et range le mini-lecteur |
| Écart entre couches 8 | `espace-2` |
| Zones tactiles 44 / 48 | `cible-ios` / `cible-android`, choisis par `Platform.OS` |
| Ligne de liste 56, barre du haut 56 | `layout.listRow`, `layout.topBar` |
| Icônes d'onglet | images `assets/Onglets/onglet-*.png` ; teinte par `tintColor` du `NativeTabs` = `emeraude` du thème |
| Libellés d'onglet 10 / 12 | `labelStyle` du `NativeTabs` (`libelle-onglet-ios`, `libelle-onglet-android`) |
| Couleurs et espaces | `tokens.json`, jamais écrits en dur |

Dérivation : `tokens.json` → `theme/layout.ts` (générée, comme les couleurs). Les valeurs en px y deviennent des nombres.

## Conformité aux guides officiels

Sources consultées le 8 novembre 2026. Ce qui n'a pas pu être relu à la source est marqué « à vérifier ».

| Règle officielle | Notre choix | Source |
| --- | --- | --- |
| Apple : la barre sert à naviguer, pas à agir | Cinq onglets de navigation ; les actions (Dépense, Écouter) sont dans l'écran | [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) |
| Apple : la barre reste visible, sauf sous une feuille modale | La barre se réduit au défilement mais n'est jamais masquée ; le mode page n'a plus de plein écran | idem |
| Apple : peu d'onglets, éviter l'onglet « Plus » de débordement | Cinq onglets ; l'onglet « Plus » est un vrai écran, pas un débordement | idem |
| Apple : ne jamais désactiver ni masquer un onglet | Un onglet vide explique pourquoi | idem |
| Apple : libellés d'un seul mot | Accueil, Lire, Prière, Budget, Plus | idem |
| Apple : SF Symbols, symboles pleins de préférence | SF Symbols pleins sur iOS ; nos images en repli | idem |
| Apple : badge rouge, pour l'information critique seulement | Aucun badge sur les onglets | idem |
| Apple : sur iPad, barre en haut, convertible en barre latérale | Barre en haut ; option `sidebarAdaptable` en classe étendue | idem |
| Apple : accessoire de barre (mini-lecteur) qui se réduit au défilement | `BottomAccessory`, réduction au défilement | idem |
| Google : barre de navigation pour 3 à 5 destinations, en fenêtre compacte | Cinq onglets, barre du bas en compacte | [Navigation bar](https://developer.android.com/develop/ui/compose/components/navigation-bar) |
| Google : largeur compacte < 600, moyenne 600 à 839, étendue 840 à 1199, grande 1200 à 1599, très grande 1600 et plus ; hauteur compacte < 480, moyenne 480 à 899, étendue 900 et plus | Mêmes seuils, jetons `largeur-*` et `hauteur-*` | [Window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes) |
| Google : barre du bas si la largeur **ou la hauteur** est compacte, rail sinon, tiroir permanent facultatif | Rail dès 600 dp, barre du bas en paysage téléphone ; tiroir non retenu | [Navigation adaptative](https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation) |
| Google : concevoir d'abord pour la largeur étendue, puis décider du cas moyen | Planches `EspaceLargeurs` dans cet ordre | Window size classes |

À vérifier à la source (pages non lisibles depuis cette session) : dimensions exactes de la barre Material 3 (80 dp par défaut dans Compose Material 3), zones tactiles de 44 pt (Apple) et 48 dp (Google), tailles de texte par défaut d'Apple (Dynamic Type), marges lisibles d'Apple. Les valeurs de ces lignes viennent de la pratique courante, pas d'une relecture des pages de référence.
