import { router, useScrollToTop } from 'expo-router';
import { ComponentRef, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChoixVille } from '@/features/priere/ChoixVille';
import { calculerHoraires, prochainePriere } from '@/features/priere/horaires';
import { useOptionsCalcul } from '@/features/priere/useOptionsCalcul';
import { BandeauVeille } from '@/features/priere/veille';
import { useMaintenant } from '@/hooks/useMaintenant';
import { formatDuree, formatHeure, formatJour, minutesDuJour } from '@/lib/dates';
import { prieres, useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useLayout } from '@/theme/useLayout';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { DayArc } from '@/ui/DayArc';
import { Icon } from '@/ui/Icon';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { PrayerTimes, type LignePriere } from '@/ui/PrayerTimes';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

const JOURS_SEMAINE = 7;

export default function Priere() {
  // Toucher l'onglet actif ramène la liste en haut.
  const defilement = useRef<ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(defilement);
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const marge = useMargeBasse();
  const { styleColonne: colonne } = useLayout();
  const maintenant = useMaintenant();
  const options = useOptionsCalcul();
  const lieu = useReglages((s) => s.lieu);
  const rappels = useReglages((s) => s.rappels);
  const definirRappel = useReglages((s) => s.definirRappel);
  const definirLieu = useReglages((s) => s.definirLieu);
  const methode = useReglages((s) => s.methode);
  const veilleAuto = useReglages((s) => s.veilleAuto);
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
      {/* Planche : « Prière » en 40/44 à gauche, cloche à droite. */}
      <TopBar
        gauche={
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.display, { color: couleurs.emeraude }]}>
            {t('priere.titre')}
          </Text>
        }
        actions={[{ icone: 'bell', label: t('priere.rappelsTitre'), onPress: () => router.push('/priere/rappels') }]}
      />
      <ScrollView ref={defilement} contentContainerStyle={{ ...colonne, paddingBottom: espace.espace8 + marge, gap: espace.espace4 }}>
        <BandeauVeille />

        {!lieu || !donnees ? (
          <>
            <Banner ton="erreur" titre={t('priere.positionRefusee')}>
              {t('priere.positionRefuseeTexte')}
            </Banner>
            <ChoixVille apresRefus onChoisir={(v) => definirLieu({ type: 'ville', id: v.id, nom: v.nom, latitude: v.lat, longitude: v.lon })} />
          </>
        ) : (
          <>
            {/* Jamais d'heures sans le lieu de calcul. */}
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.lieu, { color: couleurs.encre2 }]}>
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
              simple
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
                  note: p === 'isha' && veilleAuto ? t('priere.veilleEnsuite') : undefined,
                };
              })}
              onBasculerAppel={(id) => {
                const p = prieres.find((x) => x === id);
                if (p) definirRappel(p, !rappels[p]);
              }}
            />
            {/* Planche : deux tuiles, Qibla et Dhikr. */}
            <View style={[styles.tuiles, { gap: espace.espace3 }]}>
              {([
                { cle: 'qibla', icone: 'compass', titre: t('qibla.titre'), sous: t('qibla.boussole'), ouvrir: () => router.push('/priere/qibla') },
                { cle: 'dhikr', icone: 'target', titre: t('dhikr.titre'), sous: t('dhikr.sousTitre'), ouvrir: () => router.push('/priere/dhikr') },
              ] as const).map((x) => (
                <Pressable
                  key={x.cle}
                  accessibilityRole="button"
                  accessibilityLabel={`${x.titre}, ${x.sous}`}
                  onPress={x.ouvrir}
                  style={({ pressed }) => [
                    styles.tuile,
                    {
                      gap: espace.espace3,
                      padding: espace.espace4,
                      borderRadius: rayon.rayonCarte,
                      borderColor: couleurs.ligne,
                      backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.surface,
                    },
                  ]}>
                  <Icon name={x.icone} size={24} color={couleurs.emeraude} />
                  <View style={styles.tuileTextes}>
                    <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.tuileTitre, { color: couleurs.encre }]}>
                      {x.titre}
                    </Text>
                    <Text numberOfLines={2} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                      {x.sous}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
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
  lieu: { fontSize: 14, lineHeight: 20 },
  tuiles: { flexDirection: 'row' },
  tuile: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  tuileTextes: { flex: 1, minWidth: 0 },
  tuileTitre: { fontSize: 16, lineHeight: 24 },
});
