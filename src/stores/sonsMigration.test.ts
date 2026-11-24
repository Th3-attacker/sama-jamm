import assert from 'node:assert/strict';
import { test } from 'node:test';

import { appliquerSonsAnciens, migrerSonsAnciens } from './sonsMigration.ts';

test('sons : complet et doux deviennent court', () => {
  assert.deepEqual(migrerSonsAnciens({ fajr: 'complet', dhuhr: 'doux', asr: 'court' }), {
    fajr: 'court',
    dhuhr: 'court',
    asr: 'court',
  });
});

test('sons : vibration et silencieux sont gardés', () => {
  assert.deepEqual(migrerSonsAnciens({ isha: 'vibration', maghrib: 'silencieux' }), {
    isha: 'vibration',
    maghrib: 'silencieux',
  });
});

test('sons : une valeur absente ou invalide est rendue telle quelle', () => {
  assert.equal(migrerSonsAnciens(undefined), undefined);
  assert.equal(migrerSonsAnciens('court'), 'court');
});

test('sons : une clé absente reste absente (jamais undefined)', () => {
  const etat: Record<string, unknown> = { langue: 'fr' };
  appliquerSonsAnciens(etat);
  assert.equal('sons' in etat, false);
});

test('sons : une clé présente est migrée dans l\'état', () => {
  const etat: Record<string, unknown> = { sons: { fajr: 'doux' } };
  appliquerSonsAnciens(etat);
  assert.deepEqual(etat.sons, { fajr: 'court' });
});
