import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMenuPlus } from '@/features/plus/MenuPlus';
import { ecouter, useLecteur } from '@/features/ecouter/lecteur';
import { RECITATEURS, recitateur } from '@/features/ecouter/recitateurs';
import { listeTelechargements, useTelechargements } from '@/features/ecouter/telechargements';
import { sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

/** Onglet Écouter : reprendre l'écoute en cours, puis choisir un récitateur. */
export default function Ecouter() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const menu = useMenuPlus();
  const derniere = useLecteur((s) => s.derniere);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const version = useTelechargements((s) => s.version);
  // Sourates complètes sur le téléphone : écoute sans réseau.
  const disponibles = useMemo(
    () => (version >= 0 ? listeTelechargements().filter((x) => x.versets === (sourate(x.sourate)?.versets ?? -1)) : []),
    [version],
  );

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        retour
        // Onglet de départ : sans écran précédent, la flèche ramène à l'Accueil.
        onRetour={() => (router.canGoBack() ? router.back() : router.replace('/accueil'))}
        titre={t('ecouter.titre')}
        actions={[menu.action]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        {derniere ? (
          <ListGroup titre={t('ecouter.reprendre')}>
            <ListItem
              icone="play"
              titre={`${sourate(derniere.sourate)?.nom ?? ''} · ${t('ecouter.versetN', { n: derniere.verset })}`}
              sousTitre={recitateur(idRecitateur)?.nom}
              onPress={() => {
                ecouter(derniere);
                router.push('/ecouter/lecteur');
              }}
            />
          </ListGroup>
        ) : null}
        <ListGroup titre={t('ecouter.recitateurs')}>
          {RECITATEURS.map((r) => (
            <ListItem
              key={r.id}
              icone="headphones"
              titre={r.nom}
              sousTitre={t('ecouter.murattal')}
              fin={r.id === idRecitateur ? 'coche' : 'chevron'}
              onPress={() => router.push({ pathname: '/ecouter/[recitateur]', params: { recitateur: r.id } })}
            />
          ))}
        </ListGroup>
        {disponibles.length > 0 ? (
          <ListGroup titre={t('ecouter.telecharges')}>
            {disponibles.slice(0, 5).map((x) => (
              <ListItem
                key={`${x.recitateur}:${x.sourate}`}
                icone="play"
                titre={sourate(x.sourate)?.nom ?? String(x.sourate)}
                sousTitre={recitateur(x.recitateur)?.nom}
                onPress={() => {
                  ecouter({ sourate: x.sourate, verset: 1 }, x.recitateur);
                  router.push('/ecouter/lecteur');
                }}
              />
            ))}
          </ListGroup>
        ) : null}
        <ListGroup>
          <ListItem
            icone="download"
            titre={t('telechargements.titre')}
            sousTitre={t('telechargements.sousTitre')}
            onPress={() => router.push('/ecouter/telechargements')}
          />
        </ListGroup>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
          {t('ecouter.reseau')}
        </Text>
      </ScrollView>
      {menu.feuille}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
