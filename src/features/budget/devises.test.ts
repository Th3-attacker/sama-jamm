/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MRU, XOF } from '../../lib/montant.ts';
import { apercuDevise, convertirMontant, convertirMontantPositif, deviseDepuisSaisie, lireTaux } from './devises.ts';

const FIN = '\u202f';
const NBSP = '\u00a0';

test('devise personnelle : nom et symbole nettoyés, sous-unités selon les décimales', () => {
  const d = deviseDepuisSaisie({ nom: ' Dirham ', symbole: ' DH ', position: 'apres', decimales: 2 }, 'P-1');
  assert.deepEqual(d, {
    code: 'P-1',
    nom: 'Dirham',
    symbole: 'DH',
    position: 'apres',
    decimales: 2,
    sousUnites: 100,
    personnelle: true,
  });
  assert.equal(
    deviseDepuisSaisie({ nom: 'Dalasi', symbole: 'D', position: 'avant', decimales: 1 }, 'x')?.sousUnites,
    10,
  );
});

test('devise personnelle refusée : nom ou symbole vide ou trop long', () => {
  const base = { nom: 'Naira', symbole: 'N', position: 'avant', decimales: 0 } as const;
  assert.equal(deviseDepuisSaisie({ ...base, nom: '  ' }, 'x'), null);
  assert.equal(deviseDepuisSaisie({ ...base, nom: 'n'.repeat(31) }, 'x'), null);
  assert.equal(deviseDepuisSaisie({ ...base, symbole: '' }, 'x'), null);
  assert.equal(deviseDepuisSaisie({ ...base, symbole: 'NAIRA' }, 'x'), null);
});

test('aperçu : 2 500 dans la devise', () => {
  assert.equal(apercuDevise(XOF), `2${FIN}500${NBSP}F CFA`);
  assert.equal(
    apercuDevise({ symbole: '$', position: 'avant', decimales: 2, sousUnites: 100 }),
    `$${NBSP}2${FIN}500,00`,
  );
});

test('taux : saisie exacte, refus du vide, du zéro et des taux trop précis', () => {
  assert.deepEqual(lireTaux('0,0165'), { numerateur: 165, denominateur: 10_000 });
  assert.deepEqual(lireTaux('655.957'), { numerateur: 655_957, denominateur: 1000 });
  assert.deepEqual(lireTaux('2'), { numerateur: 2, denominateur: 1 });
  assert.equal(lireTaux(''), null);
  assert.equal(lireTaux('0'), null);
  assert.equal(lireTaux('-1'), null);
  assert.equal(lireTaux('0,0000001'), null);
  assert.equal(lireTaux('abc'), null);
});

test('conversion : sous-unités et arrondi à la plus proche', () => {
  const DH = { sousUnites: 100 };
  // 1 000 F CFA à 0,0165 DH = 16,50 DH = 1 650 centimes.
  assert.equal(convertirMontant(1000, XOF, DH, { numerateur: 165, denominateur: 10_000 }), 1650);
  // 100 UM (500 khoums) à 1,5 F CFA = 150 F CFA.
  assert.equal(convertirMontant(500, MRU, XOF, { numerateur: 15, denominateur: 10 }), 150);
  // 1 F CFA à 0,5 UM = 0,5 UM = 2,5 khoums : arrondi à 3.
  assert.equal(convertirMontant(1, XOF, MRU, { numerateur: 5, denominateur: 10 }), 3);
  assert.equal(convertirMontant(-1, XOF, MRU, { numerateur: 5, denominateur: 10 }), -3);
  assert.equal(convertirMontant(0, XOF, DH, { numerateur: 1, denominateur: 1 }), 0);
});

test('conversion d’un montant positif : jamais sous une unité', () => {
  const minuscule = { numerateur: 1, denominateur: 1_000_000 };
  assert.equal(convertirMontant(10, XOF, XOF, minuscule), 0);
  assert.equal(convertirMontantPositif(10, XOF, XOF, minuscule), 1);
});
