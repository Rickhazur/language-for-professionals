export type LanguageCode = 'en' | 'es';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'teacher';
  avatar_url: string | null;
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  native_language: LanguageCode;
  target_language: LanguageCode;
  proficiency_level: CefrLevel;
  occupation: string | null;
  industry: string | null;
  learning_objectives: string[];
}

export interface StudentWithProfile {
  student_id: string;
  profile: Profile;
  studentProfile: StudentProfile;
}

export interface StudentWeakness {
  id: string;
  student_id: string;
  language: LanguageCode;
  weakness_type: string;
  target: string;
  sample_count: number;
  average_score: number;
  is_active: boolean;
  first_detected_at: string;
  last_detected_at: string;
  resolved_at: string | null;
}

export interface ShadowingAttempt {
  id: string;
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

export interface PracticeSession {
  id: string;
  student_id: string;
  language: LanguageCode;
  session_type: 'self_practice' | 'live_class' | 'assessment' | 'shadowing';
  duration_minutes: number | null;
  score: number | null;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface StudentAiSummary {
  id: string;
  student_id: string;
  summary: string;
  generated_at: string;
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

export interface TeacherNote {
  id: string;
  teacher_id: string;
  student_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  total_sessions: number | null;
  weekly_session_limit: number | null;
  duration_weeks: number | null;
}

export interface StudentPlan {
  id: string;
  student_id: string;
  plan_id: string;
  started_at: string;
  is_active: boolean;
}
