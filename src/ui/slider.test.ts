import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cransDe } from './slider.ts';

test('vitesses de lecture : 0,5 à 1,5 par pas de 0,25', () => {
  assert.deepEqual(cransDe(0.5, 1.5, 0.25), [0.5, 0.75, 1, 1.25, 1.5]);
});

test('pas décimal sans erreur d’arrondi', () => {
  assert.deepEqual(cransDe(0, 1, 0.1), [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
});

test('bornes ou pas invalides : un seul cran', () => {
  assert.deepEqual(cransDe(2, 1, 1), [2]);
  assert.deepEqual(cransDe(0, 10, 0), [0]);
});
