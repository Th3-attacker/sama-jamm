import assert from 'node:assert/strict';
import { test } from 'node:test';

import { borneTaille, limiterTaille, TAILLE_MAX, TAILLE_MIN } from './tailleMigration.ts';

test('les échelons dans la plage sont gardés', () => {
  for (let i = TAILLE_MIN; i <= TAILLE_MAX; i++) assert.equal(borneTaille(i), i);
});

test('un échelon hors plage est ramené au bord le plus proche', () => {
  assert.equal(borneTaille(0), 1);
  assert.equal(borneTaille(-3), 1);
  assert.equal(borneTaille(5), 4);
  assert.equal(borneTaille(6), 4);
  assert.equal(borneTaille(99), 4);
});

test('une valeur arrondie ou illisible ne fait pas planter', () => {
  assert.equal(borneTaille(2.6), 3);
  assert.equal(borneTaille(undefined), 1);
  assert.equal(borneTaille(null), 1);
  assert.equal(borneTaille('4'), 1);
  assert.equal(borneTaille(Number.NaN), 1);
  assert.equal(borneTaille(Infinity), 1);
});

test('la migration ne touche que la taille, et seulement si elle est enregistrée', () => {
  const etat: Record<string, unknown> = { tailleLecture: 6, haptique: true };
  limiterTaille(etat);
  assert.deepEqual(etat, { tailleLecture: 4, haptique: true });
  const sans: Record<string, unknown> = { haptique: false };
  limiterTaille(sans);
  assert.deepEqual(sans, { haptique: false });
});
