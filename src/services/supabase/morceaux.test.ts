/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { assembler, creerStockageSession, decouper, OCTETS_PAR_MORCEAU } from './morceaux.ts';

const octets = (texte: string) => new TextEncoder().encode(texte).length;

function faux(ancienInitial: Record<string, string> = {}) {
  const coffre = new Map<string, string>();
  const vieux = new Map(Object.entries(ancienInitial));
  const avertissements: string[] = [];
  let panne = false;
  const stockage = creerStockageSession(
    {
      lire: async (cle) => coffre.get(cle) ?? null,
      ecrire: async (cle, valeur) => {
        if (panne) throw new Error('Trousseau indisponible');
        coffre.set(cle, valeur);
      },
      effacer: async (cle) => void coffre.delete(cle),
    },
    { lire: (cle) => vieux.get(cle) ?? null, effacer: (cle) => void vieux.delete(cle) },
    (message) => void avertissements.push(message),
  );
  return { stockage, coffre, vieux, avertissements, enPanne: (v: boolean) => void (panne = v) };
}

test('découper : chaque morceau tient sous la limite, le texte est retrouvé à l’identique', () => {
  const texte = `${'a'.repeat(5000)}é${'ب'.repeat(700)}${'😀'.repeat(300)}`;
  const morceaux = decouper(texte);
  assert.ok(morceaux.length > 1);
  for (const m of morceaux) assert.ok(octets(m) <= OCTETS_PAR_MORCEAU);
  assert.equal(assembler(morceaux), texte);
});

test('découper : texte vide, texte court, émoji jamais coupé, taille invalide', () => {
  assert.deepEqual(decouper(''), []);
  assert.deepEqual(decouper('abc'), ['abc']);
  assert.deepEqual(decouper('😀😀😀', 4), ['😀', '😀', '😀']);
  assert.deepEqual(decouper('ééé', 4), ['éé', 'é']);
  assert.throws(() => decouper('abc', 0), RangeError);
});

test('session : écrite en morceaux, relue entière, effacée sans reste', async () => {
  const { stockage, coffre } = faux();
  const session = 'x'.repeat(5000);
  await stockage.setItem('jeton', session);
  assert.equal(coffre.get('jeton.n'), '3');
  assert.equal(await stockage.getItem('jeton'), session);
  await stockage.removeItem('jeton');
  assert.equal(coffre.size, 0);
  assert.equal(await stockage.getItem('jeton'), null);
});

test('session : une valeur plus courte ne laisse pas d’anciens morceaux', async () => {
  const { stockage, coffre } = faux();
  await stockage.setItem('jeton', 'x'.repeat(5000));
  await stockage.setItem('jeton', 'court');
  assert.deepEqual([...coffre.keys()].sort(), ['jeton.0', 'jeton.n']);
  assert.equal(await stockage.getItem('jeton'), 'court');
});

test('session : celle de l’ancien stockage est déplacée une fois, puis retirée de l’ancien', async () => {
  const { stockage, coffre, vieux } = faux({ jeton: 'ancienne' });
  assert.equal(await stockage.getItem('jeton'), 'ancienne');
  assert.equal(vieux.size, 0);
  assert.equal(coffre.get('jeton.0'), 'ancienne');
  assert.equal(await stockage.getItem('jeton'), 'ancienne');
});

test('session : déplacement impossible, elle reste lisible et l’ancien stockage est gardé', async () => {
  const { stockage, vieux, avertissements, enPanne } = faux({ jeton: 'ancienne' });
  enPanne(true);
  assert.equal(await stockage.getItem('jeton'), 'ancienne');
  assert.equal(vieux.get('jeton'), 'ancienne');
  assert.equal(avertissements.length, 1);
  enPanne(false);
  assert.equal(await stockage.getItem('jeton'), 'ancienne');
  assert.equal(vieux.size, 0);
});

test('session : morceau manquant ou compteur invalide, rien n’est renvoyé', async () => {
  const { stockage, coffre, avertissements } = faux();
  await stockage.setItem('jeton', 'x'.repeat(5000));
  coffre.delete('jeton.1');
  assert.equal(await stockage.getItem('jeton'), null);
  coffre.set('jeton.n', 'abc');
  assert.equal(await stockage.getItem('jeton'), null);
  assert.equal(avertissements.length, 2);
});

test('session : écriture interrompue, session absente plutôt que mélangée ; l’ancienne copie ne revient pas', async () => {
  const { stockage, vieux, enPanne } = faux({ jeton: 'ancienne' });
  await stockage.getItem('jeton');
  enPanne(true);
  await assert.rejects(stockage.setItem('jeton', 'nouvelle'));
  enPanne(false);
  assert.equal(vieux.size, 0);
  assert.equal(await stockage.getItem('jeton'), null);
});
