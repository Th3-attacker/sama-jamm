import { router } from 'expo-router';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';

import { CarteSourate } from '@/features/lire/CarteSourate';
import { CarteVerset } from '@/features/lire/CarteVerset';
import { indexPret, preparerIndex, rechercher, VIDE, type ResultatVerset } from '@/features/recherche/recherche';
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
      <TopBar retour titre={t('recherche.titre')} />
      <View style={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace3 }}>
        <SearchField autoFocus placeholder={t('recherche.placeholder')} valeur={requete} onChange={setRequete} />
      </View>

      {enAttente ? (
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
