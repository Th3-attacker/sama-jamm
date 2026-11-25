import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estJumua } from './nomPriere.ts';

test('Jumu’a seulement pour Dhuhr le vendredi', () => {
  const vendredi = new Date(2026, 10, 27, 13, 0);
  const jeudi = new Date(2026, 10, 26, 13, 0);
  assert.equal(estJumua('dhuhr', vendredi), true);
  assert.equal(estJumua('asr', vendredi), false);
  assert.equal(estJumua('dhuhr', jeudi), false);
});
