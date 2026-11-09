import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cleJour, formatMoisAnnee } from '@/lib/dates';
import type { Devise } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { ProgressBar } from '@/ui/ProgressBar';

import type { Objectif } from './depot';
import { progressionObjectif, projectionObjectif } from './epargne';
import { useFormatMontant } from './verrou';

/** Rythme d'un objectif en une ligne : « 25 000 F par paie · prêt en février 2027 à ce rythme ». */
export function useRythmeObjectif(): (o: Objectif, devise: Devise) => string {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  return (o, devise) => {
    if (o.utilise) return t('epargne.statutUtilise');
    const f = (m: number) => formatMontant(m, devise);
    const p = projectionObjectif(o, cleJour(new Date()));
    if (p.type === 'atteint') return t('epargne.atteint');
    if (p.type === 'sansRythme') return t('epargne.sansRythme');
    if (p.type === 'rythme') {
      return t('epargne.pretEn', {
        montant: f(o.versementMensuel ?? 0),
        mois: formatMoisAnnee(p.mois, i18n.language),
      });
    }
    return o.versementMensuel ? t('epargne.parPaie', { montant: f(o.versementMensuel) }) : t('epargne.versementLibre');
  };
}

/** Carte d'un objectif : nom, montant atteint, intention, barre dorée et rythme. */
export function CarteObjectif({ objectif: o, devise }: { objectif: Objectif; devise: Devise }) {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const rythmeDe = useRythmeObjectif();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const f = (m: number) => formatMontant(m, devise);
  const part = progressionObjectif(o.verse, o.cible);
  const montants =
    o.cible !== null
      ? t('epargne.progression', { verse: f(o.verse), cible: f(o.cible) })
      : t('epargne.sansCible', { verse: f(o.verse) });
  const rythme = rythmeDe(o, devise);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${o.nom}, ${montants}, ${rythme}`}
      onPress={() => router.push({ pathname: '/budget/epargne/[id]', params: { id: o.id } })}
      style={({ pressed }) => [
        styles.carte,
        {
          padding: espace.espace4,
          gap: espace.espace2,
          borderRadius: rayon.rayonCarte,
          backgroundColor: couleurs.surface,
          borderColor: couleurs.ligne,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={[styles.ligne, { gap: espace.espace2 }]}>
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          numberOfLines={1}
          style={[typographie.corps, styles.nom, { fontFamily: typographie.libelle.fontFamily, color: couleurs.encre }]}>
          {o.nom}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.petit, { color: couleurs.encre3 }]}>
          {montants}
        </Text>
      </View>
      {o.intention ? (
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.translitteration, styles.petit, { color: couleurs.encre2 }]}>
          {t('epargne.intentionLigne', { texte: o.intention })}
        </Text>
      ) : null}
      {/* La barre écrit sa valeur dessous : ici, le rythme (le montant atteint est déjà en haut). */}
      {part !== null && !o.utilise ? (
        <ProgressBar valeur={part} label={o.nom} detail={rythme} ton="or" fine />
      ) : (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.petit, { color: couleurs.encre2 }]}>
          {rythme}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { borderWidth: 1 },
  ligne: { flexDirection: 'row', alignItems: 'baseline' },
  nom: { flex: 1 },
  petit: { fontSize: 14, lineHeight: 20 },
});
