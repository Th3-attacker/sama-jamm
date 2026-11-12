# Slider

Curseur pour une valeur continue : taille du texte arabe, vitesse de récitation.

- **Le consommateur fournit** : `label`, `min`, `max`, `pas`, `valeur`, `onChange`, `format` (texte affiché et lu), `gauche`/`droite` (repères visuels).
- Valeur écrite à droite du libellé, toujours. Piste 4 px : partie remplie `emeraude`, reste `ligne-forte`. Pouce 24 sur `surface`, bordure `emeraude`.
- L'aperçu se met à jour en direct (le verset d'exemple grossit pendant le glissement).
- **React Native** : `@react-native-community/slider` avec `minimumTrackTintColor` et `maximumTrackTintColor` des jetons, `accessibilityValue={{ text }}`.
