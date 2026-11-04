import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Text } from 'react-native';

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
  const { couleurs, typographie, latin } = useTheme();
  const rappels = useReglages((s) => s.rappels);
  const veilleAuto = useReglages((s) => s.veilleAuto);
  const definirRappel = useReglages((s) => s.definirRappel);
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
      <Text accessibilityRole="header" accessibilityLanguage="wo" maxFontSizeMultiplier={echelleMax.courant} style={[latin.titre1, { color: couleurs.emeraude, writingDirection: 'ltr' }]}>
        {t('bienvenue.rappelsTitre')}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, { color: couleurs.encre2 }]}>
        {t('bienvenue.rappelsSousTitre')}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
        {t('bienvenue.rappelsTexte')}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
        {t('autorisations.avant.notifications.demande')}
      </Text>
      {refusees ? (
        <Banner ton="attention" action={{ label: t('autorisations.ouvrirReglages'), onPress: ouvrirReglagesTelephone }}>
          {t('bienvenue.notificationsRefusees')}
        </Banner>
      ) : null}
      <ListGroup>
        {prieres.map((p) => (
          <ListItem
            key={p}
            titre={t(`priere.noms.${p}`)}
            sousTitre={t(`priere.nomsLocaux.${p}`)}
            droite={
              <Switch
                label={t('priere.notificationDe', { priere: t(`priere.noms.${p}`) })}
                active={rappels[p]}
                onChange={(actif) => definirRappel(p, actif)}
              />
            }
          />
        ))}
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
