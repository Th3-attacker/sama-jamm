import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SaisieInvalide } from '@/features/budget/depot';
import {
  lireSaisieDate,
  PERSONNE_MAX,
  SENS_DETTE,
  versSaisieDate,
  type SensDette,
} from '@/features/budget/dettes';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { versMinimes, versSaisie } from '@/lib/montant';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { CalendrierDate } from '@/ui/CalendrierDate';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { EnteteRetour } from '@/ui/EnteteRetour';
import { EvitementClavier } from '@/ui/EvitementClavier';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

/** Ajouter une dette, ou la corriger (`?id=`) : sens, personne, montant, échéance et note. */
export default function NouvelleDette() {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace } = useTheme();
  const marge = useMargeBasse();
  const { afficher } = useToast();
  const id = useParametre('id');
  const etat = useBudget((depot, carnet) => (id ? depot.dette(carnet, id) : Promise.resolve(null)), id);
  // null tant que l'utilisateur n'a rien touché : le formulaire montre alors la dette enregistrée.
  const [sens, setSens] = useState<SensDette | null>(null);
  const [personne, setPersonne] = useState<string | null>(null);
  const [montant, setMontant] = useState<string | null>(null);
  const [echeance, setEcheance] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState<string | null>(null);

  const titre = id ? t('dettes.modifier') : t('dettes.ajouter');
  if (etat.etat !== 'pret' || (id && etat.donnees === null)) {
    return <EcranBudgetIncomplet titre={titre} etat={etat} introuvable={t('dettes.introuvable')} />;
  }

  const { carnet, depot, donnees: dette } = etat;
  const devise = carnet.devise;
  const valSens = sens ?? dette?.sens ?? 'prete';
  const valPersonne = personne ?? dette?.personne ?? '';
  const valMontant = montant ?? (dette ? (versSaisie(dette.montantInitial, devise) ?? '') : '');
  const valEcheance = echeance ?? (dette?.echeance ? versSaisieDate(dette.echeance) : '');
  const valNote = note ?? dette?.note ?? '';

  const minimes = versMinimes(valMontant, devise);
  const jourEcheance = valEcheance.trim() === '' ? null : lireSaisieDate(valEcheance);
  const personneOk = valPersonne.trim().length >= 1 && valPersonne.trim().length <= PERSONNE_MAX;
  const montantOk = minimes !== null && minimes > 0;
  const echeanceOk = valEcheance.trim() === '' || jourEcheance !== null;
  const valide = personneOk && montantOk && echeanceOk;

  const enregistrer = async () => {
    if (!valide || minimes === null) return;
    setEnvoi(true);
    setEchec(null);
    const saisie = { sens: valSens, personne: valPersonne, montant: minimes, echeance: jourEcheance, note: valNote };
    try {
      if (dette) await depot.modifierDette(carnet, dette.id, saisie);
      else await depot.ajouterDette(carnet, saisie);
      budgetModifie();
      afficher({ texte: t(dette ? 'budget.modificationEnregistree' : 'dettes.detteEnregistree'), icone: 'check' });
      router.back();
    } catch (erreur: unknown) {
      if (erreur instanceof SaisieInvalide && erreur.cle === 'montantSousRembourse' && dette) {
        setEchec(t('dettes.montantSousRembourse', { montant: formatMontant(dette.rembourse, devise) }));
      } else {
        console.error('Dette non enregistrée', erreur);
        setEchec(t('etats.erreurTexte'));
      }
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <EvitementClavier style={styles.ecran}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace4 + marge,
            gap: espace.espace4,
          }}>
          <EnteteRetour titre={titre} />
          <SegmentedControl
            label={t('dettes.sens')}
            options={[
              { id: 'prete', label: t('dettes.jaiPrete') },
              { id: 'emprunte', label: t('dettes.jaiEmprunte') },
            ]}
            valeur={valSens}
            onChange={(choix) => {
              const s = SENS_DETTE.find((x) => x === choix);
              if (s) setSens(s);
            }}
          />
          <TextField
            label={t('dettes.personne')}
            placeholder={t('dettes.personnePlaceholder')}
            valeur={valPersonne}
            onChange={setPersonne}
            maxLength={PERSONNE_MAX}
            erreur={personne !== null && !personneOk ? t('dettes.personneInvalide') : undefined}
          />
          <TextField
            label={t('dettes.montant')}
            valeur={valMontant}
            onChange={setMontant}
            clavier={devise.decimales > 0 ? 'decimal-pad' : 'number-pad'}
            suffixe={devise.symbole}
            placeholder="0"
            erreur={montant !== null && !montantOk ? t('budget.montantInvalide') : undefined}
          />
          <CalendrierDate
            label={t('dettes.echeance')}
            placeholder={t('dettes.datePlaceholder')}
            valeur={valEcheance}
            onChange={setEcheance}
            erreur={!echeanceOk ? t('dettes.dateInvalide') : undefined}
          />
          <TextField
            label={t('dettes.note')}
            placeholder={t('dettes.notePlaceholder')}
            valeur={valNote}
            onChange={setNote}
            maxLength={120}
          />
          <Banner ton="info" icone="info">
            {t('dettes.bandeauPrive')}
          </Banner>
          {echec ? <Banner ton="erreur">{echec}</Banner> : null}
          <View style={styles.espace} />
          <Button grand pleineLargeur disabled={!valide || envoi} onPress={enregistrer}>
            {t('commun.enregistrer')}
          </Button>
        </ScrollView>
      </EvitementClavier>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  espace: { flex: 1 },
});
