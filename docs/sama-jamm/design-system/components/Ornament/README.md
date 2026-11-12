# Ornament

Marque une pause solennelle avec l'étoile à huit branches : séparateur entre deux sections, ou médaillon numéroté.

- **Le consommateur fournit** : `variante` (`separateur` par défaut, ou `medaillon`), et pour le médaillon `numero` et éventuellement `taille`.
- Séparateur : étoile `or` de 16 px entre deux filets `or` de 1 px, avec `espace-6` au-dessus et au-dessous.
- Médaillon : étoile `or-doux` cerclée d'`or`, chiffre `or-texte` en `libelle` réduit ; 36 px par défaut.
- Au plus un séparateur orné par écran visible.
- Le séparateur porte `role="separator"` ; le médaillon annonce « Verset N ».
- À ne pas faire : agrandir l'étoile en motif de fond, la colorer autrement qu'en or, l'animer.
