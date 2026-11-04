import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatMontant, versMinimes } from '@/lib/montant';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';

import type { Carnet, Depot } from './depot';
import { budgetModifie } from './useBudget';

type Props = { ouvert: boolean; onFermer: () => void; carnet: Carnet; depot: Depot };

/** Ajouter un revenu au cycle en cours (salaire, aide…) : le reçu et la dépense du jour se recalculent. */
export function FeuilleRevenu({ ouvert, onFermer, carnet, depot }: Props) {
  const { t } = useTranslation();
  const { afficher } = useToast();
  const [saisie, setSaisie] = useState('');
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);
  const devise = carnet.devise;
  const montant = saisie.trim() === '' ? null : versMinimes(saisie, devise);
  const valide = montant !== null && montant > 0;

  const fermer = () => {
    setSaisie('');
    setNote('');
    setEchec(false);
    onFermer();
  };

  const enregistrer = async () => {
    if (!valide || montant === null) return;
    setEnvoi(true);
    setEchec(false);
    try {
      // En attendant les comptes multiples, l'argent reçu va sur le premier compte (Espèces).
      const [compte] = await depot.comptes(carnet.id);
      await depot.ajouterRevenu(carnet, { montant, compteId: compte?.id ?? null, note });
      budgetModifie();
      afficher({ texte: t('budget.revenuEnregistre', { montant: formatMontant(montant, devise) }), icone: 'check' });
      fermer();
    } catch (erreur: unknown) {
      console.error('Revenu non enregistré', erreur);
      setEchec(true);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <BottomSheet ouvert={ouvert} titre={t('budget.nouveauRevenu')} onFermer={fermer}>
      <TextField
        label={t('budget.montant')}
        valeur={saisie}
        onChange={setSaisie}
        clavier={devise.decimales > 0 ? 'decimal-pad' : 'number-pad'}
        suffixe={devise.symbole}
        erreur={saisie.trim() !== '' && !valide ? t('budget.montantInvalide') : undefined}
      />
      <TextField
        label={t('budget.note')}
        valeur={note}
        onChange={setNote}
        maxLength={120}
        aide={t('budget.noteRevenuAide')}
      />
      {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
      <Button pleineLargeur disabled={!valide || envoi} onPress={enregistrer}>
        {t('commun.enregistrer')}
      </Button>
    </BottomSheet>
  );
}
