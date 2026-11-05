/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { montantDon, referenceDon, validerDeclaration } from './declaration.ts';

test('montant : ouguiyas entières', () => {
  assert.equal(montantDon('200'), 200);
  assert.equal(montantDon('1 500'), 1500);
  assert.equal(montantDon('0'), null);
  assert.equal(montantDon('12,5'), null);
});

test('référence : lettres et chiffres, nettoyée', () => {
  assert.equal(referenceDon(' ab-12 34cd '), 'AB1234CD');
  assert.equal(referenceDon('12'), null);
  assert.equal(referenceDon('AB12#'), null);
});

test('déclaration : champs facultatifs nettoyés', () => {
  assert.deepEqual(
    validerDeclaration({ wallet: 'bankily', montant: '200', reference: 'tx1234', prenom: '  Awa ', message: '' }),
    { wallet: 'bankily', montant: 200, reference: 'TX1234', prenom: 'Awa', message: null },
  );
  assert.equal(
    validerDeclaration({ wallet: 'paypal', montant: '200', reference: 'TX1234', prenom: '', message: '' }),
    null,
  );
});
