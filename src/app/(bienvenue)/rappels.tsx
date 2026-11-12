import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, View } from 'react-native';

import { decisionNotifications } from '@/features/bienvenue/autorisations';
import { Dedicace } from '@/features/bienvenue/Dedicace';
import { etapeRappels } from '@/features/bienvenue/etapes';
import { LigneReglage } from '@/features/bienvenue/LigneReglage';
import { MiseEnPage } from '@/features/bienvenue/MiseEnPage';
import { replanifier } from '@/features/priere/notifications';
import { prieres, useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';

import iconeApp from '../../../assets/images/icon.png';

import { interlignes, tailles } from '@/theme/tokens.generated';
export default function Rappels() {
  const { t } = useTranslation();
  const { couleurs, espace, ombres, typographie, latin, ligne } = useTheme();
  const rappels = useReglages((s) => s.rappels);
  const definirRappel = useReglages((s) => s.definirRappel);
  const rappelAvant = useReglages((s) => s.rappelAvant);
  const definirRappelAvant = useReglages((s) => s.definirRappelAvant);
  const terminerBienvenue = useReglages((s) => s.terminerBienvenue);
  const [enCours, setEnCours] = useState(false);

  const terminer = () => {
    terminerBienvenue();
    router.replace('/accueil');
  };

  const commencer = async () => {
    setEnCours(true);
    try {
      const actifs = prieres.some((p) => rappels[p]);
      const decision = await decisionNotifications();
      const etape = etapeRappels(actifs, decision);
      if (etape === 'expliquer') {
        // Explication avant la demande du téléphone ; l'écran suivant termine la bienvenue.
        router.push('/autorisation-notifications');
        return;
      }
      if (etape === 'desactiver-puis-terminer') prieres.forEach((p) => definirRappel(p, false));
      else if (actifs) replanifier().catch((erreur: unknown) => console.error('Programmation des notifications impossible', erreur));
      terminer();
    } finally {
      setEnCours(false);
    }
  };

  return (
    <MiseEnPage
      etape={2}
      actions={
        <Button grand pleineLargeur disabled={enCours} onPress={commencer}>
          {t('bienvenue.commencer')}
        </Button>
      }>
      {/* Planche : carte, 32, titre, 8, sous-titre, 24, liste à plat. */}
      <View>
        {/* Aperçu de la notification, avec une heure d'exemple. */}
        <View
          accessible
          accessibilityLabel={`${t('bienvenue.apercuNotification')} : ${t('formules.appel')} · Asr`}
          style={[
            styles.notification,
            {
              gap: espace.espace3,
              padding: espace.espace4,
              backgroundColor: couleurs.surface,
              borderColor: couleurs.ligne,
            },
            ombres.ombre1 !== 'none' ? { boxShadow: ombres.ombre1 } : null,
          ]}>
          <Image source={iconeApp} accessibilityElementsHidden importantForAccessibility="no" style={styles.iconeApp} />
          <View style={[styles.notificationTextes, { gap: espace.espace1 }]}>
            <View style={styles.notificationEntete}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
                Sama Jàmm
              </Text>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                {t('bienvenue.maintenant')}
              </Text>
            </View>
            <Text
              accessibilityLanguage="wo"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[latin.titre3, ligne(styles.notificationTitre), { color: couleurs.encre }]}>
              {`${t('formules.appel').replace(/\.$/, '')} · Asr`}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.notificationDetail), { color: couleurs.encre2 }]}>
              {t('bienvenue.heureExemple', { heure: '16:35' })}
            </Text>
          </View>
        </View>
        <Text
          accessibilityRole="header"
          accessibilityLanguage="wo"
          maxFontSizeMultiplier={echelleMax.grand}
          style={[latin.display, { color: couleurs.emeraude, writingDirection: 'ltr', marginTop: espace.espace8 }]}>
          {t('bienvenue.rappelsTitre')}
        </Text>
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.translitteration, { color: couleurs.encre2, fontSize: tailles.t18, marginTop: espace.espace2 }]}>
          {t('bienvenue.rappelsSousTitre')}
        </Text>
        <View style={{ marginTop: espace.espace6, borderTopWidth: 1, borderTopColor: couleurs.ligne }}>
          <LigneReglage
            titre={t('bienvenue.appelTitre')}
            detail={t('bienvenue.appelDetail')}
            active={prieres.every((p) => rappels[p])}
            onChange={(actif) => prieres.forEach((p) => definirRappel(p, actif))}
          />
          <LigneReglage
            titre={t('bienvenue.rappelAvantTitre')}
            detail={t('bienvenue.rappelAvantDetail')}
            active={prieres.every((p) => rappelAvant[p] === 10)}
            onChange={(actif) => prieres.forEach((p) => definirRappelAvant(p, actif ? 10 : null))}
          />
        </View>
        {/* Dédicace : sous les réglages, avant le bouton Commencer. */}
        <View style={{ marginTop: espace.espace6 }}>
          <Dedicace variante="bloc" />
        </View>
      </View>
    </MiseEnPage>
  );
}

const styles = StyleSheet.create({
  // Planche : rayon 18, icône de l'app 38 × 38 (rayon 9).
  notification: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 18 },
  iconeApp: { width: 38, height: 38, borderRadius: 9 },
  notificationTextes: { flex: 1 },
  notificationEntete: { flexDirection: 'row', justifyContent: 'space-between' },
  notificationTitre: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  notificationDetail: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
