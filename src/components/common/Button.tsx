import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing } from '../../constants/theme';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, loading, variant = 'primary', disabled, style, ...rest }: ButtonProps) {
  const content = loading ? (
    <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#fff'} />
  ) : (
    <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
  );

  if (variant === 'secondary') {
    return (
      <Pressable
        style={[styles.base, styles.secondary, (disabled || loading) && styles.disabled, style]}
        disabled={disabled || loading}
        {...rest}
      >
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
        style={[styles.base, (disabled || loading) && styles.disabled]}
      >
        {content}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryLabel: {
    color: colors.primary,
  },
});
