// Texte d'un verset à copier ou à partager : l'arabe seul, la translittération seulement si elle est activée, la
// référence et le lien. Jamais de traduction du Coran. Fonctions pures.

/** Lien public vers le verset (quran.com), ajouté au texte copié. */
export const lienVerset = (sourate: number, verset: number) => `https://quran.com/${sourate}/${verset}`;

export type InvocationACopier = { texte: string; translit?: string; source: string };

/** Texte copié d'une invocation : arabe, translittération si demandée et disponible, source. Pas de lien externe. */
export function texteInvocationACopier(invocation: InvocationACopier, avecTranslit: boolean): string {
  const translit = avecTranslit && invocation.translit ? invocation.translit : null;
  return [invocation.texte, translit, invocation.source].filter(Boolean).join('\n\n');
}

export type VersetACopier = { sourate: number; nomSourate: string; n: number; texte: string; translit?: string };

/** Texte copié : arabe, translittération si demandée et disponible, « Sourate · 13:28 », lien. Le texte arabe n'est pas modifié. */
export function texteACopier(verset: VersetACopier, avecTranslit: boolean): string {
  const translit = avecTranslit && verset.translit ? verset.translit : null;
  const reference = `${verset.nomSourate} · ${verset.sourate}:${verset.n}`;
  return [verset.texte, translit, reference, lienVerset(verset.sourate, verset.n)].filter(Boolean).join('\n\n');
}
