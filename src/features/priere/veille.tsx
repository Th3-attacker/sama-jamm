// Veille automatique : thème atténué d'Isha à Fajr, et son bandeau une fois par nuit.
import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatHeure } from '@/lib/dates';
import { useReglages } from '@/stores/reglages';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';

import { nuitDePriere } from './horaires';
import { useOptionsCalcul } from './useOptionsCalcul';
import { fuseauDuLieu } from './villes';

/** Plus long délai d'attente d'une bascule : au-delà, on recalcule quand même (horloge changée, veille prolongée). */
const ATTENTE_MAX_MS = 60 * 60 * 1000;

/**
 * Nuit de prière en cours, ou null sans lieu enregistré.
 * Recalculée à la prochaine bascule (Isha ou Fajr), au retour au premier plan et quand le lieu ou la méthode
 * changent : la racine de l'app ne se redessine plus chaque minute.
 */
export function useNuitDePriere() {
  const lieu = useReglages((s) => s.lieu);
  const options = useOptionsCalcul();
  const [instant, setInstant] = useState(() => new Date());
  const nuit = useMemo(() => (lieu ? nuitDePriere(lieu, instant, options) : null), [lieu, instant, options]);

  useEffect(() => {
    if (!nuit) return;
    const attente = Math.min(Math.max(nuit.fin.getTime() - Date.now(), 0) + 1000, ATTENTE_MAX_MS);
    const minuterie = setTimeout(() => setInstant(new Date()), attente);
    return () => clearTimeout(minuterie);
  }, [nuit]);

  useEffect(() => {
    const abonnement = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') setInstant(new Date());
    });
    return () => abonnement.remove();
  }, []);

  return nuit;
}

export function BandeauVeille() {
  const { t } = useTranslation();
  const { nom } = useTheme();
  const nuit = useNuitDePriere();
  const fuseau = fuseauDuLieu(useReglages((s) => s.lieu));
  const veilleVue = useReglages((s) => s.veilleVue);
  const marquerVeilleVue = useReglages((s) => s.marquerVeilleVue);

  if (nom !== 'veille' || !nuit?.active || veilleVue === nuit.cle) return null;

  return (
    <Banner
      ton="veille"
      titre={t('formules.repos')}
      langueTitre="wo"
      onFermer={() => marquerVeilleVue(nuit.cle)}>
      {t('reglages.veilleJusqua', { heure: formatHeure(nuit.fin, fuseau) })}
    </Banner>
  );
}
