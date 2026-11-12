import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EcranVerrou } from '@/features/budget/EcranVerrou';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { useFormatMontant, useVerrouBudget } from '@/features/budget/verrou';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { isoleLtr } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';
import { appliquerTouche, Keypad } from '@/ui/Keypad';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { useToast } from '@/ui/Toast';

import { interlignes, rayon, tailles } from '@/theme/tokens.generated';
/**
 * Ajouter une dépense : page ouverte depuis le budget (planche « BudgetAjout »). En-tête avec retour, montant au
 * pavé, enveloppe, compte, note, puis « Enregistrer » en pied de page.
 * La page s'ouvre hors de l'onglet Budget : elle applique le verrou elle-même, avant toute lecture.
 */
export default function AjoutDepense() {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  const { verrouille, deverrouiller } = useVerrouBudget(t('budget.verrouPrompt'));

  if (verrouille) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <EcranVerrou deverrouiller={deverrouiller} />
      </View>
    );
  }
  return <ContenuAjout />;
}

function ContenuAjout() {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { espace, typographie, couleurs, rayon, ligne } = useTheme();
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
  const fermer = () => router.back();

  const entete = (
    <View style={[styles.entete, { paddingTop: insets.top, paddingHorizontal: espace.espace2, gap: espace.espace2 }]}>
      <IconButton icone="arrow-left" taille={22} couleur={couleurs.encre} label={t('commun.retour')} onPress={fermer} />
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        maxFontSizeMultiplier={echelleMax.courant}
        style={[typographie.corps, styles.titre, { color: couleurs.encre }]}>
        {t('budget.nouvelleDepense')}
      </Text>
      <View
        style={[
          styles.pastille,
          { backgroundColor: couleurs.surfaceCreux, paddingHorizontal: espace.espace3 },
        ]}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
          {t('budget.aujourdhui')}
        </Text>
      </View>
    </View>
  );

  if (etat.etat !== 'pret') {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
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
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {entete}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.contenu,
          { paddingHorizontal: espace.espace5, paddingBottom: insets.bottom + espace.espace5, gap: espace.espace3 },
        ]}>
        <View accessible style={[styles.montant, { gap: espace.espace1, paddingVertical: espace.espace2 }]}>
          <Text
            accessibilityLiveRegion="polite"
            maxFontSizeMultiplier={1.3}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            numberOfLines={1}
            style={[typographie.chiffre, ligne(styles.grandMontant), { color: couleurs.encre }]}>
            {isoleLtr(f(montant))}
          </Text>
          {choix ? (
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.corps, ligne(styles.info), { color: apres < 0 ? couleurs.alerte : couleurs.encre2 }]}>
              {apres >= 0
                ? t('budget.ilRestera', { enveloppe: choix.nom, montant: f(apres) })
                : t('budget.depasseraDe', { enveloppe: choix.nom, montant: f(-apres) })}
            </Text>
          ) : null}
        </View>

        <View accessibilityRole="radiogroup" accessibilityLabel={t('budget.enveloppe')} style={[styles.puces, { gap: espace.espace2 }]}>
          {donnees.mois.enveloppes.map((e) => (
            <Chip key={e.id} compacte selectionne={e.id === choix?.id} onPress={() => setEnveloppeId(e.id)}>
              {e.nom}
            </Chip>
          ))}
        </View>

        {donnees.comptes.length > 1 && donnees.comptes.length <= 4 ? (
          <SegmentedControl
            label={t('budget.payeAvec')}
            options={donnees.comptes.map((c) => ({ id: c.id, label: c.nom }))}
            valeur={compte?.id ?? ''}
            onChange={setCompteId}
          />
        ) : null}
        {donnees.comptes.length > 4 ? (
          <View accessibilityRole="radiogroup" accessibilityLabel={t('budget.payeAvec')} style={[styles.puces, { gap: espace.espace2 }]}>
            {donnees.comptes.map((c) => (
              <Chip key={c.id} compacte selectionne={c.id === compte?.id} onPress={() => setCompteId(c.id)}>
                {c.nom}
              </Chip>
            ))}
          </View>
        ) : null}

        <TextInput
          accessibilityLabel={t('budget.note')}
          value={note}
          onChangeText={setNote}
          maxLength={120}
          placeholder={t('budget.noteExemple')}
          placeholderTextColor={couleurs.encre3}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[
            typographie.corps,
            styles.note,
            {
              paddingHorizontal: espace.espace4,
              borderRadius: rayon.rayonCarte,
              borderColor: couleurs.ligneForte,
              backgroundColor: couleurs.surface,
              color: couleurs.encre,
            },
          ]}
        />

        <View style={styles.espace} />
        <Keypad onTouche={(touche) => setSaisie((s) => appliquerTouche(s, touche))} />

        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

        <Button grand pleineLargeur disabled={!choix || montant <= 0 || envoi} onPress={enregistrer}>
          {t('commun.enregistrer')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  titre: { flex: 1, textAlign: 'center', fontFamily: 'SourceSans3_600SemiBold' },
  pastille: { height: 32, borderRadius: rayon.rayonPastille, justifyContent: 'center' },
  contenu: { flexGrow: 1 },
  montant: { alignItems: 'center' },
  grandMontant: { fontSize: tailles.t56, lineHeight: interlignes.l60, alignSelf: 'stretch', textAlign: 'center' },
  info: { fontSize: tailles.t14, lineHeight: interlignes.l20, textAlign: 'center' },
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
  // Sans lineHeight (voir TextField) : le texte reste centré dans le champ, même en arabe.
  note: { minHeight: 48, borderWidth: 1, lineHeight: undefined, textAlignVertical: 'center' },
  espace: { flex: 1 },
});
