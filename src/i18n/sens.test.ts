/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sensDeLangue } from './sens.ts';

test('l’arabe se lit de droite à gauche, y compris avec une région', () => {
  assert.equal(sensDeLangue('ar'), 'rtl');
  assert.equal(sensDeLangue('ar-MR'), 'rtl');
});

test('le français, le wolof et une langue inconnue se lisent de gauche à droite', () => {
  assert.equal(sensDeLangue('fr'), 'ltr');
  assert.equal(sensDeLangue('wo'), 'ltr');
  assert.equal(sensDeLangue('xx'), 'ltr');
  assert.equal(sensDeLangue(undefined), 'ltr');
});

test('un code qui commence seulement par « ar » n’est pas de l’arabe', () => {
  assert.equal(sensDeLangue('arn'), 'ltr');
});
