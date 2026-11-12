// Généré depuis design/tokens.json par scripts/tokens-to-theme.mjs — ne pas modifier à la main.
export const themes = {
  "jour": {
    "couleurs": {
      "fond": "#f7f7f5",
      "surface": "#ffffff",
      "surfaceCreux": "#eeeff0",
      "ligne": "#dde0e2",
      "ligneForte": "#868e94",
      "encre": "#1b2024",
      "encre2": "#4a5258",
      "encre3": "#5e666c",
      "emeraude": "#1f5f4a",
      "emeraudeAplat": "#1f5f4a",
      "surEmeraude": "#f7f7f5",
      "emeraudeDoux": "#e4efeb",
      "surEmeraudeDoux": "#1f5f4a",
      "orSurEmeraude": "#e3cc97",
      "surEmeraude2": "#cfe8de",
      "or": "#b89a5e",
      "orTexte": "#7a5f2e",
      "orDoux": "#f1ece1",
      "surOr": "#1b2024",
      "erreur": "#b3261e",
      "surErreur": "#f7f7f5",
      "succes": "#2a6a52",
      "alerte": "#8a5a00",
      "info": "#1f5c8a",
      "anneauFocus": "#1f5f4a",
      "inverse": "#1b2024",
      "surInverse": "#f7f7f5",
      "accentInverse": "#c9a96a",
      "voile": "rgba(27, 32, 36, 0.45)",
      "marqueEmeraude": "#1f5f4a",
      "marqueOr": "#b89a5e",
      "marqueIvoire": "#f7f7f5",
      "marqueNuit": "#0f1714"
    },
    "ombres": {
      "ombre1": "0 1px 2px rgba(28,26,23,0.06), 0 2px 8px rgba(28,26,23,0.04)",
      "ombre2": "0 -2px 16px rgba(28,26,23,0.08)"
    }
  },
  "nuit": {
    "couleurs": {
      "fond": "#0e1115",
      "surface": "#14191e",
      "surfaceCreux": "#0a0d10",
      "ligne": "#20272e",
      "ligneForte": "#5d6870",
      "encre": "#c9cdd0",
      "encre2": "#b3b8bc",
      "encre3": "#9aa0a5",
      "emeraude": "#72ad98",
      "emeraudeAplat": "#245747",
      "surEmeraude": "#d5ddd9",
      "emeraudeDoux": "#1a312a",
      "surEmeraudeDoux": "#b5d2c6",
      "orSurEmeraude": "#d8c08a",
      "surEmeraude2": "#c4d9cf",
      "or": "#a28955",
      "orTexte": "#bfa670",
      "orDoux": "#1f1c16",
      "surOr": "#14161a",
      "erreur": "#d58f88",
      "surErreur": "#0e1115",
      "succes": "#72ad98",
      "alerte": "#c29c50",
      "info": "#7fa9c8",
      "anneauFocus": "#bfa670",
      "inverse": "#20272e",
      "surInverse": "#c9cdd0",
      "accentInverse": "#bfa670",
      "voile": "rgba(0, 0, 0, 0.7)",
      "marqueEmeraude": "#1f5f4a",
      "marqueOr": "#b89a5e",
      "marqueIvoire": "#f7f7f5",
      "marqueNuit": "#0f1714"
    },
    "ombres": {
      "ombre1": "none",
      "ombre2": "none"
    }
  }
} as const;
export const espace = {
  "espace1": 4,
  "espace2": 8,
  "espace3": 12,
  "espace4": 16,
  "espace5": 20,
  "espace6": 24,
  "espace8": 32,
  "espace12": 48,
  "espace16": 64
} as const;
export const rayon = {
  "rayonPuce": 6,
  "rayonCarte": 12,
  "rayonFeuille": 20,
  "rayonPastille": 999
} as const;
export const cible = {
  "cibleIos": 44,
  "cibleAndroid": 48
} as const;
export const miseEnPage = {
  "largeurMoyenne": 600,
  "largeurEtendue": 840,
  "colonneLecture": 760,
  "panneauListe": 360,
  "panneauFiche": 540,
  "margeCompacte": 24,
  "margeMoyenne": 32,
  "margeEtendue": 48,
  "barreHaut": 56,
  "ligneListe": 56,
  "miniLecteur": 56,
  "miniLecteurMince": 40,
  "compteurFixe": 72,
  "piluleOutils": 48,
  "ecartCouches": 8,
  "margeContenuBas": 16,
  "plafondPile": 0.35,
  "iconeOnglet": 24,
  "libelleOngletIos": 10,
  "libelleOngletAndroid": 12,
  "largeurGrande": 1200,
  "largeurTresGrande": 1600,
  "hauteurCompacte": 480,
  "hauteurEtendue": 900
} as const;
export const tailleTexte = [12,14,16,18,24,30,40,44,56] as const;
export const tailleArabe = [22,28,34] as const;
export const tailles = {
  "t12": 12,
  "t14": 14,
  "t16": 16,
  "t18": 18,
  "t24": 24,
  "t30": 30,
  "t40": 40,
  "t44": 44,
  "t56": 56,
  "t22": 22,
  "t28": 28,
  "t34": 34
} as const;
export const interlignes = {
  "l16": 16,
  "l20": 20,
  "l24": 24,
  "l30": 30,
  "l36": 36,
  "l44": 44,
  "l48": 48,
  "l60": 60,
  "l40": 40,
  "l56": 56,
  "l64": 64
} as const;
export const echelleEspace = [0,4,8,12,16,20,24,32,40,48,56,64,80,96,128] as const;
export type NomTheme = keyof typeof themes;
export type Couleurs = (typeof themes)[NomTheme]['couleurs'];
export type Ombres = (typeof themes)[NomTheme]['ombres'];
