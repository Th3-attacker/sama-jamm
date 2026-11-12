/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { pourcentageKhatm, progressionKhatm } from './progression.ts';

const versets = (JSON.parse(readFileSync('src/data/sourates.json', 'utf8')) as { versets: number }[]).map(
  (s) => s.versets,
);

test('progression du khatm : début, Al-Kahf 46, dernier verset', () => {
  assert.equal(progressionKhatm({ sourate: 1, verset: 1 }, versets), 1 / 6236);
  assert.equal(pourcentageKhatm(progressionKhatm({ sourate: 18, verset: 46 }, versets)), 35);
  assert.equal(progressionKhatm({ sourate: 114, verset: 6 }, versets), 1);
  assert.equal(pourcentageKhatm(1), 100);
  assert.equal(pourcentageKhatm(0.999), 99);
});
