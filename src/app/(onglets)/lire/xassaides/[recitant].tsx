import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ecouterXassaide, useLecteur } from '@/features/ecouter/lecteur';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';
import { useTelechargements, WifiRequis } from '@/features/ecouter/telechargements';
import { normaliserLatin } from '@/features/recherche/normaliser';
import { sourceXassaides } from '@/features/xassaides/catalogue';
import {
  clePiste,
  pisteTelechargee,
  telechargerPiste,
  useTelechargementsXassaides,
} from '@/features/xassaides/telechargements';
import { useParametre } from '@/hooks/useParametre';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { IconButton } from '@/ui/IconButton';
import { ListItem } from '@/ui/ListItem';
import { SearchField } from '@/ui/SearchField';
import { TopBar } from '@/ui/TopBar';

const enMo = (octets: number) => `${(octets / 1_000_000).toFixed(1).replace('.', ',')} Mo`;

/** Les audios d'une source de xassaïdes : toucher une piste lance son écoute, les suivantes s'enchaînent. */
export default function EcranSourceXassaides() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, cible, typographie } = useTheme();
  const marge = useMargeBasse();
  const s = sourceXassaides(useParametre('recitant'));
  const [echec, setEchec] = useState(false);
  const [wifiRequis, setWifiRequis] = useState(false);
  const [recherche, setRecherche] = useState('');
  const enCours = useTelechargementsXassaides((x) => x.enCours);
  const version = useTelechargements((x) => x.version);
  const enEcoute = useLecteur((x) => (x.piste && x.piste.source === s?.id ? x.piste.id : null));
  const liste = useMemo(() => {
    const q = normaliserLatin(recherche.trim());
    if (!s) return [];
    return q ? s.pistes.filter((p) => normaliserLatin(p.titre).includes(q)) : s.pistes;
  }, [recherche, s]);
  const premiere = s?.pistes[0];

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour />
      {echec || wifiRequis ? (
        <View style={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace3 }}>
          <Banner ton="attention">{wifiRequis ? t('telechargements.wifiRequis') : t('xassaides.echec')}</Banner>
        </View>
      ) : null}
      {s ? (
        <FlatList
          data={liste}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: espace.espace4, paddingBottom: espace.espace4 }}>
              <View>
                <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, { color: couleurs.emeraude }]}>
                  {s.nom}
                </Text>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
                  {`${t(`xassaides.genres.${s.genre}`)} · ${t('xassaides.audios', { count: s.pistes.length })}`}
                </Text>
              </View>
              {premiere ? (
                <Button
                  icone="play"
                  pleineLargeur
                  onPress={() => {
                    ecouterXassaide(s.id, premiere.id);
                    router.navigate('/lecteur');
                  }}>
                  {t('commun.ecouter')}
                </Button>
              ) : null}
              <SearchField
                label={t('xassaides.chercher')}
                placeholder={t('xassaides.chercher')}
                valeur={recherche}
                onChange={setRecherche}
              />
            </View>
          }
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 + marge }}
          initialNumToRender={12}
          extraData={[enCours, version, enEcoute]}
          renderItem={({ item, index }) => {
            const reception = enCours[clePiste(s.id, item.id)] === true;
            const telechargee = !reception && pisteTelechargee(s.id, item.id);
            const dernier = index === liste.length - 1;
            return (
              // Une seule carte : chaque ligne a son filet du haut, la dernière ferme la carte.
              <View
                style={[
                  styles.rang,
                  { backgroundColor: couleurs.surface, borderColor: couleurs.ligne },
                  index === 0 ? { borderTopLeftRadius: rayon.rayonCarte, borderTopRightRadius: rayon.rayonCarte } : null,
                  dernier ? { borderBottomLeftRadius: rayon.rayonCarte, borderBottomRightRadius: rayon.rayonCarte, borderBottomWidth: 1 } : null,
                ]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.titre}, ${t('commun.ecouter')}`}
                  android_ripple={{ color: couleurs.emeraudeDoux }}
                  onPress={() => {
                    ecouterXassaide(s.id, item.id);
                    router.navigate('/lecteur');
                  }}>
                  <ListItem
                    icone={enEcoute === item.id ? 'play' : 'headphones'}
                    titre={item.titre}
                    sousTitre={`${enMo(item.octets)}${telechargee ? ` · ${t('ecouter.horsLigne')}` : ''}`}
                    droite={
                      reception ? (
                        <View style={[styles.attente, { width: cible.cibleIos, height: cible.cibleIos }]}>
                          <ActivityIndicator accessibilityLabel={t('telechargements.enCours')} color={couleurs.emeraude} />
                        </View>
                      ) : (
                        <IconButton
                          icone={telechargee ? 'check' : 'download'}
                          couleur={telechargee ? couleurs.emeraude : undefined}
                          label={
                            telechargee
                              ? t('telechargements.disponible')
                              : t('xassaides.telecharger', { titre: item.titre, taille: enMo(item.octets) })
                          }
                          onPress={() => {
                            if (telechargee) return;
                            setEchec(false);
                            setWifiRequis(false);
                            telechargerPiste(s.id, item.id).catch((erreur: unknown) => {
                              console.warn('Téléchargement interrompu', erreur);
                              if (erreur instanceof WifiRequis) setWifiRequis(true);
                              else setEchec(true);
                            });
                          }}
                        />
                      )
                    }
                  />
                </Pressable>
              </View>
            );
          }}
        />
      ) : (
        <View style={{ padding: espace.espace5 }}>
          <Banner ton="erreur">{t('xassaides.sourceInconnue')}</Banner>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  rang: { borderLeftWidth: 1, borderRightWidth: 1, borderTopWidth: 1, overflow: 'hidden' },
  attente: { alignItems: 'center', justifyContent: 'center' },
});
