# Vérification des composants et des textes — 12 novembre 2026

## Textes
- **Parité** : 1 198 clés françaises, même ensemble en arabe (0 manquante, 0 en trop) ; le wolof (76 clés) reste chargé mais n'est pas proposé.
- **Clés mortes** : 10 retirées (fil de lecture, redémarrage de langue, vitesse du lecteur, moments, titre du menu Plus, sous-titre de Prière).
- **Chaînes en dur** : aucune chaîne d'interface en dur dans les écrans (hors noms de langue « العربية »).
- **Design system** : 410 textes identiques sur 563 ; 12 textes alignés (signature, langue, position, Veille, khatm, minuterie, Budget, épargne, zakat) ; 14 reformulations de l'app gardées (plus claires ou conformes aux décisions : Sources, favoris sans « chants », mise à jour, noms de méthodes) ; 127 textes du design system absents de l'app : 24 existent sous une autre clé, 38 concernent les xassaïdes, dons et chants (retirés), **65 à examiner** (voir ci-dessous).
- **Ponctuation** : 6 apostrophes droites passées en apostrophe typographique ; aucune espace double, aucun texte vide.
- **Texte sacré** : le compteur d'invocation abrégeait l'arabe (3 mots et « … ») : il affiche maintenant le titre français.

### 65 textes du design system sans équivalent dans l'app (à décider)
- « Position approximative », « Lien envoyé » (l'app envoie un code), dernière synchronisation du compte, récurrences du budget (jamais, chaque semaine, chaque mois), année lunaire (hawl) de la zakat, projection de l'épargne, état « service en maintenance », « Pas assez de place », libellés communs (`commun.valider`, `copier`, `oui`…), « Taille du texte » dans les réglages, texte de la qibla sans boussole.
- Ce sont soit des fonctions pas encore faites, soit des textes que l'app écrit autrement. Aucun n'a été ajouté sans écran qui l'utilise.

## Composants
- `Badge` et `Slider` alignés sur leur contrat ; `Toast` gardé (API impérative).
- **Accessibilité** : sur 74 éléments touchables, 22 n'ont pas d'`accessibilityLabel` explicite ; 21 ont un rôle et un texte visible (le lecteur d'écran lit le texte). Le dernier est la zone de la page du Mushaf (conteneur, avec un indice). Aucune zone tactile en dessous de 44 trouvée (les 32, 36, 40 vus sont des pastilles décoratives dans une ligne touchable).
- **Valeurs en dur** : 181 avertissements restants, tous des dimensions sans jeton (icônes, pastilles, pistes, hauteurs de bouton, rayon de 16 pour les cartes de planche alors que `rayon-carte` vaut 12). Rien à convertir sans créer de jetons.

## Vérifications `AGENTS.md` §6
`tsc` propre ; lint : 0 erreur, 185 avertissements ; 288 tests verts ; thème régénéré sans écart ; `expo install --check` : 27 paquets en retard de correctif (non touchés) ; `expo-doctor` : 18 contrôles sur 20, deux échecs : paquets en retard (les mêmes 27) et **`@expo/ui` en double** (58.0.27 à la racine, 58.0.28 sous `expo-widgets`). Cause : `expo-widgets` est installé mais aucun widget n'est écrit. À régler en alignant les versions ou en retirant `expo-widgets` tant qu'il ne sert pas, avec accord.
- Non vérifiable ici : rendu des écrans, thème nuit, arabe, texte à 200 %, audio, SQLCipher (appareil requis).

## Correction (écrans d'autorisation)
L'explication « avant la demande du téléphone » existait déjà, sous forme de feuille (`features/autorisation/AvantAutorisation.tsx`, clés `autorisations.avant.*`), utilisée par la qibla et la zakat. Seul le parcours de bienvenue la sautait. Il utilise maintenant les mêmes textes dans deux écrans entiers (`autorisation-position`, `autorisation-notifications`), comme les planches.
