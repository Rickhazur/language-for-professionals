import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { GamificationModal } from '../../components/common/GamificationModal';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'GuidedTaskFeedback'>;

export function GuidedTaskFeedbackScreen({ route, navigation }: Props) {
  const { title, score, totalSteps, stepResults, gamification, newBadges } = route.params;
  const [showGamification, setShowGamification] = useState(!!gamification);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Resultado de la tarea</Text>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreValue}>
            {score}/{totalSteps}
          </Text>
          <Text style={styles.scoreLabel}>pasos correctos</Text>
        </View>

        <Text style={styles.sectionTitle}>Paso a paso</Text>
        {stepResults.map((r, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <Ionicons
                name={r.correct ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={r.correct ? colors.success : colors.error}
              />
              <Text style={styles.stepInstruction}>{r.instruction}</Text>
            </View>
            <Text style={styles.stepResponse}>Tu respuesta: "{r.response}"</Text>
            <Text style={styles.stepFeedback}>{r.feedback}</Text>
          </View>
        ))}
      </ScrollView>

      <Button
        label="Volver al menú de práctica"
        onPress={() => navigation.navigate('PracticeMenu')}
        style={styles.button}
      />

      <GamificationModal
        visible={showGamification}
        gamification={gamification ?? null}
        newBadges={newBadges ?? []}
        onDismiss={() => setShowGamification(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  scoreLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  stepInstruction: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  stepResponse: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  stepFeedback: {
    fontSize: 13,
    color: colors.text,
  },
  button: {
    marginHorizontal: spacing.lg,
    marginBottom: 110,
  },
});
