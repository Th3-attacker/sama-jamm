import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SaisieInvalide } from '@/features/budget/depot';
import { postesDeDepart } from '@/features/budget/enveloppesDeDepart';
import { budgetModifie, depotBudget } from '@/features/budget/useBudget';
import { devisesIntegrees, versMinimes } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Switch } from '@/ui/Switch';
import { TextField } from '@/ui/TextField';
import { TopBar } from '@/ui/TopBar';

type Poste = { garde: boolean; plafond: string };

/** Premier budget : devise, jour de paie, revenu du cycle, enveloppes de départ et leurs plafonds. */
export default function PremierBudget() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const [codeDevise, setCodeDevise] = useState('XOF');
  const [jourPaie, setJourPaie] = useState('');
  const [revenu, setRevenu] = useState('');
  const [postes, setPostes] = useState<Record<string, Poste>>(() =>
    Object.fromEntries(postesDeDepart.map((p) => [p.cle, { garde: true, plafond: '' }])),
  );
  const [envoi, setEnvoi] = useState(false);
  const [erreurGenerale, setErreurGenerale] = useState(false);

  const devise = devisesIntegrees.find((d) => d.code === codeDevise) ?? devisesIntegrees[0];
  const jour = Number(jourPaie);
  const jourValide = /^\d{1,2}$/.test(jourPaie) && jour >= 1 && jour <= 31;
  const minimes = (saisie: string) => (saisie.trim() === '' ? 0 : devise ? versMinimes(saisie, devise) : null);
  const revenuMinimes = minimes(revenu);
  const plafondsValides = postesDeDepart.every(
    (p) => !postes[p.cle]?.garde || minimes(postes[p.cle]?.plafond ?? '') !== null,
  );
  const valide = devise !== undefined && jourValide && revenuMinimes !== null && plafondsValides;

  const changerPoste = (cle: string, modif: Partial<Poste>) =>
    setPostes((actuels) => ({ ...actuels, [cle]: { ...(actuels[cle] ?? { garde: true, plafond: '' }), ...modif } }));

  const creer = async () => {
    if (!valide || !devise || revenuMinimes === null) return;
    setEnvoi(true);
    setErreurGenerale(false);
    try {
      const depot = await depotBudget();
      await depot.creerCarnet({
        nom: t('budget.nomCarnet'),
        deviseCode: devise.code,
        jourPaie: jour,
        revenu: revenuMinimes,
        nomCompte: t('budget.comptesTypes.especes'),
        enveloppes: postesDeDepart
          .filter((p) => postes[p.cle]?.garde)
          .map((p) => ({
            nom: t(`budget.enveloppesDefaut.${p.cle}`),
            icone: p.icone,
            fixe: p.fixe,
            plafond: minimes(postes[p.cle]?.plafond ?? '') ?? 0,
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

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('budget.premierTitre')} />
      <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace5,
          }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {t('budget.premierTexte')}
          </Text>

          <SegmentedControl
            label={t('budget.premierDevise')}
            options={devisesIntegrees.map((d) => ({ id: d.code, label: d.symbole }))}
            valeur={codeDevise}
            onChange={setCodeDevise}
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

          <TextField
            label={t('budget.premierRevenu')}
            valeur={revenu}
            onChange={setRevenu}
            clavier="number-pad"
            suffixe={devise?.symbole}
            aide={t('budget.premierRevenuAide')}
            erreur={revenuMinimes === null ? t('budget.montantInvalide') : undefined}
          />

          <View style={{ gap: espace.espace2 }}>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.titre3, { color: couleurs.encre }]}>
              {t('budget.premierEnveloppes')}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
              {t('budget.premierEnveloppesAide')}
            </Text>
          </View>

          {postesDeDepart.map((p) => {
            const poste = postes[p.cle];
            const nom = t(`budget.enveloppesDefaut.${p.cle}`);
            return (
              <View key={p.cle} style={{ gap: espace.espace2 }}>
                <ListGroup>
                  <ListItem
                    icone={p.icone}
                    titre={nom}
                    droite={
                      <Switch
                        label={nom}
                        active={poste?.garde ?? false}
                        onChange={(garde) => changerPoste(p.cle, { garde })}
                      />
                    }
                  />
                </ListGroup>
                {poste?.garde ? (
                  <TextField
                    label={`${t('budget.plafond')} · ${nom}`}
                    valeur={poste.plafond}
                    onChange={(plafond) => changerPoste(p.cle, { plafond })}
                    clavier="number-pad"
                    suffixe={devise?.symbole}
                    placeholder="0"
                    erreur={minimes(poste.plafond) === null ? t('budget.montantInvalide') : undefined}
                  />
                ) : null}
              </View>
            );
          })}

          {erreurGenerale ? (
            <Banner ton="erreur" titre={t('etats.erreurTitre')}>
              {t('etats.erreurTexte')}
            </Banner>
          ) : null}

          <Button pleineLargeur disabled={!valide || envoi} onPress={creer}>
            {t('budget.premierCommencer')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
