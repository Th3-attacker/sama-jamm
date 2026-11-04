import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { calculerHoraires, prochainePriere } from '@/features/priere/horaires';
import { useOptionsCalcul } from '@/features/priere/useOptionsCalcul';
import { BandeauVeille } from '@/features/priere/veille';
import { useMaintenant } from '@/hooks/useMaintenant';
import { sourate } from '@/features/lire/coran';
import { cleJour, formatDuree, formatHegirien, formatHeure, formatJour, formatMois, minutesDuJour } from '@/lib/dates';
import { useLecture } from '@/stores/lecture';
import { prieres, useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BeadThread, type JourFil } from '@/ui/BeadThread';
import { Button } from '@/ui/Button';
import { DayArc, type PriereArc } from '@/ui/DayArc';
import { Icon } from '@/ui/Icon';
import { TopBar } from '@/ui/TopBar';

/** Un grain par jour du mois ; `lus` : clés de jour « 2026-10-29 » où une lecture a eu lieu. */
function joursDuMois(maintenant: Date, lus: readonly string[]): JourFil[] {
  const total = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0).getDate();
  return Array.from({ length: total }, (_, i) => {
    const jour = new Date(maintenant.getFullYear(), maintenant.getMonth(), i + 1);
    return { fait: lus.includes(cleJour(jour)), aujourdhui: i + 1 === maintenant.getDate() };
  });
}

export default function Accueil() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie, latin } = useTheme();
  const maintenant = useMaintenant();
  const lieu = useReglages((s) => s.lieu);
  const options = useOptionsCalcul();
  const position = useLecture((s) => s.position);
  const joursLus = useLecture((s) => s.jours);

  const arc = useMemo(() => {
    if (!lieu) return null;
    const h = calculerHoraires(lieu, maintenant, options);
    const suivante = prochainePriere(lieu, maintenant, options);
    const liste: PriereArc[] = prieres.map((p) => ({
      nom: t(`priere.noms.${p}`),
      heure: formatHeure(h[p]),
      minutes: minutesDuJour(h[p]),
      etat: h[p] <= maintenant ? 'passee' : p === suivante.nom ? 'prochaine' : 'a-venir',
    }));
    return {
      liste,
      lever: minutesDuJour(h.lever),
      coucher: minutesDuJour(h.coucher),
      dans: formatDuree((suivante.heure.getTime() - maintenant.getTime()) / 60_000),
      nom: t(`priere.noms.${suivante.nom}`),
      heure: formatHeure(suivante.heure),
    };
  }, [lieu, maintenant, options, t]);

  const fil = useMemo(() => joursDuMois(maintenant, joursLus), [maintenant, joursLus]);
  const nbJours = fil.filter((j) => j.fait).length;
  // Reprise : la sourate où la lecture s'est arrêtée, avec sa progression.
  const reprise = position ? sourate(position.sourate) : undefined;

  const jour = formatJour(maintenant, i18n.language);
  const hegirien = formatHegirien(maintenant, i18n.language);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        actions={[
          { icone: 'search', label: t('menuPlus.rechercher') },
          { icone: 'settings', label: t('menuPlus.reglages'), onPress: () => router.push('/plus/reglages') },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace6,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <BandeauVeille />
        <View>
          <Text
            accessibilityRole="header"
            accessibilityLanguage="wo"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[latin.titre1, { color: couleurs.emeraude, writingDirection: 'ltr' }]}>
            {t('formules.saluer')}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.translitteration, { color: couleurs.encre2 }]}>
            {t('formules.saluerTrad')}
          </Text>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
            {hegirien ? t('accueil.date', { jour, hegirien }) : jour}
          </Text>
        </View>

        {arc ? (
          <DayArc
            lever={arc.lever}
            coucher={arc.coucher}
            maintenant={minutesDuJour(maintenant)}
            prieres={arc.liste}
            dans={arc.dans}
            avant={t('accueil.avant', { priere: arc.nom })}
            a={t('accueil.a', { heure: arc.heure })}
            description={t('accessibilite.arcDuJour')}
          />
        ) : (
          <Banner ton="info" action={{ label: t('bienvenue.positionVille'), onPress: () => router.push('/position') }}>
            {t('priere.positionRefuseeTexte')}
          </Banner>
        )}

        {/* Sans lecture enregistrée (premier jour) : invitation à ouvrir Al-Fâtiha. */}
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            position && reprise
              ? router.push({
                  pathname: '/lire/coran/[sourate]',
                  params: { sourate: reprise.n, verset: position.verset, mode: position.mode },
                })
              : router.push({ pathname: '/lire/coran/[sourate]', params: { sourate: 1 } })
          }
          style={({ pressed }) => [
            styles.carte,
            {
              gap: espace.espace3,
              padding: espace.espace4,
              borderRadius: rayon.rayonCarte,
              backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.surface,
              borderColor: couleurs.ligne,
            },
          ]}>
          <View style={[styles.lecture, { backgroundColor: couleurs.emeraude, borderRadius: rayon.rayonPastille }]}>
            <Icon name="play" size={18} color={couleurs.surEmeraude} />
          </View>
          <View style={styles.texteCarte}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre3, { color: couleurs.encre }]}>
              {reprise && position ? t('accueil.reprendre', { titre: reprise.nom }) : t('accueil.premierJour')}
            </Text>
            {reprise && position ? (
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.legende, { color: couleurs.encre3 }]}>
                {t('accueil.versetSur', { n: position.verset, total: reprise.versets })}
              </Text>
            ) : null}
          </View>
          <Icon name="chevron-right" size={18} color={couleurs.encre3} />
        </Pressable>

        <BeadThread
          titre={t('accueil.fil')}
          jours={fil}
          // Ce qui a été fait, jamais ce qui manque : pas de résumé tant qu'aucun jour n'est lu.
          resume={
            nbJours > 0
              ? t('accueil.filResume', { count: nbJours, mois: formatMois(maintenant, i18n.language) })
              : undefined
          }
        />

        {__DEV__ ? (
          <Button variant="discret" onPress={() => router.push('/dev/composants')}>
            Galerie des composants
          </Button>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  carte: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  lecture: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  texteCarte: { flex: 1 },
});
