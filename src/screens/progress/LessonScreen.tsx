import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { supabase } from '../../config/supabase';
import { CoursePlanItemStatus } from '../../types/database';
import { colors, spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<ProgressStackParamList, 'Lesson'>;

const SKILL_LABELS: Record<string, string> = {
  listening: 'Listening',
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
  vocabulary: 'Vocabulario',
  grammar: 'Gramática',
};

const STATUS_LABELS: Record<CoursePlanItemStatus, string> = {
  not_started: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completado',
};

export function LessonScreen({ route, navigation }: Props) {
  const { item, moduleNumber, totalModules } = route.params;
  const [status, setStatus] = useState<CoursePlanItemStatus>(item.status);
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (nextStatus: CoursePlanItemStatus) => {
    setUpdating(true);
    const { error } = await supabase.from('course_plan_items').update({ status: nextStatus }).eq('id', item.id);
    setUpdating(false);

    if (error) {
      Alert.alert('Error', 'No se pudo actualizar el progreso.');
      return;
    }
    setStatus(nextStatus);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          Módulo {moduleNumber} de {totalModules}
        </Text>
        <Button label="Volver" variant="secondary" onPress={() => navigation.goBack()} style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.skillTag}>{SKILL_LABELS[item.skill_focus ?? ''] ?? item.skill_focus}</Text>
        <Text style={styles.title}>{item.title}</Text>

        <View style={[styles.statusBadge, styles[`status_${status}`]]}>
          <Text style={styles.statusText}>{STATUS_LABELS[status]}</Text>
        </View>

        {item.description && <Text style={styles.description}>{item.description}</Text>}
        {item.estimated_minutes && <Text style={styles.meta}>Duración estimada: {item.estimated_minutes} min</Text>}

        <Text style={styles.placeholderNote}>
          El contenido interactivo de esta lección (ejercicios, audio, práctica guiada) se
          agregará más adelante. Por ahora puedes usar este módulo para llevar el registro de tu
          avance.
        </Text>
      </View>

      <View style={styles.actions}>
        {status === 'not_started' && (
          <Button label="Comenzar módulo" onPress={() => updateStatus('in_progress')} loading={updating} />
        )}
        {status === 'in_progress' && (
          <Button label="Marcar como completado" onPress={() => updateStatus('completed')} loading={updating} />
        )}
        {status === 'completed' && (
          <Button
            label="Reiniciar módulo"
            variant="secondary"
            onPress={() => updateStatus('not_started')}
            loading={updating}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  stepLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  backButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  skillTag: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 14,
    marginBottom: spacing.lg,
  },
  status_not_started: {
    backgroundColor: colors.surface,
  },
  status_in_progress: {
    backgroundColor: '#FEF3C7',
  },
  status_completed: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  placeholderNote: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
  actions: {
    padding: spacing.lg,
  },
});
