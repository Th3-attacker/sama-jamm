/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { migrerFavoris } from './favorisMigration.ts';

test('favoris : les versets sont gardés', () => {
  assert.deepEqual(migrerFavoris({ versets: ['18:46', '2:255'] }), { versets: ['18:46', '2:255'] });
});

test('favoris : un ancien champ invocations est ignoré', () => {
  assert.deepEqual(migrerFavoris({ versets: ['1:1'], invocations: ['12'] }), { versets: ['1:1'] });
});

test('favoris illisibles : liste vide, entrées invalides ignorées', () => {
  assert.deepEqual(migrerFavoris(null), { versets: [] });
  assert.deepEqual(migrerFavoris({ versets: ['3', 4, null] }), { versets: ['3'] });
});
