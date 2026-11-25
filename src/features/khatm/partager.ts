import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

import i18n from '@/i18n';

import { lienWebInvitation } from './logique';

/** Texte de l'invitation, court : présentation, intention (si elle existe), lien, puis le code seul sur sa ligne. */
export function texteInvitation(nom: string, intention: string | null, code: string): string {
  const t = i18n.t.bind(i18n);
  const lignes = [t('khatm.invitCorps', { nom })];
  if (intention?.trim()) lignes.push(intention.trim());
  lignes.push(lienWebInvitation(code), code);
  return lignes.join('\n');
}

/** Invitation par la feuille de partage du téléphone (WhatsApp, SMS…) : le lien et le code seul. */
export async function inviter(nom: string, intention: string | null, code: string): Promise<void> {
  await Share.share({ message: texteInvitation(nom, intention, code) });
}

/** Copie le code seul, sans texte ni lien. */
export async function copierCode(code: string): Promise<void> {
  await Clipboard.setStringAsync(code);
}
