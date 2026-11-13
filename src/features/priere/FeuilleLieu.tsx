// Changer de lieu depuis l'écran Prière : « Utiliser ma position » (demande l'autorisation du téléphone si besoin),
// ou une ville de la liste. La position ne quitte jamais le téléphone.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { obtenirPosition } from '@/features/bienvenue/autorisations';
import { useReglages } from '@/stores/reglages';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

import { ChoixVille } from './ChoixVille';

/** Ligne « Utiliser ma position » : lit la position, l'enregistre comme lieu, puis appelle `onFait`. */
export function UtiliserMaPosition({ onFait }: { onFait: () => void }) {
  const { t } = useTranslation();
  const definirLieu = useReglages((s) => s.definirLieu);
  const [enCours, setEnCours] = useState(false);
  const [echec, setEchec] = useState(false);

  const utiliser = async () => {
    if (enCours) return;
    setEnCours(true);
    setEchec(false);
    try {
      const resultat = await obtenirPosition();
      if (resultat.ok) {
        definirLieu({ type: 'position', latitude: resultat.latitude, longitude: resultat.longitude });
        onFait();
      } else {
        setEchec(true);
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      {echec ? <Banner ton="erreur">{t('priere.positionRefuseeTexte')}</Banner> : null}
      <ListGroup>
        <ListItem
          icone="pin"
          titre={t('priere.utiliserPosition')}
          sousTitre={t('priere.utiliserPositionAide')}
          onPress={() => void utiliser()}
        />
      </ListGroup>
    </>
  );
}

/** Feuille « Lieu » de l'écran Prière : ma position, puis les villes. */
export function FeuilleLieu({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const { t } = useTranslation();
  const definirLieu = useReglages((s) => s.definirLieu);
  return (
    <BottomSheet ouvert={ouvert} titre={t('priere.lieuTitre')} onFermer={onFermer}>
      <UtiliserMaPosition onFait={onFermer} />
      <ChoixVille
        onChoisir={(v) => {
          definirLieu({ type: 'ville', id: v.id, nom: v.nom, latitude: v.lat, longitude: v.lon });
          onFermer();
        }}
      />
    </BottomSheet>
  );
}
