/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { colonnesGrille } from './colonnes.ts';

test('grille : 2 colonnes en compacte, 4 dès la moyenne', () => {
  assert.equal(colonnesGrille('compacte', 1), 2);
  assert.equal(colonnesGrille('moyenne', 1), 4);
  assert.equal(colonnesGrille('etendue', 1), 4);
});

test('grille : texte agrandi, une colonne en compacte et deux ailleurs (limite 1,5)', () => {
  assert.equal(colonnesGrille('compacte', 1.49), 2);
  assert.equal(colonnesGrille('compacte', 1.5), 1);
  assert.equal(colonnesGrille('compacte', 2), 1);
  assert.equal(colonnesGrille('moyenne', 2), 2);
});
