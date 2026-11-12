# AmountDisplay

Affiche un montant en grand, dans la devise choisie par le foyer.

- **Le consommateur fournit** : `montant` (unités principales), `devise`, `libelle`, `detail`, `signe`, `ton`, `centre`, `saisie`.
- Chiffres `chiffre` (Source Sans 3, 44/48, 600, chiffres tabulaires), symbole 20 px `encre-2`, espace fine insécable entre milliers : « 350 000 F CFA ».
- La devise vient des réglages : F CFA (XOF) et ouguiya (MRU) intégrées, ou une devise ajoutée par l'utilisateur (symbole avant ou après, 0 à 2 décimales). Utiliser `formatMontant`.
- `revenu` en émeraude avec « + » ; une dépense reste à l'encre : dépenser n'est pas une faute.
- **React Native** : `Text` avec `fontVariant: ['tabular-nums']` ; `allowFontScaling` limité à 1,3 pour les chiffres géants.
