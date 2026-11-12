# Inventaire des écrans

Chaque écran de l'app, avec sa planche sur le canevas (page « Écrans de l'app »), sa route, ce qu'il affiche et ses états. Construire l'écran à partir de sa planche ; les composants nommés sont ceux de ce système.

États communs à tous les écrans : **hors ligne** (`Banner` ton `attention` seulement si une fonction de l'écran en dépend), **chargement** (`Skeleton` au-delà de 300 ms, rare : presque tout est local), **erreur** (`Banner` ton `erreur` qui dit quoi faire), **vide** (`EmptyState`, titre wolof).

## Bienvenue

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Langue (`Bienvenue1`) | `(bienvenue)/langue` | « Dalal ak jàmm. » Choix de la langue d'interface (français ou arabe) | `RadioGroup`, `PageDots`, `Button` | Arabe choisi : redémarrage en RTL annoncé avant |
| Position (`Bienvenue2`) | `(bienvenue)/position` | Pourquoi la position (horaires, qibla), autoriser ou choisir une ville | `Button`, `SearchField`, `PageDots` | Refus : bascule sur le choix de ville (`EtatPosition`) |
| Rappels (`Bienvenue3`) | `(bienvenue)/rappels` | Rappels par prière, son de l'appel, Veille automatique | `ListItem` + `Switch`, `PageDots`, `Button` | Notifications refusées : texte qui renvoie aux réglages du téléphone |

## Accueil

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Accueil (`Accueil`) | `(onglets)/index` | Voir « Accueil, onglets et Plus (retenus) » plus bas | — | — |

## Lire

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Bibliothèque (`Bibliotheque`) | `lire/index` | Coran, Xassaïdes, Invocations ; 114 sourates avec nom arabe et nombre de versets | `TopBar grand` « Lire », `SegmentedControl` ou `Chip`, `ListItem` (médaillon), `Badge` « Hors ligne » | — |
| Lecteur (`Lecteur`) | `lire/coran/[sourate]` | Verset par verset, arabe seul ; translittération sous le verset si elle est activée ; écouter, favori, partager, passer en mode page | `TopBar` transparent, `ReadingCard`, `Ornament`, `AudioPlayer` | Reprise au verset exact ; fin de sourate : `Ornament` et suivante |
| Lecteur en Veille (`LecteurVeille`) | idem, thème `veille` | Même écran, lumière atténuée entre Isha et Fajr | idem | `Banner` « Veille activée » une fois par nuit |
| Pendant la récitation (`LecteurRecitation`) | idem, audio en cours | Le verset récité s'illumine, les autres s'estompent ; barre d'écoute en bas | `ReadingCard` en surbrillance, `AudioPlayer` | Sans minutage du verset : pas de surbrillance, lecture seule |
| Réglette du mode page (`LecteurPageReglette`) | `lire/coran/page/[n]` | Toucher la page fait apparaître les outils et une réglette pour aller à une page | `Slider`, `TopBar` | Outils masqués au bout de quelques secondes |
| Xassaïdes (`Xassaides`) | `lire/xassaides/[recueil]` | Recueils et chants, auteur, nombre de vers, écoute | `ListItem`, `Badge`, `SectionHeader` | Recueil non téléchargé : bouton de téléchargement |
| Invocations (`Invocations`) | `lire/invocations/[categorie]` | Invocations par moment : matin, soir, avant de dormir, voyage ; compteur intégré | `Chip`, `ReadingCard` (`coran={false}`), `TasbihCounter` compact | — |
| Khatm collectif (`Khatm`) | `lire/khatm/[id]` | 30 juz, qui lit quoi, prendre un juz, inviter | `KhatmGrid`, `ProgressBar`, `Button precieux` « Terminer le khatm » | Hors ligne : dernière version + `Banner` |
| Invitation au khatm (`KhatmInvitation`) | `khatm/{code}` (lien) | Rejoindre un khatm reçu par WhatsApp, choisir un juz libre | `KhatmGrid`, `Button` | Lien expiré ou khatm terminé : `EmptyState` |

## Écouter

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Écouter (`Ecouter`) | `ecouter/index` | Reprendre, récitateurs, chants, téléchargés | `TopBar grand` « Écouter », `ListItem`, `AudioPlayer` | Hors ligne : seuls les téléchargés sont actifs (`EtatHorsLigne`) |
| Plein écran (`LecteurAudio`, puis `LecteurAudioSuite` en faisant défiler) | `lecteur` (modal) | Le verset récité s'illumine et défile, vitesse, répétition, minuterie ; plus bas, le verset en cours, la suite et le récitateur | `ReadingCard` en surbrillance, `Slider`, `SegmentedControl`, `BottomSheet` récitateur | Fin de minuterie : fondu du son sur 10 s |

## Prière

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Horaires (`Priere`) | `priere/index` | Cinq prières du jour, prochaine en avant, date hégirienne, semaine | `TopBar grand` « Prière », `PrayerTimes`, `ListItem` | Position refusée (`EtatPosition`) |
| Qibla (`Qibla`) | `priere/qibla` | Boussole guidée par l'étoile | `TopBar`, `QiblaCompass`, `Banner` calibration | Pas de boussole sur l'appareil : relèvement en degrés et carte simple |
| Dhikr (`Dhikr`) | `priere/dhikr` | Compteur avec retour haptique, formules, objectif | `TasbihCounter`, `Chip`, `Toast` « Sant Yàlla. » | — |
| Appel et rappels (`PriereRappels`) | `priere/rappels` | Pour chaque prière : notification, son de l'appel, rappel avant | `ListGroup`, `ListItem`, `Switch`, `RadioGroup` (son) | Notifications refusées : `Banner` vers les réglages |
| Méthode de calcul (`PriereMethode`) | `priere/methode` | Méthode, école pour Asr, ajustements ± minutes par prière | `RadioGroup`, `ListItem` + pas de ± | — |
| Position refusée (`EtatPosition`) | `priere/index` | Choisir sa ville à la main | `Banner erreur`, `SearchField`, `ListItem` | — |

## Budget

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Le mois (`Budget`) | `budget/index` | Dépense du jour, reçu / dépensé / épargné, enveloppes, objectifs | `TopBar grand` « Budget », « Sur ce téléphone », `AmountDisplay`, `Envelope`, `SavingsGoal`, `Button` | Premier usage : `EmptyState` → Jour de paie |
| Ajouter (`BudgetAjout`) | `budget-ajout` (feuille) | Montant, enveloppe, compte, note : trois touches | `AmountDisplay saisie`, `Keypad`, `Chip`, `Button` | Enveloppe dépassée : texte doux sous le montant |
| Épargne (`BudgetEpargne`) | `budget/epargne` | Objectifs avec intention, total épargné | `SavingsGoal`, `Button` | Aucun objectif : `EmptyState` |
| Zakat (`BudgetZakat`) | `budget/zakat` | Base, nisab, année lunaire, montant indicatif | `AmountDisplay`, `ListItem`, `Banner info` | Sous le nisab : « Pas de zakat due cette année » |
| Devise (`BudgetDevise`) | `plus/reglages/devise` | MRU, F CFA ou devise personnelle | `RadioGroup`, `TextField`, `SegmentedControl` | Changement avec opérations existantes : `Dialog` |
| Jour de paie (`BudgetPaie`) | `budget/paie` | Revenu reçu, mise de côté d'abord, répartition reprise du cycle précédent | `AmountDisplay`, `Envelope`, `Button` | Reste non réparti affiché tant qu'il n'est pas nul |
| Historique (`BudgetHistorique`) | `budget/operations` | Opérations par jour, filtres par enveloppe et compte | `Chip`, `ListItem`, `SectionHeader` | Vide : `EmptyState` |
| Enveloppe (`BudgetEnveloppe`) | `budget/enveloppe/[id]` | Plafond, dépensé, reste, opérations du poste, modifier | `Envelope`, `ProgressBar`, `ListItem` | Dépassée : `Banner attention` doux |
| Nouvel objectif (`BudgetObjectif`) | `budget/epargne/nouveau` | Nom, intention, montant cible facultatif, échéance, versement | `TextField`, `AmountDisplay`, `SegmentedControl`, `Button` | — |
| Bilan du cycle (`BudgetBilan`) | `budget/bilan` | Reste de chaque enveloppe : reporter, épargner ou donner en sadaqa | `Envelope`, `SegmentedControl`, `Button` | — |
| Verrou (`BudgetVerrou`) | `verrou` | Déverrouiller par empreinte, visage ou code | `Button`, marque | Biométrie indisponible : code du téléphone |

## Dettes

Les planches de cette section sont sur le canevas (rangée 8, « Budget : épargne, dettes et zakat »). Voir la section Dettes entre proches pour les règles et les calculs.

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Dettes (`BudgetDettes`) | `budget/dettes/index` | Deux totaux « On me doit » et « Je dois », solde, dettes ouvertes par personne, dettes soldées repliées | `TopBar` « Dettes », `AmountDisplay`, `SegmentedControl` (sens), `ListItem`, `ProgressBar`, `Badge` | Vide : `EmptyState` « Jàmm rekk. » avec un bouton « Ajouter une dette » |
| Nouvelle dette (`BudgetDetteNouvelle`) | `budget/dettes/nouvelle` | Personne, montant, sens ; date, échéance et note facultatives | `TextField`, `AmountDisplay saisie`, `Keypad`, `SegmentedControl`, `Button` | Montant nul : bouton inactif |
| Détail (`BudgetDette`) | `budget/dettes/[id]` | Reste, déjà remboursé, échéance, historique des remboursements, « Écrire un mot de rappel », annuler | `AmountDisplay`, `ProgressBar`, `ListItem`, `Button`, `Dialog` | Échéance passée : `Banner attention` doux ; soldée : « Soldée » ; annulée : historique seul |
| Remboursement (`BudgetRemboursement`) | `budget-remboursement` (feuille) | Montant au pavé, date, note ; « Faire remise du reste » | `AmountDisplay saisie`, `Keypad`, `Chip`, `Button` | Montant supérieur au reste : texte « Ce montant dépasse ce qui reste » et bouton inactif |

La carte « Dettes » de l'écran Budget (deux totaux, un toucher ouvre la liste) et la proposition de créances et de dettes sur l'écran `ZakatBiens` complètent ces écrans.

## Plus

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Recherche (`Recherche`) | `plus/recherche` | Versets, chants, invocations, en arabe ou en translittération, sans réseau | `SearchField`, `Chip`, `ListItem` | Aucun résultat : `EmptyState` |
| Favoris (`Favoris`) | `plus/favoris` | Versets, chants, invocations gardés | `Chip`, `ReadingCard`, `ListItem` | Vide : `EtatVide` « Jàmm rekk » |
| Téléchargements (`Telechargements`) | `plus/telechargements` | Récitations et recueils sur le téléphone, place utilisée, supprimer | `ProgressBar`, `ListItem`, `Badge` | — |
| Réglages (`Reglages`) | `plus/reglages` | Thème, Veille, texte, langue, notifications, budget, à propos | `ListGroup`, `ListItem`, `Switch`, `SegmentedControl` | — |
| Compte (`Compte`) | `plus/compte` | Facultatif : synchroniser favoris, réglages et khatms ; se déconnecter ; supprimer | `ListGroup`, `Button`, `Banner info` | Sans compte : explication et connexion |
| Suppression (`CompteSupprimer`) | `plus/compte/supprimer` | Ce qui sera effacé, ce qui reste sur le téléphone, confirmation | `Dialog danger` | Hors ligne : suppression impossible, dit pourquoi |
| Partage (`Partage`) | `partage` (modal) | Aperçu de l'image du verset, fond émeraude ou nuit, partager | `VerseShareCard`, `SegmentedControl`, `Button` | — |
| Hors ligne (`EtatHorsLigne`) | tous | Ce qui reste disponible | `Banner attention`, `Badge` | — |

## Dons

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Soutenir (`Soutenir`) | `plus/soutenir` | Pourquoi donner, wallets du pays, numéro à copier, titulaire | `WalletCard`, `Chip` (montants suggérés), `Button`, `Toast` | Hors ligne : liste en cache et date ; absent de la version iOS (voir Dons) |
| Déclarer (`DonDeclarer`) | `plus/soutenir/declarer` | Wallet, montant, numéro de transaction, prénom et message facultatifs | `SegmentedControl` ou `Chip`, `AmountDisplay`, `TextField`, `Button` | Référence invalide ou déjà déclarée : erreur du champ ; hors ligne : envoi différé |
| Merci (`DonMerci`) | `plus/soutenir/merci` | « Sant Yàlla. », récapitulatif, statut de vérification | `EmptyState`, `ListGroup`, `Badge` | En attente, reçu, introuvable |


## Démarrage

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Démarrage natif (`SplashClair`, `SplashSombre`) | aucune (`app.json`) | Marque seule au centre, fond selon le mode du téléphone | — | Clair, sombre |
| Démarrage animé (`SplashAnime`, `SplashEtapes`) | `app/_layout.tsx` | Relais de l'écran natif, signature wolof, fondu vers Accueil ou Bienvenue | `Ornament` (filet), Reanimated | Animations réduites : fondu seul |

## Compléments

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Page du mushaf (`LecteurPage`) | `lire/coran/page/[n]` | Lecture page par page, numéro de page, juz et hizb | `ReadingCard`, `TopBar` | Hors ligne : page en cache |
| Chant (`Chant`) | `lire/xassaides/[id]` | Xassaïde vers par vers, arabe ou wolofal, traduction | `ReadingCard`, `AudioPlayer` | Sans audio : lecture seule |
| Récitateur (`Recitateur`) | `ecouter/recitateur/[id]` | Sourates disponibles, téléchargement | `ListItem`, `Badge`, `Button` | Hors ligne : seulement les téléchargées |
| Minuterie (`Minuterie`) | feuille sur le lecteur audio | Arrêt après une durée ou en fin de sourate | `BottomSheet`, `RadioGroup` | Minuterie active : compte à rebours |
| Nouveau khatm (`KhatmNouveau`) | `plus/khatm/nouveau` | Nom, échéance, invitation | `TextField`, `Button` | Hors ligne : création impossible, dit pourquoi |
| Qibla trouvée (`QiblaTrouvee`) | `priere/qibla` | Confirmation douce quand le téléphone est aligné | `QiblaCompass` | Vibration légère une fois |
| Sans boussole (`QiblaSansBoussole`) | `priere/qibla` | Angle écrit et repère soleil quand le capteur manque | `Banner`, `QiblaCompass` | — |
| Objectif de dhikr (`DhikrObjectif`) | feuille sur Dhikr | Formule et objectif (33, 99, 100, libre) | `BottomSheet`, `RadioGroup`, `SegmentedControl` | — |
| Connexion (`Connexion`) | `plus/compte/connexion` | Apple, Google, lien par e-mail ; continuer sans compte | `TextField`, `Button` | Lien envoyé, lien expiré |
| À propos (`APropos`) | `plus/a-propos` | Version, sources et licences, aide, confidentialité | `ListGroup`, `ListItem` | — |
| Premier budget (`BudgetPremier`) | `budget/premier` | Devise, jour de paie, enveloppes de départ | `SegmentedControl`, `TextField`, `Chip`, `Button` | — |
| Revenu (`BudgetRevenu`) | `budget/revenu` | Montant, type, compte de réception, puis répartition | `AmountDisplay`, `Keypad`, `Chip`, `SegmentedControl` | — |
| Opération (`BudgetOperation`) | `budget/operation/[id]` | Modifier ou supprimer une dépense | `TextField`, `Chip`, `Button`, `Dialog` | Suppression confirmée |
| Comptes (`BudgetComptes`) | `budget/comptes` | Espèces, mobile money, banque et total | `AmountDisplay`, `ListGroup`, `Banner` | — |
| Biens de la zakat (`ZakatBiens`) | `budget/zakat/biens` | Or, épargne, créances, dettes, seuil or ou argent | `SegmentedControl`, `ListGroup`, `Button` | Sous le seuil : pas de zakat due |
| Avant la position (`AutorisationPosition`) | avant la demande système | Pourquoi la position ; un seul bouton « Continuer » | `EmptyState`, `ListGroup`, `Button` | Refus : `EtatPosition` |
| Avant les notifications (`AutorisationNotifications`) | avant la demande système | Pourquoi les rappels ; un seul bouton « Continuer » | `EmptyState`, `ListGroup`, `Button` | Refus : rappels désactivés, réglables plus tard |
| Erreur (`Erreur`) | tout écran réseau | Ce qui a bloqué, ce qui marche encore, réessayer, code support | `EmptyState` | — |
| Mise à jour (`MiseAJour`) | plein écran bloquant | Version minimale non atteinte, lien vers le store | `Banner`, `Button` | — |
| Réglages de lecture (`ReglagesLecture`) | `plus/reglages/lecture` | Taille arabe avec aperçu, translittération (désactivée par défaut), chiffres, récitateur ; aucune traduction | `Slider`, `SegmentedControl`, `Switch`, `ListItem` | — |

## Interface en arabe

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Accueil (`ArAccueil`), Lire (`ArBibliotheque`), Réglages (`ArReglages`) | mêmes routes | Référence du sens de droite à gauche : polices, flèches, onglets, arc du jour, chiffres | Tous, avec `interface-ar` | Chiffres hindis en option |

## Accueil, onglets et Plus (retenus)

Décision du 8 novembre 2026. Voir Structure et navigation.

| Écran (planche) | Route | Rôle et contenu | Composants | États |
| --- | --- | --- | --- | --- |
| Accueil (`Accueil`) | `(onglets)/index` | Carte héros de la prochaine prière, grille Reprendre, Khatm, Budget du mois, Dhikr, bande « Continuer l'écoute », Wax ju rafet | `ProgressBar`, `KhatmGrid` réduit, `TasbihCounter` compact, `AudioPlayer` | Premier jour : pas de carte de reprise ; prière passée atténuée seulement |
| Plus (`PlusHub`) | `(onglets)/plus/index` | Six tuiles (Khatm, Dhikr, Qibla, Xassaïdes, Invocations, Zakat) et liste (Favoris, Téléchargements, Compte, Réglages, Soutenir, À propos) | `ListGroup`, `ListItem`, `Badge` | Soutenir absent sur iOS |
| Barre d'onglets (`TabBar`) | `(onglets)/_layout` | Accueil, Lire, Prière, Budget, Plus, badge sur Plus ; rendu natif (verre iOS 26, Material Android) | `NativeTabs` | — |

L'ancien `MenuPlus` est remplacé par `PlusHub`. `Ecouter` et `Recitateur` restent les écrans de l'interrupteur Lire | Écouter.

## Hors de l'app

Page « Hors de l'app » du canevas. Règles et contenus dans la page « Hors de l'app » de ce système.

| Planche | Contenu |
| --- | --- |
| `HorsNotifIOS`, `HorsNotifAndroid` | Appel à la prière, rappel avant, khatm, téléchargement |
| `HorsCanauxAndroid` | Les cinq catégories de notifications Android |
| `HorsLectureIOS`, `HorsLectureAndroid` | Lecture sur l'écran verrouillé et carte de lecture Android |
| `HorsWidgetsIOS`, `HorsWidgetsThemes` | Widgets prochaine prière, cinq prières, Reprendre ; clair, sombre, teinté |
| `HorsVerrouIOS`, `HorsIleIOS` | Widgets de l'écran verrouillé, activité en direct, Dynamic Island |
| `HorsWidgetsAndroid`, `HorsCompteAndroid` | Widgets Android, compte à rebours en direct et pastille d'Android 16 |

## Espace et mise en page (planches de règles)

Pas des écrans : des planches de règles, pages « Écrans de l'app ». Détail dans la page « Espace et mise en page ».

| Planche | Contenu |
| --- | --- |
| `EspaceBas` | Pile du bas (barre, mini-lecteur, compteur, pilule), cinq appareils, trois thèmes |
| `EspaceIcones` | Icônes d'onglet en contour et en plein, iOS et Android, libellés, badge, fichiers |
| `EspaceLargeurs` | Cinq écrans racines en classes compacte, moyenne, étendue |
| `EspaceDensite` | Marges, hauteurs minimales, ce qui est fixe, défile, se masque |
| `EspaceCas` | Texte à 200 %, arabe, Veille et plein écran, clavier ouvert |
