import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { PillButton } from '../../components/common/PillButton';
import { GradientBackground } from '../../components/common/GradientBackground';
import { spacing, vibrant } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const FEATURES = [
  { icon: '🗣️', label: 'Shadowing con IA' },
  { icon: '💬', label: 'Roleplay profesional' },
  { icon: '🎯', label: 'Sonidos precisos' },
  { icon: '🏅', label: 'Rachas e insignias' },
];

export function WelcomeScreen({ navigation }: Props) {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.appIcon}>🎓</Text>
          <Text style={styles.appName}>LinguaPro</Text>
          <Text style={styles.tagline}>
            Tu compañero de inglés y español con IA — practica para tu profesión, no para un
            examen.
          </Text>

          <View style={styles.badge}>
            <Text style={styles.badgeFlags}>🇺🇸 ⇄ 🇪🇸</Text>
            <Text style={styles.badgeLabel}>Inglés y español</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresRow}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featurePill}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <PillButton label="Comenzar" icon="✨" onPress={() => navigation.navigate('Register')} />
          <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            ¿Ya tienes cuenta? <Text style={styles.loginLinkBold}>Inicia sesión</Text>
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  appIcon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: vibrant.textOnGradient,
  },
  tagline: {
    fontSize: 15,
    color: vibrant.textOnGradientMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    lineHeight: 21,
  },
  badge: {
    width: 168,
    height: 168,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeFlags: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: vibrant.textOnGradient,
  },
  featuresRow: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  featurePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    fontSize: 15,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: vibrant.textOnGradient,
  },
  footer: {
    gap: spacing.md,
  },
  loginLink: {
    textAlign: 'center',
    color: vibrant.textOnGradientMuted,
    fontSize: 14,
  },
  loginLinkBold: {
    color: vibrant.textOnGradient,
    fontWeight: '700',
  },
});
