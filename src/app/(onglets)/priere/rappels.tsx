import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { calculerHoraires } from '@/features/priere/horaires';
import { essayerSon } from '@/features/priere/notifications';
import { useOptionsCalcul } from '@/features/priere/useOptionsCalcul';
import { formatHeure } from '@/lib/dates';
import { prieres, sons, useReglages, type NomPriere } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { RadioGroup } from '@/ui/RadioGroup';
import { Switch } from '@/ui/Switch';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

const AVANCES = [5, 10, 15, 30] as const;

export default function AppelEtRappels() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const marge = useMargeBasse();
  const rappels = useReglages((s) => s.rappels);
  const sonsChoisis = useReglages((s) => s.sons);
  const rappelAvant = useReglages((s) => s.rappelAvant);
  const definirRappel = useReglages((s) => s.definirRappel);
  const definirSon = useReglages((s) => s.definirSon);
  const [essaiRefuse, setEssaiRefuse] = useState(false);
  const definirRappelAvant = useReglages((s) => s.definirRappelAvant);
  const [ouverte, setOuverte] = useState<NomPriere | null>(null);
  const [alarmesRefusees, setAlarmesRefusees] = useState(false);
  const lieu = useReglages((s) => s.lieu);
  const methode = useReglages((s) => s.methode);
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

  const resume = (p: NomPriere) => {
    const avant = rappelAvant[p];
    const son = t(`priere.sons.${sonsChoisis[p]}`);
    return avant ? `${son} · ${t('priere.rappelAvant', { minutes: avant })}` : son;
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('priere.rappelsTitre')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 + marge, gap: espace.espace5 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {t('priere.rappelsSousTitre')}
        </Text>
        {/* Une seule carte : une ligne par prière, le réglage du son s'ouvre en touchant la ligne. */}
        <ListGroup>
          {prieres.map((p) => {
            const nom = t(`priere.noms.${p}`);
            const heure = horaires ? ` · ${formatHeure(horaires[p])}` : '';
            return (
              <ListItem
                key={p}
                titre={`${nom} · ${t(`priere.nomsLocaux.${p}`)}${heure}`}
                sousTitre={resume(p)}
                fin="chevron"
                onPress={() => setOuverte(p)}
                droite={
                  <Switch
                    label={t('priere.notificationDe', { priere: nom })}
                    active={rappels[p]}
                    onChange={(actif) => definirRappel(p, actif)}
                  />
                }
              />
            );
          })}
        </ListGroup>
        <ListGroup>
          <ListItem
            titre={t('priere.methodeTitre')}
            sousTitre={t(`priere.methodes.${methode}`)}
            onPress={() => router.push('/priere/methode')}
          />
        </ListGroup>
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
              options={sons.map((s) => ({ id: s, label: t(`priere.sons.${s}`) }))}
              encadre={false}
              valeur={sonsChoisis[ouverte]}
              onChange={(id) => {
                const s = sons.find((x) => x === id);
                if (s) definirSon(ouverte, s);
              }}
            />
            <Button
              variant="secondaire"
              icone="bell"
              pleineLargeur
              onPress={() => {
                essayerSon(sonsChoisis[ouverte])
                  .then((ok) => setEssaiRefuse(!ok))
                  .catch((erreur: unknown) => console.warn('Essai du son impossible', erreur));
              }}>
              {t('priere.essayerSon')}
            </Button>
            {essaiRefuse ? <Banner ton="attention">{t('priere.essaiRefuse')}</Banner> : null}
            <RadioGroup
              label={t('priere.rappelAvantTitre')}
              options={[
                { id: 'aucun', label: t('priere.sansRappel') },
                ...AVANCES.map((m) => ({ id: String(m), label: t('priere.rappelAvant', { minutes: m }) })),
              ]}
              encadre={false}
              valeur={rappelAvant[ouverte] ? String(rappelAvant[ouverte]) : 'aucun'}
              onChange={(id) => definirRappelAvant(ouverte, id === 'aucun' ? null : Number(id))}
            />
          </>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
