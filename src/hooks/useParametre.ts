import { useLocalSearchParams } from 'expo-router';

/** Paramètre de route en texte (le premier si la route en reçoit plusieurs) ; chaîne vide s'il est absent. */
export function useParametre(nom: string): string {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const valeur = params[nom];
  return (Array.isArray(valeur) ? valeur[0] : valeur) ?? '';
}
