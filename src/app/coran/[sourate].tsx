import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, FlatList, I18nManager, Pressable, StyleSheet, Text, View, type LayoutRectangle } from 'react-native';
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
  versetsNumerotes,
} from '@/features/lire/coran';
import { PageMushaf } from '@/features/lire/PageMushaf';
import { cleJour } from '@/lib/dates';
import { ecouter, ecouterPage, useLecteur } from '@/features/ecouter/lecteur';
import { SondeBarre } from '@/features/ecouter/SondeBarre';
import { PartageVerset, type VersetAPartager } from '@/features/lire/PartageVerset';
import { translitSansBalises } from '@/features/lire/reperes';
import { ReglagesLecture } from '@/features/lire/ReglagesLecture';
import { enChiffresArabes } from '@/lib/chiffres';
import { Etoile } from '@/ui/Etoile';
import type { IconName } from '@/ui/types';
import { Medaillon } from '@/ui/Medaillon';
import { TranslitVerset } from '@/features/lire/TranslitVerset';
import { apresEchec, DELAI_SUCCES_MS, decalageEstime, DUREE_MAX_MS, resteAvantMasquage } from '@/features/lire/positionVerset';
import { cleVerset, useFavoris } from '@/stores/favoris';
import { usePleinEcran } from '@/stores/pleinEcran';
import { useLecture, type ModeLecture } from '@/stores/lecture';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Skeleton } from '@/ui/Skeleton';
import { IconButton } from '@/ui/IconButton';
import { Icon } from '@/ui/Icon';
import { useToast } from '@/ui/Toast';
import { Button } from '@/ui/Button';
import { TopBar } from '@/ui/TopBar';
import { useDessousOutil } from '@/features/ecouter/placeMiniLecteur';
import { usePlaceBas } from '@/stores/placeBas';
import { espace, interlignes, miseEnPage, rayon, tailles } from '@/theme/tokens.generated';

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
  const mode: ModeLecture = premier(params.mode) === 'page' ? 'page' : 'verset';

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
    <View style={{ flex: 1 }}>
      <LectureSourate
        key={s.n}
        s={s}
        versetInitial={Number.isInteger(verset) && verset >= 1 && verset <= s.versets ? verset : 1}
        modeInitial={mode}
      />
      <SondeBarre />
    </View>
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
  const { t, i18n } = useTranslation();
  const { couleurs, ombres, espace, rayon, cible, typographie, ligne } = useTheme();
  // La pilule d'outils est l'outil fixe du bas : la pile la compte, le contenu lui laisse sa place.
  const dessous = useDessousOutil();
  // Avant la première image : la pile du bas compte la pilule dès l'ouverture, elle ne se décale pas ensuite.
  useLayoutEffect(() => {
    usePlaceBas.setState({ outil: 'pilule' });
    return () => usePlaceBas.setState({ outil: 'aucun', hauteurOutil: 0 });
  }, []);
  const { tailleArabe, tailleTrad } = useTaillesLecture();
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
  // Lecture verset par verset par défaut ; la bascule ouvre la vue mushaf (page justifiée).
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
  const versets = useMemo(() => versetsNumerotes(s.n), [s.n]);
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
  // Ouverture sur un verset (reprise, début d'un juz) : état du positionnement, voir plus bas.
  const [pret, setPret] = useState(modeInitial === 'page' || versetInitial <= 1);
  const positionne = useRef(modeInitial === 'page' || versetInitial <= 1);
  const essai = useRef(0);
  const echec = useRef(false);
  const succes = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Doit rester stable : la FlatList refuse un rappel qui change entre deux rendus.
  const surVisibles = useCallback(({ viewableItems }: { viewableItems: { item: { n: number } }[] }) => {
    // Pendant le positionnement sur le verset d'ouverture, les versets rendus un instant ne comptent pas.
    if (!positionne.current) return;
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

  // Ouverture sur un verset (reprise, début d'un juz) : la liste reste invisible le temps de s'y placer, en quelques
  // essais (les versets lointains ne sont pas encore mesurés), puis apparaît une seule fois, déjà bien placée.
  const terminerPositionnement = useCallback(() => {
    clearTimeout(succes.current);
    positionne.current = true;
    setPret(true);
  }, []);
  // Chargement visible : il couvre la liste dès la première image, puis s'efface en fondu quand elle est prête.
  const [chargement, setChargement] = useState(!(modeInitial === 'page' || versetInitial <= 1));
  const [fondu] = useState(() => new Animated.Value(1));
  const [debutChargement] = useState(() => Date.now());
  useEffect(() => {
    if (!pret) return;
    // Visible au moins DUREE_MIN_MS, puis fondu : même un positionnement très rapide laisse voir le chargement.
    const attente = setTimeout(
      () => Animated.timing(fondu, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setChargement(false)),
      resteAvantMasquage(Date.now() - debutChargement),
    );
    return () => clearTimeout(attente);
  }, [pret, fondu, debutChargement]);
  const essayerDeSePlacer = useCallback(() => {
    essai.current += 1;
    echec.current = false;
    liste.current?.scrollToIndex({ index: versetInitial - 1, animated: false });
    // Aucun échec signalé peu après : le verset est atteint.
    clearTimeout(succes.current);
    succes.current = setTimeout(() => {
      if (!echec.current) terminerPositionnement();
    }, DELAI_SUCCES_MS);
  }, [versetInitial, terminerPositionnement]);
  useEffect(() => {
    if (positionne.current) return;
    const depart = setTimeout(essayerDeSePlacer, 0);
    // Jamais de blocage : passé ce délai, la liste s'affiche là où elle est.
    const limite = setTimeout(terminerPositionnement, DUREE_MAX_MS);
    return () => {
      clearTimeout(depart);
      clearTimeout(limite);
      clearTimeout(succes.current);
    };
  }, [essayerDeSePlacer, terminerPositionnement]);
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
            : [i18n.language === 'ar' ? null : sensDe(s.n), t('lire.juz', { n: reperes().juzDe(s.n, versetHaut) })]
                .filter(Boolean)
                .join(' · ')
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
        {/* Planche « Mode page, réglette » : en bas, juz et page, réglette pour aller à une page, quatre outils. */}
        {barres ? (
          <View
            style={[
              styles.reglette,
              {
                backgroundColor: couleurs.surface,
                borderTopColor: couleurs.ligne,
                paddingHorizontal: espace.espace5,
                paddingTop: espace.espace3,
                paddingBottom: insets.bottom + espace.espace2,
                gap: espace.espace3,
              },
            ]}>
            <View style={styles.infosPage}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                {premierSegment
                  ? t('lire.juz', { n: reperes().juzDe(premierSegment.sourate, premierSegment.versets[0]?.verset ?? 1) })
                  : ''}
              </Text>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre }]}>
                {t('lire.pageSurTotal', { n: page, total: nombreDePages })}
              </Text>
            </View>
            <View style={styles.outilsPage}>
              {[
                { icone: 'headphones', libelle: t('commun.ecouter'), onPress: () => ecouterPage(page) },
                { icone: 'type', libelle: t('lire.affichageOutil'), onPress: () => setReglagesOuverts(true) },
                { icone: 'search', libelle: t('lire.chercher'), onPress: () => router.push('/plus/recherche') },
              ].map((o) => (
                <Pressable key={o.libelle} accessibilityRole="button" accessibilityLabel={o.libelle} onPress={o.onPress} style={styles.outilPage}>
                  <Icon name={o.icone as IconName} size={22} color={couleurs.encre2} />
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
                    {o.libelle}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {/* Un toucher sur la page affiche la barre par-dessus la page, sans la déplacer. */}
        {barres ? <View
            style={[
              styles.barreFlottante,
              // Planche : fond surface, filet en bas, 8 sous la rangée.
              { backgroundColor: couleurs.surface, borderBottomColor: couleurs.ligne, paddingBottom: espace.espace2 },
            ]}>{barre}</View> : null}
        {/* La feuille « Lecture » doit aussi être montée en mode page : l'outil Affichage l'ouvre. */}
        <ReglagesLecture ouvert={reglagesOuverts} onFermer={() => setReglagesOuverts(false)} />
      </View>
    );
  }

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {barre}
      {/* Planche : fil de 2 de haut sous la barre, or, qui avance avec le verset. */}
      <View
        accessible
        accessibilityLabel={t('accueil.versetSur', { n: versetHaut, total: s.versets })}
        style={[styles.fil, { marginHorizontal: espace.espace4, backgroundColor: couleurs.ligne }]}>
        <View style={{ height: espace.espace1 / 2, width: `${Math.round((versetHaut / s.versets) * 100)}%`, backgroundColor: couleurs.or }} />
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          key={String(s.n)}
          ref={liste}
          data={versets}
          viewabilityConfig={CONFIG_VISIBILITE}
          onViewableItemsChanged={surVisibles}
          onScrollEndDrag={enregistrerVerset}
          onMomentumScrollEnd={enregistrerVerset}
          onScrollToIndexFailed={({ averageItemLength, index }) => {
            // Verset pas encore mesuré : on s'en approche, puis on réessaie (jusqu'à ESSAIS_MAX fois).
            echec.current = true;
            liste.current?.scrollToOffset({ offset: decalageEstime(index, averageItemLength), animated: false });
            const suite = apresEchec(essai.current);
            clearTimeout(reessai.current);
            if (suite.reessayer) reessai.current = setTimeout(essayerDeSePlacer, suite.delai);
            else terminerPositionnement();
          }}
          style={{ opacity: pret ? 1 : 0 }}
          keyExtractor={(v) => String(v.n)}
          ListHeaderComponent={<Entete sourate={s.n} />}
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
                // Planche « Pendant la récitation » : le verset récité s'élève (surface, rayon 20), les autres s'estompent.
                versetEcoute === item.n
                  ? { backgroundColor: couleurs.surface, borderColor: couleurs.ligne, borderWidth: 1, borderRadius: rayon.rayonFeuille, paddingVertical: espace.espace4 }
                  : versetEcoute !== null
                    ? { opacity: 0.42 }
                    : null,
              ]}>
              <Medaillon
                numero={item.n}
                prefixe={t('lire.verset')}
                taille={30}
                actif={versetEcoute === item.n}
                affiche={chiffresArabes ? enChiffresArabes(item.n) : undefined}
              />
              <View style={styles.textes}>
                <Text
                  accessibilityLanguage="ar"
                  maxFontSizeMultiplier={echelleMax.grand}
                  style={[
                    typographie.coran,
                    tailleArabe,
                    styles.arabe,
                    { color: couleurs.encre },
                  ]}>
                  {item.texte}
                </Text>
                {translits[item.n - 1] ? <TranslitVerset texte={translits[item.n - 1] ?? ''} taille={tailleTrad} /> : null}
                {versetEcoute === item.n ? (
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.etiquette), { color: couleurs.emeraude }]}>
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
            paddingHorizontal: espace.espace6,
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
                      pathname: '/coran/[sourate]',
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
                      pathname: '/coran/[sourate]',
                      params: { sourate: s.n - 1 },
                    })
                  }>
                  {`${t('lire.souratePrecedente')} · ${sourates[s.n - 2].nom}`}
                </Button>
              ) : null}
            </View>
          }
        />
        {chargement ? (
          <Animated.View
            pointerEvents="auto"
            style={[StyleSheet.absoluteFill, { opacity: fondu, backgroundColor: couleurs.fond, paddingHorizontal: espace.espace5, paddingTop: espace.espace5, gap: espace.espace4 }]}>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.grand}
              style={[typographie.titre3, { color: couleurs.emeraude }]}>
              {t('lire.ouvertureVerset', { sourate: s.nom, n: versetInitial })}
            </Text>
            <ActivityIndicator accessibilityLabel={t('lire.chargementVerset', { n: versetInitial })} size="large" color={couleurs.emeraude} />
            <Skeleton forme="liste" lignes={5} />
          </Animated.View>
        ) : null}
      </View>
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
            if (v) setAPartager({
              sourate: s.n,
              nomSourate: s.nom,
              n: v.n,
              texte: v.texte,
              translit: translitSansBalises(translitDe(s.n)[v.n - 1] ?? '') || undefined,
            });
          }}
        />
      </View>
      <PartageVerset verset={aPartager} onFermer={() => setAPartager(null)} />
      <ReglagesLecture ouvert={reglagesOuverts} onFermer={() => setReglagesOuverts(false)} />
    </View>
  );
}

/** En-tête coranique d'une sourate (nom arabe dans un bandeau vert, basmala). */
function Entete({ sourate: n }: { sourate: number }) {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie, ligne } = useTheme();
  const { tailleArabe } = useTaillesLecture();
  const meta = sourate(n);
  const basmala = basmalaDe(n);
  if (!meta) return null;

  return (
    <View style={{ gap: espace.espace4, paddingBottom: espace.espace2 }}>
      <Text
        accessibilityRole="header"
        accessibilityLanguage="ar"
        maxFontSizeMultiplier={echelleMax.grand}
        style={[typographie.coran, tailleArabe, styles.centre, { color: couleurs.emeraude }]}>
        {`سورة ${meta.arabe}`}
      </Text>
      {/* Sens du nom en français (liste à relire), puis numéro, nombre de versets et révélation. */}
      <View style={{ gap: espace.espace1 }}>
        {i18n.language !== 'ar' && sensDe(n) ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre1, styles.centreLatin, { color: couleurs.encre }]}>
            {sensDe(n)}
          </Text>
        ) : null}
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.meta), styles.centreLatin, { color: couleurs.encre3 }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  reglette: { position: 'absolute', start: 0, end: 0, bottom: 0, borderTopWidth: 1 },
  infosPage: { flexDirection: 'row', justifyContent: 'space-between' },
  outilsPage: { flexDirection: 'row', justifyContent: 'space-around' },
  outilPage: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2 },
  fil: { height: 2, borderRadius: 2, overflow: 'hidden' },
  ecran: { flex: 1 },
  coupe: { overflow: 'hidden' },
  centre: { textAlign: 'center', writingDirection: 'rtl' },
  centreLatin: { textAlign: 'center' },
  ornement: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  // Planche : filets pleine largeur, 1 d'épaisseur, or à 70 %.
  trait: { flex: 1, height: 1, opacity: 0.7 },
  meta: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  etiquette: { fontSize: tailles.t12, lineHeight: interlignes.l16 },
  bandeau: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espace.espace1,
  },
  outils: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  ecouter: { borderRadius: rayon.rayonPastille, alignItems: 'center', justifyContent: 'center' },
  outilsMode: { flex: 1 },
  verset: { flexDirection: 'row', alignItems: 'flex-start' },
  numero: {
    minWidth: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: { flex: 1, gap: espace.espace1 },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  repere: { textAlign: 'center' },
  barreFlottante: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomWidth: StyleSheet.hairlineWidth },
});
