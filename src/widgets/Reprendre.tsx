// Widget iPhone « Reprendre » (petit format) : la sourate et le verset où la lecture s'est arrêtée. Jamais d'extrait
// du texte sacré : le nom de la sourate et le numéro du verset seulement. Runtime isolé : tout vient des props.
import { Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import { PlatformColor } from 'react-native';

export type PropsReprendre = { titre: string; sourate: string; detail: string };

const Reprendre = (props: PropsReprendre) => {
  'widget';
  return (
    <VStack alignment="leading" modifiers={[containerBackground(PlatformColor('systemBackground'), 'widget')]}>
      <Text modifiers={[font({ size: 12 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>{props.titre}</Text>
      <Text modifiers={[font({ size: 18, weight: 'bold' })]}>{props.sourate}</Text>
      <Text modifiers={[font({ size: 14 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>{props.detail}</Text>
    </VStack>
  );
};

export default createWidget<PropsReprendre>('Reprendre', Reprendre, { titre: '', sourate: '', detail: '' });
