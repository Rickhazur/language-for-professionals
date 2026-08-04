import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LinkedSentence } from '../../components/common/LinkedSentence';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { GuidedTaskStepResult } from '../../types/database';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'GuidedTask'>;

function extractErrorMessage(error: unknown, fallback: string): Promise<string> {
  return (async () => {
    let message = error instanceof Error ? error.message : fallback;
    try {
      const body = await (error as { context?: Response })?.context?.json();
      if (body?.error) message = body.error;
    } catch {
      // se queda con message
    }
    return message;
  })();
}

export function GuidedTaskScreen({ route, navigation }: Props) {
  const { roleplayId, title } = route.params;
  const { studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';

  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [instruction, setInstruction] = useState('');
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<GuidedTaskStepResult | null>(null);
  const [stepResults, setStepResults] = useState<GuidedTaskStepResult[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke('guided-task-chat', {
        body: { action: 'start', roleplayId },
      });

      if (error || !data?.attempt) {
        const message = await extractErrorMessage(error, 'No se pudo iniciar la tarea.');
        Alert.alert('Error', message);
        navigation.goBack();
        return;
      }

      setAttemptId(data.attempt.id);
      setContext(data.task?.context ?? '');
      setTotalSteps(data.attempt.total_steps ?? 0);
      setStepIndex(data.attempt.current_step ?? 0);
      setInstruction(data.instruction ?? '');
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleplayId]);

  const handleSubmit = async () => {
    if (!response.trim() || !attemptId) return;
    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke('guided-task-chat', {
      body: { action: 'respond', attemptId, response: response.trim() },
    });

    setSubmitting(false);

    if (error || !data?.stepResult) {
      const message = await extractErrorMessage(error, 'No se pudo evaluar tu respuesta.');
      Alert.alert('Error', message);
      return;
    }

    const updatedResults = [...stepResults, data.stepResult as GuidedTaskStepResult];
    setStepResults(updatedResults);
    setLastResult(data.stepResult);

    if (data.finished) {
      navigation.replace('GuidedTaskFeedback', {
        title,
        score: data.attempt?.score ?? updatedResults.filter((r) => r.correct).length,
        totalSteps,
        stepResults: updatedResults,
        gamification: data.gamification ?? null,
        newBadges: data.newBadges ?? [],
      });
      return;
    }

    setInstruction(data.instruction ?? '');
  };

  const handleContinue = () => {
    setStepIndex((i) => i + 1);
    setResponse('');
    setLastResult(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.stepLabel}>
            Paso {stepIndex + 1} de {totalSteps}
          </Text>
          <ProgressBar progress={(stepIndex + 1) / Math.max(totalSteps, 1)} />
        </View>

        <View style={styles.content}>
          {context !== '' && stepIndex === 0 && !lastResult && <Text style={styles.context}>{context}</Text>}

          <View style={styles.instructionCard}>
            <Text style={styles.instructionLabel}>Instrucción</Text>
            <LinkedSentence text={instruction} language={language} style={styles.instructionText} />
            {language === 'en' && (
              <Text style={styles.linkingHint}>
                💡 ‿ azul conecta con vocal · ‿ ámbar + letra tachada = consonante final casi muda
              </Text>
            )}
          </View>

          {!lastResult ? (
            <>
              <Input
                placeholder="Escribe tu respuesta…"
                value={response}
                onChangeText={setResponse}
                multiline
                style={styles.input}
              />
              <Button
                label="Enviar"
                onPress={handleSubmit}
                disabled={!response.trim()}
                loading={submitting}
                style={styles.sendButton}
              />
            </>
          ) : (
            <View style={styles.resultCard}>
              <View style={styles.resultHeaderRow}>
                <Ionicons
                  name={lastResult.correct ? 'checkmark-circle' : 'close-circle'}
                  size={22}
                  color={lastResult.correct ? colors.success : colors.error}
                />
                <Text style={[styles.resultHeaderText, { color: lastResult.correct ? colors.success : colors.error }]}>
                  {lastResult.correct ? 'Correcto' : 'Necesita ajuste'}
                </Text>
              </View>
              <Text style={styles.resultFeedback}>{lastResult.feedback}</Text>
              <Button label="Siguiente paso" onPress={handleContinue} style={styles.continueButton} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  context: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  instructionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  instructionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  instructionText: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
  },
  linkingHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  sendButton: {
    marginBottom: 110,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    ...cardShadow,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  resultHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultFeedback: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  continueButton: {
    marginBottom: 110,
  },
});
