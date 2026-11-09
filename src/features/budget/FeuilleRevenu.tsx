import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { formatJourCle, cleJour } from '@/lib/dates';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { appliquerTouche, Keypad } from '@/ui/Keypad';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { useToast } from '@/ui/Toast';

import { useFormatMontant } from './verrou';
import type { Carnet, Compte, Depot } from './depot';
import { budgetModifie } from './useBudget';

type Props = { ouvert: boolean; onFermer: () => void; carnet: Carnet; depot: Depot; comptes: Compte[] };

const TYPES = ['salaire', 'commerce', 'cadeau', 'autre'] as const;
type TypeRevenu = (typeof TYPES)[number];

/**
 * Ajouter un revenu au cycle en cours (planche « BudgetRevenu ») : montant au pavé, type, compte de réception.
 * Le type s'écrit dans la note du revenu. « Enregistrer et répartir » ouvre ensuite le jour de paie.
 */
export function FeuilleRevenu({ ouvert, onFermer, carnet, depot, comptes }: Props) {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { espace } = useTheme();
  const { afficher } = useToast();
  const [compteId, setCompteId] = useState<string | null>(null);
  const [saisie, setSaisie] = useState('');
  const [type, setType] = useState<TypeRevenu>('salaire');
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);
  const devise = carnet.devise;
  // Le pavé saisit des unités principales ; en ouguiya, une unité vaut 5 khoums.
  const montant = (Number(saisie || '0') || 0) * devise.sousUnites;
  const valide = montant > 0;
  // Compte de réception : le premier tant que l'utilisateur n'en choisit pas un autre.
  const compte = comptes.find((c) => c.id === compteId) ?? comptes[0];

  const fermer = () => {
    setSaisie('');
    setType('salaire');
    setCompteId(null);
    setEchec(false);
    onFermer();
  };

  const enregistrer = async () => {
    if (!valide) return;
    setEnvoi(true);
    setEchec(false);
    try {
      await depot.ajouterRevenu(carnet, { montant, compteId: compte?.id ?? null, note: t(`budget.revenuTypes.${type}`) });
      budgetModifie();
      afficher({ texte: t('budget.revenuEnregistre', { montant: formatMontant(montant, devise) }), icone: 'check' });
      fermer();
      router.push('/budget/paie');
    } catch (erreur: unknown) {
      console.error('Revenu non enregistré', erreur);
      setEchec(true);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <BottomSheet ouvert={ouvert} titre={t('budget.nouveauRevenu')} onFermer={fermer}>
      <AmountDisplay
        centre
        signe="+"
        tonMontant="revenu"
        montant={montant}
        devise={devise}
        detail={t('budget.recuAujourdhui', { date: formatJourCle(cleJour(new Date()), i18n.language) })}
      />
      <View accessibilityRole="radiogroup" accessibilityLabel={t('budget.typeRevenu')} style={[styles.types, { gap: espace.espace2 }]}>
        {TYPES.map((x) => (
          <Chip key={x} selectionne={x === type} onPress={() => setType(x)}>
            {t(`budget.revenuTypes.${x}`)}
          </Chip>
        ))}
      </View>
      {comptes.length > 1 && comptes.length <= 4 ? (
        <SegmentedControl
          label={t('budget.recuSur')}
          options={comptes.map((c) => ({ id: c.id, label: c.nom }))}
          valeur={compte?.id ?? ''}
          onChange={setCompteId}
        />
      ) : null}
      <Keypad onTouche={(touche) => setSaisie((s) => appliquerTouche(s, touche))} />
      {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
      <Button grand pleineLargeur disabled={!valide || envoi} onPress={enregistrer}>
        {t('budget.enregistrerRepartir')}
      </Button>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  types: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
});
