// Dons par wallet mobile, hors de l'app : Sama Jàmm ne prélève rien et ne voit jamais le code du wallet.

export const WALLETS = [
  { id: 'bankily', nom: 'Bankily' },
  { id: 'masrvi', nom: 'Masrvi' },
  { id: 'sedad', nom: 'Sedad' },
] as const;
export type IdWallet = (typeof WALLETS)[number]['id'];

/** Compte qui reçoit les dons en Mauritanie, sur les trois wallets. */
export const NUMERO_DONS = '37737353';
export const TITULAIRE_DONS = 'Elhadj Malick';
export const PAYS_DONS = 'Mauritanie';
/** Montants suggérés, en ouguiyas. */
export const MONTANTS_SUGGERES = [100, 200, 500] as const;
