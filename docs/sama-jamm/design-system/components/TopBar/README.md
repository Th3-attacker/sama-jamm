# TopBar

Barre du haut de chaque écran : la flèche de retour « ← », le titre et deux actions au plus.

- **Le consommateur fournit** : `titre`, `sousTitre`, `retour` (true ou un libellé précis comme « Retour aux horaires »), `onRetour`, `actions` (icône et libellé obligatoire).
- **Retour** : toujours l'icône `arrow-left` (« ← »), jamais un chevron « < » ni le mot « Retour » écrit. Zone tactile 44 × 44. En interface arabe (RTL), la flèche est retournée (« → »).
- **Écrans racines des onglets** : `grand` affiche le nom de l'onglet en Cormorant `titre-1` émeraude, dans la langue de l'interface (« Lire », « Budget »), avec une précision en italique dessous si utile. Pas de retour. Les formules wolof vont dans les titres de section et les moments clés, pas dans les noms d'onglets.
- **Écrans de lecture** : `transparent`, la barre se masque au défilement et revient au moindre geste vers le haut.
- La dernière action est souvent `more` (menu Plus) ; la recherche peut être la première.
- **React Native** : en-tête propre (pas celui d'Expo Router) dans `SafeAreaView` ; `headerShown: false` dans les layouts, geste de retour natif conservé (balayage iOS, bouton retour Android).
- À ne pas faire : plus de deux actions, titre centré tronqué, retour sans libellé accessible.
