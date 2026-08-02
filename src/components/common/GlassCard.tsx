import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Tarjeta blanca sólida con esquinas redondeadas y sombra suave. (Antes usaba
// BlurView para un efecto "vidrio esmerilado" traslúcido, pero en web no
// recortaba las esquinas correctamente sobre el fondo degradado — quedaba
// una mancha deforme. Una tarjeta casi opaca es más confiable entre
// plataformas y se ve igual de bien.)
export function GlassCard({ children, style }: GlassCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#3B0764',
        shadowOpacity: 0.25,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 6 },
      default: {
        boxShadow: '0 12px 24px rgba(59, 7, 100, 0.25)',
      },
    }),
  },
});
