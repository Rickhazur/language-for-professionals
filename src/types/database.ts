export type UserRole = 'student' | 'teacher';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type LanguageCode = 'en' | 'es';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type LearningObjective =
  | 'meetings'
  | 'emails'
  | 'negotiation'
  | 'presentations'
  | 'customer_service'
  | 'travel';

export interface StudentProfile {
  id: string;
  native_language: LanguageCode;
  target_language: LanguageCode;
  proficiency_level: CefrLevel;
  occupation: string | null;
  industry: string | null;
  learning_objectives: LearningObjective[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherProfile {
  id: string;
  bio: string | null;
  specialties: string[] | null;
  years_experience: number | null;
  languages_taught: LanguageCode[];
  created_at: string;
  updated_at: string;
}

export interface StudentTeacherAssignment {
  id: string;
  student_id: string;
  teacher_id: string;
  assigned_at: string;
}

export type Skill =
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'vocabulary'
  | 'grammar';

export interface Progress {
  id: string;
  student_id: string;
  language: LanguageCode;
  skill: Skill;
  level: CefrLevel;
  score: number;
  updated_at: string;
}

export type SessionType = 'self_practice' | 'live_class' | 'assessment' | 'shadowing';

export interface PracticeSession {
  id: string;
  student_id: string;
  teacher_id: string | null;
  language: LanguageCode;
  session_type: SessionType;
  duration_minutes: number | null;
  score: number | null;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
}

export type WordErrorType =
  | 'None'
  | 'Omission'
  | 'Insertion'
  | 'Mispronunciation'
  | 'UnexpectedBreak'
  | 'MissingBreak'
  | 'Monotone';

export interface ShadowingAttempt {
  id: string;
  session_id: string | null;
  student_id: string;
  language: LanguageCode;
  reference_text: string;
  recognized_text: string | null;
  accuracy_score: number | null;
  fluency_score: number | null;
  prosody_score: number | null;
  completeness_score: number | null;
  pron_score: number | null;
  created_at: string;
}

export interface ShadowingWordScore {
  id: string;
  attempt_id: string;
  order_index: number;
  word: string;
  accuracy_score: number | null;
  error_type: WordErrorType | null;
  created_at: string;
}

export interface ShadowingPhonemeScore {
  id: string;
  word_score_id: string;
  order_index: number;
  phoneme: string;
  accuracy_score: number | null;
  created_at: string;
}

export interface ShadowingWordWithPhonemes extends ShadowingWordScore {
  phonemes: ShadowingPhonemeScore[];
}

export type WeaknessType = 'phoneme';

export interface StudentWeakness {
  id: string;
  student_id: string;
  language: LanguageCode;
  weakness_type: WeaknessType;
  target: string;
  sample_count: number;
  average_score: number;
  is_active: boolean;
  first_detected_at: string;
  last_detected_at: string;
  resolved_at: string | null;
}

export interface StudentGamification {
  student_id: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

export type BadgeType = 'streak' | 'points' | 'phoneme_mastery' | 'vocabulary_mastery';

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_type: BadgeType;
  badge_key: string;
  title: string;
  description: string;
  icon: string;
  awarded_at: string;
}

export interface GamificationUpdate {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
}

export type RoleplayConversationStatus = 'active' | 'completed';

export interface RoleplayConversation {
  id: string;
  student_id: string;
  roleplay_id: string;
  language: LanguageCode;
  status: RoleplayConversationStatus;
  feedback: string | null;
  started_at: string;
  completed_at: string | null;
}

export type RoleplayMessageRole = 'assistant' | 'user';

export interface RoleplayMessage {
  id: string;
  conversation_id: string;
  role: RoleplayMessageRole;
  content: string;
  order_index: number;
  created_at: string;
}

export interface LevelAssessment {
  id: string;
  student_id: string;
  teacher_id: string | null;
  language: LanguageCode;
  overall_level: CefrLevel;
  listening_score: number | null;
  speaking_score: number | null;
  reading_score: number | null;
  writing_score: number | null;
  vocabulary_score: number | null;
  grammar_score: number | null;
  notes: string | null;
  taken_at: string;
}

export type CoursePlanStatus = 'active' | 'completed' | 'archived';

export interface CoursePlan {
  id: string;
  student_id: string;
  language: LanguageCode;
  level_at_generation: CefrLevel;
  status: CoursePlanStatus;
  title: string;
  summary: string | null;
  generated_by: string;
  generated_at: string;
  updated_at: string;
}

export type CoursePlanItemStatus = 'not_started' | 'in_progress' | 'completed';

export interface CoursePlanItem {
  id: string;
  course_plan_id: string;
  order_index: number;
  title: string;
  description: string | null;
  skill_focus: Skill | null;
  estimated_minutes: number | null;
  status: CoursePlanItemStatus;
  created_at: string;
}

export interface CoursePlanVocabularyTerm {
  id: string;
  course_plan_id: string;
  term: string;
  translation: string;
  example_sentence: string | null;
  created_at: string;
}

export interface StudentVocabularyProgress {
  id: string;
  student_id: string;
  vocabulary_id: string;
  box: number;
  correct_count: number;
  incorrect_count: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  created_at: string;
}

export interface CoursePlanRoleplay {
  id: string;
  course_plan_id: string;
  title: string;
  context: string;
  objective: string;
  related_objective: LearningObjective;
  difficulty: CefrLevel;
  created_at: string;
}

export interface TeacherNote {
  id: string;
  teacher_id: string;
  student_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}
