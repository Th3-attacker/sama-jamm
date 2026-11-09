import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EcranVerrou } from '@/features/budget/EcranVerrou';
import { useVerrouBudget } from '@/features/budget/verrou';
import { SondeBarre } from '@/features/ecouter/SondeBarre';

export default function BudgetLayout() {
  const { t } = useTranslation();
  const { verrouille, deverrouiller } = useVerrouBudget(t('budget.verrouPrompt'));
  // Verrou actif : aucun écran du budget n'est monté, donc aucune donnée n'est lue ni affichée.
  if (verrouille) return <EcranVerrou deverrouiller={deverrouiller} />;
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <SondeBarre />
    </View>
  );
}
