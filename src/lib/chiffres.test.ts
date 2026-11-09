/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  chiffresAffiches,
  definirChiffresIndiens,
  enChiffresArabes,
  versChiffresIndiens,
} from './chiffres.ts';

test('chiffres arabes orientaux', () => {
  assert.equal(enChiffresArabes(7), '٧');
  assert.equal(enChiffresArabes(286), '٢٨٦');
  assert.equal(enChiffresArabes(10), '١٠');
});

test('texte converti : chiffres, heures et décimale', () => {
  assert.equal(versChiffresIndiens('16:35'), '١٦:٣٥');
  assert.equal(versChiffresIndiens('12,50 UM'), '١٢٫٥٠ UM');
  assert.equal(versChiffresIndiens('1, 2'), '١, ٢');
  assert.equal(versChiffresIndiens('sans chiffre'), 'sans chiffre');
});

test('affichage : converti seulement quand l’interrupteur est actif', () => {
  definirChiffresIndiens(false);
  assert.equal(chiffresAffiches('42 min'), '42 min');
  definirChiffresIndiens(true);
  assert.equal(chiffresAffiches('42 min'), '٤٢ min');
  definirChiffresIndiens(false);
});
