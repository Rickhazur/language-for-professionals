import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { PillButton } from '../../components/common/PillButton';
import { GradientBackground } from '../../components/common/GradientBackground';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { spacing, vibrant } from '../../constants/theme';

export function AuthLinkErrorScreen() {
  const { clearAuthLinkError } = useAuth();
  const { t } = useLanguage();

  return (
    <GradientBackground>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>{t('authLinkError.title')}</Text>
      <Text style={styles.subtitle}>{t('authLinkError.subtitle')}</Text>

      <PillButton label={t('authLinkError.button')} onPress={clearAuthLinkError} style={styles.button} />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 56,
    textAlign: 'center',
    marginTop: '32%',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: vibrant.textOnGradient,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: vibrant.textOnGradientMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 21,
    marginBottom: spacing.xl,
  },
  button: {
    marginHorizontal: spacing.lg,
  },
});
