import { useWindowDimensions } from 'react-native';

export const C = {
  bg: '#0a0a0a',
  red: '#e50914',
  redDark: '#96050c',
  text: '#ffffff',
  sub: '#b3b3b3',
  green: '#46d369',
  card: '#1f1f1f',
};

/** One layout scale for phone / desktop / 1920 TV. */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const tv = width >= 1280 && width / height > 1.5 && isTvLike();
  const phone = width < 700;
  const cardW = phone ? 150 : tv ? 320 : 240;
  return {
    width,
    height,
    phone,
    tv,
    pad: phone ? 16 : tv ? 80 : 40,
    cardW,
    cardH: Math.round((cardW * 9) / 16),
    heroH: phone ? Math.round(width * 1.15) : Math.round(height * 0.62),
    font: (n: number) => Math.round(n * (phone ? 0.62 : tv ? 1 : 0.8)),
  };
}

export function isTvLike() {
  const ua = (globalThis as any).navigator?.userAgent ?? '';
  return /Web0S|webOS|SmartTV|Tizen|AFT|Android TV|Google TV|BRAVIA|Sony.*TV/i.test(ua) || (globalThis as any).location?.search?.includes('tv=1');
}
