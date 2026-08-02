import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { PillButton } from '../../components/common/PillButton';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useAuth } from '../../hooks/useAuth';
import { spacing, vibrant, colors } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Error al iniciar sesión', error);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>🎓 LinguaPro</Text>
          <Text style={styles.wave}>👋</Text>
          <Text style={styles.title}>¡Hola de nuevo!</Text>
          <Text style={styles.subtitle}>Inicia sesión para seguir practicando</Text>

          <GlassCard style={styles.card}>
            <Input
              placeholder="Correo electrónico"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <View style={styles.gap} />
            <Input placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />

            <PillButton label="Entrar" onPress={handleLogin} loading={loading} style={styles.primaryButton} />
            <Text style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
              Olvidé mi contraseña
            </Text>
          </GlassCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta?</Text>
            <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
              Regístrate
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
  brand: {
    fontSize: 15,
    fontWeight: '800',
    color: vibrant.textOnGradientMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
