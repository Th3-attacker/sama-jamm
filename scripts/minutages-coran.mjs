// Récupère, une seule fois, le fichier audio de chaque sourate et le début de chaque verset (Quran Foundation),
// pour l'écoute par sourate complète. Rien n'est appelé depuis l'app : le résultat est écrit dans le dépôt.
//
// Usage :
//   QF_CLIENT_ID=… QF_CLIENT_SECRET=… node scripts/minutages-coran.mjs            → liste les récitateurs disponibles
//   QF_CLIENT_ID=… QF_CLIENT_SECRET=… node scripts/minutages-coran.mjs ar.alafasy=7 ar.husary=…
//     → écrit src/data/coran/minutages.json pour ces récitateurs (identifiant de l'app = identifiant Quran Foundation)
//
// Variables facultatives : QF_ENV=prelive (production par défaut), QF_SCOPE (content par défaut).
// Les identifiants ne sont jamais écrits dans le dépôt ni affichés.
import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync } from 'node:fs';

const prelive = process.env.QF_ENV === 'prelive';
const OAUTH = prelive ? 'https://prelive-oauth2.quran.foundation' : 'https://oauth2.quran.foundation';
const API = `${prelive ? 'https://apis-prelive.quran.foundation' : 'https://apis.quran.foundation'}/content/api/v4`;
const AGENT = 'sama-jamm-minutages/1.0';
const SORTIE = new URL('../src/data/coran/minutages.json', import.meta.url);
const VERSETS = JSON.parse(readFileSync(new URL('../src/data/coran/ar.json', import.meta.url), 'utf8')).map(
  (versets) => versets.length,
);

const clientId = process.env.QF_CLIENT_ID;
const secret = process.env.QF_CLIENT_SECRET;
if (!clientId || !secret) throw new Error('QF_CLIENT_ID et QF_CLIENT_SECRET sont requis.');

async function jeton() {
  const reponse = await fetch(`${OAUTH}/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': AGENT,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope: process.env.QF_SCOPE ?? 'content' }),
  });
  if (!reponse.ok) throw new Error(`Jeton refusé : HTTP ${reponse.status} ${await reponse.text()}`);
  const { access_token: acces } = await reponse.json();
  if (typeof acces !== 'string') throw new Error('Réponse du jeton sans access_token.');
  return acces;
}

const acces = await jeton();

async function lire(chemin, essais = 3) {
  for (let essai = 1; ; essai++) {
    const reponse = await fetch(`${API}${chemin}`, {
      headers: { 'x-auth-token': acces, 'x-client-id': clientId, 'User-Agent': AGENT },
    });
    if (reponse.ok) return reponse.json();
    if (essai >= essais || (reponse.status !== 429 && reponse.status < 500)) {
      throw new Error(`${chemin} : HTTP ${reponse.status}`);
    }
    await new Promise((r) => setTimeout(r, 1000 * essai));
  }
}

const demandes = process.argv.slice(2);
if (demandes.length === 0) {
  const { reciters } = await lire('/resources/chapter_reciters');
  console.log('Récitateurs (sourates complètes) — à passer sous la forme idApp=id :');
  for (const r of reciters ?? []) {
    console.log(`  ${r.id}\t${r.name ?? r.reciter_name ?? ''}\t${r.style?.name ?? r.style ?? ''}`);
  }
  process.exit(0);
}

/** { [idApp]: { id, sourates: { [n]: { url, debuts: [ms par verset] } } } } */
const resultat = {};
const problemes = [];
for (const demande of demandes) {
  const [idApp, idQf] = demande.split('=');
  const id = Number(idQf);
  if (!idApp || !Number.isInteger(id)) throw new Error(`Forme attendue idApp=id : « ${demande} »`);
  const sourates = {};
  for (let n = 1; n <= 114; n++) {
    const { audio_file: fichier, timestamps } = await lire(`/chapter_recitations/${id}/${n}`);
    const debuts = (timestamps ?? []).map((t) => t.timestamp_from);
    const attendus = VERSETS[n - 1];
    if (typeof fichier?.audio_url !== 'string') {
      problemes.push(`${idApp} sourate ${n} : pas de fichier audio`);
      continue;
    }
    if (debuts.length !== attendus || debuts.some((d, i) => !Number.isFinite(d) || (i > 0 && d < debuts[i - 1]))) {
      problemes.push(`${idApp} sourate ${n} : ${debuts.length} minutages pour ${attendus} versets`);
      continue;
    }
    sourates[n] = { url: fichier.audio_url, debuts };
  }
  resultat[idApp] = { id, sourates };
  console.log(`${idApp} : ${Object.keys(sourates).length}/114 sourates`);
}

writeFileSync(SORTIE, `${JSON.stringify(resultat)}\n`);
console.log(`Écrit : ${SORTIE.pathname}`);
if (problemes.length > 0) {
  console.warn(`Sourates écartées (${problemes.length}) :`);
  for (const p of problemes) console.warn(`  ${p}`);
}
