/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parPaquets } from './paquets.ts';

test('par paquets : même résultat, dans l’ordre, en cédant la main entre deux paquets', async () => {
  let cessions = 0;
  const resultat = await parPaquets(
    114,
    (i) => i * 2,
    10,
    async () => {
      cessions += 1;
    },
  );
  assert.deepEqual(
    resultat,
    Array.from({ length: 114 }, (_, i) => i * 2),
  );
  assert.equal(cessions, 11); // 12 paquets, pas de cession après le dernier
});

test('par paquets : liste vide, paquet unique, taille invalide', async () => {
  assert.deepEqual(await parPaquets(0, (i) => i, 10), []);
  let cessions = 0;
  assert.deepEqual(
    await parPaquets(
      3,
      (i) => i,
      10,
      async () => void (cessions += 1),
    ),
    [0, 1, 2],
  );
  assert.equal(cessions, 0);
  await assert.rejects(
    parPaquets(3, (i) => i, 0),
    RangeError,
  );
});
