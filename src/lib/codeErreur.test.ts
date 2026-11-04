/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { codeErreur } from './codeErreur.ts';

const DATE = new Date(2026, 9, 29, 14, 12);

test('code support : préfixe, empreinte stable de 4 caractères, date et heure', () => {
  const code = codeErreur(new TypeError('x is undefined'), DATE);
  assert.match(code, /^ERR-[0-9A-F]{4} · 29\/10 14:12$/);
  assert.equal(codeErreur(new TypeError('x is undefined'), DATE), code);
  assert.notEqual(codeErreur(new RangeError('x is undefined'), DATE), code);
  assert.match(codeErreur('texte', DATE, 'AUD'), /^AUD-[0-9A-F]{4} · /);
});

test('code support : le message n’apparaît jamais', () => {
  assert.ok(!codeErreur(new Error('Awa 77 123 45 67'), DATE).includes('Awa'));
});
