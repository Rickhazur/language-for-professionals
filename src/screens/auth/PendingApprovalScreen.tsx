import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { PillButton } from '../../components/common/PillButton';
import { GradientBackground } from '../../components/common/GradientBackground';
import { useAuth } from '../../hooks/useAuth';
import { spacing, vibrant } from '../../constants/theme';

export function PendingApprovalScreen() {
  const { signOut, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

  return (
    <GradientBackground>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>Tu cuenta está pendiente de aprobación</Text>
      <Text style={styles.subtitle}>
        Un profesor tiene que revisar y aprobar tu cuenta antes de que puedas entrar. Te avisaremos por correo en
        cuanto esté lista.
      </Text>

      <PillButton
        label="Ya me aprobaron"
        onPress={handleRefresh}
        loading={checking}
        style={styles.refreshButton}
      />
      <Text style={styles.signOutLink} onPress={signOut}>
        Cerrar sesión
      </Text>
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
  refreshButton: {
    marginHorizontal: spacing.lg,
  },
  signOutLink: {
    textAlign: 'center',
    color: vibrant.textOnGradient,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
});
