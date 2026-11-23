/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { classerErreurDedicace, MESSAGE_TROP_DE_NOMS } from './erreurs.ts';

test('limite de noms atteinte', () => {
  assert.equal(classerErreurDedicace({ code: 'P0001', message: MESSAGE_TROP_DE_NOMS }), 'trop');
});

test('nom ou formule refusés par le serveur', () => {
  assert.equal(classerErreurDedicace({ code: 'P0001', message: 'nom invalide' }), 'invalide');
  assert.equal(classerErreurDedicace({ code: 'P0001', message: 'formule invalide' }), 'invalide');
});

test('pas de réseau', () => {
  assert.equal(classerErreurDedicace({ message: 'Network request failed' }), 'hors-ligne');
  assert.equal(classerErreurDedicace({ message: 'TypeError: Failed to fetch' }), 'hors-ligne');
});

test('les autres erreurs restent une erreur générique, sans détail', () => {
  assert.equal(classerErreurDedicace({ code: 'P0001', message: 'non connecté' }), 'erreur');
  assert.equal(classerErreurDedicace({ code: '42501', message: MESSAGE_TROP_DE_NOMS }), 'erreur');
  assert.equal(classerErreurDedicace(null), 'erreur');
  assert.equal(classerErreurDedicace('boum'), 'erreur');
});
