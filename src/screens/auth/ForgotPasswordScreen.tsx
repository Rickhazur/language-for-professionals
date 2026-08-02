import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { PillButton } from '../../components/common/PillButton';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { supabase } from '../../config/supabase';
import { spacing, vibrant } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Falta el correo', 'Ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Alert.alert('Correo enviado', 'Revisa tu bandeja para restablecer tu contraseña.');
    navigation.goBack();
  };

  return (
    <GradientBackground>
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>Te enviaremos un enlace a tu correo</Text>

      <GlassCard style={styles.card}>
        <Input
          placeholder="Correo electrónico"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <PillButton label="Enviar enlace" onPress={handleReset} loading={loading} style={styles.sendButton} />
      </GlassCard>

      <Text style={styles.backLink} onPress={() => navigation.goBack()}>
        ← Volver
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
