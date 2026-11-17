import { EcranPlus } from '@/features/plus/EcranPlus';

/**
 * Onglet Plus (Android, iOS avant 26). Sur iOS 26 et plus cet onglet n'a pas de déclencheur : une route d'onglet sans
 * déclencheur est inatteignable (expo-router la redirige vers l'onglet initial), l'écran s'ouvre donc par
 * `/plus/menu`, empilé au-dessus des onglets.
 */
export default function Plus() {
  return <EcranPlus />;
}
