import React, { useState } from 'react';
import { Text, View, StyleSheet, Alert } from 'react-native';
import { Input } from '../../components/common/Input';
import { PillButton } from '../../components/common/PillButton';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { spacing, vibrant } from '../../constants/theme';

export function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(t('resetPassword.alertMissingTitle'), t('resetPassword.alertMissingMessage'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('resetPassword.alertMissingTitle'), t('resetPassword.alertTooShortMessage'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('resetPassword.alertMissingTitle'), t('resetPassword.alertMismatchMessage'));
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    Alert.alert(t('resetPassword.alertSuccessTitle'), t('resetPassword.alertSuccessMessage'));
  };

  return (
    <GradientBackground>
      <Text style={styles.title}>{t('resetPassword.title')}</Text>
      <Text style={styles.subtitle}>{t('resetPassword.subtitle')}</Text>

      <GlassCard style={styles.card}>
        <Input
          placeholder={t('resetPassword.newPasswordPlaceholder')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={styles.gap} />
        <Input
          placeholder={t('resetPassword.confirmPasswordPlaceholder')}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <PillButton
          label={t('resetPassword.submitButton')}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </GlassCard>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: vibrant.textOnGradient,
    textAlign: 'center',
    marginTop: '30%',
  },
  subtitle: {
    fontSize: 15,
    color: vibrant.textOnGradientMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  card: {
    marginHorizontal: spacing.lg,
  },
  gap: {
    height: spacing.md,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
