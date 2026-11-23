// Notification persistante Android « Prochaine prière » (compte à rebours de la planche `HorsCompteAndroid`) : posée par
// l'app quand elle est ouverte dans les 30 minutes avant la prière, retirée par le système à l'heure de la prière
// (`timeoutAfter`). Elle ne calcule rien : l'app passe le texte déjà traduit (voir features/horsapp/compteAndroid.ts).
// Code exécuté dans le runtime isolé des widgets : ni hook, ni import local, ni valeur de module lue dans la fonction.
// Heure fixe (« Asr 16:35 ») : aucun minuteur ni barre n'est documenté pour les notifications personnalisées.
import { Column, Text } from '@expo/ui/jetpack-compose';
import { createCustomNotification } from 'expo-widgets';

export type PropsCompteNotification = { titre: string; priere: string; ville: string };

const CompteNotification = (props: PropsCompteNotification) => {
  'widget';
  return {
    collapsed: (
      <Column>
        <Text>{props.titre}</Text>
        <Text>{props.priere}</Text>
      </Column>
    ),
    expanded: (
      <Column>
        <Text>{props.titre}</Text>
        <Text>{props.priere}</Text>
        <Text>{props.ville}</Text>
      </Column>
    ),
  };
};

export default createCustomNotification<PropsCompteNotification>('ComptePriere', CompteNotification);
