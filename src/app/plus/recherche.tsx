import { router } from 'expo-router';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarteSourate } from '@/features/lire/CarteSourate';
import { CarteVerset } from '@/features/lire/CarteVerset';
import { indexPret, preparerIndex, rechercher, VIDE, type ResultatVerset } from '@/features/recherche/recherche';
import type { Sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { SearchField } from '@/ui/SearchField';

type Ligne = Sourate | ResultatVerset;
type Filtre = 'tout' | 'coran' | 'xassaides' | 'invocations';
const FILTRES: Filtre[] = ['tout', 'coran', 'xassaides', 'invocations'];

export default function Recherche() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const insets = useSafeAreaInsets();
  const [filtre, setFiltre] = useState<Filtre>('tout');
  // La requête reste dans l'état de l'écran : elle survit à l'ouverture d'un verset et au retour.
  const [requete, setRequete] = useState('');
  // La frappe reste fluide : la recherche suit avec un léger retard.
  const requeteDiffree = useDeferredValue(requete);
  // Index préparé par paquets après l'ouverture de l'écran ; la requête tapée entre-temps part dès qu'il est prêt.
  const [pret, setPret] = useState(indexPret);
  useEffect(() => {
    if (pret) return;
    let actif = true;
    // Un effet s'exécute après l'affichage : l'écran et le champ sont déjà là quand la préparation commence.
    preparerIndex()
      .then(() => {
        if (actif) setPret(true);
      })
      .catch((erreur: unknown) => console.error('Index de recherche non préparé', erreur));
    return () => {
      actif = false;
    };
  }, [pret]);
  const resultats = useMemo(() => (pret ? rechercher(requeteDiffree) : VIDE), [pret, requeteDiffree]);
  const enAttente = !pret && requeteDiffree.trim().length > 0;
  const recherche = requeteDiffree.trim().length > 0;
  const aucun = pret && recherche && resultats.sourates.length === 0 && resultats.versets.length === 0;

  const sections = [
    { cle: 'sourates', titre: t('recherche.sourates'), data: resultats.sourates as Ligne[] },
    {
      cle: 'versets',
      titre: `${t('recherche.versets')} · ${t('recherche.resultats', { count: resultats.totalVersets })}`,
      data: resultats.versets as Ligne[],
    },
  ].filter((s) => s.data.length > 0);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Champ de recherche et « Fermer », puis les filtres. */}
      <View
        style={[
          styles.entete,
          { paddingTop: insets.top + espace.espace3, paddingHorizontal: espace.espace5, gap: espace.espace3 },
        ]}>
        <View style={styles.champ}>
          <SearchField autoFocus placeholder={t('recherche.placeholder')} valeur={requete} onChange={setRequete} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('commun.fermer')} hitSlop={8} onPress={() => router.back()}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.emeraude }]}>
            {t('commun.fermer')}
          </Text>
        </Pressable>
      </View>
      <View style={[styles.filtres, { paddingHorizontal: espace.espace5, paddingVertical: espace.espace3, gap: espace.espace2 }]}>
        {FILTRES.map((f) => (
          <Chip key={f} selectionne={filtre === f} onPress={() => setFiltre(f)}>
            {f === 'tout' ? t('recherche.tout') : t(`lire.${f}`)}
          </Chip>
        ))}
      </View>

      {filtre === 'xassaides' || filtre === 'invocations' ? (
        <EmptyState
          icone="search"
          lang="fr"
          titre={t(`lire.${filtre}`)}
          texte={t(filtre === 'xassaides' ? 'lire.xassaidesAVenir' : 'lire.invocationsAVenir')}
        />
      ) : enAttente ? (
        <ActivityIndicator
          accessibilityLabel={t('recherche.titre')}
          color={couleurs.emeraude}
          style={{ marginTop: espace.espace6 }}
        />
      ) : aucun ? (
        <EmptyState
          icone="search"
          titre={t('recherche.aucun', { terme: requeteDiffree.trim() })}
          lang="fr"
          texte={t('recherche.aucunTexte')}
        />
      ) : (
        <SectionList
          sections={sections}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(ligne) => ('versets' in ligne ? `s${ligne.n}` : `v${ligne.sourate}:${ligne.verset}`)}
          stickySectionHeadersEnabled={false}
          ListFooterComponent={
            recherche && sections.length > 0 ? (
              <View
                style={{
                  marginTop: espace.espace5,
                  padding: espace.espace4,
                  gap: espace.espace1,
                  backgroundColor: couleurs.surfaceCreux,
                  borderRadius: rayon.rayonCarte,
                }}>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
                  {t('recherche.videTitre')}
                </Text>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
                  {t('recherche.aide')}
                </Text>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            recherche ? undefined : (
              <EmptyState icone="search" lang="fr" titre={t('recherche.videTitre')} texte={t('recherche.aide')} />
            )
          }
          renderSectionHeader={({ section }) => (
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.libelle, { color: couleurs.encre3, paddingVertical: espace.espace2, textTransform: 'uppercase', letterSpacing: 0.6 }]}>
              {section.titre}
            </Text>
          )}
          renderItem={({ item }) =>
            'versets' in item ? (
              <CarteSourate
                sourate={item}
                onPress={() => router.push({ pathname: '/lire/coran/[sourate]', params: { sourate: item.n } })}
              />
            ) : (
              <CarteVerset
                sourate={item.sourate}
                verset={item.verset}
                texte={item.texte}
                trad={item.trad}
                onPress={() =>
                  router.push({
                    pathname: '/lire/coran/[sourate]',
                    params: { sourate: item.sourate, verset: item.verset, mode: 'verset' },
                  })
                }
              />
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: espace.espace2 }} />}
          contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center' },
  champ: { flex: 1 },
  filtres: { flexDirection: 'row', flexWrap: 'wrap' },
});
