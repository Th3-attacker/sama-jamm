/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatMontant, MONTANT_MAX_UNITES, MRU, versMinimes, versPrincipal, XOF, type Devise } from './montant.ts';

const DH: Devise = {
  code: 'MAD',
  nom: 'Dirham',
  symbole: 'DH',
  position: 'apres',
  decimales: 2,
  sousUnites: 100,
  personnelle: true,
};
const USD: Devise = {
  code: 'USD',
  nom: 'Dollar',
  symbole: '$',
  position: 'avant',
  decimales: 2,
  sousUnites: 100,
  personnelle: true,
};
const FIN = ' ';
const NBSP = ' ';

test('tableau du design : saisie, montant stocké, affichage', () => {
  assert.equal(versMinimes('2500', XOF), 2500);
  assert.equal(formatMontant(2500, XOF), `2${FIN}500${NBSP}F CFA`);
  assert.equal(versMinimes('18500', MRU), 92500);
  assert.equal(formatMontant(92500, MRU), `18${FIN}500${NBSP}UM`);
  assert.equal(versMinimes('12,50', DH), 1250);
  assert.equal(formatMontant(1250, DH), `12,50${NBSP}DH`);
  assert.equal(versMinimes('9,99', USD), 999);
  assert.equal(formatMontant(999, USD), `$${NBSP}9,99`);
});

test('la saisie accepte espaces, virgule et point', () => {
  assert.equal(versMinimes('2 500', XOF), 2500);
  assert.equal(versMinimes(`2${FIN}500`, XOF), 2500);
  assert.equal(versMinimes('12.5', DH), 1250);
  assert.equal(versMinimes('12', DH), 1200);
  assert.equal(versMinimes('0', XOF), 0);
});

test('une saisie invalide donne null, jamais un montant approché', () => {
  assert.equal(versMinimes('', XOF), null);
  assert.equal(versMinimes('abc', XOF), null);
  assert.equal(versMinimes('-5', XOF), null);
  assert.equal(versMinimes('2500,5', XOF), null);
  assert.equal(versMinimes('2500,5', MRU), null);
  assert.equal(versMinimes('1,234', DH), null);
  assert.equal(versMinimes('1e3', XOF), null);
});

test('plus grand montant : 10^12 unités passe, au-delà est refusé', () => {
  assert.equal(versMinimes(String(MONTANT_MAX_UNITES), XOF), MONTANT_MAX_UNITES);
  assert.equal(versMinimes(String(MONTANT_MAX_UNITES + 1), XOF), null);
  assert.equal(versMinimes(String(MONTANT_MAX_UNITES), DH), MONTANT_MAX_UNITES * 100);
  assert.equal(formatMontant(MONTANT_MAX_UNITES * 100, DH), `1${FIN}000${FIN}000${FIN}000${FIN}000,00${NBSP}DH`);
});

test('montants négatifs : vrai signe moins, zéro sans signe', () => {
  assert.equal(formatMontant(-2500, XOF), `−2${FIN}500${NBSP}F CFA`);
  assert.equal(formatMontant(-999, USD), `$${NBSP}−9,99`);
  assert.equal(formatMontant(0, XOF), `0${NBSP}F CFA`);
});

test("ouguiya : les khoums s'arrondissent à l'unité affichée, demi vers le haut", () => {
  assert.equal(formatMontant(92501, MRU), `18${FIN}500${NBSP}UM`); // 0,2 UM
  assert.equal(formatMontant(92503, MRU), `18${FIN}501${NBSP}UM`); // 0,6 UM
  assert.equal(versPrincipal(92500, MRU), 18500);
});

test("un montant non entier est refusé à l'affichage", () => {
  assert.throws(() => formatMontant(12.5, XOF), RangeError);
  assert.throws(() => formatMontant(Number.NaN, XOF), RangeError);
});

test('aller-retour saisie, stockage, affichage sans écart', () => {
  for (const saisie of ['0', '1', '999', '1000', '1234567', '350000']) {
    const minimes = versMinimes(saisie, XOF);
    assert.notEqual(minimes, null);
    assert.equal(formatMontant(minimes ?? 0, XOF).replace(/[^\d]/g, ''), saisie.replace(/^0+(?=\d)/, ''));
  }
});
