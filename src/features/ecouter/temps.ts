// Temps du lecteur audio : affichage.

/** Temps en secondes, affiché « m:ss » ou « h:mm:ss ». */
export function formatTemps(secondes: number): string {
  const s = Number.isFinite(secondes) && secondes > 0 ? Math.floor(secondes) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const deux = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${deux(m)}:${deux(s % 60)}` : `${m}:${deux(s % 60)}`;
}
