import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { chapitresDeCategorie } from './categoriesHisn.ts';
import type { ChapitreHisn } from './hisn.ts';
import { estMoment, estMomentHisn, MOMENTS, MOMENTS_HISN } from './moments.ts';

const chapitres: ChapitreHisn[] = JSON.parse(
  readFileSync(new URL('../../data/invocations/hisn.json', import.meta.url), 'utf8'),
).chapitres;

test('six moments, sans doublon, tous reconnus', () => {
  assert.equal(MOMENTS.length, 6);
  assert.equal(new Set(MOMENTS).size, MOMENTS.length);
  for (const m of MOMENTS) assert.ok(estMoment(m));
  assert.ok(!estMoment('hajj'));
});

test('chaque moment de la citadelle a au moins un chapitre', () => {
  for (const m of Object.keys(MOMENTS_HISN)) {
    assert.ok(estMomentHisn(m));
    assert.ok(chapitresDeCategorie(MOMENTS_HISN[m as keyof typeof MOMENTS_HISN], chapitres).length > 0, m);
  }
});
