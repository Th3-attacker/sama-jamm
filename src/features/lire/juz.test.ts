import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decouperJuz } from './juz.ts';

// Sourates fictives de 3, 4 et 5 versets, et 114 au total pour le test (les suivantes ont 1 verset).
const versets = (s: number) => (s <= 3 ? [3, 4, 5][s - 1] ?? 0 : 1);

test('un juz qui commence au début d’une sourate prend la sourate entière', () => {
  const juz = decouperJuz([{ sourate: 1, verset: 1 }, { sourate: 2, verset: 1 }], versets);
  assert.deepEqual(juz[0]?.troncons[0], { sourate: 1, debut: 1, fin: 3 });
});

test('un juz qui commence au milieu d’une sourate la coupe en deux tronçons', () => {
  const juz = decouperJuz([{ sourate: 1, verset: 1 }, { sourate: 2, verset: 3 }, { sourate: 3, verset: 1 }], versets);
  assert.deepEqual(juz[0]?.troncons, [
    { sourate: 1, debut: 1, fin: 3 },
    { sourate: 2, debut: 1, fin: 2 },
  ]);
  assert.deepEqual(juz[1]?.troncons, [{ sourate: 2, debut: 3, fin: 4 }]);
  assert.deepEqual(juz[2]?.troncons[0], { sourate: 3, debut: 1, fin: 5 });
});

test('numéros de juz dans l’ordre, et chaque verset est couvert une seule fois', () => {
  const debuts = [{ sourate: 1, verset: 1 }, { sourate: 2, verset: 2 }, { sourate: 3, verset: 4 }];
  const juz = decouperJuz(debuts, versets);
  assert.deepEqual(juz.map((j) => j.numero), [1, 2, 3]);
  const total = juz.flatMap((j) => j.troncons).reduce((somme, t) => somme + (t.fin - t.debut + 1), 0);
  // Le dernier juz va jusqu'à la fin du Coran : toutes les sourates (114 au total) sont comptées.
  let attendu = 0;
  for (let s = 1; s <= 114; s++) attendu += versets(s);
  assert.equal(total, attendu);
});
