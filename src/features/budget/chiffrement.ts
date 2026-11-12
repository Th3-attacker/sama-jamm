// Sans SQLCipher dans le build, `PRAGMA key` est ignoré sans erreur et le budget resterait en clair.
// `PRAGMA cipher_version` ne répond que si SQLCipher est présent : sinon, on refuse d'ouvrir le budget.
export class ChiffrementIndisponible extends Error {
  constructor() {
    super("SQLCipher n'est pas dans ce build : le budget ne peut pas être ouvert.");
    this.name = 'ChiffrementIndisponible';
  }
}

/** `reponse` : ligne renvoyée par `PRAGMA cipher_version` (absente ou vide sans SQLCipher). */
export function verifierChiffrement(reponse: { cipher_version?: unknown } | null | undefined): void {
  const version = reponse?.cipher_version;
  if (typeof version !== 'string' || version.trim() === '') throw new ChiffrementIndisponible();
}
