/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fractionDePage, pageDePosition, positionDeFraction } from './reglette.ts';

test('réglette : page et fraction, bornes comprises', () => {
  assert.equal(fractionDePage(1, 604), 0);
  assert.equal(fractionDePage(604, 604), 1);
  assert.equal(fractionDePage(0, 604), 0);
  assert.equal(fractionDePage(999, 604), 1);
  assert.ok(Math.abs(fractionDePage(262, 604) - 261 / 603) < 1e-9);
  assert.equal(fractionDePage(5, 1), 0);
});

test('réglette : position vers page, gauche à droite', () => {
  assert.equal(pageDePosition(0, 300, 604, false), 1);
  assert.equal(pageDePosition(300, 300, 604, false), 604);
  assert.equal(pageDePosition(-20, 300, 604, false), 1);
  assert.equal(pageDePosition(400, 300, 604, false), 604);
  assert.equal(pageDePosition(150, 300, 604, false), 303);
  assert.equal(pageDePosition(10, 0, 604, false), 1);
});

test('réglette : de droite à gauche, la page 1 est à droite', () => {
  assert.equal(pageDePosition(300, 300, 604, true), 1);
  assert.equal(pageDePosition(0, 300, 604, true), 604);
  assert.equal(positionDeFraction(0, 300, true), 300);
  assert.equal(positionDeFraction(1, 300, true), 0);
  assert.equal(positionDeFraction(0.25, 400, false), 100);
});
