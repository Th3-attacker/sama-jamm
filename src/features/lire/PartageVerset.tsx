// Partage d'un verset (maquette « Partager un verset ») : carte en image ou texte avec lien, fond et traduction au choix.
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { themes } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { Switch } from '@/ui/Switch';
import { useToast } from '@/ui/Toast';

type Fond = 'emeraude' | 'nuit';
export type VersetAPartager = { sourate: number; nomSourate: string; n: number; texte: string; trad?: string };

/** Couleurs fixes de la carte : elle ne dépend pas du thème choisi dans l'app. */
const CARTE: Record<Fond, { fond: string; texte: string; accent: string; discret: string }> = {
  emeraude: {
    fond: themes.jour.couleurs.emeraude,
    texte: themes.jour.couleurs.surEmeraude,
    accent: themes.jour.couleurs.or,
    discret: themes.jour.couleurs.orDoux,
  },
  nuit: {
    fond: themes.nuit.couleurs.fond,
    texte: themes.nuit.couleurs.encre,
    accent: themes.nuit.couleurs.or,
    discret: themes.nuit.couleurs.encre2,
  },
};

/** Lien public vers le verset (quran.com), ajouté au texte copié. */
export const lienVerset = (sourate: number, verset: number) => `https://quran.com/${sourate}/${verset}`;

export function PartageVerset({ verset, onFermer }: { verset: VersetAPartager | null; onFermer: () => void }) {
  const { t } = useTranslation();
  const { couleurs, espace, latin, rayon, typographie } = useTheme();
  const { afficher } = useToast();
  const carte = useRef<ComponentRef<typeof View>>(null);
  const [fond, setFond] = useState<Fond>('emeraude');
  const [avecTraduction, setAvecTraduction] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  const c = CARTE[fond];
  const traduction = avecTraduction && verset?.trad ? verset.trad : null;
  const reference = verset ? t('partage.reference', { sourate: verset.nomSourate, verset: verset.n }) : '';

  const partagerImage = async () => {
    if (!carte.current || envoi) return;
    setEnvoi(true);
    try {
      const uri = await captureRef(carte, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('partage.titreFeuille') });
    } catch (erreur: unknown) {
      console.error('Image du verset non partagée', erreur);
      afficher({ texte: t('etats.erreurTexte'), icone: 'alert' });
    } finally {
      setEnvoi(false);
    }
  };

  const copier = async () => {
    if (!verset) return;
    const texte = [verset.texte, traduction, reference, lienVerset(verset.sourate, verset.n)]
      .filter(Boolean)
      .join('\n\n');
    try {
      await Clipboard.setStringAsync(texte);
      afficher({ texte: t('partage.copie'), icone: 'check' });
    } catch (erreur: unknown) {
      console.error('Verset non copié', erreur);
      afficher({ texte: t('etats.erreurTexte'), icone: 'alert' });
    }
  };

  return (
    <BottomSheet ouvert={verset !== null} titre={t('partage.titreFeuille')} onFermer={onFermer}>
      {verset ? (
        <>
          {/* Proverbe de la maquette : le partage comme remède. */}
          <View style={{ gap: espace.espace1 }}>
            <Text
              accessibilityLanguage="wo"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[latin.titre3, { color: couleurs.emeraude, writingDirection: 'ltr' }]}>
              {t('formules.partage')}
            </Text>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.translitteration, { color: couleurs.encre2 }]}>
              {t('formules.partageTrad')}
            </Text>
          </View>
          {/* Carte capturée telle quelle en image : rien d'interactif à l'intérieur. */}
          <View
            ref={carte}
            collapsable={false}
            style={{
              backgroundColor: c.fond,
              borderRadius: rayon.rayonCarte,
              padding: espace.espace6,
              gap: espace.espace4,
            }}>
            <Text
              accessibilityLanguage="ar"
              allowFontScaling={false}
              style={[typographie.coran, styles.arabe, { color: c.texte }]}>
              {verset.texte}
            </Text>
            {traduction ? (
              <Text allowFontScaling={false} style={[typographie.lecture, { color: c.texte }]}>
                {traduction}
              </Text>
            ) : null}
            <View style={[styles.filet, { backgroundColor: c.accent }]} />
            <Text allowFontScaling={false} style={[typographie.libelle, { color: c.accent }]}>
              {reference}
            </Text>
            <Text allowFontScaling={false} style={[typographie.legende, { color: c.discret }]}>
              {traduction ? t('partage.source') : t('partage.marque')}
            </Text>
          </View>

          <SegmentedControl
            label={t('partage.fond')}
            options={[
              { id: 'emeraude', label: t('partage.emeraude') },
              { id: 'nuit', label: t('partage.nuit') },
            ]}
            valeur={fond}
            onChange={(id) => setFond(id === 'nuit' ? 'nuit' : 'emeraude')}
          />
          {verset.trad ? (
            <ListGroup>
              <ListItem
                titre={t('partage.ajouterTraduction')}
                sousTitre={t('partage.ajouterTraductionDetail')}
                droite={
                  <Switch label={t('partage.ajouterTraduction')} active={avecTraduction} onChange={setAvecTraduction} />
                }
              />
            </ListGroup>
          ) : null}
          <Button icone="share" pleineLargeur disabled={envoi} onPress={partagerImage}>
            {t('partage.partagerImage')}
          </Button>
          <Button variant="discret" pleineLargeur onPress={copier}>
            {t('partage.copierTexte')}
          </Button>
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
  filet: { width: 48, height: 1.5, borderRadius: 1 },
});
