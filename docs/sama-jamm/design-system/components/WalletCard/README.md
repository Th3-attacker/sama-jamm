# WalletCard

Un wallet où envoyer un don (Bankily, Masrvi, Wave…) : son nom, le numéro à copier, le titulaire. L'app n'encaisse rien : l'utilisateur envoie depuis son propre wallet.

- **Le consommateur fournit** : `nom`, `pays`, `numero`, `titulaire`, `choisi`, `onChoisir`, `onCopie`.
- Les wallets et leurs numéros viennent d'une configuration distante (table `wallets_dons`), jamais du code : un numéro qui change ne demande pas de nouvelle version.
- Carte repliée : monogramme (deux lettres) et nom. Carte choisie : contour `emeraude`, numéro en 26 px groupé par deux chiffres sur `surface-creux`, titulaire, bouton « Copier le numéro ».
- Monogramme plutôt que logo : n'afficher le logo officiel d'un opérateur qu'avec son accord écrit.
- Le titulaire est affiché pour que l'utilisateur vérifie le nom que son wallet lui montre avant d'envoyer.
- **React Native** : `expo-clipboard` (`setStringAsync`), retour haptique léger et `Toast` « Numéro copié ».
- À ne pas faire : bouton « Payer », montant prélevé, collecte du code secret ou du numéro de l'utilisateur.
