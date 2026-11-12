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
import { Icon } from '@/ui/Icon';
import { ecartQibla, QiblaCompass } from '@/ui/QiblaCompass';
import { SchemaQibla } from '@/ui/SchemaQibla';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

import { interlignes, tailles } from '@/theme/tokens.generated';
const TOLERANCE = 3;
// Seize points cardinaux, tous les 22,5°.
const DIRECTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'] as const;
// Il faut s'écarter franchement avant qu'un nouvel alignement vibre à nouveau.
const REARMEMENT = 10;

export default function Qibla() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
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
  const sansBoussole = !!lieu && qibla !== null && (cap.etat === 'indisponible' || (cap.etat === 'autorisation' && essai > 0));
  const trouvee = ecart !== null && ecart <= TOLERANCE;

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Titre centré pendant la recherche ; à gauche quand la qibla est trouvée ou sans boussole. */}
      <TopBar retour centre={!sansBoussole && !trouvee} titre={t('qibla.titre')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 + marge, gap: sansBoussole ? espace.espace4 : espace.espace5 }}>
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
            <View style={[styles.centreBloc, { gap: espace.espace1, paddingTop: espace.espace2 }]}>
              <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.chiffre, ligne(styles.degres), { color: couleurs.encre }]}>
                {`${Math.round(qibla)}°`}
              </Text>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.directionTexte), { color: couleurs.encre2 }]}>
                {t('qibla.directionDepuis', { direction, lieu: nomLieu })}
              </Text>
            </View>
            <View style={styles.schema}>
              <SchemaQibla
                qibla={qibla}
                description={t(rotation.sens === 'droite' ? 'qibla.schemaDroite' : 'qibla.schemaGauche', { degres: rotation.angle })}
              />
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
            <QiblaCompass cap={cap.etat === 'actif' ? cap.cap : 0} qibla={qibla} tolerance={TOLERANCE} lieu={nomLieu} texte={trouvee ? undefined : t('qibla.consigne')} />
            {/* Planche « Qibla trouvée » : une seule phrase centrée, sans conseil. */}
            {trouvee ? (
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.trouvee, { color: couleurs.encre2 }]}>
                {t('qibla.trouvee')}
              </Text>
            ) : (
            <View
              style={[
                styles.conseil,
                { gap: espace.espace3, paddingVertical: espace.espace3, paddingHorizontal: espace.espace4, borderRadius: rayon.rayonCarte, backgroundColor: couleurs.surfaceCreux },
              ]}>
              <View style={styles.iconeConseil}>
                <Icon name="info" size={20} color={couleurs.info} />
              </View>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.texteConseil), { color: couleurs.encre }]}>
                {t('qibla.calibration')}
              </Text>
            </View>
            )}
          </>
        )}
      </ScrollView>
      {autorisation.feuille}
    </View>
  );
}

const styles = StyleSheet.create({
  centreBloc: { alignItems: 'center' },
  degres: { fontSize: tailles.t56, lineHeight: interlignes.l60 },
  directionTexte: { fontSize: tailles.t18, lineHeight: interlignes.l24, textAlign: 'center' },
  schema: { alignSelf: 'center' },
  trouvee: { textAlign: 'center' },
  ecran: { flex: 1 },
  conseil: { flexDirection: 'row', alignItems: 'flex-start' },
  iconeConseil: { marginTop: 1 },
  texteConseil: { flex: 1, fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
