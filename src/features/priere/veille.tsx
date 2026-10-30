// Veille automatique : thème atténué d'Isha à Fajr, et son bandeau une fois par nuit.
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMaintenant } from '@/hooks/useMaintenant';
import { formatHeure } from '@/lib/dates';
import { useReglages } from '@/stores/reglages';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';

import { nuitDePriere, useOptionsCalcul } from './horaires';

/** Nuit de prière en cours, ou null sans lieu enregistré. */
export function useNuitDePriere() {
  const maintenant = useMaintenant();
  const lieu = useReglages((s) => s.lieu);
  const options = useOptionsCalcul();
  return useMemo(() => (lieu ? nuitDePriere(lieu, maintenant, options) : null), [lieu, maintenant, options]);
}

export function BandeauVeille() {
  const { t } = useTranslation();
  const { nom } = useTheme();
  const nuit = useNuitDePriere();
  const veilleVue = useReglages((s) => s.veilleVue);
  const marquerVeilleVue = useReglages((s) => s.marquerVeilleVue);

  if (nom !== 'veille' || !nuit?.active || veilleVue === nuit.cle) return null;

  return (
    <Banner ton="veille" titre={`${t('reglages.veilleActive')} · ${t('formules.repos')}`} onFermer={() => marquerVeilleVue(nuit.cle)}>
      {t('reglages.veilleActiveTexte', { heure: formatHeure(nuit.fin) })}
    </Banner>
  );
}
