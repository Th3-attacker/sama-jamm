import { Paths } from 'expo-file-system';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { recitateur } from '@/features/ecouter/recitateurs';
import { listeTelechargements, supprimerSourate, useTelechargements } from '@/features/ecouter/telechargements';
import { sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useReglages } from '@/stores/reglages';
import { useTheme } from '@/theme/useTheme';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { AnneauProgression } from '@/ui/AnneauProgression';
import { pourcentage } from '@/ui/anneau';
import { ProgressBar } from '@/ui/ProgressBar';
import { Switch } from '@/ui/Switch';
import { TopBar } from '@/ui/TopBar';

const enMo = (octets: number) => `${(octets / 1_000_000).toFixed(1).replace('.', ',')} Mo`;
const enGo = (octets: number) => `${(octets / 1_000_000_000).toFixed(1).replace('.', ',')} Go`;

/** Espace libre du téléphone, ou null si le système ne le donne pas. */
function espaceLibre(): number | null {
  try {
    const libre = Paths.availableDiskSpace;
    return Number.isFinite(libre) && libre > 0 ? libre : null;
  } catch {
    return null;
  }
}

/** Récitations sur le téléphone : place utilisée, sourates téléchargées, suppression. */
export default function Telechargements() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const wifiSeulement = useReglages((s) => s.wifiSeulement);
  const definirWifiSeulement = useReglages((s) => s.definirWifiSeulement);
  const version = useTelechargements((s) => s.version);
  const enCours = useTelechargements((s) => s.enCours);
  // Relu après chaque téléchargement ou suppression (`version` change alors).
  const liste = useMemo(() => (version >= 0 ? listeTelechargements() : []), [version]);
  const total = liste.reduce((n, x) => n + x.octets, 0);
  const libre = useMemo(() => (version >= 0 ? espaceLibre() : null), [version]);

  const supprimer = (idRecitateur: string, n: number) => {
    Alert.alert(t('telechargements.supprimerTitre'), t('telechargements.supprimerNote'), [
      { text: t('commun.annuler'), style: 'cancel' },
      { text: t('commun.supprimer'), style: 'destructive', onPress: () => supprimerSourate(idRecitateur, n) },
    ]);
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('telechargements.titre')} sousTitre={t('telechargements.sousTitre')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace6,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        {Object.keys(enCours).length > 0 ? (
          <ListGroup titre={t('telechargements.enCours')}>
            {Object.entries(enCours).map(([cle, part]) => {
              const [idR, n] = cle.split(':');
              return (
                <ListItem
                  key={cle}
                  icone="download"
                  titre={sourate(Number(n))?.nom ?? String(n)}
                  sousTitre={`${recitateur(idR ?? '')?.nom ?? idR} · ${t('telechargements.reprend')}`}
                  droite={<AnneauProgression part={part} label={t('telechargements.progression', { part: pourcentage(part) })} />}
                />
              );
            })}
          </ListGroup>
        ) : null}
        {liste.length === 0 && Object.keys(enCours).length === 0 ? (
          <EmptyState
            icone="download"
            lang="fr"
            titre={t('telechargements.vide')}
            texte={t('telechargements.videTexte')}
          />
        ) : (
          <>
            <View
              style={[
                styles.carte,
                {
                  padding: espace.espace4,
                  gap: espace.espace3,
                  backgroundColor: couleurs.surface,
                  borderColor: couleurs.ligne,
                  borderRadius: rayon.rayonCarte,
                },
              ]}>
              <ProgressBar
                label={t('telechargements.place')}
                detail={
                  libre === null
                    ? enMo(total)
                    : `${enGo(total)} · ${t('telechargements.libre', { taille: enGo(libre) })}`
                }
                valeur={libre === null ? 0 : total / (total + libre)}
              />
              <View style={[styles.wifi, { paddingTop: espace.espace3, borderTopColor: couleurs.ligne, gap: espace.espace3 }]}>
                <View style={styles.wifiTexte}>
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
                    {t('telechargements.wifi')}
                  </Text>
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                    {t('telechargements.wifiDetail')}
                  </Text>
                </View>
                <Switch active={wifiSeulement} onChange={definirWifiSeulement} label={t('telechargements.wifi')} />
              </View>
            </View>
            {liste.length === 0 ? null : (
            <ListGroup titre={t('telechargements.surTelephone')}>
              {liste.map((x) => {
                const s = sourate(x.sourate);
                return (
                  <ListItem
                    key={`${x.recitateur}:${x.sourate}`}
                    icone="headphones"
                    titre={s?.nom ?? String(x.sourate)}
                    sousTitre={`${recitateur(x.recitateur)?.nom ?? x.recitateur} · ${t('telechargements.versets', {
                      n: x.versets,
                      total: s?.versets ?? x.versets,
                    })} · ${enMo(x.octets)}`}
                    droite={
                      <IconButton
                        icone="trash"
                        label={t('commun.supprimer')}
                        onPress={() => supprimer(x.recitateur, x.sourate)}
                      />
                    }
                  />
                );
              })}
            </ListGroup>
            )}
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
              {t('telechargements.supprimerNote')}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  carte: { borderWidth: 1 },
  wifi: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1 },
  wifiTexte: { flex: 1 },
});
