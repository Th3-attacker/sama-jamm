import assert from 'node:assert/strict';
import { test } from 'node:test';

import { titreInvocation } from './titre.ts';

const t = (n: number) => `invocations.numero:${n}`;

test('titre numéroté : reconstruit dans la langue de l’interface', () => {
  assert.equal(titreInvocation('Invocation 12', t), 'invocations.numero:12');
});

test('autre titre : rendu tel quel', () => {
  assert.equal(titreInvocation('Ayat al-Kursi', t), 'Ayat al-Kursi');
  assert.equal(titreInvocation('Invocation', t), 'Invocation');
});
