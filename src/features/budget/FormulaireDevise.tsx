import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { Devise } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TextField } from '@/ui/TextField';

import { apercuDevise, NOM_DEVISE_MAX, SYMBOLE_DEVISE_MAX } from './devises';
import { depotBudget } from './useBudget';

const DECIMALES = [0, 1, 2] as const;

/** Nom et détail d'une devise : traduits pour les devises intégrées, tels que saisis pour les personnelles. */
export function useLibelleDevise(): (d: Devise) => { nom: string; detail: string } {
  const { t } = useTranslation();
  return (d) => {
    if (d.code === 'XOF') return { nom: t('devise.xof'), detail: t('devise.xofDetail') };
    if (d.code === 'MRU') return { nom: t('devise.mru'), detail: t('devise.mruDetail') };
    return { nom: d.nom, detail: d.personnelle ? t('devise.personnelle') : d.code };
  };
}

/** Ajout d'une devise personnelle : nom, symbole, position, décimales et aperçu. Rend la devise enregistrée. */
export function FormulaireDevise({ onAjoutee }: { onAjoutee: (devise: Devise) => void }) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const [nom, setNom] = useState('');
  const [symbole, setSymbole] = useState('');
  const [position, setPosition] = useState<Devise['position']>('apres');
  const [decimales, setDecimales] = useState<Devise['decimales']>(0);
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  const nomValide = nom.trim().length >= 1;
  const symboleValide = symbole.trim().length >= 1;
  const apercu = apercuDevise({
    symbole: symbole.trim() || '?',
    position,
    decimales,
    sousUnites: 10 ** decimales,
  });

  const ajouter = async () => {
    if (!nomValide || !symboleValide || envoi) return;
    setEnvoi(true);
    setEchec(false);
    try {
      const depot = await depotBudget();
      onAjoutee(await depot.ajouterDevise({ nom, symbole, position, decimales }));
    } catch (erreur: unknown) {
      console.error('Devise non ajoutée', erreur);
      setEchec(true);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <View style={{ gap: espace.espace4 }}>
      <TextField
        label={t('devise.nom')}
        valeur={nom}
        onChange={setNom}
        maxLength={NOM_DEVISE_MAX}
        placeholder="Dirham"
      />
      <TextField
        label={t('devise.symbole')}
        valeur={symbole}
        onChange={setSymbole}
        maxLength={SYMBOLE_DEVISE_MAX}
        placeholder="DH"
        erreur={symbole !== '' && !symboleValide ? t('devise.symboleErreur') : undefined}
      />
      <SegmentedControl
        label={t('devise.position')}
        options={[
          { id: 'avant', label: t('devise.avant') },
          { id: 'apres', label: t('devise.apres') },
        ]}
        valeur={position}
        onChange={(id) => setPosition(id === 'avant' ? 'avant' : 'apres')}
      />
      <SegmentedControl
        label={t('devise.decimales')}
        options={DECIMALES.map((n) => ({ id: String(n), label: String(n) }))}
        valeur={String(decimales)}
        onChange={(id) => {
          const choix = DECIMALES.find((n) => String(n) === id);
          if (choix !== undefined) setDecimales(choix);
        }}
      />
      <View accessible style={{ gap: espace.espace1 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
          {t('devise.apercu')}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre3, { color: couleurs.encre }]}>
          {apercu}
        </Text>
      </View>
      {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
      <Button pleineLargeur disabled={!nomValide || !symboleValide || envoi} onPress={ajouter}>
        {t('devise.ajouterUtiliser')}
      </Button>
    </View>
  );
}
