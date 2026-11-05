/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { codePropre, emailPropre, prenomPropre } from './validation.ts';

test('e-mail : nettoyé, minuscules, refus des adresses incomplètes', () => {
  assert.equal(emailPropre('  Awa.Ndiaye@Exemple.SN '), 'awa.ndiaye@exemple.sn');
  assert.equal(emailPropre('awa@exemple'), null);
  assert.equal(emailPropre('awa exemple.sn'), null);
  assert.equal(emailPropre(''), null);
});

test('code : 6 chiffres, espaces ignorés', () => {
  assert.equal(codePropre('123 456'), '123456');
  assert.equal(codePropre('12345'), null);
  assert.equal(codePropre('12a456'), null);
});

test('prénom : facultatif, 40 caractères au plus', () => {
  assert.equal(prenomPropre('  Awa   Ndiaye '), 'Awa Ndiaye');
  assert.equal(prenomPropre('   '), null);
  assert.equal(prenomPropre('a'.repeat(41)), undefined);
});
