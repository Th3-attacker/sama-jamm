import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ecouter } from '@/features/ecouter/lecteur';
import { recitateur } from '@/features/ecouter/recitateurs';
import {
  listeTelechargements,
  sourateTelechargee,
  telechargerSourate,
  WifiRequis,
  useTelechargements,
} from '@/features/ecouter/telechargements';
import { normaliserLatin } from '@/features/recherche/normaliser';
import { sourates } from '@/features/lire/coran';
import { useParametre } from '@/hooks/useParametre';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { IconButton } from '@/ui/IconButton';
import { ListItem } from '@/ui/ListItem';
import { SearchField } from '@/ui/SearchField';
import { TopBar } from '@/ui/TopBar';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

import { interlignes, tailles } from '@/theme/tokens.generated';
/** Les 114 sourates d'un récitateur : toucher une sourate lance son écoute depuis le premier verset. */
export default function EcranRecitateur() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const marge = useMargeBasse();
  const [echec, setEchec] = useState(false);
  const [wifiRequis, setWifiRequis] = useState(false);
  const r = recitateur(useParametre('recitateur'));
  const enCours = useTelechargements((s) => s.enCours);
  const version = useTelechargements((s) => s.version);
  const [recherche, setRecherche] = useState('');
  // Sourates complètes sur le téléphone pour ce récitateur (lecture du dossier, relue après chaque changement).
  const telechargees = useMemo(
    () =>
      version >= 0 && r
        ? listeTelechargements().filter(
            (x) => x.recitateur === r.id && x.versets === (sourates[x.sourate - 1]?.versets ?? -1),
          ).length
        : 0,
    [version, r],
  );
  const liste = useMemo(() => {
    const q = normaliserLatin(recherche.trim());
    if (!q) return sourates;
    return sourates.filter((s) => String(s.n) === q || normaliserLatin(s.nom).includes(q));
  }, [recherche]);

  const toutTelecharger = () => {
    if (!r) return;
    Alert.alert(t('telechargements.toutTitre'), t('telechargements.toutTexte'), [
      { text: t('commun.annuler'), style: 'cancel' },
      {
        text: t('telechargements.toutConfirmer'),
        onPress: () => {
          void (async () => {
            for (const s of sourates) {
              try {
                await telechargerSourate(r.id, s.n);
              } catch (e: unknown) {
                console.warn('Téléchargement interrompu', e);
                if (e instanceof WifiRequis) setWifiRequis(true);
                else setEchec(true);
                return;
              }
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour />
      {echec || wifiRequis ? (
        <View style={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace3 }}>
          <Banner ton="attention">{wifiRequis ? t('telechargements.wifiRequis') : t('telechargements.echec')}</Banner>
        </View>
      ) : null}
      {r ? (
        <FlatList
          data={liste}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: espace.espace4, paddingBottom: espace.espace4 }}>
              {/* Planche : pastille d'initiales, nom en 30/36, résumé en 14/20. */}
              <View style={[styles.identite, { gap: espace.espace4 }]}>
                <View style={[styles.pastille, { backgroundColor: couleurs.emeraudeDoux, borderRadius: rayon.rayonCarte + espace.espace1 }]}>
                  <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre3, styles.initiales, { color: couleurs.surEmeraudeDoux }]}>
                    {initiales(r.nom)}
                  </Text>
                </View>
                <View style={styles.textes}>
                  <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, { color: couleurs.emeraude }]}>
                    {r.nom}
                  </Text>
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.resume, { color: couleurs.encre2 }]}>
                    {t('ecouter.resumeRecitateur', { count: telechargees })}
                  </Text>
                </View>
              </View>
              <View style={[styles.boutons, { gap: espace.espace2 }]}>
                <View style={styles.bouton}>
                  <Button
                    icone="play"
                    pleineLargeur
                    onPress={() => {
                      ecouter({ sourate: 1, verset: 1 }, r.id);
                      router.navigate('/lecteur');
                    }}>
                    {t('commun.ecouter')}
                  </Button>
                </View>
                <View style={styles.bouton}>
                  <Button variant="secondaire" icone="download" pleineLargeur onPress={toutTelecharger}>
                    {t('telechargements.toutTelecharger')}
                  </Button>
                </View>
              </View>
              <SearchField
                label={t('ecouter.chercherSourate')}
                placeholder={t('ecouter.chercherSourate')}
                valeur={recherche}
                onChange={setRecherche}
              />
            </View>
          }
          keyExtractor={(s) => String(s.n)}
          contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 + marge }}
          initialNumToRender={12}
          extraData={[enCours, version]}
          renderItem={({ item, index }) => {
            const part = enCours[`${r.id}:${item.n}`];
            const telechargee = part === undefined && sourateTelechargee(r.id, item.n);
            const dernier = index === liste.length - 1;
            return (
              // Planche : une seule carte ; chaque ligne a son filet du haut, la dernière ferme la carte.
              <View
                style={[
                  styles.rang,
                  { backgroundColor: couleurs.surface, borderColor: couleurs.ligne },
                  index === 0 ? { borderTopLeftRadius: rayon.rayonCarte, borderTopRightRadius: rayon.rayonCarte } : null,
                  dernier ? { borderBottomLeftRadius: rayon.rayonCarte, borderBottomRightRadius: rayon.rayonCarte, borderBottomWidth: 1 } : null,
                ]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('lire.sourate')} ${item.n}, ${item.nom}`}
                  android_ripple={{ color: couleurs.emeraudeDoux }}
                  onPress={() => {
                    ecouter({ sourate: item.n, verset: 1 }, r.id);
                    router.navigate('/lecteur');
                  }}>
                  <ListItem
                    numero={item.n}
                    prefixe={t('lire.sourate')}
                    titre={item.nom}
                    sousTitre={`${t('lire.versets', { count: item.versets })}${telechargee ? ` · ${t('ecouter.horsLigne')}` : ''}`}
                    arabe={item.arabe}
                    droite={
                      part !== undefined ? (
                        <Text style={[typographie.legende, { color: couleurs.encre2 }]}>{`${Math.round(part * 100)} %`}</Text>
                      ) : (
                        <IconButton
                          icone={telechargee ? 'check' : 'download'}
                          // Déjà téléchargée : coche aux couleurs du thème, sans l'estomper.
                          couleur={telechargee ? couleurs.emeraude : undefined}
                          label={
                            telechargee
                              ? t('telechargements.disponible')
                              : t('telechargements.telecharger', { sourate: item.nom })
                          }
                          onPress={() => {
                            if (telechargee) return;
                            telechargerSourate(r.id, item.n).catch((erreur: unknown) => {
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
          <Banner ton="erreur">{t('ecouter.recitateurInconnu')}</Banner>
        </View>
      )}
    </View>
  );
}

/** Initiales d'un nom : première lettre du premier et du dernier mot (« Mishary Rashid Alafasy » donne « MA »). */
function initiales(nom: string): string {
  const mots = nom.split(' ').filter(Boolean);
  const premier = mots[0]?.[0] ?? '';
  const dernier = mots.length > 1 ? (mots[mots.length - 1]?.[0] ?? '') : '';
  return `${premier}${dernier}`.toUpperCase();
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  identite: { flexDirection: 'row', alignItems: 'center' },
  pastille: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  initiales: { fontSize: tailles.t24, lineHeight: 32 },
  textes: { flex: 1, minWidth: 0 },
  resume: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  boutons: { flexDirection: 'row' },
  bouton: { flex: 1 },
  rang: { borderLeftWidth: 1, borderRightWidth: 1, borderTopWidth: 1, overflow: 'hidden' },
});
