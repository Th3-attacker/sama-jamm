import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';
import { echelleMax } from '@/theme/typographie';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { appliquerTouche, Keypad } from '@/ui/Keypad';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

/** Mettre de côté ce mois-ci : un objectif (ou aucun), le compte, le montant au clavier. */
export default function Versement() {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie } = useTheme();
  const marge = useMargeBasse();
  const { afficher } = useToast();
  const objectifDemande = useParametre('objectif') || null;
  const etat = useBudget(async (depot, carnet) => ({
    epargne: await depot.epargne(carnet),
    comptes: await depot.comptes(carnet.id),
  }));
  const [saisie, setSaisie] = useState('');
  // undefined : rien choisi (l'objectif demandé, sinon aucun) ; null : « Sans objectif ».
  const [objectifId, setObjectifId] = useState<string | null | undefined>(undefined);
  const [compteId, setCompteId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret') {
    return <EcranBudgetIncomplet titre={t('epargne.mettreDeCote')} etat={etat} />;
  }

  const { carnet, depot, donnees } = etat;
  const devise = carnet.devise;
  const objectifs = donnees.epargne.objectifs;
  const choixObjectif =
    objectifId !== undefined ? objectifId : (objectifs.find((o) => o.id === objectifDemande)?.id ?? null);
  const compte = donnees.comptes.find((c) => c.id === compteId) ?? donnees.comptes[0];
  // Le pavé saisit des unités principales ; en ouguiya, une unité vaut 5 khoums.
  const montant = (Number(saisie || '0') || 0) * devise.sousUnites;
  const libelleTitre = (texte: string) => (
    <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
      {texte}
    </Text>
  );

  const enregistrer = async () => {
    if (montant <= 0) return;
    setEnvoi(true);
    setEchec(false);
    try {
      await depot.verserEpargne(carnet, {
        montant,
        objectifId: choixObjectif,
        compteId: compte?.id ?? null,
        note,
      });
      budgetModifie();
      afficher({
        texte: t('epargne.versementEnregistre', { montant: formatMontant(montant, devise) }),
        icone: 'check',
      });
      router.back();
    } catch (erreur: unknown) {
      console.error('Épargne non enregistrée', erreur);
      setEchec(true);
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('epargne.mettreDeCote')} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: espace.espace6,
          paddingBottom: marge + espace.espace5,
          gap: espace.espace4,
        }}>
        <AmountDisplay centre montant={montant} devise={devise} libelle={t('epargne.misDeCote')} />

        <View style={{ gap: espace.espace2 }}>
          {libelleTitre(t('epargne.pour'))}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espace.espace2 }}>
            {objectifs.map((o) => (
              <Chip key={o.id} selectionne={o.id === choixObjectif} onPress={() => setObjectifId(o.id)}>
                {o.nom}
              </Chip>
            ))}
            <Chip selectionne={choixObjectif === null} onPress={() => setObjectifId(null)}>
              {t('epargne.sansObjectif')}
            </Chip>
          </ScrollView>
        </View>

        {donnees.comptes.length > 1 ? (
          <View style={{ gap: espace.espace2 }}>
            {libelleTitre(t('budget.compte'))}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: espace.espace2 }}>
              {donnees.comptes.map((c) => (
                <Chip key={c.id} selectionne={c.id === compte?.id} onPress={() => setCompteId(c.id)}>
                  {c.nom}
                </Chip>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <TextField label={t('budget.note')} valeur={note} onChange={setNote} maxLength={120} />

        <Keypad onTouche={(touche) => setSaisie((s) => appliquerTouche(s, touche))} />

        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

        <Button pleineLargeur disabled={montant <= 0 || envoi} onPress={enregistrer}>
          {t('commun.enregistrer')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
