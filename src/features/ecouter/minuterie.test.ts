/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatReste, minuterieDans, rejouerVerset, resteMinuterie } from './minuterie.ts';

test('minuterie : fin dans N minutes, reste jamais négatif', () => {
  const m = minuterieDans(15, 1000);
  assert.deepEqual(m, { type: 'duree', finA: 1000 + 15 * 60_000 });
  assert.equal(resteMinuterie(m, 1000 + 60_000), 14 * 60_000);
  assert.equal(resteMinuterie(m, 10 ** 9), 0);
  assert.equal(resteMinuterie({ type: 'finSourate' }, 0), null);
});

test('répétition du verset : 1, 3 fois, sans fin', () => {
  assert.equal(rejouerVerset(1, 1), false);
  assert.equal(rejouerVerset(3, 1), true);
  assert.equal(rejouerVerset(3, 3), false);
  assert.equal(rejouerVerset(0, 99), true);
});

test('temps restant affiché', () => {
  assert.equal(formatReste(725_000), '12:05');
  assert.equal(formatReste(0), '0:00');
  assert.equal(formatReste(59_100), '1:00');
});
