import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRythmeObjectif } from '@/features/budget/CarteObjectif';
import { progressionObjectif } from '@/features/budget/epargne';
import { EtatsBudget } from '@/features/budget/EtatsBudget';
import { budgetModifie, useBudget } from '@/features/budget/useBudget';
import { useFormatMontant } from '@/features/budget/verrou';
import { formatJourCle } from '@/lib/dates';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { ProgressBar } from '@/ui/ProgressBar';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

/** Détail d'un objectif : ce qui est mis de côté, le rythme, les versements, et « utilisé ». */
export default function DetailObjectif() {
  const { t, i18n } = useTranslation();
  const formatMontant = useFormatMontant();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const etat = useBudget((depot, carnet) => depot.objectif(carnet, id), id);
  const rythmeDe = useRythmeObjectif();
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [echec, setEchec] = useState(false);

  if (etat.etat !== 'pret' || etat.donnees === null) {
    return (
      <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <TopBar retour titre={t('epargne.titre')} />
        {etat.etat === 'pret' ? (
          <View style={{ padding: espace.espace5 }}>
            <Banner ton="erreur">{t('epargne.introuvable')}</Banner>
          </View>
        ) : (
          <EtatsBudget etat={etat} />
        )}
      </View>
    );
  }

  const { carnet, depot, donnees: o } = etat;
  const devise = carnet.devise;
  const f = (m: number) => formatMontant(m, devise);
  const part = progressionObjectif(o.verse, o.cible);

  const changerUtilise = async (utilise: boolean) => {
    setEnvoi(true);
    setEchec(false);
    try {
      if (utilise) await depot.marquerUtilise(carnet, o.id);
      else await depot.restaurerObjectif(carnet, o.id);
      budgetModifie();
      afficher({ texte: utilise ? t('epargne.objectifUtilise') : t('epargne.objectifRestaure'), icone: 'check' });
    } catch (erreur: unknown) {
      console.error('Objectif non modifié', erreur);
      setEchec(true);
    }
    setEnvoi(false);
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={o.nom} sousTitre={o.utilise ? t('epargne.statutUtilise') : undefined} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace4,
        }}>
        {o.intention ? (
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.translitteration, { color: couleurs.encre2 }]}>
            {t('epargne.intentionLigne', { texte: o.intention })}
          </Text>
        ) : null}
        <AmountDisplay
          montant={o.verse}
          devise={devise}
          libelle={t('epargne.misDeCote')}
          detail={o.cible !== null ? t('dettes.resteDetail', { total: f(o.cible) }) : undefined}
        />
        {part !== null ? (
          <ProgressBar valeur={part} label={o.nom} detail={rythmeDe(o, devise)} ton="or" />
        ) : (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {rythmeDe(o, devise)}
          </Text>
        )}

        <ListGroup
          titre={t('epargne.versements')}
          note={o.versements.length === 0 ? t('epargne.aucunVersement') : undefined}>
          {o.versements.map((v) => (
            <ListItem
              key={v.id}
              icone="check"
              titre={f(v.montant)}
              sousTitre={[formatJourCle(v.date, i18n.language), v.compte, v.note].filter(Boolean).join(' · ')}
              onPress={() => router.push({ pathname: '/budget/operation/[id]', params: { id: v.id } })}
            />
          ))}
        </ListGroup>

        {echec ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}

        {!o.utilise ? (
          <Button
            icone="plus"
            pleineLargeur
            disabled={envoi}
            onPress={() => router.push({ pathname: '/budget/epargne/versement', params: { objectif: o.id } })}>
            {t('epargne.mettreDeCote')}
          </Button>
        ) : null}
        <Button
          variant="secondaire"
          icone="edit"
          pleineLargeur
          disabled={envoi}
          onPress={() => router.push({ pathname: '/budget/epargne/objectif', params: { id: o.id } })}>
          {t('epargne.modifierObjectif')}
        </Button>
        {o.utilise ? (
          <Button variant="discret" pleineLargeur disabled={envoi} onPress={() => changerUtilise(false)}>
            {t('epargne.restaurer')}
          </Button>
        ) : (
          <Button variant="discret" icone="check" pleineLargeur disabled={envoi} onPress={() => setConfirmer(true)}>
            {t('epargne.marquerUtilise')}
          </Button>
        )}
      </ScrollView>

      <Dialog
        ouvert={confirmer}
        titre={t('epargne.utiliseTitre')}
        confirmer={t('epargne.marquerUtilise')}
        onAnnuler={() => setConfirmer(false)}
        onConfirmer={() => {
          setConfirmer(false);
          void changerUtilise(true);
        }}>
        {t('epargne.utiliseTexte', { nom: o.nom })}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
