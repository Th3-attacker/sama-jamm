import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estTermine, resumeKhatm, type Part } from './logique.ts';

const parts = (etats: Part['etat'][]): Part[] => etats.map((etat, i) => ({ juz: i + 1, user_id: etat === 'libre' ? null : 'u1', etat }));

test('khatm terminé : 30 juz lus', () => {
  assert.equal(estTermine(resumeKhatm(parts(Array(30).fill('lu')), 'u1')), true);
});

test('khatm non terminé : 29 lus et 1 en cours, ou 1 libre', () => {
  assert.equal(estTermine(resumeKhatm(parts([...Array(29).fill('lu'), 'en_cours']), 'u1')), false);
  assert.equal(estTermine(resumeKhatm(parts([...Array(29).fill('lu'), 'libre']), 'u1')), false);
});

test('khatm vide ou sans parts : non terminé', () => {
  assert.equal(estTermine(resumeKhatm([], null)), false);
  assert.equal(estTermine({ lus: 0 }), false);
});
