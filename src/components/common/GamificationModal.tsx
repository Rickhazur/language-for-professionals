import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GamificationUpdate, StudentBadge } from '../../types/database';
import { colors, spacing, gradients, cardShadow } from '../../constants/theme';

interface Props {
  visible: boolean;
  gamification: GamificationUpdate | null;
  newBadges: Pick<StudentBadge, 'id' | 'icon' | 'title'>[];
  onDismiss: () => void;
}

// Reemplaza el Alert.alert() de texto plano que se usaba después de cada
// sesión de práctica — mismo dato (racha, puntos, insignias nuevas), pero
// con un momento visual real en vez de un cuadro de diálogo del sistema.
export function GamificationModal({ visible, gamification, newBadges, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.85);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 60 }),
        Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!gamification) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.heroEmoji}>{newBadges.length > 0 ? '🏆' : '🔥'}</Text>
            <Text style={styles.heroTitle}>¡Sesión completada!</Text>
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{gamification.currentStreak}</Text>
              <Text style={styles.statLabel}>día(s) de racha</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{gamification.totalPoints}</Text>
              <Text style={styles.statLabel}>puntos totales</Text>
            </View>
          </View>

          {newBadges.length > 0 && (
            <View style={styles.badgesSection}>
              <Text style={styles.badgesTitle}>Nueva(s) insignia(s)</Text>
              <View style={styles.badgesRow}>
                {newBadges.map((badge) => (
                  <View key={badge.id} style={styles.badgeChip}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeTitle}>{badge.title}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Pressable style={styles.continueButton} onPress={onDismiss}>
            <Text style={styles.continueText}>Continuar</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...cardShadow,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  badgesSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  badgesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeIcon: {
    fontSize: 16,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  continueButton: {
    margin: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
