import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import type { Action, IconName } from './types';

export type ToastProps = {
  /** Deux lignes au plus. */
  texte: string;
  icone?: IconName;
  /** Une action au plus, souvent « Annuler ». */
  action?: Action;
};

type ContexteToast = { afficher: (toast: ToastProps) => void };

const ToastContext = createContext<ContexteToast | null>(null);

const DUREE = 4000;
const DUREE_AVEC_ACTION = 8000;

export function useToast(): ContexteToast {
  const contexte = use(ToastContext);
  if (!contexte) throw new Error('useToast doit être utilisé sous <ToastProvider>.');
  return contexte;
}

// Un seul toast à la fois : un nouvel appel remplace le précédent.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [courant, setCourant] = useState<(ToastProps & { id: number }) | null>(null);

  const afficher = useCallback((toast: ToastProps) => {
    setCourant({ ...toast, id: Date.now() });
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(toast.texte);
  }, []);

  useEffect(() => {
    if (!courant) return;
    const minuterie = setTimeout(() => setCourant(null), courant.action ? DUREE_AVEC_ACTION : DUREE);
    return () => clearTimeout(minuterie);
  }, [courant]);

  const valeur = useMemo(() => ({ afficher }), [afficher]);

  return (
    <ToastContext value={valeur}>
      {children}
      {courant ? <Toast key={courant.id} {...courant} onFin={() => setCourant(null)} /> : null}
    </ToastContext>
  );
}

function Toast({ texte, icone, action, onFin }: ToastProps & { onFin: () => void }) {
  const insets = useSafeAreaInsets();
  const { couleurs, espace, rayon, cible, typographie } = useTheme();
  // Posé 8 px au-dessus de la barre d'onglets (hauteur de TabBar : cible + marges).
  const bas = Math.max(insets.bottom, espace.espace2) + cible.cibleAndroid + espace.espace2 * 2 + espace.espace2;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.zone, { paddingBottom: bas, paddingHorizontal: espace.espace5 }]}>
      <Animated.View
        entering={FadeInDown.duration(250)}
        exiting={FadeOut.duration(200)}
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          { backgroundColor: couleurs.inverse, borderRadius: rayon.rayonCarte, padding: espace.espace3, gap: espace.espace3 },
        ]}>
        {icone ? <Icon name={icone} size={20} color={couleurs.surInverse} /> : null}
        <Text numberOfLines={2} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.texte, { color: couleurs.surInverse }]}>
          {texte}
        </Text>
        {action ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              action.onPress?.();
              onFin();
            }}
            style={{ minHeight: cible.cibleIos, justifyContent: 'center' }}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.accentInverse }]}>
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { justifyContent: 'flex-end' },
  toast: { flexDirection: 'row', alignItems: 'center' },
  texte: { flex: 1 },
});
