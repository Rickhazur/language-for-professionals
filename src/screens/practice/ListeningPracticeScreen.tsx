import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { playAudioUri } from '../../lib/audio';
import { GamificationModal } from '../../components/common/GamificationModal';
import { GamificationUpdate, StudentBadge } from '../../types/database';
import { ListeningItem, LISTENING_ITEMS } from '../../data/listeningAssessmentItems';
import { LEVELS } from '../../features/assessment/engine';
import { colors, spacing, vibrant, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'ListeningPractice'>;

const ITEMS_PER_SESSION = 8;

function extractFunctionErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

// Mismo criterio de calibración que la prueba de listening de la evaluación
// inicial (±1 nivel), pero con más ítems por ser práctica repetible, no una
// evaluación puntual.
function pickListeningSet(items: ListeningItem[], levelIndex: number): ListeningItem[] {
  const nearby = items.filter((item) => Math.abs(LEVELS.indexOf(item.level) - levelIndex) <= 1);
  const pool = nearby.length >= 4 ? nearby : items;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, ITEMS_PER_SESSION);
}

export function ListeningPracticeScreen({ navigation }: Props) {
  const { session, studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ListeningItem[]>([]);
  const [index, setIndex] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
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
      setItems(pickListeningSet(LISTENING_ITEMS[language], levelIndex));
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

  const playAudio = async () => {
    if (!current) return;
    setLoadingAudio(true);
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text: current.script, language },
    });
    setLoadingAudio(false);

    if (error || !data?.audioUrl) {
      Alert.alert('No se pudo generar el audio', extractFunctionErrorMessage(error));
      return;
    }

    setHasPlayed(true);
    playAudioUri(data.audioUrl).catch(() => {
      Alert.alert('Error', 'No se pudo reproducir el audio.');
    });
  };

  const finishSession = async (finalCorrectCount: number) => {
    if (!session) return;
    setSubmitting(true);

    const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStartRef.current.getTime()) / 60000));

    if (sessionIdRef.current) {
      const { data, error } = await supabase.functions.invoke('finalize-practice-session', {
        body: {
          sessionId: sessionIdRef.current,
          durationMinutes,
          notes: `Listening: ${finalCorrectCount}/${items.length} correctas.`,
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
    setHasPlayed(false);
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
        <Text style={styles.emptyTitle}>Todavía no hay ejercicios de listening</Text>
        <Text style={styles.emptyText}>Completa tu evaluación de nivel para desbloquear esta práctica.</Text>
        <Button label="Volver" variant="secondary" onPress={() => navigation.goBack()} style={styles.emptyButton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          Escucha {questionNumber} de {items.length}
        </Text>
        <ProgressBar progress={questionNumber / items.length} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instructions}>Escucha el audio y responde la pregunta, sin traducir.</Text>

        <Pressable style={styles.playCard} onPress={playAudio} disabled={loadingAudio}>
          <View style={styles.playIconWrap}>
            <Ionicons name={hasPlayed ? 'volume-high' : 'play'} size={28} color={vibrant.purple} />
          </View>
          <Text style={styles.playLabel}>
            {loadingAudio ? 'Cargando audio…' : hasPlayed ? 'Volver a escuchar' : 'Toca para escuchar'}
          </Text>
        </Pressable>

        {hasPlayed && (
          <>
            <Text style={styles.prompt}>{current.question}</Text>
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
          </>
        )}
      </ScrollView>

      <Button
        label={isLast ? 'Terminar sesión de listening' : 'Siguiente'}
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
  instructions: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  playCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  playIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  playLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: vibrant.purple,
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
