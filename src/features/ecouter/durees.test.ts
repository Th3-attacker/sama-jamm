import assert from 'node:assert/strict';
import test from 'node:test';

import { tempsSourate } from './durees.ts';

// Deux sourates : 3 versets puis 2 versets. Durées en dixièmes de seconde.
const VERSETS = [3, 2];
const D = [100, 200, 300, 50, 60];

test('début de sourate : rien d’écoulé, total de la sourate', () => {
  assert.deepEqual(tempsSourate(D, VERSETS, 1, 1, 0), { ecoule: 0, total: 60 });
});

test('milieu de sourate : versets précédents plus le temps dans le verset', () => {
  assert.deepEqual(tempsSourate(D, VERSETS, 1, 3, 5), { ecoule: 35, total: 60 });
});

test('deuxième sourate : le décalage global est respecté', () => {
  assert.deepEqual(tempsSourate(D, VERSETS, 2, 2, 0), { ecoule: 5, total: 11 });
});

test('le temps dans le verset ne dépasse pas la durée du verset', () => {
  assert.deepEqual(tempsSourate(D, VERSETS, 2, 1, 99), { ecoule: 5, total: 11 });
});

test('durées absentes, trop courtes ou verset hors limites : null', () => {
  assert.equal(tempsSourate(undefined, VERSETS, 1, 1, 0), null);
  assert.equal(tempsSourate([100, 200], VERSETS, 1, 1, 0), null);
  assert.equal(tempsSourate(D, VERSETS, 1, 4, 0), null);
  assert.equal(tempsSourate(D, VERSETS, 3, 1, 0), null);
});
