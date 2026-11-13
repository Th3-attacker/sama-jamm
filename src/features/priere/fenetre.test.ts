/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { NomPriere, Son } from '@/stores/reglages';

import { construireFenetre, dateRelance, PLACES, type Planifiee } from './fenetre.ts';
import { calculerHoraires, OPTIONS_PAR_DEFAUT } from './horaires.ts';

// Fuseau fixé : Dakar (UTC+0, sans heure d'été), pour que les dates locales soient identiques partout.
process.env.TZ = 'Africa/Dakar';

const DAKAR = { latitude: 14.6928, longitude: -17.4467 };
const tout = <T>(v: T): Record<NomPriere, T> => ({ fajr: v, dhuhr: v, asr: v, maghrib: v, isha: v });

const entree = (surcharge: Partial<Parameters<typeof construireFenetre>[0]> = {}) => ({
  lieu: DAKAR,
  options: OPTIONS_PAR_DEFAUT,
  rappels: tout(true),
  sons: tout<Son>('complet'),
  rappelAvant: tout<number | null>(null),
  depuis: new Date(2026, 2, 15, 12, 0),
  ...surcharge,
});

test('tous les rappels coupés : rien à programmer', () => {
  assert.deepEqual(construireFenetre(entree({ rappels: tout(false) })), []);
});

test('jamais plus de PLACES notifications, même avec un rappel avant chaque prière', () => {
  const liste = construireFenetre(entree({ rappelAvant: tout<number | null>(10) }));
  assert.equal(liste.length, PLACES);
});

test('ordre chronologique, rien dans le passé, identifiants uniques', () => {
  const e = entree({ rappelAvant: tout<number | null>(15) });
  const liste = construireFenetre(e);
  for (let i = 1; i < liste.length; i++) assert.ok(liste[i - 1]!.date <= liste[i]!.date);
  assert.ok(liste.every((n) => n.date > e.depuis));
  assert.equal(new Set(liste.map((n) => n.id)).size, liste.length);
});

test('le jour entamé ne garde que les prières à venir', () => {
  const liste = construireFenetre(entree());
  // À midi, Fajr du 15 est passé : la première notification du 15 est Dhuhr.
  assert.equal(liste[0]!.id, 'priere-2026-03-15-dhuhr');
  assert.ok(!liste.some((n) => n.id === 'priere-2026-03-15-fajr'));
});

test('un rappel « 10 minutes avant » tombe 10 minutes avant la prière, avec son son', () => {
  const e = entree({
    rappels: { ...tout(false), asr: true },
    rappelAvant: { ...tout<number | null>(null), asr: 10 },
    sons: { ...tout<Son>('complet'), asr: 'doux' },
  });
  const liste = construireFenetre(e);
  const h = calculerHoraires(DAKAR, e.depuis);
  const rappel = liste.find((n) => n.id === 'rappel-2026-03-15-asr');
  const appel = liste.find((n) => n.id === 'priere-2026-03-15-asr');
  assert.ok(rappel && appel);
  assert.equal(rappel.type, 'rappel');
  assert.equal(rappel.minutes, 10);
  assert.equal(rappel.son, 'doux');
  assert.equal(appel.date.getTime(), h.asr.getTime());
  assert.equal(appel.date.getTime() - rappel.date.getTime(), 10 * 60_000);
  assert.ok(liste.every((n) => n.priere === 'asr'));
});

test('une seule prière active : la fenêtre couvre au plus JOURS_MAX jours', () => {
  const liste = construireFenetre(entree({ rappels: { ...tout(false), maghrib: true } }));
  // 12 jours + 1 jour entamé, Maghrib du 15 encore à venir à midi : 13 notifications.
  assert.equal(liste.length, 13);
});

test('identifiants stables : deux calculs à quelques minutes d’écart donnent les mêmes ids', () => {
  const a = construireFenetre(entree()).map((n) => n.id);
  const b = construireFenetre(entree({ depuis: new Date(2026, 2, 15, 12, 5) })).map((n) => n.id);
  assert.deepEqual(a, b);
});

const planifiee = (date: Date): Planifiee => ({ id: 'priere-x', type: 'appel', priere: 'fajr', date, son: 'complet' });

test('relance : 24 h avant la dernière notification de la fenêtre', () => {
  const fin = planifiee(new Date(2026, 2, 22, 15, 30));
  assert.deepEqual(dateRelance([planifiee(new Date(2026, 2, 16, 5, 0)), fin], new Date(2026, 2, 15, 12, 0)), new Date(2026, 2, 21, 15, 30));
});

test('relance : jamais la nuit, ramenée à 9 h', () => {
  const maintenant = new Date(2026, 2, 15, 12, 0);
  // 24 h avant 05:10 = 05:10 la veille : trop tôt, 9 h le même jour.
  assert.deepEqual(dateRelance([planifiee(new Date(2026, 2, 22, 5, 10))], maintenant), new Date(2026, 2, 21, 9, 0));
  // 24 h avant 21:30 = 21:30 la veille : trop tard, 9 h le lendemain (donc le jour de la dernière).
  assert.deepEqual(dateRelance([planifiee(new Date(2026, 2, 22, 21, 30))], maintenant), new Date(2026, 2, 22, 9, 0));
});

test('relance : rien sans fenêtre, ni si la date est dans moins d’une heure', () => {
  const maintenant = new Date(2026, 2, 15, 12, 0);
  assert.equal(dateRelance([], maintenant), null);
  assert.equal(dateRelance([planifiee(new Date(2026, 2, 16, 12, 30))], maintenant), null);
});
