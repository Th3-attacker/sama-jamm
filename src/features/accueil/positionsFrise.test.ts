/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fractionFrise, fractionMaintenant, segmentMaintenant } from './positionsFrise.ts';

const minutes = (h: number, m: number) => h * 60 + m;

test('ordre normal : Fajr à 0, Isha à 1, Dhuhr entre les deux', () => {
  const fajr = minutes(5, 15);
  const isha = minutes(20, 30);
  assert.equal(fractionFrise(fajr, fajr, isha), 0);
  assert.equal(fractionFrise(isha, fajr, isha), 1);
  const dhuhr = fractionFrise(minutes(12, 50), fajr, isha);
  assert.ok(dhuhr > 0 && dhuhr < 1);
});

test('Isha après minuit : Maghrib et Isha restent après Dhuhr et Asr', () => {
  // Fajr 13:15, Dhuhr 19:55, Asr 22:40, Maghrib 01:02, Isha 02:27.
  const fajr = minutes(13, 15);
  const isha = minutes(2, 27);
  const positions = [
    fractionFrise(fajr, fajr, isha),
    fractionFrise(minutes(19, 55), fajr, isha),
    fractionFrise(minutes(22, 40), fajr, isha),
    fractionFrise(minutes(1, 2), fajr, isha),
    fractionFrise(isha, fajr, isha),
  ];
  for (let i = 1; i < positions.length; i++) {
    assert.ok((positions[i] ?? 0) > (positions[i - 1] ?? 1), `position ${i} après la précédente`);
  }
  assert.equal(positions[4], 1);
});

test('une valeur hors plage est ramenée entre 0 et 1', () => {
  assert.equal(fractionFrise(minutes(23, 0), minutes(5, 0), minutes(6, 0)), 1);
});

test('maintenant : entre Dhuhr et Asr, le cercle tombe entre les deux points', () => {
  const fajr = 6 * 60 + 5;
  const dhuhr = 13 * 60 + 20;
  const asr = 16 * 60 + 35;
  const isha = 20 * 60 + 25;
  const f = fractionMaintenant(15 * 60, fajr, isha);
  assert.ok(f !== null);
  assert.ok(f > fractionFrise(dhuhr, fajr, isha) && f < fractionFrise(asr, fajr, isha));
});

test('maintenant : avant Fajr ou après Isha, pas de cercle', () => {
  assert.equal(fractionMaintenant(4 * 60, 6 * 60 + 5, 20 * 60 + 25), null);
  assert.equal(fractionMaintenant(22 * 60, 6 * 60 + 5, 20 * 60 + 25), null);
});

test('segment : entre Dhuhr (indice 1) et Asr, à mi-chemin', () => {
  const m = [6 * 60 + 5, 13 * 60 + 20, 16 * 60 + 35, 19 * 60 + 10, 20 * 60 + 25];
  const milieu = (13 * 60 + 20 + 16 * 60 + 35) / 2;
  assert.deepEqual(segmentMaintenant(Math.round(milieu), m)?.indice, 1);
  assert.ok(Math.abs((segmentMaintenant(Math.round(milieu), m)?.fraction ?? 0) - 0.5) < 0.01);
  assert.equal(segmentMaintenant(5 * 60, m), null);
  assert.equal(segmentMaintenant(22 * 60, m), null);
});
