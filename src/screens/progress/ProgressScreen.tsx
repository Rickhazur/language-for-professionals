import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/types';
import { Button } from '../../components/common/Button';
import { PillButton } from '../../components/common/PillButton';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import {
  CoursePlan,
  CoursePlanItem,
  CoursePlanItemStatus,
  CoursePlanRoleplay,
  CoursePlanVocabularyTerm,
} from '../../types/database';
import { colors, spacing, vibrant, cardShadow } from '../../constants/theme';

interface CoursePlanData {
  plan: CoursePlan;
  modules: CoursePlanItem[];
  vocabulary: CoursePlanVocabularyTerm[];
  roleplays: CoursePlanRoleplay[];
}

const OBJECTIVE_LABELS: Record<string, string> = {
  meetings: 'Reuniones',
  emails: 'Correos',
  negotiation: 'Negociación',
  presentations: 'Presentaciones',
  customer_service: 'Atención a clientes',
  travel: 'Viajes',
};

const SKILL_LABELS: Record<string, string> = {
  listening: 'Listening',
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
  vocabulary: 'Vocabulario',
  grammar: 'Gramática',
};

const STATUS_LABELS: Record<CoursePlanItemStatus, string> = {
  not_started: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completado',
};

const STATUS_BADGE_STYLES: Record<CoursePlanItemStatus, { backgroundColor: string }> = {
  not_started: { backgroundColor: '#F3F4F6' },
  in_progress: { backgroundColor: '#FEF3C7' },
  completed: { backgroundColor: '#DCFCE7' },
};

type Props = NativeStackScreenProps<ProgressStackParamList, 'CourseOverview'>;

export function ProgressScreen({ navigation }: Props) {
  const { session, studentProfile } = useAuth();
  const [data, setData] = useState<CoursePlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const canGenerate = Boolean(
    studentProfile?.occupation && studentProfile?.industry && studentProfile.learning_objectives.length > 0
  );

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let active = true;
      setLoading(true);

      (async () => {
        const { data: plan } = await supabase
          .from('course_plans')
          .select('*')
          .eq('student_id', session.user.id)
          .eq('status', 'active')
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!plan) {
          if (active) {
            setData(null);
            setLoading(false);
          }
          return;
        }

        const [modulesRes, vocabRes, roleplaysRes] = await Promise.all([
          supabase.from('course_plan_items').select('*').eq('course_plan_id', plan.id).order('order_index'),
          supabase.from('course_plan_vocabulary').select('*').eq('course_plan_id', plan.id),
          supabase.from('course_plan_roleplays').select('*').eq('course_plan_id', plan.id),
        ]);

        if (active) {
          setData({
            plan,
            modules: modulesRes.data ?? [],
            vocabulary: vocabRes.data ?? [],
            roleplays: roleplaysRes.data ?? [],
          });
          setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [session])
  );

  const handleGenerate = async () => {
    setGenerating(true);
    const { data: result, error } = await supabase.functions.invoke('generate-course-plan');

    if (error) {
      let message = error.message;
      try {
        const body = await (error as { context?: Response }).context?.json();
        if (body?.error) message = body.error;
      } catch {
        // se queda con error.message
      }
      setGenerating(false);
      Alert.alert('No se pudo generar el plan', message);
      return;
    }

    setGenerating(false);
    setData({
      plan: result.coursePlan,
      modules: result.modules,
      vocabulary: result.vocabulary,
      roleplays: result.roleplays,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tu plan de curso</Text>

        {!data ? (
          <View style={styles.card}>
            <Text style={styles.cardText}>
              {canGenerate
                ? 'Genera un plan de curso personalizado a partir de tu ocupación, industria y objetivos.'
                : 'Completa tu ocupación, industria y objetivos en el onboarding para poder generar tu plan.'}
            </Text>
            <Button
              label="Generar mi plan de curso"
              onPress={handleGenerate}
              loading={generating}
              disabled={!canGenerate}
              style={styles.generateButton}
            />
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>{data.plan.title}</Text>
            {data.plan.summary && <Text style={styles.summary}>{data.plan.summary}</Text>}

            <Button
              label="Regenerar plan"
              variant="secondary"
              onPress={handleGenerate}
              loading={generating}
              style={styles.regenerateButton}
            />

            <Text style={styles.sectionTitle}>Módulos</Text>
            <View style={styles.overallProgress}>
              <Text style={styles.overallProgressLabel}>
                {data.modules.filter((m) => m.status === 'completed').length} de {data.modules.length} módulos
                completados
              </Text>
              <ProgressBar
                progress={
                  data.modules.length > 0
                    ? data.modules.filter((m) => m.status === 'completed').length / data.modules.length
                    : 0
                }
              />
            </View>

            {data.modules.map((item, index) => (
              <View key={item.id} style={styles.moduleCard}>
                <View style={styles.moduleHeaderRow}>
                  <Text style={styles.skillTag}>{SKILL_LABELS[item.skill_focus ?? ''] ?? item.skill_focus}</Text>
                  <View style={[styles.statusBadge, STATUS_BADGE_STYLES[item.status]]}>
                    <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
                  </View>
                </View>
                <Text style={styles.moduleTitle}>
                  {item.order_index}. {item.title}
                </Text>
                {item.description && <Text style={styles.moduleDescription}>{item.description}</Text>}
                {item.estimated_minutes && <Text style={styles.moduleMeta}>{item.estimated_minutes} min</Text>}
                <Button
                  label={
                    item.status === 'completed' ? 'Repasar' : item.status === 'in_progress' ? 'Continuar' : 'Entrar'
                  }
                  variant="secondary"
                  style={styles.enterButton}
                  onPress={() =>
                    navigation.navigate('Lesson', {
                      item,
                      moduleNumber: index + 1,
                      totalModules: data.modules.length,
                    })
                  }
                />
              </View>
            ))}

            <View style={styles.vocabHeaderRow}>
              <Text style={styles.sectionTitle}>Vocabulario profesional</Text>
              <PillButton
                label="Repasar"
                onPress={() => navigation.navigate('VocabularyBank')}
                style={styles.vocabReviewButton}
              />
            </View>
            {data.vocabulary.slice(0, 5).map((term) => (
              <View key={term.id} style={styles.vocabRow}>
                <Text style={styles.vocabTerm}>
                  {term.term} <Text style={styles.vocabTranslation}>— {term.translation}</Text>
                </Text>
                {term.example_sentence && <Text style={styles.vocabExample}>{term.example_sentence}</Text>}
              </View>
            ))}
            {data.vocabulary.length > 5 && (
              <Text style={styles.vocabMore} onPress={() => navigation.navigate('VocabularyBank')}>
                Ver los {data.vocabulary.length} términos →
              </Text>
            )}

            <Text style={styles.sectionTitle}>Escenarios de roleplay</Text>
            {data.roleplays.map((scenario) => (
              <View key={scenario.id} style={styles.roleplayCard}>
                <View style={styles.roleplayBadges}>
                  <Text style={styles.badge}>{OBJECTIVE_LABELS[scenario.related_objective] ?? scenario.related_objective}</Text>
                  <Text style={styles.badge}>{scenario.difficulty}</Text>
                </View>
                <Text style={styles.roleplayTitle}>{scenario.title}</Text>
                <Text style={styles.roleplayText}>{scenario.context}</Text>
                <Text style={styles.roleplayObjective}>Objetivo: {scenario.objective}</Text>
              </View>
            ))}
          </>
        )}
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
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
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
  cardText: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  generateButton: {
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  summary: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  regenerateButton: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  overallProgress: {
    marginBottom: spacing.md,
  },
  overallProgressLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  moduleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  enterButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  skillTag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: vibrant.purple,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  moduleDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  moduleMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  vocabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vocabReviewButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  vocabRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  vocabMore: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  vocabTerm: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  vocabTranslation: {
    fontWeight: '400',
    color: colors.textMuted,
  },
  vocabExample: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: 2,
  },
  roleplayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  roleplayBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: vibrant.purple,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  roleplayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  roleplayText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  roleplayObjective: {
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
});
