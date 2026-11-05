import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { recitateur } from '@/features/ecouter/recitateurs';
import { listeTelechargements, supprimerSourate, useTelechargements } from '@/features/ecouter/telechargements';
import { sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

const enMo = (octets: number) => `${(octets / 1_000_000).toFixed(1).replace('.', ',')} Mo`;

/** Récitations sur le téléphone : place utilisée, sourates téléchargées, suppression. */
export default function Telechargements() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const version = useTelechargements((s) => s.version);
  // Relu après chaque téléchargement ou suppression (`version` change alors).
  const liste = useMemo(() => (version >= 0 ? listeTelechargements() : []), [version]);
  const total = liste.reduce((n, x) => n + x.octets, 0);

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
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        {liste.length === 0 ? (
          <EmptyState
            icone="download"
            lang="fr"
            titre={t('telechargements.vide')}
            texte={t('telechargements.videTexte')}
          />
        ) : (
          <>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
              {`${t('telechargements.place')} : ${enMo(total)}`}
            </Text>
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
