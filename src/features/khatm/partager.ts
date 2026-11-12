import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

import i18n from '@/i18n';

/** Texte de l'invitation : salutation, présentation, intention (si elle existe), comment rejoindre avec le code. */
export function texteInvitation(nom: string, intention: string | null, code: string): string {
  const t = i18n.t.bind(i18n);
  const phrases = [t('khatm.invitSalut'), t('khatm.invitCorps', { nom })];
  if (intention?.trim()) phrases.push(intention.trim());
  phrases.push(t('khatm.invitRejoindre', { code }), t('khatm.invitFin'));
  return phrases.join('\n\n');
}

/** Invitation par la feuille de partage du téléphone (WhatsApp, SMS…) : le code à saisir, sans lien. */
export async function inviter(nom: string, intention: string | null, code: string): Promise<void> {
  await Share.share({ message: texteInvitation(nom, intention, code) });
}

/** Copie le code seul, sans texte ni lien. */
export async function copierCode(code: string): Promise<void> {
  await Clipboard.setStringAsync(code);
}
