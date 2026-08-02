import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PillButton } from '../../components/common/PillButton';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { spacing, vibrant, colors } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type Role = 'student' | 'teacher';

export function RegisterScreen({ navigation }: Props) {
  const { signUp, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password);

    if (error) {
      setLoading(false);
      Alert.alert('Error al registrarse', error);
      return;
    }

    // El trigger handle_new_user() ya creó la fila base en "profiles".
    // Aquí asignamos el rol elegido y creamos su perfil específico.
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (userId) {
      await supabase.from('profiles').update({ role }).eq('id', userId);
      if (role === 'student') {
        await supabase.from('student_profiles').insert({ id: userId });
      } else {
        await supabase.from('teacher_profiles').insert({ id: userId });
      }
    }

    const { data: sessionData } = await supabase.auth.getSession();
    setLoading(false);

    if (sessionData.session) {
      // Ya hay sesión activa (confirmación de correo desactivada): refresca el
      // contexto para que RootNavigator mande al estudiante directo al onboarding.
      await refreshProfile();
      return;
    }

    Alert.alert('Cuenta creada', 'Revisa tu correo para confirmar tu cuenta.');
    navigation.navigate('Login');
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>🎓 LinguaPro</Text>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Empieza a practicar en minutos</Text>

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

            <Text style={styles.roleLabel}>Soy...</Text>
            <View style={styles.roleRow}>
              <Button
                label="Estudiante"
                variant={role === 'student' ? 'primary' : 'secondary'}
                onPress={() => setRole('student')}
                style={styles.roleButton}
              />
              <Button
                label="Profesor"
                variant={role === 'teacher' ? 'primary' : 'secondary'}
                onPress={() => setRole('teacher')}
                style={styles.roleButton}
              />
            </View>
          </GlassCard>

          <PillButton
            label="Registrarme"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
              Inicia sesión
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
  roleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
  },
  registerButton: {
    marginBottom: spacing.lg,
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
