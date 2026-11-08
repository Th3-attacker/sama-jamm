/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { classeHauteur, classeLargeur } from './classesFenetre.ts';

test('largeur : limites exactes 599/600, 839/840, 1199/1200, 1599/1600', () => {
  assert.equal(classeLargeur(599), 'compacte');
  assert.equal(classeLargeur(600), 'moyenne');
  assert.equal(classeLargeur(839), 'moyenne');
  assert.equal(classeLargeur(840), 'etendue');
  assert.equal(classeLargeur(1199), 'etendue');
  assert.equal(classeLargeur(1200), 'grande');
  assert.equal(classeLargeur(1599), 'grande');
  assert.equal(classeLargeur(1600), 'tresGrande');
});

test('hauteur : limites exactes 479/480 et 899/900', () => {
  assert.equal(classeHauteur(479), 'compacte');
  assert.equal(classeHauteur(480), 'moyenne');
  assert.equal(classeHauteur(899), 'moyenne');
  assert.equal(classeHauteur(900), 'etendue');
});
