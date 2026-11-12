import { router, useScrollToTop } from 'expo-router';
import { ComponentRef, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { proverbeDuJour } from '@/features/accueil/sagesse';
import { calculerHoraires, prochainePriere } from '@/features/priere/horaires';
import { useOptionsCalcul } from '@/features/priere/useOptionsCalcul';
import { fuseauDuLieu } from '@/features/priere/villes';
import { useMaintenant } from '@/hooks/useMaintenant';
import { formatDuree, formatHegirien, formatHeure, formatJour, minutesDuJour } from '@/lib/dates';
import { prieres, useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useLayout } from '@/theme/useLayout';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import type { PriereArc } from '@/ui/DayArc';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse, useMiniLecteurVisible } from '@/features/ecouter/placeMiniLecteur';
import { BandeEcoute } from '@/features/accueil/BandeEcoute';
import { CarteHeros } from '@/features/accueil/CarteHeros';
import { GrilleAccueil, useColonnesGrille } from '@/features/accueil/CartesAccueil';
import { enEcoute as ecouteEnCours, useLecteur } from '@/features/ecouter/lecteur';
import { SondeBarre } from '@/features/ecouter/SondeBarre';

import { interlignes, tailles } from '@/theme/tokens.generated';
/** Un grain par jour du mois ; `lus` : clés de jour « 2026-10-29 » où une lecture a eu lieu. */

export default function Accueil() {
  // Toucher l'onglet actif ramène la liste en haut.
  const defilement = useRef<ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(defilement);
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie, latin, ligne } = useTheme();
  const marge = useMargeBasse();
  const { styleColonne: colonne, largeur } = useLayout();
  const colonnesGrille = useColonnesGrille(largeur);
  const miniVisible = useMiniLecteurVisible();
  const enEcoute = useLecteur(ecouteEnCours);
  const bandeEcoute = enEcoute && !miniVisible;
  const maintenant = useMaintenant();
  const lieu = useReglages((s) => s.lieu);
  const options = useOptionsCalcul();

  const arc = useMemo(() => {
    if (!lieu) return null;
    // Heures affichées dans le fuseau de la ville choisie (sinon celui du téléphone).
    const fuseau = fuseauDuLieu(lieu);
    const h = calculerHoraires(lieu, maintenant, options);
    const suivante = prochainePriere(lieu, maintenant, options);
    const liste: PriereArc[] = prieres.map((p) => ({
      nom: t(`priere.noms.${p}`),
      heure: formatHeure(h[p], fuseau),
      minutes: minutesDuJour(h[p], fuseau),
      etat: h[p] <= maintenant ? 'passee' : p === suivante.nom ? 'prochaine' : 'a-venir',
    }));
    return {
      liste,
      maintenantMin: minutesDuJour(maintenant, fuseau),
      lever: minutesDuJour(h.lever, fuseau),
      coucher: minutesDuJour(h.coucher, fuseau),
      dans: formatDuree((suivante.heure.getTime() - maintenant.getTime()) / 60_000),
      nom: t(`priere.noms.${suivante.nom}`),
      heure: formatHeure(suivante.heure, fuseau),
    };
  }, [lieu, maintenant, options, t]);


  const jour = formatJour(maintenant, i18n.language);
  const sagesse = proverbeDuJour(maintenant);
  const hegirien = formatHegirien(maintenant, i18n.language);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Planche : titre et date à gauche, loupe à droite sur la même rangée. */}
      <TopBar
        gauche={
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
              style={[typographie.translitteration, ligne(styles.date), { color: couleurs.encre2 }]}>
              {hegirien ? t('accueil.date', { jour, hegirien }) : jour}
            </Text>
          </View>
        }
        actions={[{ icone: 'search', label: t('menuPlus.rechercher'), onPress: () => router.push('/plus/recherche') }]}
      />
      <ScrollView ref={defilement}
        contentContainerStyle={{
          ...colonne,
          paddingBottom: espace.espace8 + marge,
          gap: espace.espace3,
        }}>
        {arc ? (
          <CarteHeros nom={arc.nom} heure={arc.heure} dans={arc.dans} prieres={arc.liste} maintenant={arc.maintenantMin} />
        ) : (
          <Banner ton="info" action={{ label: t('bienvenue.positionVille'), onPress: () => router.push('/position') }}>
            {t('priere.positionRefuseeTexte')}
          </Banner>
        )}

        <GrilleAccueil colonnes={colonnesGrille} />

        {/* Écoute reprise : seulement quand le mini-lecteur est rangé (plafond de la pile) ou absent. */}
        {bandeEcoute ? <BandeEcoute /> : null}

        {/* Wax ju rafet : un proverbe wolof par jour, avec sa traduction. */}
        <View
          accessible
          style={{
            gap: espace.espace1,
            padding: espace.espace4,
            borderRadius: rayon.rayonCarte,
            backgroundColor: couleurs.orDoux,
          }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.etiquette), { color: couleurs.orTexte }]}>
            {t('accueil.sagesse')}
          </Text>
          <Text
            accessibilityLanguage="wo"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[latin.titre2, { color: couleurs.encre, writingDirection: 'ltr' }]}>
            {t(`formules.${sagesse}`)}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.translitteration, { color: couleurs.encre2 }]}>
            {t(`formules.${sagesse}Trad`)}
          </Text>
        </View>
      </ScrollView>
      <SondeBarre />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  // Planche : date en italique 14/20.
  date: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  // Planche : « WAX JU RAFET » en 12/16, majuscules, interlettrage 0,06 em.
  etiquette: { fontSize: tailles.t12, lineHeight: interlignes.l16, textTransform: 'uppercase', letterSpacing: 0.72 },
});
