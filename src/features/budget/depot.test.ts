/// <reference types="node" />
import assert from 'node:assert/strict';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { test } from 'node:test';

import { creerDepot, nonReparti, SaisieInvalide, type Carnet, type Parametre, type Sql } from './depot.ts';
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

test('enveloppe archivée : retrouvée, détaillée sur tous les cycles, corrigée, restaurée', async () => {
  const w = monde();
  const carnet = await carnetExemple(w.depot);
  const [quotidien, , transport] = (await w.depot.mois(carnet)).enveloppes;
  assert.ok(quotidien && transport);
  const dep = (montant: number) =>
    w.depot.ajouterDepense(carnet, {
      carnetId: carnet.id,
      montant,
      enveloppeId: transport.id,
      compteId: null,
      note: null,
    });
  await dep(2_000);
  w.allerAu('2026-11-26');
  await dep(3_000);
  await w.depot.archiverEnveloppe(carnet, transport.id);

  assert.deepEqual(
    (await w.depot.enveloppesArchivees(carnet)).map((e) => [e.nom, e.nombre, e.total]),
    [['Transport', 2, 5_000]],
  );
  const detail = await w.depot.detailEnveloppe(carnet, transport.id);
  assert.equal(detail?.enveloppe.archivee, true);
  assert.deepEqual(
    detail?.operations.map((o) => o.montant),
    [3_000, 2_000],
  );

  // La dépense garde son enveloppe archivée…
  const [recente] = detail?.operations ?? [];
  assert.ok(recente);
  await w.depot.modifierOperation(carnet, recente.id, {
    montant: 3_500,
    enveloppeId: transport.id,
    compteId: null,
    note: null,
  });
  assert.equal((await w.depot.mois(carnet)).depense, 3_500);
  // … ou part vers une enveloppe active, mais jamais vers une autre enveloppe archivée.
  await w.depot.archiverEnveloppe(carnet, quotidien.id);
  await assert.rejects(
    w.depot.modifierOperation(carnet, recente.id, {
      montant: 3_500,
      enveloppeId: quotidien.id,
      compteId: null,
      note: null,
    }),
    SaisieInvalide,
  );

  await w.depot.restaurerEnveloppe(carnet, transport.id);
  assert.equal(
    (await w.depot.mois(carnet)).enveloppes.some((e) => e.id === transport.id),
    true,
  );
  assert.equal((await w.depot.detailEnveloppe(carnet, transport.id))?.operations.length, 1);
  await assert.rejects(w.depot.restaurerEnveloppe(carnet, 'absente'), SaisieInvalide);
});

test("historique du cycle : filtré, le plus récent d'abord, avec enveloppe et compte", async () => {
  const w = monde();
  const carnet = await carnetExemple(w.depot);
  const env = (await w.depot.mois(carnet)).enveloppes[0];
  assert.ok(env);
  w.allerAu('2026-10-30');
  await w.depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 2_000,
    enveloppeId: env.id,
    compteId: null,
    note: 'Pain',
  });
  w.allerAu('2026-10-31');
  await w.depot.ajouterRevenu(carnet, { montant: 10_000, compteId: null, note: 'Aide' });
  const tout = await w.depot.historique(carnet, 'tout');
  assert.deepEqual(
    tout.operations.map((o) => [o.date, o.type, o.montant, o.enveloppe]),
    [
      ['2026-10-31', 'revenu', 10_000, null],
      ['2026-10-30', 'depense', 2_000, 'Dépense quotidienne'],
      ['2026-10-29', 'revenu', 350_000, null],
    ],
  );
  assert.deepEqual(
    (await w.depot.historique(carnet, 'depenses')).operations.map((o) => o.montant),
    [2_000],
  );
  assert.deepEqual(
    (await w.depot.historique(carnet, 'revenus')).operations.map((o) => o.montant),
    [10_000, 350_000],
  );
});

test("changer le jour d'une opération : seulement dans son cycle", async () => {
  const w = monde();
  const carnet = await carnetExemple(w.depot);
  const env = (await w.depot.mois(carnet)).enveloppes[0];
  assert.ok(env);
  await w.depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 2_000,
    enveloppeId: env.id,
    compteId: null,
    note: null,
  });
  const [op] = (await w.depot.historique(carnet, 'depenses')).operations;
  assert.ok(op);
  const detail = await w.depot.operation(carnet, op.id);
  assert.deepEqual([detail?.cycleDebut, detail?.cycleFin], ['2026-10-25', '2026-11-24']);
  await w.depot.modifierDateOperation(carnet, op.id, '2026-10-26');
  assert.equal((await w.depot.operation(carnet, op.id))?.date, '2026-10-26');
  await assert.rejects(w.depot.modifierDateOperation(carnet, op.id, '2026-10-24'), SaisieInvalide);
  await assert.rejects(w.depot.modifierDateOperation(carnet, op.id, '2026-11-25'), SaisieInvalide);
  await assert.rejects(w.depot.modifierDateOperation(carnet, op.id, '26/10/2026'), SaisieInvalide);
  await assert.rejects(w.depot.modifierDateOperation(carnet, 'absente', '2026-10-26'), SaisieInvalide);
});

test('comptes : solde de départ, revenus et dépenses par compte', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const wave = await depot.ajouterCompte(carnet, { nom: ' Wave ', type: 'mobile', soldeInitial: 20_000 });
  const env = (await depot.mois(carnet)).enveloppes[0];
  assert.ok(env);
  await depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 5_000,
    enveloppeId: env.id,
    compteId: wave,
    note: null,
  });
  await depot.ajouterRevenu(carnet, { montant: 1_000, compteId: wave, note: null });
  const [especes] = await depot.comptes(carnet.id);
  assert.ok(especes);
  await depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 2_500,
    enveloppeId: env.id,
    compteId: especes.id,
    note: null,
  });
  assert.deepEqual(
    (await depot.comptesAvecSolde(carnet)).map((c) => [c.nom, c.type, c.solde]),
    [
      ['Espèces', 'especes', 347_500],
      ['Wave', 'mobile', 16_000],
    ],
  );
});

test('ajouter un compte : nom, type et solde vérifiés', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  await assert.rejects(depot.ajouterCompte(carnet, { nom: ' ', type: 'banque', soldeInitial: 0 }), SaisieInvalide);
  await assert.rejects(
    depot.ajouterCompte(carnet, { nom: 'X', type: 'coffre' as never, soldeInitial: 0 }),
    SaisieInvalide,
  );
  await assert.rejects(depot.ajouterCompte(carnet, { nom: 'X', type: 'banque', soldeInitial: -1 }), SaisieInvalide);
  assert.equal((await depot.comptes(carnet.id)).length, 1);
});

test('jour de paie : revenu, mise de côté et répartition, puis non réparti', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const [quotidien, loyer, transport] = (await depot.mois(carnet)).enveloppes;
  assert.ok(quotidien && loyer && transport);
  // Avant : 350 000 reçus, 280 000 répartis.
  assert.equal(nonReparti(await depot.mois(carnet)), 70_000);
  await depot.jourDePaie(carnet, {
    revenu: 50_000,
    compteId: null,
    epargne: 40_000,
    sadaqa: 5_000,
    plafonds: [{ enveloppeId: transport.id, montant: 45_000 }],
  });
  const mois = await depot.mois(carnet);
  assert.equal(mois.recu, 400_000);
  assert.equal(mois.misDeCote, 45_000);
  assert.equal(mois.enveloppes[2]?.plafond, 45_000);
  assert.equal(nonReparti(mois), 400_000 - 45_000 - (150_000 + 100_000 + 45_000));
});

test('jour de paie : tout ou rien si une enveloppe est inconnue ou un montant invalide', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const base = { revenu: 10_000, compteId: null, epargne: 0, sadaqa: 0 };
  await assert.rejects(
    depot.jourDePaie(carnet, { ...base, plafonds: [{ enveloppeId: 'absente', montant: 1 }] }),
    SaisieInvalide,
  );
  await assert.rejects(depot.jourDePaie(carnet, { ...base, epargne: -1, plafonds: [] }), SaisieInvalide);
  assert.equal((await depot.mois(carnet)).recu, 350_000);
});

test('bilan : restes du cycle terminé, report, épargne, sadaqa, clôture unique', async () => {
  const w = monde();
  const carnet = await carnetExemple(w.depot);
  const [quotidien, loyer, transport] = (await w.depot.mois(carnet)).enveloppes;
  assert.ok(quotidien && loyer && transport);
  const dep = (montant: number, enveloppeId: string) =>
    w.depot.ajouterDepense(carnet, { carnetId: carnet.id, montant, enveloppeId, compteId: null, note: null });
  await dep(140_000, quotidien.id); // reste 10 000
  await dep(100_000, loyer.id); // reste 0
  await dep(10_000, transport.id); // reste 20 000
  assert.equal(await w.depot.bilanAFaire(carnet), null); // cycle pas encore terminé

  w.allerAu('2026-11-26');
  const bilan = await w.depot.bilanAFaire(carnet);
  assert.ok(bilan);
  assert.deepEqual(bilan.cycle.fin, '2026-11-24');
  assert.deepEqual(
    bilan.enveloppes.map((e) => [e.nom, e.reste]),
    [
      ['Dépense quotidienne', 10_000],
      ['Transport', 20_000],
    ],
  );
  const totaux = await w.depot.cloreCycle(carnet, bilan.cycle.id, { [transport.id]: 'sadaqa' });
  assert.deepEqual(totaux, { reporte: 10_000, epargne: 0, sadaqa: 20_000 });
  const mois = await w.depot.mois(carnet);
  assert.deepEqual([mois.enveloppes[0]?.plafond, mois.enveloppes[0]?.report], [160_000, 10_000]);
  assert.equal(mois.enveloppes[2]?.report, 0);
  // Le report ne compte pas comme argent réparti ce cycle.
  assert.equal(nonReparti(mois), -(150_000 + 100_000 + 30_000));
  assert.equal(await w.depot.bilanAFaire(carnet), null);
  await assert.rejects(w.depot.cloreCycle(carnet, bilan.cycle.id, {}), SaisieInvalide);
  // La sadaqa est inscrite sur le cycle terminé.
  w.allerAu('2026-11-20');
  assert.equal((await w.depot.mois(carnet)).misDeCote, 20_000);
});

test('bilan : un cycle en cours ne peut pas être clos', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const { cycle } = await depot.mois(carnet);
  await assert.rejects(depot.cloreCycle(carnet, cycle.id, {}), SaisieInvalide);
});

test('virement : soldes des deux comptes, enveloppes et totaux inchangés', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const wave = await depot.ajouterCompte(carnet, { nom: 'Wave', type: 'mobile', soldeInitial: 50_000 });
  const [especes] = await depot.comptes(carnet.id);
  assert.ok(especes);
  await depot.virement(carnet, { de: wave, vers: especes.id, montant: 20_000, note: 'Retrait' });
  assert.deepEqual(
    (await depot.comptesAvecSolde(carnet)).map((c) => c.solde),
    [370_000, 30_000],
  );
  const mois = await depot.mois(carnet);
  assert.deepEqual([mois.recu, mois.depense, mois.misDeCote], [350_000, 0, 0]);
  await assert.rejects(depot.virement(carnet, { de: wave, vers: wave, montant: 1, note: null }), SaisieInvalide);
  await assert.rejects(depot.virement(carnet, { de: wave, vers: 'absent', montant: 1, note: null }), SaisieInvalide);
  await assert.rejects(depot.virement(carnet, { de: wave, vers: especes.id, montant: 0, note: null }), SaisieInvalide);
});

test('concurrence : dix lectures et écritures simultanées au changement de cycle, un seul cycle', async () => {
  const w = monde();
  const carnet = await carnetExemple(w.depot);
  const env = (await w.depot.mois(carnet)).enveloppes[0];
  assert.ok(env);
  w.allerAu('2026-11-26');
  const appels: Promise<unknown>[] = [];
  for (let i = 0; i < 5; i++) {
    appels.push(w.depot.mois(carnet));
    appels.push(
      w.depot.ajouterDepense(carnet, {
        carnetId: carnet.id,
        montant: 100,
        enveloppeId: env.id,
        compteId: null,
        note: null,
      }),
    );
  }
  await Promise.all(appels);
  const { n } = (await w.sql.premier<{ n: number }>("SELECT COUNT(*) AS n FROM cycles WHERE debut = '2026-11-25'")) ?? {
    n: -1,
  };
  assert.equal(n, 1);
  const mois = await w.depot.mois(carnet);
  assert.equal(mois.depense, 500);
  assert.equal(mois.enveloppes[0]?.depense, 500);
  // Les plafonds n'ont été repris qu'une fois.
  const { p } = (await w.sql.premier<{ p: number }>(
    'SELECT COUNT(*) AS p FROM plafonds WHERE cycle_id = ?',
    mois.cycle.id,
  )) ?? { p: -1 };
  assert.equal(p, 3);
});

test("file d'attente : une erreur n'empêche pas les opérations suivantes", async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const env = (await depot.mois(carnet)).enveloppes[0];
  assert.ok(env);
  const ratee = depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 0,
    enveloppeId: env.id,
    compteId: null,
    note: null,
  });
  const reussie = depot.ajouterDepense(carnet, {
    carnetId: carnet.id,
    montant: 700,
    enveloppeId: env.id,
    compteId: null,
    note: null,
  });
  await assert.rejects(ratee, SaisieInvalide);
  await reussie;
  assert.equal((await depot.mois(carnet)).depense, 700);
});

// --- Dettes entre proches ---

const detteDe = (
  personne: string,
  montant: number,
  sens: 'prete' | 'emprunte' = 'prete',
  echeance: string | null = null,
) => ({
  sens,
  personne,
  montant,
  echeance,
  note: null,
});

test('dettes : ajout, liste ouverte triée par échéance, détail', async () => {
  const { depot } = monde('2026-11-04');
  const carnet = await carnetExemple(depot);
  await depot.ajouterDette(carnet, detteDe('Awa', 60_000, 'prete', '2026-11-30'));
  const oncle = await depot.ajouterDette(carnet, detteDe('  Oncle Mamadou  ', 30_000, 'emprunte'));
  await depot.ajouterDette(carnet, detteDe('Ibrahima', 40_000, 'prete', '2026-10-23'));
  assert.deepEqual(
    (await depot.dettes(carnet, 'ouvertes')).map((d) => d.personne),
    ['Ibrahima', 'Awa', 'Oncle Mamadou'],
  );
  const detail = await depot.dette(carnet, oncle);
  assert.ok(detail);
  assert.equal(detail.personne, 'Oncle Mamadou');
  assert.equal(detail.sens, 'emprunte');
  assert.equal(detail.reste, 30_000);
  assert.equal(detail.date, '2026-11-04');
  assert.deepEqual(detail.paiements, []);
});

test('dettes : saisies refusées (nom, montant, échéance)', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const cle = (e: unknown) => (e instanceof SaisieInvalide ? e.cle : String(e));
  await assert.rejects(depot.ajouterDette(carnet, detteDe('   ', 1000)), (e) => cle(e) === 'personneInvalide');
  await assert.rejects(depot.ajouterDette(carnet, detteDe('x'.repeat(61), 1000)), (e) => cle(e) === 'personneInvalide');
  await assert.rejects(depot.ajouterDette(carnet, detteDe('Awa', 0)), (e) => cle(e) === 'montantInvalide');
  await assert.rejects(
    depot.ajouterDette(carnet, detteDe('Awa', 1000, 'prete', '2026-02-30')),
    (e) => cle(e) === 'dateInvalide',
  );
  assert.deepEqual(await depot.dettes(carnet, 'ouvertes'), []);
});

test('dettes : remboursements jusqu’au solde, jamais plus que le reste', async () => {
  const { depot } = monde('2026-11-04');
  const carnet = await carnetExemple(depot);
  const id = await depot.ajouterDette(carnet, detteDe('Ibrahima', 40_000));
  await depot.ajouterPaiement(carnet, id, { type: 'remboursement', montant: 5_000, date: '2026-10-24', note: null });
  await depot.ajouterPaiement(carnet, id, { type: 'remboursement', montant: 10_000, date: '2026-11-08', note: null });
  let d = await depot.dette(carnet, id);
  assert.ok(d);
  assert.equal(d.rembourse, 15_000);
  assert.equal(d.reste, 25_000);
  assert.deepEqual(
    d.paiements.map((p) => p.montant),
    [10_000, 5_000],
  );
  await assert.rejects(
    depot.ajouterPaiement(carnet, id, { type: 'remboursement', montant: 25_001, date: '2026-11-09', note: null }),
    (e) => e instanceof SaisieInvalide && e.cle === 'paiementTropGrand',
  );
  await depot.ajouterPaiement(carnet, id, { type: 'remboursement', montant: 25_000, date: '2026-11-09', note: null });
  d = await depot.dette(carnet, id);
  assert.equal(d?.statut, 'soldee');
  assert.equal(d?.reste, 0);
  assert.deepEqual(await depot.dettes(carnet, 'ouvertes'), []);
  assert.deepEqual(
    (await depot.dettes(carnet, 'closes')).map((x) => x.id),
    [id],
  );
  await assert.rejects(
    depot.ajouterPaiement(carnet, id, { type: 'remboursement', montant: 1, date: '2026-11-09', note: null }),
    (e) => e instanceof SaisieInvalide && e.cle === 'detteFermee',
  );
});

test('dettes : remise du reste, puis suppression du paiement qui rouvre la dette', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const id = await depot.ajouterDette(carnet, detteDe('Awa', 60_000));
  await depot.ajouterPaiement(carnet, id, { type: 'remboursement', montant: 20_000, date: '2026-10-29', note: null });
  // Le montant donné est ignoré : une remise efface exactement le reste.
  await depot.ajouterPaiement(carnet, id, { type: 'remise', montant: 1, date: '2026-10-29', note: null });
  let d = await depot.dette(carnet, id);
  assert.equal(d?.statut, 'soldee');
  const remise = d?.paiements.find((p) => p.type === 'remise');
  assert.equal(remise?.montant, 40_000);
  assert.ok(remise);
  await depot.supprimerPaiement(carnet, remise.id);
  d = await depot.dette(carnet, id);
  assert.equal(d?.statut, 'ouverte');
  assert.equal(d?.reste, 40_000);
});

test('dettes : modification, montant jamais sous le déjà remboursé', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const id = await depot.ajouterDette(carnet, detteDe('Awa', 60_000));
  await depot.ajouterPaiement(carnet, id, { type: 'remboursement', montant: 20_000, date: '2026-10-29', note: null });
  await assert.rejects(
    depot.modifierDette(carnet, id, detteDe('Awa', 19_999)),
    (e) => e instanceof SaisieInvalide && e.cle === 'montantSousRembourse',
  );
  await depot.modifierDette(carnet, id, { ...detteDe('Awa Diop', 50_000, 'prete', '2026-12-15'), note: ' École ' });
  let d = await depot.dette(carnet, id);
  assert.equal(d?.personne, 'Awa Diop');
  assert.equal(d?.reste, 30_000);
  assert.equal(d?.echeance, '2026-12-15');
  assert.equal(d?.note, 'École');
  // Ramener le montant au déjà remboursé solde la dette.
  await depot.modifierDette(carnet, id, detteDe('Awa Diop', 20_000));
  d = await depot.dette(carnet, id);
  assert.equal(d?.statut, 'soldee');
});

test('dettes : annulation, et aucune dette d’un autre carnet n’est visible', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const id = await depot.ajouterDette(carnet, detteDe('Awa', 60_000));
  await depot.annulerDette(carnet, id);
  assert.equal((await depot.dette(carnet, id))?.statut, 'annulee');
  await assert.rejects(depot.annulerDette(carnet, id), (e) => e instanceof SaisieInvalide && e.cle === 'detteFermee');
  const autre: Carnet = { ...carnet, id: 'autre-carnet' };
  assert.equal(await depot.dette(autre, id), null);
  assert.deepEqual(await depot.dettes(autre, 'closes'), []);
  await assert.rejects(depot.annulerDette(autre, id), (e) => e instanceof SaisieInvalide && e.cle === 'detteInconnue');
});

// --- Épargne avec intention ---

const objectifDe = (nom: string, cible: number | null, versementMensuel: number | null = null) => ({
  nom,
  intention: 'Accomplir le sacrifice avec la famille',
  cible,
  versementMensuel,
});

test('épargne : objectifs, versements, épargne libre et total', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const mouton = await depot.ajouterObjectif(carnet, objectifDe('  Mouton de Tabaski ', 200_000, 25_000));
  const oumra = await depot.ajouterObjectif(carnet, objectifDe('Oumra', null));
  const [compte] = await depot.comptes(carnet.id);
  assert.ok(compte);
  await depot.verserEpargne(carnet, { montant: 100_000, objectifId: mouton, compteId: compte.id, note: null });
  await depot.verserEpargne(carnet, { montant: 20_000, objectifId: mouton, compteId: null, note: ' Prime ' });
  await depot.verserEpargne(carnet, { montant: 300_000, objectifId: oumra, compteId: null, note: null });
  await depot.verserEpargne(carnet, { montant: 5_000, objectifId: null, compteId: null, note: null });
  const e = await depot.epargne(carnet);
  assert.equal(e.total, 425_000);
  assert.equal(e.libre, 5_000);
  assert.deepEqual(
    e.objectifs.map((o) => [o.nom, o.verse, o.cible]),
    [
      ['Mouton de Tabaski', 120_000, 200_000],
      ['Oumra', 300_000, null],
    ],
  );
  // Le mis de côté du mois et le solde du compte suivent.
  assert.equal((await depot.mois(carnet)).misDeCote, 425_000);
  const detail = await depot.objectif(carnet, mouton);
  // Même jour et même horodatage dans ce test : on compare sans dépendre de l'ordre.
  const versements = (detail?.versements ?? []).map((v) => `${v.montant}:${v.note ?? ''}`).sort();
  assert.deepEqual(versements, ['100000:', '20000:Prime']);
});

test('épargne : objectif utilisé hors du total, puis restauré', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const mouton = await depot.ajouterObjectif(carnet, objectifDe('Mouton', 200_000));
  await depot.verserEpargne(carnet, { montant: 200_000, objectifId: mouton, compteId: null, note: null });
  await depot.marquerUtilise(carnet, mouton);
  let e = await depot.epargne(carnet);
  assert.equal(e.total, 0);
  assert.deepEqual(
    e.utilises.map((o) => [o.nom, o.verse, o.utilise]),
    [['Mouton', 200_000, true]],
  );
  await assert.rejects(
    depot.verserEpargne(carnet, { montant: 1, objectifId: mouton, compteId: null, note: null }),
    (x) => x instanceof SaisieInvalide && x.cle === 'objectifInconnu',
  );
  await depot.restaurerObjectif(carnet, mouton);
  e = await depot.epargne(carnet);
  assert.equal(e.total, 200_000);
  assert.deepEqual(e.utilises, []);
});

test('épargne : saisies refusées et modification', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const cle = (x: unknown) => (x instanceof SaisieInvalide ? x.cle : String(x));
  await assert.rejects(depot.ajouterObjectif(carnet, objectifDe('  ', null)), (x) => cle(x) === 'nomInvalide');
  await assert.rejects(
    depot.ajouterObjectif(carnet, objectifDe('x'.repeat(41), null)),
    (x) => cle(x) === 'nomInvalide',
  );
  await assert.rejects(depot.ajouterObjectif(carnet, objectifDe('Oumra', 0)), (x) => cle(x) === 'montantInvalide');
  const id = await depot.ajouterObjectif(carnet, objectifDe('Rentrée', 150_000, 15_000));
  await depot.modifierObjectif(carnet, id, {
    nom: 'Rentrée scolaire',
    intention: '  ',
    cible: null,
    versementMensuel: null,
  });
  const o = await depot.objectif(carnet, id);
  assert.equal(o?.nom, 'Rentrée scolaire');
  assert.equal(o?.intention, null);
  assert.equal(o?.cible, null);
  await assert.rejects(
    depot.verserEpargne(carnet, { montant: 1_000, objectifId: null, compteId: 'inconnu', note: null }),
    (x) => cle(x) === 'compteInconnu',
  );
  const autre: Carnet = { ...carnet, id: 'autre-carnet' };
  assert.equal(await depot.objectif(autre, id), null);
  await assert.rejects(depot.marquerUtilise(autre, id), (x) => cle(x) === 'objectifInconnu');
});

test('jour de paie : versements par objectif et autre épargne', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const mouton = await depot.ajouterObjectif(carnet, objectifDe('Mouton', 200_000, 25_000));
  const avant = await depot.mois(carnet);
  await depot.jourDePaie(carnet, {
    revenu: 0,
    compteId: null,
    epargne: 10_000,
    sadaqa: 0,
    plafonds: [],
    versements: [
      { objectifId: mouton, montant: 25_000 },
      { objectifId: mouton, montant: 0 },
    ],
  });
  const e = await depot.epargne(carnet);
  assert.equal(e.libre, 10_000);
  assert.equal(e.objectifs[0]?.verse, 25_000);
  assert.equal((await depot.mois(carnet)).misDeCote, avant.misDeCote + 35_000);
  await assert.rejects(
    depot.jourDePaie(carnet, {
      revenu: 0,
      compteId: null,
      epargne: 0,
      sadaqa: 0,
      plafonds: [],
      versements: [{ objectifId: 'absent', montant: 1 }],
    }),
    (x) => x instanceof SaisieInvalide && x.cle === 'objectifInconnu',
  );
  // Tout ou rien : l'échec n'a rien enregistré.
  assert.equal((await depot.epargne(carnet)).total, 35_000);
});

// --- Zakat indicative ---

test('zakat : sans prix du gramme, pas de verdict ; base sur l’argent par défaut', async () => {
  const { depot } = monde('2026-11-04');
  const carnet = await carnetExemple(depot);
  const z = await depot.zakat(carnet);
  assert.equal(z.reglages.base, 'argent');
  assert.equal(z.nisab, null);
  assert.equal(z.etat.type, 'sansCours');
  assert.equal(z.reglages.debutHawl, null);
  // Le revenu de départ (350 000) est sur le compte Espèces : il compte dans la base.
  assert.equal(z.composition.comptes, 350_000);
});

test('zakat : composition, nisab, début de l’année lunaire et montant', async () => {
  const { depot, allerAu } = monde('2026-07-01');
  const carnet = await carnetExemple(depot);
  await depot.reglerZakat(carnet, { prixArgent: 600, prixOr: 45_000 });
  await depot.verserEpargne(carnet, { montant: 100_000, objectifId: null, compteId: null, note: null });
  await depot.ajouterBien(carnet, { type: 'or', libelle: 'Bijoux', valeur: 10_000 });
  await depot.ajouterBien(carnet, { type: 'autre', libelle: null, valeur: 50_000 });
  const pret = await depot.ajouterDette(carnet, {
    sens: 'prete',
    personne: 'Awa',
    montant: 60_000,
    echeance: null,
    note: null,
  });
  await depot.ajouterPaiement(carnet, pret, { type: 'remboursement', montant: 10_000, date: '2026-07-01', note: null });
  await depot.ajouterDette(carnet, {
    sens: 'emprunte',
    personne: 'Oncle',
    montant: 30_000,
    echeance: '2026-12-01',
    note: null,
  });
  // Échéance après l'année lunaire : pas déduite.
  await depot.ajouterDette(carnet, {
    sens: 'emprunte',
    personne: 'Banque',
    montant: 99_000,
    echeance: '2028-01-01',
    note: null,
  });
  let z = await depot.zakat(carnet);
  assert.deepEqual(z.composition, {
    epargne: 100_000,
    comptes: 350_000,
    metaux: 450_000,
    autres: 50_000,
    creances: 50_000,
    dettes: 30_000,
  });
  assert.equal(z.nisab, 357_000);
  assert.equal(z.reglages.debutHawl, '2026-07-01');
  assert.deepEqual(z.etat, {
    type: 'due',
    base: 970_000,
    nisab: 357_000,
    montant: 24_250,
    echeance: '2027-06-20',
    joursRestants: 354,
  });
  // Plus tard : le début reste le même.
  allerAu('2026-11-04');
  z = await depot.zakat(carnet);
  assert.equal(z.reglages.debutHawl, '2026-07-01');
  assert.equal(z.reglages.prixMajLe, '2026-07-01');
});

test('zakat : sous le nisab, le début de l’année lunaire est effacé', async () => {
  const { depot } = monde('2026-07-01');
  const carnet = await carnetExemple(depot);
  // 595 g à 500 : nisab de 297 500, sous les 350 000 du compte.
  await depot.reglerZakat(carnet, { prixArgent: 500 });
  assert.equal((await depot.zakat(carnet)).reglages.debutHawl, '2026-07-01');
  // Nisab sur l'or, bien plus haut : la base n'y est plus.
  await depot.reglerZakat(carnet, { base: 'or', prixOr: 45_000 });
  const z = await depot.zakat(carnet);
  assert.equal(z.etat.type, 'sousNisab');
  assert.equal(z.reglages.debutHawl, null);
});

test('zakat : biens modifiés et supprimés, saisies refusées', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const cle = (x: unknown) => (x instanceof SaisieInvalide ? x.cle : String(x));
  const id = await depot.ajouterBien(carnet, { type: 'argent', libelle: ' Gourmette ', valeur: 20_000 });
  await depot.modifierBien(carnet, id, { type: 'creance', libelle: 'Prêt à Moussa', valeur: 15_000 });
  let z = await depot.zakat(carnet);
  assert.deepEqual(
    z.biens.map((x) => ({ ...x })),
    [{ id, type: 'creance', libelle: 'Prêt à Moussa', milligrammes: null, montant: 15_000 }],
  );
  await depot.supprimerBien(carnet, id);
  z = await depot.zakat(carnet);
  assert.deepEqual(z.biens, []);
  await assert.rejects(depot.supprimerBien(carnet, id), (x) => cle(x) === 'bienInconnu');
  await assert.rejects(
    depot.ajouterBien(carnet, { type: 'or', libelle: null, valeur: 0 }),
    (x) => cle(x) === 'montantInvalide',
  );
  await assert.rejects(depot.reglerZakat(carnet, { prixOr: -1 }), (x) => cle(x) === 'montantInvalide');
  await assert.rejects(depot.reglerZakat(carnet, { debutHawl: '2030-01-01' }), (x) => cle(x) === 'dateInvalide');
});

test('zakat versée : sadaqa du cycle et nouvelle année lunaire', async () => {
  const { depot, allerAu } = monde('2026-07-01');
  const carnet = await carnetExemple(depot);
  await depot.reglerZakat(carnet, { prixArgent: 500 });
  await depot.zakat(carnet);
  allerAu('2027-06-25');
  const avant = await depot.mois(carnet);
  await depot.marquerZakatVersee(carnet, { montant: 8_750, compteId: null });
  const apres = await depot.mois(carnet);
  assert.equal(apres.misDeCote, avant.misDeCote + 8_750);
  assert.equal((await depot.zakat(carnet)).reglages.debutHawl, '2027-06-25');
});

test('devises : intégrées d’abord, puis la devise personnelle ajoutée ; saisie refusée', async () => {
  const { depot } = monde();
  const dh = await depot.ajouterDevise({ nom: 'Dirham', symbole: 'DH', position: 'apres', decimales: 2 });
  assert.equal(dh.code, 'P-id-0001');
  assert.equal(dh.sousUnites, 100);
  assert.deepEqual(
    (await depot.devises()).map((d) => [d.code, d.personnelle]),
    [
      ['XOF', false],
      ['MRU', false],
      ['P-id-0001', true],
    ],
  );
  await assert.rejects(
    depot.ajouterDevise({ nom: '', symbole: 'X', position: 'avant', decimales: 0 }),
    (e: unknown) => e instanceof SaisieInvalide && e.cle === 'deviseInvalide',
  );
});

test('changer de devise : tout l’argent du carnet converti au taux, dettes cohérentes', async () => {
  const { sql, depot } = monde();
  const carnet = await carnetExemple(depot);
  const dh = await depot.ajouterDevise({ nom: 'Dirham', symbole: 'DH', position: 'apres', decimales: 2 });
  await sql.executer(
    "INSERT INTO dettes (id, carnet_id, sens, personne, montant_initial, date, statut, cree_le) VALUES ('d1', ?, 'prete', 'Awa', 10000, '2026-10-29', 'ouverte', 'x'), ('d2', ?, 'prete', 'Moussa', 1001, '2026-10-29', 'soldee', 'x')",
    carnet.id,
    carnet.id,
  );
  await sql.executer(
    "INSERT INTO paiements_dette (id, dette_id, montant, date, cree_le) VALUES ('p1', 'd1', 3333, '2026-10-29', 'x'), ('p2', 'd1', 3333, '2026-10-29', 'x'), ('p3', 'd2', 1001, '2026-10-29', 'x')",
  );
  await sql.executer(
    "INSERT INTO zakat (carnet_id, base_nisab, cours_or_g, cours_argent_g) VALUES (?, 'argent', 50000, NULL)",
    carnet.id,
  );

  await depot.changerDevise(carnet, dh.code, '0,0165');

  const apres = await depot.carnetActif();
  assert.equal(apres?.devise.code, dh.code);
  const revenus = await sql.tous<{ montant: number }>("SELECT montant FROM operations WHERE type = 'revenu'");
  assert.deepEqual(
    revenus.map((r) => r.montant),
    [577_500],
  );
  const plafonds = await sql.tous<{ montant: number }>('SELECT montant FROM plafonds ORDER BY montant DESC');
  assert.deepEqual(
    plafonds.map((p) => p.montant),
    [247_500, 165_000, 49_500],
  );
  const zakat = await sql.premier<{ cours_or_g: number; cours_argent_g: number | null }>('SELECT * FROM zakat');
  assert.equal(zakat?.cours_or_g, 82_500);
  assert.equal(zakat?.cours_argent_g, null);
  const ouverte = await depot.dette(apres ?? carnet, 'd1');
  assert.equal(ouverte?.rembourse, 10_998);
  assert.equal(ouverte?.reste, 5501);
  const soldee = await depot.dette(apres ?? carnet, 'd2');
  assert.equal(soldee?.reste, 0);
  assert.equal(soldee?.montantInitial, 1652);
});

test('changer de devise : même devise, taux ou devise refusés, rien n’est modifié', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const refus = (cle: string) => (e: unknown) => e instanceof SaisieInvalide && e.cle === cle;
  await assert.rejects(depot.changerDevise(carnet, 'XOF', '1'), refus('memeDevise'));
  await assert.rejects(depot.changerDevise(carnet, 'MRU', '0'), refus('tauxInvalide'));
  await assert.rejects(depot.changerDevise(carnet, 'INCONNUE', '1'), refus('deviseInconnue'));
  assert.equal((await depot.carnetActif())?.devise.code, 'XOF');
  assert.equal((await depot.mois(carnet)).recu, 350_000);
});

test('export : opérations du carnet avec enveloppe et compte, dans l’ordre', async () => {
  const { depot } = monde();
  const carnet = await carnetExemple(depot);
  const lignes = await depot.operationsExport(carnet);
  assert.equal(lignes.length, 1);
  assert.deepEqual(
    { ...lignes[0] },
    {
      date: '2026-10-29',
      type: 'revenu',
      enveloppe: null,
      compte: 'Espèces',
      compteDestination: null,
      objectif: null,
      montant: 350_000,
      note: null,
    },
  );
});
