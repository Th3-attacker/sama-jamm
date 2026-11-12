import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

import { useLecteur } from './lecteur';
import { RECITATEURS } from './recitateurs';

/**
 * Récitateurs (planche « Récitateur ») : « Votre voix » (celle qui est choisie), puis « Autres voix ».
 * Ouvre la récitation de chacun. Partagée par Écouter et la bibliothèque Lire.
 */
export function ListeRecitateurs() {
  const { t } = useTranslation();
  const idRecitateur = useLecteur((s) => s.recitateur);
  const ouvrir = (id: string) => router.push({ pathname: '/lire/ecouter/[recitateur]', params: { recitateur: id } });
  const choisi = RECITATEURS.find((r) => r.id === idRecitateur) ?? RECITATEURS[0];
  const autres = RECITATEURS.filter((r) => r.id !== choisi?.id);
  return (
    <>
      {choisi ? (
        <ListGroup titre={t('ecouter.votreVoix')}>
          <ListItem
            icone="headphones"
            titre={choisi.nom}
            sousTitre={t('ecouter.styleRecitateur')}
            fin="coche"
            onPress={() => ouvrir(choisi.id)}
          />
        </ListGroup>
      ) : null}
      {autres.length > 0 ? (
        <ListGroup titre={t('ecouter.autresVoix')}>
          {autres.map((r) => (
            <ListItem
              key={r.id}
              icone="headphones"
              titre={r.nom}
              sousTitre={t('ecouter.murattal')}
              fin="chevron"
              onPress={() => ouvrir(r.id)}
            />
          ))}
        </ListGroup>
      ) : null}
    </>
  );
}
