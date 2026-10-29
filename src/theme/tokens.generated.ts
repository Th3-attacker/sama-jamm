// Généré depuis design/tokens.json par scripts/tokens-to-theme.mjs — ne pas modifier à la main.
export const themes = {
  "jour": {
    "couleurs": {
      "fond": "#fdfbf7",
      "surface": "#ffffff",
      "surfaceCreux": "#f4eee2",
      "ligne": "#e6decf",
      "ligneForte": "#928773",
      "encre": "#1c1a17",
      "encre2": "#5c574f",
      "encre3": "#6b655c",
      "emeraude": "#0a4224",
      "surEmeraude": "#fdfbf7",
      "emeraudeDoux": "#e3eee6",
      "surEmeraudeDoux": "#0a4224",
      "or": "#c5a059",
      "orTexte": "#7a5c22",
      "orDoux": "#f6edda",
      "surOr": "#1c1a17",
      "erreur": "#b3261e",
      "surErreur": "#fdfbf7",
      "succes": "#2e6a45",
      "alerte": "#8a5a00",
      "info": "#1f5c8a",
      "anneauFocus": "#0a4224",
      "inverse": "#1c1a17",
      "surInverse": "#fdfbf7",
      "accentInverse": "#d9b871",
      "voile": "rgba(28, 26, 23, 0.45)",
      "marqueEmeraude": "#0a4224",
      "marqueOr": "#c5a059",
      "marqueIvoire": "#fdfbf7",
      "marqueNuit": "#0b1f15"
    },
    "ombres": {
      "ombre1": "0 1px 2px rgba(28,26,23,0.06), 0 2px 8px rgba(28,26,23,0.04)",
      "ombre2": "0 -2px 16px rgba(28,26,23,0.08)"
    }
  },
  "nuit": {
    "couleurs": {
      "fond": "#0b1f15",
      "surface": "#11291c",
      "surfaceCreux": "#08170f",
      "ligne": "#25402f",
      "ligneForte": "#5a7a64",
      "encre": "#e6dfd2",
      "encre2": "#d0c8b8",
      "encre3": "#b8b0a0",
      "emeraude": "#86cda2",
      "surEmeraude": "#0b1f15",
      "emeraudeDoux": "#154a2c",
      "surEmeraudeDoux": "#cfe8d8",
      "or": "#c5a059",
      "orTexte": "#d9b871",
      "orDoux": "#2a2415",
      "surOr": "#1c1a17",
      "erreur": "#f2a69f",
      "surErreur": "#0b1f15",
      "succes": "#86cda2",
      "alerte": "#e3b65c",
      "info": "#8ec1e8",
      "anneauFocus": "#d9b871",
      "inverse": "#22402e",
      "surInverse": "#e6dfd2",
      "accentInverse": "#d9b871",
      "voile": "rgba(0, 0, 0, 0.6)",
      "marqueEmeraude": "#0a4224",
      "marqueOr": "#c5a059",
      "marqueIvoire": "#fdfbf7",
      "marqueNuit": "#0b1f15"
    },
    "ombres": {
      "ombre1": "none",
      "ombre2": "none"
    }
  },
  "veille": {
    "couleurs": {
      "fond": "#09160f",
      "surface": "#0e1f16",
      "surfaceCreux": "#060f0a",
      "ligne": "#1a3022",
      "ligneForte": "#567260",
      "encre": "#cfc6b5",
      "encre2": "#beb6a5",
      "encre3": "#a8a192",
      "emeraude": "#78b690",
      "surEmeraude": "#09160f",
      "emeraudeDoux": "#103722",
      "surEmeraudeDoux": "#b5d2c0",
      "or": "#a88a4e",
      "orTexte": "#bfa165",
      "orDoux": "#211c11",
      "surOr": "#141210",
      "erreur": "#d58f88",
      "surErreur": "#09160f",
      "succes": "#78b690",
      "alerte": "#c29c50",
      "info": "#7fa9c8",
      "anneauFocus": "#bfa165",
      "inverse": "#183022",
      "surInverse": "#cfc6b5",
      "accentInverse": "#bfa165",
      "voile": "rgba(0, 0, 0, 0.7)",
      "marqueEmeraude": "#0a4224",
      "marqueOr": "#c5a059",
      "marqueIvoire": "#fdfbf7",
      "marqueNuit": "#0b1f15"
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
export type NomTheme = keyof typeof themes;
export type Couleurs = (typeof themes)[NomTheme]['couleurs'];
export type Ombres = (typeof themes)[NomTheme]['ombres'];
