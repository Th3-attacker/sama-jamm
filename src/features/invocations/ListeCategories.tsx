import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import type { IconName } from '@/ui/types';

import { categories, invocationsDe } from './donnees';

// Icônes du jeu existant : le jour pour le matin, la lune pour le soir, le sommeil et la nuit ; le livre sinon.
const ICONES: Record<string, IconName> = {
  morning: 'sun',
  evening: 'moon',
  sleep: 'moon',
  night_prayer: 'moon',
  travel: 'compass',
  home: 'home',
  masjid: 'kaaba',
  marriage: 'heart',
  business: 'cart',
};

/** Bibliothèque des invocations : un seul bloc avec les 16 catégories. */
export function ListeCategories() {
  const { t } = useTranslation();
  const { espace } = useTheme();
  return (
    <View style={{ paddingTop: espace.espace3 }}>
      <ListGroup titre={t('lire.invocations')}>
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
    </View>
  );
}
