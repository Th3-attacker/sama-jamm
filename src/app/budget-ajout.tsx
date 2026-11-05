import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EcranVerrou } from '@/features/budget/EcranVerrou';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { useFormatMontant, useVerrouBudget } from '@/features/budget/verrou';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { appliquerTouche, Keypad } from '@/ui/Keypad';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';

/**
 * Ajouter une dépense : montant au pavé, enveloppe, compte, note. Feuille ouverte depuis le budget.
 * Même feuille native que le reste de l'app (`BottomSheet`), identique sur iOS et Android : sa hauteur suit le
 * contenu, plafonnée à 90 % de l'écran, avec défilement au-delà. La route est transparente, la feuille par-dessus.
 * La feuille s'ouvre hors de l'onglet Budget : elle applique le verrou elle-même, avant toute lecture.
 */
export default function AjoutDepense() {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  const { verrouille, deverrouiller } = useVerrouBudget(t('budget.verrouPrompt'));
  const [ouvert, setOuvert] = useState(true);
  const ferme = useRef(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(minuteur.current), []);
  // Ferme la feuille (elle glisse vers le bas), puis quitte la route. Appelée aussi par la feuille après un geste : une seule fois.
  const fermer = useCallback(() => {
    if (ferme.current) return;
    ferme.current = true;
    setOuvert(false);
    minuteur.current = setTimeout(() => router.back(), 300);
  }, []);

  if (verrouille) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <EcranVerrou deverrouiller={deverrouiller} />
      </View>
    );
  }
  return (
    <BottomSheet ouvert={ouvert} titre={t('budget.nouvelleDepense')} onFermer={fermer}>
      <ContenuAjout fermer={fermer} />
    </BottomSheet>
  );
}

function ContenuAjout({ fermer }: { fermer: () => void }) {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { espace, typographie, couleurs } = useTheme();
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

  if (etat.etat !== 'pret') return <EtatsBudget etat={etat} />;

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
      fermer();
    } catch (erreur: unknown) {
      console.error('Dépense non enregistrée', erreur);
      setEchec(true);
      setEnvoi(false);
    }
  };

  return (
    <View style={{ gap: espace.espace4 }}>
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
              {t('budget.payeAvec')}
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

        <TextField
          label={t('budget.note')}
          valeur={note}
          onChange={setNote}
          maxLength={120}
          placeholder={t('budget.noteExemple')}
        />

        <Keypad onTouche={(touche) => setSaisie((s) => appliquerTouche(s, touche))} />

        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

        <Button pleineLargeur disabled={!choix || montant <= 0 || envoi} onPress={enregistrer}>
          {t('commun.enregistrer')}
        </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
