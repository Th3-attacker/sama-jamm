/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { comparerFenetre } from './comparaison.ts';

const v = (id: string, empreinte = `e-${id}`) => ({ id, empreinte });

test('rien ne change : aucune annulation, aucune programmation', () => {
  const r = comparerFenetre(new Set(['a', 'b']), { a: 'e-a', b: 'e-b' }, [v('a'), v('b')]);
  assert.deepEqual(r, { annuler: [], programmer: [] });
});

test('la fenêtre glisse : la notification passée part, la nouvelle arrive', () => {
  const r = comparerFenetre(new Set(['a', 'b']), { a: 'e-a', b: 'e-b' }, [v('b'), v('c')]);
  assert.deepEqual(r, { annuler: ['a'], programmer: ['c'] });
});

test('son, heure ou langue changés : la notification est remplacée', () => {
  const r = comparerFenetre(new Set(['a', 'b']), { a: 'e-a', b: 'e-b' }, [v('a', 'nouvelle'), v('b')]);
  assert.deepEqual(r, { annuler: ['a'], programmer: ['a'] });
});

test('empreintes perdues : tout est reprogrammé', () => {
  const r = comparerFenetre(new Set(['a', 'b']), {}, [v('a'), v('b')]);
  assert.deepEqual(r, { annuler: ['a', 'b'], programmer: ['a', 'b'] });
});

test('notification retirée par le système : elle est reprogrammée', () => {
  const r = comparerFenetre(new Set(['b']), { a: 'e-a', b: 'e-b' }, [v('a'), v('b')]);
  assert.deepEqual(r, { annuler: [], programmer: ['a'] });
});

test('plus rien de voulu (rappels coupés) : tout est annulé', () => {
  const r = comparerFenetre(new Set(['a', 'b']), { a: 'e-a', b: 'e-b' }, []);
  assert.deepEqual(r, { annuler: ['a', 'b'], programmer: [] });
});
