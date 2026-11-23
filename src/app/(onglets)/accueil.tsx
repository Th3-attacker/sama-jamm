import { router, useScrollToTop } from 'expo-router';
import { ComponentRef, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CarteDedicace } from '@/features/dedicace/CarteDedicace';
import { useSession } from '@/features/compte/compte';
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
import { ACCESSOIRE_NATIF } from '@/theme/layout';
import { useMargeBasse, useMiniLecteurVisible } from '@/features/ecouter/placeMiniLecteur';
import { BandeEcoute } from '@/features/accueil/BandeEcoute';
import { CarteHeros } from '@/features/accueil/CarteHeros';
import { GrilleAccueil } from '@/features/accueil/CartesAccueil';
import { enEcoute as ecouteEnCours, useLecteur } from '@/features/ecouter/lecteur';
import { SondeBarre } from '@/features/ecouter/SondeBarre';

import { interlignes, tailles } from '@/theme/tokens.generated';
/** Un grain par jour du mois ; `lus` : clés de jour « 2026-10-29 » où une lecture a eu lieu. */

export default function Accueil() {
  // Toucher l'onglet actif ramène la liste en haut.
  const defilement = useRef<ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(defilement);
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie, latin, ligne } = useTheme();
  const marge = useMargeBasse();
  const { styleColonne: colonne, largeur } = useLayout();
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


  const connecte = useSession((s) => s.session !== null);
  // Badge du bouton Plus (iOS 26) : dernier nombre relu par la barre d'onglets (`useKhatmsEnCours`, sans seconde
  // requête), jamais affiché sans session.
  const khatmsEnCours = useReglages((s) => s.khatmEnCours);
  const badgePlus = connecte && khatmsEnCours !== null && khatmsEnCours > 0;
  const jour = formatJour(maintenant, i18n.language);
  const hegirien = formatHegirien(maintenant, i18n.language);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Planche : titre et date à gauche, Plus (iOS 26 et plus) ou loupe à droite sur la même rangée. */}
      <TopBar
        gauche={
          <View>
            {/* Planche : titre en 40/44 (style display, plafonné comme les grands titres des autres onglets). */}
            <Text
              accessibilityRole="header"
              accessibilityLanguage="wo"
              maxFontSizeMultiplier={echelleMax.grand}
              style={[latin.display, { color: couleurs.emeraude, writingDirection: 'ltr' }]}>
              {t('formules.saluer')}
            </Text>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.translitteration, ligne(styles.italique), { color: couleurs.encre2 }]}>
              {hegirien ? t('accueil.date', { jour, hegirien }) : jour}
            </Text>
          </View>
        }
        actions={[
          // iOS 26 et plus : la recherche est dans la barre d'onglets et Plus n'y est plus ; le bouton Plus prend la
          // place de la loupe, avec le badge des khatms en cours (écart à la planche A1, voir ECARTS.md). Le Compte
          // reste dans l'écran Plus. Android et iOS 18 gardent la loupe.
          ACCESSOIRE_NATIF
            ? {
                icone: 'grid',
                label: badgePlus ? t('accueil.plusEnCours', { plus: t('onglets.plus'), enCours: t('menuPlus.enCours', { count: khatmsEnCours ?? 0 }) }) : t('onglets.plus'),
                badge: badgePlus ? String(khatmsEnCours) : undefined,
                onPress: () => router.push('/plus/menu'),
              }
            : { icone: 'search', label: t('menuPlus.rechercher'), onPress: () => router.push('/plus/recherche') },
        ]}
      />
      <ScrollView ref={defilement}
        contentContainerStyle={{
          ...colonne,
          paddingBottom: espace.espace8 + marge,
          // Charte : 24 entre deux blocs (la grille de cartes garde ses 12).
          gap: espace.espace6,
        }}>
        {arc ? (
          <CarteHeros nom={arc.nom} heure={arc.heure} dans={arc.dans} prieres={arc.liste} maintenant={arc.maintenantMin} />
        ) : (
          // Planche « ville à choisir » : le bandeau, puis la carte avec « -- : -- » et des points vides.
          <View style={{ gap: espace.espace3 }}>
            <Banner
              ton="attention"
              icone="pin"
              titre={t('accueil.villeTitre')}
              action={{ label: t('bienvenue.positionVille'), onPress: () => router.push('/position') }}>
              {t('accueil.villeTexte')}
            </Banner>
            <CarteHeros sansVille prieres={prieres.map((p) => ({ nom: t(`priere.noms.${p}`), heure: '--:--', minutes: 0, etat: 'a-venir' }))} />
          </View>
        )}

        <GrilleAccueil largeur={largeur} />

        {/* Écoute reprise : seulement quand le mini-lecteur est rangé (plafond de la pile) ou absent. */}
        {bandeEcoute ? <BandeEcoute /> : null}

        {/* Page 16 : un nom, une invocation. Remplace le proverbe « Wax ju rafet » (décision du propriétaire, 23 nov 2026). */}
        <CarteDedicace />
      </ScrollView>
      <SondeBarre />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  // Planche : date en italique 15/22, hors échelle : ramenée à 14/20.
  italique: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
