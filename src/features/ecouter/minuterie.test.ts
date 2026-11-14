/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ecoutesALArrivee, formatReste, minuterieDans, rejouerVerset, resteMinuterie } from './minuterie.ts';

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

test('répétition du verset : « 3 écoutes » lit le verset trois fois puis passe au suivant', () => {
  // Même déroulé que le lecteur : à chaque fin de verset, rejouer ou passer ; à chaque arrivée, tenir le compte.
  for (const repetition of [1, 3, 5] as const) {
    let ecoutes = 1;
    let lectures = 1;
    while (rejouerVerset(repetition, ecoutes) && lectures < 50) {
      ecoutes += 1;
      ecoutes = ecoutesALArrivee(ecoutes, true);
      lectures += 1;
    }
    assert.equal(lectures, repetition);
    // Arrivée sur le verset suivant : le compte repart.
    assert.equal(ecoutesALArrivee(ecoutes, false), 1);
  }
});

test('temps restant affiché', () => {
  assert.equal(formatReste(725_000), '12:05');
  assert.equal(formatReste(0), '0:00');
  assert.equal(formatReste(59_100), '1:00');
});
