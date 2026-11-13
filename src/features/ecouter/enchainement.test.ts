/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sourateSuivante } from './enchainement.ts';

const trois = [{ sourate: 108 }, { sourate: 108 }, { sourate: 108 }];
const base = { pistes: trois, repeterSourate: false, minuterie: { type: 'aucune' } as const };

test('la sourate suivante est ajoutée sur les deux dernières pistes', () => {
  assert.equal(sourateSuivante({ ...base, index: 1 }), 109);
  assert.equal(sourateSuivante({ ...base, index: 2 }), 109);
});

test('rien n’est ajouté tant que la fin est loin', () => {
  assert.equal(sourateSuivante({ ...base, index: 0 }), null);
});

test('« répéter la sourate » et la minuterie de fin de sourate gardent leur arrêt', () => {
  assert.equal(sourateSuivante({ ...base, index: 2, repeterSourate: true }), null);
  assert.equal(sourateSuivante({ ...base, index: 2, minuterie: { type: 'finSourate' } }), null);
});

test('une minuterie de durée n’empêche pas l’enchaînement', () => {
  assert.equal(sourateSuivante({ ...base, index: 2, minuterie: { type: 'duree', finA: 1 } }), 109);
});

test('après la sourate 114, la lecture s’arrête', () => {
  assert.equal(sourateSuivante({ ...base, pistes: [{ sourate: 114 }, { sourate: 114 }], index: 1 }), null);
});

test('une file déjà enchaînée continue avec la suivante de la dernière', () => {
  const deux = [{ sourate: 1 }, { sourate: 1 }, { sourate: 2 }, { sourate: 2 }, { sourate: 2 }];
  assert.equal(sourateSuivante({ ...base, pistes: deux, index: 2 }), null);
  assert.equal(sourateSuivante({ ...base, pistes: deux, index: 3 }), 3);
});

test('file vide : rien à ajouter', () => {
  assert.equal(sourateSuivante({ ...base, pistes: [], index: 0 }), null);
});
