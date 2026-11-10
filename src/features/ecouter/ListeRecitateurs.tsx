import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

import { useLecteur } from './lecteur';
import { RECITATEURS } from './recitateurs';

/** Liste des récitateurs : ouvre la récitation de chacun. Partagée par Écouter et la bibliothèque Lire. */
export function ListeRecitateurs() {
  const { t } = useTranslation();
  const idRecitateur = useLecteur((s) => s.recitateur);
  return (
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
  );
}
