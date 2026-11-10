import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { calculerHoraires } from '@/features/priere/horaires';
import { useOptionsCalcul } from '@/features/priere/useOptionsCalcul';
import { fuseauDuLieu } from '@/features/priere/villes';
import { formatHeure } from '@/lib/dates';
import { prieres, sons, useReglages, type NomPriere } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Icon } from '@/ui/Icon';
import { RadioGroup } from '@/ui/RadioGroup';
import { Switch } from '@/ui/Switch';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

export default function AppelEtRappels() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const marge = useMargeBasse();
  const rappels = useReglages((s) => s.rappels);
  const sonsChoisis = useReglages((s) => s.sons);
  const definirRappel = useReglages((s) => s.definirRappel);
  const definirSon = useReglages((s) => s.definirSon);
  const [ouverte, setOuverte] = useState<NomPriere | null>(null);
  const [alarmesRefusees, setAlarmesRefusees] = useState(false);
  const lieu = useReglages((s) => s.lieu);
  const fuseau = fuseauDuLieu(lieu);
  const methode = useReglages((s) => s.methode);
  const ecoleAsr = useReglages((s) => s.ecoleAsr);
  const options = useOptionsCalcul();
  // Heures du jour, affichées à côté du nom de chaque prière.
  const horaires = useMemo(() => (lieu ? calculerHoraires(lieu, new Date(), options) : null), [lieu, options]);

  // Android 12+ : sans alarmes exactes, l'appel peut arriver avec quelques minutes de retard.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    Notifications.getExactAlarmPermissionsAsync()
      .then((p) => setAlarmesRefusees(!p.granted))
      .catch((erreur: unknown) => console.warn('Statut des alarmes exactes inconnu', erreur));
  }, []);

  const autoriserAlarmes = () => {
    Notifications.requestExactAlarmPermissionsAsync()
      .then((p) => setAlarmesRefusees(!p.granted))
      .catch((erreur: unknown) => console.warn('Réglage des alarmes exactes inaccessible', erreur));
  };

  // Feuille réduite, identique sur iOS et Android : trois sons, sans essai ni rappel avant.
  const sonsFeuille = sons.filter((s) => s === 'court' || s === 'vibration' || s === 'silencieux');

  const resume = (p: NomPriere) => t(`priere.sons.${sonsChoisis[p]}`);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Planche : flèche et titre en 30/36 émeraude, phrase en italique dessous. */}
      <TopBar
        retour
        gauche={
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, { color: couleurs.emeraude }]}>
            {t('priere.rappelsTitre')}
          </Text>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 + marge, gap: espace.espace4 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, styles.phrase, { color: couleurs.encre2 }]}>
          {t('priere.rappelsSousTitre')}
        </Text>
        {/* Une seule carte : une ligne par prière, le réglage du son s'ouvre en touchant la ligne. */}
        <View style={[styles.carte, { backgroundColor: couleurs.surface, borderColor: couleurs.ligne, borderRadius: rayon.rayonCarte }]}>
          {prieres.map((p, i) => {
            const nom = t(`priere.noms.${p}`);
            const heure = horaires ? ` · ${formatHeure(horaires[p], fuseau)}` : '';
            return (
              <View
                key={p}
                style={[styles.ligne, { gap: espace.espace3, paddingVertical: espace.espace3, paddingHorizontal: espace.espace4, borderTopColor: couleurs.ligne }, i > 0 ? styles.filet : null]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${nom}, ${resume(p)}`}
                  onPress={() => setOuverte(p)}
                  style={[styles.textes, { gap: espace.espace1 }]}>
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
                    <Text style={typographie.libelle}>{nom}</Text>
                    <Text style={[styles.local, { color: couleurs.encre3 }]}>{` · ${t(`priere.nomsLocaux.${p}`)}${heure}`}</Text>
                  </Text>
                  <View style={[styles.son, { gap: espace.espace1 }]}>
                    <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.sonTexte, { color: couleurs.encre2 }]}>
                      {resume(p)}
                    </Text>
                    <Icon name="chevron-right" size={14} color={couleurs.encre2} />
                  </View>
                </Pressable>
                <Switch label={t('priere.notificationDe', { priere: nom })} active={rappels[p]} onChange={(actif) => definirRappel(p, actif)} />
              </View>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/priere/methode')}
          style={({ pressed }) => [
            styles.methode,
            {
              gap: espace.espace3,
              paddingHorizontal: espace.espace4,
              borderRadius: rayon.rayonCarte,
              borderColor: couleurs.ligne,
              backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.surface,
            },
          ]}>
          <View style={styles.textes}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
              {t('priere.methodeTitre')}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.sonTexte, { color: couleurs.encre3 }]}>
              {`${t(`priere.methodes.${methode}`)} · ${t('priere.asrResume', { ecole: t(ecoleAsr === 'hanafite' ? 'priere.asrHanafite' : 'priere.asrStandard').toLowerCase() })}`}
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color={couleurs.encre3} />
        </Pressable>
        {alarmesRefusees ? (
          <Banner ton="info" titre={t('autorisations.alarmesTitre')} action={{ label: t('autorisations.ouvrirReglages'), onPress: autoriserAlarmes }}>
            {t('autorisations.alarmesTexte')}
          </Banner>
        ) : null}
      </ScrollView>

      <BottomSheet ouvert={ouverte !== null} titre={ouverte ? t(`priere.noms.${ouverte}`) : ''} onFermer={() => setOuverte(null)}>
        {ouverte ? (
          <>
            <RadioGroup
              label={t('priere.son')}
              options={sonsFeuille.map((s) => ({ id: s, label: t(`priere.sons.${s}`) }))}
              encadre={false}
              valeur={sonsChoisis[ouverte]}
              onChange={(id) => {
                const s = sons.find((x) => x === id);
                if (s) definirSon(ouverte, s);
              }}
            />
          </>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  phrase: { fontSize: 16, lineHeight: 24 },
  carte: { borderWidth: 1, overflow: 'hidden' },
  ligne: { flexDirection: 'row', alignItems: 'center', minHeight: 66 },
  filet: { borderTopWidth: 1 },
  textes: { flex: 1, minWidth: 0 },
  local: { fontSize: 14 },
  son: { flexDirection: 'row', alignItems: 'center' },
  sonTexte: { fontSize: 14, lineHeight: 20, flexShrink: 1 },
  methode: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderWidth: 1 },
});
