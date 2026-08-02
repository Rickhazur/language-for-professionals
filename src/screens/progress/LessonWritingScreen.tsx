import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { PillButton } from '../../components/common/PillButton';
import { supabase } from '../../config/supabase';
import { buildGamificationMessage } from '../../lib/gamificationAlert';
import { LessonWritingContent } from '../../types/database';
import { colors, spacing, vibrant, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<ProgressStackParamList, 'LessonWriting'>;

function extractErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function LessonWritingScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<LessonWritingContent | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke('get-lesson-content', {
        body: { coursePlanItemId: item.id },
      });
      setLoading(false);

      if (error || !data?.content?.prompt) {
        Alert.alert('No se pudo cargar la lección', extractErrorMessage(error, 'Intenta de nuevo.'));
        navigation.goBack();
        return;
      }

      setContent(data.content as LessonWritingContent);
    })();
  }, [item.id]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke('finalize-lesson-attempt', {
      body: { coursePlanItemId: item.id, responses: { text: text.trim() } },
    });
    setSubmitting(false);

    if (error || !data?.attempt) {
      Alert.alert('Error', extractErrorMessage(error, 'No se pudo guardar tu respuesta.'));
      return;
    }

    setFeedback((data.attempt.responses?.feedback as string) ?? null);
    const gamificationMessage = buildGamificationMessage(data?.gamification ?? null, data?.newBadges ?? []);
    if (gamificationMessage) setTimeout(() => Alert.alert('¡Lección completada!', gamificationMessage), 300);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!content) return null;

  if (feedback) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Retroalimentación</Text>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        </ScrollView>
        <PillButton label="Volver al módulo" onPress={() => navigation.goBack()} style={styles.submitButton} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.promptCard}>
            <Text style={styles.promptText}>{content.prompt}</Text>
            {content.guidance && <Text style={styles.guidanceText}>{content.guidance}</Text>}
          </View>

          <Input
            style={styles.textInput}
            placeholder="Escribe tu respuesta…"
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <PillButton
          label="Enviar"
          onPress={handleSubmit}
          disabled={!text.trim()}
          loading={submitting}
          style={styles.submitButton}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  promptCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  promptText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  guidanceText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  textInput: {
    minHeight: 160,
    paddingTop: spacing.md,
  },
  submitButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  feedbackCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: vibrant.purple,
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});
