# Structure et navigation

Cinq onglets natifs en bas (Accueil, Lire, Prière, Budget, Plus). Écouter est dans Lire, par un interrupteur Lire | Écouter. Chaque onglet a sa pile d'écrans ; le retour se fait par la flèche « ← » et par le geste natif.

## Arborescence Expo Router

```
app/
  _layout.tsx                         Stack racine : polices, thème, i18n, verrou du budget
  index.tsx                           Redirige vers (bienvenue) au premier lancement, sinon (onglets)
  (bienvenue)/
    _layout.tsx                       Stack sans en-tête, PageDots
    langue.tsx                        Bienvenue1 · langue de l'interface
    position.tsx                      Bienvenue2 · position ou ville
    rappels.tsx                       Bienvenue3 · rappels de prière et Veille automatique
  (onglets)/
    _layout.tsx                       NativeTabs d'Expo Router : Accueil, Lire, Prière, Budget, Plus ; BottomAccessory = mini-lecteur
    index.tsx                         Accueil (variante B : les cartes)
    lire/
      index.tsx                       Bibliothèque : Coran · Xassaïdes · Invocations, interrupteur Lire | Écouter
      ecouter/index.tsx               Récitations et chants, reprise
      ecouter/[recitateur].tsx        Sourates d'un récitateur
      coran/[sourate].tsx             Lecteur (?verset=46, ?mode=page)
      xassaides/[recueil].tsx         Liste des chants d'un recueil
      xassaides/[recueil]/[chant].tsx Lecteur de chant
      invocations/[categorie].tsx     Invocations d'un moment (matin, soir, voyage…)
      khatm/[id].tsx                  Khatm collectif
      khatm/nouveau.tsx               Créer un khatm et inviter
    priere/
      index.tsx                       Horaires du jour et de la semaine
      qibla.tsx                       Boussole
      dhikr.tsx                       Compteur
      rappels.tsx                     Appel et rappel, prière par prière
      methode.tsx                     Méthode de calcul et ajustements en minutes
    budget/
      index.tsx                       Le mois : dépense du jour, enveloppes
      enveloppe/[id].tsx              Détail d'une enveloppe et ses opérations
      operations.tsx                  Historique, filtres
      paie.tsx                        Jour de paie : revenu et répartition
      bilan.tsx                       Fin de cycle : reports, épargne, sadaqa
      dettes/index.tsx                Dettes entre proches : on me doit, je dois
      dettes/nouvelle.tsx             Nouvelle dette
      dettes/[id].tsx                 Détail d'une dette et son historique
      epargne/index.tsx               Objectifs d'épargne
      epargne/nouveau.tsx             Nouvel objectif et son intention
      zakat.tsx                       Calcul et rappel annuel
  lecteur.tsx                         Lecteur audio plein écran (modal)
  budget-ajout.tsx                    Ajouter une dépense (feuille, modal)
  budget-remboursement.tsx            Enregistrer un remboursement de dette (feuille, modal ; ?dette=id)
  partage.tsx                         Image d'un verset à partager (modal)
  verrou.tsx                          Déverrouiller le budget
  (onglets)/plus/index.tsx            Écran Plus : tuiles Khatm, Dhikr, Qibla, Xassaïdes, Invocations, Zakat, puis la liste
  plus/
    recherche.tsx  favoris.tsx  telechargements.tsx
    reglages/index.tsx                Thème, texte, langue, notifications, budget
    reglages/devise.tsx               Devise du foyer et devises personnelles
    compte/index.tsx                  Compte et synchronisation (facultatif)
    compte/supprimer.tsx              Suppression du compte
    soutenir/index.tsx                Soutenir : wallets et numéros (Android ; voir Dons pour iOS)
    soutenir/declarer.tsx             Déclarer un don par son numéro de transaction
    soutenir/merci.tsx                Remerciement et statut
```

## Règles de navigation

- **Onglets** : cinq, jamais plus (limite d'Android). L'onglet garde sa pile quand on le quitte ; toucher l'onglet actif remonte en haut de sa pile, puis en haut de la liste.
- **Retour** : `TopBar` avec `retour` sur tout écran qui n'est pas la racine d'un onglet. Icône `arrow-left` (« ← »), retournée en arabe. Le geste de balayage iOS et le bouton retour Android font la même chose.
- **Android, racine d'un onglet** : retour → Accueil ; depuis Accueil → l'app passe en arrière-plan.
- **Plus** : onglet à part entière (écran `PlusHub`), qui remplace l'ancien menu en haut à droite. La recherche a son icône sur Accueil, Lire et Plus.
- **Modales** : `lecteur`, `budget-ajout`, `budget-remboursement`, `partage` en `presentation: 'modal'` (iOS) ; `budget-ajout` et `budget-remboursement` en feuille (`formSheet`) avec le pavé numérique. Elles se ferment par « × » ou le geste vers le bas, pas par « ← ».
- **Mini-lecteur** : `BottomAccessory` au-dessus de la barre d'onglets dès qu'un audio joue, sur tous les onglets ; le toucher ouvre `lecteur`.
- **Verrou du budget** : si activé, l'onglet Budget passe d'abord par `verrou` (biométrie) ; le verrou retombe après 5 minutes en arrière-plan.
- **Bienvenue** : trois écrans, chacun passable (« Plus tard ») sauf la langue. Rien n'est demandé avant d'avoir montré à quoi ça sert.

## Liens profonds

Schéma `samajamm://` (et liens universels sur le domaine de l'app quand il sera réservé).

| Lien | Ouvre |
| --- | --- |
| `samajamm://lire/coran/18?verset=46` | Lecteur, Al-Kahf, verset 46 |
| `samajamm://lire/xassaides/{recueil}/{chant}` | Un chant |
| `samajamm://khatm/{code}` | Invitation à rejoindre un khatm |
| `samajamm://priere` | Horaires (toucher d'une notification de prière) |
| `samajamm://budget/ajouter` | Ajout de dépense (raccourci d'icône d'app) |

- Notification de prière → `priere` ; entre Isha et Fajr, l'app s'ouvre déjà en Veille.
- Raccourcis d'icône (appui long) : « Reprendre la lecture », « Ajouter une dépense », « Qibla ».

## Ce qui n'est pas un onglet

Recherche, favoris, téléchargements, réglages, compte : dans Plus. Qibla et dhikr : dans Prière et dans Plus. Khatm : dans Plus et sur Accueil. Épargne, zakat et dettes entre proches : dans Budget.

## Décision : Accueil B, onglets natifs, écran Plus

Choisi le 8 novembre 2026. Planches : `Accueil` (les cartes) et `PlusHub` sur la page « Écrans de l'app » ; simulation cliquable iOS et Android fournie à part.

- **Onglets natifs** : `NativeTabs` d'Expo Router (`expo-router/unstable-native-tabs` de SDK 54 à 57, `expo-router/native-tabs` à partir de SDK 58). iOS 26 dessine une barre en verre flottante, Android une barre Material. Aucun style de barre sur mesure : l'onglet actif prend la teinte émeraude, et le fond ne se règle pas sur iOS 26.
- **Icônes** : symboles système (SF Symbols sur iOS, Material Symbols sur Android), comme le recommandent les guides d'Apple et de Google. Nos icônes en images teintables restent le repli. Détail dans « Espace et mise en page ».
- **Cinq onglets au maximum** : limite d'Android, respectée. Pas de bouton ▦ ni de barre flottante sur mesure.
- **Mini-lecteur** : `NativeTabs.BottomAccessory` (SDK 55 ou plus). L'état de lecture vit dans le parent, car deux instances sont affichées.
- **Pas de badge** sur les onglets : le guide Apple le réserve à l'information critique. Le khatm en cours se voit sur Accueil et dans Lire.
- **Marge du contenu** : sur iOS 26 le contenu passe sous la barre ; chaque écran garde une marge basse.
- **Arabe** : le sens de droite à gauche des onglets natifs n'est pas documenté. À tester sur appareil avant publication.
- **Accueil B** : carte héros de la prochaine prière, grille Reprendre, Khatm, Budget du mois, Dhikr, bande « Continuer l'écoute », Wax ju rafet. Une prière passée est seulement atténuée, jamais cochée ni comptée.
- **Plus** : tuiles Khatm collectif (badge « 1 en cours »), Dhikr, Qibla, Xassaïdes, Invocations, Zakat ; liste Favoris, Téléchargements, Compte et synchronisation, Réglages, Soutenir Sama Jàmm, À propos. « Soutenir » n'apparaît pas dans la version iOS.

Le menu `Menu` en haut à droite et l'icône `more` sont remplacés par l'onglet Plus. La recherche garde son icône sur Accueil, Lire et Plus.

## Tailles d'écran : iPhone, iPad, Android

Une seule base de code, trois classes de largeur. La simulation cliquable montre chaque appareil en portrait et en paysage.

| Classe | Largeur | Appareils | Navigation | Contenu |
| --- | --- | --- | --- | --- |
| Compacte | moins de 600 | iPhone SE à Pro Max, Android de 360 à 412 dp | Barre en bas (verre sur iOS 26, Material sur Android) | Une colonne, grilles de 2 |
| Moyenne | 600 à 839 | iPad mini en portrait, pliant ouvert | iPad : barre flottante en haut ; Android : rail à gauche | Colonne de lecture de 760 au plus, grilles de 3 ou 4 |
| Étendue | 840 et plus | iPad Pro, tablettes, pliants ouverts | idem | Accueil, Prière et Budget en deux colonnes ; Lire = liste et lecteur côte à côte |

Règles :

- **Lire la classe, pas le modèle** : `useWindowDimensions()` donne la largeur ; on ne teste jamais « iPad » ou « tablette ». Un iPhone en paysage reste en barre du bas sur iOS. Sur Android, la barre du bas reste tant que la largeur **ou la hauteur** est compacte : un téléphone en paysage (hauteur sous 480 dp) garde donc la barre du bas ; le rail commence quand la largeur atteint 600 dp et que la hauteur ne l'empêche pas.
- **Marges système** : `react-native-safe-area-context` pour le haut, le bas et les côtés (encoche, îlot, barre de gestes, bord arrondi de l'iPad). Aucune valeur écrite en dur.
- **Colonne de lecture** : le texte du Coran et sa translittération ne dépassent jamais 760 de large ; le reste de la place va aux grilles et au second volet.
- **Cibles tactiles** : 44 pt sur iOS, 48 dp sur Android, à toutes les tailles.
- **Texte agrandi** : l'app suit la taille de texte du système jusqu'à 200 % ; les cartes grandissent en hauteur, jamais en largeur.
- **Rotation** : l'app tourne sur toutes les tailles. Sur les écrans de 600 dp et plus, Android 16 ignore les verrouillages d'orientation : ne pas en poser.
- **iPad** : `ios.supportsTablet` passe à `true` dans `app.json`. Il était à `false` (écran de démarrage compris) : il faut alors fournir l'écran de démarrage iPad et les captures iPad de 13 pouces pour l'App Store.
- **Android grands écrans** : `android.resizeableActivity` reste à vrai, pour le multifenêtre et le pliant ; le contenu se redessine à chaque changement de largeur.

### Feuilles et modales selon la taille

| Élément | Compacte | Moyenne et étendue |
| --- | --- | --- |
| Feuille du bas (`BudgetAjout`, `BudgetRemboursement`, `Minuterie`, `DhikrObjectif`, récitant) | Pleine largeur, montée du bas, poignée, hauteur de 88 % au plus | iOS : fiche centrée de 540 de large ; Android : feuille de 640 de large au plus, posée en bas |
| Partage (`Partage`) | Feuille du bas | Fiche centrée |
| Lecteur audio (`lecteur`) | Plein écran | Fiche centrée de 600 × 780 au plus |
| Fermeture | « × » en haut à droite, toucher du voile, geste vers le bas | « × » et toucher du voile |

Une feuille ne contient jamais de « ← » : elle se ferme, elle ne revient pas.

Le détail des hauteurs du bas de l'écran, des icônes d'onglet, des marges et des mises en page par classe de largeur est dans la page « Espace et mise en page » (planches `EspaceBas`, `EspaceIcones`, `EspaceLargeurs`, `EspaceDensite`, `EspaceCas`).
