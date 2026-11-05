import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { ecouter } from '@/features/ecouter/lecteur';
import { recitateur } from '@/features/ecouter/recitateurs';
import {
  listeTelechargements,
  sourateTelechargee,
  telechargerSourate,
  useTelechargements,
} from '@/features/ecouter/telechargements';
import { normaliserLatin } from '@/features/recherche/normaliser';
import { CarteSourate } from '@/features/lire/CarteSourate';
import { sourates } from '@/features/lire/coran';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { IconButton } from '@/ui/IconButton';
import { SearchField } from '@/ui/SearchField';
import { TopBar } from '@/ui/TopBar';

/** Les 114 sourates d'un récitateur : toucher une sourate lance son écoute depuis le premier verset. */
export default function EcranRecitateur() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const [echec, setEchec] = useState(false);
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
                setEchec(true);
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
      <TopBar retour titre={r?.nom ?? t('ecouter.recitateur')} />
      {echec ? (
        <View style={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace3 }}>
          <Banner ton="attention">{t('telechargements.echec')}</Banner>
        </View>
      ) : null}
      {r ? (
        <FlatList
          data={liste}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: espace.espace3, paddingBottom: espace.espace2 }}>
              <Text style={[typographie.legende, { color: couleurs.encre2 }]}>
                {t('ecouter.resumeRecitateur', { count: telechargees })}
              </Text>
              <SearchField
                label={t('ecouter.chercherSourate')}
                placeholder={t('ecouter.chercherSourate')}
                valeur={recherche}
                onChange={setRecherche}
              />
              <Button variant="secondaire" icone="download" pleineLargeur onPress={toutTelecharger}>
                {t('telechargements.toutTelecharger')}
              </Button>
            </View>
          }
          keyExtractor={(s) => String(s.n)}
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace3,
          }}
          initialNumToRender={12}
          extraData={[enCours, version]}
          renderItem={({ item }) => {
            const part = enCours[`${r.id}:${item.n}`];
            const telechargee = part === undefined && sourateTelechargee(r.id, item.n);
            return (
              <View style={[styles.ligne, { gap: espace.espace2 }]}>
                <View style={styles.carte}>
                  <CarteSourate
                    sourate={item}
                    onPress={() => {
                      ecouter({ sourate: item.n, verset: 1 }, r.id);
                      router.push('/ecouter/lecteur');
                    }}
                  />
                </View>
                {part !== undefined ? (
                  <Text style={[typographie.legende, { color: couleurs.encre2 }]}>{`${Math.round(part * 100)} %`}</Text>
                ) : (
                  <IconButton
                    icone={telechargee ? 'check' : 'download'}
                    actif={telechargee}
                    disabled={telechargee}
                    label={
                      telechargee
                        ? t('telechargements.disponible')
                        : t('telechargements.telecharger', { sourate: item.nom })
                    }
                    onPress={() => {
                      telechargerSourate(r.id, item.n).catch((erreur: unknown) => {
                        console.warn('Téléchargement interrompu', erreur);
                        setEchec(true);
                      });
                    }}
                  />
                )}
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

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  ligne: { flexDirection: 'row', alignItems: 'center' },
  carte: { flex: 1 },
});
