import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { pageDe, type Sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';
import { Medaillon } from '@/ui/Medaillon';

import { espace, interlignes, tailles } from '@/theme/tokens.generated';
type Props = {
  sourate: Sourate;
  onPress: () => void;
  /** Ligne à plat de la bibliothèque (planche) : filet en bas, sans carte ni chevron, sans « Page N ». */
  plat?: boolean;
  /** Sourate où la lecture a été reprise : « en cours » remplace le lieu de révélation. */
  enCours?: boolean;
  /** Numéro du juz qui commence dans cette sourate (vue Sourates) : repère « Juz N ». */
  juzDebut?: number;
};

/** Carte d'une sourate dans la liste : médaillon, nom arabe, page, lieu de révélation, nombre de versets. */
export function CarteSourate({ sourate, onPress, plat = false, enCours = false, juzDebut }: Props) {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  // Planche « Lire en arabe » : le nom arabe devient le titre de la ligne (Amiri gras), sans doublon à l'autre bout.
  const titreArabe = plat && i18n.language === 'ar';
  const page = pageDe(sourate.n, 1);
  const lieu = t(enCours ? 'lire.enCours' : sourate.mecquoise ? 'lire.mecquoise' : 'lire.medinoise');
  const meta = plat
    ? [t('lire.versets', { count: sourate.versets }), lieu, juzDebut ? t('lire.juz', { n: juzDebut }) : null].filter(Boolean).join(' · ')
    : [page ? `${t('lire.modePage')} ${page}` : null, lieu, t('lire.versets', { count: sourate.versets })]
        .filter(Boolean)
        .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('lire.sourate')} ${sourate.n}, ${sourate.nom}`}
      accessibilityHint={meta}
      android_ripple={{ color: couleurs.emeraudeDoux }}
      onPress={onPress}
      style={({ pressed }) =>
        plat
          ? [
              styles.ligne,
              {
                gap: espace.espace4,
                borderBottomColor: couleurs.ligne,
                backgroundColor: pressed ? couleurs.emeraudeDoux : 'transparent',
              },
            ]
          : [
        styles.carte,
        {
          gap: espace.espace3,
          paddingHorizontal: espace.espace4,
          paddingVertical: espace.espace3,
          borderRadius: rayon.rayonCarte,
          borderColor: couleurs.ligne,
          backgroundColor: pressed ? couleurs.emeraudeDoux : couleurs.surface,
        },
      ]}>
      <Medaillon numero={sourate.n} prefixe={t('lire.sourate')} taille={plat ? 34 : undefined} />
      <View style={styles.textes}>
        {titreArabe ? (
          <Text accessibilityLanguage="ar" maxFontSizeMultiplier={echelleMax.courant} style={[ligne(styles.titreArabe), { color: couleurs.encre }]}>
            {sourate.arabe}
          </Text>
        ) : (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[plat ? typographie.titre3 : typographie.corps, plat ? ligne(styles.nomPlat) : null, { color: couleurs.encre }]}>
            {sourate.nom}
          </Text>
        )}
        <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[plat ? typographie.corps : typographie.legende, plat ? ligne(styles.metaPlat) : null, { color: couleurs.encre3 }]}>
          {meta}
        </Text>
      </View>
      {titreArabe ? null : (
        <Text accessibilityLanguage="ar" maxFontSizeMultiplier={echelleMax.courant} style={[ligne(styles.arabe), plat ? styles.arabePlat : null, { color: couleurs.emeraude }]}>
          {sourate.arabe}
        </Text>
      )}
      {plat && !titreArabe ? null : <Icon name="chevron-right" size={18} color={couleurs.encre3} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { flexDirection: 'row', alignItems: 'center', minHeight: 64, borderWidth: StyleSheet.hairlineWidth },
  // Planche : ligne de 56, padding vertical 4, filet de 1 en bas.
  ligne: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingVertical: espace.espace1, borderBottomWidth: 1 },
  nomPlat: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  metaPlat: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  arabePlat: { lineHeight: interlignes.l30 },
  titreArabe: { fontFamily: 'Amiri_700Bold', fontSize: tailles.t24, lineHeight: interlignes.l30, writingDirection: 'rtl', includeFontPadding: false, textAlignVertical: 'center' },
  textes: { flex: 1 },
  arabe: { fontFamily: 'Amiri_400Regular', fontSize: tailles.t24, lineHeight: interlignes.l40, writingDirection: 'rtl', textAlign: 'right', includeFontPadding: false, textAlignVertical: 'center' },
});
