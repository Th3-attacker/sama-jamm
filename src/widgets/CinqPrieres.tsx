// Widget iPhone « Les cinq prières » (format moyen) : les heures du jour, la prochaine en gras. Code exécuté dans le
// runtime isolé des widgets : ni hook, ni import local ; tout vient des props (voir features/horsapp/widgets.ts).
import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import { PlatformColor } from 'react-native';

export type LignePriere = { nom: string; heure: string; prochaine: boolean };
export type PropsCinqPrieres = { titre: string; lignes: LignePriere[] };

const CinqPrieres = (props: PropsCinqPrieres) => {
  'widget';
  return (
    <VStack alignment="leading" modifiers={[containerBackground(PlatformColor('systemBackground'), 'widget')]}>
      <Text modifiers={[font({ size: 12 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>{props.titre}</Text>
      {props.lignes.map((l) => (
        <HStack key={l.nom}>
          <Text modifiers={[font({ size: 14, weight: l.prochaine ? 'bold' : 'regular' })]}>{l.nom}</Text>
          <Spacer />
          <Text modifiers={[font({ size: 14, weight: l.prochaine ? 'bold' : 'regular' })]}>{l.heure}</Text>
        </HStack>
      ))}
    </VStack>
  );
};

export default createWidget<PropsCinqPrieres>('CinqPrieres', CinqPrieres, { titre: '', lignes: [] });
