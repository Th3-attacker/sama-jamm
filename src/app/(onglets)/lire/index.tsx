import { router, useScrollToTop } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ListeCategories } from '@/features/invocations/ListeCategories';
import { CarteSourate } from '@/features/lire/CarteSourate';
import { sourate, sourates, type Sourate } from '@/features/lire/coran';
import { pourcentageKhatm, progressionKhatm } from '@/features/lire/progression';
import { useMenuPlus } from '@/features/plus/MenuPlus';
import { useLecture } from '@/stores/lecture';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { EmptyState } from '@/ui/EmptyState';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TopBar } from '@/ui/TopBar';

function Separateur() {
  const { espace } = useTheme();
  return <View style={{ height: espace.espace2 }} />;
}

const VERSETS = sourates.map((s) => s.versets);

function ouvrirSourate(n: number) {
  router.push({ pathname: '/lire/coran/[sourate]', params: { sourate: n } });
}

export default function Lire() {
  // Toucher l'onglet actif ramène la liste en haut.
  const defilement = useRef<FlatList<Sourate>>(null);
  useScrollToTop(defilement);
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const menu = useMenuPlus();
  const [onglet, setOnglet] = useState<'coran' | 'xassaides' | 'invocations'>('coran');
  // Khatm : progression d'après le dernier verset lu, déjà enregistré par la lecture.
  const position = useLecture((s) => s.position);
  const repris = position ? sourate(position.sourate) : undefined;
  const pourcentage = position ? pourcentageKhatm(progressionKhatm(position, VERSETS)) : 0;

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        grand
        titre={t('lire.titre')}
        sousTitre={t('lire.sousTitre')}
        actions={[
          { icone: 'search', label: t('menuPlus.rechercher'), onPress: () => router.push('/plus/recherche') },
          menu.action,
        ]}
      />

      {/* Un seul défilement jusqu'à la barre des onglets : onglets, khatm, puis les 114 sourates. */}
      <FlatList ref={defilement}
        data={onglet === 'coran' ? sourates : []}
        keyExtractor={(s: Sourate) => String(s.n)}
        renderItem={({ item }) => <CarteSourate sourate={item} onPress={() => ouvrirSourate(item.n)} />}
        ItemSeparatorComponent={Separateur}
        ListHeaderComponent={
          <View style={{ gap: espace.espace4, paddingBottom: espace.espace4 }}>
            <SegmentedControl
              label={t('lire.bibliotheque')}
              options={[
                { id: 'coran', label: t('lire.coran') },
                { id: 'xassaides', label: t('lire.xassaides') },
                { id: 'invocations', label: t('lire.invocations') },
              ]}
              valeur={onglet}
              onChange={(id) => setOnglet(id === 'xassaides' || id === 'invocations' ? id : 'coran')}
            />
            {onglet === 'coran' && position && repris ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('lire.votreKhatm')}, ${t('lire.khatmRepris', { sourate: repris.nom, verset: position.verset })}, ${pourcentage} %`}
                onPress={() =>
                  router.push({
                    pathname: '/lire/coran/[sourate]',
                    params: { sourate: repris.n, verset: position.verset, mode: position.mode },
                  })
                }
                style={({ pressed }) => [
                  styles.khatm,
                  {
                    gap: espace.espace3,
                    padding: espace.espace4,
                    borderRadius: rayon.rayonCarte,
                    backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.surface,
                    borderColor: couleurs.ligne,
                  },
                ]}>
                <View style={[styles.khatmTexte, { gap: espace.espace2 }]}>
                  <Text
                    maxFontSizeMultiplier={echelleMax.courant}
                    style={[typographie.legende, { color: couleurs.encre2 }]}>
                    <Text style={[typographie.libelle, { color: couleurs.encre }]}>{t('lire.votreKhatm')}</Text>
                    {` · ${t('lire.khatmRepris', { sourate: repris.nom, verset: position.verset })}`}
                  </Text>
                  <View style={[styles.piste, { backgroundColor: couleurs.ligne, borderRadius: rayon.rayonPastille }]}>
                    <View
                      style={[
                        styles.piste,
                        {
                          width: `${pourcentage}%`,
                          backgroundColor: couleurs.emeraude,
                          borderRadius: rayon.rayonPastille,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text
                  maxFontSizeMultiplier={echelleMax.courant}
                  style={[typographie.libelle, { color: couleurs.emeraude }]}>
                  {`${pourcentage} %`}
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          onglet === 'invocations' ? (
            <ListeCategories />
          ) : (
          <EmptyState
            icone="book"
            lang="fr"
            titre={t('lire.aVenir')}
            texte={onglet === 'xassaides' ? t('lire.xassaidesAVenir') : t('lire.invocationsAVenir')}
          />
          )
        }
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />
      {menu.feuille}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  khatm: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  khatmTexte: { flex: 1 },
  piste: { height: 4 },
});
