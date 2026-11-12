/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { retirerTraduction } from './traductionMigration.ts';

test('efface la traduction et l’affichage enregistrés, garde le reste', () => {
  const etat: Record<string, unknown> = { traduction: 'fr', affichage: 'arabeTrad', translitLecture: true, tailleLecture: 3 };
  retirerTraduction(etat);
  assert.deepEqual(etat, { translitLecture: true, tailleLecture: 3 });
});

test('sans ces clés, ne change rien et ne plante pas', () => {
  const etat: Record<string, unknown> = { theme: 'auto' };
  retirerTraduction(etat);
  assert.deepEqual(etat, { theme: 'auto' });
});
