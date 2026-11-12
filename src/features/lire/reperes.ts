// Repères du mushaf (début des juz et des quarts de hizb, prosternations) et mise en forme de la translittération.
// Données de Tanzil (tanzil.net, CC BY 3.0), converties par scripts/donnees-coran.mjs. Fonctions pures.

export type DonneesReperes = {
  /** Premier verset de chaque juz (30), [sourate, verset]. */
  juz: [number, number][];
  /** Premier verset de chaque quart de hizb (240). */
  quartsHizb: [number, number][];
  sajdas: [number, number, 'obligatoire' | 'recommandee'][];
};

export type Repere =
  | { type: 'juz'; juz: number }
  /** Quart de hizb : `hizb` de 1 à 60, `quart` de 0 (début du hizb) à 3. */
  | { type: 'hizb'; hizb: number; quart: 0 | 1 | 2 | 3 };

const cle = (s: number, v: number) => s * 1000 + v;

export function creerReperes(d: DonneesReperes) {
  const debutsJuz = d.juz.map(([s, v]) => cle(s, v));
  const quarts = new Map(d.quartsHizb.map(([s, v], i) => [cle(s, v), i] as const));
  const juzDebut = new Map(debutsJuz.map((k, i) => [k, i + 1] as const));
  const sajdas = new Map(d.sajdas.map(([s, v, type]) => [cle(s, v), type] as const));

  return {
    /** Premier verset du juz n (1 à 30), ou null. */
    debutJuz(n: number): { sourate: number; verset: number } | null {
      const debut = d.juz[n - 1];
      return debut ? { sourate: debut[0], verset: debut[1] } : null;
    },
    /** Juz qui contient le verset (1 à 30). */
    juzDe(s: number, v: number): number {
      const k = cle(s, v);
      let juz = 1;
      for (let i = 0; i < debutsJuz.length; i++) if ((debutsJuz[i] ?? 0) <= k) juz = i + 1;
      return juz;
    },
    /** Repère qui commence à ce verset : un début de juz l'emporte sur le quart de hizb qui y commence aussi. */
    repereDe(s: number, v: number): Repere | null {
      const k = cle(s, v);
      const juz = juzDebut.get(k);
      if (juz !== undefined) return { type: 'juz', juz };
      const q = quarts.get(k);
      if (q === undefined) return null;
      return { type: 'hizb', hizb: Math.floor(q / 4) + 1, quart: (q % 4) as 0 | 1 | 2 | 3 };
    },
    /** Prosternation de récitation après ce verset, ou null. */
    sajdaDe(s: number, v: number): 'obligatoire' | 'recommandee' | null {
      return sajdas.get(cle(s, v)) ?? null;
    },
  };
}

/** Translittération sans ses balises de mise en forme, pour la recherche et les cartes à plat. */
export function translitSansBalises(texte: string): string {
  return texte.replace(/<\/?[a-z]+>/gi, '');
}

export type SegmentTranslit = { texte: string; style: 'normal' | 'long' | 'muet' };

/**
 * Translittération de Tanzil, reproduite telle quelle, découpée pour l'affichage : `<u>` marque une voyelle
 * longue ou une lettre emphatique (soulignée), `<b>` une lettre écrite mais non prononcée (atténuée).
 */
export function segmentsTranslit(texte: string): SegmentTranslit[] {
  const segments: SegmentTranslit[] = [];
  const balise = /<(u|b)>(.*?)<\/\1>/gi;
  let fin = 0;
  for (const m of texte.matchAll(balise)) {
    if (m.index > fin) segments.push({ texte: texte.slice(fin, m.index), style: 'normal' });
    segments.push({ texte: m[2] ?? '', style: m[1]?.toLowerCase() === 'u' ? 'long' : 'muet' });
    fin = m.index + m[0].length;
  }
  if (fin < texte.length) segments.push({ texte: texte.slice(fin), style: 'normal' });
  return segments.filter((x) => x.texte !== '');
}
