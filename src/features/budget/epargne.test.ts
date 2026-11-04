/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { progressionObjectif, projectionObjectif } from './epargne.ts';

test('progression : part atteinte, bornée, et aucune barre sans montant visé', () => {
  assert.equal(progressionObjectif(120_000, 200_000), 0.6);
  assert.equal(progressionObjectif(250_000, 200_000), 1);
  assert.equal(progressionObjectif(0, 200_000), 0);
  assert.equal(progressionObjectif(300_000, null), null);
});

test('projection : au rythme choisi, nombre de paies et mois du dernier versement', () => {
  // 80 000 manquants à 25 000 par paie : 4 paies, de novembre 2026 à février 2027.
  assert.deepEqual(projectionObjectif({ verse: 120_000, cible: 200_000, versementMensuel: 25_000 }, '2026-11-04'), {
    type: 'rythme',
    paies: 4,
    mois: '2027-02',
  });
  // 150 000 à 15 000 : 10 paies, de novembre 2026 à août 2027.
  assert.deepEqual(projectionObjectif({ verse: 0, cible: 150_000, versementMensuel: 15_000 }, '2026-11-04'), {
    type: 'rythme',
    paies: 10,
    mois: '2027-08',
  });
  assert.deepEqual(projectionObjectif({ verse: 0, cible: 10_000, versementMensuel: 10_000 }, '2026-12-31'), {
    type: 'rythme',
    paies: 1,
    mois: '2026-12',
  });
});

test('projection : atteint, sans rythme, versement libre', () => {
  assert.deepEqual(projectionObjectif({ verse: 200_000, cible: 200_000, versementMensuel: 25_000 }, '2026-11-04'), {
    type: 'atteint',
  });
  assert.deepEqual(projectionObjectif({ verse: 0, cible: 200_000, versementMensuel: null }, '2026-11-04'), {
    type: 'sansRythme',
  });
  assert.deepEqual(projectionObjectif({ verse: 300_000, cible: null, versementMensuel: 15_000 }, '2026-11-04'), {
    type: 'libre',
  });
});
