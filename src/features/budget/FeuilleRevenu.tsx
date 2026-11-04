import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { formatMontant, versMinimes } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';

import type { Carnet, Compte, Depot } from './depot';
import { budgetModifie } from './useBudget';

type Props = { ouvert: boolean; onFermer: () => void; carnet: Carnet; depot: Depot; comptes: Compte[] };

/** Ajouter un revenu au cycle en cours (salaire, aide…) : le reçu et la dépense du jour se recalculent. */
export function FeuilleRevenu({ ouvert, onFermer, carnet, depot, comptes }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const [compteId, setCompteId] = useState<string | null>(null);
  const { afficher } = useToast();
  const [saisie, setSaisie] = useState('');
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);
  const devise = carnet.devise;
  const montant = saisie.trim() === '' ? null : versMinimes(saisie, devise);
  const valide = montant !== null && montant > 0;
  // Compte de réception : Espèces (le premier) tant que l'utilisateur n'en choisit pas un autre.
  const compte = comptes.find((c) => c.id === compteId) ?? comptes[0];

  const fermer = () => {
    setSaisie('');
    setNote('');
    setCompteId(null);
    setEchec(false);
    onFermer();
  };

  const enregistrer = async () => {
    if (!valide || montant === null) return;
    setEnvoi(true);
    setEchec(false);
    try {
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
      {comptes.length > 1 ? (
        <View style={{ gap: espace.espace2 }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
            {t('budget.compte')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espace.espace2 }}>
            {comptes.map((c) => (
              <Chip key={c.id} selectionne={c.id === compte?.id} onPress={() => setCompteId(c.id)}>
                {c.nom}
              </Chip>
            ))}
          </ScrollView>
        </View>
      ) : null}
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
