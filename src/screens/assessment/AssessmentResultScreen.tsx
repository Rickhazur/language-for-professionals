import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AssessmentStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { colors, spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<AssessmentStackParamList, 'Result'>;

const SKILL_ROWS: { key: 'grammar_score' | 'vocabulary_score' | 'speaking_score'; label: string }[] = [
  { key: 'grammar_score', label: 'Gramática' },
  { key: 'vocabulary_score', label: 'Vocabulario' },
  { key: 'speaking_score', label: 'Pronunciación (simulado)' },
];

export function AssessmentResultScreen({ route, navigation }: Props) {
  const { assessment } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Tu nivel estimado es</Text>
        <Text style={styles.level}>{assessment.overall_level}</Text>

        <View style={styles.breakdown}>
          {SKILL_ROWS.map(({ key, label }) => {
            const value = assessment[key];
            return (
              <View key={key} style={styles.row}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{value !== null ? `${value}%` : '—'}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.disclaimer}>
          El puntaje de pronunciación es simulado por ahora. Pronto lo calcularemos a partir del
          análisis real de tu grabación.
        </Text>
      </View>

      <Button label="Ir a mi progreso" onPress={() => navigation.getParent()?.goBack()} style={styles.button} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  label: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  level: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xl,
  },
  breakdown: {
    width: '100%',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  rowLabel: {
    fontSize: 16,
    color: colors.text,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  disclaimer: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  button: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
});
