/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estTropDeTentatives, MESSAGE_TROP_DE_TENTATIVES } from './erreurs.ts';

test('reconnaît l’erreur de limite d’essais renvoyée par Supabase', () => {
  assert.equal(estTropDeTentatives({ code: 'P0001', message: MESSAGE_TROP_DE_TENTATIVES, details: null, hint: null }), true);
});

test('ne confond pas les autres erreurs P0001 ni un autre code', () => {
  assert.equal(estTropDeTentatives({ code: 'P0001', message: 'non connecté' }), false);
  assert.equal(estTropDeTentatives({ code: 'P0001', message: 'khatm inconnu' }), false);
  assert.equal(estTropDeTentatives({ code: '42501', message: MESSAGE_TROP_DE_TENTATIVES }), false);
});

test('rejette les valeurs qui ne sont pas des erreurs Supabase', () => {
  assert.equal(estTropDeTentatives(null), false);
  assert.equal(estTropDeTentatives(undefined), false);
  assert.equal(estTropDeTentatives(MESSAGE_TROP_DE_TENTATIVES), false);
  assert.equal(estTropDeTentatives(new Error(MESSAGE_TROP_DE_TENTATIVES)), false);
  assert.equal(estTropDeTentatives({ code: 'P0001', message: 42 }), false);
});
