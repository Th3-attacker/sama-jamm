import { router } from 'expo-router';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
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
import { TopBar } from '@/ui/TopBar';

import { espace, interlignes, tailles } from '@/theme/tokens.generated';
type Ligne = Sourate | ResultatVerset;
type Filtre = 'tout' | 'coran' | 'invocations';
const FILTRES: Filtre[] = ['tout', 'coran', 'invocations'];

export type EcranRechercheProps = {
  /** Texte tapé. Il vit dans l'écran qui monte ce contenu : il survit à l'ouverture d'un verset et au retour. */
  requete: string;
  onRequete: (texte: string) => void;
  /**
   * `modale` : champ de l'app et bouton « Fermer » en haut (écran /plus/recherche, Android et liens existants).
   * `onglet` : onglet Recherche d'iPhone, le champ est celui du système (`Stack.SearchBar`), pas de « Fermer ».
   */
  mode: 'modale' | 'onglet';
  /** Onglet iPhone : ferme aussi le clavier du champ du système, que `Keyboard.dismiss()` ne rejoint pas. */
  onFermerClavier?: () => void;
};

/** Contenu de la recherche (filtres, sourates, versets, états vides), partagé par la modale et l'onglet iPhone. */
export function EcranRecherche({ requete, onRequete, mode, onFermerClavier }: EcranRechercheProps) {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  const insets = useSafeAreaInsets();
  // Toucher le vide ou faire défiler les résultats ferme le clavier.
  const fermerClavier = useCallback(() => {
    Keyboard.dismiss();
    onFermerClavier?.();
  }, [onFermerClavier]);
  const [filtre, setFiltre] = useState<Filtre>('tout');
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
      {/* Planche : titre « Recherche » en haut, fixe avec les filtres, au même niveau que Prière, Lire et Accueil (display 40/44). */}
      <TopBar
        gauche={
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.display, { color: couleurs.emeraude }]}>
            {t('recherche.titre')}
          </Text>
        }
      />
      {/* Modale : champ de recherche et « Fermer ». L'onglet iPhone a le champ du système, en bas. */}
      {mode === 'modale' ? (
        <View style={[styles.entete, { paddingHorizontal: espace.espace5, gap: espace.espace2 }]}>
          <View style={styles.champ}>
            <SearchField autoFocus placeholder={t('recherche.placeholder')} valeur={requete} onChange={onRequete} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('commun.fermer')} hitSlop={8} onPress={() => router.back()}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.fermer), { color: couleurs.encre }]}>
              {t('commun.fermer')}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <View style={[styles.filtres, { paddingHorizontal: espace.espace5, paddingTop: mode === 'onglet' ? 0 : espace.espace4, paddingBottom: espace.espace3, gap: espace.espace2 }]}>
        {FILTRES.map((f) => (
          <Chip key={f} compacte selectionne={filtre === f} onPress={() => setFiltre(f)}>
            {f === 'tout' ? t('recherche.tout') : t(`lire.${f}`)}
          </Chip>
        ))}
      </View>

      {filtre === 'invocations' || enAttente || aucun ? (
        // Zone sans liste : un toucher dans le vide ferme le clavier. Pas un élément d'accessibilité en plus.
        <Pressable accessible={false} style={styles.zoneVide} onPress={fermerClavier}>
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
          ) : (
            <EmptyState
              icone="search"
              titre={t('recherche.aucun', { terme: requeteDiffree.trim() })}
              lang="fr"
              texte={t('recherche.aucunTexte')}
            />
          )}
        </Pressable>
      ) : (
        <SectionList
          sections={sections}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={fermerClavier}
          keyExtractor={(ligne) => ('versets' in ligne ? `s${ligne.n}` : `v${ligne.sourate}:${ligne.verset}`)}
          stickySectionHeadersEnabled={false}
          // Onglet iPhone : le système décale la liste sous la barre d'onglets en verre et le champ du bas.
          contentInsetAdjustmentBehavior={mode === 'onglet' ? 'automatic' : undefined}
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
              style={[typographie.libelle, styles.titreSection, i18n.language === 'ar' ? styles.sansInterlettrage : null, { color: couleurs.encre3, paddingTop: espace.espace2, paddingBottom: espace.espace4 }]}>
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
          // Planche : 20 de marge de chaque côté, comme les filtres et l'en-tête.
          // Onglet iPhone : le champ du système flotte en bas (planche : 56 de haut) ; la fin de la liste passe au-dessus.
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: mode === 'onglet' ? espace.espace16 + insets.bottom : espace.espace8,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center' },
  // minWidth 0 : le champ rétrécit au lieu de pousser « Fermer » hors de l'écran (texte agrandi).
  champ: { flex: 1, minWidth: 0 },
  filtres: { flexDirection: 'row', flexWrap: 'wrap' },
  zoneVide: { flex: 1 },
  fermer: { flexShrink: 0, fontSize: tailles.t16, lineHeight: interlignes.l24, paddingHorizontal: espace.espace2 },
  aide: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  titreSection: { textTransform: 'uppercase', letterSpacing: 0.84 },
  // L'espacement des lettres casse la jointure de l'arabe.
  sansInterlettrage: { letterSpacing: 0 },
});
