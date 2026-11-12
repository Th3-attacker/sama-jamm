import { usePathname, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomStack } from '@/features/ecouter/placeMiniLecteur';
import { enEcoute as ecouteEnCours, useLecteur } from '@/features/ecouter/lecteur';
import { interlignes, miseEnPage, tailles } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { IconButton } from './IconButton';
import { montrerCasque } from './casqueBarreHaut';
import type { IconName } from './types';

export type TopBarAction = {
  icone: IconName;
  label: string;
  onPress?: () => void;
  actif?: boolean;
  /** Couleur de l'icône au repos (liste en émeraude du lecteur en mode page). */
  couleur?: string;
  /** Glyphe en texte (« Aa ») à la place de l'icône : réglages de lecture. */
  texte?: string;
  /** Le texte est un libellé (« Remettre à zéro ») : 16 gras émeraude, largeur automatique. */
  libelle?: boolean;
  desactive?: boolean;
};

export type TopBarProps = {
  /** true ou un libellé (« Retour aux horaires ») : affiche la flèche « ← ». */
  retour?: boolean | string;
  /** Par défaut : retour à l'écran précédent. */
  onRetour?: () => void;
  titre?: string;
  sousTitre?: string;
  /** Deux actions au plus, la dernière est souvent le menu Plus. */
  actions?: [TopBarAction] | [TopBarAction, TopBarAction];
  /** Grand titre Cormorant sous la barre : écrans racines des onglets. */
  grand?: boolean;
  /** Langue du grand titre (« wo » pour un titre wolof). */
  lang?: string;
  /** Sans fond, au-dessus d'une image ou du lecteur plein écran. */
  transparent?: boolean;
  /** Élément à gauche à la place du titre (logo de l'Accueil). */
  gauche?: ReactNode;
  /** Titre centré (lecteur de sourate). */
  centre?: boolean;
};

export function TopBar({
  retour,
  onRetour,
  titre,
  sousTitre,
  actions,
  grand = false,
  lang,
  transparent = false,
  gauche,
  centre = false,
}: TopBarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { couleurs, espace, typographie, latin, cible, ligne } = useTheme();
  const chemin = usePathname();
  const enEcoute = useLecteur(ecouteEnCours);
  const { miniRange } = useBottomStack();
  const casque = montrerCasque({ enEcoute, miniRange, chemin, casqueDejaPresent: actions?.some((a) => a.icone === 'headphones') ?? false });
  const avecRetour = retour !== undefined && retour !== false;

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: espace.espace2,
        backgroundColor: transparent ? 'transparent' : couleurs.fond,
      }}>
      <View style={[styles.rangee, { gap: espace.espace1 }]}>
        {avecRetour ? (
          <IconButton
            icone="arrow-left"
            taille={22}
            couleur={couleurs.encre}
            label={typeof retour === 'string' ? retour : t('commun.retour')}
            onPress={onRetour ?? (() => router.back())}
          />
        ) : null}
        <View style={[styles.titres, { paddingHorizontal: avecRetour ? 0 : espace.espace3 }]}>
          {gauche}
          {!grand && titre ? (
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.titre3, centre ? styles.centre : null, { color: couleurs.encre }]}>
              {titre}
            </Text>
          ) : null}
          {!grand && sousTitre ? (
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.legende, centre ? styles.centre : null, { color: couleurs.encre3 }]}>
              {sousTitre}
            </Text>
          ) : null}
        </View>
        {actions?.map((a) =>
          a.texte ? (
            <Pressable
              key={a.label}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              hitSlop={4}
              disabled={a.desactive}
              accessibilityState={{ disabled: a.desactive }}
              onPress={a.onPress}
              style={({ pressed }) => [
                styles.texte,
                a.libelle ? { minWidth: cible.cibleIos, paddingHorizontal: espace.espace2 } : { width: cible.cibleIos },
                { height: cible.cibleIos, opacity: a.desactive ? 0.4 : pressed ? 0.7 : 1 },
              ]}>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={a.libelle ? [typographie.corps, styles.libelle, { color: couleurs.emeraude }] : [typographie.lecture, ligne(styles.glyphe), { color: couleurs.encre2 }]}>
                {a.texte}
              </Text>
            </Pressable>
          ) : (
            <IconButton key={a.label} icone={a.icone} label={a.label} actif={a.actif} couleur={a.couleur} onPress={a.onPress} />
          ),
        )}
        {casque ? (
          <IconButton icone="headphones" label={t('ecouter.ouvrirLecteur')} onPress={() => router.navigate('/lecteur')} />
        ) : null}
      </View>
      {grand && titre ? (
        <View style={{ paddingHorizontal: espace.espace3, paddingBottom: espace.espace3 }}>
          <Text
            accessibilityRole="header"
            accessibilityLanguage={lang}
            maxFontSizeMultiplier={echelleMax.courant}
            style={[lang === 'wo' ? latin.titre1 : typographie.titre1, { color: couleurs.emeraude }]}>
            {titre}
          </Text>
          {sousTitre ? (
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, { color: couleurs.encre2 }]}>
              {sousTitre}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rangee: { flexDirection: 'row', alignItems: 'center', minHeight: miseEnPage.barreHaut },
  titres: { flex: 1, justifyContent: 'center' },
  centre: { textAlign: 'center' },
  texte: { alignItems: 'center', justifyContent: 'center' },
  // Planche : « Aa » en Source Serif 18.
  glyphe: { fontSize: tailles.t18, lineHeight: interlignes.l24 },
  // Planche « Dhikr » : « Remettre à zéro » en 16/24 gras.
  libelle: { fontFamily: 'SourceSans3_600SemiBold' },
});
