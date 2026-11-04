import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SaisieInvalide } from '@/features/budget/depot';
import { apercuDevise, lireTaux } from '@/features/budget/devises';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { FormulaireDevise, useLibelleDevise } from '@/features/budget/FormulaireDevise';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import type { Devise } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

type Feuille = { mode: 'ajout' } | { mode: 'taux'; cible: Devise } | null;

/** Devise du carnet : la liste, l'ajout d'une devise personnelle et le changement avec un taux de conversion. */
export default function EcranDevise() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const libelle = useLibelleDevise();
  const etat = useBudget((depot) => depot.devises());
  const [feuille, setFeuille] = useState<Feuille>(null);
  const [saisieTaux, setSaisieTaux] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret') {
    return <EcranBudgetIncomplet titre={t('devise.titre')} etat={etat} />;
  }

  const { carnet, depot, donnees: devises } = etat;
  const actuelle = carnet.devise;
  const taux = lireTaux(saisieTaux);

  const ouvrirTaux = (cible: Devise) => {
    setSaisieTaux('');
    setEchec(false);
    setFeuille({ mode: 'taux', cible });
  };

  const changer = async () => {
    if (feuille?.mode !== 'taux' || !taux || envoi) return;
    setEnvoi(true);
    setEchec(false);
    try {
      await depot.changerDevise(carnet, feuille.cible.code, saisieTaux);
      setFeuille(null);
      budgetModifie();
      afficher({ texte: t('devise.changee', { devise: libelle(feuille.cible).nom }), icone: 'check' });
    } catch (erreur: unknown) {
      if (!(erreur instanceof SaisieInvalide)) console.error('Devise non changée', erreur);
      setEchec(true);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('devise.titre')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {t('devise.intro')}
        </Text>
        <ListGroup>
          {devises.map((d) => (
            <ListItem
              key={d.code}
              titre={libelle(d).nom}
              sousTitre={libelle(d).detail}
              valeur={apercuDevise(d)}
              fin={d.code === actuelle.code ? 'coche' : undefined}
              onPress={d.code === actuelle.code ? undefined : () => ouvrirTaux(d)}
            />
          ))}
        </ListGroup>
        <Button
          variant="secondaire"
          icone="plus"
          pleineLargeur
          onPress={() => {
            setEchec(false);
            setFeuille({ mode: 'ajout' });
          }}>
          {t('devise.ajouter')}
        </Button>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
          {t('devise.note')}
        </Text>
      </ScrollView>

      <BottomSheet
        ouvert={feuille !== null}
        titre={feuille?.mode === 'taux' ? t('devise.changerTitre') : t('devise.ajouter')}
        onFermer={() => setFeuille(null)}>
        {feuille?.mode === 'ajout' ? (
          <FormulaireDevise
            onAjoutee={(d) => {
              budgetModifie();
              ouvrirTaux(d);
            }}
          />
        ) : null}
        {feuille?.mode === 'taux' ? (
          <>
            <TextField
              label={t('devise.taux', { de: actuelle.symbole, vers: feuille.cible.symbole })}
              valeur={saisieTaux}
              onChange={setSaisieTaux}
              clavier="decimal-pad"
              suffixe={feuille.cible.symbole}
              erreur={saisieTaux.trim() !== '' && !taux ? t('devise.tauxInvalide') : undefined}
            />
            <Banner ton="info">{t('devise.conversionNote')}</Banner>
            {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
            <Button pleineLargeur disabled={!taux || envoi} onPress={changer}>
              {t('devise.changer')}
            </Button>
          </>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
