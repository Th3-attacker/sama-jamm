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
