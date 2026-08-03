import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AssessmentStackParamList } from './types';
import { WrittenTestScreen } from '../screens/assessment/WrittenTestScreen';
import { ListeningAssessmentScreen } from '../screens/assessment/ListeningAssessmentScreen';
import { OralAssessmentScreen } from '../screens/assessment/OralAssessmentScreen';
import { AssessmentResultScreen } from '../screens/assessment/AssessmentResultScreen';

const Stack = createNativeStackNavigator<AssessmentStackParamList>();

export function AssessmentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="WrittenTest" component={WrittenTestScreen} />
      <Stack.Screen name="Listening" component={ListeningAssessmentScreen} />
      <Stack.Screen name="OralAssessment" component={OralAssessmentScreen} />
      <Stack.Screen name="Result" component={AssessmentResultScreen} />
    </Stack.Navigator>
  );
}
