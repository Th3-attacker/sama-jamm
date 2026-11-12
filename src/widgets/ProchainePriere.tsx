// Widget iPhone « Prochaine prière » (petit format). Il ne calcule rien : l'app lui passe le nom et l'heure déjà
// traduits (voir features/horsapp/widgets.ts). Code exécuté dans le runtime isolé des widgets : ni hook, ni import
// local, ni valeur de module lue dans la fonction.
import { Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import { PlatformColor } from 'react-native';

export type PropsProchainePriere = { titre: string; nom: string; heure: string };

const ProchainePriere = (props: PropsProchainePriere) => {
  'widget';
  return (
    <VStack modifiers={[containerBackground(PlatformColor('systemBackground'), 'widget')]}>
      <Text modifiers={[font({ size: 12 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>{props.titre}</Text>
      <Text modifiers={[font({ size: 24 })]}>{props.nom}</Text>
      <Text modifiers={[font({ size: 30 })]}>{props.heure}</Text>
    </VStack>
  );
};

export default createWidget<PropsProchainePriere>('ProchainePriere', ProchainePriere, { titre: '', nom: '', heure: '' });
