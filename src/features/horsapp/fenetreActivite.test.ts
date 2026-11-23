/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { activiteAttendue, AVANT_MS } from './fenetreActivite.ts';

const PRIERE = 1_000_000_000_000;

test('activité : visible dans les 30 minutes avant la prière seulement', () => {
  assert.equal(activiteAttendue(PRIERE, PRIERE - AVANT_MS, true), true);
  assert.equal(activiteAttendue(PRIERE, PRIERE - 60_000, true), true);
  assert.equal(activiteAttendue(PRIERE, PRIERE - AVANT_MS - 1, true), false);
});

test('activité : terminée à l’heure de la prière, et jamais si désactivée', () => {
  assert.equal(activiteAttendue(PRIERE, PRIERE, true), false);
  assert.equal(activiteAttendue(PRIERE, PRIERE + 1000, true), false);
  assert.equal(activiteAttendue(PRIERE, PRIERE - 60_000, false), false);
  assert.equal(activiteAttendue(Number.NaN, PRIERE, true), false);
});
