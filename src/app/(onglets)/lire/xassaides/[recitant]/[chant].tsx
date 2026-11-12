import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { ecouterXassaide } from '@/features/ecouter/lecteur';

/**
 * Lien profond `samajamm://lire/xassaides/{recueil}/{chant}` : lance le chant et ouvre le lecteur audio.
 * `recitant` est l'identifiant du recueil dans le catalogue ; un chant inconnu ne lance rien et renvoie au recueil.
 */
export default function RelaisChant() {
  const { recitant, chant } = useLocalSearchParams<{ recitant: string; chant: string }>();
  useEffect(() => {
    const id = Number(chant);
    if (recitant && Number.isInteger(id)) ecouterXassaide(recitant, id);
  }, [recitant, chant]);
  return <Redirect href="/lecteur" />;
}
