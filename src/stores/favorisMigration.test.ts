/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { basculerCle, migrerFavoris } from './favorisMigration.ts';

test('favoris v1 : les versets sont gardés, les invocations démarrent vides', () => {
  assert.deepEqual(migrerFavoris({ versets: ['18:46', '2:255'] }), { versets: ['18:46', '2:255'], invocations: [] });
});

test('favoris v2 : les deux listes sont gardées', () => {
  assert.deepEqual(migrerFavoris({ versets: ['1:1'], invocations: ['12'] }), { versets: ['1:1'], invocations: ['12'] });
});

test('favoris illisibles : listes vides, entrées invalides ignorées', () => {
  assert.deepEqual(migrerFavoris(null), { versets: [], invocations: [] });
  assert.deepEqual(migrerFavoris({ versets: 'x', invocations: ['3', 4, null] }), { versets: [], invocations: ['3'] });
});

test('bascule : ajoute en tête puis retire', () => {
  const a = basculerCle(['5'], '7');
  assert.deepEqual(a, { liste: ['7', '5'], present: true });
  assert.deepEqual(basculerCle(a.liste, '7'), { liste: ['5'], present: false });
});
