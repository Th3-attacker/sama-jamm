// Widget Android « Prochaine prière » : « Asr 16:35 », sans compte à rebours (Android n'a pas de frise d'entrées dans
// expo-widgets). Remplace `ProchainePriere.tsx` sur Android : Metro choisit le fichier `.android`. Mêmes props que la
// version iPhone ; le texte est déjà traduit par l'app. Runtime isolé : ni hook, ni import local.
import { Column, Text } from '@expo/ui/jetpack-compose';
import { createWidget } from 'expo-widgets';

export type PropsProchainePriere = { titre: string; nom: string; heure: string };

const ProchainePriere = (props: PropsProchainePriere) => {
  'widget';
  return (
    <Column>
      <Text>{props.titre}</Text>
      <Text>{`${props.nom} ${props.heure}`}</Text>
    </Column>
  );
};

export default createWidget<PropsProchainePriere>('ProchainePriere', ProchainePriere, { titre: '', nom: '', heure: '' });
