import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TopBar } from '@/ui/TopBar';

const CHIFFRES_ARABES = '٠١٢٣٤٥٦٧٨٩';

/** Marqueur de verset style mushaf : chiffres arabo-indiens entre crochets ornés, ﴿٥﴾. */
function marqueur(n: number): string {
  return `﴿${String(n).replace(/\d/g, (d) => CHIFFRES_ARABES[Number(d)])}﴾`;
}

export default function EcranSourate() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const params = useLocalSearchParams<{ n?: string | string[] }>();

  const brut = Array.isArray(params.n) ? params.n[0] : params.n;
  const s = sourate(Number(brut));

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
  return <LectureSourate key={s.n} s={s} />;
}

function LectureSourate({ s }: { s: Sourate }) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const [affichage, setAffichage] = useState('');
  // Vue mushaf (page justifiée) par défaut ; la bascule ouvre la lecture verset par verset.
  const [modePage, setModePage] = useState(true);
  const [page, setPage] = useState(() => pageDe(s.n, 1) ?? 1);
  const versets = useMemo(() => versetsAvecTraduction(s.n), [s.n]);

  // Arabe + traduction par défaut, tant que l'utilisateur n'a pas choisi.
  const mode = affichage || 'arabeTrad';
  const sousTitre = `${t('lire.sourate')} ${s.n} · ${t('lire.versets', { count: s.versets })}`;
  const legende = [typographie.legende, { color: couleurs.encre3, textAlign: 'center' as const }];

  const basculerMode = () => {
    if (modePage) {
      setModePage(false);
      return;
    }
    // On part sur la page qui contient le premier verset de la sourate.
    setPage(pageDe(s.n, 1) ?? 1);
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
            onChange={setAffichage}
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
          data={versets}
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
              </View>
            </View>
          )}
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
                      pathname: '/lire/sourate',
                      params: { n: sourates[s.n].n },
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
                      pathname: '/lire/sourate',
                      params: { n: s.n - 1 },
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
  justifie: { textAlign: 'justify', writingDirection: 'rtl' },
});
