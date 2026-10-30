// Galerie des composants, en développement seulement. Textes d'exemple en dur : outil interne, jamais livré.
import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import type { IconName } from '@/ui/types';

const ICONES: IconName[] = [
  'play', 'pause', 'skip-back', 'skip-forward', 'repeat', 'bookmark', 'share', 'search', 'home', 'book',
  'headphones', 'clock', 'download', 'reset', 'wallet', 'bell', 'arrow-left', 'arrow-down', 'arrow-up',
  'chevron-right', 'chevron-down', 'more', 'check', 'close', 'plus', 'minus', 'backspace', 'info', 'alert',
  'offline', 'moon', 'sun', 'globe', 'trash', 'edit', 'compass', 'pin', 'settings', 'user', 'users', 'lock',
  'calendar', 'target', 'heart', 'balance', 'list', 'type', 'bolt', 'car', 'cart', 'copy', 'kaaba',
];

const rien = () => undefined;

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  const { couleurs, espace, typographie } = useTheme();
  return (
    <View style={{ gap: espace.espace3 }}>
      <Text style={[typographie.titre2, { color: couleurs.encre }]}>{titre}</Text>
      {children}
    </View>
  );
}

export default function Composants() {
  const { nom, couleurs, espace } = useTheme();

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <SafeAreaView style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <ScrollView contentContainerStyle={{ padding: espace.espace5, gap: espace.espace8 }}>
        <Text style={{ color: couleurs.encre3 }}>Thème : {nom}</Text>

        <Section titre="Button">
          <Button onPress={rien}>Reprendre la lecture</Button>
          <Button variant="secondaire" icone="download" onPress={rien}>
            Télécharger
          </Button>
          <Button variant="discret" onPress={rien}>
            Plus tard
          </Button>
          <Button variant="precieux" onPress={rien}>
            Terminer le khatm
          </Button>
          <Button variant="danger" onPress={rien}>
            Supprimer définitivement
          </Button>
          <Button pleineLargeur disabled onPress={rien}>
            Désactivé
          </Button>
        </Section>

        <Section titre="IconButton">
          <View style={styles.ligne}>
            <IconButton icone="bookmark" label="Ajouter aux favoris" onPress={rien} />
            <IconButton icone="bookmark" label="Retirer des favoris" actif onPress={rien} />
            <IconButton icone="share" label="Partager" onPress={rien} />
            <IconButton icone="arrow-left" label="Retour" taille={22} onPress={rien} />
          </View>
        </Section>

        <Section titre="Icon">
          <View style={[styles.ligne, styles.grille, { gap: espace.espace4 }]}>
            {ICONES.map((n) => (
              <Icon key={n} name={n} color={couleurs.encre2} />
            ))}
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  ligne: { flexDirection: 'row', alignItems: 'center' },
  grille: { flexWrap: 'wrap' },
});
