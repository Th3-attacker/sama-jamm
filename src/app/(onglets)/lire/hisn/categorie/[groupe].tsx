import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { chapitresDeCategorie, estCategorieHisn } from '@/features/invocations/categoriesHisn';
import { chapitresHisn, titreDe } from '@/features/invocations/hisn';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

/** Une catégorie de la Citadelle du musulman : la liste de ses chapitres. */
export default function EcranCategorieHisn() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace } = useTheme();
  const brut = useParametre('groupe');

  if (!estCategorieHisn(brut)) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('invocations.hisn')} />
        <View style={{ paddingHorizontal: espace.espace5 }}>
          <Banner ton="erreur" titre={t('etats.erreurTitre')}>
            {t('etats.erreurTexte')}
          </Banner>
        </View>
      </View>
    );
  }

  const chapitres = chapitresDeCategorie(brut, chapitresHisn());
  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        retour
        titre={t(`invocations.categories.${brut}`)}
        sousTitre={t('invocations.nbChapitres', { count: chapitres.length })}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 }}>
        <ListGroup note={t('invocations.noteHisn')}>
          {chapitres.map((c) => (
            <ListItem
              key={c.id}
              numero={c.id}
              prefixe={t('invocations.chapitre')}
              titre={titreDe(c, i18n.language)}
              onPress={() => router.push({ pathname: '/lire/hisn/[chapitre]', params: { chapitre: c.id } })}
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
