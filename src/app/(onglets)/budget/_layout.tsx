import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EcranVerrou } from '@/features/budget/EcranVerrou';
import { useVerrouBudget } from '@/features/budget/verrou';

export default function BudgetLayout() {
  const { t } = useTranslation();
  const { verrouille, deverrouiller } = useVerrouBudget(t('budget.verrouPrompt'));
  // Verrou actif : aucun écran du budget n'est monté, donc aucune donnée n'est lue ni affichée.
  if (verrouille) return <EcranVerrou deverrouiller={deverrouiller} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
