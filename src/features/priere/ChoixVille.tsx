import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SearchField } from '@/ui/SearchField';

import { chercherVilles, type Ville } from './villes';

function coordonnees(v: Ville): string {
  const lat = `${Math.abs(v.lat).toFixed(2)}° ${v.lat >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(v.lon).toFixed(2)}° ${v.lon >= 0 ? 'E' : 'O'}`;
  return `${v.paysNom} · ${lat}, ${lon}`;
}

type Props = { onChoisir: (ville: Ville) => void };

// Recherche et liste des villes embarquées : bienvenue et position refusée (EtatPosition).
export function ChoixVille({ onChoisir }: Props) {
  const { t, i18n } = useTranslation();
  const [recherche, setRecherche] = useState('');
  const resultats = chercherVilles(recherche);

  return (
    <>
      <SearchField label={t('priere.chercherVille')} placeholder={t('priere.chercherVille')} valeur={recherche} onChange={setRecherche} />
      <ListGroup>
        {resultats.map((v) => (
          <ListItem
            key={v.id}
            icone="pin"
            titre={i18n.language === 'ar' ? v.nomAr : v.nom}
            sousTitre={coordonnees(v)}
            onPress={() => onChoisir(v)}
          />
        ))}
      </ListGroup>
    </>
  );
}
