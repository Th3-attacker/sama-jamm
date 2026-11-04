import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';

import { reinitialiserBudget } from './db';
import { budgetModifie, oublierDepot, type EtatBudget } from './useBudget';

/**
 * Ce qu'affiche un écran du budget tant que ses données ne sont pas prêtes.
 * `null` quand l'état est `pret` : l'écran affiche alors son contenu.
 */
export function EtatsBudget({ etat }: { etat: EtatBudget<unknown> }) {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const [confirmer, setConfirmer] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat === 'pret') return null;

  if (etat.etat === 'chargement') {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={couleurs.emeraude} />
      </View>
    );
  }

  if (etat.etat === 'vide') {
    return (
      <EmptyState
        icone="wallet"
        titre={t('budget.premierTitre')}
        lang="fr"
        texte={t('budget.premierTexte')}
        action={{ label: t('budget.premierCommencer'), onPress: () => router.push('/budget/premier') }}
      />
    );
  }

  if (etat.etat === 'erreur') {
    return (
      <View style={{ padding: espace.espace5 }}>
        <Banner
          ton="erreur"
          titre={t('etats.erreurTitre')}
          action={{ label: t('commun.reessayer'), onPress: budgetModifie }}>
          {t('etats.erreurTexte')}
        </Banner>
      </View>
    );
  }

  // Base illisible : on explique, et on n'efface qu'après une confirmation explicite.
  return (
    <View style={{ padding: espace.espace5, gap: espace.espace4 }}>
      <Banner ton="erreur" titre={t('budget.illisibleTitre')}>
        {t('budget.illisibleTexte')}
      </Banner>
      {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
      <Button variant="danger" pleineLargeur onPress={() => setConfirmer(true)}>
        {t('budget.reinitialiser')}
      </Button>
      <Dialog
        ouvert={confirmer}
        danger
        icone="trash"
        titre={t('budget.reinitialiserTitre')}
        confirmer={t('budget.effacer')}
        onAnnuler={() => setConfirmer(false)}
        onConfirmer={() => {
          setConfirmer(false);
          reinitialiserBudget()
            .then(() => {
              oublierDepot();
              budgetModifie();
            })
            .catch((erreur: unknown) => {
              console.error('Remise à zéro du budget impossible', erreur);
              setEchec(true);
            });
        }}>
        {t('budget.reinitialiserTexte')}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
