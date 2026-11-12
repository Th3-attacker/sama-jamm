# QiblaCompass

Boussole de la qibla : le repère du haut suit l'axe du téléphone, le cadran tourne et l'étoile (la Kaaba) reste à son relèvement.

- **Le consommateur fournit** : `cap` (cap du téléphone en degrés), `qibla` (relèvement calculé depuis la position), `tolerance` (3° par défaut), `lieu`.
- Consigne écrite en grand : « Encore un peu à droite », « Tournez à gauche », puis « Vous faites face à la qibla » : l'anneau passe en `emeraude` sur `emeraude-doux` et le téléphone vibre une fois.
- Relèvement : grand cercle vers la Kaaba (21,4225 N, 39,8262 E), par exemple 74° à Dakar, 76° à Nouakchott ; `Qibla` d'`adhan` le calcule.
- Cap : `expo-location` `watchHeadingAsync` (`trueHeading` quand il est disponible). Si la précision est faible, afficher le conseil de calibration (dessiner un 8).
- À ne pas faire : flèche qui tremble (lisser le cap sur 200 ms), vibration continue.
