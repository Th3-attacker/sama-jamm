import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { chiffresAffiches } from '@/lib/chiffres';
import { interlignes, rayon, tailles } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

// Planche « Bienvenue · position » : cercle de 200 × 200. L'écart de 2 entre les lignes (hors échelle) est
// remplacé par les interlignes seuls ; « 30/34 » et « 13/18 » de la planche deviennent 30/36 et 12/16 (ECARTS.md).
// Tenue dans le cercle : toutes les lignes plafonnées à echelleMax.grand (1,3). Hauteur au plafond : 127 en latin,
// 156 en arabe (interlignes élargis) ; la ligne du haut et celle du bas commencent alors à 64 (latin) ou 78 (arabe)
// du centre, où la corde mesure 154 ou 125. La marge de 24 de chaque côté (espace6) borne les lignes à 152, la
// corde à 64 du centre ; les textes les plus larges (« الصلاة القادمة », environ 106) tiennent sur une ligne.
const DIAMETRE = 200;
// Planche : textes secondaires à 85 % d'opacité sur l'aplat.
const ATTENUE = 0.85;
// Heure et délai d'exemple : illustration fixe, aucune vraie heure.
const HEURE_EXEMPLE = '16:35';
const MINUTES_EXEMPLE = 42;

/** Illustration de l'étape « position » : la prochaine prière dans un cercle émeraude (exemple fixe). */
export function CercleProchainePriere() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie, ligne, arabe } = useTheme();
  const couleur = { color: couleurs.surEmeraude };

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('bienvenue.cercleExemple')}
      style={[styles.cercle, { marginTop: espace.espace2, paddingHorizontal: espace.espace6, backgroundColor: couleurs.emeraudeAplat }]}>
      <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.legende, arabe ? styles.centre : ligne(styles.surtitre), couleur, styles.attenue]}>
        {t('bienvenue.prochaine')}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, styles.centre, couleur]}>
        {t('priere.noms.asr')}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.chiffre, ligne(styles.heure), couleur]}>
        {chiffresAffiches(HEURE_EXEMPLE)}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.legende, styles.centre, couleur, styles.attenue]}>
        {t('bienvenue.dansMinutes', { minutes: MINUTES_EXEMPLE })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cercle: {
    alignSelf: 'center',
    width: DIAMETRE,
    height: DIAMETRE,
    borderRadius: rayon.rayonPastille,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: { textAlign: 'center' },
  attenue: { opacity: ATTENUE },
  // Planche : 12/16, majuscules, espacement 0,06 em. En arabe : legendeAr (13/20) sans espacement des lettres.
  surtitre: { fontSize: tailles.t12, lineHeight: interlignes.l16, textTransform: 'uppercase', letterSpacing: 0.72, textAlign: 'center' },
  // Planche : 24/30, 600, chiffres tabulaires (le style chiffre les porte déjà).
  heure: { fontSize: tailles.t24, lineHeight: interlignes.l30, textAlign: 'center' },
});
