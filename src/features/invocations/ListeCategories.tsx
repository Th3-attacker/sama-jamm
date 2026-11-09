import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import type { IconName } from '@/ui/types';

import { CATEGORIES, invocationsDe, type CategorieId } from './donnees';
import { chapitresHisn } from './hisn';

// Pas d'icône « lit » dans le jeu d'icônes : le sommeil prend la lune, comme le soir.
const ICONES: Record<CategorieId, IconName> = {
  matin: 'sun',
  soir: 'moon',
  sommeil: 'moon',
};

/** Bibliothèque des invocations : un seul bloc avec les trois moments du Coran et la Citadelle du musulman. */
export function ListeCategories() {
  const { t } = useTranslation();
  const { espace } = useTheme();
  return (
    <View style={{ paddingTop: espace.espace3 }}>
      <ListGroup titre={t('invocations.moments')}>
        {CATEGORIES.map((c) => (
          <ListItem
            key={c}
            icone={ICONES[c]}
            titre={t(`invocations.${c}`)}
            sousTitre={String(invocationsDe(c).length)}
            fin="chevron"
            onPress={() => router.push({ pathname: '/lire/invocations/[categorie]', params: { categorie: c } })}
          />
        ))}
        {/* Hisn al-Muslim : son contenu a son propre espace (catégories, chapitres, lecteur). */}
        <ListItem
          icone="book"
          ton="or"
          titre={t('invocations.hisn')}
          sousTitre={t('invocations.nbChapitres', { count: chapitresHisn().length })}
          arabe="حصن المسلم"
          fin="chevron"
          onPress={() => router.push('/lire/hisn')}
        />
      </ListGroup>
    </View>
  );
}
