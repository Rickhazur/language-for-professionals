import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing, vibrant, cardShadow } from '../../constants/theme';

interface LanguageCardProps {
  flag: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function LanguageCard({ flag, label, selected, onPress }: LanguageCardProps) {
  return (
    <Pressable style={[styles.card, selected && styles.cardSelected]} onPress={onPress}>
      <Text style={styles.flag}>{flag}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
    ...cardShadow,
  },
  cardSelected: {
    borderColor: vibrant.purple,
    backgroundColor: '#F5F3FF',
  },
  flag: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  labelSelected: {
    color: vibrant.purple,
  },
});
