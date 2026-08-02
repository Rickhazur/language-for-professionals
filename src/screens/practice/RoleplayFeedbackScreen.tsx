import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'RoleplayFeedback'>;

export function RoleplayFeedbackScreen({ route, navigation }: Props) {
  const { feedback, title } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Feedback de tu conversación</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.card}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      </View>

      <Button
        label="Volver al menú de práctica"
        onPress={() => navigation.navigate('PracticeMenu')}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  content: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.lg,
    ...cardShadow,
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  button: {
    margin: spacing.lg,
  },
});
