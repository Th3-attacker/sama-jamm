import { router } from 'expo-router';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { contientArabe } from '@/features/recherche/normaliser';
import { CarteSourate } from '@/features/lire/CarteSourate';
import { CarteVerset } from '@/features/lire/CarteVerset';
import { indexPret, preparerIndex, rechercher, VIDE, type ResultatVerset } from '@/features/recherche/recherche';
import type { Sourate } from '@/features/lire/coran';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { SearchField } from '@/ui/SearchField';

import { espace, interlignes, tailles } from '@/theme/tokens.generated';
type Ligne = Sourate | ResultatVerset;
type Filtre = 'tout' | 'coran' | 'invocations';
const FILTRES: Filtre[] = ['tout', 'coran', 'invocations'];

export default function Recherche() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  const insets = useSafeAreaInsets();
  const [filtre, setFiltre] = useState<Filtre>('tout');
  // La requête reste dans l'état de l'écran : elle survit à l'ouverture d'un verset et au retour.
  const [requete, setRequete] = useState('');
  // La frappe reste fluide : la recherche suit avec un léger retard.
  const requeteDiffree = useDeferredValue(requete);
  const translitActive = useReglages((s) => s.translitLecture);
  // Une requête en lettres latines trouve par la translittération : elle s'affiche alors, surlignée.
  const montrerTranslit = translitActive || (requeteDiffree.trim() !== '' && !contientArabe(requeteDiffree));
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

  const sections: { cle: string; titre: string; data: Ligne[] }[] = [
    { cle: 'sourates', titre: t('recherche.sourates'), data: resultats.sourates },
    {
      cle: 'versets',
      titre: `${t('recherche.versets')} · ${t('recherche.resultats', { count: resultats.totalVersets })}`,
      data: resultats.versets,
    },
  ].filter((s) => s.data.length > 0);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Champ de recherche et « Fermer », puis les filtres. */}
      <View
        style={[
          styles.entete,
          { paddingTop: insets.top + espace.espace3, paddingHorizontal: espace.espace5, gap: espace.espace2 },
        ]}>
        <View style={styles.champ}>
          <SearchField autoFocus placeholder={t('recherche.placeholder')} valeur={requete} onChange={setRequete} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('commun.fermer')} hitSlop={8} onPress={() => router.back()}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.fermer), { color: couleurs.encre }]}>
            {t('commun.fermer')}
          </Text>
        </Pressable>
      </View>
      <View style={[styles.filtres, { paddingHorizontal: espace.espace5, paddingTop: espace.espace4, paddingBottom: espace.espace3, gap: espace.espace2 }]}>
        {FILTRES.map((f) => (
          <Chip key={f} compacte selectionne={filtre === f} onPress={() => setFiltre(f)}>
            {f === 'tout' ? t('recherche.tout') : t(`lire.${f}`)}
          </Chip>
        ))}
      </View>

      {filtre === 'invocations' ? (
        <EmptyState
          icone="search"
          lang="fr"
          titre={t(`lire.${filtre}`)}
          texte={t('lire.invocationsAVenir')}
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
                  marginTop: espace.espace2,
                  padding: espace.espace4,
                  gap: espace.espace1,
                  backgroundColor: couleurs.surfaceCreux,
                  borderRadius: rayon.rayonCarte,
                }}>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
                  {t('recherche.videTitre')}
                </Text>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.aide), { color: couleurs.encre2 }]}>
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
              style={[typographie.libelle, styles.titreSection, { color: couleurs.encre3, paddingTop: espace.espace2, paddingBottom: espace.espace4 }]}>
              {section.titre}
            </Text>
          )}
          renderItem={({ item }) =>
            'versets' in item ? (
              <CarteSourate
                plat
                sourate={item}
                onPress={() => router.push({ pathname: '/coran/[sourate]', params: { sourate: item.n } })}
              />
            ) : (
              <CarteVerset
                plat
                surligner={requeteDiffree}
                sourate={item.sourate}
                verset={item.verset}
                texte={item.texte}
                translit={montrerTranslit ? item.translit : undefined}
                onPress={() =>
                  router.push({
                    pathname: '/coran/[sourate]',
                    params: { sourate: item.sourate, verset: item.verset, mode: 'verset' },
                  })
                }
              />
            )
          }
          contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace8 }}
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
  fermer: { fontSize: tailles.t16, lineHeight: interlignes.l24, paddingHorizontal: espace.espace2 },
  aide: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  titreSection: { textTransform: 'uppercase', letterSpacing: 0.84 },
});
