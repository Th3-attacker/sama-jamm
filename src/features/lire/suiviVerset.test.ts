/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PAUSE_SUIVI_MS, versetASuivre } from './suiviVerset.ts';

const plage = { premier: 10, dernier: 14 };

test('suivi : le verset récité est visible, la liste ne bouge pas', () => {
  for (const recite of [10, 12, 14]) assert.equal(versetASuivre({ recite, plage, dernierGeste: 0, maintenant: 100_000 }), null);
});

test('suivi : le verset récité est sorti de l\'écran, en bas ou en haut', () => {
  assert.equal(versetASuivre({ recite: 15, plage, dernierGeste: 0, maintenant: 100_000 }), 15);
  assert.equal(versetASuivre({ recite: 9, plage, dernierGeste: 0, maintenant: 100_000 }), 9);
  assert.equal(versetASuivre({ recite: 200, plage, dernierGeste: 0, maintenant: 100_000 }), 200);
});

test('suivi : pause pendant 8 secondes après un geste du lecteur', () => {
  const geste = 50_000;
  assert.equal(versetASuivre({ recite: 20, plage, dernierGeste: geste, maintenant: geste + 1000 }), null);
  assert.equal(versetASuivre({ recite: 20, plage, dernierGeste: geste, maintenant: geste + PAUSE_SUIVI_MS - 1 }), null);
  assert.equal(versetASuivre({ recite: 20, plage, dernierGeste: geste, maintenant: geste + PAUSE_SUIVI_MS }), 20);
});

test('suivi : rien à suivre ou plage inconnue', () => {
  assert.equal(versetASuivre({ recite: null, plage, dernierGeste: 0, maintenant: 100_000 }), null);
  assert.equal(versetASuivre({ recite: 20, plage: null, dernierGeste: 0, maintenant: 100_000 }), null);
});
