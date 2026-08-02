import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { PillButton } from '../../components/common/PillButton';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { buildGamificationMessage } from '../../lib/gamificationAlert';
import { CoursePlanVocabularyTerm } from '../../types/database';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<ProgressStackParamList, 'VocabularyReview'>;

function extractErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function VocabularyReviewScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dueTerms, setDueTerms] = useState<CoursePlanVocabularyTerm[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!session) return;

    (async () => {
      const { data: plan } = await supabase
        .from('course_plans')
        .select('id')
        .eq('student_id', session.user.id)
        .eq('status', 'active')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plan) {
        setLoading(false);
        return;
      }

      const [vocabRes, progressRes] = await Promise.all([
        supabase.from('course_plan_vocabulary').select('*').eq('course_plan_id', plan.id),
        supabase.from('student_vocabulary_progress').select('vocabulary_id, next_review_at').eq('student_id', session.user.id),
      ]);

      const now = new Date();
      const dueOrNewIds = new Set(
        (progressRes.data ?? []).filter((p) => new Date(p.next_review_at) <= now).map((p) => p.vocabulary_id)
      );
      const reviewedIds = new Set((progressRes.data ?? []).map((p) => p.vocabulary_id));

      const due = (vocabRes.data ?? []).filter((term) => !reviewedIds.has(term.id) || dueOrNewIds.has(term.id));

      setDueTerms(due);
      setLoading(false);
    })();
  }, [session]);

  const currentTerm = dueTerms[currentIndex];

  const handleAnswer = async (correct: boolean) => {
    if (!currentTerm || submitting) return;
    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke('record-vocabulary-review', {
      body: { vocabularyId: currentTerm.id, correct },
    });

    setSubmitting(false);

    if (error) {
      Alert.alert('Error', extractErrorMessage(error, 'No se pudo guardar tu repaso.'));
      return;
    }

    setReviewedCount((c) => c + 1);
    if (correct) setCorrectCount((c) => c + 1);

    const gamificationMessage = buildGamificationMessage(data?.gamification ?? null, data?.newBadges ?? []);

    if (currentIndex + 1 >= dueTerms.length) {
      setFinished(true);
      if (gamificationMessage) setTimeout(() => Alert.alert('¡Repaso completado!', gamificationMessage), 300);
      return;
    }

    setCurrentIndex((i) => i + 1);
    setRevealed(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (dueTerms.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>No hay términos para repasar ahora</Text>
        <Text style={styles.emptyText}>Vuelve más tarde, tu vocabulario se repasa en intervalos espaciados.</Text>
        <Button label="Volver" variant="secondary" onPress={() => navigation.goBack()} style={styles.emptyButton} />
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>¡Repaso completado!</Text>
        <Text style={styles.emptyText}>
          Repasaste {reviewedCount} término(s), {correctCount} correcto(s).
        </Text>
        <PillButton label="Volver al vocabulario" onPress={() => navigation.goBack()} style={styles.emptyButton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          {currentIndex + 1} de {dueTerms.length}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.term}>{currentTerm.term}</Text>
          {revealed && (
            <>
              <Text style={styles.translation}>{currentTerm.translation}</Text>
              {currentTerm.example_sentence && <Text style={styles.example}>{currentTerm.example_sentence}</Text>}
            </>
          )}
        </View>

        {!revealed ? (
          <Button label="Mostrar respuesta" onPress={() => setRevealed(true)} style={styles.revealButton} />
        ) : (
          <View style={styles.answerRow}>
            <Button
              label="Necesito repasar"
              variant="secondary"
              onPress={() => handleAnswer(false)}
              loading={submitting}
              style={styles.answerButton}
            />
            <PillButton
              label="Lo sabía"
              onPress={() => handleAnswer(true)}
              loading={submitting}
              style={styles.answerButton}
            />
          </View>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  stepLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.xl,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...cardShadow,
  },
  term: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  translation: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  example: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  revealButton: {
    marginHorizontal: spacing.lg,
  },
  answerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  answerButton: {
    flex: 1,
  },
});
