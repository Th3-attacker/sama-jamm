import assert from 'node:assert/strict';
import { test } from 'node:test';

import { versChiffresLatins } from './chiffres.ts';
import { MRU, versMinimes, XOF } from './montant.ts';

test('chiffres arabes orientaux et persans vers 0-9', () => {
  assert.equal(versChiffresLatins('٠١٢٣٤٥٦٧٨٩'), '0123456789');
  assert.equal(versChiffresLatins('۰۱۲۳۴۵۶۷۸۹'), '0123456789');
  assert.equal(versChiffresLatins('abc'), 'abc');
});

test('virgule arabe en point, séparateur de milliers arabe retiré', () => {
  assert.equal(versChiffresLatins('١٢٫٥٠'), '12.50');
  assert.equal(versChiffresLatins('١٬٢٣٤'), '1234');
});

test('saisie d’un montant au clavier arabe', () => {
  assert.equal(versMinimes('٢٥٠٠', XOF), 2500);
  assert.equal(versMinimes('١٢٫٥٠', XOF), null); // pas de décimale en F CFA
  assert.equal(versMinimes('١٢٫٥', MRU), versMinimes('12.5', MRU));
  assert.equal(versMinimes('١٬٢٣٤', XOF), 1234);
});

test('saisie : lettres et signes restent refusés', () => {
  assert.equal(versMinimes('abc', XOF), null);
  assert.equal(versMinimes('-٥', XOF), null);
  assert.equal(versMinimes('', XOF), null);
});
