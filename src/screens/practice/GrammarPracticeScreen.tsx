import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { GamificationModal } from '../../components/common/GamificationModal';
import { GamificationUpdate, StudentBadge } from '../../types/database';
import { AssessmentQuestion, QUESTION_BANK } from '../../data/levelAssessmentQuestions';
import { LEVELS } from '../../features/assessment/engine';
import { colors, spacing, vibrant, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'GrammarPractice'>;

const QUESTIONS_PER_SESSION = 10;

// Mismo criterio que la prueba de listening: preguntas del nivel actual del
// estudiante y de los vecinos inmediatos (±1), no toda la escalera CEFR —
// esto es práctica diaria, no una re-evaluación de nivel.
function pickGrammarSet(all: AssessmentQuestion[], levelIndex: number): AssessmentQuestion[] {
  const grammarOnly = all.filter((q) => q.skill === 'grammar');
  const nearby = grammarOnly.filter((q) => Math.abs(LEVELS.indexOf(q.level) - levelIndex) <= 1);
  const pool = nearby.length >= 4 ? nearby : grammarOnly;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUESTIONS_PER_SESSION);
}

export function GrammarPracticeScreen({ navigation }: Props) {
  const { session, studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AssessmentQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [gamificationResult, setGamificationResult] = useState<GamificationUpdate | null>(null);
  const [newBadges, setNewBadges] = useState<StudentBadge[]>([]);

  const sessionStartRef = useRef(new Date());
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session) return;

    (async () => {
      const { data: assessment } = await supabase
        .from('level_assessments')
        .select('overall_level')
        .eq('student_id', session.user.id)
        .eq('language', language)
        .order('taken_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const levelIndex = assessment ? LEVELS.indexOf(assessment.overall_level) : 1;
      setItems(pickGrammarSet(QUESTION_BANK[language], levelIndex));
      setLoading(false);

      const { data: sessionRow } = await supabase
        .from('practice_sessions')
        .insert({ student_id: session.user.id, language, session_type: 'self_practice' })
        .select('id')
        .single();
      sessionIdRef.current = sessionRow?.id ?? null;
    })();
  }, [session, language]);

  const current = items[index];
  const questionNumber = index + 1;
  const isLast = questionNumber === items.length;

  const finishSession = async (finalCorrectCount: number) => {
    if (!session) return;
    setSubmitting(true);

    const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStartRef.current.getTime()) / 60000));

    if (sessionIdRef.current) {
      const { data, error } = await supabase.functions.invoke('finalize-practice-session', {
        body: {
          sessionId: sessionIdRef.current,
          durationMinutes,
          notes: `Gramática: ${finalCorrectCount}/${items.length} correctas.`,
        },
      });

      if (error) {
        Alert.alert('Error', 'No se pudo guardar la sesión, pero tu práctica quedó completa.');
        setSubmitting(false);
        navigation.goBack();
        return;
      }

      if (data?.gamification) {
        setNewBadges(data?.newBadges ?? []);
        setGamificationResult(data.gamification);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    navigation.goBack();
  };

  const handleNext = () => {
    if (selectedIndex === null || !current) return;
    const correct = selectedIndex === current.answerIndex;
    const newCorrectCount = correct ? correctCount + 1 : correctCount;

    if (isLast) {
      finishSession(newCorrectCount);
      return;
    }

    setCorrectCount(newCorrectCount);
    setIndex(index + 1);
    setSelectedIndex(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>Todavía no hay preguntas de gramática</Text>
        <Text style={styles.emptyText}>Completa tu evaluación de nivel para desbloquear esta práctica.</Text>
        <Button label="Volver" variant="secondary" onPress={() => navigation.goBack()} style={styles.emptyButton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          Pregunta {questionNumber} de {items.length}
        </Text>
        <ProgressBar progress={questionNumber / items.length} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.prompt}>{current.prompt}</Text>
        {current.options.map((option, optIndex) => (
          <Pressable
            key={optIndex}
            style={[styles.option, selectedIndex === optIndex && styles.optionSelected]}
            onPress={() => setSelectedIndex(optIndex)}
          >
            <Text style={[styles.optionText, selectedIndex === optIndex && styles.optionTextSelected]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Button
        label={isLast ? 'Terminar sesión de gramática' : 'Siguiente'}
        onPress={handleNext}
        disabled={selectedIndex === null}
        loading={submitting}
        style={styles.nextButton}
      />

      <GamificationModal
        visible={!!gamificationResult}
        gamification={gamificationResult}
        newBadges={newBadges}
        onDismiss={() => {
          setGamificationResult(null);
          navigation.goBack();
        }}
      />
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
    minWidth: 160,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  stepLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  content: {
    padding: spacing.lg,
  },
  prompt: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  option: {
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#fff',
    ...cardShadow,
  },
  optionSelected: {
    borderColor: vibrant.purple,
    backgroundColor: '#F5F3FF',
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
  optionTextSelected: {
    color: vibrant.purple,
    fontWeight: '700',
  },
  nextButton: {
    marginHorizontal: spacing.lg,
    marginBottom: 110,
  },
});
