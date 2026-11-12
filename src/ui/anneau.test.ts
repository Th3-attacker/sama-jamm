import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pourcentage } from './anneau.ts';

test('pourcentage : arrondi et borné de 0 à 100', () => {
  assert.equal(pourcentage(0), 0);
  assert.equal(pourcentage(0.456), 46);
  assert.equal(pourcentage(1), 100);
  assert.equal(pourcentage(1.4), 100);
  assert.equal(pourcentage(-0.2), 0);
  assert.equal(pourcentage(Number.NaN), 0);
});
