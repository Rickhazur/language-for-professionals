import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { StudentBadge } from '../../types/database';
import { colors, spacing } from '../../constants/theme';

export function ProfileScreen() {
  const { session, signOut } = useAuth();
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mi perfil</Text>
      <Text style={styles.email}>{session?.user.email}</Text>

      <Text style={styles.sectionTitle}>Insignias</Text>
      {loadingBadges ? (
        <ActivityIndicator color={colors.primary} />
      ) : badges.length === 0 ? (
        <Text style={styles.emptyText}>Todavía no ganaste ninguna insignia — sigue practicando.</Text>
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

      <Button label="Cerrar sesión" variant="secondary" onPress={signOut} style={styles.signOut} />
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
  email: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: 'center',
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
