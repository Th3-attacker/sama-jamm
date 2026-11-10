import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFormatMontant } from '@/features/budget/verrou';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { ajouterJours } from '@/features/budget/cycle';
import { cleJour, formatJourCle } from '@/lib/dates';
import { versMinimes, versSaisie } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Dialog } from '@/ui/Dialog';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { EnteteRetour } from '@/ui/EnteteRetour';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { EvitementClavier } from '@/ui/EvitementClavier';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

/** Corriger ou supprimer une opération (dépense ou revenu). Le jour et le cycle ne changent pas. */
export default function EcranOperation() {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie } = useTheme();
  const marge = useMargeBasse();
  const { afficher } = useToast();
  const id = useParametre('id');
  const etat = useBudget(
    async (depot, carnet) => ({
      operation: await depot.operation(carnet, id),
      comptes: await depot.comptes(carnet.id),
      enveloppes: await (async () => {
        // Enveloppes actives, plus celle de la dépense si elle est archivée : la dépense peut la garder.
        const actives = (await depot.mois(carnet)).enveloppes;
        const op = await depot.operation(carnet, id);
        if (!op?.enveloppeId || actives.some((e) => e.id === op.enveloppeId)) return actives;
        const sienne = (await depot.detailEnveloppe(carnet, op.enveloppeId))?.enveloppe;
        return sienne ? [sienne, ...actives] : actives;
      })(),
    }),
    id,
  );
  // null tant que l'utilisateur n'a rien touché : le formulaire montre alors les valeurs enregistrées.
  const [saisie, setSaisie] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [enveloppeId, setEnveloppeId] = useState<string | null>(null);
  const [jour, setJour] = useState<string | null>(null);
  const [compteId, setCompteId] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  const titre = t('budget.modifierOperation');
  if (etat.etat !== 'pret' || etat.donnees.operation === null) {
    return <EcranBudgetIncomplet titre={titre} etat={etat} introuvable={t('budget.operationIntrouvable')} />;
  }

  const { carnet, depot, donnees } = etat;
  const op = donnees.operation;
  if (!op) return null;
  const devise = carnet.devise;
  const estDepense = op.type === 'depense';
  const texteMontant = saisie ?? versSaisie(op.montant, devise) ?? '';
  const montant = versMinimes(texteMontant, devise);
  const choixEnveloppe = enveloppeId ?? op.enveloppeId;
  const choixCompte = compteId ?? op.compteId;
  const nomEnveloppe = donnees.enveloppes.find((e) => e.id === choixEnveloppe)?.nom ?? '';
  const valide =
    montant !== null && montant > 0 && (!estDepense || donnees.enveloppes.some((e) => e.id === choixEnveloppe));
  // Jours proposés : de la fin du cycle (ou aujourd'hui) en remontant, 14 au plus, sans sortir du cycle.
  const aujourdhui = cleJour(new Date());
  const hier = ajouterJours(aujourdhui, -1);
  const dernierJour = aujourdhui < op.cycleFin ? aujourdhui : op.cycleFin;
  const jours: string[] = [];
  for (let j = dernierJour; j >= op.cycleDebut && jours.length < 14; j = ajouterJours(j, -1)) jours.push(j);
  if (!jours.includes(op.date)) jours.push(op.date);
  const choixJour = jour ?? op.date;
  const libelleJour = (j: string) =>
    j === aujourdhui ? t('budget.aujourdhui') : j === hier ? t('budget.hier') : formatJourCle(j, i18n.language);

  const enregistrer = async () => {
    if (!valide || montant === null) return;
    setEnvoi(true);
    setEchec(false);
    try {
      await depot.modifierOperation(carnet, op.id, {
        montant,
        enveloppeId: choixEnveloppe,
        compteId: choixCompte,
        note: note ?? op.note,
      });
      if (choixJour !== op.date) await depot.modifierDateOperation(carnet, op.id, choixJour);
      budgetModifie();
      afficher({ texte: t('budget.modificationEnregistree'), icone: 'check' });
      router.back();
    } catch (erreur: unknown) {
      console.error('Opération non modifiée', erreur);
      setEchec(true);
      setEnvoi(false);
    }
  };

  const supprimer = async () => {
    setConfirmer(false);
    setEnvoi(true);
    try {
      await depot.supprimerOperation(carnet, op.id);
      budgetModifie();
      afficher({ texte: t('budget.operationSupprimee'), icone: 'trash' });
      router.back();
    } catch (erreur: unknown) {
      console.error('Opération non supprimée', erreur);
      setEchec(true);
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
          <EnteteRetour titre={t('budget.operationTitre')} />
          <AmountDisplay
            centre
            montant={op.montant}
            devise={devise}
            libelle={
              op.type === 'depense'
                ? t('budget.operationDepense')
                : op.type === 'revenu'
                  ? t('budget.operationRevenu')
                  : t('budget.epargneOperation')
            }
            detail={formatJourCle(op.date, i18n.language)}
          />
          <TextField
            label={t('budget.montant')}
            valeur={texteMontant}
            onChange={setSaisie}
            clavier={devise.decimales > 0 ? 'decimal-pad' : 'number-pad'}
            suffixe={devise.symbole}
            erreur={montant === null || montant <= 0 ? t('budget.montantInvalide') : undefined}
          />

          {estDepense ? (
            <View style={{ gap: espace.espace2 }}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
                {t('budget.enveloppe')}
              </Text>
              <View style={[styles.puces, { gap: espace.espace2 }]}>
                {donnees.enveloppes.map((e) => (
                  <Chip key={e.id} selectionne={e.id === choixEnveloppe} onPress={() => setEnveloppeId(e.id)}>
                    {e.nom}
                  </Chip>
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ gap: espace.espace2 }}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
              {t('budget.jourOperation')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: espace.espace2 }}>
              {jours.map((j) => (
                <Chip key={j} selectionne={j === choixJour} onPress={() => setJour(j)}>
                  {libelleJour(j)}
                </Chip>
              ))}
            </ScrollView>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
              {t('budget.jourOperationAide')}
            </Text>
          </View>

          <TextField label={t('budget.note')} valeur={note ?? op.note ?? ''} onChange={setNote} maxLength={120} />

          {donnees.comptes.length > 1 && donnees.comptes.length <= 4 ? (
            <SegmentedControl
              label={t('budget.payeAvec')}
              options={donnees.comptes.map((c) => ({ id: c.id, label: c.nom }))}
              valeur={choixCompte ?? ''}
              onChange={setCompteId}
            />
          ) : null}

          <View style={styles.espace} />

          {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

          <Button grand pleineLargeur disabled={!valide || envoi} onPress={enregistrer}>
            {t('commun.enregistrer')}
          </Button>
          <Button grand variant="danger" icone="trash" pleineLargeur disabled={envoi} onPress={() => setConfirmer(true)}>
            {t('budget.supprimerOperation')}
          </Button>
        </ScrollView>
      </EvitementClavier>

      <Dialog
        ouvert={confirmer}
        danger
        icone="trash"
        titre={t(estDepense ? 'budget.supprimerDepenseTitre' : 'budget.supprimerOperationTitre')}
        confirmer={t('budget.supprimerOperation')}
        annuler={t('budget.garder')}
        onAnnuler={() => setConfirmer(false)}
        onConfirmer={supprimer}>
        {estDepense
          ? t('budget.supprimerDepenseTexte', {
              montant: formatMontant(op.montant, devise),
              enveloppe: nomEnveloppe,
            })
          : t('budget.supprimerOperationTexte', {
              montant: formatMontant(op.montant, devise),
              enveloppe: op.type === 'epargne' ? t('epargne.titre') : t('budget.recu'),
              date: formatJourCle(op.date, i18n.language),
            })}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
  espace: { flex: 1 },
});
