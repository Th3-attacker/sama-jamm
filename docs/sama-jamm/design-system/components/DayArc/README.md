# DayArc

L'arc du jour : le soleil suit une demi-ellipse du lever au coucher, les cinq prières sont posées sur sa course, la nuit repasse en pointillés sous l'horizon.

- **Le consommateur fournit** : `lever`, `coucher`, `maintenant` (heures locales « HH:MM »), `prieres` (`nom`, `heure`, `etat`), `dans` (« 42 min »), `description` pour les lecteurs d'écran.
- Chemin parcouru en `emeraude`, reste de l'arc en `ligne`, nuit en `ligne-forte` pointillé. Prières passées : points pleins ; prochaine : anneau `emeraude` de 7 ; à venir : points creux.
- Le soleil est l'étoile à huit branches `or` ; la nuit, elle est plus pâle sur la courbe du bas.
- Sous l'arc : les cinq noms et heures, la prochaine en émeraude gras.
- Calcul : `adhan` (Coordinates, CalculationParameters) sur le téléphone ; `lever` = `sunrise`, `coucher` = `sunset`. Mise à jour chaque minute, pas chaque seconde.
- À ne pas faire : secondes qui défilent, animation continue du soleil.
