# Menu

**Obsolète depuis le 8 novembre 2026** : l'onglet Plus (`PlusHub`) remplace ce menu. Ne pas l'implémenter ; la description ci-dessous reste pour l'historique.

Le menu Plus, ouvert depuis l'icône `more` en haut à droite : tout ce qui n'a pas d'onglet.

- **Le consommateur fournit** : `items` (`icone`, `label`, `onClick`, `fin` pour une valeur courte, `danger`), et `{ separateur: true }` entre deux familles.
- Contenu standard : Rechercher, Favoris, Téléchargements | Réglages, Compte et synchronisation.
- Lignes de 48, icône 20 `encre-2`, libellé `corps`. Fond `surface`, filet `ligne`, `ombre-2` le jour.
- S'ouvre ancré sous l'icône, se ferme au toucher extérieur ou au retour.
- **React Native** : `Modal` transparent avec un `Pressable` plein écran derrière ; sur Android, la touche retour ferme le menu.
- À ne pas faire : plus de sept entrées, sous-menus, actions destructrices hors d'une `Dialog`.
