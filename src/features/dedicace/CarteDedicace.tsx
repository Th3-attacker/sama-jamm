// Carte « Pour un proche décédé » de l'Accueil (page 16) : un nom complet, une invocation. Le nom est relu à la main avant
// d'apparaître sur le site. Trois états : saisie, « Merci » après l'envoi, et un message calme quand l'envoi échoue
// (hors ligne : le nom reste dans le champ, le bouton reste actif). Rien n'est écrit dans les journaux.
import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { URL_NOMS_DEDIES } from '@/constants/liens';
import { useSession } from '@/features/compte/compte';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';
import { SegmentedControl } from '@/ui/SegmentedControl';

import { dedierNom } from './depot';
import type { IssueDedicace } from './erreurs';
import { controlerNom, NOM_MAX, type Formule } from './validation';

import { interlignes, tailles } from '@/theme/tokens.generated';

type Phase = { etape: 'saisie' } | { etape: 'envoi' } | { etape: 'merci'; nom: string; formule: Formule };

export function CarteDedicace() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, cible, typographie, ligne } = useTheme();
  const [nom, setNom] = useState('');
  const [formule, setFormule] = useState<Formule>('masculin');
  const [phase, setPhase] = useState<Phase>({ etape: 'saisie' });
  const session = useSession((s) => s.session);
  const sessionPrete = useSession((s) => s.pret);
  const [probleme, setProbleme] = useState<Exclude<IssueDedicace, 'ok'> | null>(null);

  const dedier = async () => {
    setProbleme(null);
    setPhase({ etape: 'envoi' });
    const issue = await dedierNom(nom, formule);
    if (issue === 'ok') {
      const controle = controlerNom(nom);
      setPhase({ etape: 'merci', nom: controle.valide ? controle.nom : nom.trim(), formule });
      setNom('');
      return;
    }
    // Le nom reste dans le champ : on peut corriger ou réessayer.
    setProbleme(issue);
    setPhase({ etape: 'saisie' });
  };

  const voirLesNoms = () => {
    Linking.openURL(URL_NOMS_DEDIES).catch((erreur: unknown) => console.warn('Site des noms dédiés inaccessible', erreur));
  };

  const lien = (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t('dedicace.voir')}
      onPress={voirLesNoms}
      style={[styles.lien, { minHeight: cible.cibleIos }]}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.texteLien), { color: couleurs.orTexte }]}>
        {t('dedicace.voir')}
      </Text>
    </Pressable>
  );

  const etiquette = (
    <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.etiquette), { color: couleurs.orTexte }]}>
      {t('dedicace.etiquette')}
    </Text>
  );

  // Planche : carte `or-doux`, rayon 20, comme les quatre cartes de l'Accueil. Compacte à la demande du propriétaire
  // (titre 18/24, marge de 12, espaces de 4) : voir ECARTS.md.
  const carte = { gap: espace.espace1, padding: espace.espace3, borderRadius: rayon.rayonFeuille, backgroundColor: couleurs.orDoux };

  if (phase.etape === 'merci') {
    return (
      <View style={carte}>
        {etiquette}
        <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre3, { color: couleurs.encre }]}>
          {t('dedicace.merci')}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} accessibilityLiveRegion="polite" style={[typographie.corps, ligne(styles.texte), { color: couleurs.encre }]}>
          {t('dedicace.merciTexte', { nom: phase.nom })}
        </Text>
        <Text
          accessibilityLanguage="ar"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.arabe, styles.invocation, { color: couleurs.orTexte, writingDirection: 'rtl' }]}>
          {t(`dedicace.invocation.${phase.formule}`)}
        </Text>
        {lien}
        <Button variant="secondaire" pleineLargeur onPress={() => setPhase({ etape: 'saisie' })}>
          {t('dedicace.autre')}
        </Button>
      </View>
    );
  }

  // Réservé aux comptes : sans session, on propose de se connecter au lieu du champ.
  if (sessionPrete && !session) {
    return (
      <View style={carte}>
        {etiquette}
        <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre3, { color: couleurs.encre }]}>
          {t('dedicace.titre')}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.aide), { color: couleurs.encre2 }]}>
          {t('dedicace.connexion.texte')}
        </Text>
        <Button variant="principal" pleineLargeur onPress={() => router.push('/plus/connexion')}>
          {t('dedicace.connexion.bouton')}
        </Button>
        {lien}
      </View>
    );
  }

  const envoi = phase.etape === 'envoi';
  const message = probleme === null ? null : t(`dedicace.problemes.${probleme}`);

  return (
    <View style={carte}>
      {etiquette}
      <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre3, { color: couleurs.encre }]}>
        {t('dedicace.titre')}
      </Text>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.aide), { color: couleurs.encre2 }]}>
        {t('dedicace.texte')}
      </Text>
      <View style={[styles.saisie, { gap: espace.espace2 }]}>
        <TextInput
          accessibilityLabel={t('dedicace.champ')}
          value={nom}
          onChangeText={setNom}
          placeholder={t('dedicace.placeholder')}
          placeholderTextColor={couleurs.encre3}
          maxLength={NOM_MAX}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="send"
          onSubmitEditing={() => void dedier()}
          editable={!envoi}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[
            typographie.corps,
            styles.champ,
            {
              minHeight: cible.cibleAndroid,
              paddingHorizontal: espace.espace3,
              borderRadius: rayon.rayonCarte,
              borderColor: couleurs.ligneForte,
              backgroundColor: couleurs.surface,
              color: couleurs.encre,
            },
          ]}
        />
        <Button variant="principal" disabled={envoi} onPress={() => void dedier()}>
          {t('dedicace.dedier')}
        </Button>
      </View>
      {/* Le choix et le lien partagent une ligne quand la largeur le permet (la carte reste basse). */}
      <View style={[styles.choix, { gap: espace.espace2, marginTop: espace.espace2 }]}>
        <View style={styles.segment}>
          <SegmentedControl
            label={t('dedicace.formule')}
            options={[
              { id: 'masculin', label: t('dedicace.homme') },
              { id: 'feminin', label: t('dedicace.femme') },
            ]}
            valeur={formule}
            onChange={(id) => setFormule(id === 'feminin' ? 'feminin' : 'masculin')}
          />
        </View>
        {lien}
      </View>
      {message ? (
        <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.aide), { color: couleurs.encre2 }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Planche : étiquette en majuscules 12/16, interlettrage 0,06 em (comme « Wax ju rafet » avant elle).
  etiquette: { fontSize: tailles.t12, lineHeight: interlignes.l16, textTransform: 'uppercase', letterSpacing: 0.72 },
  texte: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  aide: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  choix: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  segment: { flexGrow: 1, flexBasis: 200 },
  saisie: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  champ: { flexGrow: 1, flexBasis: 160, borderWidth: 1 },
  // Planche : 24/32, hors échelle arabe (22, 28, 34) : ramené à 28/40.
  invocation: { fontSize: tailles.t28, lineHeight: interlignes.l40 },
  lien: { justifyContent: 'center', alignSelf: 'flex-start' },
  texteLien: { fontSize: tailles.t14, lineHeight: interlignes.l20, textDecorationLine: 'underline' },
});
