// Tracé propre du design system (bundle.js) : Lucide n'a pas d'équivalent.
import Svg, { Path } from 'react-native-svg';

type Props = { size: number; color: string; strokeWidth: number };

export function Kaaba({ size, color, strokeWidth }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="M4.5 8l7.5-3.5L19.5 8v9L12 20.5 4.5 17z" />
      <Path d="M4.5 8L12 11.5 19.5 8M12 11.5v9M4.5 10.75L12 14.25l7.5-3.5" />
    </Svg>
  );
}
