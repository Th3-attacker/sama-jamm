// La Veille (thème atténué d'Isha à Fajr) n'existe plus : le thème sombre unique, « nuit », a son apparence.
// Un ancien téléphone a pu enregistrer le thème « veille » et les deux réglages de la Veille automatique ; on les
// ramène à « nuit » ou on les efface, sans toucher au reste.
export function retirerVeille(etat: Record<string, unknown>): void {
  if (etat.theme === 'veille') etat.theme = 'nuit';
  delete etat.veilleAuto;
  delete etat.veilleVue;
}
