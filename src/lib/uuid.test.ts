/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { uuidV7 } from './uuid.ts';

const octets = (v: number) => new Uint8Array(10).fill(v);

test('format UUID v7 : version 7, variante RFC', () => {
  const id = uuidV7(1_793_313_749_000, octets(0xff));
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("l'horodatage occupe les 48 premiers bits", () => {
  assert.equal(uuidV7(0x0123456789ab, octets(0)).slice(0, 13), '01234567-89ab');
});

test('triables par date de création', () => {
  const avant = uuidV7(1_000, octets(0xff));
  const apres = uuidV7(1_001, octets(0x00));
  assert.ok(avant < apres);
});

test('paramètres invalides refusés', () => {
  assert.throws(() => uuidV7(-1, octets(0)), RangeError);
  assert.throws(() => uuidV7(1, new Uint8Array(4)), RangeError);
});
