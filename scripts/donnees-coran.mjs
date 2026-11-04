// Convertit les données de Tanzil (tanzil.net, CC BY 3.0 ; traduction non commerciale) pour l'app.
// Usage : node scripts/donnees-coran.mjs <dossier contenant quran-data.js et en.transliteration.txt>
// Le fichier JavaScript de Tanzil n'est jamais exécuté : ses tableaux sont lus comme du texte.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dossier = process.argv[2];
if (!dossier) throw new Error('Dossier des fichiers Tanzil manquant.');
const meta = readFileSync(join(dossier, 'quran-data.js'), 'utf8');

function section(nom) {
  const debut = meta.indexOf(`QuranData.${nom} = [`);
  if (debut < 0) throw new Error(`Section ${nom} absente.`);
  const fin = meta.indexOf('];', debut);
  return meta.slice(debut, fin);
}
// La dernière entrée [115, 1] marque la fin du Coran : elle n'est pas un repère.
const couples = (nom) =>
  [...section(nom).matchAll(/\[(\d+),\s*(\d+)\]/g)].map((m) => [Number(m[1]), Number(m[2])]).filter(([s]) => s <= 114);

const juz = couples('Juz');
const quartsHizb = couples('HizbQaurter');
const sajdas = [...section('Sajda').matchAll(/\[(\d+),\s*(\d+),\s*'(\w+)'\]/g)].map((m) => [
  Number(m[1]),
  Number(m[2]),
  m[3] === 'obligatory' ? 'obligatoire' : 'recommandee',
]);
if (juz.length !== 30 || quartsHizb.length !== 240 || sajdas.length !== 15)
  throw new Error(`Repères inattendus : ${juz.length} juz, ${quartsHizb.length} quarts, ${sajdas.length} sajdas.`);

// Translittération : « sourate|verset|texte », gardée telle quelle (balises <u> et <b> comprises).
const translit = Array.from({ length: 114 }, () => []);
for (const ligne of readFileSync(join(dossier, 'en.transliteration.txt'), 'utf8').split('\n')) {
  const m = /^(\d+)\|(\d+)\|(.*)$/.exec(ligne.trimEnd());
  if (m) translit[Number(m[1]) - 1][Number(m[2]) - 1] = m[3];
}
const total = translit.reduce((n, s) => n + s.length, 0);
if (total !== 6236) throw new Error(`Translittération incomplète : ${total} versets.`);

writeFileSync('src/data/coran/reperes.json', JSON.stringify({ juz, quartsHizb, sajdas }) + '\n');
writeFileSync('src/data/coran/translit.json', JSON.stringify(translit) + '\n');
console.log('ok', { juz: juz.length, quartsHizb: quartsHizb.length, sajdas: sajdas.length, versets: total });
