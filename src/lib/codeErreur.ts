// Code court à donner au support : une empreinte du type d'erreur, jamais son contenu (aucune donnée personnelle).

/** Empreinte FNV-1a sur 32 bits, en 4 caractères hexadécimaux. */
function empreinte(texte: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * « ERR-3FA2 · 29/10 14:12 » : même erreur, même code. Seuls le nom de l'erreur et la première ligne de son
 * message entrent dans l'empreinte ; le message lui-même n'est jamais affiché.
 */
export function codeErreur(erreur: unknown, date: Date, prefixe = 'ERR'): string {
  const e = erreur instanceof Error ? erreur : new Error(String(erreur));
  const premiereLigne = e.message.split('\n')[0] ?? '';
  const deux = (n: number) => String(n).padStart(2, '0');
  const quand = `${deux(date.getDate())}/${deux(date.getMonth() + 1)} ${deux(date.getHours())}:${deux(date.getMinutes())}`;
  return `${prefixe}-${empreinte(`${e.name}:${premiereLigne}`)} · ${quand}`;
}
