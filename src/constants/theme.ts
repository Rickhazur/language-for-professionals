import { Platform } from 'react-native';

export const colors = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  background: '#F8F7FD',
  surface: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  error: '#DC2626',
  success: '#16A34A',
};

// Sombra suave y consistente para tarjetas blancas sobre el fondo claro —
// mismo tono/opacidad que GlassCard y las tarjetas de WelcomeScreen.
export const cardShadow = Platform.select({
  ios: {
    shadowColor: '#3B0764',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 3 },
  default: { boxShadow: '0 4px 12px rgba(59, 7, 100, 0.08)' },
}) as object;

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
