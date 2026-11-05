import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { MiseEnPage } from '@/features/bienvenue/MiseEnPage';
import { ChoixVille } from '@/features/priere/ChoixVille';
import type { Ville } from '@/features/priere/villes';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { DayArc, type PriereArc } from '@/ui/DayArc';

type Etat = { mode: 'explication' } | { mode: 'ville'; raison: 'choix' | 'refus' | 'introuvable' };

const EXEMPLE_ARC: PriereArc[] = [
  { nom: 'Fajr', heure: '06:05', minutes: 6 * 60 + 5, etat: 'passee' },
  { nom: 'Dhuhr', heure: '13:20', minutes: 13 * 60 + 20, etat: 'passee' },
  { nom: 'Asr', heure: '16:35', minutes: 16 * 60 + 35, etat: 'prochaine' },
  { nom: 'Maghrib', heure: '19:10', minutes: 19 * 60 + 10, etat: 'a-venir' },
  { nom: 'Isha', heure: '20:25', minutes: 20 * 60 + 25, etat: 'a-venir' },
];

export default function Position() {
  const { t } = useTranslation();
  const { couleurs, typographie } = useTheme();
  const definirLieu = useReglages((s) => s.definirLieu);
  const [etat, setEtat] = useState<Etat>({ mode: 'explication' });
  const [enCours, setEnCours] = useState(false);

  const suivant = () => router.push('/rappels');

  const utiliserPosition = async () => {
    setEnCours(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setEtat({ mode: 'ville', raison: 'refus' });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      definirLieu({ type: 'position', latitude: position.coords.latitude, longitude: position.coords.longitude });
      suivant();
    } catch (erreur: unknown) {
      console.warn('Position indisponible', erreur);
      setEtat({ mode: 'ville', raison: 'introuvable' });
    } finally {
      setEnCours(false);
    }
  };

  const choisirVille = (v: Ville) => {
    definirLieu({ type: 'ville', id: v.id, nom: v.nom, latitude: v.lat, longitude: v.lon });
    suivant();
  };

  if (etat.mode === 'ville') {
    return (
      <MiseEnPage
        etape={1}
        actions={
          <Button variant="discret" pleineLargeur onPress={suivant}>
            {t('commun.plusTard')}
          </Button>
        }>
        <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre1, { color: couleurs.emeraude }]}>
          {t('bienvenue.positionVille')}
        </Text>
        {etat.raison === 'refus' ? (
          <Banner ton="erreur" titre={t('priere.positionRefusee')}>
            {t('priere.positionRefuseeTexte')}
          </Banner>
        ) : null}
        {etat.raison === 'introuvable' ? <Banner ton="erreur">{t('bienvenue.positionIntrouvable')}</Banner> : null}
        <ChoixVille onChoisir={choisirVille} />
      </MiseEnPage>
    );
  }

  return (
    <MiseEnPage
      etape={1}
      actions={
        <>
          <Button pleineLargeur icone="pin" disabled={enCours} onPress={utiliserPosition}>
            {t('bienvenue.positionAutoriser')}
          </Button>
          <Button variant="discret" pleineLargeur onPress={() => setEtat({ mode: 'ville', raison: 'choix' })}>
            {t('bienvenue.positionVille')}
          </Button>
        </>
      }>
      <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre1, { color: couleurs.emeraude }]}>
        {t('bienvenue.positionTitre')}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre, fontSize: 17, lineHeight: 26 }]}>
        {t('bienvenue.positionTexte')}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
        {t('bienvenue.positionTexte2')}
      </Text>
      {/* Illustration de la maquette : les prières posées sur la course du soleil (heures d'exemple). */}
      <DayArc
        lever={7 * 60 + 5}
        coucher={19 * 60 + 5}
        maintenant={15 * 60 + 53}
        prieres={EXEMPLE_ARC}
        dans="42 min"
        avant={t('accueil.avant', { priere: 'Asr' })}
        a={t('accueil.a', { heure: '16:35' })}
        description={t('bienvenue.arcExemple')}
      />
    </MiseEnPage>
  );
}
