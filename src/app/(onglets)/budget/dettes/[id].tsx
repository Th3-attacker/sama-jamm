import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import type { PaiementDette } from '@/features/budget/depot';
import { etatEcheance } from '@/features/budget/dettes';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { cleJour, formatJourCle } from '@/lib/dates';
import { formatMontant as formatMontantReel } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { ProgressBar } from '@/ui/ProgressBar';
import { useToast } from '@/ui/Toast';
import { EnteteRetour } from '@/ui/EnteteRetour';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

/** Détail d'une dette : reste, remboursements, rappel, correction et annulation. */
export default function EcranDette() {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie } = useTheme();
  const marge = useMargeBasse();
  const { afficher } = useToast();
  const id = useParametre('id');
  const etat = useBudget((depot, carnet) => depot.dette(carnet, id), id);
  const [annuler, setAnnuler] = useState(false);
  const [aSupprimer, setASupprimer] = useState<PaiementDette | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret' || etat.donnees === null) {
    return <EcranBudgetIncomplet titre={t('dettes.titre')} etat={etat} introuvable={t('dettes.introuvable')} />;
  }

  const { carnet, depot, donnees: d } = etat;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);
  const date = (j: string) => formatJourCle(j, i18n.language);
  const ouverte = d.statut === 'ouverte';
  const echeance = etatEcheance(d.echeance, cleJour(new Date()));
  const libelleType = (p: PaiementDette) => (p.type === 'remise' ? t('dettes.remise') : t('dettes.remboursement'));

  const agir = async (action: () => Promise<void>, message: string, icone: 'check' | 'trash') => {
    setEnvoi(true);
    setEchec(false);
    try {
      await action();
      budgetModifie();
      afficher({ texte: message, icone });
    } catch (erreur: unknown) {
      console.error('Dette non modifiée', erreur);
      setEchec(true);
    }
    setEnvoi(false);
  };

  const rappeler = () => {
    // Le message part tel quel : le vrai montant, même si l'œil masque les montants à l'écran.
    Share.share({
      message: t('dettes.rappelMessage', { personne: d.personne, montant: formatMontantReel(d.reste, devise) }),
    }).catch((erreur: unknown) => console.warn('Partage du rappel impossible', erreur));
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace6,
          paddingBottom: espace.espace8 + marge,
          gap: espace.espace4,
        }}>
        <EnteteRetour
          titre={d.personne}
          sousTitre={
            d.sens === 'prete'
              ? t('dettes.onMeDoitDepuis', { date: date(d.date) })
              : t('dettes.jeDoisDepuis', { date: date(d.date) })
          }
        />
        <AmountDisplay
          montant={d.reste}
          devise={devise}
          libelle={t('dettes.reste')}
          detail={
            d.echeance
              ? t('dettes.resteDetailEcheance', { total: f(d.montantInitial), date: date(d.echeance) })
              : t('dettes.resteDetail', { total: f(d.montantInitial) })
          }
        />
        <ProgressBar
          valeur={d.montantInitial > 0 ? d.rembourse / d.montantInitial : 0}
          label={t('dettes.dejaRembourse')}
          detail={t('dettes.progression', { fait: f(d.rembourse), total: f(d.montantInitial) })}
          ton="or"
        />

        {!ouverte ? (
          <Banner ton="succes" icone="check">
            {d.statut === 'soldee' ? t('dettes.statutSoldee') : t('dettes.statutAnnulee')}
          </Banner>
        ) : echeance.type === 'passee' ? (
          <Banner ton="attention" icone="alert">
            {t('dettes.bandeauPassee', { count: echeance.jours })}
          </Banner>
        ) : null}

        {d.note ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {d.note}
          </Text>
        ) : null}

        {d.paiements.length > 0 ? (
          <ListGroup titre={t('dettes.historique')}>
            {d.paiements.map((p) => (
              <ListItem
                key={p.id}
                icone="check"
                titre={t('dettes.paiementLigne', { type: libelleType(p), montant: f(p.montant) })}
                sousTitre={date(p.date)}
                onPress={() => setASupprimer(p)}
              />
            ))}
          </ListGroup>
        ) : null}

        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

        {ouverte ? (
          <Button
            icone="plus"
            pleineLargeur
            disabled={envoi}
            onPress={() => router.push({ pathname: '/budget/dettes/remboursement', params: { id: d.id } })}>
            {t('dettes.enregistrerRemboursement')}
          </Button>
        ) : null}
        {ouverte && d.sens === 'prete' ? (
          <Button variant="secondaire" icone="share" pleineLargeur onPress={rappeler}>
            {t('dettes.rappel')}
          </Button>
        ) : null}
        <Button
          variant="secondaire"
          icone="edit"
          pleineLargeur
          disabled={envoi}
          onPress={() => router.push({ pathname: '/budget/dettes/nouvelle', params: { id: d.id } })}>
          {t('dettes.modifier')}
        </Button>
        {ouverte ? (
          <Button variant="discret" pleineLargeur disabled={envoi} onPress={() => setAnnuler(true)}>
            {t('dettes.annuler')}
          </Button>
        ) : null}
      </ScrollView>

      <Dialog
        ouvert={annuler}
        danger
        titre={t('dettes.annulerTitre')}
        confirmer={t('dettes.annuler')}
        onAnnuler={() => setAnnuler(false)}
        onConfirmer={() => {
          setAnnuler(false);
          void agir(() => depot.annulerDette(carnet, d.id), t('dettes.detteAnnulee'), 'check');
        }}>
        {t('dettes.annulerTexte', { personne: d.personne })}
      </Dialog>

      <Dialog
        ouvert={aSupprimer !== null}
        danger
        icone="trash"
        titre={t('dettes.supprimerPaiementTitre')}
        confirmer={t('dettes.supprimerPaiement')}
        onAnnuler={() => setASupprimer(null)}
        onConfirmer={() => {
          const p = aSupprimer;
          setASupprimer(null);
          if (p) void agir(() => depot.supprimerPaiement(carnet, p.id), t('dettes.paiementSupprime'), 'trash');
        }}>
        {aSupprimer
          ? t('dettes.supprimerPaiementTexte', {
              type: libelleType(aSupprimer),
              montant: f(aSupprimer.montant),
              date: date(aSupprimer.date),
            })
          : ''}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
