export const colors = {
  // Brand
  primary: '#F97316',
  primaryDark: '#EA580C',
  primarySoft: '#FFEDD5',

  // Surfaces
  bg: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',

  // Text
  text: '#111827',
  textSubtle: '#4B5563',
  textFaint: '#9CA3AF',

  // Borders
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  // Accents
  rose: '#F43F5E',
  roseDeep: '#E11D48',
  emerald: '#10B981',
  amber: '#F59E0B',
  blue: '#3B82F6',

  // States
  success: '#10B981',
  danger: '#DC2626',
  warning: '#F59E0B',

  black: '#000000',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export type ColorKey = keyof typeof colors;
