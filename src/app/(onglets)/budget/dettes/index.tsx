import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SENS_DETTE, resumeDettes, type SensDette } from '@/features/budget/dettes';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { LigneDette } from '@/features/budget/LigneDette';
import { useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { Icon } from '@/ui/Icon';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TopBar } from '@/ui/TopBar';

type Filtre = 'tous' | SensDette;

/** Dettes entre proches : ce qu'on me doit, ce que je dois, et les dettes en cours. */
export default function Dettes() {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const etat = useBudget(async (depot, carnet) => ({
    ouvertes: await depot.dettes(carnet, 'ouvertes'),
    closes: (await depot.dettes(carnet, 'closes')).length,
  }));
  const [filtre, setFiltre] = useState<Filtre>('tous');

  if (etat.etat !== 'pret') {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('dettes.titre')} />
        <EtatsBudget etat={etat} />
      </View>
    );
  }

  const { carnet, donnees } = etat;
  const f = (m: number) => formatMontant(m, carnet.devise);
  const resume = resumeDettes(donnees.ouvertes);
  const visibles = donnees.ouvertes.filter((d) => filtre === 'tous' || d.sens === filtre);
  const solde =
    resume.solde > 0
      ? t('dettes.soldePour', { montant: f(resume.solde) })
      : resume.solde < 0
        ? t('dettes.soldeContre', { montant: f(-resume.solde) })
        : t('dettes.soldeNul');

  const carte = (sens: SensDette, montant: number) => (
    <View
      key={sens}
      accessible
      style={[
        styles.carte,
        {
          padding: espace.espace4,
          borderRadius: rayon.rayonCarte,
          backgroundColor: couleurs.surface,
          borderColor: couleurs.ligne,
        },
      ]}>
      <View style={[styles.ligne, { gap: espace.espace1 }]}>
        <Icon name={sens === 'prete' ? 'arrow-up' : 'arrow-down'} size={16} color={couleurs.encre2} />
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
          {sens === 'prete' ? t('dettes.onMeDoit') : t('dettes.jeDois')}
        </Text>
      </View>
      <Text
        maxFontSizeMultiplier={echelleMax.courant}
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[typographie.titre2, { color: couleurs.encre, fontVariant: ['tabular-nums'] }]}>
        {f(montant)}
      </Text>
    </View>
  );

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('dettes.titre')} sousTitre={t('dettes.sousTitre')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace4,
        }}>
        <View style={[styles.ligne, { gap: espace.espace3 }]}>
          {carte('prete', resume.onMeDoit)}
          {carte('emprunte', resume.jeDois)}
        </View>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {solde}
        </Text>

        {donnees.ouvertes.length > 0 ? (
          <>
            <SegmentedControl
              label={t('dettes.sens')}
              options={[
                { id: 'tous', label: t('dettes.toutes') },
                { id: 'prete', label: t('dettes.onMeDoit') },
                { id: 'emprunte', label: t('dettes.jeDois') },
              ]}
              valeur={filtre}
              onChange={(id) => {
                const choix = SENS_DETTE.find((s) => s === id);
                setFiltre(choix ?? 'tous');
              }}
            />
            {visibles.length > 0 ? (
              <ListGroup>
                {visibles.map((d) => (
                  <LigneDette key={d.id} dette={d} devise={carnet.devise} />
                ))}
              </ListGroup>
            ) : null}
          </>
        ) : (
          <EmptyState icone="users" lang="fr" titre={t('dettes.aucune')} texte={t('dettes.aucuneTexte')} />
        )}

        {donnees.closes > 0 ? (
          <ListGroup>
            <ListItem
              icone="check"
              titre={t('dettes.soldees')}
              valeur={String(donnees.closes)}
              onPress={() => router.push('/budget/dettes/soldees')}
            />
          </ListGroup>
        ) : null}

        <Button icone="plus" pleineLargeur onPress={() => router.push('/budget/dettes/nouvelle')}>
          {t('dettes.ajouter')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  ligne: { flexDirection: 'row', alignItems: 'center' },
  carte: { flex: 1, borderWidth: 1, gap: 2 },
});
