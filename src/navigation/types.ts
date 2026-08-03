import {
  CoursePlanItem,
  LanguageCode,
  LearningObjective,
  LevelAssessment,
  ShadowingAttempt,
  ShadowingWordWithPhonemes,
  StudentBadge,
} from '../types/database';
import { RoleplayPhrase } from '../data/roleplayPhrases';

// Reutilizado por PracticeStack y ProgressStack: PronunciationFeedbackScreen
// se monta en ambos (práctica libre de shadowing y ejercicios de speaking
// dentro de una lección), así que su tipo de parámetros vive aparte en vez
// de estar atado a un solo ParamList.
export interface PronunciationFeedbackParams {
  attempt: ShadowingAttempt;
  words: ShadowingWordWithPhonemes[];
  newBadges?: StudentBadge[];
  // Solo lo provee ShadowingScreen: avanza a la siguiente frase en vez de
  // solo volver atrás. Si no viene (caso de lección dentro de ProgressStack),
  // la pantalla solo ofrece "volver".
  onNext?: () => void;
}

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
  LessonQuiz: { item: CoursePlanItem };
  LessonSpeaking: { item: CoursePlanItem };
  LessonWriting: { item: CoursePlanItem };
  LessonVocabulary: { item: CoursePlanItem };
  PronunciationFeedback: PronunciationFeedbackParams;
};

export type PracticeStackParamList = {
  PracticeMenu: undefined;
  Shadowing: undefined;
  PronunciationFeedback: PronunciationFeedbackParams;
  GrammarPractice: undefined;
  ListeningPractice: undefined;
  RoleplaySelect: undefined;
  RoleplayConversation: { roleplayId: string; title: string; relatedObjective: LearningObjective };
  RoleplayFeedback: {
    feedback: string;
    title: string;
    gamification?: { totalPoints: number; currentStreak: number; longestStreak: number } | null;
    newBadges?: StudentBadge[];
  };
  RoleplayPhraseBank: { relatedObjective: LearningObjective };
  RoleplayPhrasePractice: { phrase: RoleplayPhrase };
};

export type AppStackParamList = {
  MainTabs: undefined;
  Assessment: undefined;
  BookClass: undefined;
  EditProfile: undefined;
};

export type AssessmentStackParamList = {
  WrittenTest: undefined;
  Listening: { grammarScore: number; vocabularyScore: number; writtenLevelIndex: number };
  OralAssessment: {
    grammarScore: number;
    vocabularyScore: number;
    writtenLevelIndex: number;
    listeningScore: number;
  };
  Result: { assessment: LevelAssessment };
};
