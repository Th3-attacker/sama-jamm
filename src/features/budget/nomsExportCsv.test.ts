/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { JOURS_RECHERCHES, nomExportCsv, nomsExportsCsvRecents } from './nomsExportCsv.ts';

test('le nom d’un export CSV porte le jour local', () => {
  assert.equal(nomExportCsv(new Date(2026, 10, 14, 23, 59)), 'sama-jamm-budget-2026-11-14.csv');
  assert.equal(nomExportCsv(new Date(2026, 0, 5)), 'sama-jamm-budget-2026-01-05.csv');
});

test('les noms recherchés remontent jour par jour, passage de mois et d’année compris', () => {
  const noms = nomsExportsCsvRecents(new Date(2026, 0, 2), 4);
  assert.deepEqual(noms, [
    'sama-jamm-budget-2026-01-02.csv',
    'sama-jamm-budget-2026-01-01.csv',
    'sama-jamm-budget-2025-12-31.csv',
    'sama-jamm-budget-2025-12-30.csv',
  ]);
  assert.equal(nomsExportsCsvRecents(new Date(2026, 10, 14)).length, JOURS_RECHERCHES);
});

test('ne désigne jamais une sauvegarde chiffrée', () => {
  for (const nom of nomsExportsCsvRecents(new Date(2026, 10, 14))) assert.ok(nom.endsWith('.csv'), nom);
});
