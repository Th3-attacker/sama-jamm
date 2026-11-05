import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, I18nManager, StyleSheet, Text, View, type LayoutRectangle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTaillesLecture } from '@/features/lire/BarreTaille';
import {
  basmalaDe,
  nombreDePages,
  pageDe,
  reperes,
  segmentsDePage,
  sourate,
  sourates,
  translitDe,
  type Sourate,
  versetsAvecTraduction,
} from '@/features/lire/coran';
import { PageMushaf } from '@/features/lire/PageMushaf';
import { cleJour } from '@/lib/dates';
import { ecouter, ecouterPage, useLecteur } from '@/features/ecouter/lecteur';
import { PartageVerset, type VersetAPartager } from '@/features/lire/PartageVerset';
import { TranslitVerset } from '@/features/lire/TranslitVerset';
import { cleVerset, useFavoris } from '@/stores/favoris';
import { usePleinEcran } from '@/stores/pleinEcran';
import { useLecture, type ModeLecture } from '@/stores/lecture';
import { affichagesLecture, useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { IconButton } from '@/ui/IconButton';
import { useToast } from '@/ui/Toast';
import { Button } from '@/ui/Button';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TopBar } from '@/ui/TopBar';

/** Une sourate est « lue » après ce délai à l'écran (section Lecture et audio du design). */
const SECONDES_POUR_UN_JOUR = 30;
const CONFIG_VISIBILITE = { itemVisiblePercentThreshold: 50 };
/** Une page compte comme affichée quand elle occupe plus de la moitié de l'écran. */
const CONFIG_PAGE_VISIBLE = { itemVisiblePercentThreshold: 60 };
const NUMEROS_DE_PAGES = Array.from({ length: nombreDePages }, (_, i) => i + 1);

export default function EcranSourate() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const params = useLocalSearchParams<{
    sourate?: string | string[];
    verset?: string | string[];
    mode?: string | string[];
  }>();

  const premier = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const s = sourate(Number(premier(params.sourate)));
  const verset = Number(premier(params.verset));
  const mode: ModeLecture = premier(params.mode) === 'verset' ? 'verset' : 'page';

  if (!s) {
    // Adresse invalide ou sourate inconnue : jamais de texte tronqué.
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('lire.titre')} />
        <View style={{ paddingHorizontal: espace.espace5 }}>
          <Banner ton="erreur" titre={t('etats.erreurTitre')}>
            {t('etats.erreurTexte')}
          </Banner>
        </View>
      </View>
    );
  }

  // `key` : changer de sourate repart d'un état neuf (mode verset, première page).
  return (
    <LectureSourate
      key={s.n}
      s={s}
      versetInitial={Number.isInteger(verset) && verset >= 1 && verset <= s.versets ? verset : 1}
      modeInitial={mode}
    />
  );
}

function LectureSourate({
  s,
  versetInitial,
  modeInitial,
}: {
  s: Sourate;
  versetInitial: number;
  modeInitial: ModeLecture;
}) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const mode = useReglages((st) => st.affichage);
  const translitActive = useReglages((st) => st.translitLecture);
  // Verset en cours d'écoute dans cette sourate : surligné dans la liste.
  const versetEcoute = useLecteur((st) => (st.position?.sourate === s.n ? st.position.verset : null));
  const translits = useMemo(() => (translitActive ? translitDe(s.n) : []), [s.n, translitActive]);
  const definirAffichage = useReglages((st) => st.definirAffichage);
  const enregistrerPosition = useLecture((st) => st.enregistrerPosition);
  const marquerJour = useLecture((st) => st.marquerJour);
  const favoris = useFavoris((st) => st.versets);
  const basculer = useFavoris((st) => st.basculer);
  const { afficher } = useToast();

  const [aPartager, setAPartager] = useState<VersetAPartager | null>(null);
  const basculerFavori = (verset: number) => {
    if (basculer(s.n, verset)) afficher({ texte: t('lire.favoriAjoute'), icone: 'check' });
  };
  // Vue mushaf (page justifiée) par défaut ; la bascule ouvre la lecture verset par verset.
  const [modePage, setModePage] = useState(modeInitial === 'page');
  const [page, setPage] = useState(() => pageDe(s.n, versetInitial) ?? 1);
  // Page sur laquelle s'ouvre la liste des pages ; `page` suit ensuite la page affichée.
  const [pageDepart, setPageDepart] = useState(page);
  // Mode page : la barre du haut apparaît et disparaît au toucher ; la zone mesurée dimensionne chaque page.
  const [barres, setBarres] = useState(false);
  const [zone, setZone] = useState<LayoutRectangle | null>(null);
  const insets = useSafeAreaInsets();
  // Mode page : plein écran, sans la barre des onglets ; un toucher sur la page la fait revenir avec la barre du haut.
  useEffect(() => {
    usePleinEcran.setState({ actif: modePage && !barres });
    return () => usePleinEcran.setState({ actif: false });
  }, [modePage, barres]);
  const basculerBarres = useCallback(() => setBarres((b) => !b), []);
  // Doit rester stable, comme pour la lecture verset par verset.
  const surPageVisible = useCallback(({ viewableItems }: { viewableItems: { item: number }[] }) => {
    const visible = viewableItems[0];
    if (visible) setPage(visible.item);
  }, []);
  const versets = useMemo(() => versetsAvecTraduction(s.n), [s.n]);
  const liste = useRef<FlatList>(null);
  const listePages = useRef<FlatList<number>>(null);
  // Écoute page par page : la page suit la récitation, comme si l'on suivait dans le mushaf.
  const pageEcoutee = useLecteur((st) => st.page);
  useEffect(() => {
    if (!modePage || pageEcoutee === null) return;
    listePages.current?.scrollToIndex({ index: pageEcoutee - 1, animated: true });
  }, [modePage, pageEcoutee]);
  // Premier verset visible en lecture verset par verset, enregistré à l'arrêt du défilement.
  const versetVisible = useRef(versetInitial);
  const reessai = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(reessai.current), []);

  // Un jour de lecture est compté après 30 secondes passées sur la sourate.
  useEffect(() => {
    const minuteur = setTimeout(() => marquerJour(cleJour(new Date())), SECONDES_POUR_UN_JOUR * 1000);
    return () => clearTimeout(minuteur);
  }, [marquerJour]);

  const enregistrerVerset = useCallback(
    () => enregistrerPosition({ sourate: s.n, verset: versetVisible.current, mode: 'verset' }),
    [enregistrerPosition, s.n],
  );
  // Doit rester stable : la FlatList refuse un rappel qui change entre deux rendus.
  const surVisibles = useCallback(({ viewableItems }: { viewableItems: { item: { n: number } }[] }) => {
    const premier = viewableItems[0];
    if (premier) versetVisible.current = premier.item.n;
  }, []);

  // En vue page : la position est le premier verset de la page affichée.
  useEffect(() => {
    if (!modePage) return;
    const debut = segmentsDePage(page)[0]?.versets[0];
    if (debut) enregistrerPosition({ sourate: debut.sourate, verset: debut.verset, mode: 'page' });
  }, [modePage, page, enregistrerPosition]);

  // Reprise en lecture verset par verset : on se place sur le verset enregistré.
  useEffect(() => {
    if (modePage || versetInitial <= 1) return;
    const minuteur = setTimeout(() => liste.current?.scrollToIndex({ index: versetInitial - 1, animated: false }), 0);
    return () => clearTimeout(minuteur);
  }, [modePage, versetInitial]);
  const sousTitre = `${t('lire.sourate')} ${s.n} · ${t('lire.versets', { count: s.versets })}`;
  const legende = [typographie.legende, { color: couleurs.encre3, textAlign: 'center' as const }];

  const basculerMode = () => {
    if (modePage) {
      // On reste sur le verset qui ouvre la page : la lecture verset par verset s'y place.
      const debut = segmentsDePage(page)[0]?.versets[0];
      versetVisible.current = debut?.sourate === s.n ? debut.verset : 1;
      setModePage(false);
      return;
    }
    const p = pageDe(s.n, versetVisible.current) ?? 1;
    setPage(p);
    setPageDepart(p);
    setModePage(true);
  };

  // --- Mode page (mushaf) ---------------------------------------------------------------------
  const premierSegment = modePage ? segmentsDePage(page)[0] : undefined;
  const nomPage = premierSegment ? (sourate(premierSegment.sourate)?.nom ?? s.nom) : s.nom;

  const barre = (
    <TopBar
      retour
      titre={modePage ? nomPage : s.nom}
      sousTitre={
        modePage && premierSegment
          ? `${t('lire.pageN', { n: page })} · ${t('lire.juz', { n: reperes().juzDe(premierSegment.sourate, premierSegment.versets[0]?.verset ?? 1) })}`
          : modePage
            ? t('lire.pageN', { n: page })
            : sousTitre
      }
      actions={
        modePage
          ? [
              { icone: 'list', label: t('lire.modeVerset'), onPress: basculerMode },
              { icone: 'headphones', label: t('ecouter.ecouterPage'), onPress: () => ecouterPage(page) },
            ]
          : [{ icone: 'book', label: t('lire.modePage'), onPress: basculerMode }]
      }
    />
  );

  if (modePage) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <View
          style={[styles.ecran, styles.coupe]}
          // Mesurée barres masquées : la barre des onglets passe ensuite par-dessus, la page ne se recalcule pas.
          onLayout={(e) => {
            if (!barres || !zone) setZone(e.nativeEvent.layout);
          }}>
          {zone ? (
            <FlatList
              ref={listePages}
              data={NUMEROS_DE_PAGES}
              horizontal
              pagingEnabled
              // Comme un mushaf : la page suivante arrive par la gauche. En arabe, la liste s'inverse déjà seule.
              inverted={!I18nManager.isRTL}
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={pageDepart - 1}
              getItemLayout={(_, index) => ({ length: zone.width, offset: zone.width * index, index })}
              initialNumToRender={1}
              maxToRenderPerBatch={1}
              windowSize={3}
              viewabilityConfig={CONFIG_PAGE_VISIBLE}
              onViewableItemsChanged={surPageVisible}
              keyExtractor={(p) => String(p)}
              renderItem={({ item }) => (
                <PageMushaf
                  page={item}
                  largeur={zone.width}
                  hauteur={zone.height}
                  hautSur={insets.top}
                  basSur={insets.bottom + espace.espace2}
                  onToucher={basculerBarres}
                />
              )}
            />
          ) : null}
        </View>
        {/* Un toucher sur la page affiche la barre par-dessus la page, sans la déplacer. */}
        {barres ? <View style={[styles.barreFlottante, { borderBottomColor: couleurs.ligne }]}>{barre}</View> : null}
      </View>
    );
  }

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {barre}

      <View
        style={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace3,
        }}>
        <SegmentedControl
          label={t('lire.affichage')}
          options={[
            { id: 'arabeSeul', label: t('lire.arabeSeul') },
            { id: 'arabeTrad', label: t('lire.arabeTrad') },
            { id: 'tradSeule', label: t('lire.tradSeule') },
          ]}
          valeur={mode}
          onChange={(id) => {
            const choix = affichagesLecture.find((x) => x === id);
            if (choix) definirAffichage(choix);
          }}
        />
      </View>

      <FlatList
        key={String(s.n)}
        ref={liste}
        data={versets}
        viewabilityConfig={CONFIG_VISIBILITE}
        onViewableItemsChanged={surVisibles}
        onScrollEndDrag={enregistrerVerset}
        onMomentumScrollEnd={enregistrerVerset}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          // Verset pas encore mesuré : on s'en approche, puis on réessaie.
          liste.current?.scrollToOffset({ offset: averageItemLength * index, animated: false });
          clearTimeout(reessai.current);
          reessai.current = setTimeout(() => liste.current?.scrollToIndex({ index, animated: false }), 100);
        }}
        keyExtractor={(v) => String(v.n)}
        ListHeaderComponent={<Entete sourate={s.n} mode={mode} />}
        ItemSeparatorComponent={() => <View style={[styles.ligneFine, { backgroundColor: couleurs.ligne }]} />}
        renderItem={({ item }) => {
          const repere = reperes().repereDe(s.n, item.n);
          const sajda = reperes().sajdaDe(s.n, item.n);
          return (
          <View style={{ gap: espace.espace2 }}>
            {repere ? (
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.libelle, styles.repere, { color: couleurs.orTexte }]}>
                {repere.type === 'juz'
                  ? `۞ ${t('lire.juz', { n: repere.juz })}`
                  : `۞ ${t(`lire.quartsHizb.${repere.quart}`, { n: repere.hizb })}`}
              </Text>
            ) : null}
          <View
            style={[
              styles.verset,
              { gap: espace.espace3 },
              versetEcoute === item.n ? { backgroundColor: couleurs.orDoux, borderRadius: rayon.rayonCarte } : null,
            ]}>
            <View
              style={[
                styles.numero,
                {
                  backgroundColor: couleurs.orDoux,
                  borderRadius: rayon.rayonPastille,
                },
              ]}>
              <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.libelle, { color: couleurs.orTexte }]}>
                {item.n}
              </Text>
            </View>
            <View style={styles.textes}>
              {mode !== 'tradSeule' ? (
                <Text
                  accessibilityLanguage="ar"
                  maxFontSizeMultiplier={echelleMax.grand}
                  style={[typographie.coran, tailleArabe, styles.arabe, { color: couleurs.encre }]}>
                  {item.texte}
                </Text>
              ) : null}
              {mode !== 'tradSeule' && translits[item.n - 1] ? (
                <TranslitVerset texte={translits[item.n - 1] ?? ''} taille={tailleTrad} />
              ) : null}
              {mode !== 'arabeSeul' && item.trad ? (
                <Text
                  maxFontSizeMultiplier={echelleMax.grand}
                  style={[typographie.lecture, tailleTrad, { color: couleurs.encre2 }]}>
                  {item.trad}
                </Text>
              ) : null}
              <View style={styles.actions}>
                <IconButton
                  icone="bookmark"
                  actif={favoris.includes(cleVerset(s.n, item.n))}
                  label={t(favoris.includes(cleVerset(s.n, item.n)) ? 'lire.favoriRetirer' : 'lire.favoriAjouter')}
                  onPress={() => basculerFavori(item.n)}
                />
                <IconButton
                  icone="headphones"
                  actif={versetEcoute === item.n}
                  label={t('ecouter.ecouterVerset')}
                  onPress={() => {
                    ecouter({ sourate: s.n, verset: item.n });
                    router.push('/ecouter/lecteur');
                  }}
                />
                <IconButton
                  icone="share"
                  label={t('partage.titre')}
                  onPress={() => setAPartager({ sourate: s.n, nomSourate: s.nom, n: item.n, texte: item.texte, trad: item.trad })}
                />
              </View>
              {sajda ? (
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.orTexte }]}>
                  {`۩ ${t(sajda === 'obligatoire' ? 'lire.sajdaObligatoire' : 'lire.sajda')}`}
                </Text>
              ) : null}
            </View>
          </View>
          </View>
          );
        }}
        extraData={[favoris, translits, versetEcoute]}
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace4,
        }}
        initialNumToRender={8}
        ListFooterComponent={
          <View style={{ gap: espace.espace4, paddingTop: espace.espace5 }}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={legende}>
              {t('lire.finSourate')}
            </Text>
            {sourates[s.n] ? (
              <Button
                variant="secondaire"
                pleineLargeur
                onPress={() =>
                  router.replace({
                    pathname: '/lire/coran/[sourate]',
                    params: { sourate: sourates[s.n].n },
                  })
                }>
                {`${t('lire.souratesuivante')} · ${sourates[s.n].nom}`}
              </Button>
            ) : null}
            {s.n > 1 ? (
              <Button
                variant="secondaire"
                pleineLargeur
                onPress={() =>
                  router.replace({
                    pathname: '/lire/coran/[sourate]',
                    params: { sourate: s.n - 1 },
                  })
                }>
                {`${t('lire.souratePrecedente')} · ${sourates[s.n - 2].nom}`}
              </Button>
            ) : null}
          </View>
        }
      />
      <PartageVerset verset={aPartager} onFermer={() => setAPartager(null)} />
    </View>
  );
}

/** En-tête coranique d'une sourate (nom arabe dans un bandeau vert, basmala). */
function Entete({ sourate: n, mode }: { sourate: number; mode: string }) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const meta = sourate(n);
  const basmala = basmalaDe(n);
  if (!meta) return null;

  return (
    <View style={{ gap: espace.espace4, paddingBottom: espace.espace2 }}>
      {mode !== 'tradSeule' ? (
        <View
          style={[
            styles.bandeau,
            {
              borderColor: couleurs.emeraude,
              backgroundColor: couleurs.emeraudeDoux,
              borderRadius: rayon.rayonCarte,
            },
          ]}>
          <Text
            accessibilityRole="header"
            accessibilityLanguage="ar"
            maxFontSizeMultiplier={echelleMax.grand}
            style={[typographie.coran, tailleArabe, styles.centre, { color: couleurs.emeraude }]}>
            {meta.arabe}
          </Text>
        </View>
      ) : null}

      {/* Basmala : toujours en arabe, seule sur sa ligne, dans tous les modes. */}
      {basmala ? (
        <Text
          accessibilityLanguage="ar"
          maxFontSizeMultiplier={echelleMax.grand}
          style={[typographie.coran, tailleArabe, styles.centre, { color: couleurs.encre }]}>
          {basmala.arabe}
        </Text>
      ) : null}
      {basmala && mode !== 'arabeSeul' && basmala.trad ? (
        <Text
          maxFontSizeMultiplier={echelleMax.grand}
          style={[typographie.lecture, tailleTrad, styles.centre, { color: couleurs.encre2 }]}>
          {basmala.trad}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  coupe: { overflow: 'hidden' },
  centre: { textAlign: 'center', writingDirection: 'rtl' },
  bandeau: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  ligneFine: { height: StyleSheet.hairlineWidth },
  verset: { flexDirection: 'row', alignItems: 'flex-start' },
  numero: {
    minWidth: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: { flex: 1, gap: 4 },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  repere: { textAlign: 'center' },
  barreFlottante: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomWidth: StyleSheet.hairlineWidth },
});
