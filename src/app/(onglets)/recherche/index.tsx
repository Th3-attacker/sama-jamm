import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EcranRecherche } from '@/features/recherche/EcranRecherche';
import { useTheme } from '@/theme/useTheme';

/**
 * Onglet Recherche d'iPhone : le champ est celui du système. Sur iOS 26.1 et plus, toucher l'onglet active le champ.
 * Le contenu (filtres, sourates, versets, états vides) est celui de /plus/recherche.
 */
export default function OngletRecherche() {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  // La requête reste dans l'état de l'écran : elle survit à l'ouverture d'un verset et au retour.
  const [requete, setRequete] = useState('');
  return (
    <>
      <Stack.SearchBar
        placement="automatic"
        placeholder={t('recherche.placeholder')}
        textColor={couleurs.encre}
        tintColor={couleurs.emeraude}
        onChangeText={(e) => setRequete(e.nativeEvent.text)}
        onCancelButtonPress={() => setRequete('')}
      />
      <EcranRecherche mode="onglet" requete={requete} onRequete={setRequete} />
    </>
  );
}
