import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProgressStackParamList } from './types';
import { ProgressScreen } from '../screens/progress/ProgressScreen';
import { LessonScreen } from '../screens/progress/LessonScreen';
import { VocabularyBankScreen } from '../screens/progress/VocabularyBankScreen';
import { VocabularyReviewScreen } from '../screens/progress/VocabularyReviewScreen';
import { LessonQuizScreen } from '../screens/progress/LessonQuizScreen';
import { LessonSpeakingScreen } from '../screens/progress/LessonSpeakingScreen';
import { LessonWritingScreen } from '../screens/progress/LessonWritingScreen';
import { LessonVocabularyScreen } from '../screens/progress/LessonVocabularyScreen';
import { PronunciationFeedbackScreen } from '../screens/practice/PronunciationFeedbackScreen';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export function ProgressStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CourseOverview" component={ProgressScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
      <Stack.Screen name="VocabularyBank" component={VocabularyBankScreen} />
      <Stack.Screen name="VocabularyReview" component={VocabularyReviewScreen} />
      <Stack.Screen name="LessonQuiz" component={LessonQuizScreen} />
      <Stack.Screen name="LessonSpeaking" component={LessonSpeakingScreen} />
      <Stack.Screen name="LessonWriting" component={LessonWritingScreen} />
      <Stack.Screen name="LessonVocabulary" component={LessonVocabularyScreen} />
      <Stack.Screen name="PronunciationFeedback" component={PronunciationFeedbackScreen} />
    </Stack.Navigator>
  );
}
