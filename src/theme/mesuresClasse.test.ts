/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mesuresClasse } from './mesuresClasse.ts';

test('marges 24 / 32 / 48 selon la classe', () => {
  assert.equal(mesuresClasse('compacte').marge, 24);
  assert.equal(mesuresClasse('moyenne').marge, 32);
  assert.equal(mesuresClasse('etendue').marge, 48);
  assert.equal(mesuresClasse('tresGrande').marge, 48);
});

test('volet liste de 360 et deux colonnes seulement en classe étendue ou plus', () => {
  assert.deepEqual([mesuresClasse('moyenne').panneauListe, mesuresClasse('moyenne').colonnes], [0, 1]);
  assert.deepEqual([mesuresClasse('etendue').panneauListe, mesuresClasse('etendue').colonnes], [360, 2]);
  assert.equal(mesuresClasse('compacte').colonneLecture, 760);
});
