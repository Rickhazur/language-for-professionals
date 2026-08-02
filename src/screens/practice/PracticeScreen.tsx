import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { colors, spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'PracticeMenu'>;

export function PracticeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Práctica</Text>
      <Text style={styles.subtitle}>Elige un tipo de práctica.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Shadowing</Text>
        <Text style={styles.cardText}>
          Escucha una frase con pronunciación nativa, repítela y compara tu grabación con el
          audio original.
        </Text>
        <Button label="Practicar shadowing" onPress={() => navigation.navigate('Shadowing')} />
      </View>

      <View style={[styles.card, styles.secondCard]}>
        <Text style={styles.cardTitle}>Roleplay conversacional</Text>
        <Text style={styles.cardText}>
          Conversa con la IA en un escenario relacionado a tu profesión y recibe feedback al
          final.
        </Text>
        <Button label="Practicar roleplay" onPress={() => navigation.navigate('RoleplaySelect')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  secondCard: {
    marginTop: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cardText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
