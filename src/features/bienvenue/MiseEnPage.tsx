import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';
import { PageDots } from '@/ui/PageDots';
import { TopBar } from '@/ui/TopBar';

type Props = {
  /** Index de l'étape, à partir de 0. */
  etape: number;
  /** Boutons du bas : action principale puis action discrète. */
  actions: ReactNode;
  children: ReactNode;
};

// Mise en page commune des étapes 2 et 3 : retour « ← », contenu défilant, actions et étape en bas.
export function MiseEnPage({ etape, actions, children }: Props) {
  const { couleurs, espace } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace6, gap: espace.espace4 }}>
        {children}
      </ScrollView>
      {/* Planche : 40 sous les points d'étape, la zone sûre du bas comprise. */}
      <View style={{ paddingHorizontal: espace.espace6, paddingBottom: Math.max(espace.espace4, 40 - insets.bottom) + insets.bottom, gap: espace.espace2 }}>
        {actions}
        {/* Le texte « Étape n sur 3 » est porté par les points, lus par les lecteurs d'écran. */}
        <View style={[styles.etape, { marginTop: espace.espace5 - espace.espace2 }]}>
          <PageDots total={3} actif={etape} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  etape: { alignItems: 'center' },
});
