import { router, useScrollToTop } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ListeCategories } from '@/features/invocations/ListeCategories';
import { FiletProgres } from '@/features/accueil/FiletProgres';
import { usePremierKhatm } from '@/features/khatm/premier';
import { CarteSourate } from '@/features/lire/CarteSourate';
import { sourate, sourates, type Sourate } from '@/features/lire/coran';
import { ContenuEcouter } from '@/features/ecouter/ContenuEcouter';
import { juzParSourate } from '@/features/lire/decoupageJuz';
import { ListeJuz } from '@/features/lire/ListeJuz';
import { InterrupteurLireEcouter, type ModeLire } from '@/features/lire/InterrupteurLireEcouter';
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
import { ListeSources } from '@/features/xassaides/ListeSources';

function ouvrirSourate(n: number) {
  router.push({ pathname: '/coran/[sourate]', params: { sourate: n } });
}

export default function Lire() {
  // Toucher l'onglet actif ramène la liste en haut.
  const defilement = useRef<FlatList<Sourate>>(null);
  useScrollToTop(defilement);
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const marge = useMargeBasse();
  const { styleColonne: colonne } = useLayout();
  const rubrique = useParametre('rubrique');
  // Le lien Xassaïdes de Plus ouvre le mode Écouter, onglet Xassaïdes.
  const [mode, setMode] = useState<ModeLire>(rubrique === 'xassaides' ? 'ecouter' : 'lire');
  const [vueCoran, setVueCoran] = useState<'sourates' | 'juz'>('sourates');
  type Onglet = 'coran' | 'xassaides' | 'recitateurs' | 'invocations';
  const ouverture = (r: string | undefined): Onglet => (r === 'xassaides' || r === 'recitateurs' || r === 'invocations' ? r : 'coran');
  const [onglet, setOnglet] = useState<Onglet>(ouverture(rubrique));
  // Écran déjà monté (onglet gardé en mémoire) : une nouvelle rubrique demandée depuis Plus doit être appliquée.
  const [rubriqueVue, setRubriqueVue] = useState(rubrique);
  if (rubrique !== rubriqueVue) {
    setRubriqueVue(rubrique);
    if (rubrique === 'xassaides' || rubrique === 'invocations') {
      setOnglet(ouverture(rubrique));
      setMode(rubrique === 'xassaides' ? 'ecouter' : 'lire');
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

      {/* Barre fixe : l'interrupteur Lire | Écouter, et Coran | Xassaïdes | Invocations tant qu'on est sur Lire. */}
      <View style={[colonne, { gap: espace.espace3, paddingBottom: espace.espace3, backgroundColor: couleurs.fond }]}>
        <InterrupteurLireEcouter mode={mode} onChange={setMode} />
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
              { id: 'xassaides', label: t('lire.xassaides') },
              { id: 'recitateurs', label: t('ecouter.recitateurs') },
            ]}
            valeur={onglet === 'invocations' ? 'coran' : onglet}
            onChange={(id) => setOnglet(ouverture(id))}
          />
        ) : null}
        {mode === 'lire' && onglet === 'coran' ? (
          <SegmentedControl
            label={t('lire.vue')}
            options={[
              { id: 'sourates', label: t('lire.vueSourates') },
              { id: 'juz', label: t('lire.vueJuz') },
            ]}
            valeur={vueCoran}
            onChange={(id) => setVueCoran(id === 'juz' ? 'juz' : 'sourates')}
          />
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('lire.reprendre', { nom: repris.nom })}, ${t('accueil.versetSur', { n: position.verset, total: repris.versets })}`}
                  onPress={() =>
                    router.push({
                      pathname: '/coran/[sourate]',
                      params: { sourate: repris.n, verset: position.verset, mode: position.mode },
                    })
                  }
                  style={({ pressed }) => [
                    styles.reprise,
                    {
                      gap: espace.espace4,
                      backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.surface,
                      borderColor: couleurs.ligne,
                    },
                  ]}>
                  <View style={[styles.pastille, { backgroundColor: couleurs.emeraudeDoux }]}>
                    <Icon name="book" size={20} color={couleurs.surEmeraudeDoux} />
                  </View>
                  <View style={[styles.repriseTexte, { gap: espace.espace1 }]}>
                    <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.repriseTitre, { color: couleurs.encre }]}>
                      {t('lire.reprendre', { nom: repris.nom })}
                    </Text>
                    <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.repriseDetail, { color: couleurs.encre2 }]}>
                      {t('accueil.versetSur', { n: position.verset, total: repris.versets })}
                    </Text>
                    <FiletProgres
                      ton="or"
                      valeur={position.verset / repris.versets}
                      label={t('lire.reprendre', { nom: repris.nom })}
                      detail={t('accueil.versetSur', { n: position.verset, total: repris.versets })}
                    />
                  </View>
                </Pressable>
              ) : null}
              {premierKhatm ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${premierKhatm.nom}, ${t('lire.khatmLus', { lus: premierKhatm.lus })}`}
                  onPress={() => router.push({ pathname: '/plus/khatm/[id]', params: { id: premierKhatm.id } })}
                  style={({ pressed }) => [styles.bandeKhatm, { gap: espace.espace3, backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.orDoux }]}>
                  <Icon name="users" size={20} color={couleurs.orTexte} />
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.repriseDetail, styles.repriseTexte, { color: couleurs.encre }]}>
                    <Text style={typographie.libelle}>{premierKhatm.nom}</Text>
                    {` · ${t('lire.khatmLus', { lus: premierKhatm.lus })}`}
                  </Text>
                  <Icon name="chevron-right" size={18} color={couleurs.encre3} />
                </Pressable>
              ) : null}
            </View>
          ) : undefined}
          </View>
        }
        ListEmptyComponent={
          mode === 'ecouter' ? (
            onglet === 'xassaides' ? (
              <ListeSources />
            ) : onglet === 'recitateurs' ? (
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
  // Planche : carte de reprise de rayon 16 (padding 12/16), pastille de 40.
  reprise: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16 },
  pastille: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  repriseTexte: { flex: 1 },
  repriseTitre: { fontSize: 16, lineHeight: 24 },
  repriseDetail: { fontSize: 14, lineHeight: 20 },
  bandeKhatm: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
});
