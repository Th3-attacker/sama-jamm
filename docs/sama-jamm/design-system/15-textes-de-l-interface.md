# Textes de l'interface

Tous les libellés de l'app sont écrits dans `i18n/fr.json` (référence), `i18n/ar.json` (traduction complète, à relire) et `i18n/wo.json` (premières formules, à compléter). Copier ces trois fichiers dans `src/i18n/` : aucun texte d'interface ne s'écrit en dur dans un composant.

## Fichiers

| Fichier | État | Règle |
| --- | --- | --- |
| `i18n/fr.json` | Complet, 568 clés | Langue de référence et de repli : toute clé absente ailleurs s'affiche en français |
| `i18n/ar.json` | Complet, avec les six formes du pluriel arabe | Relecture par un arabophone avant publication ; interface en sens RTL |
| `i18n/wo.json` | Brouillon : formules, onglets, mots courants | Traduction et relecture par un locuteur wolof ; les formules wolof restent telles quelles dans les trois langues |

## Organisation des clés

- Un groupe par écran ou par domaine : `commun`, `formules`, `onglets`, `menuPlus`, `bienvenue`, `autorisations`, `accueil`, `lire`, `khatm`, `ecouter`, `telechargements`, `priere`, `notifications`, `qibla`, `dhikr`, `recherche`, `favoris`, `partage`, `reglages`, `aPropos`, `compte`, `budget`, `epargne`, `dettes`, `zakat`, `devise`, `dons`, `etats`, `accessibilite`.
- Libellés accessibles (lecteurs d'écran) dans `accessibilite` ou à côté du libellé visible.
- Variables entre doubles accolades : `{{priere}}`, `{{montant}}` (déjà formaté par `formatMontant`), `{{count}}` pour les pluriels.
- Pluriels : suffixes d'i18next (`_one`, `_other` en français ; `_zero`, `_one`, `_two`, `_few`, `_many`, `_other` en arabe).

```ts
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import fr from './fr.json'; import ar from './ar.json'; import wo from './wo.json';

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, ar: { translation: ar }, wo: { translation: wo } },
  lng: reglages.langue ?? (Localization.getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'fr'),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});
```

Le groupe `dettes` n'est pas encore dans les fichiers : ses clés, en français et en arabe, sont listées dans la section « Dettes entre proches » et se copient dans `fr.json` et `ar.json` avec les écrans.

## Ce qui ne passe pas par ces fichiers

- Les textes religieux (versets, traductions, chants, invocations) : `contenu.db`.
- Les noms et numéros des wallets : table distante `wallets_dons`.
- La sagesse du jour (« Wax ju rafet ») : liste validée de proverbes dans `contenu.db`, avec sa traduction.
- Les noms des villes : `donnees/villes.json`.

## Relecture

1. Le français est relu une fois par l'équipe ; toute nouvelle clé y est ajoutée d'abord.
2. L'arabe et le wolof sont relus par des locuteurs, sur l'app, pas seulement dans le fichier (longueur, coupures, sens RTL).
3. Une clé absente d'une traduction n'empêche pas une version : elle s'affiche en français.
4. Contrôle automatique en intégration continue : mêmes clés de base et mêmes variables dans les trois fichiers.
