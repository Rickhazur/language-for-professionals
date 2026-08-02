import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PillButton } from '../../components/common/PillButton';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { AppStackParamList } from '../../navigation/types';
import { LevelAssessment, StudentGamification } from '../../types/database';
import { colors, spacing, gradients } from '../../constants/theme';

interface QuickAction {
  icon: string;
  label: string;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: '🗣️', label: 'Shadowing', route: 'Practice' },
  { icon: '💬', label: 'Roleplay', route: 'Practice' },
  { icon: '📊', label: 'Mi progreso', route: 'Progress' },
  { icon: '🎯', label: 'Evaluación', route: 'Assessment' },
];

interface FeatureCard {
  icon: string;
  title: string;
  subtitle: string;
  route: string;
  colors: readonly [string, string];
}

const FEATURE_CARDS: FeatureCard[] = [
  { icon: '📚', title: 'Plan de curso', subtitle: 'Módulos y vocabulario', route: 'Progress', colors: ['#818CF8', '#6366F1'] },
  { icon: '🏅', title: 'Insignias', subtitle: 'Tus logros', route: 'Profile', colors: ['#FB923C', '#F59E0B'] },
];

export function HomeScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [latestAssessment, setLatestAssessment] = useState<LevelAssessment | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [gamification, setGamification] = useState<StudentGamification | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let active = true;
      setLoadingAssessment(true);

      supabase
        .from('level_assessments')
        .select('*')
        .eq('student_id', session.user.id)
        .order('taken_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (active) {
            setLatestAssessment(data ?? null);
            setLoadingAssessment(false);
          }
        });

      supabase
        .from('student_gamification')
        .select('*')
        .eq('student_id', session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (active) setGamification(data ?? null);
        });

      return () => {
        active = false;
      };
    }, [session])
  );

  const goTo = (route: string) => navigation.navigate(route as never);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>¡Hola! 👋</Text>
            <Text style={styles.subtitle}>¿Qué quieres practicar hoy?</Text>
          </View>
        </View>

        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statsCard}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>🔥 {gamification?.current_streak ?? 0}</Text>
            <Text style={styles.statLabel}>Racha (días)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>⭐ {gamification?.total_points ?? 0}</Text>
            <Text style={styles.statLabel}>Puntos</Text>
          </View>
        </LinearGradient>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable key={action.label} style={styles.quickAction} onPress={() => goTo(action.route)}>
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Funciones destacadas</Text>
        <View style={styles.featureGrid}>
          {FEATURE_CARDS.map((card) => (
            <Pressable key={card.title} style={styles.featureCard} onPress={() => goTo(card.route)}>
              <LinearGradient colors={card.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{card.icon}</Text>
              </LinearGradient>
              <Text style={styles.featureTitle}>{card.title}</Text>
              <Text style={styles.featureSubtitle}>{card.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.levelCard}>
          {loadingAssessment ? null : latestAssessment ? (
            <>
              <Text style={styles.levelLabel}>Tu nivel actual</Text>
              <Text style={styles.levelValue}>{latestAssessment.overall_level}</Text>
              <Button
                label="Repetir evaluación de nivel"
                variant="secondary"
                onPress={() => navigation.navigate('Assessment')}
              />
            </>
          ) : (
            <>
              <Text style={styles.levelLabel}>Aún no has tomado tu evaluación de nivel</Text>
              <PillButton label="Comenzar evaluación" onPress={() => navigation.navigate('Assessment')} />
            </>
          )}
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
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: spacing.xs,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  quickActionsRow: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    paddingRight: spacing.md,
  },
  quickAction: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    fontSize: 16,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  featureSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  levelCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  levelLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  levelValue: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
});
