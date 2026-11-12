import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { INTENTION_MAX, NOM_OBJECTIF_MAX, projectionObjectif } from '@/features/budget/epargne';
import { EcranBudgetIncomplet } from '@/features/budget/EcranBudgetIncomplet';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { cleJour, formatMoisAnnee } from '@/lib/dates';
import { versMinimes, versSaisie } from '@/lib/montant';
import { echelleMax } from '@/theme/typographie';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { EnteteRetour } from '@/ui/EnteteRetour';
import { EvitementClavier } from '@/ui/EvitementClavier';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';

import { interlignes, tailles } from '@/theme/tokens.generated';
type Mode = 'fixe' | 'libre';

/** Créer un objectif, ou le corriger (`?id=`) : nom, intention, montant visé et versement à chaque paie. */
export default function EcranObjectif() {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  const marge = useMargeBasse();
  const { afficher } = useToast();
  const id = useParametre('id');
  const etat = useBudget((depot, carnet) => (id ? depot.objectif(carnet, id) : Promise.resolve(null)), id);
  // null tant que l'utilisateur n'a rien touché : le formulaire montre alors l'objectif enregistré.
  const [mode, setMode] = useState<Mode | null>(null);
  const [nom, setNom] = useState<string | null>(null);
  const [intention, setIntention] = useState<string | null>(null);
  const [cible, setCible] = useState<string | null>(null);
  const [versement, setVersement] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  const titre = id ? t('epargne.modifierObjectif') : t('epargne.nouvelObjectif');
  if (etat.etat !== 'pret' || (id && etat.donnees === null)) {
    return <EcranBudgetIncomplet titre={titre} etat={etat} introuvable={t('epargne.introuvable')} />;
  }

  const { carnet, depot, donnees: o } = etat;
  const devise = carnet.devise;
  const clavier = devise.decimales > 0 ? 'decimal-pad' : 'number-pad';
  const enSaisie = (m: number | null | undefined) => (m ? (versSaisie(m, devise) ?? '') : '');
  const valMode: Mode = mode ?? (o && o.cible === null ? 'libre' : 'fixe');
  const valNom = nom ?? o?.nom ?? '';
  const valIntention = intention ?? o?.intention ?? '';
  const valCible = cible ?? enSaisie(o?.cible);
  const valVersement = versement ?? enSaisie(o?.versementMensuel);

  // Champ vide : aucun montant ; sinon un montant valide et positif.
  const lire = (s: string) => {
    if (s.trim() === '') return { ok: true, valeur: null };
    const m = versMinimes(s, devise);
    return m !== null && m > 0 ? { ok: true, valeur: m } : { ok: false, valeur: null };
  };
  const lu = { cible: lire(valCible), versement: lire(valVersement) };
  const montantVise = valMode === 'fixe' ? lu.cible.valeur : null;
  const nomOk = valNom.trim().length >= 1 && valNom.trim().length <= NOM_OBJECTIF_MAX;
  const valide = nomOk && lu.versement.ok && (valMode === 'libre' || (lu.cible.ok && lu.cible.valeur !== null));

  const projection = projectionObjectif(
    { verse: o?.verse ?? 0, cible: montantVise, versementMensuel: lu.versement.valeur },
    cleJour(new Date()),
  );
  const texteProjection =
    projection.type === 'rythme'
      ? t('epargne.projectionRythme', {
          montant: formatMontant(lu.versement.valeur ?? 0, devise),
          mois: formatMoisAnnee(projection.mois, i18n.language),
        })
      : projection.type === 'atteint'
        ? t('epargne.projectionAtteint')
        : projection.type === 'sansRythme'
          ? t('epargne.projectionSansRythme')
          : t('epargne.sansMontantConseil');

  const enregistrer = async () => {
    if (!valide) return;
    setEnvoi(true);
    setEchec(false);
    const saisie = {
      nom: valNom,
      intention: valIntention,
      cible: montantVise,
      versementMensuel: lu.versement.valeur,
    };
    try {
      if (o) await depot.modifierObjectif(carnet, o.id, saisie);
      else await depot.ajouterObjectif(carnet, saisie);
      budgetModifie();
      afficher({ texte: t('epargne.objectifEnregistre'), icone: 'check' });
      router.back();
    } catch (erreur: unknown) {
      console.error('Objectif non enregistré', erreur);
      setEchec(true);
      setEnvoi(false);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <EvitementClavier style={styles.ecran}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: espace.espace6,
            paddingBottom: espace.espace4 + marge,
            gap: espace.espace4,
          }}>
          <EnteteRetour titre={titre} sousTitre={t('epargne.nouvelObjectifSousTitre')} italique />
          <TextField
            label={t('epargne.nom')}
            valeur={valNom}
            onChange={setNom}
            maxLength={NOM_OBJECTIF_MAX}
            erreur={nom !== null && !nomOk ? t('epargne.nomInvalide') : undefined}
          />
          <TextField
            label={t('epargne.intention')}
            placeholder={t('epargne.intentionPlaceholder')}
            aide={t('epargne.intentionAide')}
            valeur={valIntention}
            onChange={setIntention}
            maxLength={INTENTION_MAX}
          />
          <SegmentedControl
            label={t('epargne.montantVise')}
            options={[
              { id: 'fixe', label: t('epargne.montantFixe') },
              { id: 'libre', label: t('epargne.sansMontant') },
            ]}
            valeur={valMode}
            onChange={(choix) => setMode(choix === 'libre' ? 'libre' : 'fixe')}
          />
          <View style={[styles.rangee, { gap: espace.espace3 }]}>
            {valMode === 'fixe' ? (
              <View style={styles.moitie}>
                <TextField
                  label={t('epargne.montantVise')}
                  valeur={valCible}
                  onChange={setCible}
                  clavier={clavier}
                  suffixe={devise.symbole}
                  placeholder="0"
                  erreur={
                    cible !== null && (!lu.cible.ok || lu.cible.valeur === null)
                      ? t('budget.montantInvalide')
                      : undefined
                  }
                />
              </View>
            ) : null}
            <View style={styles.moitie}>
              <TextField
                label={valMode === 'fixe' ? t('epargne.aChaquePaie') : t('epargne.aChaquePaieFacultatif')}
                valeur={valVersement}
                onChange={setVersement}
                clavier={clavier}
                suffixe={devise.symbole}
                placeholder="0"
                erreur={!lu.versement.ok ? t('budget.montantInvalide') : undefined}
              />
            </View>
          </View>
          <View style={{ padding: espace.espace4, borderRadius: rayon.rayonCarte, backgroundColor: couleurs.orDoux }}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.petit), { color: couleurs.encre }]}>
              {texteProjection}
            </Text>
          </View>
          {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
          <View style={styles.espace} />
          <Button grand pleineLargeur disabled={!valide || envoi} onPress={enregistrer}>
            {o ? t('commun.enregistrer') : t('epargne.creer')}
          </Button>
        </ScrollView>
      </EvitementClavier>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  rangee: { flexDirection: 'row' },
  moitie: { flex: 1 },
  petit: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  espace: { flex: 1 },
});
