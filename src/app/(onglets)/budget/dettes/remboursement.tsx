import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ajouterJours } from '@/features/budget/cycle';
import { lireSaisieDate, masqueDate } from '@/features/budget/dettes';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { cleJour } from '@/lib/dates';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';
import { echelleMax } from '@/theme/typographie';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Dialog } from '@/ui/Dialog';
import { appliquerTouche, Keypad } from '@/ui/Keypad';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { EnteteRetour } from '@/ui/EnteteRetour';

type ChoixJour = 'aujourdhui' | 'hier' | 'autre';

/** Enregistrer un remboursement d'une dette (jamais plus que le reste), ou faire remise du reste. */
export default function Remboursement() {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie } = useTheme();
  const marge = useMargeBasse();
  const { afficher } = useToast();
  const id = useParametre('id');
  const etat = useBudget((depot, carnet) => depot.dette(carnet, id), id);
  const [saisie, setSaisie] = useState('');
  const [choixJour, setChoixJour] = useState<ChoixJour>('aujourdhui');
  const [autreDate, setAutreDate] = useState('');
  const [remise, setRemise] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret' || etat.donnees === null || etat.donnees.statut !== 'ouverte') {
    return <EcranBudgetIncomplet titre={t('dettes.rembTitre')} etat={etat} introuvable={t('dettes.introuvable')} />;
  }

  const { carnet, depot, donnees: d } = etat;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);
  // Le pavé saisit des unités principales ; en ouguiya, une unité vaut 5 khoums.
  const montant = (Number(saisie || '0') || 0) * devise.sousUnites;
  const apres = d.reste - montant;
  const aujourdhui = cleJour(new Date());
  const jour =
    choixJour === 'aujourdhui'
      ? aujourdhui
      : choixJour === 'hier'
        ? ajouterJours(aujourdhui, -1)
        : lireSaisieDate(autreDate);
  const valide = montant > 0 && apres >= 0 && jour !== null;

  const enregistrer = async (type: 'remboursement' | 'remise') => {
    if (jour === null || (type === 'remboursement' && !valide)) return;
    setEnvoi(true);
    setEchec(false);
    try {
      await depot.ajouterPaiement(carnet, d.id, { type, montant, date: jour, note: null });
      budgetModifie();
      const solde = type === 'remise' || apres === 0;
      afficher({ texte: solde ? t('dettes.detteSoldee') : t('dettes.paiementEnregistre'), icone: 'check' });
      router.back();
    } catch (erreur: unknown) {
      console.error('Remboursement non enregistré', erreur);
      setEchec(true);
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: espace.espace5,
          paddingBottom: marge + espace.espace5,
          gap: espace.espace4,
        }}>
        <EnteteRetour titre={t('dettes.rembTitre')} fermer />
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.petit, { color: couleurs.encre2 }]}>
          {d.sens === 'prete'
            ? t('dettes.rembOnMeDoit', { personne: d.personne, montant: f(d.reste) })
            : t('dettes.rembJeDois', { personne: d.personne, montant: f(d.reste) })}
        </Text>
        <AmountDisplay
          centre
          montant={montant}
          devise={devise}
          libelle={d.sens === 'prete' ? t('dettes.montantRecu') : t('dettes.montantVerse')}
          detail={
            montant > 0
              ? apres >= 0
                ? t('dettes.ilRestera', { montant: f(apres) })
                : t('dettes.depasse', { montant: f(d.reste) })
              : undefined
          }
          tonDetail={apres < 0 ? 'alerte' : 'normal'}
        />

        <View style={[styles.ligne, { gap: espace.espace2 }]}>
          <Chip selectionne={choixJour === 'aujourdhui'} onPress={() => setChoixJour('aujourdhui')}>
            {t('budget.aujourdhui')}
          </Chip>
          <Chip selectionne={choixJour === 'hier'} onPress={() => setChoixJour('hier')}>
            {t('budget.hier')}
          </Chip>
          <Chip selectionne={choixJour === 'autre'} onPress={() => setChoixJour('autre')}>
            {t('dettes.autreDate')}
          </Chip>
        </View>
        {choixJour === 'autre' ? (
          <TextField
            label={t('dettes.date')}
            placeholder={t('dettes.datePlaceholder')}
            valeur={autreDate}
            onChange={(v) => setAutreDate(masqueDate(v))}
            clavier="number-pad"
            maxLength={10}
            erreur={autreDate !== '' && jour === null ? t('dettes.dateInvalide') : undefined}
          />
        ) : null}

        <View style={styles.espace} />
        <Keypad onTouche={(touche) => setSaisie((s) => appliquerTouche(s, touche))} />

        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

        <Button grand pleineLargeur disabled={!valide || envoi} onPress={() => enregistrer('remboursement')}>
          {t('commun.enregistrer')}
        </Button>
        <Button grand variant="discret" pleineLargeur disabled={envoi || jour === null} onPress={() => setRemise(true)}>
          {t('dettes.faireRemise')}
        </Button>
      </ScrollView>

      <Dialog
        ouvert={remise}
        titre={t('dettes.remiseTitre')}
        confirmer={t('dettes.faireRemise')}
        onAnnuler={() => setRemise(false)}
        onConfirmer={() => {
          setRemise(false);
          void enregistrer('remise');
        }}>
        {t('dettes.remiseTexte', { montant: f(d.reste) })}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  ligne: { flexDirection: 'row', flexWrap: 'wrap' },
  petit: { fontSize: 14, lineHeight: 20 },
  espace: { flex: 1 },
});
