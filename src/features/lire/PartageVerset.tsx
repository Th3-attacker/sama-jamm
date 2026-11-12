// Partage d'un verset (planche « Partager un verset ») : image aux couleurs de marque (émeraude, nuit ou ivoire,
// carrée ou story), translittération en option (désactivée par défaut), texte et lien. Aucune traduction du Coran.
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { themes } from '@/theme/tokens.generated';
import { echelleSuivante } from './echelleCarte';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { useToast } from '@/ui/Toast';

type Fond = 'emeraude' | 'nuit' | 'ivoire';
type Format = 'carre' | 'story';
export type VersetAPartager = { sourate: number; nomSourate: string; n: number; texte: string; translit?: string };

const FONDS: readonly Fond[] = ['emeraude', 'nuit', 'ivoire'];
/** Côté de l'image exportée : 1080 de large, carré ou story (1080 × 1920). */
const EXPORT = { largeur: 1080, hauteur: { carre: 1080, story: 1920 } } as const;

const jour = themes.jour.couleurs;
/** Couleurs de marque fixes : la carte ne dépend pas du thème choisi dans l'app. */
const CARTE: Record<Fond, { fond: string; texte: string; accent: string; bord: string }> = {
  emeraude: { fond: jour.marqueEmeraude, texte: jour.marqueIvoire, accent: jour.marqueOr, bord: jour.marqueEmeraude },
  nuit: { fond: jour.marqueNuit, texte: jour.marqueIvoire, accent: jour.marqueOr, bord: jour.marqueNuit },
  ivoire: { fond: jour.marqueIvoire, texte: jour.encre, accent: jour.orTexte, bord: jour.ligne },
};

/** Lien public vers le verset (quran.com), ajouté au texte copié. */
export const lienVerset = (sourate: number, verset: number) => `https://quran.com/${sourate}/${verset}`;

export function PartageVerset({ verset, onFermer }: { verset: VersetAPartager | null; onFermer: () => void }) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { afficher } = useToast();
  const carte = useRef<ComponentRef<typeof View>>(null);
  const [fond, setFond] = useState<Fond>('emeraude');
  const [format, setFormat] = useState<Format>('carre');
  const [avecTranslit, setAvecTranslit] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  // Taille du texte : réduite tant qu'il ne tient pas dans la carte ; remise à 1 quand le contenu ou le format change.
  const cleCarte = `${verset?.sourate}:${verset?.n}:${format}:${avecTranslit}`;
  const [reglage, setReglage] = useState({ cle: cleCarte, echelle: 1 });
  if (reglage.cle !== cleCarte) setReglage({ cle: cleCarte, echelle: 1 });
  // Hauteurs mesurées de la carte et de son contenu, dans n'importe quel ordre d'arrivée.
  const mesures = useRef({ carte: 0, contenu: 0 });
  const ajuster = (carteH?: number, contenuH?: number) => {
    if (carteH !== undefined) mesures.current.carte = carteH;
    if (contenuH !== undefined) mesures.current.contenu = contenuH;
    const place = mesures.current.carte - 2 * (espace.espace5 + 1);
    setReglage((r) => {
      const suivante = echelleSuivante(mesures.current.contenu, place, r.echelle);
      return suivante === r.echelle ? r : { cle: r.cle, echelle: suivante };
    });
  };
  const echelle = reglage.cle === cleCarte ? reglage.echelle : 1;

  const c = CARTE[fond];
  const translit = avecTranslit && verset?.translit ? verset.translit : null;
  // Tailles du texte de la carte, réduites par l'échelle courante.
  const taille = (base: { fontSize?: number; lineHeight?: number }) => ({
    fontSize: (base.fontSize ?? 16) * echelle,
    lineHeight: (base.lineHeight ?? 24) * echelle,
  });
  const reference = verset ? `${verset.nomSourate} · ${verset.sourate}:${verset.n}` : '';

  const partagerImage = async () => {
    if (!carte.current || envoi) return;
    setEnvoi(true);
    try {
      const uri = await captureRef(carte, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: EXPORT.largeur,
        height: EXPORT.hauteur[format],
      });
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
    const texte = [verset.texte, translit, reference, lienVerset(verset.sourate, verset.n)].filter(Boolean).join('\n\n');
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
          {/* Carte capturée telle quelle en image : rien d'interactif à l'intérieur. */}
          <View style={styles.centre}>
            <View
              ref={carte}
              collapsable={false}
              accessible
              accessibilityRole="image"
              accessibilityLabel={reference}
              onLayout={(e) => ajuster(e.nativeEvent.layout.height)}
              style={[
                styles.carte,
                {
                  width: format === 'story' ? '62%' : '100%',
                  aspectRatio: format === 'story' ? 9 / 16 : 1,
                  backgroundColor: c.fond,
                  borderColor: c.bord,
                  borderRadius: rayon.rayonFeuille,
                  padding: espace.espace5,
                  gap: espace.espace3,
                },
              ]}>
              {/* Contenu mesuré : s'il dépasse la place de la carte, le texte rétrécit (jamais coupé). */}
              <View
                onLayout={(e) => ajuster(undefined, e.nativeEvent.layout.height)}
                style={[styles.contenu, { gap: espace.espace3 }]}>
              <Text
                accessibilityLanguage="ar"
                allowFontScaling={false}
                style={[typographie.coran, styles.arabe, taille(typographie.coran), { color: c.texte }]}>
                {verset.texte}
              </Text>
              {translit ? (
                <Text accessibilityLanguage="en" allowFontScaling={false} style={[typographie.translitteration, styles.translit, taille(typographie.translitteration), { color: c.texte }]}>
                  {translit}
                </Text>
              ) : null}
              <Text allowFontScaling={false} style={[typographie.legende, styles.reference, taille(typographie.legende), { color: c.accent }]}>
                {`${reference} · ${t('partage.marque')}`}
              </Text>
              </View>
            </View>
          </View>

          <View accessibilityRole="radiogroup" accessibilityLabel={t('partage.style')} style={[styles.styles, { gap: espace.espace4 }]}>
            {FONDS.map((f) => {
              const actif = f === fond;
              return (
                <Pressable
                  key={f}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: actif }}
                  accessibilityLabel={t(`partage.${f}`)}
                  onPress={() => setFond(f)}
                  style={[styles.style, { gap: espace.espace1 }]}>
                  <View
                    style={[
                      styles.pastille,
                      {
                        backgroundColor: CARTE[f].fond,
                        borderColor: actif ? couleurs.emeraude : couleurs.ligneForte,
                        borderWidth: actif ? 3 : 1,
                      },
                    ]}
                  />
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
                    {t(`partage.${f}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.ligne, { gap: espace.espace3 }]}>
            <View style={styles.format}>
              <SegmentedControl
                label={t('partage.format')}
                options={[
                  { id: 'carre', label: t('partage.carre') },
                  { id: 'story', label: t('partage.story') },
                ]}
                valeur={format}
                onChange={(id) => setFormat(id === 'story' ? 'story' : 'carre')}
              />
            </View>
            {verset.translit ? (
              <Chip selectionne={avecTranslit} onPress={() => setAvecTranslit((v) => !v)}>
                {t('reglages.translit')}
              </Chip>
            ) : null}
          </View>

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
  centre: { alignItems: 'center' },
  contenu: { alignSelf: 'stretch', alignItems: 'center' },
  carte: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  arabe: { textAlign: 'center', writingDirection: 'rtl' },
  translit: { textAlign: 'center' },
  reference: { textAlign: 'center', letterSpacing: 0.9, textTransform: 'uppercase' },
  styles: { flexDirection: 'row', justifyContent: 'center' },
  style: { alignItems: 'center', minWidth: 48 },
  pastille: { width: 40, height: 40, borderRadius: 999 },
  ligne: { flexDirection: 'row', alignItems: 'flex-end' },
  format: { flex: 1 },
});
