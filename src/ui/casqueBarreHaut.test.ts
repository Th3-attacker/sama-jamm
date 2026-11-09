/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { montrerCasque } from './casqueBarreHaut.ts';

test('casque : seulement écoute en cours, mini-lecteur rangé, hors du lecteur', () => {
  assert.equal(montrerCasque({ enEcoute: true, miniRange: true, chemin: '/priere', casqueDejaPresent: false }), true);
  assert.equal(montrerCasque({ enEcoute: false, miniRange: true, chemin: '/priere', casqueDejaPresent: false }), false);
  assert.equal(montrerCasque({ enEcoute: true, miniRange: false, chemin: '/priere', casqueDejaPresent: false }), false);
  assert.equal(montrerCasque({ enEcoute: true, miniRange: true, chemin: '/lecteur', casqueDejaPresent: false }), false);
});

test('casque : absent quand la barre a déjà un casque dans ses actions', () => {
  assert.equal(montrerCasque({ enEcoute: true, miniRange: true, chemin: '/lire', casqueDejaPresent: true }), false);
});
