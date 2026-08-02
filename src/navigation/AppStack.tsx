import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { AssessmentStack } from './AssessmentStack';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Assessment" component={AssessmentStack} options={{ presentation: 'fullScreenModal' }} />
    </Stack.Navigator>
  );
}
