import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAvantAutorisation } from '@/features/autorisation/AvantAutorisation';
import { ChoixVille } from '@/features/priere/ChoixVille';
import { relevementQibla } from '@/features/priere/horaires';
import { rotationDepuisNord } from '@/features/priere/rotation';
import { useCap } from '@/features/priere/useCap';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { ecartQibla, QiblaCompass } from '@/ui/QiblaCompass';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

const TOLERANCE = 3;
// Seize points cardinaux, tous les 22,5°.
const DIRECTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'] as const;
// Il faut s'écarter franchement avant qu'un nouvel alignement vibre à nouveau.
const REARMEMENT = 10;

export default function Qibla() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const marge = useMargeBasse();
  const lieu = useReglages((s) => s.lieu);
  const definirLieu = useReglages((s) => s.definirLieu);
  const [essai, setEssai] = useState(0);
  const cap = useCap(essai);
  const dejaVibre = useRef(false);
  const autorisation = useAvantAutorisation('position');
  const dejaExplique = useRef(false);

  // Boussole jamais autorisée : une seule explication par visite, puis la demande du téléphone et un nouvel essai.
  const { demander } = autorisation;
  useEffect(() => {
    if (cap.etat !== 'autorisation' || dejaExplique.current) return;
    dejaExplique.current = true;
    demander()
      .then(() => setEssai((n) => n + 1))
      .catch((erreur: unknown) => console.warn('Autorisation de la boussole non obtenue', erreur));
  }, [cap.etat, demander]);

  const qibla = lieu ? relevementQibla(lieu) : null;
  const nomLieu = lieu ? (lieu.type === 'ville' ? lieu.nom : t('priere.maPosition')) : '';
  const ecart = qibla !== null && cap.etat === 'actif' ? Math.abs(ecartQibla(cap.cap, qibla)) : null;

  // Une seule vibration à l'alignement, jamais en continu.
  useEffect(() => {
    if (ecart === null) return;
    if (ecart <= TOLERANCE && !dejaVibre.current) {
      dejaVibre.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((erreur: unknown) => {
        console.warn('Retour haptique indisponible', erreur);
      });
    } else if (ecart > REARMEMENT) {
      dejaVibre.current = false;
    }
  }, [ecart]);

  const direction = qibla !== null ? t(`qibla.directions.${DIRECTIONS[Math.round(qibla / 22.5) % 16]}`) : '';
  const rotation = rotationDepuisNord(qibla ?? 0);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('qibla.titre')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 + marge, gap: espace.espace5 }}>
        {!lieu || qibla === null ? (
          <>
            <Banner ton="erreur" titre={t('priere.positionRefusee')}>
              {t('priere.positionRefuseeTexte')}
            </Banner>
            <ChoixVille onChoisir={(v) => definirLieu({ type: 'ville', id: v.id, nom: v.nom, latitude: v.lat, longitude: v.lon })} />
          </>
        ) : cap.etat === 'indisponible' || (cap.etat === 'autorisation' && essai > 0) ? (
          <>
            <Banner ton="info" titre={t('qibla.sansBoussole')}>
              {t('qibla.sansBoussoleExplication')}
            </Banner>
            <View style={[styles.centreBloc, { gap: espace.espace1 }]}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.chiffre, { color: couleurs.emeraude }]}>
                {`${Math.round(qibla)}°`}
              </Text>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
                {t('qibla.directionDepuis', { direction, lieu: nomLieu })}
              </Text>
            </View>
            <View style={{ gap: espace.espace2 }}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
                {`1. ${t('qibla.etapeNord')}`}
              </Text>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
                {`2. ${t(`qibla.etapeTourner.${rotation.sens}`, { part: t(`qibla.parts.${rotation.part}`), degres: rotation.angle })}`}
              </Text>
            </View>
          </>
        ) : (
          <>
            {cap.etat === 'actif' && cap.imprecis ? <Banner ton="info">{t('qibla.calibration')}</Banner> : null}
            {ecart !== null && ecart <= TOLERANCE ? <Banner ton="succes">{t('qibla.trouvee')}</Banner> : null}
            <QiblaCompass cap={cap.etat === 'actif' ? cap.cap : 0} qibla={qibla} tolerance={TOLERANCE} lieu={nomLieu} />
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.centre, { color: couleurs.encre2 }]}>
              {t('qibla.consigne')}
            </Text>
          </>
        )}
      </ScrollView>
      {autorisation.feuille}
    </View>
  );
}

const styles = StyleSheet.create({
  centreBloc: { alignItems: 'center' },
  ecran: { flex: 1 },
  centre: { textAlign: 'center' },
});
