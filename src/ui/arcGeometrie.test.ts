import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HAUTEUR_VUE, HZ, yBasNuit } from './arcGeometrie.ts';

test('la courbe de nuit, son trait et les points tiennent dans la zone de dessin', () => {
  const trait = 1.5;
  assert.ok(yBasNuit() + trait < HAUTEUR_VUE, 'courbe de nuit coupée');
  // Points de Fajr et d'Isha sous l'horizon : 8 points plus bas, rayon 4,5, trait 1,5.
  assert.ok(HZ + 8 + 4.5 + trait < HAUTEUR_VUE, 'point sous l’horizon coupé');
});
