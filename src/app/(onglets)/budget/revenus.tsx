import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFormatMontant } from '@/features/budget/verrou';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { FeuilleRevenu } from '@/features/budget/FeuilleRevenu';
import { useBudget } from '@/features/budget/useBudget';
import { formatJourCle } from '@/lib/dates';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

/** Revenus du cycle en cours ; toucher un revenu ouvre sa correction. */
export default function Revenus() {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie } = useTheme();
  const etat = useBudget(async (depot, carnet) => ({
    ...(await depot.revenusDuCycle(carnet)),
    comptes: await depot.comptes(carnet.id),
  }));
  const [feuille, setFeuille] = useState(false);

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
          <Button variant="secondaire" icone="plus" pleineLargeur onPress={() => setFeuille(true)}>
            {t('budget.ajouterRevenu')}
          </Button>
        </ScrollView>
      )}
      {etat.etat === 'pret' ? (
        <FeuilleRevenu
          ouvert={feuille}
          onFermer={() => setFeuille(false)}
          carnet={etat.carnet}
          depot={etat.depot}
          comptes={etat.donnees.comptes}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
