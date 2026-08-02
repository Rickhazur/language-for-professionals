import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PracticeStackParamList } from './types';
import { PracticeScreen } from '../screens/practice/PracticeScreen';
import { ShadowingScreen } from '../screens/practice/ShadowingScreen';
import { PronunciationFeedbackScreen } from '../screens/practice/PronunciationFeedbackScreen';
import { RoleplaySelectScreen } from '../screens/practice/RoleplaySelectScreen';
import { RoleplayConversationScreen } from '../screens/practice/RoleplayConversationScreen';
import { RoleplayFeedbackScreen } from '../screens/practice/RoleplayFeedbackScreen';
import { RoleplayPhraseBankScreen } from '../screens/practice/RoleplayPhraseBankScreen';
import { RoleplayPhrasePracticeScreen } from '../screens/practice/RoleplayPhrasePracticeScreen';

const Stack = createNativeStackNavigator<PracticeStackParamList>();

export function PracticeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PracticeMenu" component={PracticeScreen} />
      <Stack.Screen name="Shadowing" component={ShadowingScreen} />
      <Stack.Screen name="PronunciationFeedback" component={PronunciationFeedbackScreen} />
      <Stack.Screen name="RoleplaySelect" component={RoleplaySelectScreen} />
      <Stack.Screen name="RoleplayConversation" component={RoleplayConversationScreen} />
      <Stack.Screen name="RoleplayFeedback" component={RoleplayFeedbackScreen} />
      <Stack.Screen name="RoleplayPhraseBank" component={RoleplayPhraseBankScreen} />
      <Stack.Screen name="RoleplayPhrasePractice" component={RoleplayPhrasePracticeScreen} />
    </Stack.Navigator>
  );
}
