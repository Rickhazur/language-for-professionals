import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing } from '../../constants/theme';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, loading, variant = 'primary', disabled, style, ...rest }: ButtonProps) {
  return (
    <Pressable
      style={[
        styles.base,
        variant === 'secondary' && styles.secondary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryLabel: {
    color: colors.primary,
  },
});
