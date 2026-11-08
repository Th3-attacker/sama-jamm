import { usePathname, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomStack } from '@/features/ecouter/placeMiniLecteur';
import { useLecteur } from '@/features/ecouter/lecteur';
import { miseEnPage } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { IconButton } from './IconButton';
import { montrerCasque } from './casqueBarreHaut';
import type { IconName } from './types';

export type TopBarAction = { icone: IconName; label: string; onPress?: () => void; actif?: boolean };

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
}: TopBarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { couleurs, espace, typographie, latin } = useTheme();
  const chemin = usePathname();
  const enEcoute = useLecteur((s) => s.position !== null);
  const { miniRange } = useBottomStack();
  const casque = montrerCasque({ enEcoute, miniRange, chemin });
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
              style={[typographie.titre3, { color: couleurs.encre }]}>
              {titre}
            </Text>
          ) : null}
          {!grand && sousTitre ? (
            <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
              {sousTitre}
            </Text>
          ) : null}
        </View>
        {actions?.map((a) => (
          <IconButton key={a.label} icone={a.icone} label={a.label} actif={a.actif} onPress={a.onPress} />
        ))}
        {casque ? (
          <IconButton icone="headphones" label={t('ecouter.ouvrirLecteur')} onPress={() => router.push('/lecteur')} />
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
});
