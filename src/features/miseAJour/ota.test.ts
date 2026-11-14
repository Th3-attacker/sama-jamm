/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { doitVerifier, INTERVALLE_VERIFICATION_MS } from './ota.ts';

test('première vérification toujours permise', () => {
  assert.equal(doitVerifier(null, 1000), true);
});

test('pas de nouvelle vérification avant l’intervalle', () => {
  assert.equal(doitVerifier(0, INTERVALLE_VERIFICATION_MS - 1), false);
  assert.equal(doitVerifier(0, INTERVALLE_VERIFICATION_MS), true);
});

test('horloge reculée : on vérifie plutôt que de rester bloqué', () => {
  assert.equal(doitVerifier(5000, 1000), true);
});
