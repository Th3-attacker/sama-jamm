import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { calculerHoraires } from '@/features/priere/horaires';
import { useOptionsCalcul } from '@/features/priere/useOptionsCalcul';
import { fuseauDuLieu } from '@/features/priere/villes';
import { useMaintenant } from '@/hooks/useMaintenant';
import { formatHeure } from '@/lib/dates';
import { AJUSTEMENT_MAX, methodes, prieres, useReglages, type EcoleAsr, type Methode } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { IconButton } from '@/ui/IconButton';
import { RadioGroup } from '@/ui/RadioGroup';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

import { interlignes, tailles } from '@/theme/tokens.generated';
const signe = (n: number) => (n > 0 ? `+${n} min` : `${n} min`);

export default function MethodeDeCalcul() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  const marge = useMargeBasse();
  const methode = useReglages((s) => s.methode);
  const ecoleAsr = useReglages((s) => s.ecoleAsr);
  const ajustements = useReglages((s) => s.ajustements);
  const definirMethode = useReglages((s) => s.definirMethode);
  const definirEcoleAsr = useReglages((s) => s.definirEcoleAsr);
  const ajuster = useReglages((s) => s.ajuster);
  const lieu = useReglages((s) => s.lieu);
  const fuseau = fuseauDuLieu(lieu);
  const options = useOptionsCalcul();
  const maintenant = useMaintenant();
  // Heure du jour de chaque prière, avec les ajustements en cours.
  const horaires = useMemo(() => (lieu ? calculerHoraires(lieu, maintenant, options) : null), [lieu, maintenant, options]);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Planche : flèche et titre en 30/36 émeraude, phrase en italique dessous. */}
      <TopBar
        retour
        gauche={
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, { color: couleurs.emeraude }]}>
            {t('priere.methodeTitre')}
          </Text>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 + marge, gap: espace.espace4 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, ligne(styles.phrase), { color: couleurs.encre2 }]}>
          {t('priere.methodeSousTitre')}
        </Text>

        <RadioGroup
          label={t('priere.methodeTitre')}
          options={methodes.map((m) => ({ id: m, label: t(`priere.methodes.${m}`), description: t(`priere.methodesAngles.${m}`) }))}
          valeur={methode}
          onChange={(id) => {
            const m = methodes.find((x): x is Methode => x === id);
            if (m) definirMethode(m);
          }}
        />

        <View style={{ gap: espace.espace2 }}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
            {t('priere.asr')}
          </Text>
          <SegmentedControl
            label={t('priere.asr')}
            options={[
              { id: 'standard', label: t('priere.asrStandard') },
              { id: 'hanafite', label: t('priere.asrHanafite') },
            ]}
            valeur={ecoleAsr}
            onChange={(id) => definirEcoleAsr(id === 'hanafite' ? 'hanafite' : ('standard' satisfies EcoleAsr))}
          />
        </View>

        <View style={{ gap: espace.espace2 }}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
            {t('priere.ajuster')}
          </Text>
          <View style={[styles.carte, { backgroundColor: couleurs.surface, borderColor: couleurs.ligne, borderRadius: rayon.rayonCarte }]}>
            {prieres.map((p, i) => {
              const nom = t(`priere.noms.${p}`);
              const valeur = ajustements[p];
              return (
                <View
                  key={p}
                  style={[
                    styles.ligne,
                    { gap: espace.espace2, paddingVertical: espace.espace1, paddingStart: espace.espace4, paddingEnd: espace.espace2, borderTopColor: couleurs.ligne },
                    i > 0 ? styles.filet : null,
                  ]}>
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.nom, { color: couleurs.encre }]}>
                    {nom}
                    {horaires ? (
                      <Text style={[styles.heure, { color: couleurs.encre3 }]}>{` · ${formatHeure(horaires[p], fuseau)}`}</Text>
                    ) : null}
                  </Text>
                  <IconButton
                    icone="minus"
                    couleur={couleurs.emeraude}
                    label={t('priere.retirerMinute', { priere: nom })}
                    disabled={valeur <= -AJUSTEMENT_MAX}
                    onPress={() => ajuster(p, -1)}
                  />
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.valeur), { color: couleurs.encre }]}>
                    {signe(valeur)}
                  </Text>
                  <IconButton
                    icone="plus"
                    couleur={couleurs.emeraude}
                    label={t('priere.ajouterMinute', { priere: nom })}
                    disabled={valeur >= AJUSTEMENT_MAX}
                    onPress={() => ajuster(p, 1)}
                  />
                </View>
              );
            })}
          </View>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.note), { color: couleurs.encre3 }]}>
            {t('priere.ajusterAide')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  phrase: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  carte: { borderWidth: 1, overflow: 'hidden' },
  ligne: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  filet: { borderTopWidth: 1 },
  nom: { flex: 1 },
  heure: { fontSize: tailles.t14, fontVariant: ['tabular-nums'] },
  valeur: { minWidth: 52, textAlign: 'center', fontSize: tailles.t16, lineHeight: interlignes.l24, fontVariant: ['tabular-nums'] },
  note: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
