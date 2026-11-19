import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import type { IconName } from '@/ui/types';

import { categories, invocationsDe } from './donnees';

// Icônes du jeu existant : le jour pour le matin, la lune pour le soir, le sommeil et la nuit ; le livre sinon.
const ICONES: Record<string, IconName> = {
  morning: 'sun',
  evening: 'moon',
  after_prayer: 'check-circle',
  sleep: 'moon',
  travel: 'compass',
};

/** Bibliothèque des invocations : un seul bloc avec les moments de la journée, puis le total (planche « Invocations · moments »). */
export function ListeCategories() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const total = categories().reduce((somme, c) => somme + invocationsDe(c.id).length, 0);
  return (
    <View style={{ paddingTop: espace.espace3, gap: espace.espace3 }}>
      <ListGroup titre={t('invocations.moments')}>
        {categories().map((c) => (
          <ListItem
            key={c.id}
            icone={ICONES[c.id] ?? 'book'}
            titre={t(`invocations.categories.${c.id}`)}
            sousTitre={t('invocations.nbInvocations', { count: invocationsDe(c.id).length })}
            fin="chevron"
            onPress={() => router.push({ pathname: '/lire/invocations/[categorie]', params: { categorie: c.id } })}
          />
        ))}
      </ListGroup>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, styles.total, { color: couleurs.encre3 }]}>
        {t('invocations.totalInvocations', { count: total })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  total: { textAlign: 'center' },
});
