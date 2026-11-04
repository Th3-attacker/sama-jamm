import { StyleSheet, Text, View } from 'react-native';

import { formatMontant, type Devise } from '@/lib/montant';
import { useTheme } from '@/theme/useTheme';

export type AmountDisplayProps = {
  /** Montant entier, en plus petites unités de la devise. */
  montant: number;
  devise: Devise;
  libelle?: string;
  /** Une ligne sous le montant : « Il reste 137 500 F pour 27 jours ». */
  detail?: string;
  /** Ton du détail : un dépassement s'écrit en mots, la couleur ne fait que le confirmer. */
  tonDetail?: 'normal' | 'alerte' | 'erreur';
  /** Sur un aplat émeraude (carte de la dépense du jour). */
  surEmeraude?: boolean;
  centre?: boolean;
};

// Les chiffres géants ne suivent la taille de texte du téléphone que jusqu'à 1,3 (fiche AmountDisplay).
const ECHELLE_CHIFFRES = 1.3;

/** Un montant en grand, dans la devise du foyer. Une dépense reste à l'encre : dépenser n'est pas une faute. */
export function AmountDisplay({
  montant,
  devise,
  libelle,
  detail,
  tonDetail = 'normal',
  surEmeraude = false,
  centre = false,
}: AmountDisplayProps) {
  const { couleurs, typographie } = useTheme();
  const encre = surEmeraude ? couleurs.surEmeraude : couleurs.encre;
  const secondaire = surEmeraude ? couleurs.surEmeraude : couleurs.encre2;
  const couleurDetail =
    tonDetail === 'erreur' ? couleurs.erreur : tonDetail === 'alerte' ? couleurs.alerte : secondaire;
  const texte = formatMontant(montant, devise);

  return (
    <View
      accessible
      accessibilityLabel={[libelle, texte, detail].filter(Boolean).join(', ')}
      style={centre ? styles.centre : null}>
      {libelle ? (
        <Text maxFontSizeMultiplier={ECHELLE_CHIFFRES} style={[typographie.libelle, { color: secondaire }]}>
          {libelle}
        </Text>
      ) : null}
      <Text
        maxFontSizeMultiplier={ECHELLE_CHIFFRES}
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[typographie.chiffre, { color: encre }]}>
        {texte}
      </Text>
      {detail ? (
        <Text maxFontSizeMultiplier={ECHELLE_CHIFFRES} style={[typographie.corps, { color: couleurDetail }]}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center' },
});
