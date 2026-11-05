import { Share } from 'react-native';

import i18n from '@/i18n';

import { lienInvitation } from './logique';

/** Invitation par la feuille de partage du téléphone (WhatsApp, SMS…) : lien et code, pour le saisir à la main. */
export async function inviter(nom: string, code: string): Promise<void> {
  await Share.share({ message: i18n.t('khatm.messageInvitation', { nom, lien: lienInvitation(code), code }) });
}
