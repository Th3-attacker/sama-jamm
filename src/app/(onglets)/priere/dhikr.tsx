import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FORMULE_LIBRE, formules, objectifsProposes } from '@/features/dhikr/formules';
import { vibrerLeger } from '@/lib/haptique';
import { useDhikr } from '@/stores/dhikr';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Dialog } from '@/ui/Dialog';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TasbihCounter } from '@/ui/TasbihCounter';
import { TopBar } from '@/ui/TopBar';
import { VersetRubrique } from '@/ui/VersetRubrique';
import { versetRubrique } from '@/features/rubriques/versetsRubriques';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

import { interlignes, tailles } from '@/theme/tokens.generated';
// Au-delà, remettre à zéro demande une confirmation.
const SEUIL_CONFIRMATION = 100;
const LIBRE = 'libre';

// Verset du Coran de la rubrique : données embarquées, lues une fois.
const versetDhikr = versetRubrique('dhikr');

export default function Dhikr() {
  useKeepAwake();
  const { t } = useTranslation();
  const { couleurs, espace, typographie, latin, ligne } = useTheme();
  const marge = useMargeBasse();
  const formuleId = useDhikr((s) => s.formule);
  const comptes = useDhikr((s) => s.comptes);
  const objectifs = useDhikr((s) => s.objectifs);
  const choisirFormule = useDhikr((s) => s.choisirFormule);
  const compter = useDhikr((s) => s.compter);
  const remettreAZero = useDhikr((s) => s.remettreAZero);
  const definirObjectif = useDhikr((s) => s.definirObjectif);
  const [feuille, setFeuille] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  const formule = formules.find((f) => f.id === formuleId);
  const compte = comptes[formuleId] ?? 0;
  const choisi = objectifs[formuleId];
  const objectif = choisi === undefined ? (formule?.objectif ?? null) : choisi;

  const fini = objectif !== null && compte >= objectif;

  const unGrain = () => {
    vibrerLeger();
    const n = compter();
    if (objectif !== null && n === objectif) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((erreur: unknown) => {
        console.warn('Retour haptique indisponible', erreur);
      });
    }
  };

  const zero = () => {
    if (compte > SEUIL_CONFIRMATION) setConfirmation(true);
    else remettreAZero();
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Planche : titre centré, « Remettre à zéro » en texte émeraude à droite. */}
      <TopBar
        retour
        centre
        titre={t('dhikr.titre')}
        actions={[{ icone: 'reset', texte: t('dhikr.remettreAZero'), libelle: true, label: t('dhikr.remettreAZero'), desactive: compte === 0, onPress: zero }]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace6, paddingBottom: espace.espace8 + marge, gap: espace.espace4, alignItems: 'center' }}>
        <View style={[styles.puces, { gap: espace.espace2 }]}>
          {formules.map((f) => (
            <Chip key={f.id} compacte selectionne={f.id === formuleId} onPress={() => choisirFormule(f.id)}>
              {f.translitteration}
            </Chip>
          ))}
          <Chip compacte selectionne={formuleId === FORMULE_LIBRE} onPress={() => choisirFormule(FORMULE_LIBRE)}>
            {t('dhikr.formuleLibre')}
          </Chip>
        </View>

        {formule ? (
          <View style={[styles.formule, { gap: espace.espace2, marginTop: espace.espace3 }]}>
            <Text accessibilityLanguage="ar" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.arabe, ligne(styles.arabe), { color: couleurs.encre }]}>
              {formule.arabe}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[latin.translitteration, ligne(styles.translitteration), { color: couleurs.encre2 }]}>
              {formule.translitteration}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: espace.espace3 }}>
          <TasbihCounter compte={compte} objectif={objectif} onCompter={unGrain} />
        </View>

        {fini ? (
          <View style={[styles.fini, { marginTop: espace.espace2 }]}>
            <Text accessibilityLanguage="wo" maxFontSizeMultiplier={echelleMax.grand} style={[latin.titre1, { color: couleurs.emeraude }]}>
              {t('formules.gratitude')}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[latin.translitteration, ligne(styles.translitteration), { color: couleurs.encre2 }]}>
              {t('formules.gratitudeTrad')}
            </Text>
          </View>
        ) : (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.aide), { color: couleurs.encre2, marginTop: espace.espace2 }]}>
            {t('dhikr.aide')}
          </Text>
        )}

        <View style={styles.actions}>
          <Button variant="discret" icone="target" onPress={() => setFeuille(true)}>
            {objectif ? `${t('dhikr.objectif')} : ${objectif}` : t('dhikr.sansObjectif')}
          </Button>
        </View>
        <View style={{ alignSelf: 'stretch' }}>{versetDhikr ? <VersetRubrique verset={versetDhikr} /> : null}</View>
      </ScrollView>

      {/* Feuille de l'objectif : les formules se choisissent déjà par les puces de la page. */}
      <BottomSheet ouvert={feuille} titre={t('dhikr.objectif')} onFermer={() => setFeuille(false)}>
        <SegmentedControl
          label={t('dhikr.objectif')}
          options={[
            ...objectifsProposes.map((n) => ({ id: String(n), label: String(n) })),
            { id: LIBRE, label: t('dhikr.libre') },
          ]}
          valeur={objectif === null ? LIBRE : String(objectif)}
          onChange={(id) => definirObjectif(id === LIBRE ? null : Number(id))}
        />
        <Button variant="principal" pleineLargeur onPress={() => setFeuille(false)}>
          {t('dhikr.commencer')}
        </Button>
      </BottomSheet>

      <Dialog
        ouvert={confirmation}
        titre={t('dhikr.confirmerZeroTitre')}
        confirmer={t('dhikr.remettreAZero')}
        icone="reset"
        onConfirmer={() => {
          remettreAZero();
          setConfirmation(false);
        }}
        onAnnuler={() => setConfirmation(false)}>
        {t('dhikr.confirmerZeroTexte', { n: compte })}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  formule: { alignItems: 'center' },
  arabe: { fontSize: tailles.t34, lineHeight: interlignes.l64, textAlign: 'center', writingDirection: 'rtl' },
  puces: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  translitteration: { fontSize: tailles.t16, lineHeight: interlignes.l24, textAlign: 'center' },
  fini: { alignItems: 'center' },
  aide: { fontSize: tailles.t14, lineHeight: interlignes.l20, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center' },
});
