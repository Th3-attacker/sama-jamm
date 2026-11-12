// Dédicace de l'application, à la mémoire de Hawa Abdoulaye Fall et de Ramatoulaye Gueye. Deux présentations :
// `bloc` (dernier écran de bienvenue, centré, sans cadre) et `carte` (À propos, avec l'invocation en arabe).
// Les noms sont en gras ; le texte vient des clés `aPropos.dedicace*` (français et arabe).
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

const COTE_ETOILE = 24;

/** Étoile à huit pointes (deux carrés superposés) : seize sommets, un sur deux sur le grand cercle. */
function pointsEtoile(): string {
  const centre = COTE_ETOILE / 2;
  const grand = centre - 1;
  // Rayon des sommets rentrants d'une étoile {8/2} dessinée par deux carrés : cos 45° / cos 22,5° du grand rayon.
  const petit = (grand * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
  return Array.from({ length: 16 }, (_, i) => {
    const rayon = i % 2 === 0 ? grand : petit;
    const angle = (Math.PI / 8) * i - Math.PI / 2;
    return `${(centre + rayon * Math.cos(angle)).toFixed(2)},${(centre + rayon * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}
const POINTS = pointsEtoile();

export function Dedicace({ variante }: { variante: 'bloc' | 'carte' }) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const carte = variante === 'carte';
  const nom = [typographie.libelle, { color: couleurs.encre }];

  return (
    <View
      accessible
      accessibilityLabel={`${t('aPropos.dedicaceTitre')} : ${t('aPropos.dedicaceDebut')} ${t('aPropos.dedicaceNom1')} ${t('aPropos.dedicaceLiaison')} ${t('aPropos.dedicaceNom2')}. ${t('aPropos.dedicaceFin')}`}
      style={[
        carte
          ? {
              gap: espace.espace2,
              padding: espace.espace4,
              backgroundColor: couleurs.orDoux,
              borderColor: couleurs.or,
              borderWidth: 1,
              borderRadius: rayon.rayonFeuille,
            }
          : { gap: espace.espace3, alignItems: 'center', paddingVertical: espace.espace4 },
      ]}>
      <View style={carte ? styles.enteteCarte : undefined}>
        <Svg width={COTE_ETOILE} height={COTE_ETOILE} viewBox={`0 0 ${COTE_ETOILE} ${COTE_ETOILE}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Polygon points={POINTS} fill="none" stroke={couleurs.or} strokeWidth={1.5} strokeLinejoin="round" />
        </Svg>
        {carte ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.titreCarte, { color: couleurs.orTexte, marginStart: espace.espace3 }]}>
            {t('aPropos.dedicaceTitre')}
          </Text>
        ) : null}
      </View>
      <Text
        maxFontSizeMultiplier={echelleMax.courant}
        style={[typographie.translitteration, { color: couleurs.encre2, textAlign: carte ? 'auto' : 'center' }]}>
        {`${t('aPropos.dedicaceDebut')} `}
        <Text style={nom}>{t('aPropos.dedicaceNom1')}</Text>
        {` ${t('aPropos.dedicaceLiaison')} `}
        <Text style={nom}>{t('aPropos.dedicaceNom2')}</Text>
        {`. ${t('aPropos.dedicaceFin')}`}
      </Text>
      {carte ? (
        <Text
          accessibilityLanguage="ar"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.corpsAr, { color: couleurs.encre2, writingDirection: 'rtl', alignSelf: 'flex-start' }]}>
          {t('aPropos.dedicaceInvocation')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  enteteCarte: { flexDirection: 'row', alignItems: 'center' },
  titreCarte: { textTransform: 'uppercase' },
});
