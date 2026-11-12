/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lienInvitation, lireCode, resumeKhatm, saisieCodeKhatm, vuePart, type Part } from './logique.ts';

const parts: Part[] = Array.from({ length: 30 }, (_, i) => ({
  juz: i + 1,
  user_id: i < 17 ? 'u1' : i < 22 ? (i === 19 ? 'moi' : 'u2') : null,
  etat: i < 17 ? 'lu' : i < 22 ? 'en_cours' : 'libre',
}));

test('résumé : lus, en cours dont le mien, libres', () => {
  assert.deepEqual(resumeKhatm(parts, 'moi'), { lus: 17, enCours: 5, libres: 8, monJuz: 20, dontLeVotre: true });
  assert.equal(resumeKhatm(parts, 'autre').monJuz, null);
});

test('vue d’un juz', () => {
  assert.equal(vuePart({ juz: 1, user_id: 'u1', etat: 'lu' }, 'moi'), 'lu');
  assert.equal(vuePart({ juz: 20, user_id: 'moi', etat: 'en_cours' }, 'moi'), 'leVotre');
  assert.equal(vuePart({ juz: 18, user_id: 'u2', etat: 'en_cours' }, 'moi'), 'enCours');
  assert.equal(vuePart({ juz: 30, user_id: null, etat: 'libre' }, 'moi'), 'libre');
});

test('lien et code d’invitation', () => {
  assert.equal(lienInvitation('ABCD2345'), 'samajamm://khatm/ABCD2345');
  assert.equal(lireCode('samajamm://khatm/ABCD2345'), 'ABCD2345');
  assert.equal(lireCode(' abcd-2345 '), 'ABCD2345');
  assert.equal(lireCode('ABC'), null);
  assert.equal(lireCode('ABCD1345'), null);
});

test('saisieCodeKhatm : majuscules, caractères permis, 8 au plus', () => {
  assert.equal(saisieCodeKhatm('abcd2345'), 'ABCD2345');
  assert.equal(saisieCodeKhatm('ab-cd 23 45 99'), 'ABCD2345');
  assert.equal(saisieCodeKhatm('ab01cd'), 'ABCD');
  assert.equal(saisieCodeKhatm('samajamm://khatm/abcd2345'), 'ABCD2345');
});
