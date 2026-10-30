import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { calculerHoraires, prochainePriere } from '@/features/priere/horaires';
import { useOptionsCalcul } from '@/features/priere/useOptionsCalcul';
import { BandeauVeille } from '@/features/priere/veille';
import { useMaintenant } from '@/hooks/useMaintenant';
import { formatDuree, formatHegirien, formatHeure, formatJour, minutesDuJour } from '@/lib/dates';
import { prieres, useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BeadThread, type JourFil } from '@/ui/BeadThread';
import { Button } from '@/ui/Button';
import { DayArc, type PriereArc } from '@/ui/DayArc';
import { Icon } from '@/ui/Icon';
import { TopBar } from '@/ui/TopBar';

function joursDuMois(maintenant: Date): JourFil[] {
  const total = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0).getDate();
  // Jours de lecture : enregistrés par le lecteur (étape Lire). Aucun pour l'instant.
  return Array.from({ length: total }, (_, i) => ({ fait: false, aujourdhui: i + 1 === maintenant.getDate() }));
}

export default function Accueil() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const maintenant = useMaintenant();
  const lieu = useReglages((s) => s.lieu);
  const options = useOptionsCalcul();

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

  const jour = formatJour(maintenant, i18n.language);
  const hegirien = formatHegirien(maintenant, i18n.language);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        actions={[
          { icone: 'search', label: t('menuPlus.rechercher') },
          { icone: 'more', label: t('menuPlus.titre') },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace8, gap: espace.espace5 }}>
        <BandeauVeille />
        <View>
          <Text accessibilityRole="header" accessibilityLanguage="wo" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre1, { color: couleurs.emeraude }]}>
            {t('formules.saluer')}
          </Text>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, { color: couleurs.encre2 }]}>
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

        {/* Premier jour : pas encore de lecture à reprendre. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/lire')}
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
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre3, styles.texteCarte, { color: couleurs.encre }]}>
            {t('accueil.premierJour')}
          </Text>
          <Icon name="chevron-right" size={18} color={couleurs.encre3} />
        </Pressable>

        <BeadThread titre={t('accueil.fil')} jours={joursDuMois(maintenant)} />

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
