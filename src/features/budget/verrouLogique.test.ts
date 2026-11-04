/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DELAI_VERROU_MS, doitReverrouiller, montantAffiche } from './verrouLogique.ts';

test('le verrou retombe après 5 minutes en arrière-plan, pas avant', () => {
  const quitte = 1_000_000;
  assert.equal(doitReverrouiller(null, quitte), false);
  assert.equal(doitReverrouiller(quitte, quitte + DELAI_VERROU_MS - 1), false);
  assert.equal(doitReverrouiller(quitte, quitte + DELAI_VERROU_MS), true);
  assert.equal(doitReverrouiller(quitte, quitte + 60 * 60 * 1000), true);
});

test('montants masqués : « ••• » à la place du montant', () => {
  assert.equal(montantAffiche('2 500 F CFA', false), '2 500 F CFA');
  assert.equal(montantAffiche('2 500 F CFA', true), '•••');
});
