// Consigne de rotation sans boussole : sens et part de tour depuis le nord, pour un angle de 0 à 360°. Règle pure.

export type Sens = 'droite' | 'gauche';
export type PartDeTour = 'unPeu' | 'moinsQuart' | 'quart' | 'entreQuartDemi' | 'demi';

export function rotationDepuisNord(degres: number): { sens: Sens; angle: number; part: PartDeTour } {
  const d = ((Math.round(degres) % 360) + 360) % 360;
  const sens: Sens = d <= 180 ? 'droite' : 'gauche';
  const angle = sens === 'droite' ? d : 360 - d;
  const part: PartDeTour =
    angle < 35 ? 'unPeu' : angle < 80 ? 'moinsQuart' : angle <= 100 ? 'quart' : angle < 170 ? 'entreQuartDemi' : 'demi';
  return { sens, angle, part };
}
