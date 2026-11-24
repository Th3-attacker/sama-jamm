import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estJour, jourOuNull } from './cycle.ts';
import { lireSaisieDate, masqueDate } from './dettes.ts';
import { coursAncien, debutHawlSuivi, etatZakat, grammesVersMg, valeurMetal } from './zakat.ts';

test('estJour : dates réelles seulement', () => {
  assert.equal(estJour('2026-11-24'), true);
  assert.equal(estJour('2024-02-29'), true);
  assert.equal(estJour('2026-02-30'), false);
  assert.equal(estJour('2026-13-01'), false);
  assert.equal(estJour('24/11/2026'), false);
  assert.equal(estJour(''), false);
  assert.equal(estJour(null), false);
  assert.equal(estJour(20261124), false);
});

test('jourOuNull : ne lève jamais', () => {
  assert.equal(jourOuNull('2026-11-24'), '2026-11-24');
  assert.equal(jourOuNull('corrompu'), null);
  assert.equal(jourOuNull(undefined), null);
});

test('zakat : une date de début illisible ne fait pas planter', () => {
  assert.equal(debutHawlSuivi('n’importe quoi', true, '2026-11-24'), '2026-11-24');
  assert.equal(debutHawlSuivi('n’importe quoi', null, '2026-11-24'), null);
  assert.equal(debutHawlSuivi('2026-01-01', true, '2026-11-24'), '2026-01-01');
  assert.deepEqual(etatZakat(1000, 500, 'corrompu', '2026-11-24'), { type: 'sousNisab', base: 1000, nisab: 500 });
  assert.equal(coursAncien('corrompu', '2026-11-24'), true);
  assert.equal(coursAncien('2026-11-20', '2026-11-24'), false);
});

test('zakat : valeur d’un métal en entiers exacts', () => {
  assert.equal(valeurMetal(48_500, 30_000), 1_455_000);
  assert.equal(valeurMetal(1, 500), 1); // 0,5 arrondi au-dessus
  assert.equal(valeurMetal(0, 30_000), 0);
  assert.equal(valeurMetal(100, 0), 0);
  assert.equal(valeurMetal(Number.NaN, 5), 0);
  assert.equal(valeurMetal(Number.POSITIVE_INFINITY, 5), 0);
});

test('zakat : aux valeurs extrêmes, le résultat est plafonné, jamais faux', () => {
  const v = valeurMetal(9_999_999_000, 1_000_000_000_000);
  assert.equal(v, Number.MAX_SAFE_INTEGER);
  assert.equal(valeurMetal(9_999_999_000, 1_000), 9_999_999_000);
});

test('grammes en chiffres arabes', () => {
  assert.equal(grammesVersMg('٤٨'), 48_000);
  assert.equal(grammesVersMg('٤٨٫٥'), 48_500);
  assert.equal(grammesVersMg('٠'), null);
});

test('dates de dette en chiffres arabes', () => {
  assert.equal(masqueDate('٣٠١١٢٠٢٦'), '30/11/2026');
  assert.equal(lireSaisieDate('٣٠/١١/٢٠٢٦'), '2026-11-30');
  assert.equal(lireSaisieDate('٣١/١١/٢٠٢٦'), null);
});
