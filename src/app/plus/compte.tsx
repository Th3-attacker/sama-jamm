import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { enregistrerPrenom, lirePrenom, seDeconnecter, useSession } from '@/features/compte/compte';
import { PRENOM_MAX, prenomPropre } from '@/features/compte/validation';
import { useFavoris } from '@/stores/favoris';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { Switch } from '@/ui/Switch';
import { TextField } from '@/ui/TextField';
import { useToast } from '@/ui/Toast';
import { TopBar } from '@/ui/TopBar';

/** Compte facultatif : prénom, adresse, synchronisation à venir, déconnexion, suppression. */
export default function Compte() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { afficher } = useToast();
  const session = useSession((s) => s.session);
  const pret = useSession((s) => s.pret);
  const [prenom, setPrenom] = useState('');
  const [erreur, setErreur] = useState(false);
  const nbFavoris = useFavoris((s) => s.versets.length);

  // Sans session : la connexion à la place.
  useEffect(() => {
    if (pret && !session) router.replace('/plus/connexion');
  }, [pret, session]);

  useEffect(() => {
    if (!session) return;
    lirePrenom()
      .then((p) => setPrenom(p ?? ''))
      .catch((e: unknown) => console.warn('Prénom non lu', e));
  }, [session]);

  const prenomOk = prenomPropre(prenom);

  const enregistrer = async () => {
    if (prenomOk === undefined) return;
    setErreur(false);
    try {
      await enregistrerPrenom(prenomOk);
      afficher({ texte: t('compte.prenomEnregistre'), icone: 'check' });
    } catch (e: unknown) {
      console.warn('Prénom non enregistré', e);
      setErreur(true);
    }
  };

  const deconnecter = async () => {
    try {
      await seDeconnecter();
      router.back();
    } catch (e: unknown) {
      console.warn('Déconnexion impossible', e);
      setErreur(true);
    }
  };

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('compte.titre')} sousTitre={t('compte.sousTitre')} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8,
          gap: espace.espace5,
        }}>
        <Banner ton="info" titre={t('compte.synchroTitre')}>
          {t('compte.synchroTexte')}
        </Banner>
        <ListGroup titre={t('compte.votreCompte')}>
          <ListItem
            icone="user"
            titre={session?.user.email ?? ''}
            sousTitre={t('compte.connecteAvec', { fournisseur: 'e-mail' })}
          />
        </ListGroup>
        <TextField
          label={t('compte.prenom')}
          valeur={prenom}
          onChange={setPrenom}
          maxLength={PRENOM_MAX}
          aide={t('compte.prenomAide')}
        />
        <Button variant="secondaire" pleineLargeur disabled={prenomOk === undefined} onPress={enregistrer}>
          {t('commun.enregistrer')}
        </Button>
        <ListGroup titre={t('compte.synchroTitre')} note={t('compte.synchroBientot')}>
          <ListItem
            icone="bookmark"
            titre={t('menuPlus.favoris')}
            sousTitre={t('compte.synchroFavorisAide', { n: nbFavoris })}
            droite={<Switch active={false} disabled onChange={() => undefined} label={t('menuPlus.favoris')} />}
          />
          <ListItem
            icone="settings"
            titre={t('menuPlus.reglages')}
            sousTitre={t('compte.synchroReglagesAide')}
            droite={<Switch active={false} disabled onChange={() => undefined} label={t('menuPlus.reglages')} />}
          />
          <ListItem
            icone="users"
            titre={t('compte.khatms')}
            sousTitre={t('compte.synchroKhatmAide')}
            droite={<Switch active={false} disabled onChange={() => undefined} label={t('compte.khatms')} />}
          />
        </ListGroup>
        {erreur ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
        <View style={{ gap: espace.espace1 }}>
          <Button variant="secondaire" pleineLargeur onPress={deconnecter}>
            {t('compte.deconnexion')}
          </Button>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/plus/compte-supprimer')}
            style={styles.supprimer}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.erreur }]}>
              {t('compte.supprimer')}
            </Text>
          </Pressable>
        </View>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
          {t('connexion.budgetReste')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  supprimer: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
