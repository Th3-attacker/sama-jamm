// Chiffres arabes orientaux pour les numéros de verset (١٢٣).
const ARABES = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function enChiffresArabes(n: number): string {
  return String(n).replace(/\d/g, (c) => ARABES[Number(c)] ?? c);
}

/** Tout chiffre d'un texte en chiffres arabes orientaux ; la virgule décimale entre deux chiffres devient « ٫ ». */
export function versChiffresIndiens(texte: string): string {
  return texte.replace(/\d/g, (c) => ARABES[Number(c)] ?? c).replace(/([٠-٩]),([٠-٩])/g, '$1٫$2');
}

// Interrupteur de l'affichage : actif seulement en arabe avec le réglage « Chiffres arabes ». Il ne touche jamais aux
// données, seulement au texte montré (heures, durées, dates, montants, textes traduits).
let actif = false;
export const definirChiffresIndiens = (valeur: boolean): void => {
  actif = valeur;
};
export const chiffresIndiensActifs = (): boolean => actif;

/** Le texte tel qu'on l'affiche : converti si l'affichage en chiffres indiens est actif. */
export const chiffresAffiches = (texte: string): string => (actif ? versChiffresIndiens(texte) : texte);
