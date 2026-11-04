import { router } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { CarteSourate } from '@/features/lire/CarteSourate';
import { CarteVerset } from '@/features/lire/CarteVerset';
import { rechercher, type ResultatVerset } from '@/features/recherche/recherche';
import type { Sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { EmptyState } from '@/ui/EmptyState';
import { SearchField } from '@/ui/SearchField';
import { TopBar } from '@/ui/TopBar';

type Ligne = Sourate | ResultatVerset;

export default function Recherche() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  // La requête reste dans l'état de l'écran : elle survit à l'ouverture d'un verset et au retour.
  const [requete, setRequete] = useState('');
  // La frappe reste fluide : la recherche suit avec un léger retard.
  const requeteDiffree = useDeferredValue(requete);
  const resultats = useMemo(() => rechercher(requeteDiffree), [requeteDiffree]);
  const recherche = requeteDiffree.trim().length > 0;
  const aucun = recherche && resultats.sourates.length === 0 && resultats.versets.length === 0;

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
      <TopBar retour titre={t('recherche.titre')} />
      <View style={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace3 }}>
        <SearchField autoFocus placeholder={t('recherche.placeholder')} valeur={requete} onChange={setRequete} />
      </View>

      {aucun ? (
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
          ListEmptyComponent={
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.legende, { color: couleurs.encre3, textAlign: 'center' }]}>
              {recherche ? '' : t('recherche.aide')}
            </Text>
          }
          renderSectionHeader={({ section }) => (
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.libelle, { color: couleurs.encre2, paddingVertical: espace.espace2 }]}>
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
});
