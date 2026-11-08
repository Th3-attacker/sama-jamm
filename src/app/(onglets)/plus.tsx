import { router, useScrollToTop, type Href } from 'expo-router';
import { ComponentRef, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/compte/compte';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';
import type { IconName } from '@/ui/types';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';
import { SondeBarre } from '@/features/ecouter/SondeBarre';

type Tuile = { id: string; icone: IconName; href: Href; titre: string; sous: string };

const TUILES = [
  { id: 'khatm', titre: 'menuPlus.khatm', sous: 'menuPlus.tuiles.khatm', icone: 'users', href: '/plus/khatms' },
  { id: 'dhikr', titre: 'menuPlus.dhikr', sous: 'menuPlus.tuiles.dhikr', icone: 'target', href: '/priere/dhikr' },
  { id: 'qibla', titre: 'menuPlus.qibla', sous: 'menuPlus.tuiles.qibla', icone: 'compass', href: '/priere/qibla' },
  { id: 'xassaides', titre: 'menuPlus.xassaides', sous: 'menuPlus.tuiles.xassaides', icone: 'book', href: { pathname: '/lire', params: { rubrique: 'xassaides' } } },
  { id: 'invocations', titre: 'menuPlus.invocations', sous: 'menuPlus.tuiles.invocations', icone: 'moon', href: { pathname: '/lire', params: { rubrique: 'invocations' } } },
  { id: 'zakat', titre: 'menuPlus.zakat', sous: 'menuPlus.tuiles.zakat', icone: 'balance', href: '/budget/zakat' },
] as const satisfies readonly Tuile[];

/** Onglet Plus : six raccourcis, puis Favoris, Téléchargements, Compte, Réglages, Soutenir et À propos. */
export default function Plus() {
  const defilement = useRef<ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(defilement);
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const marge = useMargeBasse();
  const connecte = useSession((s) => s.session !== null);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        grand
        titre={t('onglets.plus')}
        sousTitre={t('menuPlus.sousTitre')}
        actions={[{ icone: 'search', label: t('menuPlus.rechercher'), onPress: () => router.push('/plus/recherche') }]}
      />
      <ScrollView
        ref={defilement}
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 + marge, gap: espace.espace5 }}>
        <View style={[styles.grille, { gap: espace.espace3 }]}>
          {TUILES.map((tuile) => (
            <Pressable
              key={tuile.id}
              accessibilityRole="button"
              accessibilityLabel={`${t(tuile.titre)}, ${t(tuile.sous)}`}
              onPress={() => router.push(tuile.href)}
              style={({ pressed }) => [
                styles.tuile,
                {
                  gap: espace.espace1,
                  padding: espace.espace4,
                  borderRadius: rayon.rayonCarte,
                  backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.surface,
                  borderColor: couleurs.ligne,
                },
              ]}>
              <View style={[styles.pastille, { backgroundColor: couleurs.emeraudeDoux, marginBottom: espace.espace2 }]}>
                <Icon name={tuile.icone} size={18} color={couleurs.surEmeraudeDoux} />
              </View>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
                {t(tuile.titre)}
              </Text>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
                {t(tuile.sous)}
              </Text>
            </Pressable>
          ))}
        </View>
        <ListGroup>
          <ListItem icone="bookmark" titre={t('menuPlus.favoris')} onPress={() => router.push('/plus/favoris')} />
          <ListItem
            icone="download"
            titre={t('menuPlus.telechargements')}
            onPress={() => router.push('/plus/telechargements')}
          />
          <ListItem
            icone="user"
            titre={t('menuPlus.compte')}
            onPress={() => router.push(connecte ? '/plus/compte' : '/plus/connexion')}
          />
          <ListItem icone="settings" titre={t('menuPlus.reglages')} onPress={() => router.push('/plus/reglages')} />
          {/* Les dons par wallet ne figurent pas dans la version iOS (règles de l'App Store). */}
          {Platform.OS === 'ios' ? null : (
            <ListItem icone="heart" titre={t('menuPlus.soutenir')} onPress={() => router.push('/plus/soutenir')} />
          )}
          <ListItem icone="info" titre={t('menuPlus.aPropos')} onPress={() => router.push('/plus/a-propos')} />
        </ListGroup>
      </ScrollView>
      <SondeBarre />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  grille: { flexDirection: 'row', flexWrap: 'wrap' },
  tuile: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, minHeight: 108 },
  pastille: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
