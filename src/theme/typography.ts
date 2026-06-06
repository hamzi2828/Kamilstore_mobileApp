import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700', color: colors.text },
  h4: { fontSize: 16, fontWeight: '600', color: colors.text },
  body: { fontSize: 14, fontWeight: '400', color: colors.text },
  bodyStrong: { fontSize: 14, fontWeight: '600', color: colors.text },
  small: { fontSize: 12, fontWeight: '400', color: colors.textSubtle },
  smallStrong: { fontSize: 12, fontWeight: '600', color: colors.text },
  faint: { fontSize: 11, fontWeight: '500', color: colors.textFaint, letterSpacing: 0.5 },
};
