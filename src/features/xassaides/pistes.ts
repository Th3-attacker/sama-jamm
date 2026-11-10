// Xassaïdes et causeries de xassaid.com, écoutés en flux depuis files.xassaid.com (rien n'est embarqué dans l'app).
// Fonctions pures sur le catalogue : la piste en cours est un couple source, identifiant de piste.

export type Piste = {
  /** Identifiant de l'audio sur xassaid.com. */
  id: number;
  titre: string;
  /** Nom du fichier, déjà encodé pour une adresse. */
  chemin: string;
  octets: number;
};

export type Source = {
  id: string;
  nom: string;
  /** Chants de xassaïdes, ou causeries (waxtaan). */
  genre: 'xassaide' | 'causerie';
  pistes: readonly Piste[];
};

export type PisteEnCours = { source: string; id: number };

const BASE = 'https://files.xassaid.com/audios/';

/** Adresse du fichier audio d'une piste. */
export const urlPiste = (p: Piste): string => `${BASE}${p.chemin}`;

export const trouverSource = (sources: readonly Source[], id: string): Source | undefined =>
  sources.find((s) => s.id === id);

export function trouverPiste(sources: readonly Source[], idSource: string, idPiste: number): Piste | undefined {
  return trouverSource(sources, idSource)?.pistes.find((p) => p.id === idPiste);
}

/** Temps en secondes, affiché « m:ss » ou « h:mm:ss ». */
export function formatTemps(secondes: number): string {
  const s = Number.isFinite(secondes) && secondes > 0 ? Math.floor(secondes) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const deux = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${deux(m)}:${deux(s % 60)}` : `${m}:${deux(s % 60)}`;
}

/** Nouvelle position après un saut de `pas` secondes, bornée entre le début et la fin de la piste. */
export function tempsApresSaut(temps: number, pas: number, duree: number): number {
  const fin = Number.isFinite(duree) && duree > 0 ? duree : Number.POSITIVE_INFINITY;
  return Math.min(fin, Math.max(0, temps + pas));
}
