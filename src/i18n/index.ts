import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './ar.json';
import fr from './fr.json';
import wo from './wo.json';

export const langues = ['fr', 'wo', 'ar'] as const;
export type Langue = (typeof langues)[number];

// Langue choisie à la bienvenue (persistée plus tard) ; à défaut, celle du téléphone si elle est prise en charge.
function langueDuTelephone(): Langue {
  const code = Localization.getLocales()[0]?.languageCode;
  return langues.find((l) => l === code) ?? 'fr';
}

i18n
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, wo: { translation: wo }, ar: { translation: ar } },
    lng: langueDuTelephone(),
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })
  .catch((erreur: unknown) => {
    console.error('Initialisation i18n impossible', erreur);
  });

export default i18n;
