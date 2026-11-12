import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { LigneDette } from '@/features/budget/LigneDette';
import { useBudget } from '@/features/budget/useBudget';
import { useTheme } from '@/theme/useTheme';
import { EmptyState } from '@/ui/EmptyState';
import { ListGroup } from '@/ui/ListGroup';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

/** Dettes soldées et annulées, les plus récentes d'abord ; chacune garde son historique. */
export default function DettesSoldees() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const marge = useMargeBasse();
  const etat = useBudget((depot, carnet) => depot.dettes(carnet, 'closes'));

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('dettes.soldeesTitre')} />
      {etat.etat !== 'pret' ? (
        <EtatsBudget etat={etat} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace8 + marge }}>
          {etat.donnees.length > 0 ? (
            <ListGroup>
              {etat.donnees.map((d) => (
                <LigneDette key={d.id} dette={d} devise={etat.carnet.devise} />
              ))}
            </ListGroup>
          ) : (
            <EmptyState icone="check" lang="fr" titre={t('dettes.aucuneClose')} />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
