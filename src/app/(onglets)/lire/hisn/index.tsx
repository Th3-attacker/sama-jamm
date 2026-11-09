import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CATEGORIES_HISN, idsDeCategorie } from '@/features/invocations/categoriesHisn';
import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

/** La citadelle du musulman (Hisn al-Muslim) : ses catégories, puis les chapitres de chacune. */
export default function EcranHisn() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('invocations.hisn')} sousTitre={t('invocations.hisnAide')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 }}>
        <ListGroup note={t('invocations.noteHisn')}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
