import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EcranVerrou } from '@/features/budget/EcranVerrou';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { useFormatMontant, useVerrouBudget } from '@/features/budget/verrou';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';
import { appliquerTouche, Keypad } from '@/ui/Keypad';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';

/** Ajouter une dépense : montant au pavé, enveloppe, compte, note. Feuille ouverte depuis le budget. */
/** La feuille s'ouvre hors de l'onglet Budget : elle applique le verrou elle-même, avant toute lecture. */
export default function AjoutDepense() {
  const { t } = useTranslation();
  const { verrouille, deverrouiller } = useVerrouBudget(t('budget.verrouPrompt'));
  if (verrouille) return <EcranVerrou deverrouiller={deverrouiller} />;
  return <ContenuAjout />;
}

function ContenuAjout() {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie } = useTheme();
  const insets = useSafeAreaInsets();
  const { afficher } = useToast();
  const etat = useBudget(async (depot, carnet) => ({
    mois: await depot.mois(carnet),
    comptes: await depot.comptes(carnet.id),
  }));
  const [saisie, setSaisie] = useState('');
  const [enveloppeId, setEnveloppeId] = useState<string | null>(null);
  const [compteId, setCompteId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  const entete = (
    <View style={[styles.entete, { paddingHorizontal: espace.espace5, paddingTop: espace.espace3 }]}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={echelleMax.courant}
        style={[typographie.titre3, styles.titre, { color: couleurs.encre }]}>
        {t('budget.nouvelleDepense')}
      </Text>
      <IconButton icone="close" label={t('commun.fermer')} onPress={() => router.back()} />
    </View>
  );

  if (etat.etat !== 'pret') {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.surface }]}>
        {entete}
        <EtatsBudget etat={etat} />
      </View>
    );
  }

  const { carnet, depot, donnees } = etat;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);
  // Le pavé saisit des unités principales ; en ouguiya, une unité vaut 5 khoums.
  const montant = (Number(saisie || '0') || 0) * devise.sousUnites;
  const choix = donnees.mois.enveloppes.find((e) => e.id === enveloppeId) ?? donnees.mois.enveloppes[0];
  const compte = donnees.comptes.find((c) => c.id === compteId) ?? donnees.comptes[0];
  const apres = choix ? choix.plafond - choix.depense - montant : 0;

  const enregistrer = async () => {
    if (!choix || montant <= 0) return;
    setEnvoi(true);
    setEchec(false);
    try {
      await depot.ajouterDepense(carnet, {
        carnetId: carnet.id,
        montant,
        enveloppeId: choix.id,
        compteId: compte?.id ?? null,
        note,
      });
      budgetModifie();
      afficher({ texte: t('budget.depenseEnregistree', { montant: f(montant) }), icone: 'check' });
      router.back();
    } catch (erreur: unknown) {
      console.error('Dépense non enregistrée', erreur);
      setEchec(true);
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.surface }]}>
      {entete}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: insets.bottom + espace.espace5,
          gap: espace.espace4,
        }}>
        <AmountDisplay
          centre
          montant={montant}
          devise={devise}
          libelle={t('budget.montant')}
          detail={
            choix && montant > 0
              ? apres >= 0
                ? t('budget.ilRestera', { enveloppe: choix.nom, montant: f(apres) })
                : t('budget.depasseraDe', { enveloppe: choix.nom, montant: f(-apres) })
              : undefined
          }
          tonDetail={apres < 0 ? 'alerte' : 'normal'}
        />

        <View style={{ gap: espace.espace2 }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
            {t('budget.enveloppe')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espace.espace2 }}>
            {donnees.mois.enveloppes.map((e) => (
              <Chip key={e.id} selectionne={e.id === choix?.id} onPress={() => setEnveloppeId(e.id)}>
                {e.nom}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {donnees.comptes.length > 1 ? (
          <View style={{ gap: espace.espace2 }}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
              {t('budget.compte')}
            </Text>
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

        <Button pleineLargeur disabled={!choix || montant <= 0 || envoi} onPress={enregistrer}>
          {t('commun.enregistrer')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center' },
  titre: { flex: 1 },
});
