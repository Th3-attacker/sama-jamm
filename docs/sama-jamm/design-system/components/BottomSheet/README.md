# BottomSheet

Feuille qui monte du bas pour un choix rapide sans quitter l'écran : récitateur, vitesse, ajout d'une dépense.

- **Le consommateur fournit** : `titre`, le contenu, `onFermer`.
- Coins hauts `rayon-feuille`, poignée 36 × 4 `ligne-forte`, bouton fermer « × » en haut à droite, voile `voile`.
- Se ferme au glissement vers le bas, au toucher du voile, au retour Android.
- Hauteur selon le contenu, 90 % de l'écran au plus ; le clavier pousse la feuille.
- **React Native** : `Modal` de React Native (`presentationStyle="pageSheet"` sur iPhone, ou transparent + `Animated`), ou un écran Expo Router en `presentation: 'formSheet'` avec des crans de hauteur. `@gorhom/bottom-sheet` seulement si ces deux solutions ne suffisent pas.
