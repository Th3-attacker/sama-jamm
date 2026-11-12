// Widget Android « Les cinq prières » : une ligne par prière, la prochaine précédée d'une flèche (pas de gras dans la
// liste des modificateurs Android d'expo-widgets). Remplace `CinqPrieres.tsx` sur Android. Runtime isolé.
import { Column, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import { createWidget } from 'expo-widgets';

export type LignePriere = { nom: string; heure: string; prochaine: boolean };
export type PropsCinqPrieres = { titre: string; lignes: LignePriere[] };

const CinqPrieres = (props: PropsCinqPrieres) => {
  'widget';
  return (
    <Column>
      <Text>{props.titre}</Text>
      {props.lignes.map((l) => (
        <Row key={l.nom}>
          <Text>{l.prochaine ? `▸ ${l.nom}` : l.nom}</Text>
          <Spacer />
          <Text>{l.heure}</Text>
        </Row>
      ))}
    </Column>
  );
};

export default createWidget<PropsCinqPrieres>('CinqPrieres', CinqPrieres, { titre: '', lignes: [] });
