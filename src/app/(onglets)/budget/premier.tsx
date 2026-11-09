import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SaisieInvalide } from '@/features/budget/depot';
import { postesCochesParDefaut, postesDeDepart } from '@/features/budget/enveloppesDeDepart';
import { FormulaireDevise } from '@/features/budget/FormulaireDevise';
import { budgetModifie, depotBudget } from '@/features/budget/useBudget';
import { devisesIntegrees, type Devise } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TextField } from '@/ui/TextField';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

/** Premier budget : devise, jour de paie, revenu du cycle, enveloppes de départ et leurs plafonds. */
export default function PremierBudget() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const marge = useMargeBasse();
  const insets = useSafeAreaInsets();
  const [codeDevise, setCodeDevise] = useState('XOF');
  const [jourPaie, setJourPaie] = useState('');
  // Les plafonds se règlent ensuite, au jour de paie : ici on ne choisit que les enveloppes à garder.
  const [gardees, setGardees] = useState<readonly string[]>(postesCochesParDefaut);
  const [envoi, setEnvoi] = useState(false);
  const [erreurGenerale, setErreurGenerale] = useState(false);
  const [devises, setDevises] = useState<readonly Devise[]>(devisesIntegrees);
  const [ajoutDevise, setAjoutDevise] = useState(false);

  // Devises personnelles déjà enregistrées (ajoutées lors d'un essai précédent) : la liste intégrée en attendant.
  useEffect(() => {
    let actif = true;
    depotBudget()
      .then((depot) => depot.devises())
      .then((liste) => {
        if (actif && liste.length > 0) setDevises(liste);
      })
      .catch((erreur: unknown) => console.warn('Devises non lues', erreur));
    return () => {
      actif = false;
    };
  }, []);

  const devise = devises.find((d) => d.code === codeDevise) ?? devises[0];
  const jour = Number(jourPaie);
  const jourValide = /^\d{1,2}$/.test(jourPaie) && jour >= 1 && jour <= 31;
  const valide = devise !== undefined && jourValide;

  const basculer = (cle: string) =>
    setGardees((actuelles) => (actuelles.includes(cle) ? actuelles.filter((c) => c !== cle) : [...actuelles, cle]));

  const creer = async () => {
    if (!valide || !devise) return;
    setEnvoi(true);
    setErreurGenerale(false);
    try {
      const depot = await depotBudget();
      await depot.creerCarnet({
        nom: t('budget.nomCarnet'),
        deviseCode: devise.code,
        jourPaie: jour,
        revenu: 0,
        nomCompte: t('budget.comptesTypes.especes'),
        enveloppes: postesDeDepart
          .filter((p) => gardees.includes(p.cle))
          .map((p) => ({
            nom: t(`budget.enveloppesDefaut.${p.cle}`),
            icone: p.icone,
            fixe: p.fixe,
            plafond: 0,
          })),
      });
      budgetModifie();
      router.replace('/budget');
    } catch (erreur: unknown) {
      if (!(erreur instanceof SaisieInvalide)) console.error('Création du budget impossible', erreur);
      setErreurGenerale(true);
      setEnvoi(false);
    }
  };

  // Contrôle segmenté : les trois premières devises ; la devise choisie, même personnelle, remplace la troisième.
  const visibles = devises.slice(0, 3);
  if (devise && !visibles.some((d) => d.code === devise.code)) visibles[visibles.length - 1] = devise;
  const optionsDevise = [
    ...visibles.map((d) => ({ id: d.code, label: d.symbole })),
    { id: 'autre', label: t('budget.premierAutreDevise') },
  ];

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + espace.espace4,
            paddingHorizontal: espace.espace5,
            paddingBottom: marge + espace.espace4,
            gap: espace.espace4,
          }}>
          <View style={{ gap: espace.espace2 }}>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.titre1, { color: couleurs.emeraude }]}>
              {t('budget.premierTitre')}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
              {t('budget.premierTexte')}
            </Text>
          </View>

          <SegmentedControl
            label={t('budget.premierDevise')}
            options={optionsDevise}
            valeur={devise?.code ?? ''}
            onChange={(id) => (id === 'autre' ? setAjoutDevise(true) : setCodeDevise(id))}
          />

          <TextField
            label={t('budget.premierJourPaie')}
            valeur={jourPaie}
            onChange={setJourPaie}
            placeholder="25"
            clavier="number-pad"
            maxLength={2}
            aide={t('budget.premierJourPaieAide')}
            erreur={jourPaie !== '' && !jourValide ? t('budget.jourPaieInvalide') : undefined}
          />

          <View accessibilityRole="radiogroup" style={{ gap: espace.espace2 }}>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.libelle, { color: couleurs.encre }]}>
              {t('budget.premierEnveloppes')}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.petit, { color: couleurs.encre3 }]}>
              {t('budget.premierEnveloppesAide')}
            </Text>
            <View style={[styles.puces, { gap: espace.espace2 }]}>
              {postesDeDepart.map((p) => (
                <Chip key={p.cle} selectionne={gardees.includes(p.cle)} onPress={() => basculer(p.cle)}>
                  {t(`budget.enveloppesDefaut.${p.cle}`)}
                </Chip>
              ))}
            </View>
          </View>

          {erreurGenerale ? (
            <Banner ton="erreur" titre={t('etats.erreurTitre')}>
              {t('etats.erreurTexte')}
            </Banner>
          ) : null}

          <View style={styles.espace} />
          <View style={{ gap: espace.espace2 }}>
            <Button grand pleineLargeur disabled={!valide || envoi} onPress={creer}>
              {t('budget.premierCommencer')}
            </Button>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.corps, styles.petit, styles.centre, { color: couleurs.encre3 }]}>
              {t('budget.premierResume', { count: gardees.length })}
            </Text>
            <Button variant="discret" icone="reset" pleineLargeur onPress={() => router.push('/budget/sauvegarde')}>
              {t('sauvegarde.depuisPremier')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet ouvert={ajoutDevise} titre={t('devise.ajouter')} onFermer={() => setAjoutDevise(false)}>
        {ajoutDevise ? (
          <FormulaireDevise
            onAjoutee={(d) => {
              setDevises((liste) => [...liste, d]);
              setCodeDevise(d.code);
              setAjoutDevise(false);
            }}
          />
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
  petit: { fontSize: 14, lineHeight: 20 },
  centre: { textAlign: 'center' },
  espace: { flex: 1 },
});
