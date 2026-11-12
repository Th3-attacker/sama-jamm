/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ChiffrementIndisponible, verifierChiffrement } from './chiffrement.ts';

test('SQLCipher présent : la version répond, rien ne se passe', () => {
  assert.doesNotThrow(() => verifierChiffrement({ cipher_version: '4.6.1 community' }));
});

test('SQLCipher absent : pas de ligne, version vide ou autre type → refus', () => {
  for (const reponse of [null, undefined, {}, { cipher_version: '' }, { cipher_version: '  ' }, { cipher_version: 4 }]) {
    assert.throws(() => verifierChiffrement(reponse), ChiffrementIndisponible);
  }
});
