/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { partEcoulee, tempsAuPoint, cibleAtteinte, tempsAvance } from './barreTemps.ts';

test('temps au point : proportionnel à la largeur, borné aux extrémités', () => {
  assert.equal(tempsAuPoint(150, 300, 600), 300);
  assert.equal(tempsAuPoint(-20, 300, 600), 0);
  assert.equal(tempsAuPoint(400, 300, 600), 600);
});

test('temps au point : 0 sans largeur ni durée connue', () => {
  assert.equal(tempsAuPoint(100, 0, 600), 0);
  assert.equal(tempsAuPoint(100, 300, 0), 0);
  assert.equal(tempsAuPoint(Number.NaN, 300, 600), 0);
});

test('part écoulée : de 0 à 1', () => {
  assert.equal(partEcoulee(30, 120), 0.25);
  assert.equal(partEcoulee(200, 120), 1);
  assert.equal(partEcoulee(10, 0), 0);
});

test('cible : atteinte quand la lecture est proche', () => {
  const c = { valeur: 100 };
  assert.equal(cibleAtteinte(c, 30), false);
  assert.equal(cibleAtteinte(c, 99), true);
  assert.equal(cibleAtteinte(c, 101.4), true);
  assert.equal(cibleAtteinte(c, 102), false);
});

test('avance continue : bornée à la durée, immobile en pause', () => {
  assert.equal(tempsAvance(10, 500, 60, true), 10.5);
  assert.equal(tempsAvance(59.8, 1000, 60, true), 60);
  assert.equal(tempsAvance(10, 500, 60, false), 10);
  assert.equal(tempsAvance(10, 0, 60, true), 10);
});
