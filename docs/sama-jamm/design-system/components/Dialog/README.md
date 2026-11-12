# Dialog

Boîte de dialogue qui fait confirmer un geste qu'on ne peut pas défaire.

- **Le consommateur fournit** : `titre` (une question), le texte en `children` (ce qui sera perdu et ce qui reste), `confirmer` (le verbe exact), `annuler`, `danger`, `icone`, `onConfirmer`, `onAnnuler`.
- Voile `voile` derrière (plus opaque la nuit), carte `surface` au rayon `rayon-feuille`, titre Cormorant `titre-2`.
- Boutons empilés en pleine largeur : confirmer en haut (`danger` ou `principal`), annuler en `discret` dessous.
- Usages : supprimer le compte, quitter un khatm, effacer l'historique du budget, réinitialiser le compteur de dhikr au-delà de 100.
- **React Native** : `Modal` avec `animationType="fade"`, focus sur le titre à l'ouverture, retour Android = annuler.
- À ne pas faire : « OK / Annuler », dialogue pour une simple information, deux dialogues enchaînés.
