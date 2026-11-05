import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';

export type CarteWalletProps = {
  nom: string;
  pays: string;
  numero: string;
  titulaire: string;
  choisi: boolean;
  onChoisir: () => void;
  onCopier: () => void;
};

/** Un wallet où envoyer le don : se choisit d'un geste ; le wallet choisi montre son numéro à copier. */
export function CarteWallet({ nom, pays, numero, titulaire, choisi, onChoisir, onCopier }: CarteWalletProps) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: choisi }}
      accessibilityLabel={`${nom}, ${pays}`}
      onPress={onChoisir}
      style={[
        styles.carte,
        {
          gap: espace.espace2,
          padding: espace.espace4,
          borderRadius: rayon.rayonCarte,
          backgroundColor: choisi ? couleurs.emeraudeDoux : couleurs.surface,
          borderColor: choisi ? couleurs.emeraude : couleurs.ligne,
        },
      ]}>
      <View style={[styles.rangee, { gap: espace.espace3 }]}>
        <View
          style={[
            styles.pastille,
            { borderRadius: rayon.rayonPastille, backgroundColor: choisi ? couleurs.surface : couleurs.surfaceCreux },
          ]}>
          <Icon name="wallet" size={20} color={choisi ? couleurs.emeraude : couleurs.encre2} />
        </View>
        <View style={styles.textes}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre3, { color: couleurs.encre }]}>
            {nom}
          </Text>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
            {pays}
          </Text>
        </View>
        {choisi ? <Icon name="check" size={20} color={couleurs.emeraude} /> : null}
      </View>
      {choisi ? (
        <View style={[styles.rangee, { gap: espace.espace2 }]}>
          <View style={styles.textes}>
            <Text
              selectable
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.titre3, styles.numero, { color: couleurs.encre }]}>
              {numero.replace(/(\d{2})(?=\d)/g, '$1 ')}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
              {t('dons.auNomDe', { titulaire })}
            </Text>
          </View>
          <IconButton icone="copy" label={t('dons.copierNumero')} couleur={couleurs.emeraude} onPress={onCopier} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { borderWidth: 1 },
  rangee: { flexDirection: 'row', alignItems: 'center' },
  pastille: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  textes: { flex: 1 },
  numero: { fontVariant: ['tabular-nums'] },
});
