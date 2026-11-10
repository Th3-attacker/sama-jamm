import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFormatMontant } from '@/features/budget/verrou';
import { etatEnveloppe } from '@/features/budget/cycle';
import { type Devise } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type EnvelopeProps = {
  nom: string;
  depense: number;
  plafond: number;
  fixe: boolean;
  devise: Devise;
  onPress?: () => void;
};

/**
 * Une enveloppe du budget : ce qui est dépensé sur son plafond, et son état en mots.
 * Doux : « Bientôt atteint » en alerte à 85 %, « Dépassé de … » en erreur au-delà ; jamais de reproche.
 */
export function Envelope({ nom, depense, plafond, fixe, devise, onPress }: EnvelopeProps) {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie } = useTheme();
  const etat = etatEnveloppe(depense, plafond, fixe);
  const f = (m: number) => formatMontant(m, devise);
  const mot =
    etat === 'depasse'
      ? t('budget.depasse', { montant: f(depense - plafond) })
      : etat === 'reglee'
        ? t('budget.regle')
        : etat === 'presque-plein'
          ? `${t('budget.presquePlein')} · ${t('budget.reste', { montant: f(plafond - depense) })}`
          : t('budget.reste', { montant: f(plafond - depense) });
  const couleurMot = etat === 'depasse' ? couleurs.erreur : couleurs.alerte;
  // Planche : plein ou au-delà en encre2, à partir de 85 % en alerte, sinon émeraude.
  const couleurBarre =
    plafond > 0 && depense >= plafond
      ? couleurs.encre2
      : etat === 'presque-plein' || etat === 'depasse'
        ? couleurs.alerte
        : couleurs.emeraudeAplat;
  // Le mot ne s'ajoute que si l'enveloppe demande attention ; il reste toujours dans le label d'accessibilité.
  const montrerMot = etat === 'depasse' || etat === 'presque-plein';
  const ratio = plafond > 0 ? Math.min(depense / plafond, 1) : depense > 0 ? 1 : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nom}, ${f(depense)} ${t('budget.sur', { montant: f(plafond) })}, ${mot}`}
      disabled={!onPress}
      onPress={onPress}
      android_ripple={{ color: couleurs.emeraudeDoux }}
      style={({ pressed }) => [
        styles.ligne,
        {
          gap: espace.espace2,
          paddingVertical: espace.espace3,
          opacity: pressed ? 0.85 : 1,
          borderBottomColor: couleurs.ligne,
        },
      ]}>
      <View style={[styles.tete, { gap: espace.espace3 }]}>
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.corps, styles.nom, { fontFamily: typographie.libelle.fontFamily, color: couleurs.encre }]}>
          {nom}
        </Text>
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          numberOfLines={1}
          style={[typographie.corps, { color: couleurs.encre2, fontVariant: ['tabular-nums'] }]}>
          {`${f(depense)} / ${f(plafond)}`}
        </Text>
      </View>
      {/* Barre décorative : le sens est porté par le libellé de la ligne et le mot ci-dessous. */}
      <View style={[styles.piste, { backgroundColor: couleurs.surfaceCreux }]}>
        <View style={[styles.piste, { width: `${ratio * 100}%`, backgroundColor: couleurBarre }]} />
      </View>
      {montrerMot ? (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurMot }]}>
          {mot}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: { borderBottomWidth: StyleSheet.hairlineWidth },
  tete: { flexDirection: 'row', alignItems: 'baseline' },
  nom: { flex: 1 },
  piste: { height: 4, borderRadius: 999, overflow: 'hidden' },
});
