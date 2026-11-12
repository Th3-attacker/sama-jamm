# TabBar

Navigation principale en cinq onglets : Accueil, Lire, Prière, Budget, Plus. Écouter vit dans Lire (interrupteur Lire | Écouter).

- **Décision du 8 novembre 2026** : onglets natifs d'Expo Router (`NativeTabs`). iOS 26 dessine sa barre en verre, Android sa barre Material. Le composant web de ce système montre la hiérarchie et les libellés ; il ne se recopie pas en React Native.
- Chaque onglet a son icône et son mot. Icônes système (SF Symbols, Material Symbols) ; les fichiers du groupe d'assets « Onglets » restent le repli.
- L'onglet actif prend la teinte `emeraude` ; le reste du style appartient au système.
- La recherche, les favoris, les téléchargements, les réglages et le compte passent par l'onglet Plus, jamais par un sixième onglet.
- Le mini-lecteur (`AudioPlayer`) se pose au-dessus de la barre (`NativeTabs.BottomAccessory`).
- **React Native** : aucun équivalent de base ; c'est l'un des rares cas où l'on part directement d'Expo Router.
- À ne pas faire : un sixième onglet, des icônes sans mot, un badge rouge de notification.
