import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { depassement, depenseDuJour, joursRestants, pasArrondi, resteAVivre } from '@/features/budget/cycle';
import { iconeEnveloppe } from '@/features/budget/enveloppesDeDepart';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { useBudget } from '@/features/budget/useBudget';
import { cleJour, formatJourCle } from '@/lib/dates';
import { formatMontant } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Button } from '@/ui/Button';
import { Envelope } from '@/ui/Envelope';
import { TopBar } from '@/ui/TopBar';

export default function Budget() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const etat = useBudget((depot, carnet) => depot.mois(carnet));

  if (etat.etat !== 'pret') {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar grand titre={t('budget.titre')} sousTitre={t('budget.surTelephone')} />
        <EtatsBudget etat={etat} />
      </View>
    );
  }

  const { carnet, donnees: mois } = etat;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);
  const aujourdhui = cleJour(new Date());
  const jours = joursRestants(aujourdhui, mois.cycle.fin);
  const reste = resteAVivre({
    recu: mois.recu,
    misDeCote: mois.misDeCote,
    depenses: mois.depense,
    chargesFixesNonReglees: mois.chargesFixesNonReglees,
  });
  const duJour = depenseDuJour(reste, jours, pasArrondi(devise));
  const depasse = depassement(reste);
  const sousTitre = t('budget.cycle', {
    debut: formatJourCle(mois.cycle.debut, i18n.language),
    fin: formatJourCle(mois.cycle.fin, i18n.language),
  });

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar grand titre={t('budget.titre')} sousTitre={sousTitre} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <View style={{ padding: espace.espace5, borderRadius: rayon.rayonCarte, backgroundColor: couleurs.emeraude }}>
          <AmountDisplay
            surEmeraude
            montant={duJour}
            devise={devise}
            libelle={t('budget.depenseDuJour')}
            detail={
              depasse > 0
                ? t('budget.depasseTotal', { montant: f(depasse) })
                : t('budget.depenseDuJourDetail', { reste: f(reste), jours: t('budget.jours', { count: jours }) })
            }
          />
        </View>

        <View style={[styles.totaux, { gap: espace.espace3 }]}>
          {[
            [t('budget.recu'), mois.recu],
            [t('budget.depense'), mois.depense],
            [t('budget.epargne'), mois.misDeCote],
          ].map(([libelle, montant]) => (
            <View key={String(libelle)} accessible style={styles.total}>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.legende, { color: couleurs.encre3 }]}>
                {libelle}
              </Text>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[typographie.libelle, { color: couleurs.encre, fontVariant: ['tabular-nums'] }]}>
                {f(Number(montant))}
              </Text>
            </View>
          ))}
        </View>

        <Button icone="plus" pleineLargeur onPress={() => router.push('/budget-ajout')}>
          {t('budget.ajouterDepense')}
        </Button>

        <View>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.titre3, { color: couleurs.encre }]}>
            {t('budget.enveloppes')}
          </Text>
          {mois.enveloppes.map((e) => (
            <Envelope
              key={e.id}
              nom={e.nom}
              icone={iconeEnveloppe(e.icone)}
              depense={e.depense}
              plafond={e.plafond}
              fixe={e.fixe}
              devise={devise}
              onPress={() => router.push({ pathname: '/budget/enveloppe/[id]', params: { id: e.id } })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  totaux: { flexDirection: 'row' },
  total: { flex: 1 },
});
