# Toast

Message bref en bas d'écran qui confirme un geste et propose de l'annuler.

- **Le consommateur fournit** : le texte, une `icone`, une `action` au plus (« Annuler », « Voir »).
- Fond `inverse`, texte `sur-inverse`, action `accent-inverse`. La nuit et en Veille, `inverse` reste un vert sombre à peine relevé : jamais d'aplat clair qui éblouirait dans le noir.
- Posé 8 px au-dessus de la barre d'onglets ou du mini-lecteur ; disparaît après 4 s, 8 s s'il porte une action ; un seul à la fois.
- Annoncé aux lecteurs d'écran (`accessibilityLiveRegion="polite"`, `AccessibilityInfo.announceForAccessibility` sur iOS).
- À ne pas faire : message d'erreur important (utiliser un `Banner`), texte de plus de deux lignes.
