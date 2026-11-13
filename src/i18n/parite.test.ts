/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

type Arbre = { [cle: string]: string | Arbre };

function lire(langue: string): Arbre {
  return JSON.parse(readFileSync(new URL(`./${langue}.json`, import.meta.url), 'utf-8')) as Arbre;
}

/** Chemins de toutes les feuilles : « budget.enveloppesDefaut.loyer ». */
function feuilles(arbre: Arbre, prefixe = ''): Map<string, string> {
  const sortie = new Map<string, string>();
  for (const [cle, valeur] of Object.entries(arbre)) {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle;
    if (typeof valeur === 'string') sortie.set(chemin, valeur);
    else for (const [c, v] of feuilles(valeur, chemin)) sortie.set(c, v);
  }
  return sortie;
}

const variables = (texte: string) => (texte.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort();
const balises = (texte: string) => (texte.match(/<\/?\w+>/g) ?? []).sort();

const fr = feuilles(lire('fr'));
const en = feuilles(lire('en'));

test('l’anglais a exactement les mêmes clés que le français', () => {
  assert.deepEqual([...fr.keys()].filter((c) => !en.has(c)), [], 'clés manquantes en anglais');
  assert.deepEqual([...en.keys()].filter((c) => !fr.has(c)), [], 'clés en trop en anglais');
});

test('chaque texte anglais garde les mêmes variables et balises que le français', () => {
  const differentes = [...fr].filter(([cle, texte]) => {
    const anglais = en.get(cle) ?? '';
    return variables(texte).join() !== variables(anglais).join() || balises(texte).join() !== balises(anglais).join();
  });
  assert.deepEqual(differentes.map(([cle]) => cle), []);
});

test('aucun texte anglais n’est vide', () => {
  assert.deepEqual([...en].filter(([, texte]) => texte.trim() === '').map(([cle]) => cle), []);
});
