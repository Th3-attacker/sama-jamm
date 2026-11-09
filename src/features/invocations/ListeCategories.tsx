import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';
import type { IconName } from '@/ui/types';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

import { CATEGORIES, invocationsDe, type CategorieId } from './donnees';

// Pas d'icône « lit » dans le jeu d'icônes : le sommeil prend la lune, comme le soir.
const ICONES: Record<CategorieId, IconName> = {
  matin: 'sun',
  soir: 'moon',
  sommeil: 'moon',
};

type Moment = { id: CategorieId; nombre: number; ouvrir: () => void };

/** Bibliothèque des invocations : les moments du Coran, puis les catégories de la Citadelle du musulman. */
export function ListeCategories() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  // Les trois moments, faits de versets du Coran avec la lecture complète.
  const moments: Moment[] = CATEGORIES.map((c) => ({
    id: c,
    nombre: invocationsDe(c).length,
    ouvrir: () => router.push({ pathname: '/lire/invocations/[categorie]', params: { categorie: c } }),
  }));
  const rangees = Array.from({ length: Math.ceil(moments.length / 2) }, (_, i) => moments.slice(i * 2, i * 2 + 2));
  return (
    <View style={{ paddingTop: espace.espace3, gap: espace.espace5 }}>
      {/* Planche : « Moments » et leur nombre, puis une grille de deux colonnes de cartes. */}
      <View style={{ gap: espace.espace3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.titre3, { color: couleurs.encre }]}>
            {t('invocations.moments')}
          </Text>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { fontSize: 14, lineHeight: 20, color: couleurs.encre3 }]}>
            {moments.length}
          </Text>
        </View>
        {rangees.map((rangee) => (
          <View key={rangee.map((m) => m.id).join('-')} style={{ flexDirection: 'row', gap: espace.espace3 }}>
            {rangee.map(({ id: c, nombre, ouvrir }) => {
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={`${t(`invocations.${c}`)}, ${nombre}`}
                  onPress={ouvrir}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: espace.espace3,
                    padding: espace.espace3,
                    borderWidth: 1,
                    borderColor: couleurs.ligne,
                    borderRadius: rayon.rayonCarte,
                    backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.surface,
                  })}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: rayon.rayonPastille,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: couleurs.emeraudeDoux,
                    }}>
                    <Icon name={ICONES[c]} size={20} color={couleurs.surEmeraudeDoux} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={2} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
                      {t(`invocations.${c}`)}
                    </Text>
                    <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { fontSize: 14, lineHeight: 20, color: couleurs.encre3 }]}>
                      {nombre}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            {rangee.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
