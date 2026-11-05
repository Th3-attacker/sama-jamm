/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PROVERBES, proverbeDuJour } from './sagesse.ts';

test('proverbe du jour : le même toute la journée, un autre le lendemain', () => {
  const matin = new Date(2026, 10, 5, 6, 0);
  const soir = new Date(2026, 10, 5, 23, 59);
  const demain = new Date(2026, 10, 6, 0, 1);
  assert.equal(proverbeDuJour(matin), proverbeDuJour(soir));
  assert.notEqual(proverbeDuJour(matin), proverbeDuJour(demain));
});

test('proverbe du jour : tous les proverbes reviennent en quelques jours', () => {
  const vus = new Set(Array.from({ length: PROVERBES.length }, (_, i) => proverbeDuJour(new Date(2026, 0, 1 + i))));
  assert.equal(vus.size, PROVERBES.length);
});
