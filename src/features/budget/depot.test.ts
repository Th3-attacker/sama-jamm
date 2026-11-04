/// <reference types="node" />
import assert from 'node:assert/strict';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { test } from 'node:test';

import { creerDepot, SaisieInvalide, type Carnet, type Parametre, type Sql } from './depot.ts';
import { migrations } from './schema.ts';

/** Même interface que dans l'app, sur SQLite en mémoire. */
function sqlEnMemoire(): Sql {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const m of migrations) db.exec(m);
  db.exec(`
    INSERT INTO devises VALUES ('XOF','Franc CFA','F CFA','apres',0,1,0);
    INSERT INTO devises VALUES ('MRU','Ouguiya','UM','apres',0,5,0);
  `);
  const p = (ps: Parametre[]) => ps as SQLInputValue[];
  return {
    tous: async <T>(r: string, ...ps: Parametre[]) => db.prepare(r).all(...p(ps)) as T[],
    premier: async <T>(r: string, ...ps: Parametre[]) => (db.prepare(r).get(...p(ps)) as T | undefined) ?? null,
    executer: async (r: string, ...ps: Parametre[]) => {
      db.prepare(r).run(...p(ps));
    },
    transaction: async (travail) => {
      db.exec('BEGIN');
      try {
        await travail();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}

function monde(jourInitial = '2026-10-29') {
  let n = 0;
  let jour = jourInitial;
  const sql = sqlEnMemoire();
  const depot = creerDepot(sql, {
    nouvelId: () => `id-${String(++n).padStart(4, '0')}`,
    aujourdhui: () => jour,
    horodatage: () => `${jour}T10:00:00Z`,
  });
  return { sql, depot, allerAu: (j: string) => (jour = j) };
}

async function carnetExemple(depot: ReturnType<typeof monde>['depot']): Promise<Carnet> {
  await depot.creerCarnet({
    nom: 'Foyer',
    deviseCode: 'XOF',
    jourPaie: 25,
    revenu: 350_000,
    nomCompte: 'Espèces',
    enveloppes: [
      { nom: 'Dépense quotidienne', icone: 'cart', fixe: false, plafond: 150_000 },
      { nom: 'Loyer', icone: 'home', fixe: true, plafond: 100_000 },
      { nom: 'Transport', icone: 'car', fixe: false, plafond: 30_000 },
    ],
  });
  const carnet = await depot.carnetActif();
  assert.ok(carnet);
  return carnet;
}

test('sans carnet : rien à afficher', async () => {
  const { depot } = monde();
  assert.equal(await depot.carnetActif(), null);
});

test('créer un carnet : devise, compte, cycle, enveloppes et revenu', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  assert.equal(carnet.devise.code, 'XOF');
  assert.equal(carnet.jourPaie, 25);
  assert.deepEqual(
    (await depot.comptes(carnet.id)).map((c) => [c.nom, c.type]),
    [['Espèces', 'especes']],
  );
  const mois = await depot.mois(carnet);
  assert.deepEqual([mois.cycle.debut, mois.cycle.fin], ['2026-10-25', '2026-11-24']);
  assert.equal(mois.recu, 350_000);
  assert.equal(mois.depense, 0);
  assert.deepEqual(
    mois.enveloppes.map((e) => [e.nom, e.plafond, e.depense, e.fixe]),
    [
      ['Dépense quotidienne', 150_000, 0, false],
      ['Loyer', 100_000, 0, true],
      ['Transport', 30_000, 0, false],
    ],
  );
  // Le loyer n'est pas encore payé : il est réservé avant la dépense du jour.
  assert.equal(mois.chargesFixesNonReglees, 100_000);
});

test('ajouter des dépenses : totaux du mois et de chaque enveloppe', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const [quotidien, loyer] = (await depot.mois(carnet)).enveloppes;
  assert.ok(quotidien && loyer);
  const [compte] = await depot.comptes(carnet.id);
  await depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 2_500,
    enveloppeId: quotidien.id,
    compteId: compte?.id ?? null,
    note: ' Pain ',
  });
  await depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 100_000,
    enveloppeId: loyer.id,
    compteId: null,
    note: '',
  });
  const mois = await depot.mois(carnet);
  assert.equal(mois.depense, 102_500);
  assert.equal(mois.enveloppes[0]?.depense, 2_500);
  assert.equal(mois.chargesFixesNonReglees, 0);
  const detail = await depot.detailEnveloppe(carnet, quotidien.id);
  assert.deepEqual(
    detail?.operations.map((o) => [o.montant, o.note, o.compte]),
    [[2_500, 'Pain', 'Espèces']],
  );
});

test('une dépense nulle, non entière ou sur une enveloppe inconnue est refusée', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const env = (await depot.mois(carnet)).enveloppes[0];
  assert.ok(env);
  const base = { carnetId: carnet.id, enveloppeId: env.id, compteId: null, note: null };
  await assert.rejects(depot.ajouterDepense(carnet, { ...base, montant: 0 }), SaisieInvalide);
  await assert.rejects(depot.ajouterDepense(carnet, { ...base, montant: 12.5 }), SaisieInvalide);
  await assert.rejects(depot.ajouterDepense(carnet, { ...base, montant: 100, enveloppeId: 'absente' }), SaisieInvalide);
  assert.equal((await depot.mois(carnet)).depense, 0);
});

test('nouveau cycle : créé à la date, plafonds repris, dépenses remises à zéro', async () => {
  const w = monde();
  const carnet = await carnetExemple(w.depot);
  const env = (await w.depot.mois(carnet)).enveloppes[0];
  assert.ok(env);
  await w.depot.modifierPlafond(carnet, env.id, 120_000);
  await w.depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 5_000,
    enveloppeId: env.id,
    compteId: null,
    note: null,
  });
  w.allerAu('2026-11-25');
  const mois = await w.depot.mois(carnet);
  assert.deepEqual([mois.cycle.debut, mois.cycle.fin], ['2026-11-25', '2026-12-24']);
  assert.equal(mois.recu, 0);
  assert.equal(mois.depense, 0);
  assert.deepEqual(
    mois.enveloppes.map((e) => e.plafond),
    [120_000, 100_000, 30_000],
  );
  // Revenir dans le même cycle ne le recrée pas.
  const deNouveau = await w.depot.mois(carnet);
  assert.equal(deNouveau.cycle.id, mois.cycle.id);
});

test('modifier un plafond : entier positif ou nul seulement', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const env = (await depot.mois(carnet)).enveloppes[2];
  assert.ok(env);
  await depot.modifierPlafond(carnet, env.id, 0);
  assert.equal((await depot.mois(carnet)).enveloppes[2]?.plafond, 0);
  await assert.rejects(depot.modifierPlafond(carnet, env.id, -1), SaisieInvalide);
});

test("créer un carnet : saisies invalides refusées, rien d'écrit", async () => {
  const { depot } = monde();
  const base = { nom: 'Foyer', deviseCode: 'XOF', revenu: 0, nomCompte: 'Espèces', enveloppes: [] };
  await assert.rejects(depot.creerCarnet({ ...base, jourPaie: 0 }), SaisieInvalide);
  await assert.rejects(depot.creerCarnet({ ...base, jourPaie: 32 }), SaisieInvalide);
  await assert.rejects(depot.creerCarnet({ ...base, jourPaie: 25, revenu: -1 }), SaisieInvalide);
  await assert.rejects(
    depot.creerCarnet({ ...base, jourPaie: 25, enveloppes: [{ nom: 'X', icone: 'cart', fixe: false, plafond: 1.5 }] }),
    SaisieInvalide,
  );
  // Devise inconnue : la transaction est annulée en entier.
  await assert.rejects(depot.creerCarnet({ ...base, jourPaie: 25, deviseCode: 'ZZZ' }));
  assert.equal(await depot.carnetActif(), null);
});

test('ouguiya : le carnet garde sa devise et ses sous-unités', async () => {
  const { depot } = monde();
  await depot.creerCarnet({
    nom: 'Foyer',
    deviseCode: 'MRU',
    jourPaie: 1,
    revenu: 92_500,
    nomCompte: 'Espèces',
    enveloppes: [],
  });
  const carnet = await depot.carnetActif();
  assert.equal(carnet?.devise.sousUnites, 5);
  assert.equal(carnet && (await depot.mois(carnet)).recu, 92_500);
});

test('modifier une dépense : montant, enveloppe et note ; les deux enveloppes suivent', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const [quotidien, , transport] = (await depot.mois(carnet)).enveloppes;
  assert.ok(quotidien && transport);
  await depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 2_500,
    enveloppeId: quotidien.id,
    compteId: null,
    note: 'Pain',
  });
  const [op] = (await depot.detailEnveloppe(carnet, quotidien.id))?.operations ?? [];
  assert.ok(op);
  await depot.modifierOperation(carnet, op.id, {
    montant: 3_000,
    enveloppeId: transport.id,
    compteId: null,
    note: '  Taxi ',
  });
  const mois = await depot.mois(carnet);
  assert.equal(mois.depense, 3_000);
  assert.equal(mois.enveloppes[0]?.depense, 0);
  assert.equal(mois.enveloppes[2]?.depense, 3_000);
  const relue = await depot.operation(carnet, op.id);
  assert.deepEqual(
    [relue?.type, relue?.montant, relue?.note, relue?.enveloppeId],
    ['depense', 3_000, 'Taxi', transport.id],
  );
});

test('modifier : montant invalide, enveloppe manquante ou opération inconnue refusés', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const env = (await depot.mois(carnet)).enveloppes[0];
  assert.ok(env);
  await depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 1_000,
    enveloppeId: env.id,
    compteId: null,
    note: null,
  });
  const [op] = (await depot.detailEnveloppe(carnet, env.id))?.operations ?? [];
  assert.ok(op);
  const m = { montant: 500, enveloppeId: env.id, compteId: null, note: null };
  await assert.rejects(depot.modifierOperation(carnet, op.id, { ...m, montant: 0 }), SaisieInvalide);
  await assert.rejects(depot.modifierOperation(carnet, op.id, { ...m, enveloppeId: null }), SaisieInvalide);
  await assert.rejects(depot.modifierOperation(carnet, 'absente', m), SaisieInvalide);
  assert.equal((await depot.operation(carnet, op.id))?.montant, 1_000);
});

test('revenu : modifié sans enveloppe, puis supprimé', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const { revenus } = await depot.revenusDuCycle(carnet);
  assert.deepEqual(
    revenus.map((r) => [r.montant, r.compte]),
    [[350_000, 'Espèces']],
  );
  const revenu = revenus[0];
  assert.ok(revenu);
  await depot.modifierOperation(carnet, revenu.id, {
    montant: 360_000,
    enveloppeId: 'ignoree',
    compteId: null,
    note: 'Salaire',
  });
  assert.equal((await depot.mois(carnet)).recu, 360_000);
  assert.equal((await depot.operation(carnet, revenu.id))?.enveloppeId, null);
  await depot.supprimerOperation(carnet, revenu.id);
  assert.equal((await depot.mois(carnet)).recu, 0);
  assert.equal(await depot.operation(carnet, revenu.id), null);
  await assert.rejects(depot.supprimerOperation(carnet, revenu.id), SaisieInvalide);
});

test('enveloppes : ajouter à la fin, renommer, archiver sans perdre les dépenses', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const id = await depot.ajouterEnveloppe(carnet, { nom: '  Cadeaux ', icone: 'heart', fixe: false, plafond: 20_000 });
  let mois = await depot.mois(carnet);
  assert.deepEqual(mois.enveloppes.at(-1) && [mois.enveloppes.at(-1)?.nom, mois.enveloppes.at(-1)?.plafond], [
    'Cadeaux',
    20_000,
  ]);
  await depot.renommerEnveloppe(carnet, id, 'Cadeaux et fêtes');
  await depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 5_000,
    enveloppeId: id,
    compteId: null,
    note: null,
  });
  await depot.archiverEnveloppe(carnet, id);
  mois = await depot.mois(carnet);
  assert.equal(
    mois.enveloppes.some((e) => e.id === id),
    false,
  );
  assert.equal(mois.depense, 5_000);
  // Une enveloppe archivée ne reçoit plus de dépense.
  await assert.rejects(
    depot.ajouterDepense(carnet, { carnetId: carnet.id, montant: 100, enveloppeId: id, compteId: null, note: null }),
    SaisieInvalide,
  );
});

test('enveloppes : nom vide ou trop long, plafond négatif, enveloppe inconnue refusés', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  await assert.rejects(
    depot.ajouterEnveloppe(carnet, { nom: '   ', icone: 'cart', fixe: false, plafond: 0 }),
    SaisieInvalide,
  );
  await assert.rejects(
    depot.ajouterEnveloppe(carnet, { nom: 'x'.repeat(41), icone: 'cart', fixe: false, plafond: 0 }),
    SaisieInvalide,
  );
  await assert.rejects(
    depot.ajouterEnveloppe(carnet, { nom: 'X', icone: 'cart', fixe: false, plafond: -1 }),
    SaisieInvalide,
  );
  await assert.rejects(depot.renommerEnveloppe(carnet, 'absente', 'Nom'), SaisieInvalide);
  await assert.rejects(depot.archiverEnveloppe(carnet, 'absente'), SaisieInvalide);
});

test('supprimer une enveloppe : annonce ses dépenses, les efface avec ses plafonds', async () => {
  const w = monde();
  const carnet = await carnetExemple(w.depot);
  const [quotidien, , transport] = (await w.depot.mois(carnet)).enveloppes;
  assert.ok(quotidien && transport);
  const dep = (montant: number, enveloppeId: string) =>
    w.depot.ajouterDepense(carnet, { carnetId: carnet.id, montant, enveloppeId, compteId: null, note: null });
  await dep(2_500, transport.id);
  await dep(10_000, transport.id);
  await dep(1_000, quotidien.id);
  w.allerAu('2026-11-25'); // dépense sur un autre cycle : comptée aussi
  await dep(500, transport.id);
  assert.deepEqual(await w.depot.depensesDeLEnveloppe(carnet, transport.id), { nombre: 3, total: 13_000 });
  await w.depot.supprimerEnveloppe(carnet, transport.id);
  const mois = await w.depot.mois(carnet);
  assert.equal(
    mois.enveloppes.some((e) => e.id === transport.id),
    false,
  );
  assert.equal(mois.depense, 0);
  w.allerAu('2026-10-29');
  assert.equal((await w.depot.mois(carnet)).depense, 1_000);
  const { n } = (await w.sql.premier<{ n: number }>(
    'SELECT COUNT(*) AS n FROM plafonds WHERE enveloppe_id = ?',
    transport.id,
  )) ?? { n: -1 };
  assert.equal(n, 0);
  await assert.rejects(w.depot.supprimerEnveloppe(carnet, transport.id), SaisieInvalide);
});

test('supprimer une enveloppe vide', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const env = (await depot.mois(carnet)).enveloppes[1];
  assert.ok(env);
  assert.deepEqual(await depot.depensesDeLEnveloppe(carnet, env.id), { nombre: 0, total: 0 });
  await depot.supprimerEnveloppe(carnet, env.id);
  assert.equal((await depot.mois(carnet)).enveloppes.length, 2);
});

test('ajouter un revenu en cours de cycle : le reçu augmente', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  await depot.ajouterRevenu(carnet, { montant: 50_000, compteId: null, note: '  Aide de la famille ' });
  const mois = await depot.mois(carnet);
  assert.equal(mois.recu, 400_000);
  const { revenus } = await depot.revenusDuCycle(carnet);
  assert.deepEqual(
    revenus.map((r) => [r.montant, r.note]).sort(),
    [
      [350_000, null],
      [50_000, 'Aide de la famille'],
    ].sort(),
  );
  await assert.rejects(depot.ajouterRevenu(carnet, { montant: 0, compteId: null, note: null }), SaisieInvalide);
  await assert.rejects(depot.ajouterRevenu(carnet, { montant: 1.5, compteId: null, note: null }), SaisieInvalide);
});
