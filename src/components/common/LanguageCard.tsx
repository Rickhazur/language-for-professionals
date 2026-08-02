import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, vibrant, cardShadow } from '../../constants/theme';

interface LanguageCardProps {
  // Código corto (ej. "EN", "ES") mostrado en la insignia — no un emoji de
  // bandera, que no renderiza de forma confiable en todas las plataformas.
  flag: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function LanguageCard({ flag, label, selected, onPress }: LanguageCardProps) {
  return (
    <Pressable style={[styles.card, selected && styles.cardSelected]} onPress={onPress}>
      <View style={[styles.badge, selected && styles.badgeSelected]}>
        <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>{flag}</Text>
      </View>
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
  badge: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  badgeSelected: {
    backgroundColor: vibrant.purple,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  badgeTextSelected: {
    color: '#fff',
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
