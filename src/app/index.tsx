import { Redirect } from 'expo-router';

// Premier lancement : bienvenue. L'état « bienvenue terminée » sera lu dans utilisateur.db (étape 3).
export default function Index() {
  return <Redirect href="/langue" />;
}
