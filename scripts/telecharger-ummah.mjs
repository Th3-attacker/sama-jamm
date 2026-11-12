// Télécharge les données de UmmahAPI (https://ummahapi.com/api/docs) dans src/data/ummah/.
// Usage : node scripts/telecharger-ummah.mjs
// Source : API publique, sans licence déclarée (à valider, voir docs/deploiement/licences.md).
// Les données sont réduites aux champs utilisés par l'app. Les audios et les traductions non utilisées sont exclus.
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://ummahapi.com/api';
const SORTIE = join(import.meta.dirname, '..', 'src', 'data', 'ummah');
const PAUSE_MS = 250; // Reste sous la limite de 5 000 requêtes par 15 min sans clé.
const EN_TETE = { 'User-Agent': 'sama-jamm-import/1.0' };

const pause = () => new Promise((r) => setTimeout(r, PAUSE_MS));

async function lire(chemin) {
  const reponse = await fetch(`${BASE}${chemin}`, { headers: EN_TETE });
  if (!reponse.ok) throw new Error(`${chemin} : HTTP ${reponse.status}`);
  const json = await reponse.json();
  if (!json.success) throw new Error(`${chemin} : réponse sans succès`);
  await pause();
  return json.data;
}

const hash = (texte) => createHash('sha256').update(texte).digest('hex');
const fichiers = [];
function ecrire(nom, objet) {
  const texte = `${JSON.stringify(objet, null, 0)}\n`;
  writeFileSync(join(SORTIE, nom), texte, 'utf8');
  fichiers.push({ fichier: nom, octets: Buffer.byteLength(texte), sha256: hash(texte) });
  console.log(`écrit ${nom} (${Buffer.byteLength(texte)} octets)`);
}

mkdirSync(SORTIE, { recursive: true });

// 1. Sourates : texte arabe et traduction française de chaque verset.
const sourates = [];
for (let n = 1; n <= 114; n++) {
  const d = await lire(`/quran/surah/${n}`);
  sourates.push({
    numero: n,
    nomArabe: d.surah.name_arabic,
    nomAnglais: d.surah.name_english,
    versets: d.verses.map((v) => ({
      verset: v.ayah,
      arabe: v.arabic,
      francais: v.translations?.french ?? null,
    })),
  });
}
ecrire('sourates.json', { source: 'UmmahAPI /api/quran/surah/{n}', sourates });

// 2. Pages du Mushaf : mots groupés par ligne, marqueurs de fin de verset exclus.
const pages = [];
for (let p = 1; p <= 604; p++) {
  const d = await lire(`/quran/page/${p}`);
  pages.push({
    page: p,
    mots: d.words
      .filter((w) => w.char_type_name === 'word')
      .map((w) => ({
        ligne: w.line_number,
        sourate: w.surah_number,
        verset: w.ayah_number,
        texte: w.text_uthmani,
      })),
  });
}
ecrire('pages.json', { source: 'UmmahAPI /api/quran/page/{p}', pages });

// 3. Juz : bornes (verses_mapping) et clés des versets, sans textes en double.
const juz = [];
for (let j = 1; j <= 30; j++) {
  const d = await lire(`/quran/juz/${j}`);
  juz.push({
    juz: d.juz_number,
    bornes: d.verses_mapping,
    versets: d.verses.map((v) => v.verse_key),
  });
}
ecrire('juz.json', { source: 'UmmahAPI /api/quran/juz/{n}', juz });

// 4. Invocations : catégories puis duas de chaque catégorie.
const categories = await lire('/duas/categories');
const duas = [];
for (const c of categories.categories) {
  const d = await lire(`/duas/category/${c.id}`);
  duas.push(...d.duas);
}
ecrire('duas.json', {
  source: 'UmmahAPI /api/duas/categories et /api/duas/category/{id}',
  categories: categories.categories,
  duas,
});

// 5. Manifeste : date, nombre d'éléments et empreinte de chaque fichier.
ecrire('manifeste.json', {
  source: 'https://ummahapi.com/api/docs',
  licence: 'Non déclarée : à valider avant toute publication',
  telechargeLe: new Date().toISOString(),
  comptes: { sourates: sourates.length, pages: pages.length, juz: juz.length, duas: duas.length },
  fichiers,
});
