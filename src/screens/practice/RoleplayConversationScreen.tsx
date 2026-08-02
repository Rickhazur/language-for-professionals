import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { supabase } from '../../config/supabase';
import { buildGamificationMessage } from '../../lib/gamificationAlert';
import { RoleplayMessage } from '../../types/database';
import { colors, spacing, gradients } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<PracticeStackParamList, 'RoleplayConversation'>;

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

export function RoleplayConversationScreen({ route, navigation }: Props) {
  const { roleplayId, title } = route.params;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [shouldFinish, setShouldFinish] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke('roleplay-chat', {
        body: { action: 'start', roleplayId },
      });

      if (error || !data?.conversation) {
        const message = await extractErrorMessage(error, 'No se pudo iniciar la conversación.');
        Alert.alert('Error', message);
        navigation.goBack();
        return;
      }

      setConversationId(data.conversation.id);
      setMessages(data.messages ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleplayId]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;
    const messageText = input.trim();
    setInput('');
    setSending(true);

    const { data, error } = await supabase.functions.invoke('roleplay-chat', {
      body: { action: 'reply', conversationId, message: messageText },
    });

    setSending(false);

    if (error || !data?.messages) {
      const message = await extractErrorMessage(error, 'No se pudo enviar tu mensaje.');
      Alert.alert('Error', message);
      return;
    }

    setMessages((prev) => [...prev, ...data.messages]);
    if (data.shouldFinish) setShouldFinish(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleFinish = async () => {
    if (!conversationId) return;
    setFinishing(true);

    const { data, error } = await supabase.functions.invoke('roleplay-chat', {
      body: { action: 'finish', conversationId },
    });

    setFinishing(false);

    if (error || !data?.conversation) {
      const message = await extractErrorMessage(error, 'No se pudo generar el feedback.');
      Alert.alert('Error', message);
      return;
    }

    const gamificationMessage = buildGamificationMessage(data.gamification ?? null, data.newBadges ?? []);

    navigation.replace('RoleplayFeedback', {
      feedback: data.conversation.feedback ?? 'Sin feedback disponible.',
      title,
    });

    if (gamificationMessage) {
      setTimeout(() => Alert.alert('¡Conversación completada!', gamificationMessage), 300);
    }
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
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m) =>
            m.role === 'assistant' ? (
              <View key={m.id} style={[styles.bubble, styles.bubbleAssistant]}>
                <Text style={styles.bubbleText}>{m.content}</Text>
              </View>
            ) : (
              <LinearGradient
                key={m.id}
                colors={gradients.primaryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.bubble, styles.bubbleUser]}
              >
                <Text style={[styles.bubbleText, styles.bubbleTextUser]}>{m.content}</Text>
              </LinearGradient>
            )
          )}
          {sending && <ActivityIndicator style={styles.typingIndicator} color={colors.primary} />}
        </ScrollView>

        {shouldFinish && (
          <Text style={styles.limitNote}>
            Llegaste al límite de intercambios para esta práctica — termina la conversación para recibir tu
            feedback.
          </Text>
        )}

        <View style={styles.inputRow}>
          <Input
            style={styles.textInput}
            placeholder="Escribe tu respuesta…"
            value={input}
            onChangeText={setInput}
            editable={!shouldFinish}
            multiline
          />
          <Button label="Enviar" onPress={handleSend} disabled={!input.trim() || shouldFinish} loading={sending} />
        </View>

        <Button
          label="Terminar conversación"
          variant="secondary"
          onPress={handleFinish}
          loading={finishing}
          style={styles.finishButton}
        />
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
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  messagesContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
  },
  bubbleText: {
    fontSize: 15,
    color: colors.text,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
  },
  limitNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
  },
  finishButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginTop: 0,
  },
});
