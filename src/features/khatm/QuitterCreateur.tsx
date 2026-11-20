import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { DepartCreateur } from '@/features/khatm/depot';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { RadioGroup, type RadioOption } from '@/ui/RadioGroup';

export type QuitterCreateurProps = {
  ouvert: boolean;
  /** Les autres membres du khatm, avec ce qu'ils ont pris (« Juz 4, 17 »). Vide : le créateur est seul. */
  autres: RadioOption[];
  onFermer: () => void;
  /** Seul : appelé sans choix, le serveur ferme et supprime. Avec d'autres membres : un nouveau créateur ou `fermer`. */
  onConfirmer: (depart: DepartCreateur) => void;
};

/** Feuille « Avant de quitter » d'un créateur (planches « Khatm · quitter en tant que créateur »). */
export function QuitterCreateur({ ouvert, autres, onFermer, onConfirmer }: QuitterCreateurProps) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const [choisi, setChoisi] = useState<string | null>(null);
  const seul = autres.length === 0;

  return (
    <BottomSheet ouvert={ouvert} titre={seul ? t('khatm.quitterSeulTitre') : t('khatm.quitterCreateurTitre')} onFermer={onFermer}>
      <View style={{ gap: espace.espace4 }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {seul ? t('khatm.quitterSeulTexte') : t('khatm.quitterCreateurTexte')}
        </Text>
        {seul ? (
          <Button variant="danger" grand pleineLargeur onPress={() => onConfirmer({})}>
            {t('khatm.fermerEtSupprimer')}
          </Button>
        ) : (
          <>
            <RadioGroup
              label={t('khatm.nouveauCreateur')}
              options={autres}
              valeur={choisi}
              onChange={setChoisi}
              encadre={false}
            />
            <Button
              grand
              pleineLargeur
              disabled={choisi === null}
              onPress={() => choisi !== null && onConfirmer({ nouveauCreateur: choisi })}>
              {t('khatm.transmettreEtQuitter')}
            </Button>
            <View style={{ gap: espace.espace2 }}>
              <Button variant="secondaire" pleineLargeur onPress={() => onConfirmer({ fermer: true })}>
                {t('khatm.fermerKhatm')}
              </Button>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.legende, { color: couleurs.encre2, textAlign: 'center' }]}>
                {t('khatm.fermerKhatmAide')}
              </Text>
            </View>
          </>
        )}
        <Button variant="discret" pleineLargeur onPress={onFermer}>
          {t('commun.annuler')}
        </Button>
      </View>
    </BottomSheet>
  );
}
