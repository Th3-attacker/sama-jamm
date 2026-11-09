import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { chapitresDeCategorie } from '@/features/invocations/categoriesHisn';
import { referenceDe } from '@/features/invocations/CarteInvocation';
import { invocationsDe } from '@/features/invocations/donnees';
import { chapitresHisn, titreDe } from '@/features/invocations/hisn';
import { estMoment, estMomentHisn, MOMENTS, MOMENTS_HISN, type MomentId } from '@/features/invocations/moments';
import { useParametre } from '@/hooks/useParametre';
import { cleJour } from '@/lib/dates';
import { useComptesDuJour } from '@/stores/invocationsJour';
import { useLecture } from '@/stores/lecture';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Medaillon } from '@/ui/Medaillon';
import { TopBar } from '@/ui/TopBar';

/** Un jour de lecture est compté après ce délai à l'écran, comme pour le Coran. */
const SECONDES_POUR_UN_JOUR = 30;

/** Un moment de la journée : sa phrase, ses puces, l'avancée du jour et la liste de ses invocations. */
export default function EcranMoment() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const brut = useParametre('categorie');
  const marquerJour = useLecture((s) => s.marquerJour);

  useEffect(() => {
    const minuteur = setTimeout(() => marquerJour(cleJour(new Date())), SECONDES_POUR_UN_JOUR * 1000);
    return () => clearTimeout(minuteur);
  }, [marquerJour]);

  if (!estMoment(brut)) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('lire.invocations')} />
        <View style={{ paddingHorizontal: espace.espace5 }}>
          <Banner ton="erreur" titre={t('etats.erreurTitre')}>
            {t('etats.erreurTexte')}
          </Banner>
        </View>
      </View>
    );
  }
  return <Moment categorie={brut} />;
}

function Moment({ categorie }: { categorie: MomentId }) {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const comptes = useComptesDuJour();
  // Un moment de versets suit l'avancée du jour ; un moment de la Citadelle liste ses chapitres, qui ont leur lecteur.
  const hisn = estMomentHisn(categorie);
  const liste = hisn ? [] : invocationsDe(categorie);
  const chapitres = hisn ? chapitresDeCategorie(MOMENTS_HISN[categorie], chapitresHisn()) : [];
  const fait = (id: string, repetitions: number) => (comptes[id] ?? 0) >= repetitions;
  const nbFaites = liste.filter((i) => fait(i.id, i.repetitions)).length;
  const detail = t('invocations.progressionJour', { n: nbFaites, total: liste.length });

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Planche : flèche et titre du moment en 30/36 émeraude, phrase en italique dessous. */}
      <TopBar
        retour
        gauche={
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, { color: couleurs.emeraude }]}>
            {t(`invocations.${categorie}`)}
          </Text>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace8, gap: espace.espace3 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, styles.phrase, { color: couleurs.encre2 }]}>
          {categorie === 'matin' ? t('invocations.sousTitreMatin') : t('invocations.sousTitre')}
        </Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('invocations.moments')} style={[styles.puces, { gap: espace.espace2 }]}>
          {MOMENTS.map((c) => (
            <Chip
              key={c}
              pilule
              selectionne={c === categorie}
              onPress={() => router.replace({ pathname: '/lire/invocations/[categorie]', params: { categorie: c } })}>
              {t(`invocations.${c}`)}
            </Chip>
          ))}
        </View>
        {hisn ? null : (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t(`invocations.${categorie}`)}
          accessibilityValue={{ min: 0, max: 100, now: liste.length ? Math.round((nbFaites / liste.length) * 100) : 0, text: detail }}
          style={{ gap: espace.espace2 }}>
          <View style={[styles.piste, { backgroundColor: couleurs.ligneForte }]}>
            <View style={{ width: `${liste.length ? (nbFaites / liste.length) * 100 : 0}%`, height: 8, backgroundColor: couleurs.or }} />
          </View>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.compte, { color: couleurs.encre2 }]}>
            {detail}
          </Text>
        </View>
        )}
        <View>
          {liste.map((inv, i) => {
            const termine = fait(inv.id, inv.repetitions);
            return (
              <Pressable
                key={inv.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/lire/invocations/[categorie]/[invocation]', params: { categorie, invocation: inv.id } })
                }
                style={[styles.ligne, { gap: espace.espace3, borderBottomColor: couleurs.ligne }]}>
                {termine ? (
                  <View style={[styles.coche, { backgroundColor: couleurs.emeraude }]}>
                    <Icon name="check" size={20} color={couleurs.surEmeraude} />
                  </View>
                ) : (
                  <Medaillon numero={i + 1} prefixe={t('lire.invocations')} taille={40} />
                )}
                <View style={styles.textes}>
                  <Text numberOfLines={2} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.titreLigne, { color: couleurs.encre }]}>
                    {referenceDe(inv)}
                  </Text>
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.compte, { color: couleurs.encre3 }]}>
                    {t('invocations.sourceCoranCourt')}
                  </Text>
                </View>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.compte, { color: couleurs.encre2 }]}>
                  {t('invocations.fois', { count: inv.repetitions })}
                </Text>
              </Pressable>
            );
          })}
          {chapitres.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/lire/hisn/[chapitre]', params: { chapitre: String(c.id) } })}
              style={[styles.ligne, { gap: espace.espace3, borderBottomColor: couleurs.ligne }]}>
              <Medaillon numero={c.id} prefixe={t('invocations.chapitre')} taille={40} />
              <View style={styles.textes}>
                <Text numberOfLines={2} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.titreLigne, { color: couleurs.encre }]}>
                  {titreDe(c, i18n.language)}
                </Text>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.compte, { color: couleurs.encre3 }]}>
                  {t('invocations.hisn')}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={couleurs.encre3} />
            </Pressable>
          ))}
        </View>
        {hisn ? <Banner ton="info">{t('invocations.noteHisn')}</Banner> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  phrase: { fontSize: 16, lineHeight: 24 },
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
  piste: { height: 8, borderRadius: 999, overflow: 'hidden' },
  compte: { fontSize: 14, lineHeight: 20, fontVariant: ['tabular-nums'] },
  ligne: { flexDirection: 'row', alignItems: 'center', minHeight: 72, borderBottomWidth: 1 },
  coche: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  textes: { flex: 1, minWidth: 0 },
  titreLigne: { fontSize: 16, lineHeight: 24 },
});
