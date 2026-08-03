import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AssessmentStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { OnboardingProgress } from '../../components/common/OnboardingProgress';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { ORAL_SENTENCES } from '../../data/oralAssessmentSentences';
import { computeOverallLevel, simulateSpeakingScore } from '../../features/assessment/engine';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<AssessmentStackParamList, 'OralAssessment'>;
type RecordingStatus = 'idle' | 'recording' | 'recorded';

export function OralAssessmentScreen({ route, navigation }: Props) {
  const { grammarScore, vocabularyScore, writtenLevelIndex } = route.params;
  const { session, studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';
  const sentences = ORAL_SENTENCES[language];

  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [submitting, setSubmitting] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const playReference = () => {
    Speech.stop();
    Speech.speak(sentences[sentenceIndex], { language: language === 'en' ? 'en-US' : 'es-ES' });
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso necesario', 'Activa el acceso al micrófono para grabar tu pronunciación.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setStatus('recording');
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la grabación.');
    }
  };

  const stopRecording = async () => {
    try {
      await recordingRef.current?.stopAndUnloadAsync();
      recordingRef.current = null;
      setStatus('recorded');
    } catch {
      Alert.alert('Error', 'No se pudo detener la grabación.');
    }
  };

  const handleContinue = async () => {
    if (sentenceIndex < sentences.length - 1) {
      setSentenceIndex(sentenceIndex + 1);
      setStatus('idle');
      return;
    }
    await finishAssessment();
  };

  const finishAssessment = async () => {
    if (!session) return;
    setSubmitting(true);

    // Puntaje de pronunciación simulado: el análisis real de audio (fonema por
    // fonema) todavía no está conectado, así que generamos un valor plausible
    // para poder cerrar el flujo y guardar un resultado real en la base de datos.
    const speakingScore = simulateSpeakingScore();
    const overallLevel = computeOverallLevel(writtenLevelIndex, speakingScore);

    const { data, error } = await supabase
      .from('level_assessments')
      .insert({
        student_id: session.user.id,
        language,
        overall_level: overallLevel,
        grammar_score: grammarScore,
        vocabulary_score: vocabularyScore,
        speaking_score: speakingScore,
        notes: 'Puntaje de pronunciación simulado; el análisis de audio real se conectará más adelante.',
      })
      .select()
      .single();

    setSubmitting(false);

    if (error || !data) {
      Alert.alert('Error', error?.message ?? 'No se pudo guardar el resultado.');
      return;
    }

    // Genera el plan de curso automáticamente con este resultado recién
    // guardado — mejor esfuerzo: si falla, igual mostramos el resultado
    // (el estudiante puede generarlo a mano después desde Progreso).
    try {
      await supabase.functions.invoke('generate-course-plan');
    } catch (planError) {
      console.error('auto course plan generation failed:', planError);
    }

    navigation.replace('Result', { assessment: data });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <OnboardingProgress step={sentenceIndex + 1} total={sentences.length} />
        <Text style={styles.stepLabel}>
          Frase {sentenceIndex + 1} de {sentences.length}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>Escucha la frase y repítela en voz alta.</Text>
        <View style={styles.sentenceCard}>
          <Text style={styles.sentence}>{sentences[sentenceIndex]}</Text>
        </View>

        <Button label="Escuchar frase" variant="secondary" onPress={playReference} style={styles.listenButton} />

        {status !== 'recording' ? (
          <Button
            label={status === 'recorded' ? 'Grabar de nuevo' : 'Grabar mi voz'}
            onPress={startRecording}
            style={styles.recordButton}
          />
        ) : (
          <Button label="Detener grabación" onPress={stopRecording} style={styles.recordButton} />
        )}

        {status === 'recorded' && <Text style={styles.recordedNote}>Grabación lista ✓</Text>}
      </View>

      <Button
        label={sentenceIndex === sentences.length - 1 ? 'Finalizar evaluación' : 'Siguiente frase'}
        onPress={handleContinue}
        disabled={status !== 'recorded'}
        loading={submitting}
        style={styles.continueButton}
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
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  instructions: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  sentenceCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...cardShadow,
  },
  sentence: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  listenButton: {
    marginBottom: spacing.md,
  },
  recordButton: {
    marginBottom: spacing.sm,
  },
  recordedNote: {
    color: colors.success,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  continueButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
});
