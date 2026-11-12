// Explication avant la demande d'autorisation du téléphone (maquettes « Avant la demande de position / de notifications »).
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useCallback, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import type { IconName } from '@/ui/types';

import { interlignes, tailles } from '@/theme/tokens.generated';
export type TypeAutorisation = 'position' | 'notifications';

type Statut = { granted: boolean; canAskAgain: boolean };

const PERMISSIONS: Record<TypeAutorisation, { lire: () => Promise<Statut>; demander: () => Promise<Statut> }> = {
  position: {
    lire: () => Location.getForegroundPermissionsAsync(),
    demander: () => Location.requestForegroundPermissionsAsync(),
  },
  notifications: {
    lire: () => Notifications.getPermissionsAsync(),
    demander: () => Notifications.requestPermissionsAsync(),
  },
};

const POINTS = {
  position: [
    { icone: 'clock', cle: 'horaires' },
    { icone: 'kaaba', cle: 'qibla' },
    { icone: 'lock', cle: 'jamaisEnvoyee', neutre: true },
  ],
  notifications: [
    { icone: 'clock', cle: 'prieres' },
    { icone: 'users', cle: 'khatm' },
    { icone: 'moon', cle: 'sansPublicite', neutre: true },
  ],
} as const satisfies Record<TypeAutorisation, readonly { icone: IconName; cle: string; neutre?: boolean }[]>;

/** Les trois raisons de la maquette (horaires, qibla, jamais envoyée · prières, khatm, sans publicité). */
export function RaisonsAutorisation({ type }: { type: TypeAutorisation }) {
  const { t } = useTranslation();
  const ligne = (icone: IconName, titre: string, aide: string, neutre: boolean) => (
    <ListItem key={titre} icone={icone} ton={neutre ? 'neutre' : undefined} titre={titre} sousTitre={aide} />
  );
  return (
    <ListGroup>
      {type === 'position'
        ? POINTS.position.map((p) =>
            ligne(
              p.icone,
              t(`autorisations.avant.position.${p.cle}`),
              t(`autorisations.avant.position.${p.cle}Aide`),
              'neutre' in p,
            ),
          )
        : POINTS.notifications.map((p) =>
            ligne(
              p.icone,
              t(`autorisations.avant.notifications.${p.cle}`),
              t(`autorisations.avant.notifications.${p.cle}Aide`),
              'neutre' in p,
            ),
          )}
    </ListGroup>
  );
}

/** Contenu de l'explication : titre wolof, trois raisons, phrase sur la demande du téléphone, « Continuer ». */
export function AvantAutorisation({
  type,
  onContinuer,
  bouton = true,
}: {
  type: TypeAutorisation;
  onContinuer: () => void;
  /** Faux dans un écran entier : le bouton « Continuer » est alors posé en bas par l'écran. */
  bouton?: boolean;
}) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie, ligne } = useTheme();
  return (
    <View style={{ gap: espace.espace4 }}>
      <EmptyState
        icone={type === 'position' ? 'pin' : 'bell'}
        titre={t(`autorisations.avant.${type}.titre`)}
        sousTitre={t(`autorisations.avant.${type}.sousTitre`)}
        texte={t(`autorisations.avant.${type}.texte`)}
      />
      <RaisonsAutorisation type={type} />
      <Text
        maxFontSizeMultiplier={echelleMax.courant}
        style={[typographie.corps, { color: couleurs.encre3, textAlign: 'center' }, ligne(styles.demande)]}>
        {t(`autorisations.avant.${type}.demande`)}
      </Text>
      {bouton ? (
        <Button pleineLargeur onPress={onContinuer}>
          {t('commun.continuer')}
        </Button>
      ) : null}
    </View>
  );
}

/**
 * `demander()` : vrai si l'autorisation est accordée. Déjà accordée → vrai sans rien afficher ; refusée pour de bon
 * → faux sans rien afficher ; sinon l'explication s'ouvre et « Continuer » lance la demande du téléphone.
 * Fermer la feuille sans continuer rend faux. `feuille` est à placer dans l'écran.
 */
export function useAvantAutorisation(type: TypeAutorisation): {
  demander: () => Promise<boolean>;
  feuille: ReactElement;
} {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const reponse = useRef<((accorde: boolean) => void) | null>(null);

  const conclure = useCallback((accorde: boolean) => {
    reponse.current?.(accorde);
    reponse.current = null;
  }, []);

  const demander = useCallback(async () => {
    const statut = await PERMISSIONS[type].lire();
    if (statut.granted) return true;
    if (!statut.canAskAgain) return false;
    conclure(false);
    setOuvert(true);
    return new Promise<boolean>((resoudre) => {
      reponse.current = resoudre;
    });
  }, [type, conclure]);

  const continuer = () => {
    // La réponse est mise à part : la fermeture de la feuille (onFermer) ne doit pas conclure à un refus.
    const repondre = reponse.current;
    reponse.current = null;
    setOuvert(false);
    PERMISSIONS[type]
      .demander()
      .then((s) => repondre?.(s.granted))
      .catch((erreur: unknown) => {
        console.warn('Demande d’autorisation impossible', erreur);
        repondre?.(false);
      });
  };

  return {
    demander,
    feuille: (
      <BottomSheet
        ouvert={ouvert}
        titre={t(`autorisations.avant.${type}.titreFeuille`)}
        onFermer={() => {
          setOuvert(false);
          conclure(false);
        }}>
        {ouvert ? <AvantAutorisation type={type} onContinuer={continuer} /> : null}
      </BottomSheet>
    ),
  };
}

const styles = StyleSheet.create({
  // Planche : 14/20, normal, centré.
  demande: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
