import { memo } from 'react';
import { Text, type TextStyle } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { segmentsTranslit } from './reperes';

/**
 * Translittération de Tanzil telle quelle : voyelles longues et lettres emphatiques soulignées,
 * lettres écrites mais non prononcées atténuées (comme sur tanzil.net).
 */
export const TranslitVerset = memo(function TranslitVerset({ texte, taille }: { texte: string; taille?: TextStyle }) {
  const { couleurs, typographie } = useTheme();
  return (
    <Text
      accessibilityLanguage="en"
      maxFontSizeMultiplier={echelleMax.grand}
      style={[typographie.translitteration, taille, { color: couleurs.encre2 }]}>
      {segmentsTranslit(texte).map((s, i) =>
        s.style === 'normal' ? (
          s.texte
        ) : (
          <Text key={i} style={s.style === 'long' ? { textDecorationLine: 'underline' } : { color: couleurs.encre3 }}>
            {s.texte}
          </Text>
        ),
      )}
    </Text>
  );
});
