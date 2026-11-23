import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ongletPourMode } from './ongletMode.ts';

test('Récitateurs n’existe pas en mode Lire : retour au Coran', () => {
  assert.equal(ongletPourMode('lire', 'recitateurs'), 'coran');
});

test('Écouter s’ouvre toujours sur les récitants, d’où qu’on vienne', () => {
  assert.equal(ongletPourMode('ecouter', 'coran'), 'recitateurs');
  assert.equal(ongletPourMode('ecouter', 'invocations'), 'recitateurs');
  assert.equal(ongletPourMode('ecouter', 'recitateurs'), 'recitateurs');
});

test('Lire garde le Coran et les Invocations', () => {
  assert.equal(ongletPourMode('lire', 'coran'), 'coran');
  assert.equal(ongletPourMode('lire', 'invocations'), 'invocations');
});
