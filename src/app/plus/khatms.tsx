import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/compte/compte';
import { mesKhatms, type Khatm } from '@/features/khatm/depot';
import { lireCode, saisieCodeKhatm } from '@/features/khatm/logique';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';
import { EmptyState } from '@/ui/EmptyState';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TextField } from '@/ui/TextField';
import { TopBar } from '@/ui/TopBar';

/** Mes khatms collectifs : la liste, en créer un, en rejoindre un avec un code. */
export default function MesKhatms() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const marge = useMargeBasse();
  const connecte = useSession((s) => s.session !== null);
  const [liste, setListe] = useState<Khatm[] | null>(null);
  const [erreur, setErreur] = useState(false);
  const [code, setCode] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!connecte) return;
      mesKhatms()
        .then((l) => {
          setListe(l);
          setErreur(false);
        })
        .catch((e: unknown) => {
          console.warn('Khatms illisibles', e);
          setErreur(true);
        });
    }, [connecte]),
  );

  const codeOk = lireCode(code);

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={t('khatm.titre')} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: espace.espace5,
          paddingBottom: espace.espace8 + marge,
          gap: espace.espace5,
        }}>
        <View>
          <Text
            accessibilityLanguage="wo"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.titre3, { color: couleurs.emeraude }]}>
            {t('formules.entraide')}
          </Text>
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.translitteration, { color: couleurs.encre2 }]}>
            {t('formules.entraideTrad')}
          </Text>
        </View>
        {!connecte ? (
          <Banner
            ton="info"
            action={{ label: t('compte.connexionTitre'), onPress: () => router.push('/plus/connexion') }}>
            {t('khatm.compteNecessaire')}
          </Banner>
        ) : (
          <>
            {erreur ? <Banner ton="erreur">{t('etats.erreurTexte')}</Banner> : null}
            {liste && liste.length > 0 ? (
              <ListGroup>
                {liste.map((k) => (
                  <ListItem
                    key={k.id}
                    icone="users"
                    titre={k.nom}
                    sousTitre={k.intention ?? undefined}
                    onPress={() => router.push({ pathname: '/plus/khatm/[id]', params: { id: k.id } })}
                  />
                ))}
              </ListGroup>
            ) : liste ? (
              <EmptyState icone="users" lang="fr" titre={t('khatm.aucun')} texte={t('khatm.aucunTexte')} />
            ) : null}
            <Button icone="plus" pleineLargeur onPress={() => router.push('/plus/khatm-nouveau')}>
              {t('khatm.nouveau')}
            </Button>
            <TextField
              label={t('khatm.rejoindreCode')}
              valeur={code}
              onChange={(v) => setCode(saisieCodeKhatm(v))}
              placeholder="ABCD2345"
              majuscules
            />
            <Button
              variant="secondaire"
              pleineLargeur
              disabled={!codeOk}
              onPress={() => codeOk && router.push({ pathname: '/khatm/[code]', params: { code: codeOk } })}>
              {t('khatm.rejoindre')}
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
