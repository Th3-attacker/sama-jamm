/// <reference types="node" />
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { migrations } from './schema.ts';

function base(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const m of migrations) db.exec(m);
  db.exec(`
    INSERT INTO devises VALUES ('XOF','Franc CFA','F CFA','apres',0,1,0);
    INSERT INTO carnets VALUES ('c1','Foyer','XOF',25);
    INSERT INTO dettes VALUES ('d1','c1','prete','Ibrahima',40000,'2026-10-12','2026-11-30',NULL,'ouverte','2026-10-12T10:00:00Z');
  `);
  return db;
}

const paiement = (db: DatabaseSync, id: string, montant: number, type = 'remboursement') =>
  db
    .prepare("INSERT INTO paiements_dette VALUES (?, 'd1', ?, ?, '2026-11-08', NULL, '2026-11-08T10:00:00Z')")
    .run(id, type, montant);

test("le schéma s'applique en entier sur une base vide", () => {
  const db = base();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as {
    name: string;
  }[];
  assert.deepEqual(
    tables.map((t) => t.name),
    [
      'biens_zakat',
      'carnets',
      'comptes',
      'cycles',
      'dettes',
      'devises',
      'enveloppes',
      'objectifs',
      'operations',
      'paiements_dette',
      'plafonds',
      'zakat',
    ],
  );
});

test('un montant nul ou négatif est refusé', () => {
  const db = base();
  assert.throws(() => paiement(db, 'p1', 0));
  assert.throws(() => paiement(db, 'p2', -5));
});

test("les paiements d'une dette ne dépassent jamais son montant initial", () => {
  const db = base();
  paiement(db, 'p1', 15_000);
  paiement(db, 'p2', 10_000, 'remise');
  paiement(db, 'p3', 15_000); // 40 000 exactement : accepté
  assert.throws(() => paiement(db, 'p4', 1), /paiement_superieur_au_reste/);
  const { total } = db.prepare('SELECT SUM(montant) AS total FROM paiements_dette').get() as { total: number };
  assert.equal(total, 40_000);
});

test("un paiement trop grand est refusé d'un seul coup", () => {
  const db = base();
  assert.throws(() => paiement(db, 'p1', 40_001), /paiement_superieur_au_reste/);
});

test('valeurs de liste fermées : sens, statut et type de paiement', () => {
  const db = base();
  const dette = (sens: string, statut: string) =>
    db
      .prepare("INSERT INTO dettes VALUES ('x','c1',?,'Awa',1000,'2026-11-01',NULL,NULL,?,'2026-11-01T10:00:00Z')")
      .run(sens, statut);
  assert.throws(() => dette('donne', 'ouverte'));
  assert.throws(() => dette('prete', 'perdue'));
  assert.throws(() => paiement(db, 'p9', 100, 'cadeau'));
  dette('emprunte', 'annulee');
});

test('une dette sans nom ou au nom trop long est refusée', () => {
  const db = base();
  const dette = (personne: string) =>
    db
      .prepare(
        "INSERT INTO dettes VALUES (?, 'c1','prete',?,1000,'2026-11-01',NULL,NULL,'ouverte','2026-11-01T10:00:00Z')",
      )
      .run(personne.slice(0, 5) + Math.random(), personne);
  assert.throws(() => dette(''));
  assert.throws(() => dette('a'.repeat(61)));
  dette('a'.repeat(60));
});

test('les clés étrangères sont respectées : pas de paiement sans dette, suppression en cascade', () => {
  const db = base();
  assert.throws(() =>
    db.prepare("INSERT INTO paiements_dette VALUES ('p1','absente','remboursement',100,'2026-11-08',NULL,'x')").run(),
  );
  paiement(db, 'p1', 100);
  db.exec("DELETE FROM dettes WHERE id = 'd1'");
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM paiements_dette').get() as { n: number };
  assert.equal(n, 0);
});

test('un jour de paie hors de 1 à 31 et une devise à 3 décimales sont refusés', () => {
  const db = base();
  assert.throws(() => db.exec("INSERT INTO carnets VALUES ('c2','X','XOF',32)"));
  assert.throws(() => db.exec("INSERT INTO devises VALUES ('ZZZ','Z','Z','apres',3,1000,1)"));
});
