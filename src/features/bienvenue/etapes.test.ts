import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decisionPermission, etapePosition, etapeRappels } from './etapes.ts';

test('decisionPermission : accordée, refusée pour de bon, à demander', () => {
  assert.equal(decisionPermission({ granted: true, canAskAgain: true }), 'accordee');
  assert.equal(decisionPermission({ granted: true, canAskAgain: false }), 'accordee');
  assert.equal(decisionPermission({ granted: false, canAskAgain: false }), 'refusee');
  assert.equal(decisionPermission({ granted: false, canAskAgain: true }), 'a-demander');
});

test('étape position : déjà accordée, refusée pour de bon, premier passage', () => {
  assert.equal(etapePosition('accordee'), 'utiliser');
  assert.equal(etapePosition('refusee'), 'ville');
  assert.equal(etapePosition('a-demander'), 'expliquer');
});

test('étape rappels : aucun rappel actif, déjà accordée, refusée pour de bon, premier passage', () => {
  assert.equal(etapeRappels(false, 'a-demander'), 'terminer');
  assert.equal(etapeRappels(false, 'refusee'), 'terminer');
  assert.equal(etapeRappels(true, 'accordee'), 'terminer');
  assert.equal(etapeRappels(true, 'refusee'), 'desactiver-puis-terminer');
  assert.equal(etapeRappels(true, 'a-demander'), 'expliquer');
});
