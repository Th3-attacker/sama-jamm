import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { chapitreHisn, titreDe } from '@/features/invocations/hisn';
import { CarteVerset } from '@/features/lire/CarteVerset';
import { traductionDe, versetsDe } from '@/features/lire/coran';
import { useFavoris } from '@/stores/favoris';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

type Filtre = 'tous' | 'versets' | 'chants' | 'invocations';
const FILTRES: Filtre[] = ['tous', 'versets', 'chants', 'invocations'];
/** Versets et chapitres de la Citadelle se mettent en favori ; les chants restent à zéro. */
const compter = (id: Filtre, versets: number, invocations: number) =>
  id === 'tous' ? versets + invocations : id === 'versets' ? versets : id === 'invocations' ? invocations : 0;

type Favori = { sourate: number; verset: number };

/** « 18:46 » → { sourate: 18, verset: 46 } ; ignore une clé illisible plutôt que d'afficher un verset vide. */
function lire(cle: string): Favori | null {
  const [s, v] = cle.split(':').map(Number);
  return Number.isInteger(s) && Number.isInteger(v) && versetsDe(s)[v - 1] ? { sourate: s, verset: v } : null;
}

export default function Favoris() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const cles = useFavoris((s) => s.versets);
  const favoris = cles.map(lire).filter((f): f is Favori => f !== null);
  const chapitres = useFavoris((s) => s.invocations).flatMap((id) => {
    const c = chapitreHisn(Number(id));
    return c ? [c] : [];
  });
  const versetsVisibles = filtre === 'tous' || filtre === 'versets';
  const chapitresVisibles = filtre === 'tous' || filtre === 'invocations';

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('favoris.titre')} sousTitre={t('favoris.sousTitre')} />
      {favoris.length === 0 && chapitres.length === 0 ? (
        <EmptyState
          titre={t('formules.serenite')}
          sousTitre={t('formules.sereniteTrad')}
          texte={t('favoris.videTexte')}
          action={{ label: t('favoris.ouvrirBibliotheque'), icone: 'book', onPress: () => router.push('/lire') }}
        />
      ) : (
        <FlatList
          data={versetsVisibles ? favoris : []}
          keyExtractor={(f) => `${f.sourate}:${f.verset}`}
          ListHeaderComponent={
            <View style={{ gap: espace.espace3, paddingBottom: espace.espace3 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={t('favoris.filtrer')} contentContainerStyle={{ gap: espace.espace2 }}>
                {FILTRES.map((id) => (
                  <Chip key={id} selectionne={filtre === id} compte={compter(id, favoris.length, chapitres.length)} onPress={() => setFiltre(id)}>
                    {t(`favoris.${id}`)}
                  </Chip>
                ))}
              </ScrollView>
              {versetsVisibles && favoris.length > 0 ? (
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                  {t('favoris.versets')} · {favoris.length}
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            filtre === 'chants' ? (
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                {t('favoris.chantsAVenir')}
              </Text>
            ) : undefined
          }
          ListFooterComponent={
            chapitresVisibles && chapitres.length > 0 ? (
              <View style={{ paddingTop: espace.espace4 }}>
                <ListGroup titre={t('favoris.chantsInvocations')}>
                  {chapitres.map((c) => (
                    <ListItem
                      key={c.id}
                      icone="book"
                      titre={titreDe(c, i18n.language)}
                      sousTitre={t('favoris.invocationCitadelle')}
                      fin="chevron"
                      onPress={() => router.push({ pathname: '/lire/hisn/[chapitre]', params: { chapitre: String(c.id) } })}
                    />
                  ))}
                </ListGroup>
              </View>
            ) : undefined
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
