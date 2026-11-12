import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { categories, estCategorie, invocationsDe, type CategorieId } from '@/features/invocations/donnees';
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

import { interlignes, rayon, tailles } from '@/theme/tokens.generated';
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

  if (!estCategorie(brut)) {
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

function Moment({ categorie }: { categorie: CategorieId }) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie, ligne } = useTheme();
  const comptes = useComptesDuJour();
  const liste = invocationsDe(categorie);
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
            {t(`invocations.categories.${categorie}`)}
          </Text>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace8, gap: espace.espace3 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, ligne(styles.phrase), { color: couleurs.encre2 }]}>
          {t('invocations.sousTitre')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="radiogroup"
          accessibilityLabel={t('invocations.moments')}
          contentContainerStyle={{ gap: espace.espace2 }}>
          {categories().map((c) => (
            <Chip
              key={c.id}
              pilule
              selectionne={c.id === categorie}
              onPress={() => {
                // Catégorie déjà affichée : on ne recharge pas la même route.
                if (c.id !== categorie) router.replace({ pathname: '/lire/invocations/[categorie]', params: { categorie: c.id } });
              }}>
              {t(`invocations.categories.${c.id}`)}
            </Chip>
          ))}
        </ScrollView>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t(`invocations.categories.${categorie}`)}
          accessibilityValue={{ min: 0, max: 100, now: liste.length ? Math.round((nbFaites / liste.length) * 100) : 0, text: detail }}
          style={{ gap: espace.espace2 }}>
          <View style={[styles.piste, { backgroundColor: couleurs.ligneForte }]}>
            <View style={{ width: `${liste.length ? (nbFaites / liste.length) * 100 : 0}%`, height: 8, backgroundColor: couleurs.or }} />
          </View>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.compte), { color: couleurs.encre2 }]}>
            {detail}
          </Text>
        </View>
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
                  <View style={[styles.coche, { backgroundColor: couleurs.emeraudeAplat }]}>
                    <Icon name="check" size={20} color={couleurs.surEmeraude} />
                  </View>
                ) : (
                  <Medaillon numero={i + 1} prefixe={t('lire.invocations')} taille={40} />
                )}
                <View style={styles.textes}>
                  <Text numberOfLines={2} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.titreLigne), { color: couleurs.encre }]}>
                    {inv.titre}
                  </Text>
                  <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.compte), { color: couleurs.encre3 }]}>
                    {inv.source}
                  </Text>
                </View>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.compte), { color: couleurs.encre2 }]}>
                  {t('invocations.fois', { count: inv.repetitions })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  phrase: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  piste: { height: 8, borderRadius: rayon.rayonPastille, overflow: 'hidden' },
  compte: { fontSize: tailles.t14, lineHeight: interlignes.l20, fontVariant: ['tabular-nums'] },
  ligne: { flexDirection: 'row', alignItems: 'center', minHeight: 72, borderBottomWidth: 1 },
  coche: { width: 40, height: 40, borderRadius: rayon.rayonPastille, alignItems: 'center', justifyContent: 'center' },
  textes: { flex: 1, minWidth: 0 },
  titreLigne: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
});
