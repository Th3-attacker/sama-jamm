# Déclaration d'accessibilité (Apple) – brouillon

App Store Connect demande de déclarer, par fonction, ce que l'app prend en charge (VoiceOver, Voice Control, texte plus grand, contraste, réduction des animations, sous-titres…). Déclarer seulement ce qui a été **testé sur un iPhone**.

## Constat dans le code (non testé sur appareil)
- Étiquettes d'accessibilité : 76 occurrences de `accessibilityLabel` dans `src`.
- Texte agrandi : `maxFontSizeMultiplier` plafonné sur 343 textes (agrandissement pris en charge avec un plafond).
- Langue des textes arabes et wolof déclarée pour la voix (`accessibilityLanguage`) sur la signature.
- Thème clair/sombre automatique (`userInterfaceStyle: automatic`).

## Déclarations proposées
| Fonction | Réponse proposée | Statut |
| --- | --- | --- |
| VoiceOver | Oui | À VALIDER : parcourir tous les écrans avec VoiceOver |
| Voice Control | À déterminer | À VALIDER : tester avec Voice Control |
| Texte plus grand | Oui | À VALIDER : tester avec la taille maximale |
| Contraste suffisant | Oui | À VALIDER : mesurer en clair et en sombre |
| Mouvement réduit | À déterminer | À VALIDER : l'app utilise reanimated |
| Sous-titres / audio-description | Sans objet (récitations audio sans vidéo) | À VALIDER |

URL de la page d'accessibilité (facultative) : à fournir si tu héberges la page d'aide.
