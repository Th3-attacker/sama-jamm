import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { RaisonsAutorisation } from '@/features/autorisation/AvantAutorisation';
import { MiseEnPage } from '@/features/bienvenue/MiseEnPage';
import { ChoixVille } from '@/features/priere/ChoixVille';
import type { Ville } from '@/features/priere/villes';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';

type Etat = { mode: 'explication' } | { mode: 'ville'; raison: 'choix' | 'refus' | 'introuvable' };

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
      <RaisonsAutorisation type="position" />
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
        {t('autorisations.avant.position.demande')}
      </Text>
    </MiseEnPage>
  );
}
