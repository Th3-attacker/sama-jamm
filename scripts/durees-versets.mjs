// Estime, une seule fois, la durée de chaque verset de chaque récitateur : les fichiers sont à 64 kbit/s constant,
// donc durée = octets × 8 / 64 000. Seule la taille est lue (requête HEAD), aucun fichier n'est téléchargé.
// Rien n'est appelé depuis l'app : le résultat est écrit dans src/data/coran/durees.json (dixièmes de seconde).
//
// Un fichier absent du CDN reste à 0 et est listé à la fin.
// Usage : node scripts/durees-versets.mjs          (reprend là où le fichier de sortie s'est arrêté)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const DEBIT = 64;
const TOTAL = 6236;
const PARALLELE = 12;
const AGENT = 'sama-jamm-durees/1.0';
const SORTIE = new URL('../src/data/coran/durees.json', import.meta.url);
const RECITATEURS = ['ar.alafasy', 'ar.husary', 'ar.abdulsamad', 'ar.hudhaify', 'ar.mahermuaiqly'];

const resultat = existsSync(SORTIE) ? JSON.parse(readFileSync(SORTIE, 'utf8')) : {};

async function taille(id, n) {
  const url = `https://cdn.islamic.network/quran/audio/${DEBIT}/${id}/${n}.mp3`;
  for (let essai = 1; essai <= 4; essai++) {
    try {
      const r = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': AGENT, 'Accept-Encoding': 'identity' } });
      if (r.ok) {
        const octets = Number(r.headers.get('content-length'));
        if (Number.isInteger(octets) && octets > 0) return octets;
      }
    } catch {
      // nouvel essai ci-dessous
    }
    await new Promise((ok) => setTimeout(ok, 400 * essai));
  }
  return null;
}

for (const id of RECITATEURS) {
  const durees = resultat[id] ?? new Array(TOTAL).fill(0);
  const aFaire = [];
  const manquants = [];
  for (let n = 1; n <= TOTAL; n++) if (!durees[n - 1]) aFaire.push(n);
  let suivant = 0;
  async function ouvrier() {
    while (suivant < aFaire.length) {
      const n = aFaire[suivant++];
      const octets = await taille(id, n);
      // Fichier absent du CDN : durée 0, le lecteur n'affiche alors pas de temps pour cette sourate.
      if (octets === null) manquants.push(n);
      else durees[n - 1] = Math.max(1, Math.round((octets * 8) / (DEBIT * 100)));
    }
  }
  await Promise.all(Array.from({ length: PARALLELE }, ouvrier));
  resultat[id] = durees;
  writeFileSync(SORTIE, JSON.stringify(resultat));
  console.log(`${id} : ${aFaire.length - manquants.length} versets mesurés, absents du CDN : ${manquants.join(', ') || 'aucun'}`);
}
