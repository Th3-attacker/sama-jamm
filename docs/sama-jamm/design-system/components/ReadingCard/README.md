# ReadingCard

Présente une unité de lecture (verset, vers, invocation) : texte arabe, translittération facultative, sens facultatif, puis actions.

- **Le consommateur fournit** : `arabe` (obligatoire, complet), `numero`, `source`, `translitteration`, `traduction`, `favori`, et `coran={false}` pour un texte arabe non coranique (xassaïde, invocation).
- **Coran** : arabe seul. `translitteration` seulement si le réglage de l'utilisateur est actif (désactivé par défaut). `traduction` n'est jamais passée pour un verset.
- **Invocations et xassaïdes** (`coran={false}`) : `traduction` porte le sens en français, en `lecture`, `encre`.
- Le texte arabe est en `coran` (Amiri Quran) ou `arabe` (Amiri), dans un bloc `lang="ar"` `dir="rtl"`, aligné à droite.
- La translittération est en `translitteration`, italique, `encre-2`, sous l'arabe.
- Le numéro vit dans le médaillon étoilé : étoile `or-doux` cerclée d'`or`, chiffre en `or-texte`.
- Actions en bas, séparées par un filet `ligne` : Écouter (bouton `discret`), Favori et Partager (icônes avec libellé accessible).
- Pendant la récitation, la carte du verset en cours est en pleine encre, les autres estompées.
- **React Native** : `View` + `Text` (`writingDirection: 'rtl'`, `textAlign: 'right'`), `Pressable` pour les actions ; jamais de `numberOfLines` sur le texte sacré.
- À ne pas faire : tronquer un texte, le mettre en gras, placer quoi que ce soit avant l'arabe, ajouter une traduction sous un verset.
