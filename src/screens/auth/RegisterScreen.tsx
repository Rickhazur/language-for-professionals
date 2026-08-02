import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { colors, spacing } from '../../constants/theme';

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Crear cuenta</Text>

      <View style={styles.form}>
        <Input
          placeholder="Correo electrónico"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.roleRow}>
          <Button
            label="Soy estudiante"
            variant={role === 'student' ? 'primary' : 'secondary'}
            onPress={() => setRole('student')}
            style={styles.roleButton}
          />
          <Button
            label="Soy profesor"
            variant={role === 'teacher' ? 'primary' : 'secondary'}
            onPress={() => setRole('teacher')}
            style={styles.roleButton}
          />
        </View>

        <Button label="Registrarme" onPress={handleRegister} loading={loading} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
          Inicia sesión
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    color: colors.textMuted,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
