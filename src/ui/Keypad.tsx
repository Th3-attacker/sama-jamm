import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vibrerLeger } from '@/lib/haptique';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';

export type ToucheClavier = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '000' | 'efface';

export type KeypadProps = {
  onTouche: (touche: ToucheClavier) => void;
};

const TOUCHES: ToucheClavier[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'efface'];

/** Pavé numérique pour saisir un montant d'un pouce, sans le clavier du téléphone. Toujours sous un `AmountDisplay`. */
export function Keypad({ onTouche }: KeypadProps) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();

  return (
    <View accessibilityLabel={t('accessibilite.padNumerique')} style={[styles.grille, { gap: espace.espace2 }]}>
      {TOUCHES.map((touche) => {
        const efface = touche === 'efface';
        return (
          <Pressable
            key={touche}
            accessibilityRole="button"
            accessibilityLabel={efface ? t('accessibilite.effacerChiffre') : touche}
            android_ripple={{ color: couleurs.emeraudeDoux }}
            onPress={() => {
              vibrerLeger();
              onTouche(touche);
            }}
            style={({ pressed }) => [
              styles.touche,
              {
                borderRadius: rayon.rayonCarte,
                backgroundColor: efface ? 'transparent' : pressed ? couleurs.surfaceCreux : couleurs.surface,
              },
            ]}>
            {efface ? (
              <Icon name="backspace" size={24} color={couleurs.encre} />
            ) : (
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.titre3, styles.chiffre, { color: couleurs.encre }]}>
                {touche}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Applique une touche à une saisie en chiffres (« 2500 ») ; 12 chiffres au plus. */
export function appliquerTouche(saisie: string, touche: ToucheClavier): string {
  if (touche === 'efface') return saisie.slice(0, -1);
  const suite = (saisie === '0' ? '' : saisie) + touche;
  const propre = suite.replace(/^0+(?=\d)/, '');
  return propre.length > 12 ? saisie : propre;
}

const styles = StyleSheet.create({
  grille: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  touche: { width: '31%', height: 56, alignItems: 'center', justifyContent: 'center' },
  // Source Sans même en arabe : les touches de 31 % ne portent pas les chiffres plus larges de Noto Sans Arabic.
  chiffre: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 24, lineHeight: 32 },
});
