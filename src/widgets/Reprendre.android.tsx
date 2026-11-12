// Widget Android « Reprendre » : nom de la sourate et numéro du verset, jamais un extrait du texte sacré.
// Remplace `Reprendre.tsx` sur Android. Runtime isolé : tout vient des props.
import { Column, Text } from '@expo/ui/jetpack-compose';
import { createWidget } from 'expo-widgets';

export type PropsReprendre = { titre: string; sourate: string; detail: string };

const Reprendre = (props: PropsReprendre) => {
  'widget';
  return (
    <Column>
      <Text>{props.titre}</Text>
      <Text>{props.sourate}</Text>
      <Text>{props.detail}</Text>
    </Column>
  );
};

export default createWidget<PropsReprendre>('Reprendre', Reprendre, { titre: '', sourate: '', detail: '' });
