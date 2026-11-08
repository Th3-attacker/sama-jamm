import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

import { CATEGORIES } from './donnees';
import { CATEGORIES_HISN, idsDeCategorie } from './categoriesHisn';

/** Bibliothèque des invocations : les moments du Coran, puis les catégories de la Citadelle du musulman. */
export function ListeCategories() {
  const { t } = useTranslation();
  const { espace } = useTheme();
  return (
    <View style={{ paddingTop: espace.espace3, gap: espace.espace5 }}>
      <ListGroup titre={t('invocations.sectionVersets')}>
        {CATEGORIES.map((c) => (
          <ListItem
            key={c}
            icone="book"
            titre={t(`invocations.${c}`)}
            onPress={() => router.push({ pathname: '/lire/invocations/[categorie]', params: { categorie: c } })}
          />
        ))}
      </ListGroup>
      <ListGroup titre={t('invocations.hisn')} note={t('invocations.noteHisn')}>
        {CATEGORIES_HISN.map((c) => (
          <ListItem
            key={c}
            icone="book"
            titre={t(`invocations.categories.${c}`)}
            sousTitre={t('invocations.nbChapitres', { count: idsDeCategorie(c).length })}
            onPress={() => router.push({ pathname: '/lire/hisn/categorie/[groupe]', params: { groupe: c } })}
          />
        ))}
      </ListGroup>
    </View>
  );
}
