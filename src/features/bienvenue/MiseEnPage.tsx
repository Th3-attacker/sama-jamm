import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { echelleMax } from '@/theme/typographie';
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
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace6, gap: espace.espace4 }}>
        {children}
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace4, gap: espace.espace2 }}>
        {actions}
        <View style={[styles.etape, { marginTop: espace.espace3 }]}>
          <PageDots total={3} actif={etape} />
          <Text
            importantForAccessibility="no"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.legende, { color: couleurs.encre3, marginTop: espace.espace2 }]}>
            {t('bienvenue.etape', { n: etape + 1, total: 3 })}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  etape: { alignItems: 'center' },
});
