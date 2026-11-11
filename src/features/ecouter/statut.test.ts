/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { erreurDuStatut, indexDuStatut } from './statut.ts';

test('erreur du statut : message Android, texte, ou rien', () => {
  assert.equal(erreurDuStatut({ playing: false, error: { message: 'Source error', code: 2004 } }), 'Source error');
  assert.equal(erreurDuStatut({ error: 'Délai' }), 'Délai');
  assert.equal(erreurDuStatut({ error: { code: 2001 } }), 'Erreur de lecture');
  assert.equal(erreurDuStatut({ error: null }), null);
  assert.equal(erreurDuStatut({ playing: true }), null);
  assert.equal(erreurDuStatut(null), null);
  assert.equal(erreurDuStatut('error'), null);
});

test('index du statut : entier positif, sinon la valeur par défaut', () => {
  assert.equal(indexDuStatut({ currentIndex: 4 }, 0), 4);
  assert.equal(indexDuStatut({ currentIndex: -1 }, 2), 2);
  assert.equal(indexDuStatut({ currentIndex: 1.5 }, 2), 2);
  assert.equal(indexDuStatut({}, 3), 3);
});
