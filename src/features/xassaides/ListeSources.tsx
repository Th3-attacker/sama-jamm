import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

import { SOURCES } from './catalogue';

/** Onglet Xassaïdes de Lire : les sources, avec le nombre d'audios de chacune. */
export function ListeSources() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  return (
    <View style={{ gap: espace.espace4 }}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
        {t('xassaides.intro')}
      </Text>
      <ListGroup titre={t('xassaides.sources')}>
        {SOURCES.map((s) => (
          <ListItem
            key={s.id}
            icone="headphones"
            titre={s.nom}
            sousTitre={`${t(`xassaides.genres.${s.genre}`)} · ${t('xassaides.audios', { count: s.pistes.length })}`}
            fin="chevron"
            onPress={() => router.push({ pathname: '/lire/xassaides/[recitant]', params: { recitant: s.id } })}
          />
        ))}
      </ListGroup>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
        {t('xassaides.reseau')}
      </Text>
    </View>
  );
}
