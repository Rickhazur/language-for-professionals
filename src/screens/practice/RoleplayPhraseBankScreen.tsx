import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { playAudioUri } from '../../lib/audio';
import { ROLEPLAY_PHRASES, RoleplayPhrase } from '../../data/roleplayPhrases';
import { colors, spacing, vibrant, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'RoleplayPhraseBank'>;

function extractErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function RoleplayPhraseBankScreen({ route, navigation }: Props) {
  const { relatedObjective } = route.params;
  const { studentProfile } = useAuth();
  const language = studentProfile?.target_language ?? 'en';
  const phrases = ROLEPLAY_PHRASES[language][relatedObjective];

  const [playingId, setPlayingId] = useState<string | null>(null);

  const playPhrase = async (phrase: RoleplayPhrase) => {
    setPlayingId(phrase.id);
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text: phrase.phrase, language },
    });

    if (error || !data?.audioUrl) {
      setPlayingId(null);
      Alert.alert('No se pudo generar el audio', extractErrorMessage(error, 'Intenta de nuevo.'));
      return;
    }

    try {
      await playAudioUri(data.audioUrl);
    } catch {
      Alert.alert('Error', 'No se pudo reproducir el audio.');
    } finally {
      setPlayingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Frases útiles</Text>
        <Text style={styles.subtitle}>Toca una frase para escucharla, o practícala en voz alta.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {phrases.map((phrase) => (
          <View key={phrase.id} style={styles.card}>
            <Text style={styles.phrase}>{phrase.phrase}</Text>
            <Text style={styles.translation}>{phrase.translation}</Text>
            <Text style={styles.tip}>💡 {phrase.tip}</Text>
            <View style={styles.actionsRow}>
              <Button
                label="🔊 Escuchar"
                variant="secondary"
                onPress={() => playPhrase(phrase)}
                loading={playingId === phrase.id}
                style={styles.actionButton}
              />
              <Button
                label="🎙️ Practicar"
                onPress={() => navigation.navigate('RoleplayPhrasePractice', { phrase })}
                style={styles.actionButton}
              />
            </View>
          </View>
        ))}
      </ScrollView>
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
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...cardShadow,
  },
  phrase: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  translation: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  tip: {
    fontSize: 13,
    color: vibrant.purple,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
