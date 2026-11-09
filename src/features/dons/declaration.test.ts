/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { referenceInterne, montantDon, referenceDon, validerDeclaration, walletConnu } from './declaration.ts';

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
    validerDeclaration({ wallet: 'bankily', montant: '200', message: '  merci  ' }, 'tx1234'),
    { wallet: 'bankily', montant: 200, reference: 'TX1234', prenom: null, message: 'merci' },
  );
  assert.equal(
    validerDeclaration({ wallet: 'paypal', montant: '200', message: '' }),
    null,
  );
});

test('wallet passé par Soutenir : seulement un wallet connu', () => {
  assert.equal(walletConnu('masrvi'), 'masrvi');
  assert.equal(walletConnu(''), null);
  assert.equal(walletConnu('wave'), null);
});

test('référence interne : valable pour la base et différente à chaque appel', () => {
  const a = referenceInterne(1_700_000_000_000, 0.1);
  const b = referenceInterne(1_700_000_000_000, 0.2);
  assert.notEqual(a, b);
  assert.notEqual(referenceDon(a), null);
});
