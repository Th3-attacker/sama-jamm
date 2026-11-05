import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

import { CATEGORIES } from './donnees';
import { chapitresHisn, titreDe } from './hisn';

/** Bibliothèque des invocations : les moments du Coran, puis les chapitres de la Citadelle du musulman. */
export function ListeCategories() {
  const { t, i18n } = useTranslation();
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
        {chapitresHisn().map((c) => (
          <ListItem
            key={c.id}
            numero={c.id}
            prefixe={t('invocations.chapitre')}
            titre={titreDe(c, i18n.language)}
            onPress={() => router.push({ pathname: '/lire/hisn/[chapitre]', params: { chapitre: c.id } })}
          />
        ))}
      </ListGroup>
    </View>
  );
}
