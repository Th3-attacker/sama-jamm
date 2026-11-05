// Chiffres arabes orientaux pour les numéros de verset (١٢٣).
const ARABES = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function enChiffresArabes(n: number): string {
  return String(n).replace(/\d/g, (c) => ARABES[Number(c)] ?? c);
}
