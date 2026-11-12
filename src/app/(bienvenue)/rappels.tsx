import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';

import { LigneReglage } from '@/features/bienvenue/LigneReglage';
import { MiseEnPage } from '@/features/bienvenue/MiseEnPage';
import { creerCanaux, replanifier } from '@/features/priere/notifications';
import { prieres, useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';

import iconeApp from '../../../assets/images/icon.png';

import { interlignes, tailles } from '@/theme/tokens.generated';
function ouvrirReglagesTelephone() {
  Linking.openSettings().catch((erreur: unknown) => {
    console.warn('Réglages du téléphone inaccessibles', erreur);
  });
}

async function demanderAutorisation(): Promise<boolean> {
  // Android 13+ : les canaux doivent exister avant la demande d'autorisation.
  await creerCanaux();
  const actuel = await Notifications.getPermissionsAsync();
  if (actuel.granted) return true;
  // Jamais de nouvelle demande système si l'utilisateur a déjà refusé.
  if (!actuel.canAskAgain) return false;
  const reponse = await Notifications.requestPermissionsAsync();
  return reponse.granted;
}

export default function Rappels() {
  const { t } = useTranslation();
  const { couleurs, espace, ombres, typographie, latin } = useTheme();
  const rappels = useReglages((s) => s.rappels);
  const veilleAuto = useReglages((s) => s.veilleAuto);
  const definirRappel = useReglages((s) => s.definirRappel);
  const rappelAvant = useReglages((s) => s.rappelAvant);
  const definirRappelAvant = useReglages((s) => s.definirRappelAvant);
  const definirVeilleAuto = useReglages((s) => s.definirVeilleAuto);
  const terminerBienvenue = useReglages((s) => s.terminerBienvenue);
  const [refusees, setRefusees] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const terminer = () => {
    terminerBienvenue();
    router.replace('/accueil');
  };

  const commencer = async () => {
    // Après un refus affiché, « Commencer » termine sans redemander.
    if (refusees || !prieres.some((p) => rappels[p])) {
      terminer();
      return;
    }
    setEnCours(true);
    try {
      if (await demanderAutorisation()) {
        replanifier().catch((erreur: unknown) => console.error('Programmation des notifications impossible', erreur));
        terminer();
      } else setRefusees(true);
    } catch (erreur: unknown) {
      console.warn('Autorisation des notifications impossible', erreur);
      setRefusees(true);
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
              style={[latin.titre3, styles.notificationTitre, { color: couleurs.encre }]}>
              {`${t('formules.appel').replace(/\.$/, '')} · Asr`}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.notificationDetail, { color: couleurs.encre2 }]}>
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
        {refusees ? (
          <View style={{ marginTop: espace.espace4 }}>
            <Banner ton="attention" action={{ label: t('autorisations.ouvrirReglages'), onPress: ouvrirReglagesTelephone }}>
              {t('bienvenue.notificationsRefusees')}
            </Banner>
          </View>
        ) : null}
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
          <LigneReglage
            titre={t('bienvenue.veilleAuto')}
            detail={t('bienvenue.veilleAutoDetail')}
            active={veilleAuto}
            onChange={definirVeilleAuto}
          />
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
