import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { NOM_ENVELOPPE_MAX, TYPES_COMPTE, type TypeCompte } from '@/features/budget/depot';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { formatMontant, versMinimes } from '@/lib/montant';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';
import type { IconName } from '@/ui/types';

const ICONES: Record<TypeCompte, IconName> = { especes: 'wallet', mobile: 'bolt', banque: 'lock' };

/** Où se trouve l'argent du foyer : chaque compte avec son solde, et le total. */
export default function Comptes() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const { afficher } = useToast();
  const etat = useBudget((depot, carnet) => depot.comptesAvecSolde(carnet));
  const [feuille, setFeuille] = useState(false);
  const [nom, setNom] = useState('');
  const [type, setType] = useState<TypeCompte>('mobile');
  const [solde, setSolde] = useState('');
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret') {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('budget.comptes')} />
        <EtatsBudget etat={etat} />
      </View>
    );
  }

  const { carnet, depot, donnees: comptes } = etat;
  const devise = carnet.devise;
  const total = comptes.reduce((somme, c) => somme + c.solde, 0);
  const nomPropre = nom.trim();
  const nomValide = nomPropre.length >= 1 && nomPropre.length <= NOM_ENVELOPPE_MAX;
  const soldeMinimes = solde.trim() === '' ? 0 : versMinimes(solde, devise);

  const ajouter = async () => {
    if (!nomValide || soldeMinimes === null) return;
    setEchec(false);
    try {
      await depot.ajouterCompte(carnet, { nom: nomPropre, type, soldeInitial: soldeMinimes });
      setFeuille(false);
      budgetModifie();
      afficher({ texte: t('budget.compteAjoute'), icone: 'check' });
    } catch (erreur: unknown) {
      console.error('Compte non ajouté', erreur);
      setEchec(true);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('budget.comptes')} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <AmountDisplay montant={total} devise={devise} libelle={t('budget.totalComptes')} />
        <ListGroup>
          {comptes.map((c) => (
            <ListItem
              key={c.id}
              icone={ICONES[c.type]}
              titre={c.nom}
              sousTitre={t(`budget.comptesTypes.${c.type}`)}
              valeur={formatMontant(c.solde, devise)}
            />
          ))}
        </ListGroup>
        <Button
          variant="secondaire"
          icone="plus"
          pleineLargeur
          onPress={() => {
            setNom('');
            setType('mobile');
            setSolde('');
            setEchec(false);
            setFeuille(true);
          }}>
          {t('budget.nouveauCompte')}
        </Button>
      </ScrollView>

      <BottomSheet ouvert={feuille} titre={t('budget.nouveauCompte')} onFermer={() => setFeuille(false)}>
        <TextField
          label={t('budget.nomCompte')}
          valeur={nom}
          onChange={setNom}
          maxLength={NOM_ENVELOPPE_MAX}
          placeholder="Wave"
          erreur={nom !== '' && !nomValide ? t('budget.nomInvalide') : undefined}
        />
        <SegmentedControl
          label={t('budget.typeCompte')}
          options={TYPES_COMPTE.map((id) => ({ id, label: t(`budget.comptesTypes.${id}`) }))}
          valeur={type}
          onChange={(id) => {
            const choix = TYPES_COMPTE.find((x) => x === id);
            if (choix) setType(choix);
          }}
        />
        <TextField
          label={t('budget.soldeDepart')}
          valeur={solde}
          onChange={setSolde}
          clavier={devise.decimales > 0 ? 'decimal-pad' : 'number-pad'}
          suffixe={devise.symbole}
          placeholder="0"
          erreur={soldeMinimes === null ? t('budget.montantInvalide') : undefined}
        />
        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
        <Button pleineLargeur disabled={!nomValide || soldeMinimes === null} onPress={ajouter}>
          {t('commun.enregistrer')}
        </Button>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
