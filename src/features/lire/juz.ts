// Découpe du Coran en 30 juz : chaque juz est une suite de tronçons (sourate, versets de début à fin).
// Fonction pure : les débuts de juz et le nombre de versets par sourate sont fournis par l'appelant.

export type DebutJuz = { sourate: number; verset: number };
export type Troncon = { sourate: number; debut: number; fin: number };
export type Juz = { numero: number; troncons: Troncon[] };

const NOMBRE_DE_SOURATES = 114;

export function decouperJuz(
  debuts: readonly DebutJuz[],
  nombreDeVersets: (sourate: number) => number
): Juz[] {
  return debuts.map((debut, i) => {
    const suivant = debuts[i + 1] ?? { sourate: NOMBRE_DE_SOURATES + 1, verset: 1 };
    const troncons: Troncon[] = [];
    const derniere = Math.min(suivant.sourate, NOMBRE_DE_SOURATES);
    for (let s = debut.sourate; s <= derniere; s++) {
      const debutTroncon = s === debut.sourate ? debut.verset : 1;
      const finTroncon = s === suivant.sourate ? suivant.verset - 1 : nombreDeVersets(s);
      if (finTroncon >= debutTroncon) troncons.push({ sourate: s, debut: debutTroncon, fin: finTroncon });
    }
    return { numero: i + 1, troncons };
  });
}
