// Chiffres arabes orientaux pour les numéros de verset (١٢٣).
const ARABES = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function enChiffresArabes(n: number): string {
  return String(n).replace(/\d/g, (c) => ARABES[Number(c)] ?? c);
}

/** Tout chiffre d'un texte en chiffres arabes orientaux ; la virgule décimale entre deux chiffres devient « ٫ ». */
export function versChiffresIndiens(texte: string): string {
  return texte.replace(/\d/g, (c) => ARABES[Number(c)] ?? c).replace(/([٠-٩]),([٠-٩])/g, '$1٫$2');
}

/**
 * Saisie ou recherche : chiffres arabes orientaux (٠-٩) et persans (۰-۹) vers 0-9, virgule arabe « ٫ » vers « . » et
 * séparateur de milliers « ٬ » retiré. Les données restent en chiffres latins ; seul l'affichage est converti.
 */
export function versChiffresLatins(texte: string): string {
  return texte
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\u066B/g, '.')
    .replace(/\u066C/g, '');
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
