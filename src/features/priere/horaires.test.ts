/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculerHoraires, OPTIONS_PAR_DEFAUT, prochainePriere, relevementQibla } from './horaires.ts';

// Fuseau fixé : Dakar (UTC+0, sans heure d'été), pour que les dates locales soient identiques partout.
process.env.TZ = 'Africa/Dakar';

const DAKAR = { latitude: 14.6928, longitude: -17.4467 };
const JOUR = new Date(2026, 2, 15, 12, 0); // 15 mars 2026, midi
const minutes = (a: Date, b: Date) => (a.getTime() - b.getTime()) / 60_000;

test('les cinq prières se suivent dans la journée, entre lever et coucher pour Dhuhr et Asr', () => {
  const h = calculerHoraires(DAKAR, JOUR);
  assert.ok(h.fajr < h.lever);
  assert.ok(h.lever < h.dhuhr);
  assert.ok(h.dhuhr < h.asr);
  assert.ok(h.asr < h.coucher);
  assert.ok(h.coucher <= h.maghrib);
  assert.ok(h.maghrib < h.isha);
  for (const d of [h.fajr, h.dhuhr, h.asr, h.maghrib, h.isha]) assert.equal(d.getDate(), 15);
});

test('Dhuhr à Dakar tombe vers 13 h 15, heure locale', () => {
  const { dhuhr } = calculerHoraires(DAKAR, JOUR);
  const attendu = new Date(2026, 2, 15, 13, 15);
  assert.ok(Math.abs(minutes(dhuhr, attendu)) <= 10, `Dhuhr calculé : ${dhuhr.toISOString()}`);
});

test('école hanafite : Asr plus tard, les autres prières inchangées', () => {
  const standard = calculerHoraires(DAKAR, JOUR);
  const hanafite = calculerHoraires(DAKAR, JOUR, { ...OPTIONS_PAR_DEFAUT, ecoleAsr: 'hanafite' });
  assert.ok(minutes(hanafite.asr, standard.asr) > 30);
  assert.equal(hanafite.fajr.getTime(), standard.fajr.getTime());
  assert.equal(hanafite.isha.getTime(), standard.isha.getTime());
});

test('les ajustements en minutes sont appliqués à la prière concernée seulement', () => {
  const base = calculerHoraires(DAKAR, JOUR);
  const ajuste = calculerHoraires(DAKAR, JOUR, {
    ...OPTIONS_PAR_DEFAUT,
    ajustements: { ...OPTIONS_PAR_DEFAUT.ajustements, maghrib: 3, fajr: -2 },
  });
  assert.equal(minutes(ajuste.maghrib, base.maghrib), 3);
  assert.equal(minutes(ajuste.fajr, base.fajr), -2);
  assert.equal(ajuste.dhuhr.getTime(), base.dhuhr.getTime());
});

test('prochaine prière : celle qui suit dans la journée', () => {
  const h = calculerHoraires(DAKAR, JOUR);
  const p = prochainePriere(DAKAR, new Date(h.dhuhr.getTime() + 60_000));
  assert.equal(p.nom, 'asr');
  assert.equal(p.heure.getTime(), h.asr.getTime());
});

test('prochaine prière : entre Fajr et Dhuhr, c’est Dhuhr (jamais Asr)', () => {
  const h = calculerHoraires(DAKAR, JOUR);
  for (const decalage of [60_000, 3 * 3_600_000, h.dhuhr.getTime() - h.fajr.getTime() - 60_000]) {
    const p = prochainePriere(DAKAR, new Date(h.fajr.getTime() + decalage));
    assert.equal(p.nom, 'dhuhr');
    assert.equal(p.heure.getTime(), h.dhuhr.getTime());
  }
});

test('prochaine prière après Isha : Fajr du lendemain', () => {
  const h = calculerHoraires(DAKAR, JOUR);
  const p = prochainePriere(DAKAR, new Date(h.isha.getTime() + 60_000));
  const demain = calculerHoraires(DAKAR, new Date(2026, 2, 16, 12, 0));
  assert.equal(p.nom, 'fajr');
  assert.equal(p.heure.getTime(), demain.fajr.getTime());
});

test('qibla depuis Dakar : environ 74° depuis le nord (grand cercle vers La Mecque)', () => {
  const r = relevementQibla(DAKAR);
  assert.ok(Math.abs(r - 74) < 1, `relèvement calculé : ${r}`);
});
