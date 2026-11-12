import { router } from 'expo-router';
import { useState } from 'react';

import { demanderNotifications } from '@/features/bienvenue/autorisations';
import { EcranAutorisation } from '@/features/bienvenue/EcranAutorisation';
import { replanifier } from '@/features/priere/notifications';
import { prieres, useReglages } from '@/stores/reglages';

/** Planche « Avant la demande de notifications » : explication, puis demande du téléphone, puis l'Accueil. */
export default function AutorisationNotifications() {
  const definirRappel = useReglages((s) => s.definirRappel);
  const terminerBienvenue = useReglages((s) => s.terminerBienvenue);
  const [enCours, setEnCours] = useState(false);

  const continuer = async () => {
    setEnCours(true);
    const accordee = await demanderNotifications();
    if (accordee) {
      replanifier().catch((erreur: unknown) => console.error('Programmation des notifications impossible', erreur));
    } else {
      // Refus : rappels désactivés, réglables plus tard dans Prière › Rappels.
      prieres.forEach((p) => definirRappel(p, false));
    }
    terminerBienvenue();
    router.replace('/accueil');
  };

  return <EcranAutorisation type="notifications" enCours={enCours} onContinuer={() => void continuer()} />;
}
