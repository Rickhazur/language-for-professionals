import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { PillButton } from '../../components/common/PillButton';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { supabase } from '../../config/supabase';
import { useLanguage } from '../../hooks/useLanguage';
import { spacing, vibrant } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert(t('forgotPassword.alertMissingTitle'), t('forgotPassword.alertMissingMessage'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Alert.alert(t('forgotPassword.alertSentTitle'), t('forgotPassword.alertSentMessage'));
    navigation.goBack();
  };

  return (
    <GradientBackground>
      <Text style={styles.title}>{t('forgotPassword.title')}</Text>
      <Text style={styles.subtitle}>{t('forgotPassword.subtitle')}</Text>

      <GlassCard style={styles.card}>
        <Input
          placeholder={t('common.emailPlaceholder')}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <PillButton label={t('forgotPassword.sendButton')} onPress={handleReset} loading={loading} style={styles.sendButton} />
      </GlassCard>

      <Text style={styles.backLink} onPress={() => navigation.goBack()}>
        {t('forgotPassword.backLink')}
      </Text>
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
  sendButton: {
    marginTop: spacing.md,
  },
  backLink: {
    textAlign: 'center',
    color: vibrant.textOnGradient,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
});
