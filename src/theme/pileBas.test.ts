/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculerPile } from './pileBas.ts';
import { echelleEspace, miseEnPage, tailleArabe, tailleTexte } from './tokens.generated.ts';

// Tableau du design 18 : pile retenue = barre + mini 40 + compteur, écarts de 8 compris.
const appareils = [
  { nom: 'iPhone SE', h: 667, barre: 70, total: 198, mini: 40 },
  { nom: 'iPhone 17', h: 852, barre: 83, total: 211, mini: 40 },
  { nom: 'iPhone Pro Max', h: 956, barre: 83, total: 211, mini: 40 },
  { nom: 'Android 412×915', h: 915, barre: 104, total: 232, mini: 40 },
];
for (const a of appareils) {
  test(`pile mini + compteur : ${a.nom}`, () => {
    const p = calculerPile({ hauteurFenetre: a.h, hauteurBarre: a.barre, miniActif: true, outil: 'compteur' });
    assert.equal(p.total, a.total);
    assert.equal(p.mini, a.mini);
    assert.equal(p.miniRange, false);
    assert.equal(p.margeContenu, a.total + 16);
  });
}

test('plafond de 35 % : Android 360×640 range le mini-lecteur (208)', () => {
  const p = calculerPile({ hauteurFenetre: 640, hauteurBarre: 128, miniActif: true, outil: 'compteur' });
  assert.equal(p.miniRange, true);
  assert.equal(p.mini, 0);
  assert.equal(p.total, 208);
});

test('plafond : pile exactement égale à 35 % reste visible, un point de plus la range', () => {
  // barre 100 + 8 + mini 56 = 164 ; 164 / 0,35 = 468,57
  const sur = calculerPile({ hauteurFenetre: 469, hauteurBarre: 100, miniActif: true, outil: 'aucun' });
  assert.equal(sur.miniRange, false);
  const sous = calculerPile({ hauteurFenetre: 468, hauteurBarre: 100, miniActif: true, outil: 'aucun' });
  assert.equal(sous.miniRange, true);
});

test('mini-lecteur seul : 56, sans audio : barre seule', () => {
  assert.equal(calculerPile({ hauteurFenetre: 852, hauteurBarre: 83, miniActif: true, outil: 'aucun' }).total, 83 + 8 + 56);
  assert.equal(calculerPile({ hauteurFenetre: 852, hauteurBarre: 83, miniActif: false, outil: 'aucun' }).total, 83);
});

test('pilule : 48 posée à 16 au-dessus de la couche du dessous', () => {
  const p = calculerPile({ hauteurFenetre: 852, hauteurBarre: 83, miniActif: false, outil: 'pilule' });
  assert.equal(p.total, 83 + 16 + 48);
});

test('échelles fermées : tailles de texte, arabe et espacements du design', () => {
  assert.deepEqual([...tailleTexte], [12, 14, 16, 18, 24, 30, 40, 44, 56]);
  assert.deepEqual([...tailleArabe], [22, 28, 34]);
  assert.deepEqual([...echelleEspace], [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128]);
  assert.equal(miseEnPage.plafondPile, 0.35);
});

test('dessous de l\'outil : barre + écart + mini, sans le compteur', () => {
  const p = calculerPile({ hauteurFenetre: 852, hauteurBarre: 83, miniActif: true, outil: 'compteur' });
  assert.equal(p.dessousOutil, 83 + 8 + 40);
  const seul = calculerPile({ hauteurFenetre: 852, hauteurBarre: 83, miniActif: false, outil: 'compteur' });
  assert.equal(seul.dessousOutil, 83);
});

test('mini-lecteur agrandi par le texte : la hauteur mesurée prime sur la cible', () => {
  const p = calculerPile({ hauteurFenetre: 852, hauteurBarre: 83, miniActif: true, outil: 'aucun', miniMesure: 80 });
  assert.equal(p.mini, 80);
  assert.equal(p.total, 83 + 8 + 80);
});
