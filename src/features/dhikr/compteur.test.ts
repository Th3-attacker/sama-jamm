import assert from 'node:assert/strict';
import { test } from 'node:test';

import { prochainCompte } from './compteur.ts';

test('avec un objectif : monte jusqu’à l’objectif', () => {
  assert.equal(prochainCompte(0, 33), 1);
  assert.equal(prochainCompte(32, 33), 33);
});

test('objectif atteint : le grain suivant repart à 1', () => {
  assert.equal(prochainCompte(33, 33), 1);
  assert.equal(prochainCompte(99, 99), 1);
});

test('compte déjà au-delà de l’objectif : repart à 1', () => {
  assert.equal(prochainCompte(37, 33), 1);
});

test('libre (sans objectif) : monte sans fin', () => {
  assert.equal(prochainCompte(33, null), 34);
  assert.equal(prochainCompte(1000, null), 1001);
});
