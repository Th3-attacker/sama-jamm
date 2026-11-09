// « La citadelle du musulman » (Hisn al-Muslim) : 132 chapitres d'invocations, texte arabe seul.
// Origine, licence déclarée et titres français : voir `meta` dans data/invocations/hisn.json.

export type ItemHisn = { id: number; texte: string; repetitions: number };
export type ChapitreHisn = { id: number; titreAr: string; titreFr: string; items: ItemHisn[] };

let enMemoire: readonly ChapitreHisn[] | undefined;

/** Lus au premier besoin : le fichier pèse environ 125 Ko. */
export function chapitresHisn(): readonly ChapitreHisn[] {
  enMemoire ??= require('@/data/invocations/hisn.json').chapitres;
  return enMemoire ?? [];
}

export function chapitreHisn(id: number): ChapitreHisn | undefined {
  return chapitresHisn().find((c) => c.id === id);
}

/** Titre dans la langue de l'interface : arabe en interface arabe, français sinon. */
export function titreDe(chapitre: Pick<ChapitreHisn, 'titreAr' | 'titreFr'>, langue: string): string {
  return langue === 'ar' ? chapitre.titreAr : chapitre.titreFr;
}

/** Les premiers mots d'une invocation, sans parenthèses ni crochets : titre court du compteur. */
export function debutDe(texte: string, mots = 3): string {
  return texte
    .replace(/[()[\]﴿﴾]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, mots)
    .join(' ');
}

/**
 * Moments de la journée construits avec des chapitres de la Citadelle (numéros du fichier hisn.json).
 * Regroupement à faire relire par le référent religieux.
 */
export const MOMENTS_HISN = {
  voyage: [95, 96, 99, 100, 101, 102, 103, 104, 105],
  repas: [69, 70, 72, 74],
  apresPriere: [27],
} as const;
export type MomentHisn = keyof typeof MOMENTS_HISN;

export function estMomentHisn(valeur: string | undefined): valeur is MomentHisn {
  return valeur !== undefined && Object.keys(MOMENTS_HISN).includes(valeur);
}

/** Invocations d'un moment, dans l'ordre des chapitres ; les numéros sont refaits car ils repartent de 1 par chapitre. */
export function itemsDuMoment(moment: MomentHisn): ItemHisn[] {
  return MOMENTS_HISN[moment]
    .flatMap((id) => chapitreHisn(id)?.items ?? [])
    .map((item, i) => ({ ...item, id: i + 1 }));
}
