# Confort visuel

Sama Jàmm se lit à l'aube, la nuit et en plein soleil : le thème doit suivre la lumière ambiante, pas l'inverse. Ces règles viennent d'un calcul de luminance émise, de contraste réel et de saturation pour chaque zone de l'écran, dans les trois thèmes.

## Règles

- Suivre le mode clair ou sombre du téléphone par défaut : `jour` en clair, `nuit` en sombre.
- Proposer `veille` (lecture nocturne atténuée) dans les réglages, avec une option « automatique entre Isha et Fajr » qui s'appuie sur les horaires calculés par l'app. Une notification de Fajr ouverte dans le noir ne doit jamais afficher l'ivoire plein écran.
- L'écran de démarrage suit le thème du téléphone : ivoire (`marque-ivoire`) en clair, vert nuit (`marque-nuit`) en sombre.
- Ne jamais forcer la luminosité de l'écran. Laisser la luminosité automatique, True Tone et Night Shift du système faire leur travail.
- En extérieur, `jour` garde 17 à 25 % de contraste réel de plus que `nuit` : le recommander dans l'aide « lire au soleil ».
- Au soleil, le contraste réel tombe vers 2,3 à 2,8:1 quel que soit le thème. L'information vitale (heure de la prochaine prière, compte à rebours) est donc en `titre-3` ou plus grand, en graisse 600, en `encre` ou `sur-emeraude-doux`, jamais en `or-texte` seul.
- Pas de blanc pur ni de noir pur en grande surface : `fond` reste ivoire le jour et vert profond la nuit. Le noir pur fait traîner l'image sur les écrans OLED ; le blanc pur éblouit.
- La nuit, le texte n'est pas au maximum : la luminance d'`encre` est réduite de 13 % en `nuit` et de 33 % en `veille` par rapport à la première version (#F2EDE3), pour limiter le halo autour des lettres claires sur fond sombre, gênant surtout pour les personnes astigmates.
- Écart serré entre niveaux de texte la nuit : `encre-2` et `encre-3` ont été relevées pour que l'œil ne fasse pas d'effort sur les translittérations et les légendes.
- Saturation plafonnée : chroma OKLCH d'au plus 0,10 pour les accents et 0,035 pour les fonds, pour éviter que l'or et l'émeraude ne « vibrent » sur fond sombre.

## Ce que reçoit l'œil

Chaque case donne la luminance moyenne de l'écran, le rapport entre l'écran et ce qui l'entoure (confortable jusqu'à environ ×3) et le contraste réel du texte principal une fois les reflets ajoutés.

| Situation | Jour | Nuit | Veille |
| --- | --- | --- | --- |
| Nuit, chambre sombre (5 lux, écran 10 cd/m²) | 9,3 cd/m² · ×19,5 · 55,2:1 | 0,5 cd/m² · ×1,0 · 41,2:1 | 0,4 cd/m² · ×0,76 · 41,7:1 |
| Intérieur (300 lux, écran 200 cd/m²) | 186,0 cd/m² · ×6,5 · 30,9:1 | 10,0 cd/m² · ×0,35 · 23,5:1 | 7,3 cd/m² · ×0,25 · 21,0:1 |
| Extérieur à l’ombre (10 000 lux, écran 800 cd/m²) | 744,1 cd/m² · ×0,78 · 6,0:1 | 40,0 cd/m² · ×0,04 · 4,8:1 | 29,2 cd/m² · ×0,03 · 4,0:1 |
| Plein soleil (60 000 lux, écran 1 600 cd/m²) | 1 488,1 cd/m² · ×0,26 · 2,7:1 | 80,0 cd/m² · ×0,01 · 2,3:1 | 58,3 cd/m² · ×0,01 · 2,0:1 |

Lecture : le soir, `jour` est 19 fois plus lumineux que la chambre, d'où l'éblouissement et la fatigue ; `nuit` et `veille` restent au niveau de la pièce. Au soleil, aucun thème ne dépasse 2,8:1 de contraste réel : la taille et la graisse du texte font la différence.

## Zone par zone

Contraste WCAG et contraste perceptuel APCA (Lc) de chaque zone, dans les trois thèmes.

| Zone | Jour | Nuit | Veille |
| --- | --- | --- | --- |
| Texte principal (`encre` sur `fond`) | 16,8:1 · Lc 102 | 13,0:1 · Lc 86 | 10,9:1 · Lc 72 |
| Texte de lecture sur carte (`encre` sur `surface`) | 17,4:1 · Lc 104 | 11,7:1 · Lc 85 | 10,1:1 · Lc 71 |
| Translittération, sous-titres (`encre-2` sur `fond`) | 6,9:1 · Lc 83 | 10,3:1 · Lc 72 | 9,2:1 · Lc 63 |
| Métadonnées, légendes (`encre-3` sur `surface`) | 5,8:1 · Lc 79 | 7,2:1 · Lc 57 | 6,7:1 · Lc 50 |
| Lien, onglet actif (`emeraude` sur `fond`) | 11,2:1 · Lc 94 | 9,2:1 · Lc 66 | 7,8:1 · Lc 55 |
| Bouton principal (`sur-emeraude` sur `emeraude`) | 11,2:1 · Lc 97 | 9,2:1 · Lc 67 | 7,8:1 · Lc 57 |
| Prochaine prière (`sur-emeraude-doux` sur `emeraude-doux`) | 9,7:1 · Lc 84 | 7,9:1 · Lc 79 | 8,1:1 · Lc 70 |
| Numéro de verset (`or-texte` sur `or-doux`) | 5,3:1 · Lc 71 | 8,1:1 · Lc 63 | 6,9:1 · Lc 52 |
| Filet or (décor) (`or` sur `fond`) | 2,4:1 · Lc 46 | 7,0:1 · Lc 52 | 5,7:1 · Lc 41 |

Repères APCA retenus : Lc 75 pour le texte courant à 16 px, Lc 70 pour la lecture à 18 px et plus, Lc 60 pour les libellés en gras et la translittération, Lc 45 pour les grands chiffres, Lc 30 pour le décor. `veille` descend volontairement d'un cran : c'est un mode de nuit choisi, à texte agrandi. La nuit, le texte principal sur le fond est volontairement tenu entre Lc 72 et 86, sous le maximum, pour limiter le halo.

## Densité des couleurs

Clarté (L) et saturation (C) en OKLCH. Les fonds restent presque neutres ; les accents ne dépassent pas 0,10.

| Jeton | Jour | Nuit | Veille |
| --- | --- | --- | --- |
| `fond` | L 0,99 · C 0,006 | L 0,22 · C 0,033 | L 0,19 · C 0,024 |
| `encre` | L 0,22 · C 0,007 | L 0,91 · C 0,019 | L 0,83 · C 0,025 |
| `emeraude` | L 0,34 · C 0,077 | L 0,79 · C 0,095 | L 0,72 · C 0,085 |
| `or` | L 0,72 · C 0,100 | L 0,72 · C 0,100 | L 0,65 · C 0,087 |
| `or-texte` | L 0,49 · C 0,084 | L 0,80 · C 0,098 | L 0,72 · C 0,086 |

## Hypothèses du calcul

- Reflet de l'écran : 4,5 % de la lumière ambiante (verre avec traitement antireflet).
- Environnement : surfaces qui renvoient 30 % de la lumière.
- Luminance moyenne : 60 % de fond, 35 % de cartes, 5 % d'encre, comme sur un écran de lecture.
- Luminosité de l'écran : 10 cd/m² la nuit, 200 en intérieur, 800 à l'ombre, 1 600 au soleil (pic des téléphones récents en extérieur).
- Ces valeurs sont des ordres de grandeur à vérifier sur appareil réel, à la luminosité automatique.
