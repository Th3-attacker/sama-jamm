// Sons des rappels : seuls « court », « vibration » et « silencieux » sont proposés. Les anciennes valeurs
// « complet » et « doux », encore enregistrées sur certains téléphones, deviennent « court ».
export function migrerSonsAnciens(sons: unknown): unknown {
  if (!sons || typeof sons !== 'object') return sons;
  return Object.fromEntries(
    Object.entries(sons).map(([priere, son]) => [priere, son === 'complet' || son === 'doux' ? 'court' : son]),
  );
}
