// Session Supabase rangée dans le trousseau du téléphone, en morceaux : une valeur du trousseau ne doit pas
// dépasser 2 048 octets, et une session (deux jetons et le profil) dépasse souvent cette taille.
// Logique sans module natif, testable seule ; le branchement sur le trousseau est dans `stockageSession.ts`.

/** Taille d'un morceau, en octets UTF-8 : sous la limite de 2 048 octets, avec de la marge. */
export const OCTETS_PAR_MORCEAU = 1800;
/** Au-delà, le compteur lu n'est pas le nôtre : la session est considérée comme absente. */
const MORCEAUX_MAX = 64;

const octetsUtf8 = (point: number) => (point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4);

/** Découpe un texte en morceaux d'au plus `maxOctets` octets UTF-8, sans couper un caractère. Texte vide : aucun morceau. */
export function decouper(texte: string, maxOctets = OCTETS_PAR_MORCEAU): string[] {
  if (!Number.isInteger(maxOctets) || maxOctets < 4) throw new RangeError('Taille de morceau invalide.');
  const morceaux: string[] = [];
  let courant = '';
  let octets = 0;
  // `for…of` avance par caractère entier : une paire de substitution (émoji) n'est jamais séparée.
  for (const caractere of texte) {
    const taille = octetsUtf8(caractere.codePointAt(0) ?? 0);
    if (octets + taille > maxOctets) {
      morceaux.push(courant);
      courant = '';
      octets = 0;
    }
    courant += caractere;
    octets += taille;
  }
  if (courant !== '') morceaux.push(courant);
  return morceaux;
}

export const assembler = (morceaux: readonly string[]) => morceaux.join('');

/** Trousseau du téléphone (stockage chiffré par le système). */
export type Trousseau = {
  lire: (cle: string) => Promise<string | null>;
  ecrire: (cle: string, valeur: string) => Promise<void>;
  effacer: (cle: string) => Promise<void>;
};

/** Ancien stockage, non chiffré : lu une dernière fois pour déplacer la session, puis vidé. */
export type AncienStockage = {
  lire: (cle: string) => string | null;
  effacer: (cle: string) => void;
};

export type StockageSession = {
  getItem: (cle: string) => Promise<string | null>;
  setItem: (cle: string, valeur: string) => Promise<void>;
  removeItem: (cle: string) => Promise<void>;
};

const cleCompteur = (cle: string) => `${cle}.n`;
const cleMorceau = (cle: string, i: number) => `${cle}.${i}`;

/** Stockage de session pour Supabase : morceaux dans le trousseau, reprise de la session de l'ancien stockage. */
export function creerStockageSession(
  trousseau: Trousseau,
  ancien: AncienStockage,
  avertir: (message: string, erreur?: unknown) => void = () => undefined,
): StockageSession {
  /** Nombre de morceaux rangés : null si rien n'est rangé, NaN si le compteur est illisible. */
  async function compteur(cle: string): Promise<number | null> {
    const brut = await trousseau.lire(cleCompteur(cle));
    if (brut === null) return null;
    const n = Number(brut);
    return Number.isInteger(n) && n >= 1 && n <= MORCEAUX_MAX ? n : Number.NaN;
  }

  async function ecrire(cle: string, valeur: string): Promise<void> {
    const morceaux = decouper(valeur);
    if (morceaux.length === 0 || morceaux.length > MORCEAUX_MAX) throw new RangeError('Session vide ou trop longue.');
    const avant = await compteur(cle);
    // Le compteur est retiré d'abord et remis en dernier : une écriture interrompue laisse une session absente,
    // jamais un mélange d'anciens et de nouveaux morceaux.
    await trousseau.effacer(cleCompteur(cle));
    for (const [i, morceau] of morceaux.entries()) await trousseau.ecrire(cleMorceau(cle, i), morceau);
    await trousseau.ecrire(cleCompteur(cle), String(morceaux.length));
    const enTrop = avant !== null && Number.isInteger(avant) ? avant : 0;
    for (let i = morceaux.length; i < enTrop; i++) await trousseau.effacer(cleMorceau(cle, i));
  }

  async function effacer(cle: string): Promise<void> {
    const n = await compteur(cle);
    await trousseau.effacer(cleCompteur(cle));
    const nombre = n !== null && Number.isInteger(n) ? n : 0;
    for (let i = 0; i < nombre; i++) await trousseau.effacer(cleMorceau(cle, i));
  }

  return {
    async getItem(cle) {
      const n = await compteur(cle);
      if (n !== null) {
        if (!Number.isInteger(n)) {
          avertir('Session du trousseau illisible : compteur invalide');
          return null;
        }
        const morceaux = await Promise.all(Array.from({ length: n }, (_, i) => trousseau.lire(cleMorceau(cle, i))));
        const complets = morceaux.filter((m): m is string => m !== null);
        if (complets.length !== n) {
          avertir('Session du trousseau incomplète : reconnexion nécessaire');
          return null;
        }
        return assembler(complets);
      }
      // Rien dans le trousseau : session d'une version précédente de l'app, à déplacer.
      const vieille = ancien.lire(cle);
      if (vieille === null) return null;
      try {
        await ecrire(cle, vieille);
        ancien.effacer(cle);
      } catch (erreur: unknown) {
        // La session reste utilisable ; le déplacement sera retenté à la prochaine ouverture.
        avertir('Session non déplacée vers le trousseau', erreur);
      }
      return vieille;
    },

    async setItem(cle, valeur) {
      // L'ancienne copie en clair part d'abord : elle ne doit jamais revenir à la place d'une session plus récente.
      ancien.effacer(cle);
      if (valeur === '') return effacer(cle);
      await ecrire(cle, valeur);
    },

    async removeItem(cle) {
      ancien.effacer(cle);
      await effacer(cle);
    },
  };
}
