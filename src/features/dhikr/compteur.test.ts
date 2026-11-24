import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nettoyerDhikr, prochainCompte } from './compteur.ts';

test('avec un objectif : monte jusqu’à l’objectif', () => {
  assert.equal(prochainCompte(0, 33), 1);
  assert.equal(prochainCompte(32, 33), 33);
});

test('objectif atteint : le grain suivant repart à 1', () => {
  assert.equal(prochainCompte(33, 33), 1);
  assert.equal(prochainCompte(99, 99), 1);
});

test('compte déjà au-delà de l’objectif : repart à 1', () => {
  assert.equal(prochainCompte(37, 33), 1);
});

test('libre (sans objectif) : monte sans fin', () => {
  assert.equal(prochainCompte(33, null), 34);
  assert.equal(prochainCompte(1000, null), 1001);
});

const DEFAUT = { formule: 'subhanallah', comptes: {}, objectifs: {} };

test('dhikr relu : valeurs valides gardées, corrompues ignorées', () => {
  const r = nettoyerDhikr(
    { formule: 'alhamdulillah', comptes: { a: 12, b: Number.NaN, c: -3, d: 1.5, e: '7' }, objectifs: { a: 33, b: 0, c: null, d: -1, e: 'x' } },
    DEFAUT,
  );
  assert.deepEqual(r, { formule: 'alhamdulillah', comptes: { a: 12 }, objectifs: { a: 33, c: null } });
});

test('dhikr relu : état absent, tableau ou chaîne = valeurs par défaut', () => {
  assert.deepEqual(nettoyerDhikr(null, DEFAUT), DEFAUT);
  assert.deepEqual(nettoyerDhikr([], DEFAUT), DEFAUT);
  assert.deepEqual(nettoyerDhikr('x', DEFAUT), DEFAUT);
});

test('dhikr relu : formule vide ou non texte = formule par défaut', () => {
  assert.equal(nettoyerDhikr({ formule: '' }, DEFAUT).formule, 'subhanallah');
  assert.equal(nettoyerDhikr({ formule: 4 }, DEFAUT).formule, 'subhanallah');
});
