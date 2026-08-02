export const colors = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  error: '#DC2626',
  success: '#16A34A',
};

// Paleta "vibrante" — gradientes/glass usados en las pantallas rediseñadas
// (Login, Inicio, tab bar). El resto de la app sigue usando `colors` arriba.
export const gradients = {
  hero: ['#6D28D9', '#4F46E5', '#EC4899'] as const,
  primaryButton: ['#7C3AED', '#4F46E5'] as const,
  accentButton: ['#F472B6', '#EC4899'] as const,
  card: ['#FFFFFF', '#F5F3FF'] as const,
};

export const vibrant = {
  purple: '#7C3AED',
  indigo: '#4F46E5',
  pink: '#EC4899',
  textOnGradient: '#FFFFFF',
  textOnGradientMuted: 'rgba(255,255,255,0.75)',
  glassBackground: 'rgba(255,255,255,0.14)',
  glassBorder: 'rgba(255,255,255,0.28)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
