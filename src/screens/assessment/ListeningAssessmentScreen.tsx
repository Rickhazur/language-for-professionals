import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AssessmentStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { playAudioUri } from '../../lib/audio';
import { ListeningItem, LISTENING_ITEMS } from '../../data/listeningAssessmentItems';
import { LEVELS } from '../../features/assessment/engine';
import { colors, spacing, vibrant, cardShadow } from '../../constants/theme';

function extractFunctionErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

type Props = NativeStackScreenProps<AssessmentStackParamList, 'Listening'>;

// Calibra la dificultad al nivel que ya sugirió la prueba escrita: toma
// ítems de ese nivel y de los vecinos inmediatos (±1), en vez de repetir la
// misma escalera adaptativa completa — la prueba de escucha es un
// complemento corto, no una segunda evaluación completa de 18 preguntas.
function pickListeningSet(items: ListeningItem[], writtenLevelIndex: number): ListeningItem[] {
  const nearby = items.filter((item) => Math.abs(LEVELS.indexOf(item.level) - writtenLevelIndex) <= 1);
  const pool = nearby.length >= 4 ? nearby : items;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

export function ListeningAssessmentScreen({ route, navigation }: Props) {
  const { grammarScore, vocabularyScore, writtenLevelIndex } = route.params;
  const { studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';

  const items = useMemo(
    () => pickListeningSet(LISTENING_ITEMS[language], writtenLevelIndex),
    [language, writtenLevelIndex]
  );

  const [index, setIndex] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const current = items[index];
  const questionNumber = index + 1;

  const playAudio = async () => {
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

  const handleNext = () => {
    if (selectedIndex === null) return;
    const correct = selectedIndex === current.answerIndex;
    const newCorrectCount = correct ? correctCount + 1 : correctCount;

    if (questionNumber >= items.length) {
      const listeningScore = Math.round((newCorrectCount / items.length) * 100);
      navigation.navigate('OralAssessment', { grammarScore, vocabularyScore, writtenLevelIndex, listeningScore });
      return;
    }

    setCorrectCount(newCorrectCount);
    setIndex(index + 1);
    setHasPlayed(false);
    setSelectedIndex(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          Escucha {questionNumber} de {items.length}
        </Text>
        <ProgressBar progress={questionNumber / items.length} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instructions}>Escucha el audio y responde la pregunta.</Text>

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
        label={questionNumber === items.length ? 'Terminar prueba de escucha' : 'Siguiente'}
        onPress={handleNext}
        disabled={selectedIndex === null}
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
    marginBottom: spacing.lg,
  },
});
