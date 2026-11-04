import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ChoixBilan } from '@/features/budget/depot';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { formatJourCle } from '@/lib/dates';
import { formatMontant } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

const CHOIX: readonly ChoixBilan[] = ['reporter', 'epargner', 'sadaqa'];

/** Bilan du cycle terminé : pour le reste de chaque enveloppe, reporter (défaut), épargner ou donner en sadaqa. */
export default function Bilan() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const etat = useBudget((depot, carnet) => depot.bilanAFaire(carnet));
  const [choix, setChoix] = useState<Record<string, ChoixBilan>>({});
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret') {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('budget.bilanTitre')} />
        <EtatsBudget etat={etat} />
      </View>
    );
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

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        retour
        titre={t('budget.bilanTitre')}
        sousTitre={t('budget.cycle', {
          debut: formatJourCle(bilan.cycle.debut, i18n.language),
          fin: formatJourCle(bilan.cycle.fin, i18n.language),
        })}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {bilan.enveloppes.length > 0 ? t('budget.bilanSousTitre') : t('budget.bilanRien')}
        </Text>

        {bilan.enveloppes.map((e) => (
          <View key={e.id} style={{ gap: espace.espace2 }}>
            <View style={styles.ligne}>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.libelle, styles.nom, { color: couleurs.encre }]}>
                {e.nom}
              </Text>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.libelle, { color: couleurs.encre2 }]}>
                {f(e.reste)}
              </Text>
            </View>
            <SegmentedControl
              label={e.nom}
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
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
            {t('budget.bilanResume', {
              reporte: f(totaux.reporter),
              epargne: f(totaux.epargner),
              sadaqa: f(totaux.sadaqa),
            })}
          </Text>
        ) : null}

        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
        <Button pleineLargeur disabled={envoi} onPress={clore}>
          {t('budget.clore')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  ligne: { flexDirection: 'row', alignItems: 'baseline' },
  nom: { flex: 1 },
});
