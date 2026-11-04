import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAvantAutorisation } from '@/features/autorisation/AvantAutorisation';
import { lireSaisieDate, masqueDate, versSaisieDate } from '@/features/budget/dettes';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { annulerRappelZakat, programmerRappelZakat } from '@/features/budget/rappelZakat';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { baseDeCalcul } from '@/features/budget/zakat';
import { creerCanaux } from '@/features/priere/notifications';
import { formatHegirien, formatJourCle } from '@/lib/dates';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

/** Zakat indicative : montant estimé, échéance de l'année lunaire, détail du calcul, rappel et versement. */
export default function Zakat() {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { afficher } = useToast();
  const autorisation = useAvantAutorisation('notifications');
  const etat = useBudget((depot, carnet) => depot.zakat(carnet));
  const [versee, setVersee] = useState(false);
  const [feuilleDate, setFeuilleDate] = useState(false);
  const [saisieDate, setSaisieDate] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret') {
    return <EcranBudgetIncomplet titre={t('zakat.titre')} etat={etat} />;
  }

  const { carnet, depot, donnees: z } = etat;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);
  const { composition: c, reglages: r, etat: e } = z;
  const avecHegire = (jour: string) => {
    const [a, m, j] = jour.split('-').map(Number);
    const hegire = formatHegirien(new Date(a ?? 1970, (m ?? 1) - 1, j ?? 1), i18n.language);
    const date = formatJourCle(jour, i18n.language);
    return hegire ? t('zakat.dateHegire', { date, hegire }) : date;
  };
  const metauxSansPrix = z.biens.some(
    (b) => (b.type === 'or' && r.prixOr === null) || (b.type === 'argent' && r.prixArgent === null),
  );
  const dateSaisie = lireSaisieDate(saisieDate);

  const detail =
    e.type === 'due'
      ? e.joursRestants > 0
        ? t('zakat.dueLe', { date: avecHegire(e.echeance) })
        : e.joursRestants === 0
          ? t('zakat.dueAujourdhui')
          : t('zakat.dueDepuis', { date: formatJourCle(e.echeance, i18n.language) })
      : e.type === 'sousNisab'
        ? t('zakat.pasDueTexte')
        : t('zakat.sansCoursTexte');

  const agir = async (action: () => Promise<void>, message: string) => {
    setEnvoi(true);
    setEchec(false);
    try {
      await action();
      budgetModifie();
      afficher({ texte: message, icone: 'check' });
    } catch (erreur: unknown) {
      console.error('Zakat non modifiée', erreur);
      setEchec(true);
    }
    setEnvoi(false);
  };

  const rappeler = async () => {
    if (e.type !== 'due') return;
    try {
      // Canal créé avant la demande : Android 13 et plus l'exige pour proposer l'autorisation.
      await creerCanaux();
      const accorde = await autorisation.demander();
      const resultat = accorde ? await programmerRappelZakat(e.echeance) : 'refuse';
      afficher({
        texte:
          resultat === 'programme'
            ? t('zakat.rappelProgramme', { date: formatJourCle(e.echeance, i18n.language) })
            : resultat === 'refuse'
              ? t('zakat.rappelRefuse')
              : t('zakat.rappelInutile'),
        icone: resultat === 'programme' ? 'bell' : 'info',
      });
    } catch (erreur: unknown) {
      console.error('Rappel de zakat non programmé', erreur);
      setEchec(true);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('zakat.titre')} sousTitre={t('zakat.voir')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace4,
        }}>
        <View style={{ padding: espace.espace5, borderRadius: rayon.rayonCarte, backgroundColor: couleurs.emeraude }}>
          <AmountDisplay
            surEmeraude
            montant={e.type === 'due' ? e.montant : 0}
            devise={devise}
            libelle={
              e.type === 'sousNisab'
                ? t('zakat.pasDue')
                : e.type === 'sansCours'
                  ? t('zakat.sansCoursTitre')
                  : t('zakat.estimee')
            }
            detail={detail}
          />
        </View>

        {e.type === 'sansCours' ? (
          <Button variant="secondaire" pleineLargeur onPress={() => router.push('/budget/zakat/biens')}>
            {t('zakat.sansCoursTitre')}
          </Button>
        ) : null}

        <ListGroup>
          <ListItem titre={t('zakat.ligneEpargne')} valeur={f(c.epargne)} />
          <ListItem titre={t('zakat.ligneComptes')} valeur={f(c.comptes)} />
          <ListItem
            titre={t('zakat.ligneMetaux')}
            valeur={metauxSansPrix ? t('zakat.aSaisir') : f(c.metaux)}
            onPress={() => router.push('/budget/zakat/biens')}
          />
          {c.autres > 0 ? <ListItem titre={t('zakat.ligneAutres')} valeur={f(c.autres)} /> : null}
          <ListItem titre={t('zakat.ligneCreances')} valeur={f(c.creances)} />
          <ListItem titre={t('zakat.ligneDettes')} valeur={`− ${f(c.dettes)}`} />
          <ListItem titre={t('zakat.base')} valeur={f(baseDeCalcul(c))} />
          <ListItem
            titre={t('zakat.ligneNisab', {
              poids: r.base === 'or' ? t('zakat.nisabOr') : t('zakat.nisabArgent'),
            })}
            valeur={z.nisab !== null ? f(z.nisab) : t('zakat.aSaisir')}
            onPress={() => router.push('/budget/zakat/biens')}
          />
          <ListItem
            titre={t('zakat.ligneDepuis')}
            valeur={r.debutHawl ? avecHegire(r.debutHawl) : '—'}
            onPress={() => {
              setSaisieDate(r.debutHawl ? versSaisieDate(r.debutHawl) : '');
              setFeuilleDate(true);
            }}
          />
        </ListGroup>

        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

        {e.type === 'due' ? (
          <View style={[styles.ligne, { gap: espace.espace3 }]}>
            <View style={styles.moitie}>
              <Button variant="secondaire" icone="bell" pleineLargeur disabled={envoi} onPress={rappeler}>
                {t('zakat.rappeler')}
              </Button>
            </View>
            <View style={styles.moitie}>
              <Button pleineLargeur disabled={envoi || e.montant <= 0} onPress={() => setVersee(true)}>
                {t('zakat.marquerVersee')}
              </Button>
            </View>
          </View>
        ) : null}

        <Button variant="secondaire" icone="wallet" pleineLargeur onPress={() => router.push('/budget/zakat/biens')}>
          {t('zakat.mesBiens')}
        </Button>

        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
          {t('zakat.indicatif')}
        </Text>
      </ScrollView>
      {autorisation.feuille}

      <Dialog
        ouvert={versee}
        titre={t('zakat.verseeTitre')}
        confirmer={t('zakat.marquerVersee')}
        onAnnuler={() => setVersee(false)}
        onConfirmer={() => {
          setVersee(false);
          if (e.type !== 'due') return;
          void agir(async () => {
            await depot.marquerZakatVersee(carnet, { montant: e.montant, compteId: null });
            await annulerRappelZakat();
          }, t('zakat.verseeOk'));
        }}>
        {e.type === 'due' ? t('zakat.verseeTexte', { montant: f(e.montant) }) : ''}
      </Dialog>

      <BottomSheet ouvert={feuilleDate} titre={t('zakat.corrigerDebut')} onFermer={() => setFeuilleDate(false)}>
        <TextField
          label={t('zakat.debutLabel')}
          placeholder={t('dettes.datePlaceholder')}
          valeur={saisieDate}
          onChange={(v) => setSaisieDate(masqueDate(v))}
          clavier="number-pad"
          maxLength={10}
          erreur={saisieDate !== '' && dateSaisie === null ? t('zakat.dateInvalide') : undefined}
        />
        <Button
          pleineLargeur
          disabled={dateSaisie === null || envoi}
          onPress={() => {
            setFeuilleDate(false);
            if (dateSaisie)
              void agir(() => depot.reglerZakat(carnet, { debutHawl: dateSaisie }), t('zakat.enregistre'));
          }}>
          {t('commun.enregistrer')}
        </Button>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  ligne: { flexDirection: 'row' },
  moitie: { flex: 1 },
});
