import { Redirect } from 'expo-router';

import { useReglages } from '@/stores/reglages';

// Premier lancement : bienvenue ; ensuite, directement l'Accueil.
export default function Index() {
  const bienvenueTerminee = useReglages((s) => s.bienvenueTerminee);
  return <Redirect href={bienvenueTerminee ? '/accueil' : '/langue'} />;
}
