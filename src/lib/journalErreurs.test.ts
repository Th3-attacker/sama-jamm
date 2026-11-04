/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ajouterAuJournal, JOURNAL_MAX, journalEnTexte, lireJournal, type EntreeJournal } from './journalErreurs.ts';

const entree = (n: number): EntreeJournal => ({
  quand: `2026-11-0${n % 9}T10:00:00Z`,
  code: `ERR-000${n % 10} · 04/11 10:00`,
  type: 'TypeError',
  source: 'ecran',
  version: '1.0.0',
  plateforme: 'android',
});

test('journal : la plus récente en tête, 20 au plus', () => {
  let j: EntreeJournal[] = [];
  for (let n = 0; n < 25; n++) j = ajouterAuJournal(j, entree(n));
  assert.equal(j.length, JOURNAL_MAX);
  assert.equal(j[0]?.code, entree(24).code);
});

test('journal relu : entrées mal formées écartées', () => {
  assert.deepEqual(lireJournal([entree(1), { code: 'x' }, null, 'texte']), [entree(1)]);
  assert.deepEqual(lireJournal({}), []);
});

test('journal en texte : en-tête puis une ligne par erreur', () => {
  assert.equal(
    journalEnTexte([entree(1)], 'Sama Jàmm'),
    'Sama Jàmm\n2026-11-01T10:00:00Z · ERR-0001 · 04/11 10:00 · TypeError · ecran · android 1.0.0',
  );
});
