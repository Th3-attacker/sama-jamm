import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

import { ecouter, useLecteur } from './lecteur';
import { RECITATEURS, recitateur } from './recitateurs';
import { listeTelechargements, useTelechargements } from './telechargements';

/** Mode Écouter de l'onglet Lire : reprendre l'écoute en cours, choisir un récitateur, écouter sans réseau. */
export function ContenuEcouter() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const derniere = useLecteur((s) => s.derniere);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const version = useTelechargements((s) => s.version);
  // Sourates complètes sur le téléphone : écoute sans réseau.
  const disponibles = useMemo(
    () => (version >= 0 ? listeTelechargements().filter((x) => x.versets === (sourate(x.sourate)?.versets ?? -1)) : []),
    [version],
  );

  return (
    <View style={{ gap: espace.espace5 }}>
      {derniere ? (
        <ListGroup titre={t('ecouter.reprendre')}>
          <ListItem
            icone="play"
            titre={`${sourate(derniere.sourate)?.nom ?? ''} · ${t('ecouter.versetN', { n: derniere.verset })}`}
            sousTitre={recitateur(idRecitateur)?.nom}
            onPress={() => {
              ecouter(derniere);
              router.push('/lecteur');
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
            onPress={() => router.push({ pathname: '/lire/ecouter/[recitateur]', params: { recitateur: r.id } })}
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
                router.push('/lecteur');
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
          onPress={() => router.push('/plus/telechargements')}
        />
      </ListGroup>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
        {t('ecouter.reseau')}
      </Text>
    </View>
  );
}
