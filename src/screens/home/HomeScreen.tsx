import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PillButton } from '../../components/common/PillButton';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { AppStackParamList } from '../../navigation/types';
import { LevelAssessment, StudentGamification } from '../../types/database';
import { useLanguage } from '../../hooks/useLanguage';
import { TranslationKey } from '../../i18n/translations';
import { colors, spacing, gradients, cardShadow } from '../../constants/theme';

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: TranslationKey;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'mic-outline', labelKey: 'home.quick.shadowing', route: 'Practice' },
  { icon: 'chatbubble-ellipses-outline', labelKey: 'home.quick.roleplay', route: 'Practice' },
  { icon: 'stats-chart-outline', labelKey: 'home.quick.progress', route: 'Progress' },
  { icon: 'locate-outline', labelKey: 'home.quick.assessment', route: 'Assessment' },
  { icon: 'calendar-outline', labelKey: 'home.quick.bookClass', route: 'BookClass' },
];

interface FeatureCard {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  route: string;
  colors: readonly [string, string];
}

const FEATURE_CARDS: FeatureCard[] = [
  { icon: 'book-outline', titleKey: 'home.coursePlanTitle', subtitleKey: 'home.coursePlanSubtitle', route: 'Progress', colors: ['#818CF8', '#6366F1'] },
  { icon: 'trophy-outline', titleKey: 'home.badgesTitle', subtitleKey: 'home.badgesSubtitle', route: 'Profile', colors: ['#FB923C', '#F59E0B'] },
];

export function HomeScreen() {
  const { session } = useAuth();
  const { t } = useLanguage();
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
            <Text style={styles.greeting}>{t('common.greeting')}</Text>
            <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statsCard}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>🔥 {gamification?.current_streak ?? 0}</Text>
            <Text style={styles.statLabel}>{t('home.streakLabel')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>⭐ {gamification?.total_points ?? 0}</Text>
            <Text style={styles.statLabel}>{t('home.pointsLabel')}</Text>
          </View>
        </LinearGradient>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable key={action.labelKey} style={styles.quickAction} onPress={() => goTo(action.route)}>
              <Ionicons name={action.icon} size={16} color={colors.primary} />
              <Text style={styles.quickActionLabel}>{t(action.labelKey)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{t('home.featuredTitle')}</Text>
        <View style={styles.featureGrid}>
          {FEATURE_CARDS.map((card) => (
            <Pressable key={card.titleKey} style={styles.featureCard} onPress={() => goTo(card.route)}>
              <LinearGradient colors={card.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureIconWrap}>
                <Ionicons name={card.icon} size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.featureTitle}>{t(card.titleKey)}</Text>
              <Text style={styles.featureSubtitle}>{t(card.subtitleKey)}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.levelCard}>
          {loadingAssessment ? null : latestAssessment ? (
            <>
              <Text style={styles.levelLabel}>{t('home.currentLevelLabel')}</Text>
              <Text style={styles.levelValue}>{latestAssessment.overall_level}</Text>
              <Button
                label={t('home.retakeAssessment')}
                variant="secondary"
                onPress={() => navigation.navigate('Assessment')}
              />
            </>
          ) : (
            <>
              <Text style={styles.levelLabel}>{t('home.noAssessmentLabel')}</Text>
              <PillButton label={t('home.startAssessment')} onPress={() => navigation.navigate('Assessment')} />
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
    ...cardShadow,
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
    ...cardShadow,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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
    ...cardShadow,
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
