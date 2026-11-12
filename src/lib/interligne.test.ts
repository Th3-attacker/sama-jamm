/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { interligneAdapte } from './interligne.ts';

test('latin : l’interligne du design system est gardé', () => {
  assert.equal(interligneAdapte(12, 16, false), 16);
});

test('arabe : jamais plus serré que 1,6 × la taille', () => {
  assert.equal(interligneAdapte(12, 16, true), 19);
  assert.equal(interligneAdapte(14, 20, true), 22);
});

test('arabe : un interligne déjà large est gardé', () => {
  assert.equal(interligneAdapte(22, 40, true), 40);
});
