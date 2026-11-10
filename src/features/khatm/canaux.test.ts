/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { creerRegistreCanaux } from './canaux.ts';

function faux() {
  const journal: string[] = [];
  const diffuseurs = new Map<string, () => void>();
  const registre = creerRegistreCanaux((id, surChangement) => {
    journal.push(`ouvre ${id}`);
    diffuseurs.set(id, surChangement);
    return () => {
      journal.push(`ferme ${id}`);
      diffuseurs.delete(id);
    };
  });
  return { registre, journal, changer: (id: string) => diffuseurs.get(id)?.() };
}

test('canaux : deux écrans sur le même khatm, un seul canal ouvert', () => {
  const { registre, journal } = faux();
  registre.abonner('k1', () => undefined);
  registre.abonner('k1', () => undefined);
  assert.deepEqual(journal, ['ouvre k1']);
});

test('canaux : un changement prévient tous les abonnés du khatm, pas les autres', () => {
  const { registre, changer } = faux();
  const recus: string[] = [];
  registre.abonner('k1', () => recus.push('accueil'));
  registre.abonner('k1', () => recus.push('khatm'));
  registre.abonner('k2', () => recus.push('autre'));
  changer('k1');
  assert.deepEqual(recus, ['accueil', 'khatm']);
});

test('canaux : fermé au départ du dernier abonné seulement', () => {
  const { registre, journal } = faux();
  const quitterA = registre.abonner('k1', () => undefined);
  const quitterB = registre.abonner('k1', () => undefined);
  quitterA();
  assert.deepEqual(journal, ['ouvre k1']);
  quitterB();
  assert.deepEqual(journal, ['ouvre k1', 'ferme k1']);
});

test('canaux : le premier écran parti ne coupe pas les mises à jour du second', () => {
  const { registre, changer } = faux();
  const recus: string[] = [];
  const quitterA = registre.abonner('k1', () => recus.push('a'));
  registre.abonner('k1', () => recus.push('b'));
  quitterA();
  changer('k1');
  assert.deepEqual(recus, ['b']);
});

test('canaux : après la fermeture, un nouvel abonné rouvre un canal neuf', () => {
  const { registre, journal } = faux();
  registre.abonner('k1', () => undefined)();
  registre.abonner('k1', () => undefined);
  assert.deepEqual(journal, ['ouvre k1', 'ferme k1', 'ouvre k1']);
});

test('canaux : se désabonner deux fois ne ferme pas le canal d’un autre écran', () => {
  const { registre, journal } = faux();
  const quitterA = registre.abonner('k1', () => undefined);
  registre.abonner('k1', () => undefined);
  quitterA();
  quitterA();
  assert.deepEqual(journal, ['ouvre k1']);
});

test('canaux : le même rappel donné par deux écrans reste compté deux fois', () => {
  const { registre, journal } = faux();
  const rappel = () => undefined;
  const quitterA = registre.abonner('k1', rappel);
  registre.abonner('k1', rappel);
  quitterA();
  assert.deepEqual(journal, ['ouvre k1']);
});

test('canaux : un rappel qui se désabonne pendant la diffusion ne prive pas les suivants', () => {
  const { registre, changer } = faux();
  const recus: string[] = [];
  const quitterA = registre.abonner('k1', () => {
    recus.push('a');
    quitterA();
  });
  registre.abonner('k1', () => recus.push('b'));
  changer('k1');
  assert.deepEqual(recus, ['a', 'b']);
});
