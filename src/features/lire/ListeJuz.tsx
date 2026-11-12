// Vue « Juz » de l'onglet Lire : un bloc par juz (médaillon, titre, nombre de versets), ses tronçons de sourate,
// puis une ligne de fin qui annonce le juz suivant. Un tronçon ouvre la sourate au verset de début.
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sourate } from './coran';
import { JUZ } from './decoupageJuz';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';
import { Medaillon } from '@/ui/Medaillon';

export function ListeJuz() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();

  return (
    <View style={{ gap: espace.espace4 }}>
      {JUZ.map((j, index) => {
        const versets = j.troncons.reduce((somme, tr) => somme + (tr.fin - tr.debut + 1), 0);
        const suivant = JUZ[index + 1];
        const debutSuivant = suivant?.troncons[0];
        return (
          <View
            key={j.numero}
            style={[styles.bloc, { borderColor: couleurs.ligne, borderRadius: rayon.rayonCarte, backgroundColor: couleurs.surface }]}>
            <View style={[styles.entete, { gap: espace.espace3, paddingHorizontal: espace.espace4, paddingVertical: espace.espace3, borderBottomColor: couleurs.ligne }]}>
              <Medaillon numero={j.numero} prefixe={t('lire.juzPrefixe')} taille={40} />
              <View style={styles.textes}>
                <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre3, { color: couleurs.encre }]}>
                  {t('lire.juz', { n: j.numero })}
                </Text>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                  {t('lire.versets', { count: versets })}
                </Text>
              </View>
            </View>
            {j.troncons.map((tr, i) => {
              const nom = sourate(tr.sourate)?.nom ?? '';
              const arabe = sourate(tr.sourate)?.arabe ?? '';
              const plage = t('lire.versetsPlage', { debut: tr.debut, fin: tr.fin });
              return (
                <Pressable
                  key={`${tr.sourate}-${tr.debut}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('lire.sourate')} ${tr.sourate}, ${nom}, ${plage}`}
                  android_ripple={{ color: couleurs.emeraudeDoux }}
                  onPress={() => router.push({ pathname: '/coran/[sourate]', params: { sourate: tr.sourate, verset: tr.debut } })}
                  style={({ pressed }) => [
                    styles.troncon,
                    {
                      gap: espace.espace4,
                      paddingHorizontal: espace.espace4,
                      paddingVertical: espace.espace3,
                      borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: couleurs.ligne,
                      backgroundColor: pressed ? couleurs.emeraudeDoux : 'transparent',
                    },
                  ]}>
                  <Medaillon numero={tr.sourate} prefixe={t('lire.sourate')} taille={34} />
                  <View style={styles.textes}>
                    <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
                      {nom}
                    </Text>
                    <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                      {plage}
                    </Text>
                  </View>
                  <Text accessibilityLanguage="ar" maxFontSizeMultiplier={echelleMax.courant} style={[styles.arabe, { color: couleurs.emeraude }]}>
                    {arabe}
                  </Text>
                  <Icon name="chevron-right" size={18} color={couleurs.encre3} />
                </Pressable>
              );
            })}
            {/* Fin du juz : annonce le suivant ; le 30e juz n'a pas de suite. */}
            <View style={[styles.fin, { gap: espace.espace3, paddingHorizontal: espace.espace4, paddingVertical: espace.espace3, borderTopColor: couleurs.ligne }]}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, styles.textes, { color: couleurs.encre3 }]}>
                {t('lire.finJuz', { n: j.numero })}
              </Text>
              {debutSuivant ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('lire.juzSuivant', { n: suivant.numero })}
                  onPress={() => router.push({ pathname: '/coran/[sourate]', params: { sourate: debutSuivant.sourate, verset: debutSuivant.debut } })}
                  style={({ pressed }) => [styles.suivant, { gap: espace.espace2, backgroundColor: pressed ? couleurs.emeraudeDoux : 'transparent' }]}>
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.emeraude }]}>
                    {t('lire.juzSuivant', { n: suivant.numero })}
                  </Text>
                  <Icon name="chevron-right" size={18} color={couleurs.emeraude} />
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  entete: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  troncon: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  fin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth },
  suivant: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  textes: { flex: 1 },
  arabe: { fontFamily: 'Amiri_400Regular', fontSize: 20, lineHeight: 32, writingDirection: 'rtl', includeFontPadding: false, textAlignVertical: 'center' },
});
