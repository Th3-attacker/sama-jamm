import { router, useScrollToTop, type Href } from 'expo-router';
import { ComponentRef, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/compte/compte';
import { listeTelechargements, useTelechargements } from '@/features/ecouter/telechargements';
import { useKhatmsEnCours } from '@/features/khatm/enCours';
import { LigneHub } from '@/features/plus/LigneHub';
import { useFavoris } from '@/stores/favoris';
import { echelleMax } from '@/theme/typographie';
import { useLayout } from '@/theme/useLayout';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';
import { TopBar } from '@/ui/TopBar';
import type { IconName } from '@/ui/types';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';
import { SondeBarre } from '@/features/ecouter/SondeBarre';

import { espace, interlignes, rayon, tailles } from '@/theme/tokens.generated';
const enMo = (octets: number) => `${(octets / 1_000_000).toFixed(1).replace('.', ',')} Mo`;

type Tuile = { id: string; icone: IconName; href: Href; titre: string; sous: string };

const TUILES = [
  { id: 'khatm', titre: 'menuPlus.khatm', sous: 'menuPlus.tuiles.khatm', icone: 'users', href: '/plus/khatms' },
  { id: 'dhikr', titre: 'menuPlus.dhikr', sous: 'menuPlus.tuiles.dhikr', icone: 'target', href: '/priere/dhikr' },
  { id: 'qibla', titre: 'menuPlus.qibla', sous: 'menuPlus.tuiles.qibla', icone: 'compass', href: '/priere/qibla' },
  { id: 'invocations', titre: 'menuPlus.invocations', sous: 'menuPlus.tuiles.invocations', icone: 'moon', href: { pathname: '/lire', params: { rubrique: 'invocations' } } },
  { id: 'zakat', titre: 'menuPlus.zakat', sous: 'menuPlus.tuiles.zakat', icone: 'balance', href: '/budget/zakat' },
] as const satisfies readonly Tuile[];

/** Onglet Plus : cinq raccourcis, puis Favoris, Téléchargements, Compte, Réglages et À propos. */
export default function Plus() {
  const defilement = useRef<ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(defilement);
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const marge = useMargeBasse();
  const { styleColonne: colonne } = useLayout();
  const connecte = useSession((s) => s.session !== null);
  const enCours = useKhatmsEnCours();
  const nbFavoris = useFavoris((s) => s.versets.length);
  // Relue après chaque téléchargement ou suppression (`version` change alors).
  const version = useTelechargements((s) => s.version);
  const octets = useMemo(
    () => (version >= 0 ? listeTelechargements().reduce((n, x) => n + x.octets, 0) : 0),
    [version],
  );

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      {/* Planche : « Plus » en 40/44 et sous-titre à gauche, loupe à droite. */}
      <TopBar
        gauche={
          <View>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.grand}
              style={[typographie.display, { color: couleurs.emeraude }]}>
              {t('onglets.plus')}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, styles.sousTitre, { color: couleurs.encre2 }]}>
              {t('menuPlus.sousTitre')}
            </Text>
          </View>
        }
        actions={[{ icone: 'search', label: t('menuPlus.rechercher'), onPress: () => router.push('/plus/recherche') }]}
      />
      <ScrollView
        ref={defilement}
        contentContainerStyle={{ ...colonne, paddingBottom: espace.espace8 + marge, gap: espace.espace4 }}>
        <View style={[styles.grille, { gap: espace.espace3 }]}>
          {TUILES.map((tuile) => {
            const khatm = tuile.id === 'khatm';
            const badge = khatm && enCours !== null && enCours > 0 ? t('menuPlus.enCours', { count: enCours }) : null;
            return (
              <Pressable
                key={tuile.id}
                accessibilityRole="button"
                accessibilityLabel={`${t(tuile.titre)}, ${t(tuile.sous)}${badge ? `, ${badge}` : ''}`}
                onPress={() => router.push(tuile.href)}
                style={({ pressed }) => [
                  styles.tuile,
                  {
                    gap: espace.espace1,
                    padding: espace.espace4,
                    backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.surface,
                    borderColor: couleurs.ligne,
                  },
                ]}>
                <View style={[styles.pastille, { backgroundColor: khatm ? couleurs.orDoux : couleurs.emeraudeDoux, marginBottom: espace.espace2 }]}>
                  <Icon name={tuile.icone} size={22} color={khatm ? couleurs.orTexte : couleurs.surEmeraudeDoux} />
                </View>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.titre, { color: couleurs.encre }]}>
                  {t(tuile.titre)}
                </Text>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.sous, { color: couleurs.encre2 }]}>
                  {t(tuile.sous)}
                </Text>
                {badge ? (
                  <View style={[styles.badge, { backgroundColor: couleurs.orDoux }]}>
                    <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.badgeTexte, { color: couleurs.orTexte }]}>
                      {badge}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.carte, { backgroundColor: couleurs.surface, borderColor: couleurs.ligne }]}>
          <LigneHub icone="bookmark" premiere titre={t('menuPlus.favoris')} valeur={nbFavoris > 0 ? String(nbFavoris) : undefined} onPress={() => router.push('/plus/favoris')} />
          <LigneHub
            icone="download"
            titre={t('menuPlus.telechargements')}
            valeur={octets > 0 ? enMo(octets) : undefined}
            onPress={() => router.push('/plus/telechargements')}
          />
          <LigneHub
            icone="user"
            titre={t('menuPlus.compte')}
            onPress={() => router.push(connecte ? '/plus/compte' : '/plus/connexion')}
          />
          <LigneHub icone="settings" titre={t('menuPlus.reglages')} onPress={() => router.push('/plus/reglages')} />
          <LigneHub icone="info" titre={t('menuPlus.aPropos')} onPress={() => router.push('/plus/a-propos')} />
        </View>
      </ScrollView>
      <SondeBarre />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  // Planche : sous-titre en italique 16/24.
  sousTitre: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  grille: { flexDirection: 'row', flexWrap: 'wrap' },
  // Planche : rayon 16, hauteur minimale 108, pastille 40 de rayon 14, titre 16/24, sous-titre 14/20.
  tuile: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: 16, minHeight: 108 },
  pastille: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titre: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  sous: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  badge: { position: 'absolute', top: 12, end: 12, paddingHorizontal: espace.espace2, paddingVertical: espace.espace1, borderRadius: rayon.rayonPuce },
  badgeTexte: { fontSize: tailles.t12, lineHeight: interlignes.l16 },
  carte: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
});
