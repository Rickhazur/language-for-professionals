import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../constants/theme';

interface GradientBackgroundProps {
  children: ReactNode;
}

// Fondo degradado con "blobs" translúcidos, imitando el fondo abstracto de
// las pantallas de referencia sin necesitar ninguna imagen/asset — son solo
// círculos grandes, desenfocados por opacidad baja y superpuestos.
export function GradientBackground({ children }: GradientBackgroundProps) {
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.fill}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTopRight]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottomLeft]} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  blobTopRight: {
    width: 260,
    height: 260,
    top: -80,
    right: -60,
  },
  blobBottomLeft: {
    width: 220,
    height: 220,
    bottom: -60,
    left: -70,
    backgroundColor: 'rgba(236,72,153,0.18)',
  },
});
