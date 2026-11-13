import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Modal, StyleSheet, Text, View, type TextInstance } from 'react-native';

import { useSens } from '@/i18n/useSens';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { Icon } from './Icon';
import type { IconName } from './types';

export type DialogProps = {
  ouvert: boolean;
  /** Une question. */
  titre: string;
  /** Ce qui sera perdu et ce qui reste. */
  children?: string;
  /** Le verbe exact : « Supprimer définitivement ». */
  confirmer: string;
  /** « Annuler » par défaut. */
  annuler?: string;
  /** Bouton de confirmation en variante danger. */
  danger?: boolean;
  icone?: IconName;
  onConfirmer: () => void;
  onAnnuler: () => void;
};

// Confirme un geste qu'on ne peut pas défaire. Retour Android = annuler.
export function Dialog({ ouvert, titre, children, confirmer, annuler, danger = false, icone, onConfirmer, onAnnuler }: DialogProps) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const refTitre = useRef<TextInstance>(null);
  const sens = useSens();

  return (
    <Modal
      transparent
      visible={ouvert}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onAnnuler}
      onShow={() => {
        if (refTitre.current) AccessibilityInfo.sendAccessibilityEvent(refTitre.current, 'focus');
      }}>
      <View style={[styles.voile, { backgroundColor: couleurs.voile, padding: espace.espace6, direction: sens }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.carte,
            { backgroundColor: couleurs.surface, borderRadius: rayon.rayonFeuille, padding: espace.espace6, gap: espace.espace4 },
          ]}>
          {icone ? <Icon name={icone} size={24} color={danger ? couleurs.erreur : couleurs.emeraude} /> : null}
          <Text
            ref={refTitre}
            accessibilityRole="header"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.titre2, { color: couleurs.encre }]}>
            {titre}
          </Text>
          {children ? (
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
              {children}
            </Text>
          ) : null}
          <View style={{ gap: espace.espace2 }}>
            <Button variant={danger ? 'danger' : 'principal'} pleineLargeur onPress={onConfirmer}>
              {confirmer}
            </Button>
            <Button variant="discret" pleineLargeur onPress={onAnnuler}>
              {annuler ?? t('commun.annuler')}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  carte: { width: '100%', maxWidth: 400 },
});
