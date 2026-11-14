/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { versetDOuverture } from './ouverture.ts';

test('ouverture : sur le verset récité quand la récitation est dans cette sourate', () => {
  const ecoute = { sourate: 2, verset: 13 };
  // Ligne de la sourate, puis « Reprendre » dont le repère de lecture est au verset 16.
  assert.equal(versetDOuverture(2, ecoute), 13);
  assert.equal(versetDOuverture(2, ecoute, 16), 13);
});

test('ouverture : comportement habituel sans récitation dans cette sourate', () => {
  // Récitation dans une autre sourate, ou aucune écoute.
  assert.equal(versetDOuverture(3, { sourate: 2, verset: 13 }), undefined);
  assert.equal(versetDOuverture(3, { sourate: 2, verset: 13 }, 40), 40);
  assert.equal(versetDOuverture(2, null), undefined);
  assert.equal(versetDOuverture(2, null, 16), 16);
});
