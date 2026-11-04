import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CarteVerset } from '@/features/lire/CarteVerset';
import { traductionDe, versetsDe } from '@/features/lire/coran';
import { useFavoris } from '@/stores/favoris';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { EmptyState } from '@/ui/EmptyState';
import { TopBar } from '@/ui/TopBar';

type Favori = { sourate: number; verset: number };

/** « 18:46 » → { sourate: 18, verset: 46 } ; ignore une clé illisible plutôt que d'afficher un verset vide. */
function lire(cle: string): Favori | null {
  const [s, v] = cle.split(':').map(Number);
  return Number.isInteger(s) && Number.isInteger(v) && versetsDe(s)[v - 1] ? { sourate: s, verset: v } : null;
}

export default function Favoris() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const cles = useFavoris((s) => s.versets);
  const favoris = cles.map(lire).filter((f): f is Favori => f !== null);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('favoris.titre')} sousTitre={t('favoris.sousTitre')} />
      {favoris.length === 0 ? (
        <EmptyState
          titre={t('formules.serenite')}
          sousTitre={t('formules.sereniteTrad')}
          texte={t('favoris.videTexte')}
          action={{ label: t('favoris.ouvrirBibliotheque'), icone: 'book', onPress: () => router.push('/lire') }}
        />
      ) : (
        <FlatList
          data={favoris}
          keyExtractor={(f) => `${f.sourate}:${f.verset}`}
          ListHeaderComponent={
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.legende, { color: couleurs.encre3, paddingBottom: espace.espace3 }]}>
              {t('favoris.versets')} · {favoris.length}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={{ height: espace.espace2 }} />}
          renderItem={({ item }) => (
            <CarteVerset
              sourate={item.sourate}
              verset={item.verset}
              texte={versetsDe(item.sourate)[item.verset - 1] ?? ''}
              trad={traductionDe(item.sourate)[item.verset - 1]}
              onPress={() =>
                router.push({
                  pathname: '/lire/coran/[sourate]',
                  params: { sourate: item.sourate, verset: item.verset, mode: 'verset' },
                })
              }
            />
          )}
          contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
