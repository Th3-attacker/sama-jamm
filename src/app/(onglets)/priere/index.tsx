import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChoixVille } from '@/features/priere/ChoixVille';
import { calculerHoraires, prochainePriere, useOptionsCalcul } from '@/features/priere/horaires';
import { BandeauVeille } from '@/features/priere/veille';
import { useMaintenant } from '@/hooks/useMaintenant';
import { formatDuree, formatHeure, formatJour, minutesDuJour } from '@/lib/dates';
import { prieres, useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { DayArc } from '@/ui/DayArc';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { PrayerTimes, type LignePriere } from '@/ui/PrayerTimes';
import { TopBar } from '@/ui/TopBar';

const JOURS_SEMAINE = 7;

export default function Priere() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const maintenant = useMaintenant();
  const options = useOptionsCalcul();
  const lieu = useReglages((s) => s.lieu);
  const rappels = useReglages((s) => s.rappels);
  const definirRappel = useReglages((s) => s.definirRappel);
  const definirLieu = useReglages((s) => s.definirLieu);
  const methode = useReglages((s) => s.methode);
  const tAr = i18n.getFixedT('ar');

  const donnees = useMemo(() => {
    if (!lieu) return null;
    const h = calculerHoraires(lieu, maintenant, options);
    const suivante = prochainePriere(lieu, maintenant, options);
    const dans = formatDuree((suivante.heure.getTime() - maintenant.getTime()) / 60_000);
    const semaine = Array.from({ length: JOURS_SEMAINE - 1 }, (_, i) => {
      const jour = new Date(maintenant);
      jour.setDate(jour.getDate() + i + 1);
      return { jour, horaires: calculerHoraires(lieu, jour, options) };
    });
    return { h, suivante, dans, semaine };
  }, [lieu, maintenant, options]);

  const nomLieu = lieu ? (lieu.type === 'ville' ? lieu.nom : t('priere.maPosition')) : null;

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        grand
        titre={t('priere.titre')}
        sousTitre={t('priere.sousTitre')}
        actions={[{ icone: 'bell', label: t('priere.rappelsTitre'), onPress: () => router.push('/priere/rappels') }]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8, gap: espace.espace4 }}>
        <BandeauVeille />

        {!lieu || !donnees ? (
          <>
            <Banner ton="erreur" titre={t('priere.positionRefusee')}>
              {t('priere.positionRefuseeTexte')}
            </Banner>
            <ChoixVille onChoisir={(v) => definirLieu({ type: 'ville', id: v.id, nom: v.nom, latitude: v.lat, longitude: v.lon })} />
          </>
        ) : (
          <>
            {/* Jamais d'heures sans le lieu de calcul. */}
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
              {`${nomLieu} · ${formatJour(maintenant, i18n.language)}`}
            </Text>
            <DayArc
              lever={minutesDuJour(donnees.h.lever)}
              coucher={minutesDuJour(donnees.h.coucher)}
              maintenant={minutesDuJour(maintenant)}
              prieres={prieres.map((p) => ({
                nom: t(`priere.noms.${p}`),
                heure: formatHeure(donnees.h[p]),
                minutes: minutesDuJour(donnees.h[p]),
                etat: donnees.h[p] <= maintenant ? 'passee' : p === donnees.suivante.nom ? 'prochaine' : 'a-venir',
              }))}
              dans={donnees.dans}
              avant={t('accueil.avant', { priere: t(`priere.noms.${donnees.suivante.nom}`) })}
              a={t('accueil.a', { heure: formatHeure(donnees.suivante.heure) })}
              description={t('accessibilite.arcDuJour')}
            />
            <PrayerTimes
              prieres={prieres.map<LignePriere>((p) => {
                const prochaine = p === donnees.suivante.nom && donnees.h[p] > maintenant;
                return {
                  id: p,
                  nom: t(`priere.noms.${p}`),
                  nomLocal: t(`priere.nomsLocaux.${p}`),
                  nomArabe: tAr(`priere.noms.${p}`),
                  heure: formatHeure(donnees.h[p]),
                  etat: donnees.h[p] <= maintenant ? 'passee' : prochaine ? 'prochaine' : 'a-venir',
                  dans: prochaine ? t('commun.dans', { duree: donnees.dans }) : undefined,
                  appelActif: rappels[p],
                  libelleAppel: t('priere.notificationDe', { priere: t(`priere.noms.${p}`) }),
                };
              })}
              onBasculerAppel={(id) => {
                const p = prieres.find((x) => x === id);
                if (p) definirRappel(p, !rappels[p]);
              }}
            />
            <ListGroup>
              <ListItem
                icone="settings"
                titre={t('priere.methodeTitre')}
                sousTitre={t(`priere.methodes.${methode}`)}
                onPress={() => router.push('/priere/methode')}
              />
            </ListGroup>
            <ListGroup titre={t('priere.semaine')}>
              {donnees.semaine.map(({ jour, horaires }) => (
                <ListItem
                  key={jour.toDateString()}
                  titre={formatJour(jour, i18n.language)}
                  sousTitre={prieres.map((p) => formatHeure(horaires[p])).join(' · ')}
                />
              ))}
            </ListGroup>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
