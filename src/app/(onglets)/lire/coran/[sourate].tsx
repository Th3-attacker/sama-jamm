import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, I18nManager, Pressable, StyleSheet, Text, View, type LayoutRectangle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BasculeMode } from '@/features/lire/BasculeMode';
import { useTaillesLecture } from '@/features/lire/BarreTaille';
import {
  basmalaDe,
  sensDe,
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
import { ReglagesLecture } from '@/features/lire/ReglagesLecture';
import { enChiffresArabes } from '@/lib/chiffres';
import { Etoile } from '@/ui/Etoile';
import { Medaillon } from '@/ui/Medaillon';
import { TranslitVerset } from '@/features/lire/TranslitVerset';
import { cleVerset, useFavoris } from '@/stores/favoris';
import { usePleinEcran } from '@/stores/pleinEcran';
import { useLecture, type ModeLecture } from '@/stores/lecture';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { IconButton } from '@/ui/IconButton';
import { BandeauVeille } from '@/features/priere/veille';
import { Icon } from '@/ui/Icon';
import { useToast } from '@/ui/Toast';
import { Button } from '@/ui/Button';
import { TopBar } from '@/ui/TopBar';
import { useDessousOutil } from '@/features/ecouter/placeMiniLecteur';
import { usePlaceBas } from '@/stores/placeBas';
import { miseEnPage } from '@/theme/tokens.generated';

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
  const { couleurs, ombres, espace, rayon, cible, typographie } = useTheme();
  // La pilule d'outils est l'outil fixe du bas : la pile la compte, le contenu lui laisse sa place.
  const dessous = useDessousOutil();
  useEffect(() => {
    usePlaceBas.setState({ outil: 'pilule' });
    return () => usePlaceBas.setState({ outil: 'aucun', hauteurOutil: 0 });
  }, []);
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const mode = useReglages((st) => st.affichage);
  const translitActive = useReglages((st) => st.translitLecture);
  // Verset en cours d'écoute dans cette sourate : surligné dans la liste.
  const versetEcoute = useLecteur((st) => (st.position?.sourate === s.n ? st.position.verset : null));
  const translits = useMemo(() => (translitActive ? translitDe(s.n) : []), [s.n, translitActive]);
  const enregistrerPosition = useLecture((st) => st.enregistrerPosition);
  const marquerJour = useLecture((st) => st.marquerJour);
  const favoris = useFavoris((st) => st.versets);
  const basculer = useFavoris((st) => st.basculer);
  const { afficher } = useToast();

  const [aPartager, setAPartager] = useState<VersetAPartager | null>(null);
  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  const chiffresArabes = useReglages((st) => st.chiffresArabes);
  /** Verset en haut de l'écran : celui sur lequel agit la barre d'outils du bas. */
  const [versetHaut, setVersetHaut] = useState(versetInitial);
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
    if (premier) {
      versetVisible.current = premier.item.n;
      setVersetHaut(premier.item.n);
    }
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
      // Mode page : le fond surface vient de la barre flottante.
      transparent={modePage}
      centre={!modePage}
      titre={modePage ? nomPage : s.nom}
      sousTitre={
        modePage && premierSegment
          ? `${t('lire.pageN', { n: page })} · ${t('lire.juz', { n: reperes().juzDe(premierSegment.sourate, premierSegment.versets[0]?.verset ?? 1) })}`
          : modePage
            ? t('lire.pageN', { n: page })
            : undefined
      }
      actions={
        modePage
          ? [
              { icone: 'list', label: t('lire.modeVerset'), couleur: couleurs.emeraude, onPress: basculerMode },
              { icone: 'headphones', label: t('ecouter.ecouterPage'), onPress: () => ecouterPage(page) },
            ]
          : [{ icone: 'type', texte: 'Aa', label: t('lire.reglagesLecture'), onPress: () => setReglagesOuverts(true) }]
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
        {barres ? <View
            style={[
              styles.barreFlottante,
              // Planche : fond surface, filet en bas, 8 sous la rangée.
              { backgroundColor: couleurs.surface, borderBottomColor: couleurs.ligne, paddingBottom: espace.espace2 },
            ]}>{barre}</View> : null}
      </View>
    );
  }

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {barre}
      {/* Veille : le bandeau de la nuit, une seule fois. */}
      <View style={{ paddingHorizontal: espace.espace5 }}>
        <BandeauVeille />
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
              // Planche : chaque verset est une carte de 12 de rayon, 12 / 8 de marge, sans filet.
              { gap: espace.espace3, borderRadius: rayon.rayonCarte, paddingHorizontal: espace.espace3, paddingVertical: espace.espace2 },
              versetEcoute === item.n ? { backgroundColor: couleurs.emeraudeDoux } : null,
            ]}>
            <Medaillon
              numero={item.n}
              prefixe={t('lire.verset')}
              taille={30}
              actif={versetEcoute === item.n}
              affiche={chiffresArabes ? enChiffresArabes(item.n) : undefined}
            />
            <View style={styles.textes}>
              {mode !== 'tradSeule' ? (
                <Text
                  accessibilityLanguage="ar"
                  maxFontSizeMultiplier={echelleMax.grand}
                  style={[
                    typographie.coran,
                    tailleArabe,
                    styles.arabe,
                    { color: versetEcoute === item.n ? couleurs.emeraude : couleurs.encre },
                  ]}>
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
              {versetEcoute === item.n ? (
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.etiquette, { color: couleurs.emeraude }]}>
                  {t('lire.recitationEnCours')}
                </Text>
              ) : null}
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
        extraData={[translits, versetEcoute, chiffresArabes]}
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          // Planche : 4 entre deux versets.
          gap: espace.espace1,
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
      {/* Outils de lecture : une pilule flottante (mode, écouter, favori, partage) sur le verset en haut de l'écran. */}
      <View
        onLayout={(e) => usePlaceBas.setState({ hauteurOutil: Math.round(e.nativeEvent.layout.height) })}
        style={[
          styles.outils,
          {
            gap: espace.espace2,
            marginHorizontal: espace.espace6,
            // La pilule flotte à 16 au-dessus de la couche du dessous (barre d'onglets, mini-lecteur).
            marginBottom: miseEnPage.margeContenuBas + dessous,
            paddingHorizontal: espace.espace3,
            paddingVertical: espace.espace2,
            borderColor: couleurs.ligne,
            backgroundColor: couleurs.surface,
            borderRadius: rayon.rayonPastille,
          },
          ombres.ombre1 !== 'none' ? { boxShadow: ombres.ombre1 } : null,
        ]}>
        <View style={styles.outilsMode}>
          <BasculeMode
            label={t('lire.mode')}
            options={[
              { id: 'verset', label: t('lire.modeVersetCourt') },
              { id: 'page', label: t('lire.modePageCourt') },
            ]}
            valeur="verset"
            onChange={(id) => {
              if (id === 'page') basculerMode();
            }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('ecouter.ecouterVerset')}
          onPress={() => {
            ecouter({ sourate: s.n, verset: versetHaut });
            router.navigate('/lecteur');
          }}
          style={[
            styles.ecouter,
            { width: cible.cibleIos, height: cible.cibleIos, backgroundColor: couleurs.emeraudeAplat },
          ]}>
          <Icon name="play" size={22} color={couleurs.surEmeraude} />
        </Pressable>
        <IconButton
          icone="bookmark"
          actif={favoris.includes(cleVerset(s.n, versetHaut))}
          label={t(favoris.includes(cleVerset(s.n, versetHaut)) ? 'lire.favoriRetirer' : 'lire.favoriAjouter')}
          onPress={() => basculerFavori(versetHaut)}
        />
        <IconButton
          icone="share"
          label={t('partage.titre')}
          onPress={() => {
            const v = versets[versetHaut - 1];
            if (v) setAPartager({ sourate: s.n, nomSourate: s.nom, n: v.n, texte: v.texte, trad: v.trad });
          }}
        />
      </View>
      <PartageVerset verset={aPartager} onFermer={() => setAPartager(null)} />
      <ReglagesLecture ouvert={reglagesOuverts} onFermer={() => setReglagesOuverts(false)} />
    </View>
  );
}

/** En-tête coranique d'une sourate (nom arabe dans un bandeau vert, basmala). */
function Entete({ sourate: n, mode }: { sourate: number; mode: string }) {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const meta = sourate(n);
  const basmala = basmalaDe(n);
  if (!meta) return null;

  return (
    <View style={{ gap: espace.espace4, paddingBottom: espace.espace2 }}>
      {mode !== 'tradSeule' ? (
        <Text
          accessibilityRole="header"
          accessibilityLanguage="ar"
          maxFontSizeMultiplier={echelleMax.grand}
          style={[typographie.coran, tailleArabe, styles.centre, { color: couleurs.emeraude }]}>
          {`سورة ${meta.arabe}`}
        </Text>
      ) : null}
      {/* Sens du nom en français (liste à relire), puis numéro, nombre de versets et révélation. */}
      <View style={{ gap: espace.espace1 }}>
        {i18n.language !== 'ar' && sensDe(n) ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre1, styles.centreLatin, { color: couleurs.encre }]}>
            {sensDe(n)}
          </Text>
        ) : null}
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.meta, styles.centreLatin, { color: couleurs.encre3 }]}>
          {`${t('lire.sourate')} ${n} · ${t('lire.versets', { count: meta.versets })} · ${t(meta.mecquoise ? 'lire.mecquoise' : 'lire.medinoise')}`}
        </Text>
      </View>
      <View accessible={false} style={[styles.ornement, { gap: espace.espace2, marginTop: espace.espace4 }]}>
        <View style={[styles.trait, { backgroundColor: couleurs.or }]} />
        <Etoile taille={14} remplissage={couleurs.or} />
        <View style={[styles.trait, { backgroundColor: couleurs.or }]} />
      </View>

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
  centreLatin: { textAlign: 'center' },
  ornement: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  // Planche : filets pleine largeur, 1 d'épaisseur, or à 70 %.
  trait: { flex: 1, height: 1, opacity: 0.7 },
  meta: { fontSize: 14, lineHeight: 20 },
  etiquette: { fontSize: 12, lineHeight: 16 },
  bandeau: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  outils: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  ecouter: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  outilsMode: { flex: 1 },
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
