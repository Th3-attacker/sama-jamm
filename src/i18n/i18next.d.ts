import 'i18next';

import type fr from './fr.json';

// Le français est la référence : t() n'accepte que ses clés.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof fr };
  }
}
