import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ongletPourMode } from './ongletMode.ts';

test('Récitateurs n’existe pas en mode Lire : retour au Coran', () => {
  assert.equal(ongletPourMode('lire', 'recitateurs'), 'coran');
});

test('Invocations n’existe pas en mode Écouter : retour au Coran', () => {
  assert.equal(ongletPourMode('ecouter', 'invocations'), 'coran');
});

test('un onglet présent dans les deux modes ou propre au mode est gardé', () => {
  assert.equal(ongletPourMode('lire', 'coran'), 'coran');
  assert.equal(ongletPourMode('lire', 'invocations'), 'invocations');
  assert.equal(ongletPourMode('ecouter', 'recitateurs'), 'recitateurs');
});
