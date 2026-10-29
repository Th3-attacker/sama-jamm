// Une famille par graisse : sur Android, fontWeight ne choisit pas la graisse d'une police personnalisée.
import { Amiri_400Regular } from '@expo-google-fonts/amiri/400Regular';
import { Amiri_700Bold } from '@expo-google-fonts/amiri/700Bold';
import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran/400Regular';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { NotoSansArabic_400Regular } from '@expo-google-fonts/noto-sans-arabic/400Regular';
import { NotoSansArabic_600SemiBold } from '@expo-google-fonts/noto-sans-arabic/600SemiBold';
import { SourceSans3_400Regular } from '@expo-google-fonts/source-sans-3/400Regular';
import { SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3/600SemiBold';
import { SourceSerif4_400Regular } from '@expo-google-fonts/source-serif-4/400Regular';
import { SourceSerif4_400Regular_Italic } from '@expo-google-fonts/source-serif-4/400Regular_Italic';

export const polices = {
  CormorantGaramond_600SemiBold,
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
  SourceSerif4_400Regular,
  SourceSerif4_400Regular_Italic,
  Amiri_400Regular,
  Amiri_700Bold,
  AmiriQuran_400Regular,
  NotoSansArabic_400Regular,
  NotoSansArabic_600SemiBold,
};

export type NomPolice = keyof typeof polices;
