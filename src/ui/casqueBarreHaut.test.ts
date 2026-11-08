/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { montrerCasque } from './casqueBarreHaut.ts';

test('casque : seulement écoute en cours, mini-lecteur rangé, hors du lecteur', () => {
  assert.equal(montrerCasque({ enEcoute: true, miniRange: true, chemin: '/priere' }), true);
  assert.equal(montrerCasque({ enEcoute: false, miniRange: true, chemin: '/priere' }), false);
  assert.equal(montrerCasque({ enEcoute: true, miniRange: false, chemin: '/priere' }), false);
  assert.equal(montrerCasque({ enEcoute: true, miniRange: true, chemin: '/lecteur' }), false);
});
