import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { BarreTaille, useTaillesLecture } from '@/features/lire/BarreTaille';
import {
  basmalaDe,
  nombreDePages,
  pageDe,
  segmentsDePage,
  sourate,
  sourates,
  type SegmentPage,
  type Sourate,
  versetsAvecTraduction,
} from '@/features/lire/coran';
import { cleJour } from '@/lib/dates';
import { cleVerset, useFavoris } from '@/stores/favoris';
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

const CHIFFRES_ARABES = '٠١٢٣٤٥٦٧٨٩';

/** Marqueur de verset style mushaf : chiffres arabo-indiens entre crochets ornés, ﴿٥﴾. */
function marqueur(n: number): string {
  return `﴿${String(n).replace(/\d/g, (d) => CHIFFRES_ARABES[Number(d)])}﴾`;
}

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
  const definirAffichage = useReglages((st) => st.definirAffichage);
  const enregistrerPosition = useLecture((st) => st.enregistrerPosition);
  const marquerJour = useLecture((st) => st.marquerJour);
  const favoris = useFavoris((st) => st.versets);
  const basculer = useFavoris((st) => st.basculer);
  const { afficher } = useToast();

  const basculerFavori = (verset: number) => {
    if (basculer(s.n, verset)) afficher({ texte: t('lire.favoriAjoute'), icone: 'check' });
  };
  // Vue mushaf (page justifiée) par défaut ; la bascule ouvre la lecture verset par verset.
  const [modePage, setModePage] = useState(modeInitial === 'page');
  const [page, setPage] = useState(() => pageDe(s.n, versetInitial) ?? 1);
  const versets = useMemo(() => versetsAvecTraduction(s.n), [s.n]);
  const liste = useRef<FlatList>(null);
  // Premier verset visible en lecture verset par verset, enregistré à l'arrêt du défilement.
  const versetVisible = useRef(versetInitial);

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
    setPage(pageDe(s.n, versetVisible.current) ?? 1);
    setModePage(true);
  };

  // --- Mode page (mushaf) ---------------------------------------------------------------------
  const segments: SegmentPage[] = modePage ? segmentsDePage(page) : [];
  const nomPage = segments[0] ? (sourate(segments[0].sourate)?.nom ?? s.nom) : s.nom;

  const piedPage = (
    <View
      style={{
        gap: espace.espace4,
        paddingTop: espace.espace5,
        alignItems: 'center',
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: espace.espace4,
        }}>
        {page > 1 ? (
          <Button variant="secondaire" accessibilityHint={t('lire.pagePrecedente')} onPress={() => setPage(page - 1)}>
            {`${t('lire.modePage')} ${page - 1}`}
          </Button>
        ) : null}
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.titre3, { color: couleurs.emeraude }]}>
          {`${t('lire.modePage')} ${page}`}
        </Text>
        {page < nombreDePages ? (
          <Button variant="secondaire" accessibilityHint={t('lire.pageSuivante')} onPress={() => setPage(page + 1)}>
            {`${t('lire.modePage')} ${page + 1}`}
          </Button>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        retour
        titre={modePage ? nomPage : s.nom}
        sousTitre={modePage ? `${t('lire.modePage')} ${page}` : sousTitre}
        actions={[
          {
            icone: modePage ? 'list' : 'book',
            label: modePage ? t('lire.modeVerset') : t('lire.modePage'),
            onPress: basculerMode,
          },
        ]}
      />

      <BarreTaille />

      {modePage ? null : (
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
      )}

      {modePage ? (
        <FlatList
          key={`page-${page}`}
          data={segments}
          keyExtractor={(seg) => `${seg.sourate}-${seg.versets[0]?.verset ?? 0}`}
          renderItem={({ item }) => {
            const commence = item.versets[0]?.verset === 1;
            return (
              <View style={{ gap: espace.espace3 }}>
                {commence ? <Entete sourate={item.sourate} mode="arabeSeul" /> : null}
                {/* Texte continu et justifié, comme une page de mushaf : les versets s'enchaînent. */}
                <Text
                  accessibilityLanguage="ar"
                  maxFontSizeMultiplier={echelleMax.grand}
                  style={[typographie.coran, tailleArabe, styles.justifie, { color: couleurs.encre }]}>
                  {item.versets.map((v) => `${v.texte} ${marqueur(v.verset)} `).join('')}
                </Text>
              </View>
            );
          }}
          ListFooterComponent={piedPage}
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace4,
          }}
        />
      ) : (
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
            setTimeout(() => liste.current?.scrollToIndex({ index, animated: false }), 100);
          }}
          keyExtractor={(v) => String(v.n)}
          ListHeaderComponent={<Entete sourate={s.n} mode={mode} />}
          ItemSeparatorComponent={() => <View style={[styles.ligneFine, { backgroundColor: couleurs.ligne }]} />}
          renderItem={({ item }) => (
            <View style={[styles.verset, { gap: espace.espace3 }]}>
              <View
                style={[
                  styles.numero,
                  {
                    backgroundColor: couleurs.orDoux,
                    borderRadius: rayon.rayonPastille,
                  },
                ]}>
                <Text
                  maxFontSizeMultiplier={echelleMax.grand}
                  style={[typographie.libelle, { color: couleurs.orTexte }]}>
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
                </View>
              </View>
            </View>
          )}
          extraData={favoris}
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
      )}
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
  justifie: { textAlign: 'justify', writingDirection: 'rtl' },
});
