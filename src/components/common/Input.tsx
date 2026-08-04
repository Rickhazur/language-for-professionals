import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';

export function Input(props: TextInputProps) {
  const [revealed, setRevealed] = useState(false);
  const isPasswordField = props.secureTextEntry === true;

  if (!isPasswordField) {
    return (
      <TextInput
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        {...props}
        style={[styles.input, props.style]}
      />
    );
  }

  return (
    <View style={styles.passwordWrap}>
      <TextInput
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        {...props}
        secureTextEntry={!revealed}
        style={[styles.input, styles.passwordInput, props.style]}
      />
      <Pressable
        onPress={() => setRevealed((prev) => !prev)}
        style={styles.eyeButton}
        hitSlop={8}
      >
        <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#fff',
  },
  passwordWrap: {
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: spacing.xl + spacing.sm,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.xs,
  },
});
