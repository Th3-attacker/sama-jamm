import * as Localization from 'expo-localization';
import i18n, { changeLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { useReglages } from '@/stores/reglages';

import ar from './ar.json';
import fr from './fr.json';
import { estLangue, type Langue } from './langues';
import wo from './wo.json';

// Langue choisie à la bienvenue ; à défaut, celle du téléphone si elle est prise en charge.
function langueDuTelephone(): Langue {
  const code = Localization.getLocales()[0]?.languageCode;
  return estLangue(code) ? code : 'fr';
}

i18n
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, wo: { translation: wo }, ar: { translation: ar } },
    lng: useReglages.getState().langue ?? langueDuTelephone(),
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })
  .catch((erreur: unknown) => {
    console.error('Initialisation i18n impossible', erreur);
  });

useReglages.subscribe((etat, avant) => {
  if (etat.langue && etat.langue !== avant.langue) {
    changeLanguage(etat.langue).catch((erreur: unknown) => {
      console.error('Changement de langue impossible', erreur);
    });
  }
});

export default i18n;
