import assert from 'node:assert/strict';
import { test } from 'node:test';

import { apresEchec, DELAI_ESSAI_MS, decalageEstime, DUREE_MAX_MS, ESSAIS_MAX } from './positionVerset.ts';

test('après un échec : on réessaie jusqu’au nombre d’essais maximal, puis on s’arrête', () => {
  assert.equal(apresEchec(1).reessayer, true);
  assert.equal(apresEchec(ESSAIS_MAX - 1).reessayer, true);
  assert.equal(apresEchec(ESSAIS_MAX).reessayer, false);
  assert.ok(apresEchec(1).delai > 0);
});

test('décalage estimé : hauteur moyenne × index, jamais négatif ni invalide', () => {
  assert.equal(decalageEstime(141, 100.4), 14156);
  assert.equal(decalageEstime(0, 100), 0);
  assert.equal(decalageEstime(-3, 100), 0);
  assert.equal(decalageEstime(10, Number.NaN), 0);
});

test('le chargement ne peut pas durer plus que la durée maximale : les essais tiennent dedans', () => {
  assert.ok(ESSAIS_MAX * DELAI_ESSAI_MS < DUREE_MAX_MS);
  assert.ok(DUREE_MAX_MS <= 1500);
});
