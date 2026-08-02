import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import { LanguageSelectionScreen } from '../screens/onboarding/LanguageSelectionScreen';
import { ProfessionalProfileScreen } from '../screens/onboarding/ProfessionalProfileScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
    </Stack.Navigator>
  );
}
