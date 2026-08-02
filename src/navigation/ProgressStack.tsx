import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProgressStackParamList } from './types';
import { ProgressScreen } from '../screens/progress/ProgressScreen';
import { LessonScreen } from '../screens/progress/LessonScreen';
import { VocabularyBankScreen } from '../screens/progress/VocabularyBankScreen';
import { VocabularyReviewScreen } from '../screens/progress/VocabularyReviewScreen';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export function ProgressStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CourseOverview" component={ProgressScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
      <Stack.Screen name="VocabularyBank" component={VocabularyBankScreen} />
      <Stack.Screen name="VocabularyReview" component={VocabularyReviewScreen} />
    </Stack.Navigator>
  );
}
