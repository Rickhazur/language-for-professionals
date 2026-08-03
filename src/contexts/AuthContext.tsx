import React, { createContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { Profile, StudentProfile } from '../types/database';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  studentProfile: StudentProfile | null;
  profileLoading: boolean;
  hasLevelAssessment: boolean;
  hasCoursePlan: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasLevelAssessment, setHasLevelAssessment] = useState(false);
  const [hasCoursePlan, setHasCoursePlan] = useState(false);

  // Varias fuentes pueden llamar loadProfile casi al mismo tiempo (el listener
  // de onAuthStateChange y un refreshProfile() explícito). Este contador
  // descarta el resultado de una llamada vieja si ya se lanzó una más nueva,
  // para que la última en iniciar sea siempre la que gana.
  const latestRequestId = useRef(0);

  const loadProfile = useCallback(async (userId: string) => {
    const requestId = ++latestRequestId.current;
    setProfileLoading(true);

    const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', userId).single();

    let studentRow: StudentProfile | null = null;
    let levelAssessmentExists = false;
    let coursePlanExists = false;
    if (profileRow?.role === 'student') {
      const { data } = await supabase.from('student_profiles').select('*').eq('id', userId).single();
      studentRow = data ?? null;

      const { count: assessmentCount } = await supabase
        .from('level_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', userId);
      levelAssessmentExists = (assessmentCount ?? 0) > 0;

      const { count: planCount } = await supabase
        .from('course_plans')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', userId);
      coursePlanExists = (planCount ?? 0) > 0;
    }

    if (requestId !== latestRequestId.current) {
      return;
    }

    setProfile(profileRow ?? null);
    setStudentProfile(studentRow);
    setHasLevelAssessment(levelAssessmentExists);
    setHasCoursePlan(coursePlanExists);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) loadProfile(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setStudentProfile(null);
        setHasLevelAssessment(false);
        setHasCoursePlan(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = useCallback(async () => {
    // No usamos el "session" del closure: si refreshProfile se invoca desde una
    // función async ya en curso (como RegisterScreen.handleRegister), esa
    // función pudo haber capturado esta callback de un render viejo, cuando
    // session todavía era null (antes de signUp). Consultamos la sesión actual
    // directo para no depender de qué tan fresco esté el closure que la llama.
    const { data } = await supabase.auth.getSession();
    if (data.session) await loadProfile(data.session.user.id);
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        profile,
        studentProfile,
        profileLoading,
        hasLevelAssessment,
        hasCoursePlan,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
