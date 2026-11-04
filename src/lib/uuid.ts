// Identifiants UUID v7 (RFC 9562) : triables par date de création, comme le demande le design pour le budget.
// Fonction pure : l'heure et les octets aléatoires sont fournis par l'appelant (testable, sans dépendance).

const hex = (octets: Uint8Array) => Array.from(octets, (o) => o.toString(16).padStart(2, '0')).join('');

/** `maintenantMs` : millisecondes depuis 1970 ; `aleatoire` : au moins 10 octets tirés au hasard. */
export function uuidV7(maintenantMs: number, aleatoire: Uint8Array): string {
  if (!Number.isSafeInteger(maintenantMs) || maintenantMs < 0) throw new RangeError('Horodatage invalide.');
  if (aleatoire.length < 10) throw new RangeError('Il faut au moins 10 octets aléatoires.');
  const o = new Uint8Array(16);
  // 48 bits d'horodatage, poids fort d'abord.
  let t = maintenantMs;
  for (let i = 5; i >= 0; i--) {
    o[i] = t % 256;
    t = Math.floor(t / 256);
  }
  o.set(aleatoire.subarray(0, 10), 6);
  o[6] = ((o[6] ?? 0) & 0x0f) | 0x70; // version 7
  o[8] = ((o[8] ?? 0) & 0x3f) | 0x80; // variante RFC
  const h = hex(o);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
