// Android : supprime la teinte d'ondulation (violette par défaut) au toucher d'un onglet de la barre native.
// Fixe `colorControlHighlight` et `colorPrimary` du thème de l'app. Effet visible seulement dans un nouveau build.
const { withAndroidStyles } = require('expo/config-plugins');

function posee(style, nom, valeur) {
  style.item = (style.item ?? []).filter((i) => i.$.name !== nom);
  style.item.push({ $: { name: nom }, _: valeur });
}

module.exports = function withSansOndulation(config) {
  return withAndroidStyles(config, (cfg) => {
    const styles = cfg.modResults.resources.style ?? [];
    const theme = styles.find((s) => s.$.name === 'AppTheme');
    if (theme) {
      posee(theme, 'colorControlHighlight', '@android:color/transparent');
      posee(theme, 'colorPrimary', '#1f5f4a');
    }
    return cfg;
  });
};
