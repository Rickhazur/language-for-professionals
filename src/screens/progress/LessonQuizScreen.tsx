import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { PillButton } from '../../components/common/PillButton';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { playAudioUri } from '../../lib/audio';
import { buildGamificationMessage } from '../../lib/gamificationAlert';
import { LessonQuizContent } from '../../types/database';
import { colors, spacing, vibrant, gradients, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<ProgressStackParamList, 'LessonQuiz'>;

function extractErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function LessonQuizScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const { studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<LessonQuizContent | null>(null);
  const [phase, setPhase] = useState<'intro' | 'questions' | 'result'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke('get-lesson-content', {
        body: { coursePlanItemId: item.id },
      });
      setLoading(false);

      if (error || !data?.content) {
        Alert.alert('No se pudo cargar la lección', extractErrorMessage(error, 'Intenta de nuevo.'));
        navigation.goBack();
        return;
      }

      const quizContent = data.content as LessonQuizContent;
      setContent(quizContent);
      setPhase(quizContent.intro ? 'intro' : 'questions');
    })();
  }, [item.id]);

  const playIntroAudio = async () => {
    if (!content?.intro) return;
    setLoadingAudio(true);
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text: content.intro, language },
    });
    setLoadingAudio(false);

    if (error || !data?.audioUrl) {
      Alert.alert('No se pudo generar el audio', extractErrorMessage(error, 'Intenta de nuevo.'));
      return;
    }
    playAudioUri(data.audioUrl).catch(() => {
      Alert.alert('Error', 'No se pudo reproducir el audio.');
    });
  };

  const finishQuiz = async (finalCorrectCount: number) => {
    if (!content) return;
    setSubmitting(true);
    const scorePercent = Math.round((finalCorrectCount / content.questions.length) * 100);

    const { data, error } = await supabase.functions.invoke('finalize-lesson-attempt', {
      body: { coursePlanItemId: item.id, score: scorePercent, responses: { correctCount: finalCorrectCount } },
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', extractErrorMessage(error, 'No se pudo guardar tu resultado.'));
      return;
    }

    setPhase('result');
    const gamificationMessage = buildGamificationMessage(data?.gamification ?? null, data?.newBadges ?? []);
    if (gamificationMessage) setTimeout(() => Alert.alert('¡Lección completada!', gamificationMessage), 300);
  };

  const handleNext = () => {
    if (!content || selectedIndex === null) return;
    const question = content.questions[currentIndex];
    const correct = selectedIndex === question.answerIndex;
    const newCorrectCount = correctCount + (correct ? 1 : 0);

    if (currentIndex + 1 >= content.questions.length) {
      setCorrectCount(newCorrectCount);
      finishQuiz(newCorrectCount);
      return;
    }

    setCorrectCount(newCorrectCount);
    setCurrentIndex((i) => i + 1);
    setSelectedIndex(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!content) return null;

  if (phase === 'intro' && content.intro) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.introContent}>
          <Text style={styles.introTitle}>{item.title}</Text>
          <View style={styles.introCard}>
            <Text style={styles.introText}>{content.intro}</Text>
          </View>
          {item.skill_focus === 'listening' && (
            <Button
              label="🔊 Reproducir audio"
              variant="secondary"
              onPress={playIntroAudio}
              loading={loadingAudio}
              style={styles.audioButton}
            />
          )}
        </ScrollView>
        <PillButton
          label="Continuar a las preguntas"
          onPress={() => setPhase('questions')}
          style={styles.continueButton}
        />
      </SafeAreaView>
    );
  }

  if (phase === 'result') {
    const scorePercent = Math.round((correctCount / content.questions.length) * 100);
    return (
      <SafeAreaView style={styles.centered}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resultCircle}>
          <Text style={styles.resultScore}>{scorePercent}%</Text>
        </LinearGradient>
        <Text style={styles.resultText}>
          {correctCount} de {content.questions.length} correctas
        </Text>
        <PillButton label="Volver al módulo" onPress={() => navigation.goBack()} style={styles.resultButton} />
      </SafeAreaView>
    );
  }

  const question = content.questions[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          Pregunta {currentIndex + 1} de {content.questions.length}
        </Text>
        <ProgressBar progress={(currentIndex + 1) / content.questions.length} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.prompt}>{question.prompt}</Text>

        {question.options.map((option, index) => (
          <Pressable
            key={index}
            style={[styles.option, selectedIndex === index && styles.optionSelected]}
            onPress={() => setSelectedIndex(index)}
          >
            <Text style={[styles.optionText, selectedIndex === index && styles.optionTextSelected]}>{option}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Button
        label={currentIndex + 1 === content.questions.length ? 'Terminar lección' : 'Siguiente'}
        onPress={handleNext}
        disabled={selectedIndex === null}
        loading={submitting}
        style={styles.nextButton}
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
    marginBottom: spacing.lg,
  },
  introContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    ...cardShadow,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  audioButton: {
    marginTop: spacing.lg,
  },
  continueButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  resultCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  resultScore: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  resultText: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  resultButton: {
    minWidth: 220,
  },
});
