// Liens publics de l'app. SITE est le seul endroit à changer si le site est déplacé (nouvelle version de l'app requise).
// Un lien vide (null) masque sa ligne dans À propos tant qu'il n'est pas choisi.
export const SITE = 'https://sama-jamm-site.vercel.app';
export const URL_CONFIDENTIALITE = `${SITE}/confidentialite`;
export const URL_SUPPRIMER_COMPTE = `${SITE}/supprimer-compte`;
/** Lu par l'écran de mise à jour bloquante : toujours sur le même site que les pages légales. */
export const URL_VERSION = `${SITE}/version.json`;
export const URL_CONDITIONS = `${SITE}/conditions`;
export const URL_AIDE = `${SITE}/aide`;
export const URL_STORE_ANDROID = 'https://play.google.com/store/apps/details?id=com.samajamm.app';
/** À renseigner quand l'app existe sur l'App Store (https://apps.apple.com/app/id…). */
export const URL_STORE_IOS: string | null = null;
export const EMAIL_CONTACT: string | null = 'haje.malik5@gmail.com';
