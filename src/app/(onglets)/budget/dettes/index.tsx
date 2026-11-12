import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SENS_DETTE, resumeDettes, type SensDette } from '@/features/budget/dettes';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { LigneDette } from '@/features/budget/LigneDette';
import { useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { isoleLtr } from '@/ui/AmountDisplay';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { Icon } from '@/ui/Icon';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { EnteteRetour } from '@/ui/EnteteRetour';
import { VersetRubrique } from '@/ui/VersetRubrique';
import { versetRubrique } from '@/features/rubriques/versetsRubriques';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

import { espace, interlignes, tailles } from '@/theme/tokens.generated';
type Filtre = 'tous' | SensDette;

/** Dettes entre proches : ce qu'on me doit, ce que je dois, et les dettes en cours. */
// Verset du Coran de la rubrique : données embarquées, lues une fois.
const versetDettes = versetRubrique('dettes');

export default function Dettes() {
  const { t } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  const marge = useMargeBasse();
  const etat = useBudget(async (depot, carnet) => ({
    ouvertes: await depot.dettes(carnet, 'ouvertes'),
    closes: (await depot.dettes(carnet, 'closes')).length,
  }));
  const [filtre, setFiltre] = useState<Filtre>('tous');

  if (etat.etat !== 'pret') {
    return <EcranBudgetIncomplet titre={t('dettes.titre')} etat={etat} />;
  }

  const { carnet, donnees } = etat;
  const f = (m: number) => formatMontant(m, carnet.devise);
  const resume = resumeDettes(donnees.ouvertes);
  const visibles = donnees.ouvertes.filter((d) => filtre === 'tous' || d.sens === filtre);
  const montantSolde = f(Math.abs(resume.solde));
  const solde =
    resume.solde > 0
      ? t('dettes.soldePour', { montant: montantSolde })
      : resume.solde < 0
        ? t('dettes.soldeContre', { montant: montantSolde })
        : t('dettes.soldeNul');
  // Le montant du solde est en gras dans la phrase (planche).
  const [avantSolde, apresSolde] = resume.solde !== 0 ? solde.split(montantSolde) : [solde, undefined];

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
      <View style={[styles.ligne, { gap: espace.espace2 }]}>
        <Icon name={sens === 'prete' ? 'arrow-up' : 'arrow-down'} size={16} color={couleurs.encre2} />
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
          {sens === 'prete' ? t('dettes.onMeDoit') : t('dettes.jeDois')}
        </Text>
      </View>
      <Text
        maxFontSizeMultiplier={echelleMax.courant}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        numberOfLines={1}
        style={[typographie.corps, ligne(styles.montant), { color: couleurs.encre, fontVariant: ['tabular-nums'] }]}>
        {isoleLtr(f(montant))}
      </Text>
    </View>
  );

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace6,
          paddingBottom: espace.espace8 + marge,
          gap: espace.espace4,
        }}>
        <EnteteRetour titre={t('dettes.titre')} sousTitre={t('dettes.sousTitre')} italique />
        <View style={[styles.ligne, { gap: espace.espace3 }]}>
          {carte('prete', resume.onMeDoit)}
          {carte('emprunte', resume.jeDois)}
        </View>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.solde), { color: couleurs.encre2 }]}>
          {avantSolde}
          {apresSolde !== undefined ? (
            <>
              <Text style={[styles.gras, { color: couleurs.encre }]}>{montantSolde}</Text>
              {apresSolde}
            </>
          ) : null}
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
        {versetDettes ? <VersetRubrique verset={versetDettes} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  ligne: { flexDirection: 'row', alignItems: 'center' },
  carte: { flex: 1, borderWidth: 1, gap: espace.espace1 },
  solde: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  gras: { fontFamily: 'SourceSans3_600SemiBold' },
  montant: { fontFamily: 'SourceSans3_600SemiBold', fontSize: tailles.t24, lineHeight: interlignes.l30, alignSelf: 'stretch' },
});
