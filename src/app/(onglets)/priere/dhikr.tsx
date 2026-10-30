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
import { RadioGroup } from '@/ui/RadioGroup';
import { TasbihCounter } from '@/ui/TasbihCounter';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

// Au-delà, remettre à zéro demande une confirmation.
const SEUIL_CONFIRMATION = 100;
const SANS = 'sans';

export default function Dhikr() {
  useKeepAwake();
  const { t } = useTranslation();
  const { couleurs, espace, typographie, latin } = useTheme();
  const { afficher } = useToast();
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

  const unGrain = () => {
    vibrerLeger();
    const n = compter();
    if (objectif !== null && n === objectif) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((erreur: unknown) => {
        console.warn('Retour haptique indisponible', erreur);
      });
      afficher({ texte: `${t('formules.gratitude')} ${t('formules.gratitudeTrad')}`, icone: 'check' });
    }
  };

  const zero = () => {
    if (compte > SEUIL_CONFIRMATION) setConfirmation(true);
    else remettreAZero();
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('dhikr.titre')} />
      <ScrollView contentContainerStyle={{ paddingBottom: espace.espace8, gap: espace.espace4, alignItems: 'center' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: espace.espace5, gap: espace.espace2 }}>
          {formules.map((f) => (
            <Chip key={f.id} selectionne={f.id === formuleId} onPress={() => choisirFormule(f.id)}>
              {f.translitteration}
            </Chip>
          ))}
          <Chip selectionne={formuleId === FORMULE_LIBRE} onPress={() => choisirFormule(FORMULE_LIBRE)}>
            {t('dhikr.formuleLibre')}
          </Chip>
        </ScrollView>

        {formule ? (
          <View style={[styles.formule, { paddingHorizontal: espace.espace5 }]}>
            <Text accessibilityLanguage="ar" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.arabe, styles.arabe, { color: couleurs.encre }]}>
              {formule.arabe}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[latin.translitteration, { color: couleurs.encre2 }]}>
              {formule.translitteration}
            </Text>
          </View>
        ) : null}

        <TasbihCounter compte={compte} objectif={objectif} onCompter={unGrain} />

        <View style={[styles.actions, { gap: espace.espace2 }]}>
          <Button variant="discret" icone="target" onPress={() => setFeuille(true)}>
            {objectif ? `${t('dhikr.objectif')} : ${objectif}` : t('dhikr.sansObjectif')}
          </Button>
          <Button variant="discret" icone="reset" disabled={compte === 0} onPress={zero}>
            {t('dhikr.remettreAZero')}
          </Button>
        </View>
      </ScrollView>

      <BottomSheet ouvert={feuille} titre={t('dhikr.objectif')} onFermer={() => setFeuille(false)}>
        <RadioGroup
          label={t('dhikr.objectif')}
          encadre={false}
          options={[...objectifsProposes.map((n) => ({ id: String(n), label: String(n) })), { id: SANS, label: t('dhikr.sansObjectif') }]}
          valeur={objectif === null ? SANS : String(objectif)}
          onChange={(id) => {
            definirObjectif(id === SANS ? null : Number(id));
            setFeuille(false);
          }}
        />
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
  arabe: { fontSize: 34, lineHeight: 64, textAlign: 'center', writingDirection: 'rtl' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
});
