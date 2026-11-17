import { useState } from 'react';

import { EcranRecherche } from '@/features/recherche/EcranRecherche';

/**
 * Recherche ouverte par la loupe (Accueil, Lire, Plus, lecteur) : champ de l'app et « Fermer ».
 * Android l'utilise seule ; sur iPhone, l'onglet Recherche monte le même contenu.
 */
export default function Recherche() {
  // La requête reste dans l'état de l'écran : elle survit à l'ouverture d'un verset et au retour.
  const [requete, setRequete] = useState('');
  return <EcranRecherche mode="modale" requete={requete} onRequete={setRequete} />;
}
