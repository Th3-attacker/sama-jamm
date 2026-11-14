// Ouverture d'une sourate : sur quel verset la lecture se place. Règle pure.

/**
 * Verset sur lequel ouvrir la sourate : celui que la récitation en cours lit dans cette sourate, sinon `parDefaut`
 * (repère de lecture pour « Reprendre », rien pour ouvrir au début).
 */
export function versetDOuverture(
  sourate: number,
  ecoute: { sourate: number; verset: number } | null,
  parDefaut?: number,
): number | undefined {
  return ecoute !== null && ecoute.sourate === sourate ? ecoute.verset : parDefaut;
}
