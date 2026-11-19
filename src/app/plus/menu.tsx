import { EcranPlus } from '@/features/plus/EcranPlus';

/**
 * Plus empilé hors des onglets (iOS 26 et plus) : ouvert par le bouton en haut de l'Accueil, fermé par la flèche de
 * retour ou le geste de bord. Android et iOS 18 gardent l'onglet Plus.
 */
export default function MenuPlus() {
  return <EcranPlus empile />;
}
