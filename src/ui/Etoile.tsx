// L'étoile à huit branches (deux carrés tournés de 45°), seul ornement de la charte.
import Svg, { Polygon } from 'react-native-svg';

// Même géométrie que starPoints() de bundle.js.
function points(c: number, R: number): string {
  const r = (R * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
  return Array.from({ length: 16 }, (_, k) => {
    const a = ((-90 + k * 22.5) * Math.PI) / 180;
    const rad = k % 2 === 0 ? R : r;
    return `${(c + rad * Math.cos(a)).toFixed(2)},${(c + rad * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

type Props = {
  taille: number;
  remplissage: string;
  contour?: string;
};

export function Etoile({ taille, remplissage, contour }: Props) {
  const c = taille / 2;
  const trait = contour ? 1 : 0;
  return (
    <Svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`} accessible={false}>
      <Polygon points={points(c, c - trait)} fill={remplissage} stroke={contour ?? 'none'} strokeWidth={trait} />
    </Svg>
  );
}
