import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Heure courante mise à jour à chaque minute et au retour au premier plan, jamais en continu.
export function useMaintenant(): Date {
  const [maintenant, setMaintenant] = useState(() => new Date());

  useEffect(() => {
    let intervalle: ReturnType<typeof setInterval> | undefined;
    const debut = setTimeout(() => {
      setMaintenant(new Date());
      intervalle = setInterval(() => setMaintenant(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));

    const abonnement = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') setMaintenant(new Date());
    });

    return () => {
      clearTimeout(debut);
      if (intervalle) clearInterval(intervalle);
      abonnement.remove();
    };
  }, []);

  return maintenant;
}
