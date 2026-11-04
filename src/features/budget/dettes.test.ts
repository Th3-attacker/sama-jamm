/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { etatEcheance, lireSaisieDate, masqueDate, resumeDettes, versSaisieDate } from './dettes.ts';

test('échéance : aucune, à venir, aujourd’hui, passée', () => {
  assert.deepEqual(etatEcheance(null, '2026-11-04'), { type: 'aucune' });
  assert.deepEqual(etatEcheance('2026-11-30', '2026-11-04'), { type: 'aVenir', jours: 26 });
  assert.deepEqual(etatEcheance('2026-11-04', '2026-11-04'), { type: 'aujourdhui' });
  assert.deepEqual(etatEcheance('2026-10-23', '2026-11-04'), { type: 'passee', jours: 12 });
});

test('résumé : on me doit, je dois et solde', () => {
  const r = resumeDettes([
    { sens: 'prete', reste: 25_000 },
    { sens: 'prete', reste: 60_000 },
    { sens: 'emprunte', reste: 30_000 },
  ]);
  assert.deepEqual(r, { onMeDoit: 85_000, jeDois: 30_000, solde: 55_000 });
  assert.deepEqual(resumeDettes([]), { onMeDoit: 0, jeDois: 0, solde: 0 });
  assert.equal(resumeDettes([{ sens: 'emprunte', reste: 10 }]).solde, -10);
});

test('saisie de date : jj/mm/aaaa et variantes', () => {
  assert.equal(lireSaisieDate('30/11/2026'), '2026-11-30');
  assert.equal(lireSaisieDate(' 3/2/2027 '), '2027-02-03');
  assert.equal(lireSaisieDate('29.02.2028'), '2028-02-29');
  assert.equal(lireSaisieDate('01-12-2026'), '2026-12-01');
});

test('saisie de date : refus des dates impossibles ou mal écrites', () => {
  assert.equal(lireSaisieDate('29/02/2027'), null);
  assert.equal(lireSaisieDate('31/04/2026'), null);
  assert.equal(lireSaisieDate('12/13/2026'), null);
  assert.equal(lireSaisieDate('2026-11-30'), null);
  assert.equal(lireSaisieDate('30/11/26'), null);
  assert.equal(lireSaisieDate(''), null);
});

test('masque de date : les barres se placent pendant la frappe', () => {
  assert.equal(masqueDate('3'), '3');
  assert.equal(masqueDate('301'), '30/1');
  assert.equal(masqueDate('3011'), '30/11');
  assert.equal(masqueDate('30112026'), '30/11/2026');
  assert.equal(masqueDate('30/11/20269'), '30/11/2026');
  assert.equal(masqueDate('30 nov'), '30');
  assert.equal(lireSaisieDate(masqueDate('01122026')), '2026-12-01');
});

test('versSaisieDate est l’inverse de lireSaisieDate', () => {
  assert.equal(versSaisieDate('2026-11-30'), '30/11/2026');
  assert.equal(lireSaisieDate(versSaisieDate('2027-02-03')), '2027-02-03');
});
