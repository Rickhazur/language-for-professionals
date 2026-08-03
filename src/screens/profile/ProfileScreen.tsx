import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { supabase } from '../../config/supabase';
import { StudentBadge } from '../../types/database';
import { AppStackParamList } from '../../navigation/types';
import { colors, spacing, gradients, cardShadow } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export function ProfileScreen() {
  const { session, studentProfile, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { t, uiLanguage, setUiLanguage } = useLanguage();
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let active = true;
      setLoadingBadges(true);

      supabase
        .from('student_badges')
        .select('*')
        .eq('student_id', session.user.id)
        .order('awarded_at', { ascending: false })
        .then(({ data }) => {
          if (active) {
            setBadges(data ?? []);
            setLoadingBadges(false);
          }
        });

      return () => {
        active = false;
      };
    }, [session])
  );

  const initial = session?.user.email?.[0]?.toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </LinearGradient>
        <View>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <Text style={styles.email}>{session?.user.email}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Perfil profesional</Text>
      <View style={styles.profileCard}>
        <Text style={styles.profileLine}>{studentProfile?.occupation || 'Sin ocupación registrada'}</Text>
        <Text style={styles.profileLineMuted}>{studentProfile?.industry || 'Sin industria registrada'}</Text>
        <Button
          label="Editar perfil"
          variant="secondary"
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.editProfileButton}
        />
      </View>

      <Text style={styles.sectionTitle}>{t('profile.languageLabel')}</Text>
      <View style={styles.langToggle}>
        <Pressable
          onPress={() => setUiLanguage('es')}
          style={[styles.langOption, uiLanguage === 'es' && styles.langOptionActive]}
        >
          <Text style={[styles.langOptionText, uiLanguage === 'es' && styles.langOptionTextActive]}>
            {t('common.langSpanish')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setUiLanguage('en')}
          style={[styles.langOption, uiLanguage === 'en' && styles.langOptionActive]}
        >
          <Text style={[styles.langOptionText, uiLanguage === 'en' && styles.langOptionTextActive]}>
            {t('common.langEnglish')}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>{t('profile.badgesTitle')}</Text>
      {loadingBadges ? (
        <ActivityIndicator color={colors.primary} />
      ) : badges.length === 0 ? (
        <Text style={styles.emptyText}>{t('profile.emptyBadges')}</Text>
      ) : (
        <View style={styles.badgeGrid}>
          {badges.map((b) => (
            <View key={b.id} style={styles.badgeCard}>
              <Text style={styles.badgeIcon}>{b.icon}</Text>
              <Text style={styles.badgeTitle}>{b.title}</Text>
              <Text style={styles.badgeDescription}>{b.description}</Text>
            </View>
          ))}
        </View>
      )}

      <Button label={t('profile.signOut')} variant="secondary" onPress={signOut} style={styles.signOut} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 3,
    gap: 2,
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
    ...cardShadow,
  },
  langOption: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  langOptionActive: {
    backgroundColor: colors.primary,
  },
  langOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  langOptionTextActive: {
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.xl,
    ...cardShadow,
  },
  profileLine: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  profileLineMuted: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  editProfileButton: {
    marginTop: spacing.sm,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.sm,
    alignItems: 'center',
    ...cardShadow,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  signOut: {
    marginTop: spacing.xl,
  },
});
