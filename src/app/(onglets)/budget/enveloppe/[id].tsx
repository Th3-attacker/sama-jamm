import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { depenseDuJour, joursRestants, pasArrondi } from '@/features/budget/cycle';
import { NOM_ENVELOPPE_MAX } from '@/features/budget/depot';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { cleJour, formatJourCle } from '@/lib/dates';
import { formatMontant, versMinimes, versSaisie } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { ProgressBar } from '@/ui/ProgressBar';
import { TextField } from '@/ui/TextField';
import { TopBar } from '@/ui/TopBar';

/** Une enveloppe du cycle en cours : plafond, dépensé, reste, dépenses ; modifier le plafond, renommer, archiver. */
export default function EcranEnveloppe() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const etat = useBudget((depot, carnet) => depot.detailEnveloppe(carnet, id), id);
  // Une seule feuille, pour le plafond ou le nom.
  const [feuille, setFeuille] = useState<'plafond' | 'nom' | null>(null);
  const [saisie, setSaisie] = useState('');
  const [echec, setEchec] = useState(false);
  const [archiver, setArchiver] = useState(false);

  if (etat.etat !== 'pret' || etat.donnees === null) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('budget.enveloppe')} />
        {etat.etat === 'pret' ? (
          <View style={{ padding: espace.espace5 }}>
            <Banner ton="erreur">{t('budget.enveloppeIntrouvable')}</Banner>
          </View>
        ) : (
          <EtatsBudget etat={etat} />
        )}
      </View>
    );
  }

  const { carnet, depot, donnees } = etat;
  const { enveloppe: e, cycle, operations } = donnees;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);
  const reste = e.plafond - e.depense;
  const jours = joursRestants(cleJour(new Date()), cycle.fin);
  const parJour = depenseDuJour(reste, jours, pasArrondi(devise));
  const nouveauPlafond = saisie.trim() === '' ? null : versMinimes(saisie, devise);
  const nouveauNom = saisie.trim();
  const nomValide = nouveauNom.length >= 1 && nouveauNom.length <= NOM_ENVELOPPE_MAX;
  const saisieValide = feuille === 'nom' ? nomValide : nouveauPlafond !== null;

  const ouvrir = (mode: 'plafond' | 'nom') => {
    setSaisie(mode === 'nom' ? e.nom : '');
    setEchec(false);
    setFeuille(mode);
  };

  const enregistrer = async () => {
    try {
      if (feuille === 'nom' && nomValide) await depot.renommerEnveloppe(carnet, e.id, nouveauNom);
      else if (feuille === 'plafond' && nouveauPlafond !== null)
        await depot.modifierPlafond(carnet, e.id, nouveauPlafond);
      else return;
      setFeuille(null);
      budgetModifie();
    } catch (erreur: unknown) {
      console.error('Enveloppe non modifiée', erreur);
      setEchec(true);
    }
  };

  const confirmerArchivage = async () => {
    setArchiver(false);
    try {
      await depot.archiverEnveloppe(carnet, e.id);
      budgetModifie();
      router.back();
    } catch (erreur: unknown) {
      console.error('Enveloppe non archivée', erreur);
      setEchec(true);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={e.nom} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <AmountDisplay
          montant={Math.max(reste, 0)}
          devise={devise}
          libelle={reste >= 0 ? t('budget.resteTitre') : t('budget.depasse', { montant: f(-reste) })}
          detail={t('budget.sur', { montant: f(e.plafond) })}
          tonDetail={reste < 0 ? 'erreur' : 'normal'}
        />
        <ProgressBar
          valeur={e.plafond > 0 ? e.depense / e.plafond : e.depense > 0 ? 2 : 0}
          label={e.nom}
          detail={`${t('budget.depense')} : ${f(e.depense)} ${t('budget.sur', { montant: f(e.plafond) })}`}
        />
        {reste > 0 ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {t('budget.parJour', { montant: f(parJour) })}
          </Text>
        ) : null}

        <View style={{ gap: espace.espace2 }}>
          <Button variant="secondaire" icone="edit" pleineLargeur onPress={() => ouvrir('plafond')}>
            {t('budget.modifierPlafond')}
          </Button>
          <Button variant="secondaire" icone="type" pleineLargeur onPress={() => ouvrir('nom')}>
            {t('budget.renommer')}
          </Button>
          <Button variant="discret" icone="trash" pleineLargeur onPress={() => setArchiver(true)}>
            {t('budget.archiver')}
          </Button>
          {echec && feuille === null ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
        </View>

        {operations.length === 0 ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre3 }]}>
            {t('budget.aucuneDepense')}
          </Text>
        ) : (
          <ListGroup titre={t('budget.historique')}>
            {operations.map((o) => (
              <ListItem
                key={o.id}
                titre={o.note ?? e.nom}
                sousTitre={[formatJourCle(o.date, i18n.language), o.compte].filter(Boolean).join(' · ')}
                valeur={f(o.montant)}
                onPress={() => router.push({ pathname: '/budget/operation/[id]', params: { id: o.id } })}
              />
            ))}
          </ListGroup>
        )}
      </ScrollView>

      <BottomSheet
        ouvert={feuille !== null}
        titre={feuille === 'nom' ? t('budget.renommer') : t('budget.modifierPlafond')}
        onFermer={() => setFeuille(null)}>
        {feuille === 'nom' ? (
          <TextField
            label={t('budget.nomEnveloppe')}
            valeur={saisie}
            onChange={setSaisie}
            maxLength={NOM_ENVELOPPE_MAX}
            erreur={!nomValide ? t('budget.nomInvalide') : undefined}
          />
        ) : (
          <TextField
            label={t('budget.plafond')}
            valeur={saisie}
            onChange={setSaisie}
            clavier={devise.decimales > 0 ? 'decimal-pad' : 'number-pad'}
            suffixe={devise.symbole}
            placeholder={versSaisie(e.plafond, devise) ?? ''}
            erreur={saisie.trim() !== '' && nouveauPlafond === null ? t('budget.montantInvalide') : undefined}
          />
        )}
        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
        <Button pleineLargeur disabled={!saisieValide} onPress={enregistrer}>
          {t('commun.enregistrer')}
        </Button>
      </BottomSheet>

      <Dialog
        ouvert={archiver}
        icone="trash"
        titre={t('budget.archiverTitre')}
        confirmer={t('budget.archiver')}
        onAnnuler={() => setArchiver(false)}
        onConfirmer={confirmerArchivage}>
        {t('budget.archiverTexte')}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
