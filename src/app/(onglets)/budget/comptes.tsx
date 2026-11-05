import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFormatMontant } from '@/features/budget/verrou';
import { NOM_ENVELOPPE_MAX, TYPES_COMPTE, type TypeCompte } from '@/features/budget/depot';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { formatJourCle } from '@/lib/dates';
import { lireMontantFacultatif, versMinimes } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
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
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const etat = useBudget((depot, carnet) => depot.comptesAvecSolde(carnet));
  const [feuille, setFeuille] = useState(false);
  const [nom, setNom] = useState('');
  const [type, setType] = useState<TypeCompte>('mobile');
  const [solde, setSolde] = useState('');
  const [echec, setEchec] = useState(false);
  // Feuille de virement : compte de départ, compte d'arrivée, montant.
  const [virement, setVirement] = useState(false);
  const [de, setDe] = useState<string | null>(null);
  const [vers, setVers] = useState<string | null>(null);
  const [montantVirement, setMontantVirement] = useState('');

  if (etat.etat !== 'pret') {
    return <EcranBudgetIncomplet titre={t('budget.comptes')} etat={etat} />;
  }

  const { carnet, depot, donnees: comptes } = etat;
  const devise = carnet.devise;
  const total = comptes.reduce((somme, c) => somme + c.solde, 0);
  const nomPropre = nom.trim();
  const nomValide = nomPropre.length >= 1 && nomPropre.length <= NOM_ENVELOPPE_MAX;
  const soldeMinimes = lireMontantFacultatif(solde, devise);

  const deChoisi = de ?? comptes[0]?.id ?? null;
  const versChoisi = vers ?? comptes.find((c) => c.id !== deChoisi)?.id ?? null;
  const virementMinimes = versMinimes(montantVirement, devise);
  const virementValide =
    deChoisi !== null &&
    versChoisi !== null &&
    deChoisi !== versChoisi &&
    virementMinimes !== null &&
    virementMinimes > 0;

  const virer = async () => {
    if (!virementValide || !deChoisi || !versChoisi || virementMinimes === null) return;
    setEchec(false);
    try {
      await depot.virement(carnet, { de: deChoisi, vers: versChoisi, montant: virementMinimes, note: null });
      setVirement(false);
      budgetModifie();
      afficher({
        texte: t('budget.virementEnregistre', { montant: formatMontant(virementMinimes, devise) }),
        icone: 'check',
      });
    } catch (erreur: unknown) {
      console.error('Virement non enregistré', erreur);
      setEchec(true);
    }
  };

  const puces = (titre: string, choisi: string | null, choisir: (id: string) => void) => (
    <View style={{ gap: espace.espace2 }}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
        {titre}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espace.espace2 }}>
        {comptes.map((c) => (
          <Chip key={c.id} selectionne={c.id === choisi} onPress={() => choisir(c.id)}>
            {c.nom}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

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
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {t('budget.comptesIntro')}
        </Text>
        <AmountDisplay montant={total} devise={devise} libelle={t('budget.totalComptes')} />
        <ListGroup>
          {comptes.map((c) => (
            <ListItem
              key={c.id}
              icone={ICONES[c.type]}
              titre={c.nom}
              sousTitre={
                c.dernierMouvement
                  ? `${t(`budget.comptesTypes.${c.type}`)} · ${t('budget.dernierMouvement', { date: formatJourCle(c.dernierMouvement, i18n.language) })}`
                  : t(`budget.comptesTypes.${c.type}`)
              }
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
        {comptes.length > 1 ? (
          <Button
            variant="secondaire"
            icone="repeat"
            pleineLargeur
            onPress={() => {
              setDe(null);
              setVers(null);
              setMontantVirement('');
              setEchec(false);
              setVirement(true);
            }}>
            {t('budget.virement')}
          </Button>
        ) : null}
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
          {t('budget.virementNote')}
        </Text>
      </ScrollView>

      <BottomSheet ouvert={virement} titre={t('budget.virementTitre')} onFermer={() => setVirement(false)}>
        {puces(t('budget.depuis'), deChoisi, setDe)}
        {puces(t('budget.vers'), versChoisi, setVers)}
        {deChoisi !== null && deChoisi === versChoisi ? (
          <Banner ton="attention" icone="alert">
            {t('budget.comptesIdentiques')}
          </Banner>
        ) : null}
        <TextField
          label={t('budget.montant')}
          valeur={montantVirement}
          onChange={setMontantVirement}
          clavier={devise.decimales > 0 ? 'decimal-pad' : 'number-pad'}
          suffixe={devise.symbole}
          erreur={
            montantVirement.trim() !== '' && (virementMinimes === null || virementMinimes <= 0)
              ? t('budget.montantInvalide')
              : undefined
          }
        />
        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
        <Button pleineLargeur disabled={!virementValide} onPress={virer}>
          {t('commun.enregistrer')}
        </Button>
      </BottomSheet>

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
