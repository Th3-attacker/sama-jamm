import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';

import type { FiltreHistorique, OperationHistorique } from '@/features/budget/depot';
import { iconeEnveloppe } from '@/features/budget/enveloppesDeDepart';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { useBudget } from '@/features/budget/useBudget';
import { formatJourCle } from '@/lib/dates';
import { formatMontant } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

const FILTRES: readonly FiltreHistorique[] = ['tout', 'depenses', 'revenus'];

/** Toutes les opérations du cycle, groupées par jour ; toucher une opération ouvre sa correction. */
export default function Historique() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const [filtre, setFiltre] = useState<FiltreHistorique>('tout');
  const etat = useBudget((depot, carnet) => depot.historique(carnet, filtre), filtre);

  const filtres = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.puces}
      contentContainerStyle={{ gap: espace.espace2, paddingHorizontal: espace.espace5, paddingBottom: espace.espace3 }}>
      {FILTRES.map((f) => (
        <Chip key={f} selectionne={f === filtre} onPress={() => setFiltre(f)}>
          {t(`budget.filtres.${f}`)}
        </Chip>
      ))}
    </ScrollView>
  );

  if (etat.etat !== 'pret') {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('budget.historique')} />
        <EtatsBudget etat={etat} />
      </View>
    );
  }

  const devise = etat.carnet.devise;
  // Un groupe par jour, dans l'ordre déjà trié (le plus récent d'abord).
  const sections: { titre: string; data: OperationHistorique[] }[] = [];
  for (const o of etat.donnees.operations) {
    const titre = formatJourCle(o.date, i18n.language);
    const derniere = sections[sections.length - 1];
    if (derniere && derniere.titre === titre) derniere.data.push(o);
    else sections.push({ titre, data: [o] });
  }

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('budget.historique')} />
      {filtres}
      <SectionList
        sections={sections}
        keyExtractor={(o) => o.id}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <EmptyState icone="list" titre={t('formules.serenite')} texte={t('budget.historiqueVide')} />
        }
        renderSectionHeader={({ section }) => (
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[
              typographie.libelle,
              { color: couleurs.encre2, paddingTop: espace.espace4, paddingBottom: espace.espace2 },
            ]}>
            {section.titre}
          </Text>
        )}
        renderItem={({ item: o }) => {
          const revenu = o.type === 'revenu';
          return (
            <ListItem
              icone={revenu ? 'wallet' : iconeEnveloppe(o.icone ?? '')}
              ton={revenu ? 'emeraude' : undefined}
              titre={o.note ?? o.enveloppe ?? t('budget.recu')}
              sousTitre={[revenu ? t('budget.recu') : o.enveloppe, o.compte].filter(Boolean).join(' · ')}
              valeur={`${revenu ? '+ ' : ''}${formatMontant(o.montant, devise)}`}
              onPress={() => router.push({ pathname: '/budget/operation/[id]', params: { id: o.id } })}
            />
          );
        }}
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  puces: { flexGrow: 0 },
});
