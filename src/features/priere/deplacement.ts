// Déplacement du téléphone : règle pure, sans dépendance native.

/** Au-delà de cette distance (km), les horaires d'une position enregistrée sont recalculés (design Prières et rappels). */
export const SEUIL_DEPLACEMENT_KM = 25;

type Point = { latitude: number; longitude: number };

const RAYON_TERRE_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distance à vol d'oiseau entre deux points, en km (formule de haversine). */
export function distanceKm(a: Point, b: Point): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Vrai quand la nouvelle position est à plus de `seuil` km de l'ancienne ; coordonnées invalides : faux. */
export function aDeplace(ancienne: Point, nouvelle: Point, seuil = SEUIL_DEPLACEMENT_KM): boolean {
  const valeurs = [ancienne.latitude, ancienne.longitude, nouvelle.latitude, nouvelle.longitude];
  if (!valeurs.every(Number.isFinite)) return false;
  return distanceKm(ancienne, nouvelle) > seuil;
}
