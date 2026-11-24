import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dureeAnimation } from './animation.ts';

test('animation : durée normale, ou nulle quand les animations sont réduites', () => {
  assert.equal(dureeAnimation(180, false), 180);
  assert.equal(dureeAnimation(180, true), 0);
  assert.equal(dureeAnimation(0, false), 0);
});
