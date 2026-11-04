/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MRU, XOF } from '../../lib/montant.ts';
import {
  ajouterJours,
  cycleDe,
  depassement,
  depenseDuJour,
  ecartJours,
  etatEnveloppe,
  joursDansMois,
  joursRestants,
  jourDePaieDuMois,
  pasArrondi,
  resteAVivre,
} from './cycle.ts';

test('exemple du design : 137 500 pour 27 jours donnent 5 000 F CFA', () => {
  const cycle = cycleDe('2026-10-29', 25);
  assert.deepEqual(cycle, { debut: '2026-10-25', fin: '2026-11-24' });
  const jours = joursRestants('2026-10-29', cycle.fin);
  assert.equal(jours, 27);
  const reste = resteAVivre({ recu: 350_000, misDeCote: 40_000, depenses: 172_500, chargesFixesNonReglees: 0 });
  assert.equal(reste, 137_500);
  assert.equal(depenseDuJour(reste, jours, pasArrondi(XOF)), 5000);
});

test('jour de paie le 31 : le dernier jour du mois quand le mois est plus court', () => {
  assert.equal(jourDePaieDuMois(2026, 2, 31), '2026-02-28');
  assert.equal(jourDePaieDuMois(2028, 2, 31), '2028-02-29');
  assert.equal(jourDePaieDuMois(2026, 4, 31), '2026-04-30');
  assert.equal(jourDePaieDuMois(2026, 1, 31), '2026-01-31');
  assert.deepEqual(cycleDe('2026-02-10', 31), { debut: '2026-01-31', fin: '2026-02-27' });
  assert.deepEqual(cycleDe('2026-02-28', 31), { debut: '2026-02-28', fin: '2026-03-30' });
  assert.deepEqual(cycleDe('2026-03-31', 31), { debut: '2026-03-31', fin: '2026-04-29' });
});

test('cycle à cheval sur deux années', () => {
  assert.deepEqual(cycleDe('2026-12-28', 25), { debut: '2026-12-25', fin: '2027-01-24' });
  assert.deepEqual(cycleDe('2027-01-10', 25), { debut: '2026-12-25', fin: '2027-01-24' });
  assert.deepEqual(cycleDe('2026-01-05', 25), { debut: '2025-12-25', fin: '2026-01-24' });
});

test('le cycle commence le jour de paie et finit la veille de la suivante', () => {
  assert.deepEqual(cycleDe('2026-10-25', 25), { debut: '2026-10-25', fin: '2026-11-24' });
  assert.deepEqual(cycleDe('2026-11-24', 25), { debut: '2026-10-25', fin: '2026-11-24' });
  assert.deepEqual(cycleDe('2026-11-25', 25), { debut: '2026-11-25', fin: '2026-12-24' });
});

test('longueur des cycles : de 28 à 31 jours', () => {
  for (const [jour, attendu] of [
    ['2026-02-01', 28],
    ['2028-02-01', 29],
    ['2026-04-01', 30],
    ['2026-01-01', 31],
  ] as const) {
    const c = cycleDe(jour, 1);
    assert.equal(ecartJours(c.debut, c.fin) + 1, attendu, jour);
  }
});

test("aujourd'hui est la veille de la paie : un seul jour restant", () => {
  const c = cycleDe('2026-11-24', 25);
  assert.equal(joursRestants('2026-11-24', c.fin), 1);
  assert.equal(depenseDuJour(8_300, 1, 100), 8_300);
});

test("changement d'heure : les jours se comptent sans décalage", () => {
  // Passage à l'heure d'été en Europe (29 mars 2026) et retour (25 octobre 2026).
  assert.equal(ecartJours('2026-03-28', '2026-03-30'), 2);
  assert.equal(ecartJours('2026-10-24', '2026-10-26'), 2);
  assert.equal(ajouterJours('2026-03-28', 2), '2026-03-30');
  assert.equal(ajouterJours('2026-10-31', 1), '2026-11-01');
  assert.equal(ajouterJours('2026-12-31', 1), '2027-01-01');
  assert.equal(joursDansMois(2026, 2), 28);
  assert.equal(joursDansMois(2028, 2), 29);
});

test('reste négatif : dépense du jour à zéro et dépassement affiché', () => {
  const reste = resteAVivre({ recu: 100_000, misDeCote: 20_000, depenses: 90_000, chargesFixesNonReglees: 5_000 });
  assert.equal(reste, -15_000);
  assert.equal(depenseDuJour(reste, 10, 100), 0);
  assert.equal(depassement(reste), 15_000);
  assert.equal(depassement(1), 0);
});

test('arrondi vers le bas au pas, en F CFA et en ouguiya', () => {
  assert.equal(pasArrondi(XOF), 100);
  assert.equal(pasArrondi(MRU), 500);
  assert.equal(depenseDuJour(137_500, 27, 100), 5_000);
  assert.equal(depenseDuJour(99, 1, 100), 0);
  assert.equal(depenseDuJour(100, 1, 100), 100);
  assert.equal(depenseDuJour(137_500 * 5, 27, pasArrondi(MRU)), 25_000);
});

test('enveloppe : normal sous 85 %, presque plein, dépassé, réglée', () => {
  assert.equal(etatEnveloppe(0, 50_000, false), 'normal');
  assert.equal(etatEnveloppe(42_499, 50_000, false), 'normal');
  assert.equal(etatEnveloppe(42_500, 50_000, false), 'presque-plein');
  assert.equal(etatEnveloppe(50_000, 50_000, false), 'presque-plein');
  assert.equal(etatEnveloppe(50_001, 50_000, false), 'depasse');
  assert.equal(etatEnveloppe(50_000, 50_000, true), 'reglee');
  assert.equal(etatEnveloppe(60_000, 50_000, true), 'depasse');
  assert.equal(etatEnveloppe(0, 0, false), 'normal');
  assert.equal(etatEnveloppe(1, 0, false), 'depasse');
});

test('dates et paramètres invalides refusés', () => {
  assert.throws(() => cycleDe('2026-13-01', 25), RangeError);
  assert.throws(() => cycleDe('2026-02-30', 25), RangeError);
  assert.throws(() => cycleDe('29/10/2026', 25), RangeError);
  assert.throws(() => jourDePaieDuMois(2026, 5, 0), RangeError);
  assert.throws(() => jourDePaieDuMois(2026, 5, 32), RangeError);
  assert.throws(() => depenseDuJour(1000, 0, 100), RangeError);
});
