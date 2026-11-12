# VerseShareCard

Image d'un verset à partager (WhatsApp, statut), aux couleurs de marque quel que soit le thème.

- **Le consommateur fournit** : `arabe`, `source` (« Ar-Ra‘d · 13:28 »), `fond` (`emeraude`, `nuit` ou `ivoire`), `taille` (carré ou story), et la translittération si l'utilisateur l'a cochée sur l'écran de partage (désactivée par défaut). La prop `traduction` du composant de référence porte cette translittération : aucune traduction du Coran n'est partagée.
- Fond `marque-emeraude` ou `marque-nuit`, texte `marque-ivoire` (11,2:1), source et étoiles `marque-or` (4,7:1), cadre or à 55 %.
- Le texte arabe n'est jamais coupé : au-delà de trois lignes, la carte passe en 1080 × 1350 (4:5).
- Signature en bas à droite : dans l'app, utiliser le fichier `marque-or.svg` à la place de l'étoile dessinée.
- **React Native** : la carte est une `View` dessinée hors écran ; `react-native-view-shot` (`captureRef`, 1080 px) en fait une image, `expo-sharing` l'envoie. Le texte et le lien partent par `Share` de React Native ; « Copier » par `expo-clipboard`.
- À ne pas faire : photo en fond, verset sans référence.
