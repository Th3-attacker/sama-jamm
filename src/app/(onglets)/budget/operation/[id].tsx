import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { formatJourCle } from '@/lib/dates';
import { formatMontant, versMinimes, versSaisie } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Dialog } from '@/ui/Dialog';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

/** Corriger ou supprimer une opération (dépense ou revenu). Le jour et le cycle ne changent pas. */
export default function EcranOperation() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const etat = useBudget(
    async (depot, carnet) => ({
      operation: await depot.operation(carnet, id),
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
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  const titre = t('budget.modifierOperation');
  if (etat.etat !== 'pret' || etat.donnees.operation === null) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={titre} />
        {etat.etat === 'pret' ? (
          <View style={{ padding: espace.espace5 }}>
            <Banner ton="erreur">{t('budget.operationIntrouvable')}</Banner>
          </View>
        ) : (
          <EtatsBudget etat={etat} />
        )}
      </View>
    );
  }

  const { carnet, depot, donnees } = etat;
  const op = donnees.operation;
  if (!op) return null;
  const devise = carnet.devise;
  const estDepense = op.type === 'depense';
  const texteMontant = saisie ?? versSaisie(op.montant, devise) ?? '';
  const montant = versMinimes(texteMontant, devise);
  const choixEnveloppe = enveloppeId ?? op.enveloppeId;
  const nomEnveloppe = donnees.enveloppes.find((e) => e.id === choixEnveloppe)?.nom ?? '';
  const valide =
    montant !== null && montant > 0 && (!estDepense || donnees.enveloppes.some((e) => e.id === choixEnveloppe));

  const enregistrer = async () => {
    if (!valide || montant === null) return;
    setEnvoi(true);
    setEchec(false);
    try {
      await depot.modifierOperation(carnet, op.id, {
        montant,
        enveloppeId: choixEnveloppe,
        compteId: op.compteId,
        note: note ?? op.note,
      });
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
      <TopBar retour titre={titre} sousTitre={formatJourCle(op.date, i18n.language)} />
      <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace5,
          }}>
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: espace.espace2 }}>
                {donnees.enveloppes.map((e) => (
                  <Chip key={e.id} selectionne={e.id === choixEnveloppe} onPress={() => setEnveloppeId(e.id)}>
                    {e.nom}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <TextField label={t('budget.note')} valeur={note ?? op.note ?? ''} onChange={setNote} maxLength={120} />

          {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

          <Button pleineLargeur disabled={!valide || envoi} onPress={enregistrer}>
            {t('commun.enregistrer')}
          </Button>
          <Button variant="danger" icone="trash" pleineLargeur disabled={envoi} onPress={() => setConfirmer(true)}>
            {t('budget.supprimerOperation')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Dialog
        ouvert={confirmer}
        danger
        icone="trash"
        titre={t('budget.supprimerOperationTitre')}
        confirmer={t('budget.supprimerOperation')}
        onAnnuler={() => setConfirmer(false)}
        onConfirmer={supprimer}>
        {t('budget.supprimerOperationTexte', {
          montant: formatMontant(op.montant, devise),
          enveloppe: estDepense ? nomEnveloppe : t('budget.recu'),
          date: formatJourCle(op.date, i18n.language),
        })}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
