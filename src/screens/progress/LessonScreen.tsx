import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { supabase } from '../../config/supabase';
import { CoursePlanItemStatus, Skill } from '../../types/database';
import { colors, spacing, vibrant } from '../../constants/theme';

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

const START_LABELS: Record<CoursePlanItemStatus, string> = {
  not_started: 'Comenzar módulo',
  in_progress: 'Continuar módulo',
  completed: 'Repasar módulo',
};

export function LessonScreen({ route, navigation }: Props) {
  const { item, moduleNumber, totalModules } = route.params;
  const [status, setStatus] = useState<CoursePlanItemStatus>(item.status);
  const [updating, setUpdating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('course_plan_items')
        .select('status')
        .eq('id', item.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setStatus(data.status);
        });
    }, [item.id])
  );

  const launchExercise = async () => {
    if (status === 'not_started') {
      setUpdating(true);
      await supabase.from('course_plan_items').update({ status: 'in_progress' }).eq('id', item.id);
      setUpdating(false);
      setStatus('in_progress');
    }

    const skill: Skill | null = item.skill_focus;
    if (skill === 'speaking') {
      navigation.navigate('LessonSpeaking', { item });
    } else if (skill === 'writing') {
      navigation.navigate('LessonWriting', { item });
    } else if (skill === 'vocabulary') {
      navigation.navigate('LessonVocabulary', { item });
    } else {
      // grammar | reading | listening
      navigation.navigate('LessonQuiz', { item });
    }
  };

  const resetModule = async () => {
    setUpdating(true);
    const { error } = await supabase.from('course_plan_items').update({ status: 'not_started' }).eq('id', item.id);
    setUpdating(false);
    if (error) {
      Alert.alert('Error', 'No se pudo reiniciar el módulo.');
      return;
    }
    setStatus('not_started');
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
      </View>

      <View style={styles.actions}>
        <Button label={START_LABELS[status]} onPress={launchExercise} loading={updating} />
        {status === 'completed' && (
          <Button
            label="Reiniciar módulo"
            variant="secondary"
            onPress={resetModule}
            loading={updating}
            style={styles.resetButton}
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
    color: vibrant.purple,
    backgroundColor: '#EDE9FE',
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
    backgroundColor: '#F3F4F6',
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
  actions: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: spacing.sm,
  },
  resetButton: {
    marginTop: 0,
  },
});
