import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { playAudioUri } from '../../lib/audio';
import { blobToBase64, getRecordingContentType } from '../../lib/pronunciationRecording';
import { PronunciationRecorder } from '../../lib/pronunciationRecorder';
import { buildGamificationMessage } from '../../lib/gamificationAlert';
import { LessonSpeakingContent } from '../../types/database';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<ProgressStackParamList, 'LessonSpeaking'>;
type RecordingStatus = 'idle' | 'recording' | 'recorded';

function extractErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function LessonSpeakingScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const { studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';

  const [loading, setLoading] = useState(true);
  const [sentences, setSentences] = useState<LessonSpeakingContent['sentences']>([]);
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingReference, setLoadingReference] = useState(false);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playingRecording, setPlayingRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const recorderRef = useRef(new PronunciationRecorder());
  const practicedRef = useRef(0);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke('get-lesson-content', {
        body: { coursePlanItemId: item.id },
      });
      setLoading(false);

      if (error || !data?.content?.sentences) {
        Alert.alert('No se pudo cargar la lección', extractErrorMessage(error, 'Intenta de nuevo.'));
        navigation.goBack();
        return;
      }

      setSentences((data.content as LessonSpeakingContent).sentences);
    })();
  }, [item.id]);

  useEffect(() => {
    return () => {
      recorderRef.current.cancel();
    };
  }, []);

  const currentSentence = sentences[currentIndex];

  const playReference = async () => {
    if (!currentSentence) return;

    if (audioUrls[currentIndex]) {
      playAudioUri(audioUrls[currentIndex]).catch(() => {
        Alert.alert('Error', 'No se pudo reproducir el audio.');
      });
      return;
    }

    setLoadingReference(true);
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text: currentSentence.sentence, language },
    });
    setLoadingReference(false);

    if (error || !data?.audioUrl) {
      Alert.alert('No se pudo generar el audio', extractErrorMessage(error, 'Intenta de nuevo.'));
      return;
    }

    setAudioUrls((prev) => ({ ...prev, [currentIndex]: data.audioUrl }));
    playAudioUri(data.audioUrl).catch(() => {
      Alert.alert('Error', 'No se pudo reproducir el audio.');
    });
  };

  const startRecording = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permiso necesario', 'Activa el acceso al micrófono para grabar tu pronunciación.');
          return;
        }
      }
      await recorderRef.current.start();
      setStatus('recording');
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la grabación. Verifica el permiso de micrófono.');
    }
  };

  const stopRecording = async () => {
    try {
      const uri = await recorderRef.current.stop();
      setRecordingUri(uri);
      setStatus('recorded');
    } catch {
      Alert.alert('Error', 'No se pudo detener la grabación.');
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;
    setPlayingRecording(true);
    try {
      await playAudioUri(recordingUri);
    } catch {
      Alert.alert('Error', 'No se pudo reproducir tu grabación.');
    } finally {
      setPlayingRecording(false);
    }
  };

  const analyzePronunciation = async () => {
    if (!recordingUri || !currentSentence) return;

    setAnalyzing(true);
    try {
      const fileResponse = await fetch(recordingUri);
      const blob = await fileResponse.blob();
      const audioBase64 = await blobToBase64(blob);

      const { data, error } = await supabase.functions.invoke('assess-pronunciation', {
        body: {
          audioBase64,
          contentType: getRecordingContentType(),
          referenceText: currentSentence.sentence,
          language,
          sessionId: null,
        },
      });

      if (error || !data?.attempt) {
        Alert.alert('No se pudo analizar tu pronunciación', extractErrorMessage(error, 'Intenta de nuevo.'));
        return;
      }

      navigation.navigate('PronunciationFeedback', {
        attempt: data.attempt,
        words: data.words,
        newBadges: data.newBadges,
      });
    } catch {
      Alert.alert('Error', 'No se pudo analizar tu pronunciación.');
    } finally {
      setAnalyzing(false);
    }
  };

  const goToNext = () => {
    practicedRef.current += 1;
    setRecordingUri(null);
    setStatus('idle');

    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishLesson();
    }
  };

  const finishLesson = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('finalize-lesson-attempt', {
      body: { coursePlanItemId: item.id, responses: { sentencesPracticed: practicedRef.current } },
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', extractErrorMessage(error, 'No se pudo guardar tu progreso.'));
      return;
    }

    const message = buildGamificationMessage(data?.gamification ?? null, data?.newBadges ?? []);
    if (message) Alert.alert('¡Lección completada!', message);
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (sentences.length === 0 || !currentSentence) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>No se pudo cargar esta lección</Text>
        <Button label="Volver" variant="secondary" onPress={() => navigation.goBack()} style={styles.emptyButton} />
      </SafeAreaView>
    );
  }

  const isLastItem = currentIndex === sentences.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          Frase {currentIndex + 1} de {sentences.length}
        </Text>
        <ProgressBar progress={(currentIndex + 1) / sentences.length} />
      </View>

      <View style={styles.content}>
        <View style={styles.sentenceCard}>
          {currentSentence.term && <Text style={styles.termLabel}>{currentSentence.term}</Text>}
          <Text style={styles.sentence}>{currentSentence.sentence}</Text>
        </View>

        <Button
          label="Escuchar frase nativa"
          variant="secondary"
          onPress={playReference}
          loading={loadingReference}
          style={styles.actionButton}
        />

        {status !== 'recording' ? (
          <Button
            label={status === 'recorded' ? 'Grabar de nuevo' : 'Grabar mi repetición'}
            onPress={startRecording}
            style={styles.actionButton}
          />
        ) : (
          <Button label="Detener grabación" onPress={stopRecording} style={styles.actionButton} />
        )}

        <Button
          label="Escuchar mi grabación"
          variant="secondary"
          onPress={playRecording}
          disabled={!recordingUri}
          loading={playingRecording}
          style={styles.actionButton}
        />

        <Button
          label="Analizar mi pronunciación"
          onPress={analyzePronunciation}
          disabled={!recordingUri}
          loading={analyzing}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.footer}>
        <Button
          label={isLastItem ? 'Finalizar lección' : 'Siguiente frase'}
          onPress={goToNext}
          disabled={!recordingUri}
          loading={submitting}
          style={styles.footerButton}
        />
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
    marginBottom: spacing.lg,
    textAlign: 'center',
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
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  sentenceCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...cardShadow,
  },
  termLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  sentence: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  footer: {
    padding: spacing.lg,
  },
  footerButton: {
    marginBottom: 0,
  },
});
