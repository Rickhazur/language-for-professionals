import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AssessmentStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { AssessmentQuestion, AssessmentSkill, QUESTION_BANK } from '../../data/levelAssessmentQuestions';
import {
  AnsweredQuestion,
  START_LEVEL_INDEX,
  TOTAL_WRITTEN_QUESTIONS,
  StaircaseState,
  advanceStaircase,
  finalLevelFromReversals,
  initialStaircaseState,
  pickQuestion,
  summarizeWritten,
} from '../../features/assessment/engine';
import { colors, spacing, vibrant, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<AssessmentStackParamList, 'WrittenTest'>;

export function WrittenTestScreen({ navigation }: Props) {
  const { studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';
  const bank = useMemo(() => QUESTION_BANK[language], [language]);

  const [staircase, setStaircase] = useState<StaircaseState>(initialStaircaseState);
  const [reversalLevels, setReversalLevels] = useState<number[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<AnsweredQuestion[]>([]);
  const [currentSkill, setCurrentSkill] = useState<AssessmentSkill>('grammar');
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion>(() =>
    pickQuestion(bank, START_LEVEL_INDEX, 'grammar', new Set())
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const questionNumber = history.length + 1;

  const handleNext = () => {
    if (selectedIndex === null) return;

    const correct = selectedIndex === currentQuestion.answerIndex;
    const newHistory = [...history, { question: currentQuestion, selectedIndex, correct }];
    const newUsedIds = new Set(usedIds).add(currentQuestion.id);
    const { next: newStaircase, reversalLevelIndex } = advanceStaircase(staircase, correct);
    const newReversalLevels = reversalLevelIndex !== null ? [...reversalLevels, reversalLevelIndex] : reversalLevels;

    if (newHistory.length >= TOTAL_WRITTEN_QUESTIONS) {
      const finalLevelIndex = finalLevelFromReversals(newReversalLevels, newStaircase.levelIndex);
      navigation.navigate('Listening', summarizeWritten(newHistory, finalLevelIndex));
      return;
    }

    const nextSkill: AssessmentSkill = currentSkill === 'grammar' ? 'vocabulary' : 'grammar';
    const nextQuestion = pickQuestion(bank, newStaircase.levelIndex, nextSkill, newUsedIds);

    setHistory(newHistory);
    setUsedIds(newUsedIds);
    setStaircase(newStaircase);
    setReversalLevels(newReversalLevels);
    setCurrentSkill(nextSkill);
    setCurrentQuestion(nextQuestion);
    setSelectedIndex(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          Pregunta {questionNumber} de {TOTAL_WRITTEN_QUESTIONS}
        </Text>
        <ProgressBar progress={questionNumber / TOTAL_WRITTEN_QUESTIONS} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.skillTag}>{currentQuestion.skill === 'grammar' ? 'Gramática' : 'Vocabulario'}</Text>
        <Text style={styles.prompt}>{currentQuestion.prompt}</Text>

        {currentQuestion.options.map((option, index) => (
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
        label={questionNumber === TOTAL_WRITTEN_QUESTIONS ? 'Terminar prueba escrita' : 'Siguiente'}
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
  skillTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    color: vibrant.purple,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
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
