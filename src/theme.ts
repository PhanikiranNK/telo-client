// ─── TELO Design System Tokens ───────────────────────────────────────────────
// Notion minimalist + Trellix card-based fusion

export const Colors = {
  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F4F5F7',
  bgTertiary: '#EEF0F3',

  // Surfaces / Cards
  surface: '#FFFFFF',
  surfaceBorder: '#E2E8F0',

  // Accents
  indigo: '#4F46E5',
  indigoLight: '#EEF2FF',
  indigoDark: '#3730A3',
  emerald: '#22C55E',
  emeraldLight: '#DCFCE7',
  amber: '#F59E0B',
  red: '#EF4444',

  // Typography
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Charcoal
  charcoal: '#1A1A1A',

  // Shadows / Overlays
  overlay: 'rgba(0,0,0,0.45)',
  shimmer: 'rgba(255,255,255,0.08)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 26,
  xxl: 34,
  brand: 44,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
