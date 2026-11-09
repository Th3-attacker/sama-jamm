import { Stack } from 'expo-router';
import { View } from 'react-native';

import { SondeBarre } from '@/features/ecouter/SondeBarre';

export default function LireLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <SondeBarre />
    </View>
  );
}
