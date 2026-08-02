import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, vibrant } from '../../constants/theme';

interface PillButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  icon?: string;
  loading?: boolean;
  /** 'gradient' = relleno de color sólido (CTA principal).
   *  'glass' = traslúcido, para usar sobre el fondo degradado. */
  variant?: 'gradient' | 'glass';
  style?: StyleProp<ViewStyle>;
}

export function PillButton({ label, icon, loading, variant = 'gradient', disabled, style, ...rest }: PillButtonProps) {
  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={variant === 'gradient' ? '#fff' : vibrant.textOnGradient} />
      ) : (
        <Text style={[styles.label, variant === 'glass' && styles.labelGlass]}>
          {icon ? `${icon}  ` : ''}
          {label}
        </Text>
      )}
    </>
  );

  if (variant === 'glass') {
    return (
      <Pressable style={[styles.pill, styles.glassPill, (disabled || loading) && styles.disabled, style]} disabled={disabled || loading} {...rest}>
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable disabled={disabled || loading} {...rest} style={style}>
      <LinearGradient
        colors={gradients.primaryButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.pill, (disabled || loading) && styles.disabled]}
      >
        {content}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  glassPill: {
    backgroundColor: vibrant.glassBackground,
    borderWidth: 1,
    borderColor: vibrant.glassBorder,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  labelGlass: {
    color: vibrant.textOnGradient,
  },
});
