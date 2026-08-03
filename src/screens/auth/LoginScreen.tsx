import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { PillButton } from '../../components/common/PillButton';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { LogoMark } from '../../components/common/LogoMark';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { spacing, vibrant, colors } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.missingDataTitle'), t('common.missingCredentialsMessage'));
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert(t('login.alertErrorTitle'), error);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <LogoMark size={22} />
            <Text style={styles.brand}>LinguaPro</Text>
          </View>
          <Text style={styles.wave}>👋</Text>
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

          <GlassCard style={styles.card}>
            <Input
              placeholder={t('common.emailPlaceholder')}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <View style={styles.gap} />
            <Input
              placeholder={t('common.passwordPlaceholder')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <PillButton
              label={t('login.submitButton')}
              onPress={handleLogin}
              loading={loading}
              style={styles.primaryButton}
            />
            <Text style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
              {t('login.forgotLink')}
            </Text>
          </GlassCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('login.noAccount')}</Text>
            <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
              {t('login.registerLink')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  brand: {
    fontSize: 15,
    fontWeight: '800',
    color: vibrant.textOnGradientMuted,
    letterSpacing: 0.5,
  },
  wave: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: vibrant.textOnGradient,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: vibrant.textOnGradientMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  gap: {
    height: spacing.md,
  },
  primaryButton: {
    marginTop: spacing.lg,
  },
  forgotLink: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  footerText: {
    color: vibrant.textOnGradientMuted,
  },
  link: {
    color: vibrant.textOnGradient,
    fontWeight: '700',
  },
});
