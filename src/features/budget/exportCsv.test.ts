/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MRU, XOF } from '../../lib/montant.ts';
import { celluleCsv, montantDecimal, versCsv, type EntetesExport } from './exportCsv.ts';

const ENTETES: EntetesExport = {
  date: 'Date',
  type: 'Type',
  enveloppe: 'Enveloppe',
  compte: 'Compte',
  compteDestination: 'Vers',
  objectif: 'Objectif',
  montant: 'Montant',
  devise: 'Devise',
  note: 'Note',
};

test('montant exact en unités principales, point décimal', () => {
  assert.equal(montantDecimal(2500, XOF), '2500');
  assert.equal(montantDecimal(92_501, MRU), '18500.2');
  assert.equal(montantDecimal(1250, { sousUnites: 100 }), '12.5');
  assert.equal(montantDecimal(5, { sousUnites: 100 }), '0.05');
  assert.equal(montantDecimal(-300, { sousUnites: 100 }), '-3');
});

test('cellule : guillemets si besoin, formules neutralisées', () => {
  assert.equal(celluleCsv('Riz'), 'Riz');
  assert.equal(celluleCsv('Riz, huile'), '"Riz, huile"');
  assert.equal(celluleCsv('dit "oui"'), '"dit ""oui"""');
  assert.equal(celluleCsv('ligne\nsuivante'), '"ligne\nsuivante"');
  assert.equal(celluleCsv('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(celluleCsv('+221 77'), "'+221 77");
  assert.equal(celluleCsv('@moi'), "'@moi");
});

test('fichier : BOM, en-têtes, une ligne par opération, montants laissés en nombres', () => {
  const csv = versCsv(
    [
      {
        date: '2026-10-29',
        type: 'depense',
        enveloppe: 'Dépense quotidienne',
        compte: 'Espèces',
        compteDestination: null,
        objectif: null,
        montant: 2500,
        note: '=1+1',
      },
    ],
    XOF,
    'XOF',
    ENTETES,
    (t) => (t === 'depense' ? 'Dépense' : t),
  );
  assert.equal(
    csv,
    '﻿Date,Type,Enveloppe,Compte,Vers,Objectif,Montant,Devise,Note\r\n' +
      "2026-10-29,Dépense,Dépense quotidienne,Espèces,,,2500,XOF,'=1+1\r\n",
  );
});
