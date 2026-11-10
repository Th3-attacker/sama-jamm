/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estApercu, estKhatm, estLignePart, estMembre, estPart, lireListe } from './lignes.ts';

const khatm = { id: 'k1', nom: 'Ramadan', intention: null, echeance: null, createur: 'u1', code: 'ABCD2345' };

test('khatm valide accepté, champ manquant ou mauvais type refusé', () => {
  assert.ok(estKhatm(khatm));
  assert.ok(estKhatm({ ...khatm, createur: null }));
  assert.equal(estKhatm({ ...khatm, nom: 3 }), false);
  assert.equal(estKhatm({ ...khatm, code: undefined }), false);
  assert.equal(estKhatm(null), false);
});

test('part : juz numérique et état connu seulement', () => {
  assert.ok(estPart({ juz: 1, user_id: null, etat: 'libre' }));
  assert.equal(estPart({ juz: '1', user_id: null, etat: 'libre' }), false);
  assert.equal(estPart({ juz: 1, user_id: null, etat: 'perdu' }), false);
});

test('membre et aperçu', () => {
  assert.ok(estMembre({ user_id: 'u1', prenom: null }));
  assert.equal(estMembre({ user_id: 'u1' }), false);
  assert.ok(estApercu({ id: 'k1', nom: 'n', intention: null, echeance: null, invite_par: null, libres: 30 }));
  assert.equal(estApercu({ id: 'k1', nom: 'n', intention: null, echeance: null, invite_par: null, libres: '30' }), false);
});

test('ligne de badge', () => {
  assert.ok(estLignePart({ khatm_id: 'k1', etat: 'lu' }));
  assert.equal(estLignePart({ khatm_id: 1, etat: 'lu' }), false);
});

test('lireListe : liste complète ou erreur, jamais de ligne partielle', () => {
  assert.deepEqual(lireListe([{ user_id: 'u1', prenom: 'A' }], estMembre), [{ user_id: 'u1', prenom: 'A' }]);
  assert.throws(() => lireListe([{ user_id: 'u1', prenom: 'A' }, { prenom: 'B' }], estMembre));
  assert.throws(() => lireListe({ user_id: 'u1' }, estMembre));
});
