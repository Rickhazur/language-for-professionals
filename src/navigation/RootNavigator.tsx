import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { AppStack } from './AppStack';
import { colors } from '../constants/theme';

export function RootNavigator() {
  const { session, loading, profile, studentProfile, profileLoading } = useAuth();

  if (loading || (session && profileLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
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

  return (
    <NavigationContainer>
      {needsOnboarding ? <OnboardingStack /> : <AppStack />}
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
