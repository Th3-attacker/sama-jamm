/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cleJour, formatHeure, minutesDuJour } from './dates.ts';

// 10 novembre 2026, 19 h 55 UTC : un instant fixe pour tester les fuseaux.
const instant = new Date('2026-11-10T19:55:00Z');

test('formatHeure dans le fuseau de la ville : Nouakchott est UTC+0 toute l’année', () => {
  assert.equal(formatHeure(instant, 'Africa/Nouakchott'), '19:55');
});

test('formatHeure dans un autre fuseau : Paris (UTC+1 en novembre) ajoute une heure', () => {
  assert.equal(formatHeure(instant, 'Europe/Paris'), '20:55');
});

test('minutesDuJour suit le fuseau demandé', () => {
  assert.equal(minutesDuJour(instant, 'Africa/Nouakchott'), 19 * 60 + 55);
  assert.equal(minutesDuJour(instant, 'Europe/Paris'), 20 * 60 + 55);
});

test('cleJour : le jour change selon le fuseau à minuit', () => {
  const avantMinuit = new Date('2026-11-10T23:30:00Z');
  assert.equal(cleJour(avantMinuit, 'Africa/Nouakchott'), '2026-11-10');
  assert.equal(cleJour(avantMinuit, 'Europe/Paris'), '2026-11-11');
});

test('fuseau inconnu : repli sur le fuseau du téléphone sans lever d’erreur', () => {
  const sansFuseau = formatHeure(instant);
  assert.equal(formatHeure(instant, 'Mars/Olympus_Mons'), sansFuseau);
});
