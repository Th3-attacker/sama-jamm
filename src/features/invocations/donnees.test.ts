import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CATEGORIES, estCategorie, INVOCATIONS, invocationsDe } from './donnees.ts';

const sourates: { n: number; versets: number }[] = JSON.parse(
  readFileSync(new URL('../../data/sourates.json', import.meta.url), 'utf8'),
);

test('chaque invocation désigne des versets qui existent', () => {
  for (const i of INVOCATIONS) {
    const s = sourates.find((x) => x.n === i.sourate);
    assert.ok(s, `sourate ${i.sourate} inconnue (${i.id})`);
    assert.ok(i.de >= 1 && i.de <= i.a && i.a <= s.versets, `versets invalides (${i.id})`);
    assert.ok(Number.isInteger(i.repetitions) && i.repetitions >= 1, `répétitions invalides (${i.id})`);
  }
});

test('identifiants uniques et catégories connues', () => {
  assert.equal(new Set(INVOCATIONS.map((i) => i.id)).size, INVOCATIONS.length);
  for (const i of INVOCATIONS) assert.ok(estCategorie(i.categorie));
  for (const c of CATEGORIES) assert.ok(invocationsDe(c).length > 0, `catégorie vide : ${c}`);
});

test('estCategorie refuse une valeur inconnue', () => {
  assert.equal(estCategorie('voyage'), false);
  assert.equal(estCategorie('matin'), true);
});
