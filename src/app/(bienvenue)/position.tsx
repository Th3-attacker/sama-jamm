import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { MiseEnPage } from '@/features/bienvenue/MiseEnPage';
import { chercherVilles, type Ville } from '@/features/priere/villes';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SearchField } from '@/ui/SearchField';

type Etat = { mode: 'explication' } | { mode: 'ville'; raison: 'choix' | 'refus' | 'introuvable' };

function coordonnees(v: Ville): string {
  const lat = `${Math.abs(v.lat).toFixed(2)}° ${v.lat >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(v.lon).toFixed(2)}° ${v.lon >= 0 ? 'E' : 'O'}`;
  return `${v.paysNom} · ${lat}, ${lon}`;
}

export default function Position() {
  const { t, i18n } = useTranslation();
  const { couleurs, typographie } = useTheme();
  const definirLieu = useReglages((s) => s.definirLieu);
  const [etat, setEtat] = useState<Etat>({ mode: 'explication' });
  const [recherche, setRecherche] = useState('');
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
    const resultats = chercherVilles(recherche);
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
        <SearchField label={t('priere.chercherVille')} placeholder={t('priere.chercherVille')} valeur={recherche} onChange={setRecherche} />
        <ListGroup>
          {resultats.map((v) => (
            <ListItem
              key={v.id}
              icone="pin"
              titre={i18n.language === 'ar' ? v.nomAr : v.nom}
              sousTitre={coordonnees(v)}
              onPress={() => choisirVille(v)}
            />
          ))}
        </ListGroup>
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
    </MiseEnPage>
  );
}
