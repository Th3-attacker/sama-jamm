import assert from 'node:assert/strict';
import { test } from 'node:test';

import { echelleSuivante, PLANCHER } from './echelleCarte.ts';

test('le contenu tient : l’échelle ne change pas', () => {
  assert.equal(echelleSuivante(200, 300, 1), 1);
  assert.equal(echelleSuivante(300, 300, 0.8), 0.8);
});

test('le contenu déborde : l’échelle diminue, jamais sous le plancher', () => {
  const e = echelleSuivante(600, 300, 1);
  assert.ok(e < 1 && e >= PLANCHER);
  assert.equal(echelleSuivante(5000, 300, 0.4), PLANCHER);
});

test('mesures inconnues ou invalides : échelle inchangée', () => {
  assert.equal(echelleSuivante(0, 300, 1), 1);
  assert.equal(echelleSuivante(300, 0, 1), 1);
  assert.equal(echelleSuivante(Number.NaN, 300, 0.7), 0.7);
});

test('la boucle converge : en répétant, le texte finit par tenir ou atteint le plancher', () => {
  // Hauteur simulée proportionnelle à l'échelle (cas le plus défavorable : le texte se replie moins vite).
  const hauteur = (e: number) => 900 * e;
  let e = 1;
  for (let i = 0; i < 20; i++) e = echelleSuivante(hauteur(e), 300, e);
  assert.ok(hauteur(e) <= 300 || e === PLANCHER);
});
