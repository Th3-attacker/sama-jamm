import assert from 'node:assert/strict';
import test from 'node:test';

import { basculerBloque, lireBloques } from './bloques.ts';

test('bloquer puis débloquer un membre', () => {
  const apres = basculerBloque([], 'a');
  assert.deepEqual(apres, ['a']);
  assert.deepEqual(basculerBloque(apres, 'a'), []);
});

test('bloquer un membre garde les autres et ne modifie pas la liste reçue', () => {
  const avant = ['a'];
  assert.deepEqual(basculerBloque(avant, 'b'), ['a', 'b']);
  assert.deepEqual(avant, ['a']);
});

test('la lecture ignore ce qui n’est pas un identifiant et les doublons', () => {
  assert.deepEqual(lireBloques(['a', 3, '', null, 'a', 'b']), ['a', 'b']);
  assert.deepEqual(lireBloques('x'), []);
  assert.deepEqual(lireBloques(undefined), []);
});
