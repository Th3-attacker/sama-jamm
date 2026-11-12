import { router, useScrollToTop } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ListeCategories } from '@/features/invocations/ListeCategories';
import { usePremierKhatm } from '@/features/khatm/premier';
import { CarteSourate } from '@/features/lire/CarteSourate';
import { sourate, sourates, type Sourate } from '@/features/lire/coran';
import { ecouter } from '@/features/ecouter/lecteur';
import { ContenuEcouter } from '@/features/ecouter/ContenuEcouter';
import { juzParSourate } from '@/features/lire/decoupageJuz';
import { ListeJuz } from '@/features/lire/ListeJuz';
import { InterrupteurLireEcouter, type ModeLire } from '@/features/lire/InterrupteurLireEcouter';
import { ongletPourMode, type OngletBibliotheque } from '@/features/lire/ongletMode';
import { useParametre } from '@/hooks/useParametre';
import { useLecture } from '@/stores/lecture';
import { echelleMax } from '@/theme/typographie';
import { useLayout } from '@/theme/useLayout';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';
import { ListeRecitateurs } from '@/features/ecouter/ListeRecitateurs';

import { espace, interlignes, rayon, tailles } from '@/theme/tokens.generated';
function ouvrirSourate(n: number) {
  router.push({ pathname: '/coran/[sourate]', params: { sourate: n } });
}

export default function Lire() {
  // Toucher l'onglet actif ramène la liste en haut.
  const defilement = useRef<FlatList<Sourate>>(null);
  useScrollToTop(defilement);
  const { t } = useTranslation();
  const { couleurs, espace, typographie, ligne } = useTheme();
  const marge = useMargeBasse();
  const { styleColonne: colonne } = useLayout();
  const rubrique = useParametre('rubrique');
  const [mode, setMode] = useState<ModeLire>('lire');
  const [vueCoran, setVueCoran] = useState<'sourates' | 'juz'>('sourates');
  type Onglet = OngletBibliotheque;
  const ouverture = (r: string | undefined): Onglet => (r === 'recitateurs' || r === 'invocations' ? r : 'coran');
  const [onglet, setOnglet] = useState<Onglet>(ouverture(rubrique));
  // Un onglet qui n'existe pas dans l'autre mode (Récitateurs en Lire, Invocations en Écouter) revient au Coran.
  const changerMode = (m: ModeLire) => {
    setMode(m);
    setOnglet((o) => ongletPourMode(m, o));
  };
  // Écran déjà monté (onglet gardé en mémoire) : une nouvelle rubrique demandée depuis Plus doit être appliquée.
  const [rubriqueVue, setRubriqueVue] = useState(rubrique);
  if (rubrique !== rubriqueVue) {
    setRubriqueVue(rubrique);
    if (rubrique === 'invocations') {
      setOnglet(ouverture(rubrique));
      setMode('lire');
    }
  }
  // Reprise : la sourate et le verset où la lecture s'est arrêtée.
  const position = useLecture((s) => s.position);
  const repris = position ? sourate(position.sourate) : undefined;
  const premierKhatm = usePremierKhatm();

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Planche : « Lire » en 40/44, sans sous-titre, loupe à droite. */}
      <TopBar
        gauche={
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.display, { color: couleurs.emeraude }]}>
            {t('lire.titre')}
          </Text>
        }
        actions={[{ icone: 'search', label: t('menuPlus.rechercher'), onPress: () => router.push('/plus/recherche') }]}
      />

      {/* Barre fixe : l'interrupteur Lire | Écouter, et Coran | Invocations tant qu'on est sur Lire. */}
      <View style={[colonne, { gap: espace.espace3, paddingBottom: espace.espace3, backgroundColor: couleurs.fond }]}>
        <InterrupteurLireEcouter mode={mode} onChange={changerMode} />
        {mode === 'lire' ? (
          <SegmentedControl
            label={t('lire.bibliotheque')}
            options={[
              { id: 'coran', label: t('lire.coran') },
              { id: 'invocations', label: t('lire.invocations') },
            ]}
            valeur={onglet}
            onChange={(id) => setOnglet(ouverture(id))}
          />
        ) : null}
        {mode === 'ecouter' ? (
          <SegmentedControl
            label={t('lire.bibliotheque')}
            options={[
              { id: 'coran', label: t('lire.coran') },
              { id: 'recitateurs', label: t('ecouter.recitateurs') },
            ]}
            valeur={onglet === 'invocations' ? 'coran' : onglet}
            onChange={(id) => setOnglet(ouverture(id))}
          />
        ) : null}
        {mode === 'lire' && onglet === 'coran' ? (
          <View accessibilityRole="tablist" style={[styles.onglets, { gap: espace.espace5, borderBottomColor: couleurs.ligne }]}>
            {(['sourates', 'juz'] as const).map((id) => {
              const actif = vueCoran === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: actif }}
                  onPress={() => setVueCoran(id)}
                  style={[styles.onglet, { borderBottomColor: actif ? couleurs.emeraude : 'transparent' }]}>
                  <Text
                    maxFontSizeMultiplier={echelleMax.courant}
                    style={[typographie.libelle, { color: actif ? couleurs.emeraude : couleurs.encre2 }]}>
                    {t(id === 'sourates' ? 'lire.vueSourates' : 'lire.vueJuz')}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              onPress={() => router.push('/plus/favoris')}
              style={[styles.onglet, { borderBottomColor: 'transparent' }]}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
                {t('lire.marquePages')}
              </Text>
            </Pressable>
            {premierKhatm ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${premierKhatm.nom}, ${t('lire.khatmLus', { lus: premierKhatm.lus })}`}
                onPress={() => router.push({ pathname: '/plus/khatm/[id]', params: { id: premierKhatm.id } })}
                style={[styles.lienKhatm, { gap: espace.espace2 }]}>
                <Icon name="users" size={16} color={couleurs.orTexte} />
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.libelleKhatm), { color: couleurs.orTexte }]}>
                  {t('lire.khatmCourt', { lus: premierKhatm.lus })}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Un seul défilement jusqu'à la barre des onglets : reprise, khatm, puis les 114 sourates. */}
      <FlatList ref={defilement}
        data={mode === 'lire' && onglet === 'coran' && vueCoran === 'sourates' ? sourates : []}
        keyExtractor={(s: Sourate) => String(s.n)}
        renderItem={({ item }) => (
          <CarteSourate plat enCours={repris?.n === item.n} sourate={item} juzDebut={juzParSourate.get(item.n)} onPress={() => ouvrirSourate(item.n)} />
        )}
        ListHeaderComponent={
          <View style={{ gap: espace.espace3 }}>
          {mode === 'lire' && onglet === 'coran' ? (
            <View style={{ gap: espace.espace3, paddingBottom: espace.espace3 }}>
              {position && repris ? (
                <View style={[styles.reprise, { gap: espace.espace3, backgroundColor: couleurs.surface, borderColor: couleurs.ligne }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t('lire.reprendre', { nom: repris.nom })}, ${t('accueil.versetSur', { n: position.verset, total: repris.versets })}`}
                    onPress={() =>
                      router.push({
                        pathname: '/coran/[sourate]',
                        params: { sourate: repris.n, verset: position.verset, mode: position.mode },
                      })
                    }
                    style={[styles.repriseLien, { gap: espace.espace3 }]}>
                    <View style={[styles.tuile, { backgroundColor: couleurs.emeraudeAplat, borderRadius: rayon.rayonCarte }]}>
                      <Text
                        accessibilityLanguage="ar"
                        maxFontSizeMultiplier={echelleMax.grand}
                        style={[typographie.arabe, ligne(styles.tuileNom), { color: couleurs.orSurEmeraude }]}>
                        {repris.arabe}
                      </Text>
                    </View>
                    <View style={[styles.repriseTexte, { gap: espace.espace1 }]}>
                      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.surtitre), { color: couleurs.orTexte }]}>
                        {t('lire.reprendreCourt')}
                      </Text>
                      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre2, { color: couleurs.encre }]}>
                        {repris.nom}
                      </Text>
                      <View style={[styles.progression, { gap: espace.espace2 }]}>
                        <View style={[styles.piste, { backgroundColor: couleurs.surfaceCreux }]}>
                          <View
                            style={[
                              styles.remplissage,
                              { backgroundColor: couleurs.or, width: `${Math.min(100, Math.round((position.verset / repris.versets) * 100))}%` },
                            ]}
                          />
                        </View>
                        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                          {`${position.verset} / ${repris.versets}`}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('lire.ecouterNom', { nom: repris.nom })}
                    onPress={() => ecouter({ sourate: repris.n, verset: position.verset })}
                    style={[styles.jouer, { backgroundColor: couleurs.emeraudeAplat }]}>
                    <Icon name="play" size={20} color={couleurs.surEmeraude} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : undefined}
          </View>
        }
        ListEmptyComponent={
          mode === 'ecouter' ? (
            onglet === 'recitateurs' ? (
              <ListeRecitateurs />
            ) : (
              <ContenuEcouter
                onToutVoir={() => {
                  setMode('lire');
                  setOnglet('coran');
                }}
              />
            )
          ) : mode === 'lire' && onglet === 'coran' && vueCoran === 'juz' ? (
            <ListeJuz />
          ) : onglet === 'invocations' ? (
            <ListeCategories />
          ) : undefined
        }
        contentContainerStyle={{ ...colonne, paddingBottom: espace.espace8 + marge }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  // Planche : carte de reprise de rayon 18, padding 12 ; tuile du nom arabe de 56 ; bouton écouter de 44.
  reprise: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: rayon.rayonFeuille, padding: espace.espace3 },
  repriseLien: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  tuile: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  tuileNom: { fontFamily: 'Amiri_700Bold', fontSize: tailles.t18, lineHeight: interlignes.l24, includeFontPadding: false, textAlignVertical: 'center' },
  repriseTexte: { flex: 1 },
  surtitre: { fontSize: tailles.t12, lineHeight: interlignes.l16, letterSpacing: 0.7, textTransform: 'uppercase' },
  progression: { flexDirection: 'row', alignItems: 'center' },
  piste: { flex: 1, height: 3, borderRadius: 3, overflow: 'hidden' },
  remplissage: { height: 3, borderRadius: 3 },
  jouer: { width: 44, height: 44, borderRadius: rayon.rayonPastille, alignItems: 'center', justifyContent: 'center' },
  // Onglets soulignés : Sourates · Juz · Marque-pages, le lien Khatm à droite.
  onglets: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  onglet: { paddingVertical: espace.espace2, borderBottomWidth: 2, marginBottom: -1, minHeight: 44, justifyContent: 'center' },
  lienKhatm: { marginStart: 'auto', flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  libelleKhatm: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
