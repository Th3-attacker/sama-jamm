# Button

Déclenche une action ; le bouton `principal` (émeraude) apparaît au plus une fois par écran, pour ce que l'écran sert à faire.

- **Le consommateur fournit** : `variant`, le libellé en `children` (un verbe d'abord : « Reprendre la lecture »), éventuellement `icone`, `pleineLargeur`, `onClick`, `disabled`.
- `principal` : action majeure de l'écran, souvent en bas en pleine largeur.
- `secondaire` : action utile mais non principale (Télécharger, Partager la sourate).
- `discret` : actions de carte et actions annulables (Écouter, Plus tard).
- `precieux` : aplat `or` avec texte `sur-or`. Réservé à un geste solennel et rare : terminer un khatm, faire un don. Jamais deux sur un écran.
- `danger` : aplat `erreur`, texte `sur-erreur`. Seulement dans une `Dialog` de confirmation (supprimer le compte, effacer l'historique du budget).
- Hauteur minimale `cible-ios` (44 pt), libellé en `libelle`, rayon `rayon-carte`.
- **React Native** : `Pressable` avec `android_ripple` couleur `emeraude-doux`, retour haptique léger (`expo-haptics`, `ImpactFeedbackStyle.Light`) sur `principal` et `precieux` seulement.
- À ne pas faire : libellés en majuscules, deux boutons principaux côte à côte, texte blanc sur l'or, `danger` posé directement sur un écran.
