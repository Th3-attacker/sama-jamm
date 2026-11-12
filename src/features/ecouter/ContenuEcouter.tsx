import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { interlignes, rayon, tailles, themes } from '@/theme/tokens.generated';
import { useTheme } from '@/theme/useTheme';
import { useReseau } from '@/hooks/useReseau';
import { Badge } from '@/ui/Badge';
import { Banner } from '@/ui/Banner';
import { Icon } from '@/ui/Icon';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { Logo } from '@/ui/Logo';

import { ecouter, useLecteur } from './lecteur';
import { recitateur } from './recitateurs';
import { listeTelechargements, useTelechargements } from './telechargements';

// Sourates proposées en tête (planche « Écouter ») : Al-Kahf, Yâ-Sîn, Al-Mulk.
const SUGGESTIONS = [18, 36, 67] as const;

/** Mode Écouter de l'onglet Lire : reprendre l'écoute en cours, récitations, écoute sans réseau, récitateurs. */
export function ContenuEcouter({ onToutVoir }: { onToutVoir: () => void }) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  const fixe = themes.jour.couleurs;
  // Pochettes : émeraude, nuit, or doux ; le nom arabe et le numéro suivent le fond.
  const pochettes = [
    { fond: couleurs.emeraudeAplat, nom: couleurs.orSurEmeraude, numero: couleurs.surEmeraude2 },
    { fond: couleurs.marqueNuit, nom: fixe.orSurEmeraude, numero: fixe.surEmeraude2 },
    { fond: couleurs.orDoux, nom: couleurs.emeraude, numero: couleurs.orTexte },
  ] as const;
  const derniere = useLecteur((s) => s.derniere);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const { enLigne } = useReseau();
  const horsLigne = enLigne === false;
  const version = useTelechargements((s) => s.version);
  // Sourates complètes sur le téléphone : écoute sans réseau.
  const disponibles = useMemo(
    () => (version >= 0 ? listeTelechargements().filter((x) => x.versets === (sourate(x.sourate)?.versets ?? -1)) : []),
    [version],
  );

  return (
    <View style={{ gap: espace.espace5 }}>
      {horsLigne ? (
        <Banner
          ton="attention"
          icone="offline"
          titre={t('etats.horsLigne')}
          action={{ label: t('etats.voirTelechargements'), onPress: () => router.push('/plus/telechargements') }}>
          {t('etats.horsLigneEcouter')}
        </Banner>
      ) : null}
      {derniere ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('ecouter.continuer')}, ${sourate(derniere.sourate)?.nom ?? ''}`}
          onPress={() => {
            ecouter(derniere);
            router.navigate('/lecteur');
          }}
          style={[styles.hero, { gap: espace.espace4, padding: espace.espace4, backgroundColor: couleurs.emeraudeAplat, borderRadius: rayon.rayonCarte + espace.espace1 }]}>
          <View style={styles.marque} pointerEvents="none">
            <Logo taille={170} variante="or" />
          </View>
          <View style={[styles.rond, { backgroundColor: couleurs.fond }]}>
            <Icon name="play" size={22} color={couleurs.emeraude} />
          </View>
          <View style={[styles.heroTextes, { gap: espace.espace1 }]}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.etiquette), { color: couleurs.orSurEmeraude }]}>
              {t('ecouter.continuer')}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre3, { color: couleurs.surEmeraude }]}>
              {sourate(derniere.sourate)?.nom ?? ''}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.detail), { color: couleurs.surEmeraude2 }]}>
              {`${t('ecouter.versetSur', { n: derniere.verset, total: sourate(derniere.sourate)?.versets ?? 0 })} · ${recitateur(idRecitateur)?.nom ?? ''}`}
            </Text>
          </View>
        </Pressable>
      ) : null}
      <View style={{ gap: espace.espace3 }}>
        <View style={styles.titreLigne}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre3, { color: couleurs.encre }]}>
            {t('ecouter.recitationsCoran')}
          </Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onToutVoir}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.emeraude }]}>
              {t('ecouter.toutVoir')}
            </Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espace.espace3 }}>
          {SUGGESTIONS.map((n, i) => {
            const meta = sourate(n);
            const p = pochettes[i];
            if (!meta || !p) return null;
            return (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={`${meta.nom}, ${t('ecouter.ecouterVerset')}`}
                onPress={() => {
                  ecouter({ sourate: n, verset: 1 });
                  router.navigate('/lecteur');
                }}
                style={[styles.tuile, { gap: espace.espace2 }]}>
                <View style={[styles.pochette, { backgroundColor: p.fond, borderRadius: rayon.rayonCarte, gap: espace.espace1 }]}>
                  <Text accessibilityLanguage="ar" style={[typographie.arabe, ligne(styles.nomArabe), { color: p.nom }]}>
                    {meta.arabe}
                  </Text>
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: p.numero }]}>
                    {n}
                  </Text>
                </View>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
                  {meta.nom}
                </Text>
                <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                  {recitateur(idRecitateur)?.nom ?? ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {disponibles.length > 0 ? (
        <ListGroup titre={t('ecouter.sansConnexion')}>
          {disponibles.slice(0, 5).map((x) => (
            <ListItem
              key={`${x.recitateur}:${x.sourate}`}
              numero={x.sourate}
              prefixe={t('lire.sourate')}
              titre={sourate(x.sourate)?.nom ?? String(x.sourate)}
              sousTitre={recitateur(x.recitateur)?.nom}
              droite={<Badge ton="emeraude" icone="check">{t('ecouter.badgeHorsLigne')}</Badge>}
              onPress={() => {
                ecouter({ sourate: x.sourate, verset: 1 }, x.recitateur);
                router.navigate('/lecteur');
              }}
            />
          ))}
        </ListGroup>
      ) : null}
      {horsLigne ? (
        <ListGroup titre={t('ecouter.demandentReseau')}>
          {SUGGESTIONS.filter((n) => !disponibles.some((x) => x.sourate === n)).map((n) => (
            <ListItem
              key={n}
              numero={n}
              prefixe={t('lire.sourate')}
              titre={sourate(n)?.nom ?? String(n)}
              sousTitre={recitateur(idRecitateur)?.nom}
              droite={<Badge ton="neutre">{t('ecouter.badgeReseau')}</Badge>}
            />
          ))}
        </ListGroup>
      ) : null}
      <ListGroup>
        <ListItem
          icone="download"
          titre={t('telechargements.titre')}
          sousTitre={t('telechargements.sousTitre')}
          onPress={() => router.push('/plus/telechargements')}
        />
      </ListGroup>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
        {t('ecouter.reseau')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  marque: { position: 'absolute', right: -40, top: -30, opacity: 0.35 },
  rond: { width: 52, height: 52, borderRadius: rayon.rayonPastille, alignItems: 'center', justifyContent: 'center' },
  heroTextes: { flex: 1, minWidth: 0 },
  etiquette: { fontSize: tailles.t12, lineHeight: interlignes.l16, letterSpacing: 0.72, textTransform: 'uppercase' },
  detail: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  titreLigne: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  tuile: { width: 124 },
  pochette: { height: 148, alignItems: 'center', justifyContent: 'center' },
  nomArabe: { fontSize: tailles.t28, lineHeight: interlignes.l56 },
  ligne: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderBottomWidth: 1 },
  titreLigneTexte: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
});
