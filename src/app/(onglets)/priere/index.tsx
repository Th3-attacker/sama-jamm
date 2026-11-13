import { router, useScrollToTop } from 'expo-router';
import { ComponentRef, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChoixVille } from '@/features/priere/ChoixVille';
import { FeuilleLieu, UtiliserMaPosition } from '@/features/priere/FeuilleLieu';
import { calculerHoraires, prochainePriere } from '@/features/priere/horaires';
import { fuseauDuLieu } from '@/features/priere/villes';
import { useOptionsCalcul } from '@/features/priere/useOptionsCalcul';
import { useMaintenant } from '@/hooks/useMaintenant';
import { formatHeure, formatJour, minutesDuJour } from '@/lib/dates';
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
import { VersetRubrique } from '@/ui/VersetRubrique';
import { versetRubrique } from '@/features/rubriques/versetsRubriques';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

import { interlignes, tailles } from '@/theme/tokens.generated';
const JOURS_SEMAINE = 7;

// Verset du Coran de la rubrique : données embarquées, lues une fois.
const verset = versetRubrique('priere');

export default function Priere() {
  // Toucher l'onglet actif ramène la liste en haut.
  const defilement = useRef<ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(defilement);
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, cible, typographie, ligne } = useTheme();
  const marge = useMargeBasse();
  const { styleColonne: colonne } = useLayout();
  const maintenant = useMaintenant();
  const options = useOptionsCalcul();
  const lieu = useReglages((s) => s.lieu);
  // Heures affichées dans le fuseau de la ville choisie (sinon celui du téléphone).
  const fuseau = fuseauDuLieu(lieu);
  const rappels = useReglages((s) => s.rappels);
  const definirRappel = useReglages((s) => s.definirRappel);
  const definirLieu = useReglages((s) => s.definirLieu);
  const [lieuOuvert, setLieuOuvert] = useState(false);
  const tAr = i18n.getFixedT('ar');

  const donnees = useMemo(() => {
    if (!lieu) return null;
    const h = calculerHoraires(lieu, maintenant, options);
    const suivante = prochainePriere(lieu, maintenant, options);
    const semaine = Array.from({ length: JOURS_SEMAINE - 1 }, (_, i) => {
      const jour = new Date(maintenant);
      jour.setDate(jour.getDate() + i + 1);
      return { jour, horaires: calculerHoraires(lieu, jour, options) };
    });
    return { h, suivante, semaine };
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
      <ScrollView ref={defilement} contentContainerStyle={{ ...colonne, paddingBottom: espace.espace8 + marge, gap: espace.espace6 }}>

        {!lieu || !donnees ? (
          <>
            <Banner ton="erreur" titre={t('priere.positionRefusee')}>
              {t('priere.positionRefuseeTexte')}
            </Banner>
            <UtiliserMaPosition onFait={() => undefined} />
            <ChoixVille apresRefus onChoisir={(v) => definirLieu({ type: 'ville', id: v.id, nom: v.nom, latitude: v.lat, longitude: v.lon })} />
          </>
        ) : (
          <>
            {/* Jamais d'heures sans le lieu de calcul. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${nomLieu}. ${t('priere.changerLieu')}`}
              onPress={() => setLieuOuvert(true)}
              style={[styles.ligneLieu, { minHeight: cible.cibleIos }]}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.lieu), { color: couleurs.encre2 }]}>
                {`${nomLieu} · ${formatJour(maintenant, i18n.language)}`}
              </Text>
              <View style={{ marginStart: espace.espace2 }}>
                <Icon name="chevron-down" size={16} color={couleurs.encre2} />
              </View>
            </Pressable>
            {/* Planche : l'arc du jour seul, sans texte au-dessus ; les horaires sont dans la liste. */}
            <View style={{ paddingVertical: espace.espace6, paddingHorizontal: espace.espace4 }}>
              <DayArc
                simple
                lever={minutesDuJour(donnees.h.lever, fuseau)}
                coucher={minutesDuJour(donnees.h.coucher, fuseau)}
                maintenant={minutesDuJour(maintenant, fuseau)}
                dans=""
                avant=""
                a=""
                prieres={prieres.map((p) => ({
                  nom: t(`priere.noms.${p}`),
                  heure: formatHeure(donnees.h[p], fuseau),
                  minutes: minutesDuJour(donnees.h[p], fuseau),
                  etat: donnees.h[p] <= maintenant ? 'passee' : p === donnees.suivante.nom ? 'prochaine' : 'a-venir',
                }))}
                description={t('accessibilite.arcDuJour')}
              />
            </View>
            <PrayerTimes
              prieres={prieres.map<LignePriere>((p) => {
                const prochaine = p === donnees.suivante.nom && donnees.h[p] > maintenant;
                return {
                  id: p,
                  nom: t(`priere.noms.${p}`),
                  nomLocal: t(`priere.nomsLocaux.${p}`),
                  nomArabe: tAr(`priere.noms.${p}`),
                  heure: formatHeure(donnees.h[p], fuseau),
                  etat: donnees.h[p] <= maintenant ? 'passee' : prochaine ? 'prochaine' : 'a-venir',
                  appelActif: rappels[p],
                  libelleAppel: t('priere.notificationDe', { priere: t(`priere.noms.${p}`) }),
                };
              })}
              onBasculerAppel={(id) => {
                const p = prieres.find((x) => x === id);
                if (p) definirRappel(p, !rappels[p]);
              }}
            />
            {verset ? <VersetRubrique verset={verset} /> : null}
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
                    <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.tuileTitre), { color: couleurs.encre }]}>
                      {x.titre}
                    </Text>
                    <Text numberOfLines={2} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                      {x.sous}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <ListGroup titre={t('priere.semaine')}>
              {donnees.semaine.map(({ jour, horaires }) => (
                <ListItem
                  key={jour.toDateString()}
                  titre={formatJour(jour, i18n.language)}
                  sousTitre={prieres.map((p) => formatHeure(horaires[p], fuseau)).join(' · ')}
                />
              ))}
            </ListGroup>
          </>
        )}
      </ScrollView>
      <FeuilleLieu ouvert={lieuOuvert} onFermer={() => setLieuOuvert(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  lieu: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  ligneLieu: { flexDirection: 'row', alignItems: 'center' },
  tuiles: { flexDirection: 'row' },
  tuile: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  tuileTextes: { flex: 1, minWidth: 0 },
  tuileTitre: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
});
