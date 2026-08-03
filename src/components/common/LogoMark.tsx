import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface Props {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

// Marca de LinguaPro: silueta de un profesional hablando (corbata + ondas de
// sonido), pensada para funcionar tanto como ícono de app como dentro de la
// interfaz — reemplaza el emoji 🎓 usado antes en las pantallas de acceso.
export function LogoMark({ size = 28, style }: Props) {
  return (
    <Image
      source={require('../../../assets/brand/logo-mark.png')}
      style={[{ width: size, height: size, borderRadius: size / 4 }, style]}
      resizeMode="contain"
    />
  );
}
