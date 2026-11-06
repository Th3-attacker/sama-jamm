// Transforme design/tokens.json (copié du design system Sama Jàmm) en src/theme/tokens.generated.ts.
// Lancer avec `npm run tokens` après chaque mise à jour de la charte.
import fs from 'node:fs';

const t = JSON.parse(fs.readFileSync('design/tokens.json', 'utf8'));
const ids = t.color.themes.map((x) => x.id); // ['jour', 'nuit', 'veille']
const pick = (v, id) => (typeof v === 'string' ? v : v[id] ?? v[ids[0]]);
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const themes = Object.fromEntries(
  ids.map((id) => [
    id,
    {
      couleurs: Object.fromEntries(t.color.tokens.map((k) => [camel(k.name), pick(k.value, id)])),
      ombres: Object.fromEntries(t.shadow.tokens.map((k) => [camel(k.name), pick(k.value, id)])),
    },
  ])
);
const px = (fam) => Object.fromEntries(t[fam].tokens.map((k) => [camel(k.name), parseFloat(k.value)]));
const out = `// Généré depuis design/tokens.json par scripts/tokens-to-theme.mjs — ne pas modifier à la main.
export const themes = ${JSON.stringify(themes, null, 2)} as const;
export const espace = ${JSON.stringify(px('spacing'), null, 2)} as const;
export const rayon = ${JSON.stringify(px('radius'), null, 2)} as const;
export const cible = ${JSON.stringify(px('zone-tactile'), null, 2)} as const;
export type NomTheme = keyof typeof themes;
export type Couleurs = (typeof themes)[NomTheme]['couleurs'];
export type Ombres = (typeof themes)[NomTheme]['ombres'];
`;
fs.writeFileSync('src/theme/tokens.generated.ts', out);
