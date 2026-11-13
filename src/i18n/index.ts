import * as Localization from 'expo-localization';
import i18n, { changeLanguage, use as brancherPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { chiffresAffiches, chiffresIndiensActifs, definirChiffresIndiens } from '@/lib/chiffres';
import { useReglages } from '@/stores/reglages';

import ar from './ar.json';
import en from './en.json';
import fr from './fr.json';
import { estLangueProposee, type Langue } from './langues';
import wo from './wo.json';

// Langue choisie à la bienvenue ; à défaut, celle du téléphone si elle est proposée.
function langueDuTelephone(): Langue {
  const code = Localization.getLocales()[0]?.languageCode;
  return estLangueProposee(code) ? code : 'fr';
}

// Chiffres indiens dans tous les textes traduits (nombres interpolés compris) ; le code pour le support reste tel quel.
const POST_CHIFFRES = {
  type: 'postProcessor',
  name: 'chiffres',
  process: (valeur: string, cle: string | string[]) => {
    const nom = Array.isArray(cle) ? (cle[0] ?? '') : cle;
    return nom.endsWith('erreurCode') ? valeur : chiffresAffiches(valeur);
  },
} as const;

brancherPlugin(initReactI18next)
  .use(POST_CHIFFRES)
  .init({
    postProcess: ['chiffres'],
    resources: { fr: { translation: fr }, en: { translation: en }, wo: { translation: wo }, ar: { translation: ar } },
    lng: useReglages.getState().langue ?? langueDuTelephone(),
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })
  .then(() => synchroniserChiffres())
  .catch((erreur: unknown) => {
    console.error('Initialisation i18n impossible', erreur);
  });

/**
 * Chiffres indiens : actifs en arabe avec le réglage « Chiffres arabes ». Quand l'état change, les textes déjà
 * affichés se redessinent (react-i18next écoute `languageChanged`).
 */
function synchroniserChiffres(): void {
  const voulu = useReglages.getState().chiffresArabes && i18n.language === 'ar';
  if (voulu === chiffresIndiensActifs()) return;
  definirChiffresIndiens(voulu);
  i18n.emit('languageChanged', i18n.language);
}

useReglages.subscribe((etat, avant) => {
  if (etat.chiffresArabes !== avant.chiffresArabes) synchroniserChiffres();
  if (etat.langue && etat.langue !== avant.langue) {
    changeLanguage(etat.langue)
      .then(() => synchroniserChiffres())
      .catch((erreur: unknown) => {
        console.error('Changement de langue impossible', erreur);
      });
  }
});

export default i18n;
