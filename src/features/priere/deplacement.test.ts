/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { aDeplace, distanceKm } from './deplacement.ts';

const DAKAR = { latitude: 14.7167, longitude: -17.4677 };
const SAINT_LOUIS = { latitude: 16.0179, longitude: -16.4896 };

test('distance : nulle sur le même point, environ 180 km de Dakar à Saint-Louis', () => {
  assert.equal(distanceKm(DAKAR, DAKAR), 0);
  const d = distanceKm(DAKAR, SAINT_LOUIS);
  assert.ok(d > 170 && d < 190, `distance ${d}`);
});

test('déplacement : au-delà de 25 km seulement', () => {
  assert.equal(aDeplace(DAKAR, SAINT_LOUIS), true);
  // Environ 11 km au nord : même quartier élargi, pas de recalcul.
  assert.equal(aDeplace(DAKAR, { latitude: 14.8167, longitude: -17.4677 }), false);
  // Environ 33 km : recalcul.
  assert.equal(aDeplace(DAKAR, { latitude: 15.0167, longitude: -17.4677 }), true);
});

test('déplacement : coordonnées invalides, aucun recalcul', () => {
  assert.equal(aDeplace(DAKAR, { latitude: Number.NaN, longitude: 0 }), false);
});
