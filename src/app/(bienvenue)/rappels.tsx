import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { MiseEnPage } from '@/features/bienvenue/MiseEnPage';
import { creerCanaux, replanifier } from '@/features/priere/notifications';
import { prieres, useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { Switch } from '@/ui/Switch';

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
  const { couleurs, espace, rayon, typographie, latin } = useTheme();
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
        <>
          <Button pleineLargeur disabled={enCours} onPress={commencer}>
            {t('bienvenue.commencer')}
          </Button>
          <Button variant="discret" pleineLargeur onPress={terminer}>
            {t('commun.plusTard')}
          </Button>
        </>
      }>
      {/* Aperçu de la notification (maquette), avec une heure d'exemple. */}
      <View
        accessible
        accessibilityLabel={`${t('bienvenue.apercuNotification')} : ${t('formules.appel')} · Asr`}
        style={[styles.notification, { gap: espace.espace1, padding: espace.espace4, borderRadius: rayon.rayonCarte, backgroundColor: couleurs.surface, borderColor: couleurs.ligne }]}>
        <Text style={[typographie.legende, { color: couleurs.encre3 }]}>{`Sama Jàmm · ${t('bienvenue.maintenant')}`}</Text>
        <Text style={[typographie.libelle, { color: couleurs.encre }]}>{`${t('formules.appel').replace(/\.$/, '')} · Asr`}</Text>
        <Text style={[typographie.legende, { color: couleurs.encre2 }]}>{t('bienvenue.heureExemple', { heure: '16:35' })}</Text>
      </View>
      <Text accessibilityRole="header" accessibilityLanguage="wo" maxFontSizeMultiplier={echelleMax.courant} style={[latin.titre1, { color: couleurs.emeraude, writingDirection: 'ltr' }]}>
        {t('bienvenue.rappelsTitre')}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, { color: couleurs.encre2 }]}>
        {t('bienvenue.rappelsSousTitre')}
      </Text>
      {refusees ? (
        <Banner ton="attention" action={{ label: t('autorisations.ouvrirReglages'), onPress: ouvrirReglagesTelephone }}>
          {t('bienvenue.notificationsRefusees')}
        </Banner>
      ) : null}
      <ListGroup>
        <ListItem
          icone="bell"
          titre={t('bienvenue.appelTitre')}
          sousTitre={t('bienvenue.appelDetail')}
          droite={
            <Switch
              label={t('bienvenue.appelTitre')}
              active={prieres.every((p) => rappels[p])}
              onChange={(actif) => prieres.forEach((p) => definirRappel(p, actif))}
            />
          }
        />
        <ListItem
          icone="clock"
          titre={t('bienvenue.rappelAvantTitre')}
          sousTitre={t('bienvenue.rappelAvantDetail')}
          droite={
            <Switch
              label={t('bienvenue.rappelAvantTitre')}
              active={prieres.every((p) => rappelAvant[p] === 10)}
              onChange={(actif) => prieres.forEach((p) => definirRappelAvant(p, actif ? 10 : null))}
            />
          }
        />
      </ListGroup>
      <ListGroup>
        <ListItem
          icone="moon"
          titre={t('bienvenue.veilleAuto')}
          sousTitre={t('bienvenue.veilleAutoDetail')}
          droite={<Switch label={t('bienvenue.veilleAuto')} active={veilleAuto} onChange={definirVeilleAuto} />}
        />
      </ListGroup>
    </MiseEnPage>
  );
}

const styles = StyleSheet.create({
  notification: { borderWidth: 1 },
});
