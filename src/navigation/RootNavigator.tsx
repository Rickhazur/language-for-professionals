import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { AssessmentStack } from './AssessmentStack';
import { AppStack } from './AppStack';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { colors } from '../constants/theme';

export function RootNavigator() {
  const {
    session,
    loading,
    profile,
    studentProfile,
    profileLoading,
    hasLevelAssessment,
    hasCoursePlan,
    passwordRecovery,
  } = useAuth();
  const { syncFromNativeLanguage } = useLanguage();

  // El idioma de la interfaz sigue al idioma nativo del estudiante una vez
  // que su perfil carga — salvo que ya haya elegido uno a mano (ver
  // LanguageContext.syncFromNativeLanguage).
  useEffect(() => {
    if (studentProfile?.native_language) {
      syncFromNativeLanguage(studentProfile.native_language);
    }
  }, [studentProfile?.native_language, syncFromNativeLanguage]);

  if (loading || (session && profileLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // El enlace de "olvidé mi contraseña" deja al usuario con una sesión de
  // recuperación temporal (Supabase la trata como sesión activa). Sin este
  // chequeo, los pasos de abajo lo mandarían directo a su cuenta ya
  // autenticada en vez de dejarlo definir la contraseña nueva primero.
  if (passwordRecovery) {
    return (
      <NavigationContainer>
        <ResetPasswordScreen />
      </NavigationContainer>
    );
  }

  if (!session) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  const needsOnboarding =
    profile?.role === 'student' && studentProfile !== null && !studentProfile.onboarding_completed;

  // Un estudiante recién registrado ve el examen de nivel de inmediato,
  // antes que la aprobación del profesor — así vive la experiencia gratis
  // (examen + plan de curso personalizado) sin esperar a nadie. Solo aplica
  // a quien de verdad es nuevo: si ya tiene un plan de curso (llegó hasta
  // aquí bajo el flujo anterior), no lo mandamos de vuelta al examen aunque
  // no tenga un level_assessments guardado.
  const needsAssessment =
    profile?.role === 'student' && !needsOnboarding && !hasLevelAssessment && !hasCoursePlan;

  if (needsOnboarding) {
    return (
      <NavigationContainer>
        <OnboardingStack />
      </NavigationContainer>
    );
  }

  if (needsAssessment) {
    return (
      <NavigationContainer>
        <AssessmentStack />
      </NavigationContainer>
    );
  }

  if (profile && !profile.is_approved) {
    return (
      <NavigationContainer>
        <PendingApprovalScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
