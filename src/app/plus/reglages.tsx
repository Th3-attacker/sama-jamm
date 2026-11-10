import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  appliquerSensEtRedemarrer,
  demandeRedemarrage,
} from "@/features/bienvenue/sensDeLecture";
import { authentifier, verrouPossible } from "@/features/budget/verrou";
import { depotBudget } from "@/features/budget/useBudget";
import { EtatAutorisations } from "@/features/autorisation/EtatAutorisations";
import { useSession } from "@/features/compte/compte";
import { ReglageTaille } from "@/features/lire/BarreTaille";
import { ReglagesLecture } from "@/features/lire/ReglagesLecture";
import { estLangueProposee, languesProposees, type Langue } from "@/i18n/langues";
import { useReglages } from "@/stores/reglages";
import { echelleMax } from "@/theme/typographie";
import { themes } from "@/theme/tokens.generated";
import { useTheme } from "@/theme/useTheme";
import type { ChoixTheme } from "@/theme/veille";
import { Banner } from "@/ui/Banner";
import { BottomSheet } from "@/ui/BottomSheet";
import { Button } from "@/ui/Button";
import { ListGroup } from "@/ui/ListGroup";
import { ListItem } from "@/ui/ListItem";
import { RadioGroup } from "@/ui/RadioGroup";
import { Switch } from "@/ui/Switch";
import { TopBar } from "@/ui/TopBar";

// Noms des langues dans leur propre langue : ils ne se traduisent pas.
const NOMS_LANGUES: Record<Langue, string> = {
  ar: "العربية",
  wo: "Wolof",
  fr: "Français",
};
const THEMES: readonly ChoixTheme[] = ["auto", "jour", "nuit", "veille"];

export default function Reglages() {
  const { t, i18n } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const [feuilleLecture, setFeuilleLecture] = useState(false);
  const theme = useReglages((s) => s.theme);
  const translitLecture = useReglages((s) => s.translitLecture);
  const definirTranslitLecture = useReglages((s) => s.definirTranslitLecture);
  const chiffresArabes = useReglages((s) => s.chiffresArabes);
  const definirChiffresArabes = useReglages((s) => s.definirChiffresArabes);
  const veilleAuto = useReglages((s) => s.veilleAuto);
  const haptique = useReglages((s) => s.haptique);
  const methode = useReglages((s) => s.methode);
  const langueEnregistree = useReglages((s) => s.langue);
  const definirTheme = useReglages((s) => s.definirTheme);
  const definirVeilleAuto = useReglages((s) => s.definirVeilleAuto);
  const definirHaptique = useReglages((s) => s.definirHaptique);
  const definirLangue = useReglages((s) => s.definirLangue);
  const definirTraduction = useReglages((s) => s.definirTraduction);
  const verrouBudget = useReglages((s) => s.verrouBudget);
  const masquerMontants = useReglages((s) => s.masquerMontants);
  const definirVerrouBudget = useReglages((s) => s.definirVerrouBudget);
  const definirMasquerMontants = useReglages((s) => s.definirMasquerMontants);
  const [verrouImpossible, setVerrouImpossible] = useState(false);
  const traduction = useReglages((s) => s.traduction);
  const connecte = useSession((s) => s.session !== null);
  // Devise du budget, si un budget existe : « Ouguiya · MRU ».
  const [devise, setDevise] = useState<string | null>(null);
  useEffect(() => {
    let actif = true;
    depotBudget()
      .then((d) => d.carnetActif())
      .then((c) => {
        if (actif && c) setDevise(`${c.devise.nom} · ${c.devise.personnelle ? c.devise.symbole : c.devise.code}`);
      })
      .catch((e: unknown) => console.warn("Devise du budget non lue", e));
    return () => {
      actif = false;
    };
  }, []);

  // Activer le verrou demande d'abord une authentification réussie : on ne s'enferme pas dehors.
  const changerVerrou = (actif: boolean) => {
    if (!actif) {
      definirVerrouBudget(false);
      return;
    }
    (async () => {
      if (!(await verrouPossible())) {
        setVerrouImpossible(true);
        return;
      }
      setVerrouImpossible(false);
      if (await authentifier(t("budget.verrouPrompt")))
        definirVerrouBudget(true);
    })().catch((erreur: unknown) => {
      console.warn("Verrou du budget indisponible", erreur);
      setVerrouImpossible(true);
    });
  };
  const [feuilleLangue, setFeuilleLangue] = useState(false);
  const [aRedemarrer, setARedemarrer] = useState<Langue | null>(null);
  const [redemarrageManuel, setRedemarrageManuel] = useState(false);

  const langue: Langue =
    langueEnregistree ?? (estLangueProposee(i18n.language) ? i18n.language : "fr");

  const appliquerLangue = (choix: Langue) => {
    definirLangue(choix);
    // La traduction du Coran suit la langue ; en interface arabe, le français par défaut.
    definirTraduction(choix === "ar" ? "fr" : choix);
  };

  const choisirLangue = (id: string) => {
    if (!estLangueProposee(id) || id === langue) {
      setFeuilleLangue(false);
      return;
    }
    // Changement de sens de lecture : confirmation dans la même feuille.
    // Une Modal ouverte pendant la fermeture de la feuille native bloquait l'écran.
    if (demandeRedemarrage(id)) {
      setARedemarrer(id);
      return;
    }
    setFeuilleLangue(false);
    appliquerLangue(id);
  };

  const fermerFeuille = () => {
    setFeuilleLangue(false);
    setARedemarrer(null);
  };

  const redemarrer = (choix: Langue) => {
    fermerFeuille();
    appliquerLangue(choix);
    appliquerSensEtRedemarrer(choix)
      .then((ok) => {
        if (!ok) setRedemarrageManuel(true);
      })
      .catch((erreur: unknown) => {
        console.error("Changement de sens de lecture impossible", erreur);
        setRedemarrageManuel(true);
      });
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t("reglages.titre")} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace6,
        }}
      >
        {redemarrageManuel ? (
          <Banner ton="info">{t("bienvenue.redemarrerManuel")}</Banner>
        ) : null}

        <View style={{ gap: espace.espace3 }}>
          {/* Quatre cartes : chacune montre le thème qu'elle applique. */}
          <View accessibilityRole="radiogroup" accessibilityLabel={t("reglages.theme")} style={[styles.themes, { gap: espace.espace2 }]}>
            {THEMES.map((id) => {
              const on = id === theme;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => definirTheme(id)}
                  style={[
                    styles.carteTheme,
                    {
                      borderRadius: rayon.rayonCarte,
                      borderWidth: on ? 2 : 1,
                      borderColor: on ? couleurs.emeraude : couleurs.ligneForte,
                      backgroundColor: on ? couleurs.emeraudeDoux : couleurs.surface,
                      padding: espace.espace2,
                      gap: espace.espace2,
                    },
                  ]}>
                  <View style={[styles.echantillon, { borderColor: couleurs.ligneForte }]}>
                    {id === "auto" ? (
                      <>
                        <View style={{ flex: 1, backgroundColor: themes.jour.couleurs.fond }} />
                        <View style={{ flex: 1, backgroundColor: themes.nuit.couleurs.fond }} />
                      </>
                    ) : (
                      <View style={{ flex: 1, backgroundColor: themes[id].couleurs.fond, borderBottomWidth: id === "veille" ? 2 : 0, borderBottomColor: themes.veille.couleurs.or }} />
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={echelleMax.onglets}
                    style={[typographie.libelle, { color: on ? couleurs.emeraude : couleurs.encre, textAlign: "center" }]}>
                    {t(`reglages.themes.${id}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <ListGroup titre={t("reglages.apparence")} note={t("reglages.tailleNote")}>
            <ListItem
              icone="moon"
              titre={t("reglages.veilleAuto")}
              // Un thème choisi à la main l'emporte sur la Veille automatique.
              sousTitre={
                theme === "auto"
                  ? t("reglages.veilleAutoDetail")
                  : t("reglages.veilleSiAuto")
              }
              droite={
                <Switch
                  label={t("reglages.veilleAuto")}
                  active={veilleAuto}
                  disabled={theme !== "auto"}
                  onChange={definirVeilleAuto}
                />
              }
            />
            <ListItem
              icone="bolt"
              titre={t("reglages.haptique")}
              droite={
                <Switch
                  label={t("reglages.haptique")}
                  active={haptique}
                  onChange={definirHaptique}
                />
              }
            />
            <ReglageTaille />
          </ListGroup>
        </View>

        <ListGroup titre={t("reglages.lecture")}>
          <ListItem
            icone="globe"
            titre={t("reglages.langueApp")}
            valeur={NOMS_LANGUES[langue]}
            onPress={() => setFeuilleLangue(true)}
          />
          <ListItem
            icone="globe"
            titre={t("reglages.traduction")}
            valeur={NOMS_LANGUES[traduction]}
            onPress={() => setFeuilleLecture(true)}
          />
          <ListItem
            icone="type"
            titre={t("reglages.translit")}
            sousTitre={t("reglages.translitAide")}
            droite={<Switch label={t("reglages.translit")} active={translitLecture} onChange={definirTranslitLecture} />}
          />
          <ListItem
            icone="type"
            titre={t("lire.chiffresArabes")}
            sousTitre={t("lire.chiffresArabesAide")}
            droite={<Switch label={t("lire.chiffresArabes")} active={chiffresArabes} onChange={definirChiffresArabes} />}
          />
        </ListGroup>

        <ListGroup titre={t("reglages.priere")}>
          <ListItem
            titre={t("priere.methodeTitre")}
            valeur={t(`priere.methodes.${methode}`)}
            onPress={() => router.push("/priere/methode")}
          />
          <ListItem
            titre={t("priere.rappelsTitre")}
            onPress={() => router.push("/priere/rappels")}
          />
        </ListGroup>

        <ListGroup titre={t("reglages.budget")}>
          <ListItem
            icone="lock"
            titre={t("reglages.verrouBudget")}
            sousTitre={`${t("reglages.verrouBudgetDetail")}. ${t("budget.verrouCaptures")}`}
            droite={
              <Switch
                label={t("reglages.verrouBudget")}
                active={verrouBudget}
                onChange={changerVerrou}
              />
            }
          />
          <ListItem
            icone="eye-off"
            titre={t("reglages.masquerMontants")}
            droite={
              <Switch
                label={t("reglages.masquerMontants")}
                active={masquerMontants}
                onChange={definirMasquerMontants}
              />
            }
          />
          <ListItem
            icone="globe"
            titre={t("devise.titre")}
            valeur={devise ?? undefined}
            sousTitre={t("reglages.deviseDetail")}
            onPress={() => router.push("/budget/devise")}
          />
          <ListItem
            icone="download"
            titre={t("sauvegarde.titre")}
            sousTitre={t("sauvegarde.voir")}
            onPress={() => router.push("/budget/sauvegarde")}
          />
        </ListGroup>
        {verrouImpossible ? (
          <Banner ton="info">{t("budget.verrouIndisponible")}</Banner>
        ) : null}

        <ListGroup titre={t("reglages.compteOption")}>
          <ListItem
            icone="user"
            titre={t("menuPlus.compte")}
            sousTitre={t("compte.sousTitre")}
            onPress={() => router.push(connecte ? "/plus/compte" : "/plus/connexion")}
          />
          {connecte ? (
            <ListItem icone="trash" danger titre={t("compte.supprimer")} onPress={() => router.push("/plus/compte-supprimer")} />
          ) : null}
        </ListGroup>

        <EtatAutorisations />

        <ListGroup>
          <ListItem
            titre={t("reglages.aPropos")}
            onPress={() => router.push("/plus/a-propos")}
          />
        </ListGroup>
      </ScrollView>

      <ReglagesLecture ouvert={feuilleLecture} onFermer={() => setFeuilleLecture(false)} />
      <BottomSheet
        ouvert={feuilleLangue}
        titre={t("reglages.langueApp")}
        onFermer={fermerFeuille}
      >
        {aRedemarrer ? (
          <View style={{ gap: espace.espace4 }}>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.corps, { color: couleurs.encre }]}
            >
              {aRedemarrer === "ar"
                ? t("bienvenue.langueRedemarrage")
                : t("bienvenue.langueRedemarrageLtr")}
            </Text>
            <View style={{ gap: espace.espace2 }}>
              <Button
                pleineLargeur
                icone="globe"
                onPress={() => redemarrer(aRedemarrer)}
              >
                {t("bienvenue.redemarrer")}
              </Button>
              <Button
                variant="discret"
                pleineLargeur
                onPress={() => setARedemarrer(null)}
              >
                {t("commun.annuler")}
              </Button>
            </View>
          </View>
        ) : (
          <RadioGroup
            label={t("bienvenue.langueQuestion")}
            encadre={false}
            options={languesProposees.map((id) => ({ id, label: NOMS_LANGUES[id] }))}
            valeur={langue}
            onChange={choisirLangue}
          />
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  themes: { flexDirection: "row" },
  carteTheme: { flex: 1 },
  echantillon: { height: 40, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", overflow: "hidden" },
});
