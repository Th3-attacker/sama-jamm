/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decisionRappel } from './rappelQuotidien.ts';

const base = { actif: true, heure: 20, enCours: 1, permission: true } as const;

test('programme à l’heure choisie quand tout est réuni', () => {
  assert.deepEqual(decisionRappel(base), { programmer: true, heure: 20, minute: 0 });
  assert.deepEqual(decisionRappel({ ...base, heure: 8, enCours: 3 }), { programmer: true, heure: 8, minute: 0 });
});

test('ne programme rien si le réglage est désactivé', () => {
  assert.deepEqual(decisionRappel({ ...base, actif: false }), { programmer: false });
});

test('ne programme rien sans khatm en cours ou si le nombre est inconnu', () => {
  assert.deepEqual(decisionRappel({ ...base, enCours: 0 }), { programmer: false });
  assert.deepEqual(decisionRappel({ ...base, enCours: null }), { programmer: false });
});

test('ne programme rien sans permission', () => {
  assert.deepEqual(decisionRappel({ ...base, permission: false }), { programmer: false });
});
