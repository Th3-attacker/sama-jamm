import assert from 'node:assert/strict';
import { test } from 'node:test';

import { retirerVeille } from './veilleMigration.ts';

test('le thème « veille » enregistré passe à « nuit », les réglages de la Veille sont effacés', () => {
  const etat: Record<string, unknown> = { theme: 'veille', veilleAuto: true, veilleVue: '2026-10-29', haptique: true };
  retirerVeille(etat);
  assert.deepEqual(etat, { theme: 'nuit', haptique: true });
});

test('les autres thèmes sont gardés tels quels', () => {
  for (const theme of ['auto', 'jour', 'nuit']) {
    const etat: Record<string, unknown> = { theme, veilleAuto: false };
    retirerVeille(etat);
    assert.deepEqual(etat, { theme });
  }
});

test('un état sans les anciens réglages ne plante pas', () => {
  const etat: Record<string, unknown> = {};
  retirerVeille(etat);
  assert.deepEqual(etat, {});
});
