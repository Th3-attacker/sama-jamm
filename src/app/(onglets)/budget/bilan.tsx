import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFormatMontant } from '@/features/budget/verrou';
import type { ChoixBilan } from '@/features/budget/depot';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { formatJourCle } from '@/lib/dates';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { IconButton } from '@/ui/IconButton';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { useToast } from '@/ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

const CHOIX: readonly ChoixBilan[] = ['reporter', 'epargner', 'sadaqa'];

/** Bilan du cycle terminé : pour le reste de chaque enveloppe, reporter (défaut), épargner ou donner en sadaqa. */
export default function Bilan() {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const marge = useMargeBasse();
  const insets = useSafeAreaInsets();
  const { afficher } = useToast();
  const etat = useBudget((depot, carnet) => depot.bilanAFaire(carnet));
  const [choix, setChoix] = useState<Record<string, ChoixBilan>>({});
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret') {
    return <EcranBudgetIncomplet titre={t('budget.bilanTitre')} etat={etat} />;
  }

  const { carnet, depot, donnees: bilan } = etat;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);

  if (!bilan) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('budget.bilanTitre')} />
        <View style={{ padding: espace.espace5 }}>
          <Banner ton="succes">{t('budget.cycleClos')}</Banner>
        </View>
      </View>
    );
  }

  const totaux = { reporter: 0, epargner: 0, sadaqa: 0 };
  for (const e of bilan.enveloppes) totaux[choix[e.id] ?? 'reporter'] += e.reste;
  const libelles: Record<ChoixBilan, string> = {
    reporter: t('budget.reporter'),
    epargner: t('budget.epargner'),
    sadaqa: t('budget.donnerSadaqa'),
  };

  const clore = async () => {
    setEnvoi(true);
    setEchec(false);
    try {
      await depot.cloreCycle(carnet, bilan.cycle.id, choix);
      budgetModifie();
      afficher({ texte: t('budget.cycleClos'), icone: 'check' });
      router.back();
    } catch (erreur: unknown) {
      console.error('Cycle non clos', erreur);
      setEchec(true);
      setEnvoi(false);
    }
  };

  const totalReste = bilan.enveloppes.reduce((somme, e) => somme + e.reste, 0);
  const sousTitre = `${t('budget.cycle', {
    debut: formatJourCle(bilan.cycle.debut, i18n.language),
    fin: formatJourCle(bilan.cycle.fin, i18n.language),
  })}. ${bilan.enveloppes.length > 0 ? t('budget.bilanSousTitre') : t('budget.bilanRien')}`;

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <ScrollView
        contentContainerStyle={[
          styles.contenu,
          {
            paddingTop: insets.top + espace.espace2,
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace4 + marge,
            gap: espace.espace4,
          },
        ]}>
        <View style={{ gap: espace.espace1 }}>
          <View style={[styles.titreLigne, { gap: espace.espace1 }]}>
            <View style={styles.retour}>
              <IconButton
                icone="arrow-left"
                taille={22}
                couleur={couleurs.encre}
                label={t('commun.retour')}
                onPress={() => router.back()}
              />
            </View>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.titre1, styles.titre, { color: couleurs.emeraude }]}>
              {t('budget.bilanTitre')}
            </Text>
          </View>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.translitteration, styles.sousTitre, { color: couleurs.encre2 }]}>
            {sousTitre}
          </Text>
        </View>

        {bilan.enveloppes.length > 0 ? (
          <AmountDisplay
            tonMontant="revenu"
            libelle={t('budget.resteEnveloppes')}
            montant={totalReste}
            devise={devise}
          />
        ) : null}

        {bilan.enveloppes.map((e) => (
          <View
            key={e.id}
            style={[
              styles.carte,
              {
                gap: espace.espace3,
                padding: espace.espace4,
                borderRadius: rayon.rayonCarte,
                backgroundColor: couleurs.surface,
                borderColor: couleurs.ligne,
              },
            ]}>
            <View style={[styles.ligne, { gap: espace.espace3 }]}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.nom, { color: couleurs.encre }]}>
                {e.nom}
              </Text>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.corps, styles.gras, { color: couleurs.encre, fontVariant: ['tabular-nums'] }]}>
                {f(e.reste)}
              </Text>
            </View>
            <SegmentedControl
              label={t('budget.queFaireReste', { nom: e.nom })}
              options={CHOIX.map((id) => ({ id, label: libelles[id] }))}
              valeur={choix[e.id] ?? 'reporter'}
              onChange={(id) => {
                const c = CHOIX.find((x) => x === id);
                if (c) setChoix((avant) => ({ ...avant, [e.id]: c }));
              }}
            />
          </View>
        ))}

        {bilan.enveloppes.length > 0 ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.resume, { color: couleurs.encre2 }]}>
            {t('budget.bilanResume', {
              reporte: f(totaux.reporter),
              epargne: f(totaux.epargner),
              sadaqa: f(totaux.sadaqa),
            })}
          </Text>
        ) : null}

        <View style={styles.espace} />
        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
        <Button grand pleineLargeur disabled={envoi} onPress={clore}>
          {t('budget.clore')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  contenu: { flexGrow: 1 },
  titreLigne: { flexDirection: 'row', alignItems: 'center' },
  retour: { marginStart: -12 },
  titre: { flex: 1 },
  sousTitre: { fontSize: 16 },
  carte: { borderWidth: 1 },
  ligne: { flexDirection: 'row', alignItems: 'baseline' },
  nom: { flex: 1 },
  gras: { fontFamily: 'SourceSans3_600SemiBold' },
  resume: { fontFamily: 'SourceSans3_400Regular' },
  espace: { flex: 1 },
});
