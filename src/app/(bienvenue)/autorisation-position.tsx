import { router } from 'expo-router';
import { useState } from 'react';

import { obtenirPosition } from '@/features/bienvenue/autorisations';
import { EcranAutorisation } from '@/features/bienvenue/EcranAutorisation';
import { useReglages } from '@/stores/reglages';

/** Planche « Avant la demande de position » : explication, puis demande du téléphone. Refus : choix d'une ville. */
export default function AutorisationPosition() {
  const definirLieu = useReglages((s) => s.definirLieu);
  const [enCours, setEnCours] = useState(false);

  const continuer = async () => {
    setEnCours(true);
    const resultat = await obtenirPosition();
    setEnCours(false);
    if (resultat.ok) {
      definirLieu({ type: 'position', latitude: resultat.latitude, longitude: resultat.longitude });
      router.replace('/rappels');
    } else {
      // Retour à l'écran position, ouvert sur le choix d'une ville avec le message qui explique pourquoi.
      router.dismissTo({ pathname: '/position', params: { raison: resultat.raison } });
    }
  };

  return <EcranAutorisation type="position" enCours={enCours} onContinuer={() => void continuer()} />;
}
