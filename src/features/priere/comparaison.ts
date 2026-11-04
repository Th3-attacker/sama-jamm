// Ne reprogrammer que ce qui change : comparaison pure entre les notifications voulues et celles déjà programmées.

export type Voulue = { id: string; empreinte: string };

/**
 * `programmees` : identifiants de prière réellement programmés dans le système.
 * `empreintes` : empreinte enregistrée lors de la dernière programmation de chaque identifiant (peut être vide).
 * Une notification est (re)programmée si elle manque, ou si son empreinte (jour, heure, son, texte) a changé ;
 * elle est annulée si elle n'est plus voulue ou si elle va être remplacée.
 */
export function comparerFenetre(
  programmees: ReadonlySet<string>,
  empreintes: Readonly<Record<string, string>>,
  voulues: readonly Voulue[],
): { annuler: string[]; programmer: string[] } {
  const voulu = new Map(voulues.map((v) => [v.id, v.empreinte]));
  const programmer = voulues.filter((v) => !programmees.has(v.id) || empreintes[v.id] !== v.empreinte).map((v) => v.id);
  const aRemplacer = new Set(programmer);
  const annuler = [...programmees].filter((id) => !voulu.has(id) || aRemplacer.has(id));
  return { annuler, programmer };
}
