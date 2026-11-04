import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { versCsv } from '@/features/budget/exportCsv';
import {
  choisirSauvegarde,
  MOT_DE_PASSE_MIN,
  MotDePasseIncorrect,
  partagerCsv,
  restaurer,
  sauvegarder,
  SauvegardeIncompatible,
} from '@/features/budget/sauvegarde';
import { budgetModifie, depotBudget, oublierDepot } from '@/features/budget/useBudget';
import { authentifier } from '@/features/budget/verrou';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

type Feuille = { mode: 'sauvegarde' } | { mode: 'restauration'; uri: string; nom: string } | null;
type Erreur = 'motDePasse' | 'incompatible' | 'generale' | null;

/**
 * Export CSV des opérations, sauvegarde chiffrée par mot de passe et restauration du budget.
 * Accessible aussi avant le premier budget : c'est ainsi qu'on retrouve son budget sur un nouveau téléphone.
 */
export default function EcranSauvegarde() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const verrouActif = useReglages((s) => s.verrouBudget);
  const [feuille, setFeuille] = useState<Feuille>(null);
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<Erreur>(null);

  /** Avec le verrou du budget actif, chaque action redemande l'empreinte ou le code du téléphone. */
  const autorise = async () => !verrouActif || (await authentifier(t('sauvegarde.authentification')));

  const ouvrir = (f: Feuille) => {
    setMotDePasse('');
    setConfirmation('');
    setErreur(null);
    setFeuille(f);
  };

  const exporter = async () => {
    if (envoi || !(await autorise())) return;
    setEnvoi(true);
    try {
      const depot = await depotBudget();
      const carnet = await depot.carnetActif();
      if (!carnet) {
        afficher({ texte: t('sauvegarde.rienAExporter'), icone: 'info' });
        return;
      }
      const lignes = await depot.operationsExport(carnet);
      const devise = carnet.devise;
      const csv = versCsv(
        lignes,
        devise,
        devise.personnelle ? devise.symbole : devise.code,
        {
          date: t('sauvegarde.colonnes.date'),
          type: t('sauvegarde.colonnes.type'),
          enveloppe: t('sauvegarde.colonnes.enveloppe'),
          compte: t('sauvegarde.colonnes.compte'),
          compteDestination: t('sauvegarde.colonnes.compteDestination'),
          objectif: t('sauvegarde.colonnes.objectif'),
          montant: t('sauvegarde.colonnes.montant'),
          devise: t('sauvegarde.colonnes.devise'),
          note: t('sauvegarde.colonnes.note'),
        },
        (type) => t(`sauvegarde.types.${type}`),
      );
      await partagerCsv(csv, t('budget.exportCsv'));
    } catch (e: unknown) {
      console.error('Export CSV impossible', e);
      afficher({ texte: t('etats.erreurTexte'), icone: 'alert' });
    } finally {
      setEnvoi(false);
    }
  };

  const choisir = async () => {
    if (envoi) return;
    try {
      const choix = await choisirSauvegarde();
      if (choix) ouvrir({ mode: 'restauration', ...choix });
    } catch (e: unknown) {
      console.error('Choix de la sauvegarde impossible', e);
      afficher({ texte: t('etats.erreurTexte'), icone: 'alert' });
    }
  };

  const valider = async () => {
    if (!feuille || envoi || !(await autorise())) return;
    setEnvoi(true);
    setErreur(null);
    try {
      if (feuille.mode === 'sauvegarde') {
        await sauvegarder(motDePasse, t('budget.sauvegarde'));
        setFeuille(null);
      } else {
        await restaurer(feuille.uri, motDePasse);
        oublierDepot();
        setFeuille(null);
        budgetModifie();
        afficher({ texte: t('sauvegarde.restauree'), icone: 'check' });
        router.replace('/budget');
      }
    } catch (e: unknown) {
      if (e instanceof MotDePasseIncorrect) setErreur('motDePasse');
      else if (e instanceof SauvegardeIncompatible) setErreur('incompatible');
      else {
        console.error('Sauvegarde ou restauration impossible', e);
        setErreur('generale');
      }
    } finally {
      setEnvoi(false);
    }
  };

  const motDePasseValide = motDePasse.length >= MOT_DE_PASSE_MIN;
  const pret = feuille?.mode === 'sauvegarde' ? motDePasseValide && confirmation === motDePasse : motDePasse.length > 0;
  const messageErreur =
    erreur === 'motDePasse'
      ? t('sauvegarde.motDePasseIncorrect')
      : erreur === 'incompatible'
        ? t('sauvegarde.incompatible')
        : erreur === 'generale'
          ? t('etats.erreurTexte')
          : null;

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('sauvegarde.titre')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {t('sauvegarde.intro')}
        </Text>
        <ListGroup>
          <ListItem
            icone="lock"
            titre={t('budget.sauvegarde')}
            sousTitre={t('sauvegarde.sauvegarderAide')}
            onPress={() => ouvrir({ mode: 'sauvegarde' })}
          />
          <ListItem
            icone="reset"
            titre={t('sauvegarde.restaurer')}
            sousTitre={t('sauvegarde.restaurerAide')}
            onPress={choisir}
          />
          <ListItem
            icone="download"
            titre={t('budget.exportCsv')}
            sousTitre={t('budget.exportCsvAvertissement')}
            onPress={exporter}
          />
        </ListGroup>
      </ScrollView>

      <BottomSheet
        ouvert={feuille !== null}
        titre={feuille?.mode === 'restauration' ? t('sauvegarde.restaurer') : t('budget.sauvegarde')}
        onFermer={() => setFeuille(null)}>
        {feuille?.mode === 'restauration' ? (
          <Banner ton="attention" icone="alert">
            {t('sauvegarde.restaurerAvertissement', { fichier: feuille.nom })}
          </Banner>
        ) : (
          <Banner ton="info">{t('sauvegarde.motDePasseAvertissement')}</Banner>
        )}
        <TextField
          label={t('budget.sauvegardeMotDePasse')}
          valeur={motDePasse}
          onChange={setMotDePasse}
          secret
          aide={feuille?.mode === 'sauvegarde' ? t('sauvegarde.motDePasseAide', { min: MOT_DE_PASSE_MIN }) : undefined}
        />
        {feuille?.mode === 'sauvegarde' ? (
          <TextField
            label={t('sauvegarde.confirmation')}
            valeur={confirmation}
            onChange={setConfirmation}
            secret
            erreur={confirmation !== '' && confirmation !== motDePasse ? t('sauvegarde.differents') : undefined}
          />
        ) : null}
        {messageErreur ? <Banner ton="erreur">{messageErreur}</Banner> : null}
        <Button
          pleineLargeur
          variant={feuille?.mode === 'restauration' ? 'danger' : 'principal'}
          disabled={!pret || envoi}
          onPress={valider}>
          {feuille?.mode === 'restauration' ? t('sauvegarde.remplacer') : t('sauvegarde.sauvegarder')}
        </Button>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
