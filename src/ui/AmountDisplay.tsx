import { PixelRatio, StyleSheet, Text, View } from 'react-native';

import { useFormatMontant } from '@/features/budget/verrou';
import { type Devise } from '@/lib/montant';
import { useTheme } from '@/theme/useTheme';

import { interlignes, tailles } from '@/theme/tokens.generated';
export type AmountDisplayProps = {
  /** Montant entier, en plus petites unités de la devise. */
  montant: number;
  devise: Devise;
  libelle?: string;
  /** Une ligne sous le montant : « Il reste 137 500 F pour 27 jours ». */
  detail?: string;
  /** Ton du détail : un dépassement s'écrit en mots, la couleur ne fait que le confirmer. */
  tonDetail?: 'normal' | 'alerte' | 'erreur';
  /** Ton du montant : « revenu » l'écrit en émeraude (reste d'un cycle, argent reçu). */
  tonMontant?: 'normal' | 'revenu';
  /** Signe écrit devant le montant : « + » pour un revenu en cours de saisie. */
  signe?: '+' | '−';
  /** Sur un aplat émeraude (carte de la dépense du jour). */
  surEmeraude?: boolean;
  centre?: boolean;
};

/** Garde l'ordre « + 350 000 UM » dans une interface de droite à gauche (isolat gauche-droite). */
export const isoleLtr = (texte: string) => `\u2066${texte}\u2069`;

// Les chiffres géants ne suivent la taille de texte du téléphone que jusqu'à 1,3 (fiche AmountDisplay).
const ECHELLE_CHIFFRES = 1.3;

/** Un montant en grand, dans la devise du foyer. Une dépense reste à l'encre : dépenser n'est pas une faute. */
export function AmountDisplay({
  montant,
  devise,
  libelle,
  detail,
  tonDetail = 'normal',
  tonMontant = 'normal',
  signe,
  surEmeraude = false,
  centre = false,
}: AmountDisplayProps) {
  const { couleurs, typographie, nom } = useTheme();
  const formatMontant = useFormatMontant();
  const encre = surEmeraude ? couleurs.surEmeraude : couleurs.encre;
  const secondaire = surEmeraude ? couleurs.surEmeraude2 : couleurs.encre2;
  const couleurDetail =
    tonDetail === 'erreur' ? couleurs.erreur : tonDetail === 'alerte' ? couleurs.alerte : secondaire;
  // Hauteur réservée à la ligne du montant : elle ne change pas quand les chiffres se réduisent pendant la saisie,
  // donc la feuille du bas ne saute pas à chaque touche (ses 56 de hauteur tiennent aussi avec l'arabe).
  const hauteurLigne = Math.ceil((typographie.chiffre.lineHeight ?? 48) * Math.min(PixelRatio.getFontScale(), ECHELLE_CHIFFRES));
  const texte = `${signe ? `${signe} ` : ''}${formatMontant(montant, devise)}`;

  return (
    <View
      accessible
      accessibilityLabel={[libelle, texte, detail].filter(Boolean).join(', ')}
      style={centre ? styles.centre : null}>
      {libelle ? (
        <Text
          maxFontSizeMultiplier={ECHELLE_CHIFFRES}
          style={
            surEmeraude
              ? [typographie.legende, styles.libelleCarte, { color: nom === 'jour' ? couleurs.accentInverse : couleurs.surEmeraude2 }]
              : [typographie.libelle, { color: secondaire }]
          }>
          {surEmeraude ? libelle.toLocaleUpperCase() : libelle}
        </Text>
      ) : null}
      <Text
        maxFontSizeMultiplier={ECHELLE_CHIFFRES}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        numberOfLines={1}
        style={[typographie.chiffre, styles.montant, centre ? styles.montantCentre : null, { height: hauteurLigne },
          { color: tonMontant === 'revenu' && !surEmeraude ? couleurs.emeraude : encre }]}>
        {isoleLtr(texte)}
      </Text>
      {detail ? (
        <Text maxFontSizeMultiplier={ECHELLE_CHIFFRES} style={[typographie.corps, surEmeraude ? styles.detailCarte : null, { color: couleurDetail }]}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center' },
  // Largeur imposée : sans elle, le texte prend celle de son contenu et dépasse au lieu de rétrécir.
  montant: { alignSelf: 'stretch' },
  montantCentre: { textAlign: 'center' },
  // Planche Budget : libellé 12/16 gras en capitales espacées, détail 14/20.
  libelleCarte: { fontFamily: 'SourceSans3_600SemiBold', letterSpacing: 0.72 },
  detailCarte: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
