// Groupe « Autorisations du téléphone » des réglages : position, notifications, alarmes exactes (Android).
// Relu à chaque retour dans l'app : l'utilisateur a pu changer l'autorisation dans les réglages du téléphone.
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Platform } from 'react-native';

import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

type Etat = 'accordee' | 'refusee' | 'aDemander';
const etatDe = (p: { granted: boolean; canAskAgain: boolean }): Etat =>
  p.granted ? 'accordee' : p.canAskAgain ? 'aDemander' : 'refusee';

export function EtatAutorisations() {
  const { t } = useTranslation();
  const [position, setPosition] = useState<Etat | null>(null);
  const [notifications, setNotifications] = useState<Etat | null>(null);
  const [alarmes, setAlarmes] = useState<boolean | null>(null);

  const relire = useCallback(() => {
    Location.getForegroundPermissionsAsync()
      .then((p) => setPosition(etatDe(p)))
      .catch((e: unknown) => console.warn('Autorisation de position inconnue', e));
    Notifications.getPermissionsAsync()
      .then((p) => setNotifications(etatDe(p)))
      .catch((e: unknown) => console.warn('Autorisation des notifications inconnue', e));
    if (Platform.OS === 'android')
      Notifications.getExactAlarmPermissionsAsync()
        .then((p) => setAlarmes(p.granted))
        .catch((e: unknown) => console.warn('Alarmes exactes inconnues', e));
  }, []);

  useEffect(() => {
    relire();
    const abonnement = AppState.addEventListener('change', (e) => {
      if (e === 'active') relire();
    });
    return () => abonnement.remove();
  }, [relire]);

  const libelle = (e: Etat | null) => (e ? t(`autorisations.etats.${e}`) : '…');
  const unRefus = position === 'refusee' || notifications === 'refusee' || alarmes === false;
  const ouvrir = () => {
    Linking.openSettings().catch((e: unknown) => console.warn('Réglages du téléphone inaccessibles', e));
  };

  return (
    <>
      <ListGroup titre={t('autorisations.titre')} note={t('autorisations.note')}>
        <ListItem icone="pin" titre={t('autorisations.position')} valeur={libelle(position)} />
        <ListItem icone="bell" titre={t('autorisations.notifications')} valeur={libelle(notifications)} />
        {Platform.OS === 'android' ? (
          <ListItem
            icone="clock"
            titre={t('autorisations.alarmesTitre')}
            sousTitre={alarmes === false ? t('autorisations.alarmesTexte') : undefined}
            valeur={alarmes === null ? '…' : libelle(alarmes ? 'accordee' : 'refusee')}
          />
        ) : null}
      </ListGroup>
      {unRefus ? (
        <Button variant="secondaire" pleineLargeur onPress={ouvrir}>
          {t('autorisations.ouvrirReglages')}
        </Button>
      ) : null}
    </>
  );
}
