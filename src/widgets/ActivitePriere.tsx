// Activité en direct iPhone « Prochaine prière » : écran verrouillé et Dynamic Island, démarrée par l'app quand elle est
// ouverte dans les 30 minutes avant la prière (voir features/horsapp/activite.ts). Elle ne calcule rien : l'app passe le
// nom, l'heure et la ville déjà traduits. Code exécuté dans le runtime isolé des widgets : ni hook, ni import local, ni
// valeur de module lue dans la fonction. L'heure est affichée fixe (« 16:35 ») : aucun compte à rebours n'est documenté
// pour ces composants.
import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type PropsActivitePriere = { titre: string; nom: string; heure: string; ville: string };

const ActivitePriere = (props: PropsActivitePriere, _environment: LiveActivityEnvironment) => {
  'widget';
  const secondaire = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
  return {
    banner: (
      <VStack alignment="leading">
        <Text modifiers={[font({ size: 12 }), secondaire]}>{props.titre}</Text>
        <HStack>
          <Text modifiers={[font({ size: 24, weight: 'bold' })]}>{props.nom}</Text>
          <Text modifiers={[font({ size: 24 })]}>{props.heure}</Text>
        </HStack>
        <Text modifiers={[font({ size: 12 }), secondaire]}>{props.ville}</Text>
      </VStack>
    ),
    compactLeading: <Text modifiers={[font({ size: 14, weight: 'bold' })]}>{props.nom}</Text>,
    compactTrailing: <Text modifiers={[font({ size: 14, weight: 'bold' })]}>{props.heure}</Text>,
    minimal: <Text modifiers={[font({ size: 12, weight: 'bold' })]}>{props.nom}</Text>,
    expandedLeading: (
      <VStack alignment="leading">
        <Text modifiers={[font({ size: 18, weight: 'bold' })]}>{props.nom}</Text>
        <Text modifiers={[font({ size: 12 }), secondaire]}>{props.ville}</Text>
      </VStack>
    ),
    expandedTrailing: <Text modifiers={[font({ size: 30, weight: 'bold' })]}>{props.heure}</Text>,
    expandedBottom: <Text modifiers={[font({ size: 12 }), secondaire]}>{props.titre}</Text>,
  };
};

export default createLiveActivity('ActivitePriere', ActivitePriere);
