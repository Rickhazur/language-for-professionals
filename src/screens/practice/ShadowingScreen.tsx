import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { playAudioUri } from '../../lib/audio';
import { blobToBase64, getRecordingContentType } from '../../lib/pronunciationRecording';
import { PronunciationRecorder } from '../../lib/pronunciationRecorder';
import { buildGamificationMessage } from '../../lib/gamificationAlert';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'Shadowing'>;
type RecordingStatus = 'idle' | 'recording' | 'recorded';

interface ShadowingItem {
  id: string;
  term: string;
  sentence: string;
  audioUrl?: string;
}

function extractFunctionErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  return message;
}

export function ShadowingScreen({ navigation }: Props) {
  const { session, studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ShadowingItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingReference, setLoadingReference] = useState(false);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playingRecording, setPlayingRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const recorderRef = useRef(new PronunciationRecorder());
  const sentencesPracticedRef = useRef(0);
  const sessionStartRef = useRef(new Date());
  const sessionIdRef = useRef<string | null>(null);

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

      const { data: vocabulary } = await supabase
        .from('course_plan_vocabulary')
        .select('id, term, example_sentence')
        .eq('course_plan_id', plan.id)
        .not('example_sentence', 'is', null);

      const mapped = (vocabulary ?? []).map((v) => ({
        id: v.id,
        term: v.term,
        sentence: v.example_sentence as string,
      }));
      setItems(mapped);
      setLoading(false);

      if (mapped.length > 0) {
        // Se crea al inicio (no al final) para que cada análisis de
        // pronunciación pueda enlazarse a esta sesión mientras se practica.
        const { data: sessionRow } = await supabase
          .from('practice_sessions')
          .insert({ student_id: session.user.id, language, session_type: 'shadowing' })
          .select('id')
          .single();
        sessionIdRef.current = sessionRow?.id ?? null;
      }
    })();
  }, [session]);

  useEffect(() => {
    return () => {
      recorderRef.current.cancel();
    };
  }, []);

  const currentItem = items[currentIndex];

  const playReference = async () => {
    if (!currentItem) return;

    if (currentItem.audioUrl) {
      playAudioUri(currentItem.audioUrl).catch(() => {
        Alert.alert('Error', 'No se pudo reproducir el audio.');
      });
      return;
    }

    setLoadingReference(true);
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text: currentItem.sentence, language },
    });
    setLoadingReference(false);

    if (error || !data?.audioUrl) {
      let message = extractFunctionErrorMessage(error);
      try {
        const body = await (error as { context?: Response })?.context?.json();
        if (body?.error) message = body.error;
      } catch {
        // se queda con message
      }
      Alert.alert('No se pudo generar el audio', message);
      return;
    }

    setItems((prev) => prev.map((it, i) => (i === currentIndex ? { ...it, audioUrl: data.audioUrl } : it)));
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
    if (!recordingUri || !session || !currentItem) return;

    setAnalyzing(true);
    try {
      const fileResponse = await fetch(recordingUri);
      const blob = await fileResponse.blob();
      const audioBase64 = await blobToBase64(blob);

      const { data, error } = await supabase.functions.invoke('assess-pronunciation', {
        body: {
          audioBase64,
          contentType: getRecordingContentType(),
          referenceText: currentItem.sentence,
          language,
          sessionId: sessionIdRef.current,
        },
      });

      if (error || !data?.attempt) {
        let message = extractFunctionErrorMessage(error);
        try {
          const body = await (error as { context?: Response })?.context?.json();
          if (body?.error) message = body.error;
        } catch {
          // se queda con message
        }
        Alert.alert('No se pudo analizar tu pronunciación', message);
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
    sentencesPracticedRef.current += 1;
    setRecordingUri(null);
    setStatus('idle');

    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    if (!session) return;
    setSubmitting(true);

    const durationMinutes = Math.max(
      1,
      Math.round((Date.now() - sessionStartRef.current.getTime()) / 60000)
    );

    if (sessionIdRef.current) {
      const { data, error } = await supabase.functions.invoke('finalize-practice-session', {
        body: {
          sessionId: sessionIdRef.current,
          durationMinutes,
          notes: `${sentencesPracticedRef.current} frase(s) practicada(s).`,
        },
      });

      if (error) {
        Alert.alert('Error', 'No se pudo guardar la sesión, pero tu práctica quedó completa.');
      } else {
        const message = buildGamificationMessage(data?.gamification ?? null, data?.newBadges ?? []);
        if (message) Alert.alert('¡Sesión completada!', message);
      }
    }

    setSubmitting(false);
    navigation.goBack();
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
        <Text style={styles.emptyTitle}>Todavía no hay frases para practicar</Text>
        <Text style={styles.emptyText}>
          Genera tu plan de curso en la pestaña Progreso para obtener vocabulario y frases
          personalizadas a tu profesión.
        </Text>
        <Button label="Volver" variant="secondary" onPress={() => navigation.goBack()} style={styles.emptyButton} />
      </SafeAreaView>
    );
  }

  const isLastItem = currentIndex === items.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          Frase {currentIndex + 1} de {items.length}
        </Text>
        <ProgressBar progress={(currentIndex + 1) / items.length} />
      </View>

      <View style={styles.content}>
        <View style={styles.sentenceCard}>
          <Text style={styles.termLabel}>Vocabulario: {currentItem.term}</Text>
          <Text style={styles.sentence}>{currentItem.sentence}</Text>
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
          label={isLastItem ? 'Finalizar sesión' : 'Siguiente frase'}
          onPress={goToNext}
          disabled={!recordingUri}
          loading={submitting}
          style={styles.footerButton}
        />
        <Button
          label="Terminar ahora"
          variant="secondary"
          onPress={finishSession}
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
    gap: spacing.sm,
  },
  footerButton: {
    marginBottom: 0,
  },
});
