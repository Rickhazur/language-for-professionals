import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/types';
import { PillButton } from '../../components/common/PillButton';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { CoursePlanVocabularyTerm, StudentVocabularyProgress } from '../../types/database';
import { VocabularyStatus, statusForBox, STATUS_LABELS } from '../../features/vocabulary/leitner';
import { colors, spacing, cardShadow } from '../../constants/theme';

type Props = NativeStackScreenProps<ProgressStackParamList, 'VocabularyBank'>;

const STATUS_COLORS: Record<VocabularyStatus, { bg: string; text: string }> = {
  new: { bg: '#F3F4F6', text: '#6B7280' },
  learning: { bg: '#FEF3C7', text: '#D97706' },
  mastered: { bg: '#DCFCE7', text: '#16A34A' },
};

interface TermWithProgress {
  term: CoursePlanVocabularyTerm;
  progress: StudentVocabularyProgress | null;
  status: VocabularyStatus;
  isDue: boolean;
}

export function VocabularyBankScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasCoursePlan, setHasCoursePlan] = useState(true);
  const [items, setItems] = useState<TermWithProgress[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let active = true;
      setLoading(true);

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
          if (active) {
            setHasCoursePlan(false);
            setLoading(false);
          }
          return;
        }

        const [vocabRes, progressRes] = await Promise.all([
          supabase.from('course_plan_vocabulary').select('*').eq('course_plan_id', plan.id),
          supabase.from('student_vocabulary_progress').select('*').eq('student_id', session.user.id),
        ]);

        if (!active) return;

        const progressByTermId = new Map((progressRes.data ?? []).map((p) => [p.vocabulary_id, p]));
        const now = new Date();

        const combined: TermWithProgress[] = (vocabRes.data ?? []).map((term) => {
          const progress = progressByTermId.get(term.id) ?? null;
          const status = statusForBox(progress?.box ?? 1, progress !== null);
          const isDue = !progress || new Date(progress.next_review_at) <= now;
          return { term, progress, status, isDue };
        });

        setHasCoursePlan(true);
        setItems(combined);
        setLoading(false);
      })();

      return () => {
        active = false;
      };
    }, [session])
  );

  const counts = useMemo(() => {
    const result = { new: 0, learning: 0, mastered: 0, due: 0 };
    for (const item of items) {
      result[item.status]++;
      if (item.isDue) result.due++;
    }
    return result;
  }, [items]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!hasCoursePlan) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>Todavía no hay vocabulario</Text>
        <Text style={styles.emptyText}>
          Genera tu plan de curso en la pestaña Progreso para obtener vocabulario personalizado a tu profesión.
        </Text>
        <Button label="Volver" variant="secondary" onPress={() => navigation.goBack()} style={styles.emptyButton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Vocabulario</Text>
        <Text style={styles.subtitle}>Tu banco de términos profesionales, con repaso espaciado.</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: STATUS_COLORS.new.text }]}>{counts.new}</Text>
            <Text style={styles.statLabel}>Nuevo</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: STATUS_COLORS.learning.text }]}>{counts.learning}</Text>
            <Text style={styles.statLabel}>Aprendiendo</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: STATUS_COLORS.mastered.text }]}>{counts.mastered}</Text>
            <Text style={styles.statLabel}>Dominado</Text>
          </View>
        </View>

        {counts.due > 0 && (
          <PillButton
            label={`Repasar ahora (${counts.due})`}
            onPress={() => navigation.navigate('VocabularyReview')}
            style={styles.reviewButton}
          />
        )}

        <Text style={styles.sectionTitle}>Todos los términos</Text>
        {items.map(({ term, status }) => (
          <View key={term.id} style={styles.termCard}>
            <View style={styles.termHeaderRow}>
              <Text style={styles.termText}>{term.term}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status].bg }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[status].text }]}>
                  {STATUS_LABELS[status]}
                </Text>
              </View>
            </View>
            <Text style={styles.termTranslation}>{term.translation}</Text>
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
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  reviewButton: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  termCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  termHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  termTranslation: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
});
