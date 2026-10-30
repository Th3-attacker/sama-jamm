// Villes proposées quand la position est refusée (design system, donnees/villes.json).
// Coordonnées à vérifier avant publication contre une source officielle.
import donnees from '@/data/villes.json';

export type Ville = (typeof donnees.villes)[number];

export const villes: readonly Ville[] = donnees.villes;

// Recherche tolérante aux accents : « kaedi » trouve « Kaédi ».
function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function chercherVilles(requete: string): readonly Ville[] {
  const q = normaliser(requete);
  if (!q) return villes;
  return villes.filter((v) => normaliser(v.nom).includes(q) || v.nomAr.includes(requete.trim()) || normaliser(v.region).includes(q));
}
