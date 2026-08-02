import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PracticeStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { CoursePlanRoleplay } from '../../types/database';
import { colors, spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<PracticeStackParamList, 'RoleplaySelect'>;

const OBJECTIVE_LABELS: Record<string, string> = {
  meetings: 'Reuniones',
  emails: 'Correos',
  negotiation: 'Negociación',
  presentations: 'Presentaciones',
  customer_service: 'Atención a clientes',
  travel: 'Viajes',
};

export function RoleplaySelectScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [scenarios, setScenarios] = useState<CoursePlanRoleplay[]>([]);
  const [loading, setLoading] = useState(true);

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

      const { data } = await supabase
        .from('course_plan_roleplays')
        .select('*')
        .eq('course_plan_id', plan.id);

      setScenarios(data ?? []);
      setLoading(false);
    })();
  }, [session]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (scenarios.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>Todavía no hay escenarios de roleplay</Text>
        <Text style={styles.emptyText}>
          Genera tu plan de curso en la pestaña Progreso para obtener escenarios personalizados a
          tu profesión.
        </Text>
        <Button label="Volver" variant="secondary" onPress={() => navigation.goBack()} style={styles.emptyButton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Elige un escenario</Text>
        <Text style={styles.subtitle}>Vas a conversar con la IA en este personaje, en tu idioma de práctica.</Text>

        {scenarios.map((s) => (
          <Pressable
            key={s.id}
            style={styles.card}
            onPress={() => navigation.navigate('RoleplayConversation', { roleplayId: s.id, title: s.title })}
          >
            <View style={styles.cardBadges}>
              <Text style={styles.badge}>{OBJECTIVE_LABELS[s.related_objective] ?? s.related_objective}</Text>
              <Text style={styles.badge}>{s.difficulty}</Text>
            </View>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardText}>{s.context}</Text>
          </Pressable>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  cardText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
