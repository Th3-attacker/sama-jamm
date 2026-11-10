// Villes proposées quand la position est refusée (design system, donnees/villes.json).
// Coordonnées à vérifier avant publication contre une source officielle.
import donnees from '@/data/villes.json';
import type { Lieu } from '@/stores/reglages';

export type Ville = (typeof donnees.villes)[number];

export const villes: readonly Ville[] = donnees.villes;

// Recherche tolérante aux accents : « kaedi » trouve « Kaédi ».
function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/**
 * Fuseau IANA de la ville choisie (« Africa/Nouakchott »), lu dans `villes.json` à partir de l'id enregistré.
 * Undefined pour une position GPS ou une ville inconnue : l'heure reste celle du téléphone.
 */
export function fuseauDuLieu(lieu: Lieu | null): string | undefined {
  if (!lieu || lieu.type !== 'ville') return undefined;
  const ville = villes.find((v) => v.id === lieu.id);
  return ville && 'fuseau' in ville ? ville.fuseau : undefined;
}

export function chercherVilles(requete: string): readonly Ville[] {
  const q = normaliser(requete);
  if (!q) return villes;
  return villes.filter((v) => normaliser(v.nom).includes(q) || v.nomAr.includes(requete.trim()) || normaliser(v.region).includes(q));
}
