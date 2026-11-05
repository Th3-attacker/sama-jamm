/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { rotationDepuisNord } from './rotation.ts';

test('rotation depuis le nord : sens, angle et part de tour', () => {
  assert.deepEqual(rotationDepuisNord(76), { sens: 'droite', angle: 76, part: 'moinsQuart' });
  assert.deepEqual(rotationDepuisNord(90), { sens: 'droite', angle: 90, part: 'quart' });
  assert.deepEqual(rotationDepuisNord(300), { sens: 'gauche', angle: 60, part: 'moinsQuart' });
  assert.equal(rotationDepuisNord(178).part, 'demi');
  assert.equal(rotationDepuisNord(20).part, 'unPeu');
});
