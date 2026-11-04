import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { useBudget } from '@/features/budget/useBudget';
import { formatJourCle } from '@/lib/dates';
import { formatMontant } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

/** Revenus du cycle en cours ; toucher un revenu ouvre sa correction. */
export default function Revenus() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const etat = useBudget((depot, carnet) => depot.revenusDuCycle(carnet));

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('budget.revenusTitre')} />
      {etat.etat !== 'pret' ? (
        <EtatsBudget etat={etat} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace4,
          }}>
          {etat.donnees.revenus.length === 0 ? (
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre3 }]}>
              {t('budget.aucunRevenu')}
            </Text>
          ) : (
            <ListGroup>
              {etat.donnees.revenus.map((r) => (
                <ListItem
                  key={r.id}
                  icone="wallet"
                  titre={r.note ?? t('budget.recu')}
                  sousTitre={[formatJourCle(r.date, i18n.language), r.compte].filter(Boolean).join(' · ')}
                  valeur={formatMontant(r.montant, etat.carnet.devise)}
                  onPress={() => router.push({ pathname: '/budget/operation/[id]', params: { id: r.id } })}
                />
              ))}
            </ListGroup>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
