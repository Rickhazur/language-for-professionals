import React from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'PracticeMenu'>;

export function PracticeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Práctica</Text>
        <Text style={styles.subtitle}>Elige un tipo de práctica.</Text>

        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="mic-outline" size={22} color="#2563EB" />
          </View>
          <Text style={styles.cardTitle}>Shadowing</Text>
          <Text style={styles.cardText}>
            Escucha una frase con pronunciación nativa, repítela y compara tu grabación con el
            audio original.
          </Text>
          <Button label="Practicar shadowing" onPress={() => navigation.navigate('Shadowing')} />
        </View>

        <View style={[styles.card, styles.secondCard]}>
          <View style={[styles.iconWrap, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#7C3AED" />
          </View>
          <Text style={styles.cardTitle}>Roleplay conversacional</Text>
          <Text style={styles.cardText}>
            Conversa con la IA en un escenario relacionado a tu profesión y recibe feedback al
            final.
          </Text>
          <Button label="Practicar roleplay" onPress={() => navigation.navigate('RoleplaySelect')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  secondCard: {
    marginTop: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
