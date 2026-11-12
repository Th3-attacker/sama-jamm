import { Redirect } from 'expo-router';

/** Lien profond `samajamm://budget/ajouter` (raccourci d'icône) : ouvre la feuille d'ajout de dépense. */
export default function RelaisAjout() {
  return <Redirect href="/budget-ajout" />;
}
