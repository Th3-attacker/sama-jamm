import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/features/compte/compte';
import { BottomSheet } from '@/ui/BottomSheet';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import type { TopBarAction } from '@/ui/TopBar';

/** Laisse la feuille native finir de se fermer avant de changer d'écran. */
const DELAI_FERMETURE_MS = 250;

/**
 * Menu Plus des écrans racines : une action « … » pour la `TopBar` et la feuille à afficher dans l'écran.
 * Seuls les écrans qui existent sont listés ; Soutenir s'ajoutera avec le sien.
 */
export function useMenuPlus(): { action: TopBarAction; feuille: ReactElement } {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const connecte = useSession((s) => s.session !== null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Écran quitté avant la fin du délai : pas de navigation tardive.
  useEffect(() => () => clearTimeout(minuteur.current), []);

  const aller = (href: Href) => {
    setOuvert(false);
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => router.push(href), DELAI_FERMETURE_MS);
  };

  return {
    action: { icone: 'reglages', label: t('menuPlus.titre'), onPress: () => setOuvert(true) },
    feuille: (
      <BottomSheet ouvert={ouvert} titre={t('menuPlus.titre')} onFermer={() => setOuvert(false)}>
        <ListGroup>
          <ListItem icone="search" titre={t('menuPlus.rechercher')} onPress={() => aller('/plus/recherche')} />
          <ListItem icone="bookmark" titre={t('menuPlus.favoris')} onPress={() => aller('/plus/favoris')} />
          <ListItem
            icone="download"
            titre={t('menuPlus.telechargements')}
            onPress={() => aller('/ecouter/telechargements')}
          />
        </ListGroup>
        <ListGroup>
          <ListItem icone="users" titre={t('menuPlus.khatm')} onPress={() => aller('/plus/khatms')} />
          <ListItem
            icone="user"
            titre={t('menuPlus.compte')}
            onPress={() => aller(connecte ? '/plus/compte' : '/plus/connexion')}
          />
          <ListItem icone="settings" titre={t('menuPlus.reglages')} onPress={() => aller('/plus/reglages')} />
        </ListGroup>
      </BottomSheet>
    ),
  };
}
