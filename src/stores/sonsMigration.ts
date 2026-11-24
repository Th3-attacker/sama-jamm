// Sons des rappels : seuls « court », « vibration » et « silencieux » sont proposés. Les anciennes valeurs
// « complet » et « doux », encore enregistrées sur certains téléphones, deviennent « court ».
/** Migre `sons` dans l'état enregistré, seulement s'il y est : une clé absente ne doit pas devenir `undefined`
 * (elle écraserait la valeur par défaut au rechargement). */
export function appliquerSonsAnciens(etat: Record<string, unknown>): void {
  if ('sons' in etat) etat.sons = migrerSonsAnciens(etat.sons);
}

export function migrerSonsAnciens(sons: unknown): unknown {
  if (!sons || typeof sons !== 'object') return sons;
  return Object.fromEntries(
    Object.entries(sons).map(([priere, son]) => [priere, son === 'complet' || son === 'doux' ? 'court' : son]),
  );
}
