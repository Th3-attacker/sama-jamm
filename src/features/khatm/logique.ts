// Khatm collectif : règles pures (résumé des 30 juz, mon juz, lien d'invitation, code saisi à la main).

export type EtatPart = 'libre' | 'en_cours' | 'lu';
export type Part = { juz: number; user_id: string | null; etat: EtatPart };
export type VuePart = 'lu' | 'enCours' | 'leVotre' | 'libre';

export const NB_JUZ = 30;
const LONGUEUR_CODE_KHATM = 8;
const FORMAT_CODE = /^[A-Z2-9]{8}$/;

/** Ce que voit un membre pour un juz : le sien en cours, lu, en cours chez un autre, ou libre. */
export function vuePart(p: Part, moi: string | null): VuePart {
  if (p.etat === 'lu') return 'lu';
  if (p.etat === 'en_cours') return p.user_id !== null && p.user_id === moi ? 'leVotre' : 'enCours';
  return 'libre';
}

export type Resume = { lus: number; enCours: number; libres: number; monJuz: number | null; dontLeVotre: boolean };

/** « 17 juz lus sur 30 · 5 en cours, dont le vôtre · 8 libres », et le juz que je lis (le premier en cours). */
export function resumeKhatm(parts: readonly Part[], moi: string | null): Resume {
  let lus = 0;
  let enCours = 0;
  let monJuz: number | null = null;
  for (const p of parts) {
    if (p.etat === 'lu') lus += 1;
    else if (p.etat === 'en_cours') {
      enCours += 1;
      if (moi && p.user_id === moi && (monJuz === null || p.juz < monJuz)) monJuz = p.juz;
    }
  }
  return { lus, enCours, libres: NB_JUZ - lus - enCours, monJuz, dontLeVotre: monJuz !== null };
}

/** Lien ouvert par l'app (schéma samajamm) : samajamm://khatm/ABCD2345. */
export const lienInvitation = (code: string) => `samajamm://khatm/${code}`;

/** Code d'un lien collé ou saisi à la main (espaces et minuscules acceptés), ou null. */
export function lireCode(saisie: string): string | null {
  const brut = saisie.trim().split('/').pop() ?? '';
  const code = brut.replace(/[\s-]/g, '').toUpperCase();
  return FORMAT_CODE.test(code) ? code : null;
}

/**
 * Saisie du code d'invitation : majuscules, caractères permis seulement (A à Z et 2 à 9), 8 au plus.
 * Un lien collé (`samajamm://khatm/CODE`) donne son code ; le reste est retiré à la frappe et au collage.
 */
export function saisieCodeKhatm(saisie: string): string {
  const brut = saisie.includes('/') ? (saisie.trim().split('/').pop() ?? '') : saisie;
  return brut.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, LONGUEUR_CODE_KHATM);
}
