import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  appliquerSensLecture,
  sensChange,
} from "@/features/bienvenue/sensDeLecture";
import { estLangueProposee, type Langue } from "@/i18n/langues";
import { useReglages } from "@/stores/reglages";
import { echelleMax } from "@/theme/typographie";
import { useTheme } from "@/theme/useTheme";
import { Banner } from "@/ui/Banner";
import { themes } from "@/theme/tokens.generated";
import { Logo } from "@/ui/Logo";
import { PageDots } from "@/ui/PageDots";

// Noms des langues dans leur propre langue : ils ne se traduisent pas.
const OPTIONS: { id: Langue; label: string; arabe?: boolean }[] = [
  { id: "fr", label: "Français" },
  { id: "ar", label: "العربية", arabe: true },
];

export default function EcranLangue() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie, latin } = useTheme();
  const langueEnregistree = useReglages((s) => s.langue);
  const definirLangue = useReglages((s) => s.definirLangue);
  const definirTraduction = useReglages((s) => s.definirTraduction);
  // Vrai après un changement de sens de lecture : la mise en page s'applique à la prochaine ouverture.
  const [sensDiffere, setSensDiffere] = useState(false);

  const choisie: Langue =
    langueEnregistree ?? (estLangueProposee(i18n.language) ? i18n.language : "fr");
  const ivoire = couleurs.marqueIvoire;
  // Le fond émeraude ne change pas avec le thème : textes secondaires et lignes du thème jour.
  const surEmeraude2 = themes.jour.couleurs.surEmeraude2;
  const ligneForte = themes.jour.couleurs.ligneForte;

  const choisir = (langue: Langue) => {
    definirLangue(langue);
    // La traduction du Coran suit la langue ; en interface arabe, le français par défaut.
    definirTraduction(langue === "ar" ? "fr" : langue);
    // Le sens de lecture est enregistré pour la prochaine ouverture ; la langue, elle, change tout de suite.
    appliquerSensLecture(langue);
    setSensDiffere(sensChange(langue));
  };

  const continuer = () => {
    if (!langueEnregistree) choisir(choisie);
    router.push("/position");
  };

  return (
    <SafeAreaView
      style={[
        styles.ecran,
        {
          backgroundColor: couleurs.marqueEmeraude,
          paddingHorizontal: espace.espace6,
          paddingBottom: espace.espace6,
        },
      ]}
    >
      <StatusBar style="light" />
      <View
        style={[styles.haut, { paddingTop: espace.espace12 }]}
      >
        {/* Décalage de −16 : l'étoile s'aligne optiquement sur le bord du texte. */}
        <View style={{ marginStart: -espace.espace4 }}>
          <Logo taille={96} variante="or" />
        </View>
        <Text
          accessibilityRole="header"
          accessibilityLanguage="wo"
          maxFontSizeMultiplier={echelleMax.grand}
          style={[
            latin.display,
            styles.wolof,
            { color: ivoire, fontSize: 56, lineHeight: 60, marginTop: espace.espace6 },
          ]}
        >
          {t("bienvenue.langueTitre")}
        </Text>
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          style={[
            typographie.translitteration,
            { color: surEmeraude2, fontSize: 18, lineHeight: 24, marginTop: espace.espace3 },
          ]}
        >
          {t("bienvenue.langueSousTitre")}
        </Text>
      </View>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t("bienvenue.langueChoisir")}
        style={{ gap: espace.espace3 }}
      >
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.libelle, { color: surEmeraude2 }]}
        >
          {t("bienvenue.langueChoisir")}
        </Text>
        {OPTIONS.map((o) => {
          const on = o.id === choisie;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLanguage={o.id}
              onPress={() => choisir(o.id)}
              style={[
                styles.option,
                {
                  minHeight: 56,
                  paddingHorizontal: espace.espace4,
                  borderRadius: rayon.rayonCarte,
                  borderColor: on ? ivoire : ligneForte,
                  backgroundColor: on ? ivoire : "transparent",
                },
              ]}
            >
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[
                  o.arabe ? typographie.arabe : latin.titre3,
                  {
                    color: on ? couleurs.marqueEmeraude : ivoire,
                    lineHeight: o.arabe ? 34 : 24,
                  },
                ]}
              >
                {o.label}
              </Text>
              {on ? (
                <Text
                  maxFontSizeMultiplier={echelleMax.courant}
                  style={[
                    latin.corps,
                    { color: couleurs.marqueEmeraude, fontSize: 14, lineHeight: 20 },
                  ]}
                >
                  {t("bienvenue.langueChoisie")}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {sensDiffere ? (
        <View style={{ marginTop: espace.espace4 }}>
          <Banner ton="info">{t("bienvenue.sensProchaineOuverture")}</Banner>
        </View>
      ) : null}

      <View style={[styles.bas, { marginTop: espace.espace8 }]}>
        <PageDots total={3} actif={0} surEmeraude />
        <Pressable
          accessibilityRole="button"
          onPress={continuer}
          style={({ pressed }) => [
            styles.continuer,
            {
              minHeight: 52,
              paddingHorizontal: espace.espace8,
              borderRadius: rayon.rayonCarte,
              backgroundColor: ivoire,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[
              typographie.libelle,
              { color: couleurs.marqueEmeraude, fontSize: 16 },
            ]}
          >
            {t("commun.continuer")}
          </Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  haut: { flex: 1 },
  // Formule wolof : bloc de gauche à droite, même en interface arabe.
  wolof: { writingDirection: "ltr" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  bas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  continuer: { alignItems: "center", justifyContent: "center" },
});
