import { Switch as SwitchNatif } from 'react-native';

import { useTheme } from '@/theme/useTheme';

export type SwitchProps = {
  active: boolean;
  onChange: (active: boolean) => void;
  /** Obligatoire : lu par les lecteurs d'écran, même dans une ligne qui le nomme. */
  label: string;
  disabled?: boolean;
};

// Interrupteur natif aux couleurs des jetons ; le réglage prend effet tout de suite.
export function Switch({ active, onChange, label, disabled = false }: SwitchProps) {
  const { couleurs } = useTheme();
  return (
    <SwitchNatif
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: active, disabled }}
      value={active}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: couleurs.surfaceCreux, true: couleurs.emeraudeAplat }}
      thumbColor={active ? couleurs.surEmeraude : couleurs.ligneForte}
      ios_backgroundColor={couleurs.surfaceCreux}
    />
  );
}
