# Lire d'abord : construire l'app

Ce design system contient tout ce qu'il faut pour développer Sama Jàmm en React Native : la charte, les jetons, 38 composants de référence, les écrans, l'architecture, le budget et la publication. Lire cette page, puis la page qui correspond à la tâche ; il n'y a rien à chercher ailleurs.

## Ce que contient ce système

| Besoin | Où le trouver |
| --- | --- |
| Règles de marque : voix, couleurs, typographie, arabe, formes, mouvement, icônes, logo | Brand book (page d'accueil) |
| Valeurs exactes des couleurs, tailles, espaces, rayons, ombres | `tokens.json` (trois thèmes : `jour`, `nuit`, `veille`) |
| Pile technique, dossiers, données, sécurité | Architecture |
| Passer des jetons au thème React Native, polices, Veille automatique | Jetons en React Native |
| Routes Expo Router, onglets, menu Plus, liens profonds | Structure et navigation |
| Chaque écran : rôle, composants, données, états | Inventaire des écrans |
| Horaires, qibla, notifications, dhikr | Prières et rappels |
| Lecture (Coran en arabe seul, translittération en option), audio, droits des contenus | Lecture et audio |
| Enveloppes, épargne, devises, zakat, modèle de données | Budget du foyer |
| Prêts et emprunts entre proches, rappels, lien avec la zakat | Dettes entre proches |
| Slogans wolof, microcopie, i18n, RTL | Voix et langues |
| Fichiers du logo, icônes d'app, écran de démarrage, visuels des stores | Logo, icônes et images |
| Comptes, exigences, fiches, calendrier | Publication sur les stores |
| Dons par wallet (Bankily, Masrvi, Wave…), numéro de transaction, règles des stores | Dons |
| Tous les libellés en français, arabe et wolof (`i18n/*.json`) | Textes de l'interface |
| Villes pour le choix manuel (`donnees/villes.json`) | Prières et rappels |
| Politique de confidentialité et page de suppression, prêtes à publier | Confidentialité et suppression du compte |
| Luminance, contraste réel, éblouissement | Confort visuel |
| Ce qu'il faut tester avant chaque version | Recette |
| Notifications, écran verrouillé, widgets, activité en direct, compte à rebours | Hors de l'app |
| Pour chaque écran : React Native d'abord, puis Expo, puis la communauté | Fiche technique de la maquette (https://claude.ai/artifact/QZ3Shi7417TUeoU1BfKwNt) |
| Le système de bout en bout : couches, bases, serveur, flux, sécurité, tests, décisions ouvertes | Conception du système (https://claude.ai/artifact/2aq4hMBhjbzoHvz6JVDcoH) |

Les maquettes complètes (une centaine de planches : écrans et leurs états, démarrage, interface en arabe, et tout ce qui se voit hors de l'app) sont sur le canevas « Sama Jàmm — Logo et icônes » (https://claude.ai/artifact/XQ8t15MHjz5E4V9mFLcgkP), pages « Écrans de l'app » et « Hors de l'app ». Chaque écran est cliquable du démarrage à la fin (bouton Lecture d'une planche) ; chaque planche est un fichier `project/<Planche>.dc.html` lisible à cette adresse. L'inventaire des écrans donne le nom de chaque planche. Les captures des stores sont sur la page « Stores » et dans le groupe d'assets Stores.

## Comment utiliser les composants

- `components/bundle.js` est une **référence web** (React DOM) : elle montre le rendu exact, les états et les props. Dans l'app, réécrire chaque composant en React Native avec les mêmes noms, les mêmes props (en français) et les mêmes jetons.
- Lire `components/<Nom>/README.md` avant d'écrire un composant : il dit ce que le parent fournit, les règles d'usage et l'équivalent React Native (`Pressable`, `Modal`, `@gorhom/bottom-sheet`…).
- `components/index.d.ts` donne le type de chaque prop. Le copier dans `src/ui/types.ts` comme contrat.
- Une valeur de couleur, d'espace ou de rayon ne s'écrit jamais en dur dans un composant : elle vient du thème généré depuis `tokens.json`.

## Ordre de construction

1. **Socle** : projet Expo SDK 58 en TypeScript strict, Expo Router, thème généré depuis `tokens.json`, polices chargées, `ThemeProvider` à trois thèmes, i18n fr / wo / ar.
2. **Composants de base** : Button, IconButton, Icon, TopBar, TabBar, ListItem, ListGroup, Switch, SegmentedControl, Banner, Toast, Dialog, BottomSheet, EmptyState.
3. **Bienvenue et Accueil** : langue, position, rappels ; arc du jour et fil de régularité.
4. **Prière** : horaires (`adhan`), notifications à fenêtre glissante, qibla, dhikr.
5. **Lire** : base SQLite des textes, bibliothèque, lecteur, recherche plein texte, favoris.
6. **Écouter** : lecteur audio en arrière-plan, lecture sur l'écran verrouillé (un fichier par verset), téléchargements, minuterie.
7. **Budget** : base chiffrée, verrou biométrique, enveloppes, saisie au pavé, épargne, zakat, devises, dettes entre proches.
8. **Ensemble et compte** (facultatif en v1) : khatm collectif, synchronisation Supabase, suppression du compte.
9. **Hors de l'app** : widgets, activité en direct sur iPhone, compte à rebours Android (module natif).
10. **Publication** : EAS Build, TestFlight, test fermé Google Play de 14 jours, fiches et captures.

## Fait, c'est-à-dire

Un écran est terminé quand :

- il suit sa planche du canevas dans les trois thèmes, sans valeur codée en dur ;
- ses états vide, chargement, hors ligne et erreur existent (voir l'inventaire) ;
- il reste lisible à 200 % de taille de texte et en interface arabe (RTL) ;
- chaque élément touchable fait au moins 44 × 44 pt et porte un libellé accessible ;
- le retour se fait par la flèche « ← » de la barre du haut et par le geste natif ;
- il passe la page Recette.

## Règles qui ne se discutent pas

- Aucun texte sacré tronqué, abrégé, mis en majuscules ou couvert par une publicité.
- Aucune donnée du budget ne quitte le téléphone sans action explicite de l'utilisateur.
- Aucune série à perdre, aucun classement, aucune notification culpabilisante.
- La Veille s'allume seule entre Isha et Fajr si l'utilisateur l'a acceptée ; l'app ne s'ouvre jamais sur un écran clair la nuit.
- Les textes et récitations ne sont intégrés qu'avec leur licence vérifiée (page Lecture et audio).
- Le Coran s'affiche en arabe seul : aucune traduction sous les versets, la translittération seulement si l'utilisateur l'active.
- React Native d'abord : un composant ou une API de base avant un paquet Expo, un paquet Expo avant un paquet de la communauté. Toute dépendance ajoutée est justifiée dans la fiche technique.
