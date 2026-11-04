/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  baseDeCalcul,
  coursAncien,
  debutHawlSuivi,
  etatZakat,
  grammesVersMg,
  mgVersGrammes,
  montantZakat,
  seuilNisab,
  valeurMetal,
} from './zakat.ts';

test('métaux : grammes × prix du gramme', () => {
  assert.equal(valeurMetal(48_000, 25_000), 1_200_000);
  assert.equal(valeurMetal(1_500, 333), 500);
  assert.equal(valeurMetal(0, 25_000), 0);
});

test('nisab : 595 g d’argent ou 85 g d’or, inconnu sans prix', () => {
  assert.equal(seuilNisab('argent', { or: 45_000, argent: 600 }), 357_000);
  assert.equal(seuilNisab('or', { or: 45_000, argent: 600 }), 3_825_000);
  assert.equal(seuilNisab('argent', { or: 45_000, argent: null }), null);
  assert.equal(seuilNisab('or', { or: 0, argent: 600 }), null);
});

test('montant : 2,5 % arrondi au-dessus, rien sur une base nulle ou négative', () => {
  assert.equal(montantZakat(1_250_000), 31_250);
  assert.equal(montantZakat(1_900_000), 47_500);
  assert.equal(montantZakat(1_001), 26);
  assert.equal(montantZakat(0), 0);
  assert.equal(montantZakat(-5_000), 0);
});

test('base : avoirs et créances, moins les dettes', () => {
  assert.equal(
    baseDeCalcul({ epargne: 850_000, comptes: 0, metaux: 1_200_000, autres: 0, creances: 150_000, dettes: 300_000 }),
    1_900_000,
  );
});

test('année lunaire : posée au passage du nisab, gardée, effacée sous le nisab', () => {
  assert.equal(debutHawlSuivi(null, true, '2026-11-04'), '2026-11-04');
  assert.equal(debutHawlSuivi('2026-07-01', true, '2026-11-04'), '2026-07-01');
  assert.equal(debutHawlSuivi('2026-07-01', false, '2026-11-04'), null);
  // Sans prix du gramme : on ne sait pas, on ne touche à rien.
  assert.equal(debutHawlSuivi('2026-07-01', null, '2026-11-04'), '2026-07-01');
});

test('état : sans cours, sous le nisab, due à l’échéance', () => {
  assert.deepEqual(etatZakat(1_000_000, null, null, '2026-11-04'), { type: 'sansCours', base: 1_000_000 });
  assert.deepEqual(etatZakat(300_000, 357_000, null, '2026-11-04'), {
    type: 'sousNisab',
    base: 300_000,
    nisab: 357_000,
  });
  assert.deepEqual(etatZakat(1_250_000, 357_000, '2026-07-01', '2026-11-04'), {
    type: 'due',
    base: 1_250_000,
    nisab: 357_000,
    montant: 31_250,
    echeance: '2027-06-20',
    joursRestants: 228,
  });
  const passee = etatZakat(1_250_000, 357_000, '2025-07-01', '2026-11-04');
  assert.equal(passee.type === 'due' && passee.joursRestants < 0, true);
});

test('poids : grammes tapés en milligrammes, et retour', () => {
  assert.equal(grammesVersMg('48'), 48_000);
  assert.equal(grammesVersMg('48,5'), 48_500);
  assert.equal(grammesVersMg(' 0.25 '), 250);
  assert.equal(grammesVersMg('1,005'), 1_005);
  assert.equal(grammesVersMg('0'), null);
  assert.equal(grammesVersMg('1,0005'), null);
  assert.equal(grammesVersMg('abc'), null);
  assert.equal(mgVersGrammes(48_500), '48,5');
  assert.equal(mgVersGrammes(48_000), '48');
  assert.equal(mgVersGrammes(250), '0,25');
  assert.equal(grammesVersMg(mgVersGrammes(1_005)), 1_005);
});

test('prix du gramme ancien après 30 jours, ou jamais saisi', () => {
  assert.equal(coursAncien('2026-10-20', '2026-11-04'), false);
  assert.equal(coursAncien('2026-10-01', '2026-11-04'), true);
  assert.equal(coursAncien(null, '2026-11-04'), true);
});
