/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { enChiffresArabes } from './chiffres.ts';

test('chiffres arabes orientaux', () => {
  assert.equal(enChiffresArabes(7), '٧');
  assert.equal(enChiffresArabes(286), '٢٨٦');
  assert.equal(enChiffresArabes(10), '١٠');
});
