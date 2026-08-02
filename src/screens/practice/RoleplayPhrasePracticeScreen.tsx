import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { playAudioUri } from '../../lib/audio';
import { blobToBase64, getRecordingContentType } from '../../lib/pronunciationRecording';
import { PronunciationRecorder } from '../../lib/pronunciationRecorder';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'RoleplayPhrasePractice'>;
type RecordingStatus = 'idle' | 'recording' | 'recorded';

function extractErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function RoleplayPhrasePracticeScreen({ route, navigation }: Props) {
  const { phrase } = route.params;
  const { studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';

  const [loadingReference, setLoadingReference] = useState(false);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playingRecording, setPlayingRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const recorderRef = useRef(new PronunciationRecorder());

  useEffect(() => {
    return () => {
      recorderRef.current.cancel();
    };
  }, []);

  const playReference = async () => {
    setLoadingReference(true);
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text: phrase.phrase, language },
    });
    setLoadingReference(false);

    if (error || !data?.audioUrl) {
      Alert.alert('No se pudo generar el audio', extractErrorMessage(error, 'Intenta de nuevo.'));
      return;
    }
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
    if (!recordingUri) return;

    setAnalyzing(true);
    try {
      const fileResponse = await fetch(recordingUri);
      const blob = await fileResponse.blob();
      const audioBase64 = await blobToBase64(blob);

      const { data, error } = await supabase.functions.invoke('assess-pronunciation', {
        body: {
          audioBase64,
          contentType: getRecordingContentType(),
          referenceText: phrase.phrase,
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.phraseCard}>
          <Text style={styles.phrase}>{phrase.phrase}</Text>
          <Text style={styles.translation}>{phrase.translation}</Text>
          <Text style={styles.tip}>💡 {phrase.tip}</Text>
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
            label={status === 'recorded' ? 'Grabar de nuevo' : 'Grabar mi voz'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  phraseCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...cardShadow,
  },
  phrase: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  translation: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  tip: {
    fontSize: 13,
    color: colors.primary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actionButton: {
    marginBottom: spacing.md,
  },
});
