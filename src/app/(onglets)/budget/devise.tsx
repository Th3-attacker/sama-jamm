import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { Dialog } from '@/ui/Dialog';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { EnteteRetour } from '@/ui/EnteteRetour';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

import { interlignes, rayon, tailles } from '@/theme/tokens.generated';
type Feuille = { mode: 'ajout' } | { mode: 'taux'; cible: Devise } | null;

/** Devise du carnet : la liste, l'ajout d'une devise personnelle et le changement avec un taux de conversion. */
export default function EcranDevise() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const marge = useMargeBasse();
  const { afficher } = useToast();
  const libelle = useLibelleDevise();
  const etat = useBudget((depot) => depot.devises());
  const [feuille, setFeuille] = useState<Feuille>(null);
  const [saisieTaux, setSaisieTaux] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);
  const [confirmerNouveau, setConfirmerNouveau] = useState(false);

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

  const ouvrirNouveau = async () => {
    if (feuille?.mode !== 'taux' || envoi) return;
    const cible = feuille.cible;
    setEnvoi(true);
    setEchec(false);
    try {
      await depot.ouvrirNouveauCarnet(carnet, cible.code);
      setConfirmerNouveau(false);
      setFeuille(null);
      budgetModifie();
      afficher({ texte: t('devise.nouveauFait', { devise: libelle(cible).nom }), icone: 'check' });
    } catch (erreur: unknown) {
      if (!(erreur instanceof SaisieInvalide)) console.error('Nouveau carnet non ouvert', erreur);
      setConfirmerNouveau(false);
      setEchec(true);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8 + marge,
          gap: espace.espace3,
        }}>
        <EnteteRetour titre={t('devise.titre')} />
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {t('devise.intro')}
        </Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('devise.titre')} style={{ gap: espace.espace2 }}>
          {devises.map((d) => {
            const choisie = d.code === actuelle.code;
            return (
              <Pressable
                key={d.code}
                accessibilityRole="radio"
                accessibilityState={{ checked: choisie }}
                onPress={choisie ? undefined : () => ouvrirTaux(d)}
                android_ripple={{ color: couleurs.emeraudeDoux }}
                style={[
                  styles.carte,
                  {
                    gap: espace.espace3,
                    paddingVertical: espace.espace3,
                    paddingHorizontal: espace.espace4,
                    borderRadius: rayon.rayonCarte,
                    backgroundColor: choisie ? couleurs.emeraudeDoux : couleurs.surface,
                    borderColor: choisie ? couleurs.emeraude : couleurs.ligne,
                    borderWidth: choisie ? 2 : 1,
                  },
                ]}>
                <View
                  style={[
                    styles.rond,
                    choisie
                      ? { borderWidth: 6, borderColor: couleurs.emeraude, backgroundColor: couleurs.surface }
                      : { borderWidth: 2, borderColor: couleurs.ligneForte },
                  ]}
                />
                <View style={styles.textes}>
                  <Text
                    maxFontSizeMultiplier={echelleMax.courant}
                    style={[typographie.corps, styles.gras, { color: couleurs.encre }]}>
                    {libelle(d).nom}
                  </Text>
                  <Text
                    maxFontSizeMultiplier={echelleMax.courant}
                    style={[typographie.corps, styles.detail, { color: couleurs.encre3 }]}>
                    {libelle(d).detail}
                  </Text>
                </View>
                <Text
                  maxFontSizeMultiplier={echelleMax.courant}
                  style={[typographie.corps, styles.gras, { color: couleurs.emeraude, fontVariant: ['tabular-nums'] }]}>
                  {apercuDevise(d)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setEchec(false);
            setFeuille({ mode: 'ajout' });
          }}
          android_ripple={{ color: couleurs.emeraudeDoux }}
          style={[styles.ajout, { borderRadius: rayon.rayonCarte, borderColor: couleurs.ligneForte }]}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.gras, { color: couleurs.emeraude }]}>
            {`+ ${t('devise.ajouterMa')}`}
          </Text>
        </Pressable>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.detail, { color: couleurs.encre2 }]}>
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
            <Button variant="secondaire" pleineLargeur disabled={envoi} onPress={() => setConfirmerNouveau(true)}>
              {t('devise.nouveauCarnet')}
            </Button>
          </>
        ) : null}
      </BottomSheet>
      <Dialog
        ouvert={confirmerNouveau && feuille?.mode === 'taux'}
        titre={t('devise.nouveauTitre')}
        confirmer={t('devise.nouveauConfirmer')}
        annuler={t('commun.annuler')}
        onConfirmer={ouvrirNouveau}
        onAnnuler={() => setConfirmerNouveau(false)}>
        {feuille?.mode === 'taux' ? t('devise.nouveauTexte', { devise: libelle(feuille.cible).nom }) : ''}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  carte: { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
  ajout: { height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  rond: { width: 20, height: 20, borderRadius: rayon.rayonPastille },
  textes: { flex: 1 },
  gras: { fontFamily: 'SourceSans3_600SemiBold' },
  detail: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
