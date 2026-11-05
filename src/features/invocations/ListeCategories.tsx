import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

import { CATEGORIES } from './donnees';

/** Les moments de la journée : un toucher ouvre les invocations de ce moment. */
export function ListeCategories() {
  const { t } = useTranslation();
  const { espace } = useTheme();
  return (
    <View style={{ paddingTop: espace.espace3 }}>
      <ListGroup>
        {CATEGORIES.map((c) => (
          <ListItem
            key={c}
            icone="book"
            titre={t(`invocations.${c}`)}
            onPress={() => router.push({ pathname: '/lire/invocations/[categorie]', params: { categorie: c } })}
          />
        ))}
      </ListGroup>
    </View>
  );
}
