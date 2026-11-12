import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CarteVerset } from '@/features/lire/CarteVerset';
import { translitDe, versetsDe } from '@/features/lire/coran';
import { translitSansBalises } from '@/features/lire/reperes';
import { useReglages } from '@/stores/reglages';
import { useFavoris } from '@/stores/favoris';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { TopBar } from '@/ui/TopBar';

type Filtre = 'tous' | 'versets' | 'invocations';
const FILTRES: Filtre[] = ['tous', 'versets', 'invocations'];
/** Seuls les versets se mettent en favori pour l'instant : les invocations restent à zéro. */
const compter = (id: Filtre, versets: number) => (id === 'tous' || id === 'versets' ? versets : 0);

type Favori = { sourate: number; verset: number };

/** « 18:46 » → { sourate: 18, verset: 46 } ; ignore une clé illisible plutôt que d'afficher un verset vide. */
function lire(cle: string): Favori | null {
  const [s, v] = cle.split(':').map(Number);
  return Number.isInteger(s) && Number.isInteger(v) && versetsDe(s)[v - 1] ? { sourate: s, verset: v } : null;
}

export default function Favoris() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const translitActive = useReglages((s) => s.translitLecture);
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
          data={filtre === 'tous' || filtre === 'versets' ? favoris : []}
          keyExtractor={(f) => `${f.sourate}:${f.verset}`}
          ListHeaderComponent={
            <View style={{ gap: espace.espace3, paddingBottom: espace.espace3 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={t('favoris.filtrer')} contentContainerStyle={{ gap: espace.espace2 }}>
                {FILTRES.map((id) => (
                  <Chip key={id} selectionne={filtre === id} compte={compter(id, favoris.length)} onPress={() => setFiltre(id)}>
                    {t(`favoris.${id}`)}
                  </Chip>
                ))}
              </ScrollView>
              {filtre === 'tous' || filtre === 'versets' ? (
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                  {t('favoris.versets')} · {favoris.length}
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
              {t('favoris.chantsAVenir')}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={{ height: espace.espace2 }} />}
          renderItem={({ item }) => (
            <CarteVerset
              sourate={item.sourate}
              verset={item.verset}
              texte={versetsDe(item.sourate)[item.verset - 1] ?? ''}
              translit={translitActive ? translitSansBalises(translitDe(item.sourate)[item.verset - 1] ?? '') : undefined}
              onPress={() =>
                router.push({
                  pathname: '/coran/[sourate]',
                  params: { sourate: item.sourate, verset: item.verset, mode: 'verset' },
                })
              }
            />
          )}
          contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace8 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
