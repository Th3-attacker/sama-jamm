import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { cleJour, formatJourCle } from '@/lib/dates';
import type { Devise } from '@/lib/montant';
import { ListItem } from '@/ui/ListItem';

import type { Dette } from './depot';
import { etatEcheance } from './dettes';
import { useFormatMontant } from './verrou';

/** Une dette dans une liste : la personne, où en est l'échéance (ou le statut), et ce qui reste. */
export function LigneDette({ dette: d, devise }: { dette: Dette; devise: Devise }) {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const f = (m: number) => formatMontant(m, devise);
  const date = (j: string) => formatJourCle(j, i18n.language);

  let sousTitre: string;
  let valeur: string;
  if (d.statut !== 'ouverte') {
    sousTitre = d.statut === 'soldee' ? t('dettes.statutSoldee') : t('dettes.statutAnnulee');
    valeur = f(d.montantInitial);
  } else {
    const e = etatEcheance(d.echeance, cleJour(new Date()));
    const origine =
      d.sens === 'prete' ? t('dettes.preteLe', { date: date(d.date) }) : t('dettes.emprunteLe', { date: date(d.date) });
    if (e.type === 'passee') sousTitre = t('dettes.echeancePassee', { count: e.jours });
    else if (e.type === 'aujourdhui') sousTitre = t('dettes.echeanceAujourdhui');
    else if (d.echeance) sousTitre = `${origine} · ${t('dettes.echeanceLe', { date: date(d.echeance) })}`;
    else sousTitre = `${origine} · ${t('dettes.sansEcheance')}`;
    valeur = t('dettes.resteListe', { montant: f(d.reste) });
  }

  return (
    <ListItem
      icone={d.sens === 'prete' ? 'arrow-up' : 'arrow-down'}
      titre={d.personne}
      sousTitre={sousTitre}
      valeur={valeur}
      onPress={() => router.push({ pathname: '/budget/dettes/[id]', params: { id: d.id } })}
    />
  );
}
