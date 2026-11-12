// Découpage du Coran en juz et repère « Juz N » par sourate, calculés une fois à partir des repères et des sourates.
import { reperes, sourate } from './coran';
import { decouperJuz, type Juz } from './juz';

export const JUZ: readonly Juz[] = decouperJuz(
  Array.from({ length: 30 }, (_, i) => reperes().debutJuz(i + 1)).flatMap((d) => (d ? [d] : [])),
  (s) => sourate(s)?.versets ?? 0,
);

/** Sourate où commence un juz -> numéro du premier juz qui y commence. */
export const juzParSourate: ReadonlyMap<number, number> = (() => {
  const m = new Map<number, number>();
  for (const j of JUZ) {
    const premier = j.troncons[0];
    if (premier && !m.has(premier.sourate)) m.set(premier.sourate, j.numero);
  }
  return m;
})();
