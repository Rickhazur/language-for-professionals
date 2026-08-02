import {
  CoursePlanItem,
  LanguageCode,
  LevelAssessment,
  ShadowingAttempt,
  ShadowingWordWithPhonemes,
  StudentBadge,
} from '../types/database';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  LanguageSelection: undefined;
  ProfessionalProfile: { targetLanguage: LanguageCode; nativeLanguage: LanguageCode };
};

export type MainTabsParamList = {
  Home: undefined;
  Practice: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type ProgressStackParamList = {
  CourseOverview: undefined;
  Lesson: { item: CoursePlanItem; moduleNumber: number; totalModules: number };
  VocabularyBank: undefined;
  VocabularyReview: undefined;
};

export type PracticeStackParamList = {
  PracticeMenu: undefined;
  Shadowing: undefined;
  PronunciationFeedback: {
    attempt: ShadowingAttempt;
    words: ShadowingWordWithPhonemes[];
    newBadges?: StudentBadge[];
  };
  RoleplaySelect: undefined;
  RoleplayConversation: { roleplayId: string; title: string };
  RoleplayFeedback: { feedback: string; title: string };
};

export type AppStackParamList = {
  MainTabs: undefined;
  Assessment: undefined;
};

export type AssessmentStackParamList = {
  WrittenTest: undefined;
  OralAssessment: { grammarScore: number; vocabularyScore: number; writtenLevelIndex: number };
  Result: { assessment: LevelAssessment };
};
