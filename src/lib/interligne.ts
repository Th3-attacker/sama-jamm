/** Rapport interligne / taille que demandent Amiri et Noto Sans Arabic pour ne pas remonter ni déborder de la ligne. */
const RAPPORT_ARABE = 1.6;

/**
 * Interligne à utiliser pour un texte de `taille` : celui du design system en latin, jamais plus serré que
 * 1,6 × la taille en interface arabe (les polices arabes sont plus hautes que Source Sans).
 */
export function interligneAdapte(taille: number, interligne: number, arabe: boolean): number {
  return arabe ? Math.max(interligne, Math.round(taille * RAPPORT_ARABE)) : interligne;
}
