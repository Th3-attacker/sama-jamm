import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LIBELLE_BIEN_MAX, TYPES_BIEN, type TypeBien } from '@/features/budget/depot';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { grammesVersMg, mgVersGrammes } from '@/features/budget/zakat';
import { versMinimes, versSaisie } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Dialog } from '@/ui/Dialog';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

const estMetal = (t: TypeBien) => t === 'or' || t === 'argent';

/** Déclarer un bien pour la zakat (`?id=` pour le corriger) : or, argent, créance, dette ou autre bien. */
export default function BienZakat() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const id = useParametre('id');
  const etat = useBudget(
    async (depot, carnet) => (await depot.zakat(carnet)).biens.find((b) => b.id === id) ?? null,
    id,
  );
  // null tant que l'utilisateur n'a rien touché : le formulaire montre alors le bien enregistré.
  const [type, setType] = useState<TypeBien | null>(null);
  const [libelle, setLibelle] = useState<string | null>(null);
  const [valeur, setValeur] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  const titre = id ? t('zakat.modifierBien') : t('zakat.ajouterBien');
  if (etat.etat !== 'pret' || (id && etat.donnees === null)) {
    return <EcranBudgetIncomplet titre={titre} etat={etat} introuvable={t('zakat.introuvable')} />;
  }

  const { carnet, depot, donnees: bien } = etat;
  const devise = carnet.devise;
  const valType = type ?? bien?.type ?? 'or';
  const metal = estMetal(valType);
  const valLibelle = libelle ?? bien?.libelle ?? '';
  // Changer entre métal et montant vide le champ : un poids n'est pas un montant.
  const enregistree =
    bien && estMetal(bien.type) === metal
      ? metal
        ? mgVersGrammes(bien.milligrammes ?? 0)
        : (versSaisie(bien.montant ?? 0, devise) ?? '')
      : '';
  const valValeur = valeur ?? enregistree;
  const lu = valValeur.trim() === '' ? null : metal ? grammesVersMg(valValeur) : versMinimes(valValeur, devise);
  const libelleOk = valLibelle.trim().length <= LIBELLE_BIEN_MAX;
  const valide = lu !== null && lu > 0 && libelleOk;

  const agir = async (action: () => Promise<void>, message: string, icone: 'check' | 'trash') => {
    setEnvoi(true);
    setEchec(false);
    try {
      await action();
      budgetModifie();
      afficher({ texte: message, icone });
      router.back();
    } catch (erreur: unknown) {
      console.error('Bien de zakat non enregistré', erreur);
      setEchec(true);
      setEnvoi(false);
    }
  };

  const enregistrer = () => {
    if (!valide || lu === null) return;
    const saisie = { type: valType, libelle: valLibelle, valeur: lu };
    void agir(
      () =>
        bien ? depot.modifierBien(carnet, bien.id, saisie) : depot.ajouterBien(carnet, saisie).then(() => undefined),
      t('zakat.bienEnregistre'),
      'check',
    );
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={titre} />
      <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace4,
          }}>
          <View style={{ gap: espace.espace2 }}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
              {t('zakat.type')}
            </Text>
            <View style={[styles.puces, { gap: espace.espace2 }]}>
              {TYPES_BIEN.map((x) => (
                <Chip
                  key={x}
                  selectionne={x === valType}
                  onPress={() => {
                    if (estMetal(x) !== metal) setValeur('');
                    setType(x);
                  }}>
                  {t(`zakat.biensTypes.${x}`)}
                </Chip>
              ))}
            </View>
          </View>
          <TextField
            label={t('zakat.libelle')}
            placeholder={t('zakat.libellePlaceholder')}
            valeur={valLibelle}
            onChange={setLibelle}
            maxLength={LIBELLE_BIEN_MAX}
            erreur={!libelleOk ? t('zakat.libelleInvalide') : undefined}
          />
          <TextField
            label={metal ? t('zakat.poids') : t('zakat.montant')}
            valeur={valValeur}
            onChange={setValeur}
            clavier={metal || devise.decimales > 0 ? 'decimal-pad' : 'number-pad'}
            suffixe={metal ? 'g' : devise.symbole}
            placeholder="0"
            erreur={
              valeur !== null && valValeur.trim() !== '' && (lu === null || lu <= 0)
                ? metal
                  ? t('zakat.poidsInvalide')
                  : t('budget.montantInvalide')
                : undefined
            }
          />
          {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
          <Button pleineLargeur disabled={!valide || envoi} onPress={enregistrer}>
            {t('commun.enregistrer')}
          </Button>
          {bien ? (
            <Button variant="danger" icone="trash" pleineLargeur disabled={envoi} onPress={() => setConfirmer(true)}>
              {t('zakat.supprimerBien')}
            </Button>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Dialog
        ouvert={confirmer}
        danger
        icone="trash"
        titre={t('zakat.supprimerBienTitre')}
        confirmer={t('zakat.supprimerBien')}
        onAnnuler={() => setConfirmer(false)}
        onConfirmer={() => {
          setConfirmer(false);
          if (bien) void agir(() => depot.supprimerBien(carnet, bien.id), t('zakat.bienSupprime'), 'trash');
        }}>
        {t('zakat.supprimerBienTexte')}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
});
