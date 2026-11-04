// Schéma de `budget.db` : sections « Budget du foyer » et « Dettes entre proches » du design.
// Sans aucun import d'Expo : le même SQL est vérifié par les tests (node:sqlite) avant de partir sur un téléphone.
// Une migration par version : `migrations[0]` crée la version 1. Ne jamais modifier une migration déjà livrée,
// en ajouter une nouvelle.

const V1 = `
CREATE TABLE devises (
  code TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  symbole TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('avant','apres')),
  decimales INTEGER NOT NULL CHECK (decimales BETWEEN 0 AND 2),
  sous_unites INTEGER NOT NULL CHECK (sous_unites >= 1),
  personnelle INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE carnets (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  devise_code TEXT NOT NULL REFERENCES devises,
  jour_paie INTEGER NOT NULL CHECK (jour_paie BETWEEN 1 AND 31)
);
CREATE TABLE comptes (
  id TEXT PRIMARY KEY,
  carnet_id TEXT NOT NULL REFERENCES carnets,
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('especes','mobile','banque')),
  solde_initial INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE cycles (
  id TEXT PRIMARY KEY,
  carnet_id TEXT NOT NULL REFERENCES carnets,
  debut TEXT NOT NULL,
  fin TEXT NOT NULL,
  clos INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE enveloppes (
  id TEXT PRIMARY KEY,
  carnet_id TEXT NOT NULL REFERENCES carnets,
  nom TEXT NOT NULL,
  icone TEXT NOT NULL,
  fixe INTEGER NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL,
  archivee INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE plafonds (
  cycle_id TEXT NOT NULL REFERENCES cycles,
  enveloppe_id TEXT NOT NULL REFERENCES enveloppes,
  montant INTEGER NOT NULL CHECK (montant >= 0),
  report INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (cycle_id, enveloppe_id)
);
CREATE TABLE objectifs (
  id TEXT PRIMARY KEY,
  carnet_id TEXT NOT NULL REFERENCES carnets,
  nom TEXT NOT NULL,
  intention TEXT,
  cible INTEGER,
  versement_mensuel INTEGER,
  echeance TEXT,
  icone TEXT NOT NULL,
  archive INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE operations (
  id TEXT PRIMARY KEY,
  carnet_id TEXT NOT NULL REFERENCES carnets,
  cycle_id TEXT NOT NULL REFERENCES cycles,
  type TEXT NOT NULL CHECK (type IN ('depense','revenu','virement','epargne','sadaqa')),
  montant INTEGER NOT NULL CHECK (montant > 0),
  date TEXT NOT NULL,
  enveloppe_id TEXT REFERENCES enveloppes,
  compte_id TEXT REFERENCES comptes,
  compte_dest_id TEXT REFERENCES comptes,
  objectif_id TEXT REFERENCES objectifs,
  note TEXT,
  recurrence TEXT,
  cree_le TEXT NOT NULL
);
CREATE TABLE zakat (
  carnet_id TEXT PRIMARY KEY REFERENCES carnets,
  debut_hawl TEXT,
  base_nisab TEXT NOT NULL DEFAULT 'or' CHECK (base_nisab IN ('or','argent')),
  cours_or_g INTEGER,
  cours_argent_g INTEGER,
  cours_maj_le TEXT
);
CREATE TABLE biens_zakat (
  id TEXT PRIMARY KEY,
  carnet_id TEXT NOT NULL REFERENCES carnets,
  type TEXT NOT NULL CHECK (type IN ('or','argent','creance','dette','autre')),
  libelle TEXT,
  montant INTEGER,
  milligrammes INTEGER
);
CREATE TABLE dettes (
  id TEXT PRIMARY KEY,
  carnet_id TEXT NOT NULL REFERENCES carnets,
  sens TEXT NOT NULL CHECK (sens IN ('prete','emprunte')),
  personne TEXT NOT NULL CHECK (length(personne) BETWEEN 1 AND 60),
  montant_initial INTEGER NOT NULL CHECK (montant_initial > 0),
  date TEXT NOT NULL,
  echeance TEXT,
  note TEXT,
  statut TEXT NOT NULL DEFAULT 'ouverte' CHECK (statut IN ('ouverte','soldee','annulee')),
  cree_le TEXT NOT NULL
);
CREATE TABLE paiements_dette (
  id TEXT PRIMARY KEY,
  dette_id TEXT NOT NULL REFERENCES dettes ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'remboursement' CHECK (type IN ('remboursement','remise')),
  montant INTEGER NOT NULL CHECK (montant > 0),
  date TEXT NOT NULL,
  note TEXT,
  cree_le TEXT NOT NULL
);
CREATE INDEX operations_cycle ON operations (cycle_id, date);
CREATE INDEX dettes_statut ON dettes (carnet_id, statut, echeance);
CREATE INDEX paiements_dette_dette ON paiements_dette (dette_id, date);
-- La somme des paiements d'une dette ne dépasse jamais son montant initial : SQLite le garantit ici,
-- le code le vérifie aussi pour afficher un message clair avant d'arriver à l'erreur.
CREATE TRIGGER paiements_dette_plafond BEFORE INSERT ON paiements_dette
WHEN NEW.montant + COALESCE((SELECT SUM(montant) FROM paiements_dette WHERE dette_id = NEW.dette_id), 0)
     > (SELECT montant_initial FROM dettes WHERE id = NEW.dette_id)
BEGIN
  SELECT RAISE(ABORT, 'paiement_superieur_au_reste');
END;
`;

// Version 2 : un seul cycle par carnet et par jour de début. Des cycles ont pu être créés en double par deux
// lectures simultanées au changement de cycle : on garde le plus ancien, on lui rattache les opérations et les
// plafonds des doublons (le plafond du cycle gardé l'emporte), puis l'index unique empêche toute récidive.
const V2 = `
CREATE TEMP TABLE cycles_garde AS
  SELECT c.id AS id,
         (SELECT k.id FROM cycles k WHERE k.carnet_id = c.carnet_id AND k.debut = c.debut ORDER BY k.rowid LIMIT 1) AS garde
  FROM cycles c;
UPDATE operations SET cycle_id = (SELECT g.garde FROM cycles_garde g WHERE g.id = operations.cycle_id)
  WHERE cycle_id IN (SELECT id FROM cycles_garde WHERE id <> garde);
INSERT OR IGNORE INTO plafonds (cycle_id, enveloppe_id, montant, report)
  SELECT g.garde, p.enveloppe_id, p.montant, p.report
  FROM plafonds p JOIN cycles_garde g ON g.id = p.cycle_id WHERE g.id <> g.garde;
DELETE FROM plafonds WHERE cycle_id IN (SELECT id FROM cycles_garde WHERE id <> garde);
-- Un doublon clos ferme le cycle gardé : le bilan a déjà été fait.
UPDATE cycles SET clos = 1
  WHERE id IN (SELECT g.garde FROM cycles_garde g JOIN cycles d ON d.id = g.id WHERE g.id <> g.garde AND d.clos = 1);
DELETE FROM cycles WHERE id IN (SELECT id FROM cycles_garde WHERE id <> garde);
DROP TABLE cycles_garde;
CREATE UNIQUE INDEX cycles_carnet_debut ON cycles (carnet_id, debut);
`;

/** Version 1 à la première, puis une entrée par évolution du schéma. */
export const migrations: readonly string[] = [V1, V2];

export const VERSION_SCHEMA = migrations.length;
