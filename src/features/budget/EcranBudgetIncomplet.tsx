import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { TopBar } from '@/ui/TopBar';

import { EtatsBudget } from './EtatsBudget';
import type { EtatBudget } from './useBudget';

/**
 * Écran du budget dont les données ne sont pas là : chargement, erreur, budget à créer (voir `EtatsBudget`),
 * ou bien données prêtes mais élément introuvable (`introuvable`, quand l'élément demandé n'existe plus).
 */
export function EcranBudgetIncomplet({
  titre,
  etat,
  introuvable,
}: {
  titre: string;
  etat: EtatBudget<unknown>;
  introuvable?: string;
}) {
  const { couleurs, espace } = useTheme();
  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={titre} />
      {etat.etat === 'pret' ? (
        introuvable ? (
          <View style={{ padding: espace.espace5 }}>
            <Banner ton="erreur">{introuvable}</Banner>
          </View>
        ) : null
      ) : (
        <EtatsBudget etat={etat} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
