# AudioPlayer

Mini-lecteur posé au-dessus de la barre d'onglets pendant une écoute : titre, sous-titre, lecture ou pause, progression.

- **Le consommateur fournit** : `titre`, `sousTitre` (récitant, temps restant), `progression` de 0 à 1 et `enLecture`.
- Surface `surface` avec `ombre-2` ; fine barre de progression `or` sur piste `surface-creux` en haut.
- La vignette est l'étoile `or` sur `marque-emeraude`, en attendant des visuels par recueil.
- Le bouton rond lecture/pause est `emeraude` avec l'icône en `sur-emeraude`, 48 px.
- Toucher le texte ouvre le lecteur plein écran (feuille à coins `rayon-feuille`).
- La lecture continue en arrière-plan et sur l'écran verrouillé ; les commandes système reprennent le même titre (voir la page Hors de l'app).
- **React Native** : `Pressable` + `Text` + `View` pour la barre ; `expo-audio` pour le son ; ouverture du lecteur plein écran par `Animated`, ou `react-native-gesture-handler` et `react-native-reanimated` pour la glisser au doigt.
- À ne pas faire : lancer un son automatiquement à l'ouverture de l'app.
