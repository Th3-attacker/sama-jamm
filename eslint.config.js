// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Aucune valeur de design en dur hors de `src/theme/` (tout vient de `tokens.json`). En avertissement tant que
    // le code existant n'est pas migré ; à passer en 'error' une fois la dette soldée.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**', 'src/**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            'Property[key.name=/^(fontSize|lineHeight|height|minHeight|width|minWidth|padding.*|margin.*|gap|borderRadius)$/] > Literal[raw=/^[1-9]/]',
          message: 'Valeur en dur : utiliser un jeton du thème (src/theme/tokens.generated.ts).',
        },
        { selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]', message: 'Couleur en dur : utiliser le thème.' },
      ],
    },
  },
]);
